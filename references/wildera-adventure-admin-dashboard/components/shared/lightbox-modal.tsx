"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react"

export interface LightboxItem {
  title: string
  org: string
  image: string
  year?: string
  credentialType?: string
}

interface LightboxModalProps {
  isOpen: boolean
  items: LightboxItem[]
  initialIndex: number
  onClose: () => void
}

export function LightboxModal({
  isOpen,
  items,
  initialIndex = 0,
  onClose,
}: LightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setZoomLevel(1)
  }, [initialIndex, isOpen])

  const currentItem = items[currentIndex]

  const handleNext = useCallback(() => {
    setZoomLevel(1)
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }, [items.length])

  const handlePrev = useCallback(() => {
    setZoomLevel(1)
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }, [items.length])

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
  }

  // Keyboard navigation & lock body scroll
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowRight") {
        handleNext()
      } else if (e.key === "ArrowLeft") {
        handlePrev()
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn()
      } else if (e.key === "-") {
        handleZoomOut()
      } else if (e.key === "0") {
        handleResetZoom()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose, handleNext, handlePrev])

  if (!isOpen || !currentItem) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex flex-col bg-background/90 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Certificate preview: ${currentItem.title}`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border/60 bg-card/60 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <div className="text-sm font-semibold text-foreground line-clamp-1">
                {currentItem.title}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{currentItem.org}</span>
                <span>•</span>
                <span>
                  {currentIndex + 1} of {items.length}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-1 rounded-full border border-border bg-background text-xs text-muted-foreground">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-1 rounded hover:text-foreground disabled:opacity-30 transition-colors"
                title="Zoom Out (-)"
                aria-label="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="w-12 text-center font-mono text-[11px]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1 rounded hover:text-foreground disabled:opacity-30 transition-colors"
                title="Zoom In (+)"
                aria-label="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </button>
              {zoomLevel > 1 && (
                <button
                  onClick={handleResetZoom}
                  className="p-1 rounded hover:text-foreground transition-colors ml-1"
                  title="Reset Zoom (0)"
                  aria-label="Reset Zoom"
                >
                  <RotateCcw className="size-3" />
                </button>
              )}
            </div>

            <a
              href={currentItem.image}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Open raw file in new tab"
              aria-label="Open raw file in new tab"
            >
              <ExternalLink className="size-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
              title="Close (Esc)"
              aria-label="Close Lightbox"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4 sm:p-8">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 size-11 sm:size-12 rounded-full bg-background/80 hover:bg-background border border-border shadow-lg backdrop-blur-md flex items-center justify-center text-foreground hover:scale-105 transition-all"
            title="Previous (Left Arrow)"
            aria-label="Previous certificate"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* Certificate Image Viewport */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center overflow-auto cursor-zoom-in"
            onClick={() => {
              if (zoomLevel === 1) handleZoomIn()
              else handleResetZoom()
            }}
          >
            <div
              className="relative transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
              }}
            >
              <Image
                src={currentItem.image}
                alt={currentItem.title}
                width={1200}
                height={850}
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl border border-border/80 bg-card"
                priority
              />
            </div>
          </motion.div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 size-11 sm:size-12 rounded-full bg-background/80 hover:bg-background border border-border shadow-lg backdrop-blur-md flex items-center justify-center text-foreground hover:scale-105 transition-all"
            title="Next (Right Arrow)"
            aria-label="Next certificate"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Bottom Thumbnails Strip */}
        <div className="border-t border-border/60 bg-card/60 backdrop-blur-md px-4 py-3 z-10 overflow-x-auto">
          <div className="flex items-center justify-center gap-3 min-w-max mx-auto">
            {items.map((item, idx) => {
              const isSelected = idx === currentIndex
              return (
                <button
                  key={item.title}
                  onClick={() => {
                    setZoomLevel(1)
                    setCurrentIndex(idx)
                  }}
                  className={`relative size-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/30 scale-105"
                      : "border-border/60 opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Go to certificate ${idx + 1}: ${item.title}`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
