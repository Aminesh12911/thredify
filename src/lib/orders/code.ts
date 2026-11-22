const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/** THR-YYYYMMDD-XXXXX. Demo orders use 5 characters; server orders use 8 (harder to guess when looking up by ID). */
export function generateOrderCode(existing: Set<string> = new Set(), length = 5) {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    const suffix = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
    const code = `THR-${date}-${suffix}`;
    if (!existing.has(code)) return code;
  }
}

export const ORDER_CODE_PATTERN = /^THR-\d{8}-[A-HJ-NP-Z2-9]{5,8}$/;
