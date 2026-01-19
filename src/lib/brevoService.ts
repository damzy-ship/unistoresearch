import { supabase } from './supabase';

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface BrevoRecipient {
    email: string;
    name?: string;
}

interface BrevoPayload {
    sender: { name: string; email: string };
    to: BrevoRecipient[];
    bcc?: BrevoRecipient[];
    subject: string;
    htmlContent: string;
}


export async function sendMassVendorNotification(requestData: {
    university: string;
    request_text: string;
}) {
    if (!BREVO_API_KEY) {
        console.warn('VITE_BREVO_API_KEY not found. Notifications will be skipped.');
        return;
    }

    try {
        // 1. Fetch active vendors belonging to the specific university
        const { data: vendors, error: vendorError } = await supabase
            .from('merchants')
            .select('email, full_name')
            .eq('is_billing_active', true)
            .eq('school_name', requestData.university);

        if (vendorError) throw vendorError;

        // 2. Fetch all administrators
        const { data: admins, error: adminError } = await supabase
            .from('unique_visitors')
            .select('email, full_name')
            .eq('is_admin', true);

        if (adminError) throw adminError;

        // 3. Combine and deduplicate recipients
        const uniqueRecipients = new Map<string, string>();

        // Add university vendors
        vendors?.forEach(v => {
            if (v.email && !v.email.includes('@phone.unistore.local')) {
                uniqueRecipients.set(v.email.toLowerCase(), v.full_name || 'Vendor');
            }
        });

        // Add admins (admins see everything)
        admins?.forEach(a => {
            if (a.email && !a.email.includes('@phone.unistore.local')) {
                uniqueRecipients.set(a.email.toLowerCase(), a.full_name || 'Admin');
            }
        });

        const recipients: BrevoRecipient[] = Array.from(uniqueRecipients.entries()).map(([email, name]) => ({
            email,
            name
        }));

        if (recipients.length === 0) {
            console.log('No recipients found for this notification.');
            return;
        }

        const subject = `New Product Request from ${requestData.university}`;
        const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #3b82f6;">New Request Alert! 🚀</h2>
        <p>A student at <strong>${requestData.university} University</strong> is looking for something:</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <em style="font-size: 1.1em; color: #1e293b;">"${requestData.request_text}"</em>
        </div>
        <p>Log in to your dashboard to see more details and contact the buyer.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://search.unistore.ng" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Request</a>
        </div>
      </div>
    `;

        const BATCH_SIZE = 100; // Optimal batch size for BCC
        const batches: BrevoRecipient[][] = [];
        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            batches.push(recipients.slice(i, i + BATCH_SIZE));
        }

        console.log(`Firing ${batches.length} parallel notification batches...`);

        // Fire all batches concurrently
        await Promise.all(
            batches.map(async (batch) => {
                const payload: BrevoPayload = {
                    sender: { name: 'Unistore Notifications', email: 'notifications@unistore.ng' },
                    to: [batch[0]], // Primary recipient
                    bcc: batch.slice(1), // Blind copy to minimize costs/limit leakage
                    subject,
                    htmlContent,
                };

                const response = await fetch(BREVO_API_URL, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': BREVO_API_KEY,
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Brevo API Error:', errorData);
                }
            })
        );

        console.log('Mass notification completed successfully.');

    } catch (err) {
        console.error('Failed to send mass notifications:', err);
    }
}
