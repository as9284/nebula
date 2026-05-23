"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  src: string;
  alt: string;
}

interface ImageLightboxContextValue {
  open: (image: LightboxImage) => void;
  close: () => void;
}

const ImageLightboxContext = createContext<ImageLightboxContextValue | null>(
  null,
);

export function useImageLightbox(): ImageLightboxContextValue {
  const ctx = useContext(ImageLightboxContext);
  if (!ctx) {
    throw new Error("useImageLightbox must be used within ImageLightboxProvider");
  }
  return ctx;
}

interface ImageLightboxProviderProps {
  children: React.ReactNode;
}

export function ImageLightboxProvider({ children }: ImageLightboxProviderProps) {
  const [image, setImage] = useState<LightboxImage | null>(null);

  const open = useCallback((next: LightboxImage) => setImage(next), []);
  const close = useCallback(() => setImage(null), []);

  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [image, close]);

  return (
    <ImageLightboxContext.Provider value={{ open, close }}>
      {children}
      <AnimatePresence>
        {image && (
          <Dialog.Root open onOpenChange={(open) => !open && close()}>
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm"
                  onClick={close}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", damping: 28, stiffness: 360 }}
                  className="fixed inset-0 z-[101] flex flex-col items-center justify-center p-4 sm:p-8 pointer-events-none"
                  onClick={close}
                >
                  <Dialog.Title className="sr-only">
                    {image.alt || "Expanded image"}
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Tap outside or press Escape to close.
                  </Dialog.Description>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      close();
                    }}
                    aria-label="Close image"
                    className="pointer-events-auto absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center justify-center w-10 h-10 rounded-xl bg-black/50 text-white/90 hover:bg-black/70 hover:text-white transition-colors"
                  >
                    <X size={20} aria-hidden />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="pointer-events-auto max-w-full max-h-[min(85dvh,100%)] w-auto h-auto object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {image.alt ? (
                    <p className="pointer-events-none mt-3 max-w-lg text-center text-xs text-white/70 truncate px-4">
                      {image.alt}
                    </p>
                  ) : null}
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </AnimatePresence>
    </ImageLightboxContext.Provider>
  );
}

interface ExpandableImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

/** Thumbnail that opens the app-wide lightbox on click/tap. */
export function ExpandableImage({
  src,
  alt,
  className,
  imgClassName,
}: ExpandableImageProps) {
  const { open } = useImageLightbox();

  return (
    <button
      type="button"
      onClick={() => open({ src, alt })}
      className={cn(
        "luna-expandable-image block max-w-full rounded-xl overflow-hidden border border-border/60",
        "cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        "hover:opacity-95 active:scale-[0.99] transition-[opacity,transform]",
        className,
      )}
      aria-label={alt ? `View image: ${alt}` : "View image"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          "max-w-full h-auto max-h-64 object-contain bg-bg/40",
          imgClassName,
        )}
      />
    </button>
  );
}
