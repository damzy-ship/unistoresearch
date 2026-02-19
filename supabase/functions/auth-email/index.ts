/// <reference aria-label="deno-types" value="https://deno.land/std@0.168.0/http/server.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const BREVO_API_KEY = Deno.env.get('VITE_BREVO_API_KEY')
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

serve(async (req: Request) => {
    try {
        const { record, type } = await req.json()

        // This function is intended to be triggered by a Supabase Auth Hook or Webhook.
        // For 'PASSWORD_RECOVERY', we generate a custom email.

        console.log(`Auth event: ${type} for user: ${record?.email}`)

        // If you are using this as a Webhook, you can filter by type
        if (type === 'PASSWORD_RECOVERY' || (record && !record.last_sign_in_at)) {
            // Logic to send custom email via Brevo...
            // Note: In a real production Edge Function, you'd call the Brevo API here.
        }

        return new Response(JSON.stringify({ message: "Notification handled" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
