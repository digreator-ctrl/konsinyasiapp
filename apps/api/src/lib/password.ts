// ============================================================
// KonsinyasiApp — Password Hashing (WebCrypto PBKDF2)
// Salted, iterated hashing with legacy SHA-256 migration support
// ============================================================

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 32; // bytes (256-bit)
const SALT_LENGTH = 16; // bytes
const PREFIX = "pbkdf2";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function deriveHash(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    PBKDF2_KEY_LENGTH * 8
  );
  return toHex(new Uint8Array(bits));
}

/** Legacy (unsalted) SHA-256 hash used by earlier versions. */
async function legacySha256(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(hashBuffer));
}

/** Hash a password with a random salt. Returns `pbkdf2$iterations$salt$hash`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hash = await deriveHash(password, salt, PBKDF2_ITERATIONS);
  return `${PREFIX}$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export interface VerifyResult {
  valid: boolean;
  /** True when the stored hash uses the legacy unsalted SHA-256 format. */
  needsRehash: boolean;
}

/** Verify a password against a stored hash (PBKDF2 or legacy SHA-256). */
export async function verifyPassword(password: string, stored: string): Promise<VerifyResult> {
  if (!stored) return { valid: false, needsRehash: false };

  if (stored.startsWith(`${PREFIX}$`)) {
    const [prefix, iterationsStr, saltHex, hashHex] = stored.split("$");
    if (prefix !== PREFIX || !iterationsStr || !saltHex || !hashHex) {
      return { valid: false, needsRehash: false };
    }
    const iterations = parseInt(iterationsStr, 10);
    if (!Number.isFinite(iterations) || iterations <= 0) {
      return { valid: false, needsRehash: false };
    }
    const derived = await deriveHash(password, fromHex(saltHex), iterations);
    return { valid: timingSafeEqual(derived, hashHex), needsRehash: false };
  }

  // Legacy unsalted SHA-256
  const legacy = await legacySha256(password);
  return { valid: timingSafeEqual(legacy, stored), needsRehash: true };
}
