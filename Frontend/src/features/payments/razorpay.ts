// Razorpay browser SDK loader + checkout opener. Architecture-only — not
// wired into any route yet. When the checkout page lands in Phase 4 it will
// call openRazorpayCheckout(...) after useCreateOrder() returns the
// razorpayOrderId.

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

// One payment instrument to show in a display block — e.g. { method: "card" }
// or, to restrict UPI to just the QR flow, { method: "upi", flows: ["qr"] }.
// Shape is intentionally loose (Record) since each Razorpay method accepts
// different instrument properties (issuers/networks/types for card, banks
// for netbanking, wallets for wallet, flows/apps for upi, etc).
export type RazorpayPaymentInstrument = { method: string } & Record<string, unknown>;

export type RazorpayOptions = {
  key: string;
  amount: number; // in paise / cents
  currency: string; // 'INR', 'USD', …
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string; method?: string; vpa?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  // Restricts/reorders which payment methods Checkout shows. Docs:
  // https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/configure-payment-methods/understand-configuration/
  config?: {
    display: {
      blocks: Record<string, { name: string; instruments: RazorpayPaymentInstrument[] }>;
      sequence: string[];
      preferences: { show_default_blocks: boolean };
      hide?: RazorpayPaymentInstrument[];
    };
  };
};

export type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  close: () => void;
};

const SDK_URL = "https://checkout.razorpay.com/v1/checkout.js";

let sdkPromise: Promise<boolean> | null = null;

/**
 * Inject the Razorpay browser SDK script tag once. Subsequent calls return
 * the cached promise. SSR-safe — returns false if `document` is missing.
 */
export function loadRazorpaySdk(): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(false);
  }
  if (window.Razorpay) return Promise.resolve(true);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      sdkPromise = null; // allow retry
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
}

/**
 * Open the Razorpay checkout modal. Throws if the SDK can't load or the key
 * is missing. The caller wires `handler` to post back to
 * /orders/verify-payment via useVerifyPayment().
 */
export async function openRazorpayCheckout(options: RazorpayOptions): Promise<void> {
  const ok = await loadRazorpaySdk();
  if (!ok) throw new Error("Razorpay SDK failed to load");
  if (!window.Razorpay) throw new Error("Razorpay constructor missing");
  const rzp = new window.Razorpay(options);
  rzp.open();
}
