import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    )

    // Get the raw body for signature verification
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify webhook signature
    const crypto = await import('node:crypto')
    const hash = crypto.createHmac('sha512', Deno.env.get('PAYSTACK_WEBHOOK_SECRET') || '')
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const event = JSON.parse(body)

    // Handle different event types
    if (event.event === 'charge.success') {
      await handleSuccessfulPayment(supabaseClient, event.data)
    } else if (event.event === 'charge.failed') {
      await handleFailedPayment(supabaseClient, event.data)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in payment webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleSuccessfulPayment(supabaseClient: any, paymentData: any) {
  try {
    const reference = paymentData.reference
    const merchantId = paymentData.metadata?.merchant_id

    if (!reference || !merchantId) {
      console.error('Missing reference or merchant_id in payment data')
      return
    }

    // Update billing transaction
    const { error: transactionError } = await supabaseClient
      .from('billing_transactions')
      .update({
        status: 'success',
        payment_date: paymentData.paid_at,
        metadata: paymentData,
        updated_at: new Date().toISOString(),
      })
      .eq('paystack_reference', reference)

    if (transactionError) {
      console.error('Error updating transaction:', transactionError)
      return
    }

    // Get the billing transaction to determine the new billing period
    const { data: transaction } = await supabaseClient
      .from('billing_transactions')
      .select('billing_period_end')
      .eq('paystack_reference', reference)
      .single()

    if (transaction) {
      // Update merchant billing status and next billing date
      const { error: merchantError } = await supabaseClient
        .from('merchants')
        .update({
          billing_status: 'active',
          next_billing_date: transaction.billing_period_end,
          billing_date: transaction.billing_period_end, // Update existing billing_date field
        })
        .eq('id', merchantId)

      if (merchantError) {
        console.error('Error updating merchant billing status:', merchantError)
      } else {
        console.log(`Successfully updated billing for merchant ${merchantId}`)
      }
    }

  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

async function handleFailedPayment(supabaseClient: any, paymentData: any) {
  try {
    const reference = paymentData.reference

    if (!reference) {
      console.error('Missing reference in failed payment data')
      return
    }

    // Update billing transaction
    const { error: transactionError } = await supabaseClient
      .from('billing_transactions')
      .update({
        status: 'failed',
        metadata: paymentData,
        updated_at: new Date().toISOString(),
      })
      .eq('paystack_reference', reference)

    if (transactionError) {
      console.error('Error updating failed transaction:', transactionError)
    } else {
      console.log(`Updated failed payment for reference ${reference}`)
    }

  } catch (error) {
    console.error('Error handling failed payment:', error)
  }
}