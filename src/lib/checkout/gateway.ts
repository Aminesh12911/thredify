/**
 * SANDBOX PAYMENT SIMULATOR. No money moves and no card data is collected or stored.
 * The customer picks a test scenario instead of typing payment details.
 *
 * To use a real sandbox gateway later (e.g. Razorpay/Stripe test mode), replace this module
 * with a server route that holds the secret key and returns the same result shape.
 */
export type PaymentScenario = "success" | "declined" | "error";

export interface PaymentResult {
  status: "succeeded" | "failed";
  reference: string;
  message: string;
}

export const scenarios: Array<{ id: PaymentScenario; label: string; hint: string }> = [
  { id: "success", label: "Payment succeeds", hint: "Simulates an approved test payment." },
  { id: "declined", label: "Payment is declined", hint: "Simulates a card declined by the bank." },
  { id: "error", label: "Gateway error", hint: "Simulates a gateway timeout." },
];

export const methods = ["UPI", "Card", "Net banking"] as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Deterministic outcome for a scenario. Runs on the server in Supabase mode so the browser can't claim "paid". */
export function resolvePayment(scenario: PaymentScenario): PaymentResult {
  const reference = `SBX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  if (scenario === "success") {
    return { status: "succeeded", reference, message: "Test payment approved. No real money was charged." };
  }
  if (scenario === "declined") {
    return { status: "failed", reference, message: "Your test payment was declined. No money was charged — try another scenario or retry." };
  }
  return { status: "failed", reference, message: "The sandbox gateway timed out. No money was charged — please try again." };
}

export async function simulatePayment(scenario: PaymentScenario): Promise<PaymentResult> {
  await wait(1200);
  return resolvePayment(scenario);
}
