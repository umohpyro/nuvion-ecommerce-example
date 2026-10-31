/**
 * Encrypts card details in the browser with Nuvion's RSA public key (RSA-OAEP, SHA-256), so the
 * card number never reaches this app's server or its logs. Only Nuvion, which holds the private
 * key, can decrypt the result.
 *
 * The public key is public by design: it can only encrypt.
 */
export interface CardDetails {
  number: string;
  month: string;
  year: string;
  cvv: string;
  holder: string;
}

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function encryptCard(publicKeyPem: string, card: CardDetails): Promise<string> {
  const key = await crypto.subtle.importKey("spki", pemToDer(publicKeyPem), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
  const payload = JSON.stringify({
    card_number: card.number.replace(/[\s-]/g, ""),
    expiration_month: card.month.padStart(2, "0"),
    expiration_year: card.year.length === 2 ? `20${card.year}` : card.year,
    cvv: card.cvv,
    card_holder_name: card.holder.trim(),
  });
  const cipher = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, new TextEncoder().encode(payload));
  let bin = "";
  new Uint8Array(cipher).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

/** Luhn check: catches typos before the request, so the shopper gets instant feedback. */
export function luhnValid(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}
