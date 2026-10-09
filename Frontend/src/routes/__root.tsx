import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { TopProgressBar } from "@/design-system/loading/TopProgressBar";
import { IntroLoader } from "@/components/IntroLoader";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { appLoader } from "@/design-system";

import appCss from "../styles.css?url";
// Mobile-only stylesheet — loaded AFTER appCss so its media-query rules win.
import mobileCss from "../styles/mobile.css?url";

// Pre-hydration: if the loader has already played this session, set a flag on
// <html> before the body paints. The CSS rule below uses it to hide the SSR'd
// intro overlay synchronously, preventing a one-frame flash on return visits.
const introGateScript = `try{if(sessionStorage.getItem(${JSON.stringify(
  appLoader.seenKey,
)})==="1"){document.documentElement.setAttribute("data-soliva-intro","hide")}}catch(e){}`;

// Paint the brand background BEFORE any CSS loads so a slow first paint
// doesn't show a black/white flash. Also keep the pre-hydration intro-gate
// rule that hides the SSR'd overlay for return visitors.
const introGateStyle = `html,body{background:#f7f3ee;color:#3a2a22}body{background-image:url('/luxury-bg.webp');background-size:cover;background-position:center}@keyframes soliva-reveal{from{opacity:0}to{opacity:1}}html:not([data-soliva-intro="hide"])::after{content:"";position:fixed;inset:0;z-index:99;background:#0D0F11;pointer-events:none;animation:soliva-reveal .5s ease-out both}html:not([data-soliva-intro="hide"]) [data-soliva-intro-root]{animation:soliva-reveal .5s ease-out both}html[data-soliva-intro="hide"] [data-soliva-intro-root]{display:none!important}html[data-soliva-intro="hide"]::after{display:none!important}`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SOLIVA SUNWRAP — Luxury Sun Protection" },
      {
        name: "description",
        content: "Thoughtful sun protection, engineered for everyday movement.",
      },
      { name: "author", content: "Soliva" },
      { property: "og:title", content: "SOLIVA SUNWRAP — Luxury Sun Protection" },
      {
        property: "og:description",
        content: "Thoughtful sun protection, engineered for everyday movement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@SolivaGuard" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap",
      },
      // Favicon — icon variant of the Soliva mark.
      {
        rel: "icon",
        type: "image/png",
        href: "/" + encodeURIComponent("soliva details (18 x 24 in).webp"),
      },
      {
        rel: "apple-touch-icon",
        href: "/" + encodeURIComponent("soliva details (18 x 24 in).webp"),
      },
      { rel: "preload", as: "image", href: "/new_BG.webp" },
      { rel: "preload", as: "image", href: "/luxury-bg.webp" },
      { rel: "preload", as: "image", href: "/hero-image.webp" },
      {
        rel: "preload",
        as: "image",
        href: "/" + encodeURIComponent("soliva logo_high resolution.webp"),
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      // Mobile layer last → wins the cascade on phones (desktop ignores it).
      {
        rel: "stylesheet",
        href: mobileCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  // introGateScript sets data-soliva-intro on <html> before hydration to
  // prevent the return-visitor intro flash. That intentional pre-hydration DOM
  // mutation triggers a React hydration-mismatch warning on <html>;
  // suppressHydrationWarning silences it (scoped to this element only).
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: introGateStyle }} />
        <script dangerouslySetInnerHTML={{ __html: introGateScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsTracker />
      <TopProgressBar />
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
      <IntroLoader />
    </QueryClientProvider>
  );
}
