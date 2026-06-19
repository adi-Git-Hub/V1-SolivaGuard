import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * PixelTransition — ReactBits component (https://reactbits.dev).
 * Core pixel-stagger animation logic kept intact; only sizing is adapted to
 * fill its parent and the content layers are toggled (firstContent →
 * secondContent) so transparent, typography-only content doesn't overlap.
 */
interface PixelTransitionProps {
  firstContent: React.ReactNode;
  secondContent: React.ReactNode;
  gridSize?: number;
  pixelColor?: string;
  animationStepDuration?: number;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export function PixelTransition({
  firstContent,
  secondContent,
  gridSize = 7,
  pixelColor = "currentColor",
  animationStepDuration = 0.3,
  className = "",
  style = {},
  ariaLabel = "Reveal",
}: PixelTransitionProps) {
  const pixelGridRef = useRef<HTMLDivElement>(null);
  const delayedCallRef = useRef<ReturnType<typeof gsap.delayedCall> | null>(null);
  const [isActive, setIsActive] = useState(false);
  // Which layer is shown — flipped AFTER the pixels cover (driven by React state
  // so it survives re-renders; imperative DOM styles get reset on re-render).
  const [showSecond, setShowSecond] = useState(false);

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0);

  // Build the pixel grid once per gridSize/colour change.
  useEffect(() => {
    const pixelGridEl = pixelGridRef.current;
    if (!pixelGridEl) return;
    pixelGridEl.innerHTML = "";
    const size = 100 / gridSize;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pixel = document.createElement("div");
        pixel.classList.add("pixel-transition__pixel");
        pixel.style.position = "absolute";
        pixel.style.display = "none";
        pixel.style.backgroundColor = pixelColor;
        pixel.style.width = `${size}%`;
        pixel.style.height = `${size}%`;
        pixel.style.left = `${col * size}%`;
        pixel.style.top = `${row * size}%`;
        pixelGridEl.appendChild(pixel);
      }
    }
  }, [gridSize, pixelColor]);

  // ── ReactBits core animation (unchanged) ──
  const animatePixels = (activate: boolean) => {
    setIsActive(activate);
    const pixelGridEl = pixelGridRef.current;
    if (!pixelGridEl) return;

    const pixels = pixelGridEl.querySelectorAll<HTMLDivElement>(".pixel-transition__pixel");
    if (!pixels.length) return;

    gsap.killTweensOf(pixels);
    if (delayedCallRef.current) delayedCallRef.current.kill();

    gsap.set(pixels, { display: "none" });
    const totalPixels = pixels.length;
    const staggerDuration = animationStepDuration / totalPixels;

    gsap.to(pixels, {
      display: "block",
      duration: 0,
      stagger: { each: staggerDuration, from: "random" },
    });

    // Swap the visible layer once the pixels have covered it (React state).
    delayedCallRef.current = gsap.delayedCall(animationStepDuration, () => {
      setShowSecond(activate);
    });

    gsap.to(pixels, {
      display: "none",
      duration: 0,
      delay: animationStepDuration,
      stagger: { each: staggerDuration, from: "random" },
    });
  };

  const handleEnter = () => {
    if (!isActive) animatePixels(true);
  };
  const handleLeave = () => {
    if (isActive) animatePixels(false);
  };
  const handleClick = () => animatePixels(!isActive);

  return (
    <div
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onMouseEnter={!isTouchDevice ? handleEnter : undefined}
      onMouseLeave={!isTouchDevice ? handleLeave : undefined}
      onFocus={!isTouchDevice ? handleEnter : undefined}
      onBlur={!isTouchDevice ? handleLeave : undefined}
      onClick={isTouchDevice ? handleClick : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          animatePixels(!isActive);
        }
      }}
    >
      <div style={{ position: "absolute", inset: 0, display: showSecond ? "none" : "block" }}>
        {firstContent}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: showSecond ? "block" : "none",
          pointerEvents: "none",
        }}
      >
        {secondContent}
      </div>
      <div
        ref={pixelGridRef}
        aria-hidden
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
