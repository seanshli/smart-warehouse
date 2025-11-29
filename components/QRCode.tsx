'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export default function QRCodeDisplay({ value, size = 200, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).catch((err) => {
        console.error('Error generating QR code:', err)
      })
    }
  }, [value, size])

  if (!value) {
    return null
  }

  return (
    <div className={`inline-block ${className}`}>
      <canvas ref={canvasRef} className="border border-gray-200 rounded-lg" />
    </div>
  )
}


