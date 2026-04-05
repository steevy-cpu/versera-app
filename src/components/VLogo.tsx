import React from 'react'

interface VLogoProps {
  size?: number
  className?: string
}

export const VLogoMark = ({ size = 32, className }: VLogoProps) => {
  const s = size / 32
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="4" y="4" width="24" height="3" rx="1.5" fill="#10b981" opacity="0.3" />
      <rect x="6" y="9" width="20" height="3" rx="1.5" fill="#10b981" opacity="0.45" />
      <rect x="8" y="14" width="16" height="3" rx="1.5" fill="#10b981" opacity="0.6" />
      <rect x="10" y="19" width="12" height="3" rx="1.5" fill="#10b981" opacity="0.75" />
      <rect x="12" y="24" width="8" height="3" rx="1.5" fill="#10b981" opacity="0.9" />
    </svg>
  )
}

export const VLogoFull = ({ size = 32, className }: VLogoProps) => (
  <span className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
    <VLogoMark size={size} />
    <span
      className="font-bold tracking-tight text-primary"
      style={{ fontSize: size * 0.6, lineHeight: 1 }}
    >
      Versera
    </span>
  </span>
)
