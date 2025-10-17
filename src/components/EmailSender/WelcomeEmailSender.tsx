import React, { useState, useCallback } from 'react';
import { sendPicaEmail } from '../../lib/emailService';
// Import the email service function from the file created above

// --- HTML Email Template ---
const WELCOME_EMAIL_SUBJECT = "Welcome to UniStore! Your Account Awaits!";

/**
 * Generates the HTML body for the UniStore welcome email.
 * @param recipientEmail The email address to customize the message slightly.
 * @returns The HTML string for the email body.
 */
const createWelcomeEmailBody = (recipientEmail: string): string => {
    // In a real application, use a proper templating engine or a robust email framework.
    return `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                    .header { background-color: #007bff; color: white; padding: 10px 0; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { padding: 20px; text-align: center; }
                    .button { background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
                    .footer { margin-top: 20px; font-size: 0.8em; color: #777; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>UniStore</h1>
                    </div>
                    <div class="content">
                        <h2>Welcome to UniStore!</h2>
                        <p>We're thrilled to have you join our community. You're all set with the email: <strong>${recipientEmail}</strong>.</p>
                        <p>Click the link below to start shopping for the best deals!</p>
                        <a href="https://unistore.com/shop" class="button" target="_blank">Start Shopping Now!</a>
                        <p style="margin-top: 30px;">Happy Shopping!</p>
                        <p>The UniStore Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} UniStore. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
    `;
};

// --- React Component ---

const DEFAULT_SENDER_EMAIL = 'no-reply@unistore.com'; // Optional 'from' address for Pica

/**
 * A component to send a 'Welcome to UniStore' email using the Pica email service.
 */
export const WelcomeEmailSender: React.FC = () => {
    const [recipient, setRecipient] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');

    const handleSendEmail = useCallback(async () => {
        if (!recipient || !recipient.includes('@')) {
            setMessage('Please enter a valid recipient email address.');
            return;
        }

        setStatus('loading');
        setMessage('Sending welcome email...');

        const emailBody = createWelcomeEmailBody(recipient);

        try {
            await sendPicaEmail({
                to: recipient,
                subject: WELCOME_EMAIL_SUBJECT,
                body: emailBody,
                from: DEFAULT_SENDER_EMAIL,
            });
            setStatus('success');
            setMessage('Email successfully sent! ✅');
        } catch (error: any) {
            setStatus('error');
            setMessage(`Failed to send email: ${error.message || 'An unknown error occurred.'} ❌`);
            console.error('Email sending error:', error);
        }
    }, [recipient]);

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', maxWidth: '400px' }}>
            <h2>UniStore Welcome Email Sender 📧</h2>
            <p>This will send a customized **HTML welcome email** to the address below.</p>
            
            <input
                type="email"
                placeholder="Recipient Email Address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={status === 'loading'}
                style={{ width: '100%', padding: '8px', margin: '10px 0', boxSizing: 'border-box' }}
            />
            
            <button
                onClick={handleSendEmail}
                disabled={status === 'loading' || !recipient}
                style={{
                    padding: '10px 15px',
                    backgroundColor: status === 'loading' ? '#aaa' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    width: '100%'
                }}
            >
                {status === 'loading' ? 'Sending...' : 'Send Welcome Email'}
            </button>
            
            {message && (
                <p style={{ 
                    marginTop: '15px', 
                    fontWeight: 'bold', 
                    color: status === 'error' ? 'red' : status === 'success' ? 'green' : 'black' 
                }}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default WelcomeEmailSender;