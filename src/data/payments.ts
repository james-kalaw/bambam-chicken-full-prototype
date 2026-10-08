// DEMO PAYMENT SETTINGS — nothing here is a real account or a real QR code.

/**
 * Shown where Bambam's payment QR will go. Replace `qrImage` with the
 * owner-provided QR file (e.g. "/brand/gcash-qr.png") once approved.
 */
export const PAYMENT_ACCOUNT = {
  accountName: "Bambam Chicken",
  qrImage: null as string | null,
  note: "Placeholder — the owners will provide the official payment QR.",
};

/**
 * A fake "payment screenshot" used only for the seeded demo order that is
 * waiting for verification. Real uploads use the customer's own image.
 */
export const DEMO_PROOF_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420">
  <rect width="300" height="420" rx="18" fill="#eef3fb"/>
  <rect x="20" y="20" width="260" height="60" rx="12" fill="#1f5fbf"/>
  <text x="150" y="58" font-family="Arial" font-size="20" fill="#fff" text-anchor="middle">Payment sent</text>
  <text x="150" y="140" font-family="Arial" font-size="40" font-weight="bold" fill="#1d2b44" text-anchor="middle">PHP 358.00</text>
  <text x="150" y="190" font-family="Arial" font-size="16" fill="#4a5872" text-anchor="middle">To: Bambam Chicken</text>
  <text x="150" y="220" font-family="Arial" font-size="16" fill="#4a5872" text-anchor="middle">Ref No. 8012 345 678</text>
  <text x="150" y="380" font-family="Arial" font-size="14" fill="#c0392b" text-anchor="middle">DEMO IMAGE — NOT A REAL RECEIPT</text>
</svg>`);
