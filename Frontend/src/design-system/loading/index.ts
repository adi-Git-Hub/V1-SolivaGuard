/**
 * Loading architecture — barrel export.
 *
 * Six loading primitives + a shared config, all consuming the design-system
 * motion + color tokens for a unified luxury loading language.
 */

export { AppLoader } from "./AppLoader";
export { TopProgressBar } from "./TopProgressBar";
export { RouteTransitionLoader } from "./RouteTransitionLoader";
export { SectionLoader } from "./SectionLoader";
export { ImageLoader } from "./ImageLoader";
export { SkeletonCard } from "./SkeletonCard";
export { LoadingOverlay } from "./LoadingOverlay";
export { useLoadingEscalation } from "./hooks";

export {
  appLoader,
  routeLoader,
  sectionLoader,
  imageLoader,
  skeleton,
  overlay,
  loadingMotion,
  loadingHierarchy,
} from "./loading.config";
