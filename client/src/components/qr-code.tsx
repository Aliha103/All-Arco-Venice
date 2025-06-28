import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeComponent({ value, size = 128, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch((err: any) => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [value, size]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}