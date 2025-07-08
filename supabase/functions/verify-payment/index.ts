import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get reference from URL
    const url = new URL(req.url)
    const reference = url.searchParams.get('reference')
    
    console.log("Verifying payment for reference:", reference);

    if (!reference) {
      return new Response(
        JSON.stringify({ error: 'Reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log("Supabase client initialized");

    // Verify payment with Paystack
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    })

    const paystackData = await paystackResponse.json()
    console.log("Paystack verification response:", paystackData);

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack verification failed:', paystackData)
      return new Response(
        JSON.stringify({ error: 'Failed to verify payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get transaction data
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('billing_transactions')
      .select('merchant_id, billing_period_end')
      .eq('paystack_reference', reference)
      .single()

    console.log("Transaction lookup result:", { transaction, transactionError });

    if (transactionError || !transaction) {
      console.error('Transaction not found:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update transaction status
    if (paystackData.data.status === 'success') {
      // Update transaction
      const { error: updateError } = await supabaseClient
        .from('billing_transactions')
        .update({
          status: 'success',
          payment_date: paystackData.data.paid_at,
          metadata: paystackData.data,
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_reference', reference)

      console.log("Transaction update result:", { error: updateError });

      if (updateError) {
        console.error('Error updating transaction:', updateError)
      }

      // Update merchant billing status
      const { error: merchantError } = await supabaseClient
        .from('merchants')
        .update({
          billing_status: 'active',
          next_billing_date: transaction.billing_period_end,
          billing_date: transaction.billing_period_end, // Update existing billing_date field
        })
        .eq('id', transaction.merchant_id)

      console.log("Merchant update result:", { error: merchantError });

      if (merchantError) {
        console.error('Error updating merchant billing status:', merchantError)
      }
    } else {
      // Update transaction for failed payment
      const { error: updateError } = await supabaseClient
        .from('billing_transactions')
        .update({
          status: 'failed',
          metadata: paystackData.data,
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_reference', reference)

      console.log("Failed transaction update result:", { error: updateError });

      if (updateError) {
        console.error('Error updating transaction for failed payment:', updateError)
      }
    }

    // Get callback URL if exists
    const { data: callbackData } = await supabaseClient
      .from('billing_callbacks')
      .select('callback_url')
      .eq('paystack_reference', reference)
      .single()

    console.log("Callback URL lookup result:", { callbackData });

    // Return verification result
    return new Response(
      JSON.stringify({
        success: true,
        status: paystackData.data.status,
        message: paystackData.data.gateway_response,
        callback_url: callbackData?.callback_url || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in verify-payment function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})