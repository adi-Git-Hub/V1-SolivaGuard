import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState, useRef, Fragment, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  QrCode,
  Landmark,
  Wallet,
  ShieldCheck,
  Truck,
  RotateCcw,
  Lock,
  ChevronDown,
  Minus,
  Plus,
  Check,
  CheckCircle2,
  MapPin,
  Loader2,
  Shield,
  Sun,
  Wind,
  Activity,
  Sparkles,
  BadgeCheck,
  Headset,
  Clock,
  User,
  Gift,
  Pencil,
  AlertTriangle,
  RefreshCw,
  LifeBuoy,
} from "lucide-react";

import { useSession } from "@/features/auth/hooks/useSession";
import { useCheckoutStore } from "@/features/checkout/store";
import { useCreateOrder, useVerifyPayment } from "@/features/orders/api";
import { useAddresses, useAddAddress } from "@/features/user/profile-api";
import {
  AddressFormModal,
  type AddressForm as SavedAddressForm,
} from "@/features/user/components/AddressFormModal";
import { openRazorpayCheckout } from "@/features/payments/razorpay";
import type { RazorpayHandlerResponse } from "@/features/payments/razorpay";
import { ease, useIsMobile } from "@/design-system";
import { TermsAndConditions } from "@/components/TermsAndConditions";
import { PaymentProcessingOverlay } from "@/features/checkout/components/PaymentProcessingOverlay";
import { UnsavedChangesGuard } from "@/components/shared/UnsavedChangesGuard";

// idle → order (creating session) → connect (opening Razorpay) → verify → success | failed
type PaymentStage = "idle" | "order" | "connect" | "verify" | "success" | "failed";
type OrderType = "self" | "gift";
type PaymentMethod = "upi" | "upi-qr" | "card" | "netbanking" | "wallet";

const RZP_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

export const Route = createFileRoute("/_public/checkout")({
  component: CheckoutRoute,
});

/* ════════ VALIDATION (pure helpers — drive inline field errors) ════════ */

const onlyDigits = (s: string) => s.replace(/\D/g, "");
// Indian mobiles are 10 digits; keep the last 10 so a "+91 …" entry still works.
const to10 = (s: string) => onlyDigits(s).slice(-10);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;
const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile
const PIN_RE = /^[1-9]\d{5}$/; // Indian pincode

type FieldName =
  | "fullName"
  | "email"
  | "phone"
  | "address"
  | "city"
  | "state"
  | "pinCode"
  | "country"
  | "recipientName"
  | "recipientPhone"
  | "recipientEmail";

function validateField(name: FieldName, value: string): string {
  const v = value.trim();
  switch (name) {
    case "fullName":
    case "recipientName":
      if (!v) return "Name is required";
      if (v.length < 2) return "Enter the full name";
      if (!NAME_RE.test(v)) return "Letters only — no numbers or symbols";
      return "";
    case "email":
      if (!v) return "Email is required";
      if (!EMAIL_RE.test(v)) return "Enter a valid email address";
      return "";
    case "recipientEmail": // optional
      if (!v) return "";
      if (!EMAIL_RE.test(v)) return "Enter a valid email address";
      return "";
    case "phone":
    case "recipientPhone": {
      const d = to10(value);
      if (!d) return "Phone number is required";
      if (!PHONE_RE.test(d)) return "Enter a valid 10-digit mobile number";
      return "";
    }
    case "address":
      if (!v) return "Address is required";
      if (v.length < 5) return "Enter your full street address";
      return "";
    case "city":
      if (!v) return "City is required";
      return "";
    case "state":
      if (!v) return "State is required";
      return "";
    case "country":
      if (!v) return "Country is required";
      return "";
    case "pinCode": {
      const d = onlyDigits(value);
      if (!d) return "Pincode is required";
      if (!PIN_RE.test(d)) return "Enter a valid 6-digit pincode";
      return "";
    }
    default:
      return "";
  }
}

// Which accordion section a field lives in — used to auto-expand + focus on error.
const SECTION_OF: Record<FieldName, number> = {
  fullName: 0,
  email: 0,
  phone: 0,
  recipientName: 1,
  recipientPhone: 1,
  recipientEmail: 1,
  address: 2,
  city: 2,
  state: 2,
  pinCode: 2,
  country: 2,
};

/* ════════ MOTION ════════ */

const sectionReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: ease.luxe },
  }),
};
const mobileReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  }),
};
const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.01, y: -2, transition: { duration: 0.4, ease: ease.luxe } },
};

const solivaPromise: { icon: typeof Shield; text: string }[] = [
  { icon: Shield, text: "Full Face, Neck & Upper Back Coverage" },
  { icon: Sun, text: "Designed For Everyday Indian Conditions" },
  { icon: Wind, text: "Breathable Long-Wear Comfort" },
  { icon: Activity, text: "Structured Fit For Daily Movement" },
  { icon: Sparkles, text: "Thoughtfully Designed Exposure Protection" },
];

const trustPoints: { icon: typeof Truck; text: string }[] = [
  { icon: Truck, text: "Free Shipping Across India" },
  { icon: BadgeCheck, text: "GST Included" },
  { icon: ShieldCheck, text: "Secure Checkout" },
  { icon: Headset, text: "Easy Customer Support" },
  { icon: Clock, text: "Estimated Delivery 5–7 Business Days" },
];

// Trust signals shown directly above the payment CTA (Phase 7).
const payTrust = [
  "Secure Razorpay Payment",
  "SSL Protected Checkout",
  "GST Included",
  "Free Shipping Across India",
  "100% Secure Transactions",
];

function CheckoutRoute() {
  const navigate = useNavigate();
  const session = useSession();
  const { items, setItems, clear, setConfirmedOrder } = useCheckoutStore();
  const createOrder = useCreateOrder();
  const verifyPayment = useVerifyPayment();

  // ── Saved-address book integration (logged-in users) ──
  const isLoggedIn = !!session?.user;
  const { data: savedAddresses = [] } = useAddresses();
  const addAddressMut = useAddAddress();
  type SavedAddr = SavedAddressForm & { _id?: string; id?: string };
  const savedList = (isLoggedIn ? savedAddresses : []) as SavedAddr[];
  const savedId = (a: SavedAddr) => (a._id ?? a.id) as string;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  // "new" = type a fresh address inline; "saved" = pick from the book.
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [addAddrOpen, setAddAddrOpen] = useState(false);
  const selectedAddress = savedList.find((a) => savedId(a) === selectedAddressId) ?? null;

  // Auto-select the default saved address the first time the book loads.
  useEffect(() => {
    if (!savedList.length) return;
    if (selectedAddressId) return;
    const def = savedList.find((a) => a.isDefault) ?? savedList[0];
    setSelectedAddressId(savedId(def));
    setAddressMode("saved");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedList.length]);

  const isMobile = useIsMobile();
  const reveal = isMobile ? mobileReveal : sectionReveal;

  const accountEmailVerified = !!session?.user?.isVerified;
  const accountPhone = session?.user?.phoneNumber ? to10(session.user.phoneNumber) : "";

  const [paying, setPaying] = useState(false);
  const [stage, setStage] = useState<PaymentStage>("idle");
  const [payError, setPayError] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [activePayment, setActivePayment] = useState<PaymentMethod | null>(null);
  const [upiId, setUpiId] = useState("");
  const [expandedSection, setExpandedSection] = useState<number>(0);
  const [locating, setLocating] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("self");

  // Verified fields lock by default; user can opt to edit.
  const [editEmail, setEditEmail] = useState(false);
  const [editPhone, setEditPhone] = useState(false);

  const [form, setForm] = useState({
    fullName: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    phone: accountPhone,
    address: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    giftNote: "",
    deliveryInstructions: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});

  // Keep prefill in sync once the session resolves (it may arrive after mount).
  useEffect(() => {
    if (!session?.user) return;
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || session.user.name || "",
      email: prev.email || session.user.email || "",
      phone: prev.phone || (session.user.phoneNumber ? to10(session.user.phoneNumber) : ""),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Redirect to the success page once payment is confirmed. Runs on the render
  // AFTER paymentDone flips true, so formDirty is already false and the
  // navigation blocker no longer cancels this navigate.
  useEffect(() => {
    if (paymentDone) {
      navigate({ to: "/payment-success" });
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentDone]);

  const upiInputRef = useRef<HTMLInputElement>(null);

  // A picked saved address already carries valid shipping data — so the inline
  // form fields are NOT required in that case (either path is accepted).
  const usingSavedAddress = addressMode === "saved" && !!selectedAddress;
  const shippingFields: FieldName[] = usingSavedAddress
    ? []
    : ["address", "city", "state", "pinCode", "country"];

  // Which fields are required given the current order type + address mode.
  const requiredFields: FieldName[] =
    orderType === "gift"
      ? ["fullName", "email", "phone", "recipientName", "recipientPhone", ...shippingFields]
      : ["fullName", "email", "phone", ...shippingFields];

  const emailLocked = accountEmailVerified && !editEmail;
  const phoneVerified = !!accountPhone;
  const phoneLocked = phoneVerified && !editPhone;

  function fieldOk(name: FieldName) {
    // Locked verified fields are trusted (came from the account).
    if (name === "email" && emailLocked) return true;
    if (name === "phone" && phoneLocked) return true;
    return validateField(name, form[name] as string) === "";
  }

  const contactValid = (["fullName", "email", "phone"] as FieldName[]).every(fieldOk);
  const recipientValid =
    orderType === "self" ||
    (["recipientName", "recipientPhone"] as FieldName[]).every(fieldOk) &&
      validateField("recipientEmail", form.recipientEmail) === "";
  const manualShippingValid = (["address", "city", "state", "pinCode", "country"] as FieldName[]).every(fieldOk);
  // A selected saved address is already validated server-side; otherwise the
  // inline manual form must be valid.
  const shippingValid = addressMode === "saved" ? !!selectedAddress : manualShippingValid;
  const isReadyToPay = contactValid && recipientValid && shippingValid && !!activePayment;

  const stageLabel =
    stage === "order"
      ? "Creating secure payment session…"
      : stage === "connect"
        ? "Opening Razorpay…"
        : stage === "verify"
          ? "Verifying payment…"
          : "Processing…";

  const formDirty =
    !paymentDone &&
    [form.address, form.city, form.state, form.pinCode, form.recipientName, form.giftNote].some(
      (v) => v.trim() !== "",
    );

  if (!items.length && !paymentDone) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        <div className="fixed inset-0">
          <img src="/luxury-bg.webp" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: ease.luxe }}
          className="relative z-10 text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-white/60 border border-white/80 backdrop-blur-sm flex items-center justify-center">
            <Wallet className="h-7 w-7 text-ink-muted/40" />
          </div>
          <div className="space-y-2">
            <p className="font-display text-xl text-brown-deep">Nothing here yet</p>
            <p className="text-sm text-ink-muted font-light">Add something beautiful to begin.</p>
          </div>
          <button
            onClick={() => navigate({ to: "/collection" })}
            className="inline-flex items-center gap-2 rounded-full border border-brown-deep/15 bg-white/60 backdrop-blur-sm px-6 py-3 text-micro-sm font-mono tracking-cta uppercase font-bold text-brown-deep hover:bg-brown-deep hover:text-white transition-all duration-500"
          >
            Browse Collection
          </button>
        </motion.div>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = 0;
  const gst = 0;
  const total = subtotal + shipping + gst;
  const shipTo = [form.address, form.city, form.state, form.pinCode]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

  const LAUNCH_MRP_PER_UNIT = 999;
  const totalUnits = items.reduce((n, i) => n + i.quantity, 0);
  const mrpTotal = LAUNCH_MRP_PER_UNIT * totalUnits;
  const savings = Math.max(0, mrpTotal - subtotal);

  function setField(key: FieldName | "giftNote" | "deliveryInstructions", value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Live-clear an error the moment the value becomes valid (Phase 5 inline UX).
    if (key !== "giftNote" && key !== "deliveryInstructions") {
      const msg = validateField(key, value);
      setErrors((prev) => ({ ...prev, [key]: msg }));
    }
  }

  function blurField(key: FieldName) {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validateField(key, form[key] as string) }));
  }

  function updateQuantity(productId: string, delta: number) {
    setItems(
      items
        .map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  function toggleSection(idx: number) {
    setExpandedSection(expandedSection === idx ? -1 : idx);
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    // Geolocation only works in a secure context (https / localhost). If the
    // page was opened over plain http the browser blocks it before prompting.
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      toast.error("Location needs a secure (https) connection — please enter the address manually.");
      return;
    }
    // If the user has previously blocked location for this site, the prompt
    // never re-appears and getCurrentPosition fails instantly. Detect that up
    // front and guide them to re-enable it instead of just saying "denied".
    try {
      const perm = await navigator.permissions?.query({
        name: "geolocation" as PermissionName,
      });
      if (perm && perm.state === "denied") {
        toast.error(
          "Location is blocked for this site. Tap the lock icon in the address bar → Permissions → allow Location, then try again (or enter it manually).",
        );
        return;
      }
    } catch {
      // Permissions API unavailable — fall through and let the prompt decide.
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          const addr = data.address || {};
          setForm((prev) => ({
            ...prev,
            address:
              [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(", ") ||
              prev.address,
            city: addr.city || addr.town || addr.village || addr.county || prev.city,
            state: addr.state || prev.state,
            pinCode: addr.postcode || prev.pinCode,
            country: addr.country || prev.country,
          }));
          // The detected location becomes the active shipping address — switch
          // off any selected saved address so this form is what's used.
          setSelectedAddressId(null);
          setAddressMode("new");
          toast.success("Location detected");
        } catch {
          toast.error("Could not fetch address. Please enter manually.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            "Location access was denied. Enable it via the lock icon in your address bar, or enter the address manually.",
          );
        } else if (err.code === err.TIMEOUT) {
          toast.error("Location request timed out. Please try again or enter the address manually.");
        } else {
          toast.error("Could not detect location. Please enter manually.");
        }
      },
      // High accuracy isn't needed to autofill an address; the relaxed options
      // are far more reliable (allow a cached fix, longer timeout) so the call
      // succeeds instead of failing on phones without an immediate GPS lock.
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  }

  function focusField(name: FieldName) {
    const el = document.getElementById(`field-${name}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => (el as HTMLInputElement | null)?.focus(), 300);
  }

  function handlePayFailure(err: unknown) {
    const msg = err instanceof Error ? err.message : "Payment could not be completed";
    setStage("failed");
    setPayError(msg);
  }

  async function handlePay() {
    if (paying) return; // prevent double orders / repeated clicks

    if (!session?.user) {
      toast.message("Sign in to continue");
      navigate({ to: "/login", search: { redirect: "/checkout" } as never });
      return;
    }

    // Phase 5/9 — inline validation, NO blocking popup. Surface every field
    // error at once, expand the offending section, and focus the first issue.
    const nextErrors: Partial<Record<FieldName, string>> = {};
    for (const f of requiredFields) {
      if (f === "email" && emailLocked) continue;
      if (f === "phone" && phoneLocked) continue;
      nextErrors[f] = validateField(f, form[f] as string);
    }
    if (orderType === "gift" && form.recipientEmail.trim()) {
      nextErrors.recipientEmail = validateField("recipientEmail", form.recipientEmail);
    }
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    setTouched((prev) => {
      const t = { ...prev };
      requiredFields.forEach((f) => (t[f] = true));
      return t;
    });
    const firstInvalid = requiredFields.find((f) => nextErrors[f]);
    if (firstInvalid) {
      setExpandedSection(SECTION_OF[firstInvalid]);
      focusField(firstInvalid);
      return;
    }
    if (!activePayment) {
      setExpandedSection(3);
      toast.error("Select a payment method");
      return;
    }
    if (!RZP_KEY) {
      handlePayFailure(
        new Error("Payment configuration is missing (Razorpay key). Please contact support."),
      );
      return;
    }

    setPaying(true);
    setPayError(null);
    setStage("order");

    try {
      const orderItems = items.map((i) => ({
        product: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        image: i.image.startsWith("http") ? i.image : `${window.location.origin}${i.image}`,
      }));

      // Build an immutable shipping snapshot from the chosen source: a selected
      // saved address, otherwise the inline manual form. Either way we emit the
      // full structured shape PLUS legacy mirrors (address/pinCode/phoneNo) so
      // older readers keep working.
      const useSaved = addressMode === "saved" && selectedAddress;
      const snapName = useSaved
        ? selectedAddress!.fullName
        : orderType === "gift"
          ? form.recipientName.trim()
          : form.fullName.trim();
      const snapPhone = useSaved
        ? to10(selectedAddress!.phone)
        : orderType === "gift"
          ? to10(form.recipientPhone)
          : to10(form.phone);

      const shippingInfo = useSaved
        ? {
            fullName: snapName,
            phone: snapPhone,
            houseNo: selectedAddress!.houseNo || "",
            buildingName: selectedAddress!.buildingName || "",
            street: selectedAddress!.street,
            landmark: selectedAddress!.landmark || "",
            city: selectedAddress!.city,
            state: selectedAddress!.state,
            pincode: onlyDigits(selectedAddress!.pincode),
            country: selectedAddress!.country || "India",
            addressType: selectedAddress!.addressType || "Home",
          }
        : {
            fullName: snapName,
            phone: snapPhone,
            houseNo: "",
            buildingName: "",
            street: form.address.trim(),
            landmark: "",
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: onlyDigits(form.pinCode),
            country: form.country.trim() || "India",
            addressType: "Home" as const,
          };

      const payload = {
        shippingInfo: {
          ...shippingInfo,
          // legacy mirrors
          address: [shippingInfo.houseNo, shippingInfo.buildingName, shippingInfo.street, shippingInfo.landmark]
            .filter(Boolean)
            .join(", "),
          pinCode: parseInt(shippingInfo.pincode) || 110001,
          phoneNo: parseInt(shippingInfo.phone) || 9999999999,
        },
        orderItems,
        itemsPrice: subtotal,
        taxPrice: gst,
        shippingPrice: shipping,
        totalPrice: total,
      };

      const res = await createOrder.mutateAsync(payload);

      // Robust response guard — never silently fail on a missing payment session.
      if (!res?.order) {
        throw new Error("Order was not created. Please try again.");
      }
      if (!res.razorpayOrderId) {
        throw new Error(
          "Payment session could not be initialized (missing razorpayOrderId). Please retry or contact support.",
        );
      }

      const { razorpayOrderId, amount } = res;
      const orderId = res.order.id ?? res.order._id;

      const prefill: Record<string, string> = {
        name: snapName || form.fullName,
        email: form.email,
        contact: snapPhone,
      };
      if (activePayment === "upi" && upiId) prefill.vpa = upiId;

      const options = {
        // Prefer the key the backend created the order with — guarantees the
        // checkout key always matches the order (no "Error in opening checkout"
        // from key/order mismatch). Falls back to the build-time env.
        key: res.razorpayKeyId || RZP_KEY,
        amount,
        currency: "INR",
        name: "Soliva",
        description: items.map((i) => i.name).join(", "),
        order_id: razorpayOrderId,
        handler: async (response: RazorpayHandlerResponse) => {
          setStage("verify");
          try {
            await verifyPayment.mutateAsync({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setConfirmedOrder({
              orderId,
              items: [...items],
              total,
              paymentId: response.razorpay_payment_id,
            });
            setStage("success");
            // Flip paymentDone — the redirect runs from an effect AFTER this
            // re-render, by which point formDirty is false and the
            // UnsavedChangesGuard blocker is inert (a synchronous navigate()
            // here gets cancelled by the still-armed blocker → stuck loader).
            setPaymentDone(true);
          } catch {
            handlePayFailure(
              new Error("Payment was charged but verification failed. Please contact support with your payment ID."),
            );
          }
        },
        prefill,
        theme: { color: "#f5820d" },
        modal: {
          ondismiss: () => {
            // User closed Razorpay — treat as a calm cancel, not a failure.
            setPaying(false);
            setStage("idle");
            toast.info("Payment cancelled — your details are saved.");
          },
        },
      };

      setStage("connect");
      await openRazorpayCheckout(options);
    } catch (err) {
      handlePayFailure(err);
    } finally {
      setPaying(false);
    }
  }

  function retryPayment() {
    setStage("idle");
    setPayError(null);
    handlePay();
  }

  const paymentMethods: {
    id: PaymentMethod;
    label: string;
    sub: string;
    icon: typeof Smartphone;
  }[] = [
    { id: "upi", label: "UPI", sub: "GPay · PhonePe · Paytm", icon: Smartphone },
    { id: "upi-qr", label: "Scan & Pay", sub: "QR Code", icon: QrCode },
    { id: "card", label: "Card", sub: "Credit · Debit", icon: CreditCard },
    { id: "netbanking", label: "Net Banking", sub: "All major banks", icon: Landmark },
    { id: "wallet", label: "Wallets", sub: "Paytm · Mobikwik", icon: Wallet },
  ];

  return (
    <div className="relative min-h-screen w-full safe-x">
      <div className="fixed inset-0">
        <img src="/luxury-bg.webp" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/20 to-white/40" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[76rem] px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 lg:pt-32 pb-36 sm:pb-24">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-10 sm:mb-14"
        >
          <button
            onClick={() => navigate({ to: "/cart" })}
            className="group flex items-center gap-2.5 text-ink-muted hover:text-brown-deep transition-colors duration-500"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-500" />
            <span className="font-mono text-micro-md tracking-cta uppercase font-bold">Back to cart</span>
          </button>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: ease.luxe }}
          className="mb-12 sm:mb-16 lg:mb-20"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="h-px w-8 bg-brown/20" />
            <span className="font-mono text-micro-sm tracking-editorial text-orange-glow uppercase font-bold">
              Secure Checkout
            </span>
          </div>
          <h1 className="font-display text-brown-deep tracking-tight leading-tight text-display-sm sm:text-display-lg">
            Complete your order
          </h1>
          {session?.user && (
            <p className="mt-3 text-sm text-ink-muted font-light">
              Signed in as <span className="text-brown-deep font-medium">{session.user.email}</span>
            </p>
          )}
        </motion.div>

        {/* Progress journey */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: ease.luxe }}
          className="mb-10 max-w-2xl sm:mb-14"
        >
          <CheckoutSteps
            expandedSection={expandedSection}
            states={[contactValid, recipientValid, shippingValid, !!activePayment]}
            onJump={(i) => setExpandedSection(i)}
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 xl:gap-20">
          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0 space-y-8 sm:space-y-10">
            {/* SECTION A: Contact */}
            <motion.div custom={0} variants={reveal} initial="hidden" animate="visible">
              <CheckoutCard active={expandedSection === 0}>
                <SectionHeader
                  number="01"
                  title="Contact Information"
                  subtitle="Where we'll send your order updates."
                  expanded={expandedSection === 0}
                  onToggle={() => toggleSection(0)}
                  complete={contactValid}
                />
                <AnimatePresence initial={false}>
                  {expandedSection === 0 && (
                    <Expand>
                      <div className="pt-6 sm:pt-8 space-y-5">
                        <LuxField
                          name="fullName"
                          label="Full Name"
                          value={form.fullName}
                          onChange={(v) => setField("fullName", v)}
                          onBlur={() => blurField("fullName")}
                          error={touched.fullName ? errors.fullName : ""}
                          placeholder="Aditya Sharma"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <LuxField
                            name="email"
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={(v) => setField("email", v)}
                            onBlur={() => blurField("email")}
                            error={touched.email ? errors.email : ""}
                            placeholder="you@email.com"
                            verified={accountEmailVerified}
                            verifiedLabel="Verified Email"
                            locked={emailLocked}
                            onEdit={() => setEditEmail(true)}
                          />
                          <LuxField
                            name="phone"
                            label="Phone"
                            type="tel"
                            inputMode="numeric"
                            value={form.phone}
                            onChange={(v) => setField("phone", to10(v) || onlyDigits(v).slice(0, 10))}
                            onBlur={() => blurField("phone")}
                            error={touched.phone ? errors.phone : ""}
                            placeholder="9876543210"
                            verified={phoneVerified}
                            verifiedLabel="Verified Number"
                            locked={phoneLocked}
                            onEdit={() => setEditPhone(true)}
                          />
                        </div>
                        <ContinueButton
                          disabled={!contactValid}
                          label="Continue"
                          onClick={() => setExpandedSection(1)}
                        />
                      </div>
                    </Expand>
                  )}
                </AnimatePresence>
              </CheckoutCard>
            </motion.div>

            {/* SECTION: Order Type */}
            <motion.div custom={1} variants={reveal} initial="hidden" animate="visible">
              <CheckoutCard active={expandedSection === 1}>
                <SectionHeader
                  number="02"
                  title="Order Type"
                  subtitle={orderType === "self" ? "Buying for myself" : "Gifting to someone"}
                  expanded={expandedSection === 1}
                  onToggle={() => toggleSection(1)}
                  complete={orderType === "self" ? true : recipientValid}
                />
                <AnimatePresence initial={false}>
                  {expandedSection === 1 && (
                    <Expand>
                      <div className="pt-6 sm:pt-8 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <OrderTypeOption
                            icon={User}
                            title="Buying For Myself"
                            sub="Use my account details"
                            selected={orderType === "self"}
                            onSelect={() => setOrderType("self")}
                          />
                          <OrderTypeOption
                            icon={Gift}
                            title="Gifting For Someone"
                            sub="Ship to a recipient"
                            selected={orderType === "gift"}
                            onSelect={() => setOrderType("gift")}
                          />
                        </div>

                        <AnimatePresence initial={false}>
                          {orderType === "gift" && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.45, ease: ease.luxe }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-5 pt-1">
                                <LuxField
                                  name="recipientName"
                                  label="Recipient Name"
                                  value={form.recipientName}
                                  onChange={(v) => setField("recipientName", v)}
                                  onBlur={() => blurField("recipientName")}
                                  error={touched.recipientName ? errors.recipientName : ""}
                                  placeholder="Recipient's full name"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                  <LuxField
                                    name="recipientPhone"
                                    label="Recipient Phone"
                                    type="tel"
                                    inputMode="numeric"
                                    value={form.recipientPhone}
                                    onChange={(v) => setField("recipientPhone", onlyDigits(v).slice(0, 10))}
                                    onBlur={() => blurField("recipientPhone")}
                                    error={touched.recipientPhone ? errors.recipientPhone : ""}
                                    placeholder="9876543210"
                                  />
                                  <LuxField
                                    name="recipientEmail"
                                    label="Recipient Email (optional)"
                                    type="email"
                                    value={form.recipientEmail}
                                    onChange={(v) => setField("recipientEmail", v)}
                                    onBlur={() => blurField("recipientEmail")}
                                    error={touched.recipientEmail ? errors.recipientEmail : ""}
                                    placeholder="optional@email.com"
                                  />
                                </div>
                                <LuxTextarea
                                  label="Gift Note (optional)"
                                  value={form.giftNote}
                                  onChange={(v) => setField("giftNote", v)}
                                  placeholder="Add a personal message…"
                                />
                                <LuxTextarea
                                  label="Delivery Instructions (optional)"
                                  value={form.deliveryInstructions}
                                  onChange={(v) => setField("deliveryInstructions", v)}
                                  placeholder="e.g. Leave with the concierge"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <ContinueButton
                          disabled={orderType === "gift" && !recipientValid}
                          label="Continue to delivery"
                          onClick={() => setExpandedSection(2)}
                        />
                      </div>
                    </Expand>
                  )}
                </AnimatePresence>
              </CheckoutCard>
            </motion.div>

            {/* SECTION B: Delivery */}
            <motion.div custom={2} variants={reveal} initial="hidden" animate="visible">
              <CheckoutCard active={expandedSection === 2}>
                <SectionHeader
                  number="03"
                  title="Delivery Information"
                  subtitle="Where should we send your order?"
                  expanded={expandedSection === 2}
                  onToggle={() => toggleSection(2)}
                  complete={shippingValid}
                />
                <AnimatePresence initial={false}>
                  {expandedSection === 2 && (
                    <Expand>
                      <div className="pt-6 sm:pt-8 space-y-5">
                        {/* ── Saved addresses (logged-in users) ── */}
                        {isLoggedIn && savedList.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted font-bold">
                                Saved addresses
                              </span>
                              <button
                                type="button"
                                onClick={() => setAddressMode("new")}
                                className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-glow font-bold hover:underline"
                              >
                                Enter a new address
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              {savedList.map((a) => {
                                const id = savedId(a);
                                const active = addressMode === "saved" && selectedAddressId === id;
                                return (
                                  <button
                                    type="button"
                                    key={id}
                                    onClick={() => {
                                      setSelectedAddressId(id);
                                      setAddressMode("saved");
                                    }}
                                    className={`text-left rounded-2xl border p-4 transition-colors ${
                                      active
                                        ? "border-orange-glow bg-orange-glow/[0.05]"
                                        : "border-line-soft hover:border-orange-glow/40"
                                    }`}
                                  >
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                      <span className="font-mono text-[10px] uppercase tracking-widest text-brown-deep font-black">
                                        {a.fullName}
                                      </span>
                                      <span className="rounded-full border border-brown-deep/10 bg-brown-deep/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-brown-deep">
                                        {a.addressType || "Home"}
                                      </span>
                                      {a.isDefault && (
                                        <span className="rounded-full border border-orange-glow/20 bg-orange-glow/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-orange-glow">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[13px] leading-relaxed text-ink-muted">
                                      {[a.houseNo, a.buildingName, a.street, a.landmark]
                                        .filter(Boolean)
                                        .join(", ")}
                                      , {a.city}, {a.state} {a.pincode} · {a.phone}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => setAddAddrOpen(true)}
                              className="w-full rounded-2xl border border-dashed border-orange-glow/30 py-3 font-mono text-[11px] uppercase tracking-widest text-orange-glow font-bold hover:bg-orange-glow/[0.05]"
                            >
                              + Add new address
                            </button>
                          </div>
                        )}

                        {/* Prompt to save one when logged in with an empty book */}
                        {isLoggedIn && savedList.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-line-soft bg-cream/40 p-4 text-center">
                            <p className="mb-2 text-[13px] text-ink-muted">
                              No saved addresses yet — add one for faster checkout next time.
                            </p>
                            <button
                              type="button"
                              onClick={() => setAddAddrOpen(true)}
                              className="font-mono text-[11px] uppercase tracking-widest text-orange-glow font-bold hover:underline"
                            >
                              + Save an address
                            </button>
                          </div>
                        )}

                        {addressMode === "new" && (
                        <div className="space-y-5">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={detectLocation}
                          disabled={locating}
                          className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-orange-glow/20 bg-orange-glow/[0.04] py-3.5 text-orange-glow font-mono text-micro-sm tracking-cta uppercase font-bold hover:bg-orange-glow/[0.08] transition-all duration-500 disabled:opacity-50"
                        >
                          {locating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Detecting your location...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4" />
                              Use Current Location
                            </>
                          )}
                        </motion.button>

                        <LuxField
                          name="address"
                          label="Address"
                          value={form.address}
                          onChange={(v) => setField("address", v)}
                          onBlur={() => blurField("address")}
                          error={touched.address ? errors.address : ""}
                          placeholder="123, Civil Lines"
                        />
                        <div className="grid grid-cols-2 gap-5">
                          <LuxField
                            name="city"
                            label="City"
                            value={form.city}
                            onChange={(v) => setField("city", v)}
                            onBlur={() => blurField("city")}
                            error={touched.city ? errors.city : ""}
                            placeholder="Nagpur"
                          />
                          <LuxField
                            name="state"
                            label="State"
                            value={form.state}
                            onChange={(v) => setField("state", v)}
                            onBlur={() => blurField("state")}
                            error={touched.state ? errors.state : ""}
                            placeholder="Maharashtra"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <LuxField
                            name="pinCode"
                            label="PIN Code"
                            inputMode="numeric"
                            value={form.pinCode}
                            onChange={(v) => setField("pinCode", onlyDigits(v).slice(0, 6))}
                            onBlur={() => blurField("pinCode")}
                            error={touched.pinCode ? errors.pinCode : ""}
                            placeholder="440001"
                          />
                          <LuxField
                            name="country"
                            label="Country"
                            value={form.country}
                            onChange={(v) => setField("country", v)}
                            onBlur={() => blurField("country")}
                            error={touched.country ? errors.country : ""}
                            placeholder="India"
                          />
                        </div>
                        </div>
                        )}
                        <ContinueButton
                          disabled={!shippingValid}
                          label="Continue to payment"
                          onClick={() => setExpandedSection(3)}
                        />
                      </div>
                    </Expand>
                  )}
                </AnimatePresence>
              </CheckoutCard>
            </motion.div>

            {/* SOLIVA PROMISE */}
            <motion.div custom={3} variants={reveal} initial="hidden" animate="visible">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-[#3a2a22]/[0.07] bg-gradient-to-br from-[#fdfbf8]/85 to-[#f7efe4]/80 p-6 sm:p-7 backdrop-blur-xl shadow-[0_1px_4px_-1px_rgba(58,42,34,0.04),0_14px_34px_-24px_rgba(58,42,34,0.16)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-orange-glow/[0.07] blur-3xl"
                />
                <div className="relative">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-glow" />
                    <span className="font-mono text-micro-xs tracking-editorial text-brown-deep/70 uppercase font-bold">
                      Soliva Promise
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {solivaPromise.map(({ icon: Icon, text }, i) => (
                      <motion.div
                        key={text}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: isMobile ? 0.32 : 0.5,
                          delay: i * (isMobile ? 0.04 : 0.07),
                          ease: ease.luxe,
                        }}
                        className={`flex items-center gap-3 rounded-2xl border border-[#3a2a22]/[0.06] bg-white/55 px-3.5 py-3 transition-[transform,box-shadow,background-color] duration-500 hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-[0_12px_26px_-16px_rgba(58,42,34,0.3)] ${
                          i === solivaPromise.length - 1 && solivaPromise.length % 2 === 1
                            ? "sm:col-span-2"
                            : ""
                        }`}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-glow/[0.08] text-orange-glow">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-[0.82rem] font-light leading-snug text-brown-deep">
                          {text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SECTION D: Payment */}
            <motion.div custom={4} variants={reveal} initial="hidden" animate="visible">
              <CheckoutCard active={expandedSection === 3}>
                <SectionHeader
                  number="04"
                  title="Payment"
                  subtitle="Choose your preferred payment method securely."
                  expanded={expandedSection === 3}
                  onToggle={() => toggleSection(3)}
                  complete={!!activePayment}
                />
                <AnimatePresence initial={false}>
                  {expandedSection === 3 && (
                    <Expand>
                      <div className="pt-6 sm:pt-8 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {paymentMethods.map((m) => (
                            <PaymentMethodCard
                              key={m.id}
                              method={m}
                              selected={activePayment === m.id}
                              onSelect={() => {
                                setActivePayment(m.id);
                                if (m.id === "upi") {
                                  setTimeout(() => upiInputRef.current?.focus(), 200);
                                }
                              }}
                            />
                          ))}
                        </div>

                        <AnimatePresence>
                          {activePayment === "upi" && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease: ease.luxe }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 rounded-2xl bg-white/40 border border-white/60 backdrop-blur-sm p-5 space-y-3">
                                <label className="block font-mono text-micro-xs tracking-eyebrow text-ink-muted uppercase font-bold">
                                  Your UPI ID
                                </label>
                                <input
                                  ref={upiInputRef}
                                  type="text"
                                  value={upiId}
                                  onChange={(e) => setUpiId(e.target.value)}
                                  placeholder="name@paytm"
                                  className="w-full rounded-xl border border-line-soft bg-white/70 px-5 py-3.5 text-sm text-brown-deep font-light placeholder:text-ink-muted/40 focus:outline-none focus:border-orange-glow/40 focus:shadow-[0_0_0_3px_rgba(245,130,13,0.08)] transition-all duration-500"
                                />
                                <div className="flex items-center gap-3 pt-1">
                                  {["GPay", "PhonePe", "Paytm"].map((app) => (
                                    <span
                                      key={app}
                                      className="px-3 py-1.5 rounded-full bg-white/60 border border-white/70 text-micro-xs font-mono tracking-cta text-ink-muted uppercase font-bold"
                                    >
                                      {app}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Expand>
                  )}
                </AnimatePresence>
              </CheckoutCard>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              custom={5}
              variants={reveal}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap items-center justify-center gap-2.5 py-3 sm:py-5"
            >
              {[
                { icon: ShieldCheck, text: "256-bit SSL" },
                { icon: Lock, text: "Razorpay Secured" },
                { icon: Truck, text: "Free Shipping" },
                { icon: RotateCcw, text: "Easy Returns" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 rounded-full border border-[#3a2a22]/[0.07] bg-[#fdfbf8]/55 px-3.5 py-1.5 text-ink-muted/75 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-orange-glow/65" />
                  <span className="font-mono text-micro-xs tracking-cta uppercase font-semibold">
                    {text}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT COLUMN — Order Summary (Section C) */}
          <motion.div
            custom={1}
            variants={reveal}
            initial="hidden"
            animate="visible"
            className="w-full lg:w-[380px] xl:w-[420px] shrink-0"
          >
            <div className="lg:sticky lg:top-28">
              <div className="rounded-[1.75rem] bg-[#fdfbf8]/90 border border-[#3a2a22]/[0.08] p-6 sm:p-7 backdrop-blur-xl shadow-[0_2px_8px_-2px_rgba(58,42,34,0.05),0_30px_60px_-28px_rgba(58,42,34,0.28)]">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-glow" />
                  <span className="font-mono text-micro-xs tracking-editorial text-brown-deep/70 uppercase font-bold">
                    Order Summary
                  </span>
                  <span className="ml-auto font-mono text-micro-xs tracking-cta text-ink-muted/50 uppercase">
                    {totalUnits} {totalUnits === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="space-y-5">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4">
                      <div className="h-24 w-[76px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FBF6F0] via-[#F3ECE2] to-[#E7D8C4] border border-[#3a2a22]/[0.07] shadow-[0_8px_20px_-12px_rgba(58,42,34,0.35)]">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <p className="text-sm text-brown-deep font-medium leading-snug">{item.name}</p>
                          <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-orange-glow/[0.1] px-2 py-[3px] font-mono text-[0.56rem] tracking-[0.14em] uppercase font-bold text-[#c76600]">
                            <Sparkles className="h-2.5 w-2.5" /> Launch Price
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-0 rounded-full border border-line-soft bg-white/60">
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="h-7 w-7 flex items-center justify-center text-ink-muted hover:text-brown-deep transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-micro-sm font-mono font-bold text-brown-deep">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="h-7 w-7 flex items-center justify-center text-ink-muted hover:text-brown-deep transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex flex-col items-end leading-none">
                            <span className="font-mono text-sm text-brown-deep font-semibold">
                              ₹{(LAUNCH_MRP_PER_UNIT * item.quantity).toLocaleString("en-IN")}
                            </span>
                            <span className="mt-1 font-mono text-micro-xs text-[#c76600] font-bold">
                              −₹{((LAUNCH_MRP_PER_UNIT - item.price) * item.quantity).toLocaleString("en-IN")} off
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-6 h-px bg-gradient-to-r from-transparent via-line-soft to-transparent" />

                <div className="space-y-3.5">
                  {savings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-ink-muted font-light">
                        <Sparkles className="h-3.5 w-3.5 text-[#c76600]" /> Savings
                      </span>
                      <span className="font-mono font-bold text-[#c76600]">
                        −₹{savings.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted font-light">Subtotal</span>
                    <span className="text-brown-deep font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="shrink-0 text-ink-muted font-light">Shipping</span>
                    {shipTo ? (
                      <span className="text-right font-mono text-micro-sm leading-snug text-brown-deep">
                        FREE · {shipTo}
                      </span>
                    ) : (
                      <span className="text-orange-glow font-mono text-micro-sm tracking-cta uppercase font-bold">
                        Free
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted font-light">GST</span>
                    <span className="text-ink-muted font-mono">Included</span>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between rounded-2xl border border-[#3a2a22]/[0.07] bg-[#3a2a22]/[0.025] px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-micro-xs tracking-editorial text-brown-deep uppercase font-black">
                      Total
                    </span>
                    <span className="mt-1 font-mono text-micro-xs tracking-cta text-ink-muted uppercase font-bold">
                      Incl. all taxes
                    </span>
                  </div>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={total}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35, ease: ease.luxe }}
                      className="font-display text-[2.35rem] leading-none text-brown-deep tracking-tight"
                    >
                      ₹{total.toLocaleString("en-IN")}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Phase 7 — trust block directly above the CTA */}
                <div className="mt-5 grid grid-cols-1 gap-1.5">
                  {payTrust.map((t) => (
                    <div key={t} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-orange-glow" />
                      <span className="text-[0.78rem] font-light text-brown-deep/80">{t}</span>
                    </div>
                  ))}
                </div>

                {/* Phase 8 — premium CTA */}
                <motion.button
                  whileHover={!paying ? { scale: 1.01 } : {}}
                  whileTap={!paying ? { scale: 0.98 } : {}}
                  onClick={handlePay}
                  disabled={paying}
                  className="mt-6 w-full rounded-2xl bg-gradient-to-b from-[#4a3a32] to-[#3a2a22] py-[18px] text-white font-mono text-micro-sm tracking-cta uppercase font-bold shadow-[0_10px_28px_-12px_rgba(58,42,34,0.5)] hover:shadow-[0_16px_40px_-12px_rgba(58,42,34,0.55)] transition-all duration-500 disabled:cursor-wait disabled:opacity-90"
                >
                  {paying ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      {stageLabel}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="h-3.5 w-3.5" />
                      Proceed To Secure Payment
                    </span>
                  )}
                </motion.button>

                {!isReadyToPay && !paying && (
                  <p className="mt-3 text-center text-[0.72rem] font-light text-ink-muted/70">
                    Complete your details above — we'll point you to anything missing.
                  </p>
                )}

                <TermsAndConditions variant="light" className="mt-4 text-center" />
              </div>

              {/* Trust & reassurance */}
              <div className="mt-5 rounded-[1.5rem] border border-[#3a2a22]/[0.07] bg-[#fdfbf8]/75 p-5 backdrop-blur-xl shadow-[0_1px_4px_-1px_rgba(58,42,34,0.04),0_14px_34px_-26px_rgba(58,42,34,0.16)]">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-glow" />
                  <span className="font-mono text-micro-xs tracking-editorial text-brown-deep/70 uppercase font-bold">
                    Soliva Assurance
                  </span>
                </div>
                <div className="space-y-2.5">
                  {trustPoints.map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-3 rounded-xl border border-[#3a2a22]/[0.05] bg-white/50 px-3.5 py-2.5 transition-[transform,background-color] duration-500 hover:bg-white/80"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-glow/[0.09] text-orange-glow">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[0.82rem] font-light leading-snug text-brown-deep">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 lg:hidden z-50">
        <div className="bg-[#fdfbf8]/90 backdrop-blur-xl border-t border-[#3a2a22]/[0.08] shadow-[0_-12px_30px_-18px_rgba(58,42,34,0.25)] px-4 pt-3 pb-3 safe-x safe-bottom">
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-micro-xs tracking-cta text-ink-muted uppercase font-bold">Total</span>
              <span className="font-mono text-micro-xs text-ink-muted/40 uppercase">incl. taxes</span>
            </div>
            <span className="font-display text-2xl text-brown-deep tracking-tight">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full rounded-2xl bg-gradient-to-b from-[#4a3a32] to-[#3a2a22] py-4 text-white font-mono text-micro-sm tracking-cta uppercase font-bold shadow-[0_10px_26px_-12px_rgba(58,42,34,0.5)] disabled:opacity-90 disabled:cursor-wait transition-all duration-500"
          >
            {paying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> {stageLabel}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-3.5 w-3.5" /> Proceed To Secure Payment
              </span>
            )}
          </button>
        </div>
      </div>

      <PaymentProcessingOverlay
        open={stage === "connect" || stage === "verify"}
        label={
          stage === "connect"
            ? "Opening Razorpay's secure window — please complete your payment there."
            : undefined
        }
      />

      {/* Phase 10 — payment failure screen */}
      <PaymentFailedCard
        open={stage === "failed"}
        message={payError}
        onRetry={retryPayment}
        onBackToCart={() => {
          setStage("idle");
          navigate({ to: "/cart" });
        }}
        onClose={() => setStage("idle")}
      />

      <UnsavedChangesGuard when={formDirty} />

      {/* Add a new address without leaving checkout */}
      <AddressFormModal
        open={addAddrOpen}
        onClose={() => setAddAddrOpen(false)}
        title="Add Address"
        initial={{
          fullName: form.fullName,
          phone: form.phone,
        }}
        saving={addAddressMut.isPending}
        onSubmit={async (data) => {
          try {
            const created: any = await addAddressMut.mutateAsync(data);
            const newId = created?.data?.address?._id ?? created?.data?.address?.id;
            if (newId) {
              setSelectedAddressId(newId);
              setAddressMode("saved");
            }
            setAddAddrOpen(false);
          } catch {
            /* mutation surfaces its own error; keep modal open */
          }
        }}
      />
    </div>
  );
}

/* ════════ SUB-COMPONENTS ════════ */

function Expand({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.5, ease: ease.luxe }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

function ContinueButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="pt-2">
      <button
        onClick={() => !disabled && onClick()}
        disabled={disabled}
        className="w-full rounded-2xl bg-gradient-to-b from-[#4a3a32] to-[#3a2a22] py-4 text-white font-mono text-micro-sm tracking-cta uppercase font-bold shadow-[0_8px_22px_-12px_rgba(58,42,34,0.5)] hover:shadow-[0_12px_30px_-12px_rgba(58,42,34,0.55)] transition-all duration-500 disabled:from-[#3a2a22]/25 disabled:to-[#3a2a22]/25 disabled:text-white/60 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {label}
      </button>
    </div>
  );
}

function CheckoutSteps({
  expandedSection,
  states,
  onJump,
}: {
  expandedSection: number;
  states: boolean[];
  onJump: (i: number) => void;
}) {
  const labels = ["Contact", "Order Type", "Delivery", "Payment"];
  return (
    <div className="flex items-start">
      {labels.map((label, i) => {
        const done = states[i];
        const active = expandedSection === i;
        const state = done ? "done" : active ? "active" : "upcoming";
        return (
          <Fragment key={label}>
            <button type="button" onClick={() => onJump(i)} className="flex shrink-0 flex-col items-center gap-2.5">
              <span
                className={`grid h-10 w-10 place-items-center rounded-full font-mono text-micro-sm font-bold tracking-tight transition-all duration-500 ${
                  state === "done"
                    ? "bg-orange-glow text-white shadow-[0_6px_16px_-5px_rgba(245,130,13,0.55)]"
                    : state === "active"
                      ? "bg-brown-deep text-white shadow-[0_6px_16px_-6px_rgba(58,42,34,0.5)] ring-4 ring-brown-deep/[0.08]"
                      : "bg-[#fdfbf8]/80 text-ink-muted/70 ring-1 ring-inset ring-[#3a2a22]/12"
                }`}
              >
                {state === "done" ? <Check className="h-4 w-4" /> : `0${i + 1}`}
              </span>
              <span
                className={`font-mono text-micro-xs tracking-cta uppercase font-bold transition-colors duration-500 ${
                  state === "upcoming" ? "text-ink-muted/45" : "text-brown-deep"
                }`}
              >
                {label}
              </span>
            </button>
            {i < labels.length - 1 && (
              <div className="mx-2 mt-5 h-px flex-1 overflow-hidden rounded-full bg-[#3a2a22]/[0.10] sm:mx-3">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-glow to-[#c76600]"
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  style={{ transformOrigin: "left" }}
                  transition={{ duration: 0.7, ease: ease.luxe }}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function CheckoutCard({ active = false, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-[1.75rem] border bg-[#fdfbf8]/85 p-6 sm:p-7 backdrop-blur-xl transition-[box-shadow,border-color,background-color] duration-700 ${
        active
          ? "border-[#3a2a22]/[0.10] bg-[#fdfbf8]/92 shadow-[0_2px_6px_-2px_rgba(58,42,34,0.05),0_24px_50px_-26px_rgba(58,42,34,0.22)]"
          : "border-[#3a2a22]/[0.06] shadow-[0_1px_4px_-1px_rgba(58,42,34,0.04),0_14px_34px_-24px_rgba(58,42,34,0.16)]"
      }`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  number,
  title,
  subtitle,
  expanded,
  onToggle,
  complete,
}: {
  number: string;
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  complete: boolean;
}) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 group">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-micro-sm font-mono font-bold tracking-tight transition-all duration-500 ${
            complete
              ? "bg-orange-glow text-white shadow-[0_4px_12px_-3px_rgba(245,130,13,0.5)]"
              : expanded
                ? "bg-brown-deep text-white shadow-[0_4px_12px_-4px_rgba(58,42,34,0.45)]"
                : "bg-[#3a2a22]/[0.05] text-ink-muted/70 ring-1 ring-inset ring-[#3a2a22]/10"
          }`}
        >
          {complete ? <Check className="h-4 w-4" /> : number}
        </div>
        <div className="min-w-0 text-left">
          <h3
            className={`font-display text-lg sm:text-xl tracking-tight transition-colors duration-500 ${
              expanded || complete ? "text-brown-deep" : "text-brown-deep/55"
            }`}
          >
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-[0.78rem] font-light text-ink-muted/70">{subtitle}</p>
          )}
        </div>
      </div>
      <motion.div
        animate={{ rotate: expanded ? 180 : 0 }}
        transition={{ duration: 0.4, ease: ease.luxe }}
        className="grid h-7 w-7 place-items-center rounded-full transition-colors duration-500 group-hover:bg-[#3a2a22]/[0.04]"
      >
        <ChevronDown className="h-4 w-4 text-ink-muted/50 group-hover:text-ink-muted transition-colors" />
      </motion.div>
    </button>
  );
}

function LuxField({
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  inputMode,
  error,
  verified,
  verifiedLabel,
  locked,
  onEdit,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  error?: string;
  verified?: boolean;
  verifiedLabel?: string;
  locked?: boolean;
  onEdit?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;
  const hasError = !!error;
  const showSuccess = !hasError && !!value && !locked;

  return (
    <div className="relative">
      <motion.label
        animate={{ y: active ? -22 : 0, scale: active ? 0.74 : 1, opacity: active ? 0.9 : 0.5 }}
        transition={{ duration: 0.25, ease: ease.luxe }}
        className={`absolute left-5 top-[15px] origin-left font-mono text-micro-sm tracking-cta uppercase font-bold pointer-events-none transition-colors duration-500 ${
          hasError ? "text-red-500/80" : focused ? "text-orange-glow" : "text-ink-muted"
        }`}
      >
        {label}
      </motion.label>

      <div className="relative">
        <input
          id={`field-${name}`}
          type={type}
          inputMode={inputMode}
          value={value}
          readOnly={locked}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholder={active ? placeholder : ""}
          className={`w-full rounded-2xl border bg-white/70 px-5 pt-[22px] pb-2.5 pr-12 text-[0.95rem] text-brown-deep font-normal placeholder:text-ink-muted/35 focus:outline-none transition-all duration-500 ${
            locked ? "cursor-default bg-white/55" : ""
          } ${
            hasError
              ? "border-red-400/50 bg-red-50/40 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.08)]"
              : focused
                ? "border-orange-glow/50 bg-white/90 shadow-[0_0_0_4px_rgba(245,130,13,0.09),0_6px_18px_-10px_rgba(245,130,13,0.3)]"
                : "border-[#3a2a22]/[0.09] hover:border-[#3a2a22]/20 hover:bg-white/80"
          }`}
        />

        {/* Right-side adornment: verified/edit/success */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          {verified && locked ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1 text-ink-muted/60 hover:text-brown-deep transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : showSuccess ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : null}
        </div>
      </div>

      {/* Verified badge */}
      {verified && verifiedLabel && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/[0.1] px-2 py-[3px] font-mono text-[0.58rem] tracking-[0.12em] uppercase font-bold text-emerald-600">
            <BadgeCheck className="h-3 w-3" /> {verifiedLabel}
          </span>
          {locked && <span className="text-[0.68rem] font-light text-ink-muted/55">Tap edit to change</span>}
        </div>
      )}

      {/* Inline error */}
      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 flex items-center gap-1.5 text-[0.74rem] font-medium text-red-500"
          >
            <AlertTriangle className="h-3 w-3 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function LuxTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block font-mono text-micro-xs tracking-cta uppercase font-bold text-ink-muted">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none rounded-2xl border border-[#3a2a22]/[0.09] bg-white/70 px-5 py-3.5 text-[0.95rem] text-brown-deep font-normal placeholder:text-ink-muted/35 focus:outline-none focus:border-orange-glow/50 focus:bg-white/90 focus:shadow-[0_0_0_4px_rgba(245,130,13,0.09)] transition-all duration-500"
      />
    </div>
  );
}

function OrderTypeOption({
  icon: Icon,
  title,
  sub,
  selected,
  onSelect,
}: {
  icon: typeof User;
  title: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      onClick={onSelect}
      className={`relative flex items-start gap-3.5 rounded-2xl p-4 text-left transition-all duration-500 ${
        selected
          ? "bg-orange-glow/[0.06] border-2 border-orange-glow/45 shadow-[0_8px_24px_-10px_rgba(245,130,13,0.28)]"
          : "bg-white/55 border border-[#3a2a22]/[0.08] hover:bg-white/80 hover:border-[#3a2a22]/15"
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-500 ${
          selected ? "bg-orange-glow/[0.12] text-orange-glow" : "bg-[#3a2a22]/[0.05] text-ink-muted/60"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${selected ? "text-brown-deep" : "text-ink-muted"}`}>{title}</p>
        <p className="mt-0.5 text-[0.74rem] font-light text-ink-muted/60">{sub}</p>
      </div>
      <span
        className={`absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full border-2 transition-all duration-300 ${
          selected ? "border-orange-glow bg-orange-glow" : "border-[#3a2a22]/20"
        }`}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </span>
    </motion.button>
  );
}

function PaymentMethodCard({
  method,
  selected,
  onSelect,
}: {
  method: { id: string; label: string; sub: string; icon: typeof Smartphone };
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = method.icon;
  return (
    <motion.button
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      onClick={onSelect}
      className={`relative rounded-2xl p-4 sm:p-5 text-left transition-all duration-500 ${
        selected
          ? "bg-orange-glow/[0.06] border-2 border-orange-glow/45 shadow-[0_8px_24px_-10px_rgba(245,130,13,0.28)]"
          : "bg-white/55 border border-[#3a2a22]/[0.08] hover:bg-white/80 hover:border-[#3a2a22]/15"
      }`}
    >
      {selected && (
        <motion.div
          layoutId="payment-check"
          className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-orange-glow flex items-center justify-center"
          transition={{ duration: 0.3, ease: ease.luxe }}
        >
          <Check className="h-3 w-3 text-white" />
        </motion.div>
      )}
      <Icon
        className={`h-5 w-5 mb-3 transition-colors duration-500 ${selected ? "text-orange-glow" : "text-ink-muted/50"}`}
      />
      <p className={`text-sm font-medium transition-colors duration-500 ${selected ? "text-brown-deep" : "text-ink-muted"}`}>
        {method.label}
      </p>
      <p className="text-micro-xs text-ink-muted/50 font-mono mt-0.5">{method.sub}</p>
    </motion.button>
  );
}

function PaymentFailedCard({
  open,
  message,
  onRetry,
  onBackToCart,
  onClose,
}: {
  open: boolean;
  message: string | null;
  onRetry: () => void;
  onBackToCart: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="alertdialog"
          aria-live="assertive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[1000] grid place-items-center p-5"
        >
          <div className="absolute inset-0 bg-[#3a2a22]/55 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[420px] rounded-[26px] border border-black/5 bg-[#FAF7F3] p-8 text-center shadow-[0_30px_80px_-30px_rgba(58,42,34,0.55)]"
          >
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/12 text-red-500">
              <AlertTriangle size={24} strokeWidth={2} />
            </div>
            <h3 className="font-display text-2xl tracking-tight text-[#3a2a22]">Payment Failed</h3>
            <p className="mx-auto mt-2.5 max-w-[320px] text-[0.92rem] font-light leading-relaxed text-[#7b6a5f]">
              {message || "Something went wrong while processing your payment. No money was deducted — please try again."}
            </p>

            <div className="mt-7 space-y-3">
              <button
                onClick={onRetry}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#4a3a32] to-[#3a2a22] py-4 text-white font-mono text-micro-sm tracking-cta uppercase font-bold shadow-[0_10px_28px_-12px_rgba(58,42,34,0.5)] transition-all duration-500 hover:shadow-[0_16px_40px_-12px_rgba(58,42,34,0.55)]"
              >
                <RefreshCw className="h-4 w-4" /> Retry Payment
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onBackToCart}
                  className="rounded-2xl border border-[#3a2a22]/12 bg-white/60 py-3.5 font-mono text-micro-xs tracking-cta uppercase font-bold text-brown-deep transition-all duration-500 hover:bg-white"
                >
                  Back To Cart
                </button>
                <a
                  href="mailto:support@solivaguard.com?subject=Checkout%20Payment%20Issue"
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#3a2a22]/12 bg-white/60 py-3.5 font-mono text-micro-xs tracking-cta uppercase font-bold text-brown-deep transition-all duration-500 hover:bg-white"
                >
                  <LifeBuoy className="h-3.5 w-3.5" /> Support
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
