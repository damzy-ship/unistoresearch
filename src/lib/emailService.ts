// --- UTILITIES ---

/**
 * Converts a standard string to a Base64URL encoded string.
 * This is necessary because the Pica API requires Base64URL, not standard Base64 (btoa).
 * Base64URL replaces '+', '/', and removes trailing '=' characters.
 */ 
const base64urlEncode = (str: string): string => {
    // 1. Convert UTF-8 characters to a format btoa can handle (Latin1/Binary String)
    let encoded = btoa(unescape(encodeURIComponent(str))); // ⬅️ THIS IS THE FIX

    // 2. Replace URL-unsafe characters
    encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');

    // 3. Remove padding characters
    while (encoded.endsWith('=')) {
        encoded = encoded.slice(0, -1);
    }
    return encoded;
};


// --- PICA EMAIL SERVICE CONFIG & IMPLEMENTATION ---

// ⚠️ WARNING: DO NOT EXPOSE SECRETS IN PRODUCTION FRONTENDS! 
// Replace these with your actual keys.
const PICA_SECRET_KEY = import.meta.env.PICA_SECRET_KEY;
const PICA_GMAIL_CONNECTION_KEY = import.meta.env.PICA_GMAIL_CONNECTION_KEY;
const PICA_ACTION_ID = import.meta.env.PICA_ACTION_ID;
const API_URL = 'https://api.picaos.com/v1/passthrough/users/me/messages/send';

interface SendEmailParams {
    to: string;
    subject: string;
    body: string;
    from?: string;
}

/**
 * Reusable service function to send an email via the Pica OS Gmail Passthrough API.
 * @param params - Email details (to, subject, body, and optional from).
 * @returns The API response data on success.
 */
export const sendPicaEmail = async ({ to, subject, body, from }: SendEmailParams): Promise<any> => {
    // Simple check to remind user to update keys if placeholders are detected
    if (!PICA_SECRET_KEY || !PICA_GMAIL_CONNECTION_KEY) {
        throw new Error("Pica keys are missing. Please update PICA_SECRET_KEY and PICA_GMAIL_CONNECTION_KEY.");
    }

    // 1. Construct MIME message
    let mime = `To: ${to}\nSubject: ${subject}\nContent-Type: text/html; charset=UTF-8\n\n${body}`;
    if (from) {
        mime = `From: ${from}\n` + mime;
    }

    // 2. Encode as base64url
    const raw = base64urlEncode(mime);

    const payload = { raw };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'x-pica-secret': PICA_SECRET_KEY,
            'x-pica-connection-key': PICA_GMAIL_CONNECTION_KEY,
            'x-pica-action-id': PICA_ACTION_ID,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
            const errorBody = await response.json();
            // Attempt to extract a meaningful error message from the body
            errorMessage = errorBody.message || errorBody.error?.message || errorMessage;
        } catch (e) {
            // Ignore if response body isn't JSON
        }
        throw new Error(errorMessage);
    }

    return response.json();
};
