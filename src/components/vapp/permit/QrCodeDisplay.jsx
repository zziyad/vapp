'use client'

import { QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

/**
 * QR Code Display Component for VAPP Permits
 * 
 * Displays QR code from permit QR payload
 * 
 * @param {Object} props
 * @param {string} props.payload - QR payload string (e.g., "VAPP:<eventId>:<token>")
 * @param {number} [props.size=200] - QR code size in pixels
 * @param {string} [props.level='M'] - Error correction level: 'L' | 'M' | 'Q' | 'H'
 * @param {string} [props.className] - Additional CSS classes
 */
export function QrCodeDisplay({ payload, size = 200, level = 'M', className = '' }) {
  if (!payload) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <p className="text-sm text-muted-foreground">No QR payload</p>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <QRCodeSVG
        value={payload}
        size={size}
        level={level}
        includeMargin={true}
      />
    </div>
  )
}

/**
 * QR Code with Label Component
 * 
 * Displays QR code with optional label and copy button
 */
export function QrCodeWithLabel({ 
  payload, 
  size = 200, 
  label, 
  showCopy = false,
  onCopy 
}) {
  const copyPayload = async () => {
    if (navigator.clipboard && payload) {
      await navigator.clipboard.writeText(payload)
      if (onCopy) {
        onCopy(payload)
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <QrCodeDisplay payload={payload} size={size} />
      {showCopy && payload && (
        <button
          onClick={copyPayload}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Copy token
        </button>
      )}
    </div>
  )
}
