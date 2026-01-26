'use client'

import { cn } from '@/lib/utils'

export function Badge({ className = '', children, variant = 'outline', ...props }) {
  const base = 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium'
  const variants = {
    outline: 'border-gray-300 text-gray-700',
    default: 'bg-black text-white border-black',
    secondary: 'bg-gray-100 text-gray-700 border-gray-300',
    destructive: 'bg-red-100 text-red-700 border-red-300',
  }
  return (
    <span className={cn(base, variants[variant] || variants.outline, className)} {...props}>
      {children}
    </span>
  )
}

export default Badge
