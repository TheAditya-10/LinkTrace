import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  color?: string
  variant?: 'solid' | 'outline'
  className?: string
}

export function Badge({ children, color = '#06b6d4', variant = 'outline', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
        className,
      )}
      style={
        variant === 'outline'
          ? { color, backgroundColor: `${color}14`, border: `1px solid ${color}40` }
          : { color: '#ffffff', backgroundColor: color }
      }
    >
      {children}
    </span>
  )
}
