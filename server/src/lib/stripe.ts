import StripeSDK from "stripe";

type StripeConstructor = new (
  key: string,
  config?: Record<string, unknown>
) => StripeSDK.Stripe;

export const stripe = new (StripeSDK as unknown as StripeConstructor)(
  process.env.STRIPE_SECRET_KEY!,
  { apiVersion: "2026-03-25.dahlia" }
);
