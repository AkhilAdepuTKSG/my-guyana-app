// Level-B biometric sign-in: a real WebAuthn platform-authenticator flow that
// pops the device's own Face ID / Touch ID / fingerprint / Windows Hello prompt.
//
// This is CLIENT-ONLY on purpose — there is no backend in this app, so the
// challenge is generated here and the returned assertion is not cryptographically
// verified. It is enough to make the biometric prompt real on a phone (great for
// a Vercel demo), but it is NOT production-secure. A real deployment must move the
// challenge/verification to a server (the WebAuthn "Relying Party"). See the notes
// in the sign-in flow for the upgrade path.
//
// WebAuthn requires a secure context (https, or localhost in dev). On Vercel both
// hold; over a plain-http LAN IP it will fail with a friendly, recoverable error.

const STORAGE_KEY = 'myguyana.biometric.credential';

// --- small base64url <-> ArrayBuffer helpers (no deps) ---
function bufToB64url(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i += 1) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBuf(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const str = atob(b64 + pad);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i += 1) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
}

function randomChallenge() {
  return crypto.getRandomValues(new Uint8Array(32));
}

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasEnrolledBiometric() {
  return !!getStored();
}

export function clearBiometric() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// Is a device biometric usable here at all? Async because the platform-authenticator
// probe is a promise. Returns false rather than throwing so callers can branch simply.
export async function isBiometricSupported() {
  if (typeof window === 'undefined') return false;
  if (!window.isSecureContext) return false;
  if (!window.PublicKeyCredential || !navigator.credentials?.create) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Map the WebAuthn DOMException zoo onto a short reason + a human message the UI
// can show. 'cancelled' is the common one (user dismissed the OS prompt).
function describeError(err) {
  const name = err?.name || '';
  if (name === 'NotAllowedError') return { reason: 'cancelled', message: 'Face ID was cancelled. Try again, or use another way to sign in.' };
  if (name === 'InvalidStateError') return { reason: 'alreadyEnrolled', message: 'This device is already set up. Try signing in with Face ID.' };
  if (name === 'SecurityError') return { reason: 'insecure', message: 'Face ID needs a secure (https) connection. Use another way to sign in here.' };
  if (name === 'NotSupportedError' || name === 'AbortError') return { reason: 'unsupported', message: "This device can't use Face ID here. Use another way to sign in." };
  return { reason: 'error', message: 'Face ID could not complete. Use another way to sign in.' };
}

// Enrol this device: creates a platform passkey (pops the biometric prompt) and
// remembers its credential id locally so future sign-ins can target it.
export async function enrolBiometric({ id = 'citizen', name = 'My Guyana', displayName = 'My Guyana citizen' } = {}) {
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: 'My Guyana', id: window.location.hostname },
        user: { id: new TextEncoder().encode(id), name, displayName },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60000,
        attestation: 'none',
      },
    });
    if (!cred) return { ok: false, reason: 'error', message: 'Face ID setup did not complete.' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: bufToB64url(cred.rawId), name }));
    return { ok: true };
  } catch (err) {
    return { ok: false, ...describeError(err) };
  }
}

// Sign in: pops the biometric prompt to unlock the enrolled passkey. If nothing is
// enrolled on this device, reports reason 'noenrol' so the UI can offer set-up.
export async function authenticateBiometric() {
  const stored = getStored();
  if (!stored) return { ok: false, reason: 'noenrol', message: 'No Face ID is set up on this device yet.' };
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        rpId: window.location.hostname,
        allowCredentials: [{ type: 'public-key', id: b64urlToBuf(stored.id) }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    // Client-only: presence of a signed assertion is our success signal. A real
    // deployment verifies assertion.response against the stored public key server-side.
    return assertion ? { ok: true } : { ok: false, reason: 'error', message: 'Face ID could not complete.' };
  } catch (err) {
    return { ok: false, ...describeError(err) };
  }
}
