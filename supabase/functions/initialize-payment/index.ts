import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PaymentInitRequest {
  merchant_id: string;
  billing_plan_id?: string;
  amount?: number; // Optional override amount
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("Supabase client initialized");

    const { merchant_id, billing_plan_id, amount: customAmount }: PaymentInitRequest = await req.json()

    console.log("Request payload:", { merchant_id, billing_plan_id, customAmount });

    if (!merchant_id) {
      return new Response(
        JSON.stringify({ error: 'Merchant ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if Paystack secret key is available
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get merchant information
    const { data: merchant, error: merchantError } = await supabaseClient
      .from('merchants')
      .select('id, full_name, email, billing_plan_id, billing_status')
      .eq('id', merchant_id)
      .single()

    console.log("Merchant lookup result:", { merchant, merchantError });

    if (merchantError || !merchant) {
      console.error('Merchant lookup error:', merchantError)
      return new Response(
        JSON.stringify({ error: 'Merchant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get billing plan information
    const planId = billing_plan_id || merchant.billing_plan_id
    let amount = customAmount
    let billingCycle = 'monthly'; // Default billing cycle

    if (!amount && planId) {
      const { data: billingPlan, error: planError } = await supabaseClient
        .from('billing_plans')
        .select('amount, billing_cycle')
        .eq('id', planId)
        .single()

      console.log("Billing plan lookup:", { billingPlan, planError });

      if (!planError && billingPlan) {
        amount = billingPlan.amount
        billingCycle = billingPlan.billing_cycle
      }
    }

    // Default amount if no plan is specified (₦5,000 in kobo)
    if (!amount) {
      amount = 100000 // 1000 naira in kobo
    }

    // Generate payment reference
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const reference = `UNISTORE_${merchant_id.substring(0, 8)}_${timestamp}_${random}`.toUpperCase()

    // Calculate billing period (1 month from now)
    const billingPeriodStart = new Date().toISOString().split('T')[0]
    const billingPeriodEnd = new Date()
    
    // Set billing period based on billing cycle
    switch (billingCycle) {
      case 'monthly':
        billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);
        break;
      case 'quarterly':
        billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 3);
        break;
      case 'yearly':
        billingPeriodEnd.setFullYear(billingPeriodEnd.getFullYear() + 1);
        break;
      default:
        billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);
    }
    
    const billingPeriodEndStr = billingPeriodEnd.toISOString().split('T')[0]

    console.log("Billing period:", { start: billingPeriodStart, end: billingPeriodEndStr });

    // Create billing transaction record
    const { error: transactionError } = await supabaseClient
      .from('billing_transactions')
      .insert({
        merchant_id,
        paystack_reference: reference,
        amount,
        status: 'pending',
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEndStr,
        metadata: {
          merchant_name: merchant.full_name,
          billing_plan_id: planId,
        }
      })

    console.log("Transaction creation result:", { error: transactionError });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get site URL for callback
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL') || 'http://localhost:5173'
    
    console.log("Site URL for callback:", siteUrl);
    
    // Prepare Paystack payload
    const paystackPayload = {
      email: merchant.email,
      amount,
      reference,
      currency: 'NGN',
      callback_url: `${siteUrl}/billing/callback`,
      metadata: {
        merchant_id,
        merchant_name: merchant.full_name,
        billing_plan_id: planId,
      },
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
    }

    console.log('Initializing Paystack payment with payload:', JSON.stringify({
      ...paystackPayload,
      email: merchant.email ? `${merchant.email.substring(0, 3)}...` : 'undefined', // Mask email for logs
    }, null, 2));

    // Initialize Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    })

    const paystackData = await paystackResponse.json()

    console.log('Paystack response status:', paystackResponse.status)
    console.log('Paystack response data:', JSON.stringify(paystackData, null, 2))

    // Check if the response is valid
    if (!paystackResponse.ok || !paystackData) {
      const errorMessage = paystackData?.message || `HTTP error! status: ${paystackResponse.status}`;
      console.error('Paystack API error:', errorMessage);
      
      return new Response(
        JSON.stringify({ 
          error: `Payment initialization failed: ${errorMessage}`,
          details: paystackData || { status: paystackResponse.status }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!paystackResponse.ok) {
      console.error('Paystack API error - Status:', paystackResponse.status)
      console.error('Paystack API error - Response:', paystackData)
      
      // Return more specific error information
      const errorMessage = paystackData.message || 'Paystack API request failed'
      return new Response(
        JSON.stringify({ 
          error: `Payment initialization failed: ${errorMessage}`,
          details: paystackData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!paystackData.status) {
      console.error('Paystack returned unsuccessful status:', paystackData)
      return new Response(
        JSON.stringify({ 
          error: `Payment service error: ${paystackData.message || 'Unknown error'}`,
          details: paystackData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify that we have the required data
    if (!paystackData.data || !paystackData.data.authorization_url) {
      console.error('Paystack response missing required data:', paystackData)
      return new Response(
        JSON.stringify({ 
          error: 'Payment initialization incomplete - missing authorization URL',
          details: paystackData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Payment initialization successful for reference:', reference)

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference: paystackData.data.reference,
          amount: amount / 100, // Convert to naira for display
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in initialize-payment function:', error)
    console.error('Error stack:', error?.stack || 'No stack trace available')
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})