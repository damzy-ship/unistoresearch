import { supabase } from './supabase';
import { getBaseEmailTemplate } from './emailTemplates';

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
        const { data: vendors, error: vendorError } = await supabase
            .from('unique_visitors')
            .select(`
                email, 
                full_name, 
                schools (
                    name,
                    short_name
                )
            `)
            .eq('user_type', 'merchant')
            .not('email', 'is', null);

        if (vendorError) throw vendorError;

        console.log(`[Brevo] Total real vendors with emails in unique_visitors: ${vendors?.length || 0}`);

        const matchingVendors = vendors?.filter(v => {
            const schoolName = (v as any).schools?.name || '';
            const schoolShort = (v as any).schools?.short_name || '';

            const match = schoolName.toLowerCase().includes(requestData.university.toLowerCase()) ||
                schoolShort.toLowerCase().includes(requestData.university.toLowerCase()) ||
                requestData.university.toLowerCase().includes(schoolShort.toLowerCase());

            return match;
        }) || [];

        console.log(`[Brevo] Vendors matched for ${requestData.university}: ${matchingVendors.length}`);

        const { data: admins, error: adminError } = await supabase
            .from('unique_visitors')
            .select('email, full_name')
            .eq('is_admin', true);

        if (adminError) throw adminError;

        const uniqueRecipients = new Map<string, string>();

        // Include all matched vendors regardless of billing status
        matchingVendors.forEach((v: any) => {
            if (v.email && !v.email.includes('@phone.unistore.local')) {
                uniqueRecipients.set(v.email.toLowerCase(), v.full_name || 'Vendor');
            }
        });

        admins?.forEach(a => {
            if (a.email && !a.email.includes('@phone.unistore.local')) {
                uniqueRecipients.set(a.email.toLowerCase(), a.full_name || 'Admin');
            }
        });

        uniqueRecipients.set('alfrederic371@gmail.com', 'System Monitor');

        const recipients: BrevoRecipient[] = Array.from(uniqueRecipients.entries()).map(([email, name]) => ({
            email,
            name
        }));

        console.log(`[Brevo] Final recipient count: ${recipients.length}`);

        if (recipients.length === 0) {
            console.log('No recipients found for this notification.');
            return;
        }

        const subject = `New Product Request: ${requestData.university}`;
        const getNotificationHtml = (requestData: { university: string; request_text: string }) => getBaseEmailTemplate(`
    <div style="display: inline-flex; width: 80px; height: 80px; background-color: #f0f7ff; border-radius: 24px; margin-bottom: 32px; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">🚀</span>
    </div>
    
    <h2 style="font-size: 28px; font-weight: 800; color: #1a2a40; margin: 0 0 16px 0; letter-spacing: -0.02em;">New Request Alert!</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #64748b; margin: 0 0 24px 0;">
        A student at <strong>${requestData.university}</strong> is looking for something:
    </p>

    <div style="background-color: #f8fafc; border-radius: 20px; padding: 24px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
        <p style="font-size: 18px; font-style: italic; color: #1e293b; margin: 0; line-height: 1.5;">"${requestData.request_text}"</p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #64748b; margin: 0 0 40px 0;">
        Log into your dashboard to see more details and contact the buyer.
    </p>

    <div style="margin-bottom: 20px;">
        <a href="https://search.unistore.ng" style="display: inline-block; padding: 18px 48px; background-color: #0c6eed; color: #ffffff !important; text-decoration: none; border-radius: 20px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 20px -5px rgba(12, 110, 237, 0.3);">View Request</a>
    </div>
`);

        const BATCH_SIZE = 100;
        const batches: BrevoRecipient[][] = [];
        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            batches.push(recipients.slice(i, i + BATCH_SIZE));
        }

        console.log(`Firing ${batches.length} parallel notification batches...`);

        await Promise.all(
            batches.map(async (batch) => {
                const payload: BrevoPayload = {
                    sender: { name: 'Unistore Notifications', email: 'alfrederic371@gmail.com' },
                    to: [batch[0]],
                    bcc: batch.slice(1),
                    subject,
                    htmlContent: getNotificationHtml(requestData),
                };

                console.log(`[Brevo] Firing batch of ${batch.length} recipients...`);

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
                    console.error('[Brevo] API Error:', errorData);
                } else {
                    const successData = await response.json();
                    console.log(`[Brevo] Batch sent successfully. Response:`, successData);
                }
            })
        );

        console.log('[Brevo] All notifications processed.');

    } catch (err) {
        console.error('Failed to send mass notifications:', err);
    }
}

export async function sendForgotPasswordEmail(email: string, resetLink: string) {
    if (!BREVO_API_KEY) return;

    const htmlContent = getBaseEmailTemplate(`
        <div style="display: inline-flex; width: 80px; height: 80px; background-color: #fffaf7; border-radius: 24px; margin-bottom: 32px; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">🔑</span>
        </div>
        
        <h2 style="font-size: 28px; font-weight: 800; color: #1a2a40; margin: 0 0 16px 0; letter-spacing: -0.02em;">Reset Your Password</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #64748b; margin: 0 0 40px 0;">
            Forgot your password? No worries! Click the button below to safely create a new one and get back to UniStore.
        </p>

        <div style="margin-bottom: 40px;">
            <a href="${resetLink}" style="display: inline-block; padding: 18px 48px; background-color: #f97316; color: #ffffff !important; text-decoration: none; border-radius: 20px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 20px -5px rgba(249, 115, 22, 0.3);">Reset Password</a>
        </div>

        <p style="font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5;">
            This link will expire in 60 minutes. <br>
            If you didn't request this email, you can safely ignore it.
        </p>
    `);

    try {
        await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: { name: 'UniStore', email: 'alfrederic371@gmail.com' },
                to: [{ email }],
                subject: 'Reset Your Password - UniStore',
                htmlContent
            }),
        });
    } catch (err) {
        console.error('Failed to send forgot password email:', err);
    }
}

export async function sendSellerOfWeekEmail(merchantData: {
    email: string;
    full_name: string;
    school_name: string;
}) {
    if (!BREVO_API_KEY) {
        console.warn('VITE_BREVO_API_KEY not found. SOTW notification skipped.');
        return;
    }

    const htmlContent = getBaseEmailTemplate(`
        <div style="display: inline-flex; width: 80px; height: 80px; background-color: #ecfdf5; border-radius: 24px; margin-bottom: 32px; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">🌟</span>
        </div>
        
        <h2 style="font-size: 28px; font-weight: 800; color: #065f46; margin: 0 0 16px 0; letter-spacing: -0.02em;">Seller of the Week!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #64748b; margin: 0 0 24px 0;">
            Congratulations, <strong>${merchantData.full_name}</strong>! You've been selected as the <strong>Seller of the Week</strong> at <strong>${merchantData.school_name}</strong>.
        </p>

        <div style="background-color: #f0fdf4; border-radius: 20px; padding: 24px; margin-bottom: 32px; border: 1px solid #dcfce7; text-align: center;">
            <p style="font-size: 18px; color: #166534; margin: 0; font-weight: 800;">High visibility coming your way!</p>
            <p style="font-size: 14px; color: #15803d; margin: 8px 0 0 0;">Your products are now featured on the university's main banner slider.</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; color: #64748b; margin: 0 0 40px 0;">
            Keep up the great work and make sure your inventory is updated to make the most of this highlight!
        </p>

        <div style="margin-bottom: 20px;">
            <a href="https://search.unistore.ng/profile" style="display: inline-block; padding: 18px 48px; background-color: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 20px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.3);">Check My Profile</a>
        </div>
    `);

    try {
        await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: { name: 'UniStore Highlights', email: 'alfrederic371@gmail.com' },
                to: [{ email: merchantData.email, name: merchantData.full_name }],
                subject: `🌟 You are the Seller of the Week at ${merchantData.school_name}!`,
                htmlContent
            }),
        });
        console.log(`[Brevo] SOTW notification sent to ${merchantData.email}`);
    } catch (err) {
        console.error('Failed to send SOTW notification:', err);
    }
}
