// "Continue with Google" using Google Identity Services (popup, no redirect page needed).
// The popup returns an access token, which the backend checks with Google before signing the user in.

export const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise = null;

// Load the Google script once. Call it early (on page load) so the popup can open
// straight from the click; browsers block popups that open after an await.
export function loadGoogleScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load Google sign-in. Check your connection and try again.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

// Opens the Google account picker. Resolves with an access token, rejects if the user closes it.
export function requestGoogleAccessToken() {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google sign-in isn’t set up yet.'));
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google sign-in is still loading. Please try again in a moment.'));
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error('Google sign-in was cancelled.'));
        } else {
          resolve(response.access_token);
        }
      },
      error_callback: () => reject(new Error('Google sign-in was cancelled.')),
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
}
