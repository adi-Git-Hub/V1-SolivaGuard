import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useGoogleAuth } from "../api";

/** Multicolour Google "G" — crisp at any size, no external asset. */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className={className}>
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7954 2.7164v2.2581h2.9087c1.7018-1.5668 2.6831-3.874 2.6831-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8595-3.0477.8595-2.344 0-4.3282-1.5831-5.0364-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.9636 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.9636 10.71z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9636 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"
      />
    </svg>
  );
}

interface GoogleAuthButtonProps {
  /** Where to send the user after a successful sign-in. Defaults to home. */
  redirectTo?: string;
  /** Override the button label. */
  label?: string;
  className?: string;
}

/**
 * Premium "Continue with Google" button. Runs the Firebase popup, exchanges the
 * ID token for a Soliva session, then redirects with a welcome toast.
 * Reusable across Register and Login.
 */
export function GoogleAuthButton({
  redirectTo = "/",
  label = "Continue with Google",
  className = "",
}: GoogleAuthButtonProps) {
  const navigate = useNavigate();
  const googleAuth = useGoogleAuth();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const { signInWithGooglePopup } = await import("@/lib/firebase");
      const idToken = await signInWithGooglePopup();
      await googleAuth.mutateAsync(idToken);
      toast.success("Welcome to Soliva");
      navigate({ to: redirectTo });
    } catch (err) {
      // User closing the popup is not a real error — stay quiet.
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }
      toast.error(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
      aria-label={label}
      className={
        "group flex w-full cursor-pointer items-center justify-center gap-3 rounded-md " +
        "border border-[#E8D7C8] bg-white/70 px-4 py-3 text-sm font-medium text-[#3a2a22] " +
        "shadow-[0_2px_10px_-4px_rgba(58,42,34,0.15)] backdrop-blur-sm " +
        "transition-all duration-300 ease-out " +
        "hover:-translate-y-0.5 hover:border-[#dcc6b3] hover:bg-white " +
        "hover:shadow-[0_14px_34px_-14px_rgba(199,102,0,0.28)] " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c76600]/30 " +
        "disabled:cursor-not-allowed disabled:opacity-70 " +
        className
      }
    >
      {loading ? (
        <>
          <Loader2 className="h-[18px] w-[18px] animate-spin text-[#3a2a22]/70" />
          <span>Connecting…</span>
        </>
      ) : (
        <>
          <GoogleIcon className="h-[18px] w-[18px] shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
