import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface OverlayProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** `drawer` slides in from the right edge; `modal` scales in centered. */
  variant?: 'drawer' | 'modal'
  /** Tailwind max-width class for the drawer variant, e.g. "max-w-md". */
  drawerWidth?: string
  onExitComplete?: () => void
}

const panelSpring = { type: 'spring', duration: 0.35, bounce: 0 } as const

/**
 * Shared enter/exit chrome for the app's dismissible overlays (entity detail,
 * alerts, AI extraction). Centralizing this means every overlay animates the
 * same deliberate way instead of each panel improvising its own timing.
 */
export function Overlay({ open, onClose, children, variant = 'drawer', drawerWidth = 'max-w-md', onExitComplete }: OverlayProps) {
  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && (
        <div
          className={`fixed inset-0 flex ${variant === 'drawer' ? 'z-40 justify-end' : 'z-50 items-center justify-center p-4'}`}
        >
          <motion.button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-ink-900/30 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          {variant === 'drawer' ? (
            <motion.div
              className={`relative flex h-full w-full ${drawerWidth} flex-col overflow-hidden border-l border-base-border bg-base-surface shadow-panel`}
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 12, opacity: 0 }}
              transition={panelSpring}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-base-border bg-base-surface shadow-panel"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={panelSpring}
            >
              {children}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  )
}
