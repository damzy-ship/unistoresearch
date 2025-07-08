import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

const validateEnvVariables = () => {
  const baseUrl = import.meta.env.VITE_TERMII_BASE_URL;
  const apiKey = import.meta.env.VITE_TERMII_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Missing required environment variables: TERMII_BASE_URL or TERMII_API_KEY");
  }

  return { baseUrl, apiKey };
};

const constructSmsPayload = (phoneNumber: string, message: string, apiKey: string) => ({
  api_key: apiKey,
  to: phoneNumber,
  from: "N-Alert",
  sms: message,
  type: "plain",
  channel: "dnd",
});

const sendSmsRequest = async (url: string, data: any) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const responseData = await response.json();
    console.error("SMS API error:", responseData);
    throw new Error(`SMS sending failed: ${response.statusText}`);
  }

  return response.json();
};

export const sendSMS = async (phoneNumber: string, message: string): Promise<{success: boolean; error?: string}> => {
  try {
    // Check if environment variables are available
    try {
      const { baseUrl, apiKey } = validateEnvVariables();
      
      const url = new URL("/api/sms/send", baseUrl).toString();
      const payload = constructSmsPayload(phoneNumber, message, apiKey);

      await sendSmsRequest(url, payload);
      console.info(`SMS sent successfully to ${phoneNumber}`);
      return { success: true };
    } catch (envError) {
      console.warn("SMS service not configured:", envError);
      // Return success but with a warning that SMS wasn't actually sent
      // The UI will show the OTP on screen instead
      return { 
        success: true, 
        error: "SMS service not configured. OTP will be displayed on screen." 
      };
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send SMS" 
    };
  }
};

// Generate a random OTP
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let OTP = '';
  
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  
  return OTP;
};

// Store OTP in database
export const storeOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  try {
    // Store OTP with expiration (10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    // Use Supabase to store the OTP
    // We'll use a custom table for this
    const { error } = await supabase
      .from('otp_codes')
      .upsert({
        phone_number: phoneNumber,
        code: otp,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'phone_number'
      });
    
    if (error) {
      console.error('Error storing OTP:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error storing OTP:', error);
    return false;
  }
};

// Verify OTP
export const verifyOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  try {
    // Get the stored OTP
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('code', otp)
      .single();
    
    if (error || !data) {
      console.error('Error verifying OTP:', error);
      return false;
    }
    
    // Check if OTP is expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      console.error('OTP expired');
      return false;
    }
    
    // Delete the OTP after successful verification
    await supabase
      .from('otp_codes')
      .delete()
      .eq('phone_number', phoneNumber);
    
    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

// Send OTP via SMS
export const sendOTP = async (phoneNumber: string): Promise<{success: boolean; otp?: string; error?: string}> => {
  try {
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP
    const stored = await storeOTP(phoneNumber, otp);
    if (!stored) {
      return { success: false, error: 'Failed to store OTP' };
    }
    
    // Send OTP via SMS
    const message = `Your UniStore verification code is: ${otp}. Valid for 10 minutes.`;
    const result = await sendSMS(phoneNumber, message);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    // If SMS service is not configured, return the OTP to display on screen
    if (result.error && result.error.includes('not configured')) {
      return { success: true, otp, error: result.error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send OTP' 
    };
  }
};