# Deployment Guide: Custom Auth Emails

To get your new premium emails working in production, follow these steps:

## 1. Set your Secret
You need to let Supabase know your Brevo API key so it can send the emails.
Run this in your terminal:
```bash
supabase secrets set VITE_BREVO_API_KEY=your_actual_brevo_key_here
```

## 2. Deploy the Function
Push your code to the Supabase cloud:
```bash
supabase functions deploy auth-email
```

## 3. Enable the Webhook
In your **Supabase Dashboard**:
1. Go to **Database** -> **Webhooks**.
2. Create a new Webhook.
3. Name it `send-auth-email`.
4. Table: `auth.users`.
5. Events: `INSERT` (for welcome) or `UPDATE` (for password resets).
6. Type: `HTTP Request` -> `Supabase Edge Function`.
7. Select your `auth-email` function.

## 4. Update Supabase Email Template (Optional but Recommended)
If you'd rather use the **pure HTML** version without a developer function:
1. Copy the code from [forgot_password_email_template.html](file:///Users/eric/.gemini/antigravity/brain/1c47e54b-60a0-43e1-92f2-02ab9fb5b46f/forgot_password_email_template.html).
2. Go to **Authentication** -> **Email Templates** -> **Reset Password**.
3. Paste the code into the **Message Body** section.
