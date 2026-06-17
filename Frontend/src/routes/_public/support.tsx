import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  MessageSquare, 
  Package, 
  Truck, 
  HelpCircle,
  CheckCircle2,
  Paperclip,
  Loader2,
  Plus,
  X
} from "lucide-react";
import { useSession } from "@/features/auth/hooks/useSession";
import { env } from "@/config/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  slideUp, 
  staggerParent, 
  slideUpBlur, 
  slideUpStrong, 
  viewportOnce 
} from "@/design-system";

export const Route = createFileRoute("/_public/support")({
  component: SupportPage,
});

const SUPPORT_CARDS = [
  {
    icon: Package,
    title: "Order Assistance",
    description: "Need help with an existing order?",
  },
  {
    icon: HelpCircle,
    title: "Product Guidance",
    description: "Questions about SunWrap sizing, usage or care?",
  },
  {
    icon: Truck,
    title: "Delivery Support",
    description: "Track, update or resolve shipping issues.",
  },
  {
    icon: MessageSquare,
    title: "General Assistance",
    description: "Anything else? Our team is happy to help.",
  },
];

const ISSUE_CATEGORIES = [
  "Product Issue",
  "Delivery Issue",
  "Damaged Item",
  "Wrong Item Received",
  "Return Request",
  "Refund Request",
  "Account Issue",
  "Payment Issue",
  "Technical Website Issue",
  "Partnership Inquiry",
  "General Question",
  "Other",
];

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      <div style={{ transform: "translateZ(50px)" }}>{children}</div>
    </motion.div>
  );
}

function SuccessState() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-luxury-beige px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[2.5rem] bg-white p-12 text-center shadow-2xl shadow-brown-deep/5"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
          className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-accent-faint"
        >
          <CheckCircle2 className="h-10 w-10 text-orange-glow" />
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-brown-deep">Message Sent Successfully</h2>
        <p className="mt-4 text-ink-soft">
          Thank you for contacting Soliva.<br />
          Our team will review your request and get back to you soon.
        </p>
        <div className="mt-10 flex flex-col gap-3">
          <Button asChild className="rounded-full bg-brown-deep py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-brown">
            <Link to="/">Return Home</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full border-line-soft py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-brown-deep hover:bg-surface-muted">
            <Link to="/collection">Continue Shopping</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function SupportPage() {
  const session = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", session?.user?.name || guestName);
      fd.append("email", session?.user?.email || guestEmail);
      fd.append("subject", subject);
      fd.append("category", category);
      fd.append("message", message);
      files.forEach((f) => fd.append("attachments", f));

      const res = await fetch(`${env.VITE_API_URL}/contact/feedback`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not send your feedback");
      }
      setIsSuccess(true);
      toast.success("Your feedback reached us successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (isSuccess) {
    return <SuccessState />;
  }

  return (
    <div className="min-h-screen bg-luxury-beige pt-32 pb-24 lg:pt-40">
      <div className="container mx-auto max-w-7xl px-6">
        {/* Hero Section */}
        <motion.div 
          variants={staggerParent}
          initial="hidden"
          animate="visible"
          className="mb-20 text-center"
        >
          <motion.span 
            variants={slideUp}
            className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.4em] text-orange-glow"
          >
            SUPPORT CENTER
          </motion.span>
          <motion.h1 
            variants={slideUpBlur}
            className="mt-4 font-display text-5xl font-bold tracking-tight text-brown-deep md:text-7xl"
          >
            We're Here To <span className="text-orange-glow">Help.</span>
          </motion.h1>
          <motion.p 
            variants={slideUp}
            className="mx-auto mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-ink-soft"
          >
            Questions, orders, delivery updates, product concerns, or account assistance — our team is ready to help.
          </motion.p>
        </motion.div>

        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* LEFT SIDE: Support Information */}
          <motion.div 
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
          >
            {SUPPORT_CARDS.map((card) => (
              <TiltCard 
                key={card.title}
                className="group relative overflow-hidden rounded-[2rem] border border-line-hairline bg-white/40 p-8 backdrop-blur-md transition-all hover:border-orange-glow/20 hover:shadow-xl hover:shadow-orange-glow/5"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform duration-500 group-hover:scale-110">
                  <card.icon className="h-6 w-6 text-orange-glow" />
                </div>
                <h3 className="font-display text-lg font-bold text-brown-deep">{card.title}</h3>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-soft">{card.description}</p>
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-glow/5 blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />
              </TiltCard>
            ))}
          </motion.div>

          {/* RIGHT SIDE: Support Form */}
          <motion.div
            variants={slideUpStrong}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-brown-deep/5 md:p-12"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Form Fields: Name & Email */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">Name</Label>
                  <Input 
                    value={session?.user?.name || guestName} 
                    onChange={(e) => setGuestName(e.target.value)}
                    readOnly={!!session?.user?.name} 
                    placeholder="Your Name"
                    required
                    className={`h-14 rounded-2xl border-line-hairline text-[0.9rem] focus:ring-orange-glow/20 ${session?.user?.name ? "bg-surface-muted" : "bg-transparent"}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">Email</Label>
                  <Input 
                    value={session?.user?.email || guestEmail} 
                    onChange={(e) => setGuestEmail(e.target.value)}
                    readOnly={!!session?.user?.email} 
                    type="email"
                    placeholder="Your Email"
                    required
                    className={`h-14 rounded-2xl border-line-hairline text-[0.9rem] focus:ring-orange-glow/20 ${session?.user?.email ? "bg-surface-muted" : "bg-transparent"}`}
                  />
                </div>
              </div>

              {/* Order Number & Issue Category */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">Order Number (optional)</Label>
                  <Input 
                    placeholder="Enter order number" 
                    className="h-14 rounded-2xl border-line-hairline bg-transparent text-[0.9rem] placeholder:text-ink-disabled focus:ring-orange-glow/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">Issue Category</Label>
                  <Select onValueChange={setCategory} required>
                    <SelectTrigger className="h-14 rounded-2xl border-line-hairline bg-transparent text-[0.9rem] focus:ring-orange-glow/20">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-line-soft bg-white/95 backdrop-blur-xl">
                      {ISSUE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')} className="rounded-xl py-3 focus:bg-accent-faint focus:text-brown-deep">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">Subject</Label>
                <Input
                  placeholder="Brief summary of your issue"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-14 rounded-2xl border-line-hairline bg-transparent text-[0.9rem] placeholder:text-ink-disabled focus:ring-orange-glow/20"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">Message</Label>
                <Textarea
                  placeholder="Tell us how we can help..."
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[160px] resize-none rounded-2xl border-line-hairline bg-transparent p-5 text-[0.9rem] placeholder:text-ink-disabled focus:ring-orange-glow/20"
                />
              </div>

              {/* Attachment Support */}
              <div className="space-y-4">
                <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">Attachments</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line-hairline py-10 transition-colors hover:border-orange-glow/30 hover:bg-orange-glow/[0.02]"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted transition-transform group-hover:scale-110">
                    <Plus className="h-5 w-5 text-ink-muted" />
                  </div>
                  <p className="mt-3 text-[0.8rem] font-medium text-ink-muted group-hover:text-brown-deep">
                    Click or drag files to upload
                  </p>
                  <p className="mt-1 text-[0.65rem] text-ink-muted/60">
                    JPG, PNG, PDF supported
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-full bg-surface-muted px-4 py-2 text-[0.75rem] text-brown-deep">
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="ml-1 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="relative w-full overflow-hidden rounded-full bg-brown-deep py-8 text-[11px] font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-brown active:scale-[0.98] disabled:opacity-70"
              >
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div 
                      key="sending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-bold tracking-[0.3em]"
                    >
                      Sending...
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="send"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Send Message
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Thin premium progress bar — No spinner per requirement */}
                {isSubmitting && (
                  <motion.div 
                    layoutId="progress-bar"
                    className="absolute bottom-0 left-0 h-[3px] bg-orange-glow"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                  />
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
