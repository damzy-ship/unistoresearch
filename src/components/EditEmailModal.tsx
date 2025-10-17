import { useState, useEffect } from 'react';
import { Theme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { sendPicaEmail } from '../lib/emailService';

interface EditEmailModalProps {
  currentEmail: string;
  onClose: () => void;
  onSave: (newEmail: string) => void;
  currentTheme: Theme;
}

const createOTPEmailBody = (otp: string): string => {
  return `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px;
          }
          .card {
            background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
            border-radius: 16px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            padding: 32px;
            text-align: center;
          }
          .header {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            margin: -32px -32px 24px -32px;
            padding: 32px;
            border-radius: 16px 16px 0 0;
          }
          .logo {
            color: white;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .title {
            color: #1f2937;
            font-size: 24px;
            font-weight: bold;
            margin: 24px 0 16px;
          }
          .otp-container {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 16px 32px;
            border-radius: 12px;
            margin: 24px 0;
            display: inline-block;
          }
          .expiry {
            color: #6b7280;
            font-size: 14px;
            margin: 16px 0;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1 class="logo">UniStore</h1>
            </div>
            <h2 class="title">Email Verification Code</h2>
            <p>Use the following code to verify your email address change request. This code will expire in 2 minutes.</p>
            <div class="otp-container">
              ${otp}
            </div>
            <p class="expiry">Code expires in: 2 minutes</p>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} UniStore. All rights reserved.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export default function EditEmailModal({ currentEmail, onClose, onSave, currentTheme }: EditEmailModalProps) {
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [otp, setOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOTP = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const generatedOtp = generateOTP();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 2 * 60000); // 2 minutes from now

      const { error: insertError } = await supabase
        .from('otp_codes')
        .insert({
          code: generatedOtp,
          email: newEmail,
          expires_at: expiresAt.toISOString()
        });

      if (insertError) throw insertError;

      // Send OTP email
      await sendPicaEmail({
        to: newEmail,
        subject: 'UniStore Email Verification Code',
        body: createOTPEmailBody(generatedOtp),
      });

      setOtp(generatedOtp);
      setShowOtpInput(true);
      setCountdown(45); // Start 45 second countdown for resend
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!enteredOtp) {
      setError('Please enter the OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check OTP in database
      const { data: otpData, error: otpError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('code', enteredOtp)
        .eq('email', newEmail)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (otpError || !otpData) {
        throw new Error('Invalid or expired OTP code');
      }

      // Update email in auth
      const { error: authError } = await supabase.auth.updateUser({
        phone: newEmail
      });

      console.log(error)


      if (authError) throw authError;

      // Clean up used OTP
      await supabase
        .from('otp_codes')
        .delete()
        .eq('code', enteredOtp);

      onSave(newEmail);
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="rounded-2xl p-8 shadow-lg max-w-lg w-full m-4 transition-all duration-300"
        style={{ backgroundColor: currentTheme.surface, color: currentTheme.text }}
      >
        <h3 
          className="text-2xl font-bold mb-4"
          style={{ color: currentTheme.primary }}
        >
          Change Email Address
        </h3>
        <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
          {showOtpInput 
            ? 'Enter the verification code sent to your email.'
            : 'Update your email address. You\'ll need to verify the new email.'}
        </p>
        
        {!showOtpInput ? (
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email address"
            className="w-full p-3 rounded-lg border focus:outline-none transition-colors duration-200"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.textSecondary + '30',
              color: currentTheme.text,
            }}
          />
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full p-3 rounded-lg border focus:outline-none transition-colors duration-200"
              style={{
                backgroundColor: currentTheme.background,
                borderColor: currentTheme.textSecondary + '30',
                color: currentTheme.text,
              }}
            />
            {countdown > 0 && (
              <p style={{ color: currentTheme.textSecondary }}>
                Resend available in {countdown} seconds
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-2 text-red-500">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium transition-colors duration-200"
            style={{
              backgroundColor: currentTheme.background,
              color: currentTheme.text
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={showOtpInput ? handleVerifyOTP : handleSendOTP}
            className={`px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})`
            }}
            disabled={loading || (showOtpInput && countdown > 0 && !enteredOtp)}
          >
            {loading ? 'Processing...' : (showOtpInput ? 'Verify' : 'Send Code')}
          </button>
        </div>
      </div>
    </div>
  );
}