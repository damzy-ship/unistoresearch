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
        const htmlContent = `
      <!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            padding: 20px;
        }

        .card {
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
        }

        .header {
            padding: 20px 24px;
            text-align: left;
            /* background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); */
        }

        .logo-text {
            font-size: 28px;
            font-weight: 800;
            margin: 0;
        }

        .uni {
            color: #f97316;
        }

        .store {
            color: #2563eb;
        }

        .dot {
            color: #2563eb;
        }

        .content {
            padding: 32px 24px;
        }

        .badge {
            display: inline-block;
            padding: 6px 12px;
            background-color: #eff6ff;
            color: #2563eb;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 16px;
        }

        .title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 12px 0;
        }

        .description {
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
            margin: 0 0 24px 0;
        }

        .request-box {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 32px;
        }

        .request-text {
            font-size: 18px;
            font-style: italic;
            color: #1e293b;
            margin: 0;
        }

        .cta-container {
            text-align: center;
        }

        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
        }

        .footer {
            padding: 24px;
            text-align: center;
            font-size: 14px;
            color: #9ca3af;
        }
    </style>
</head>

<body>
    <div class="email-container">
        <div class="card">
            <div class="header">
                <h1 class="logo-text">
                    <span class="uni">uni</span><span class="store">store</span><span class="dot">.</span>
                </h1>
            </div>
            <div class="content">
                <h2 class="title">New Request Alert! 🚀</h2>
                <p class="description">
                    A student at <strong>${requestData.university}</strong> is looking for something:
                </p>

                <div class="request-box">
                    <p class="request-text">"${requestData.request_text}"</p>
                </div>

                <p class="description">
                    Log into your dashboard to see more details and contact the buyer.
                </p>

                <div class="cta-container">
                    <a href="https://search.unistore.ng" class="button">View Request</a>
                </div>
            </div>
        </div>
    </div>
</body>

</html>
    `;

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
                    htmlContent,
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
