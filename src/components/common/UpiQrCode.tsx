import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { formatCurrency } from '../../utils/formatters';
import { QrCode, CheckCircle2, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

interface UpiQrCodeProps {
  amount: number;
  upiId: string;
  restaurantName: string;
  billNumber: string;
  size?: number;
  showDetails?: boolean;
}

export function UpiQrCode({
  amount,
  upiId,
  restaurantName,
  billNumber,
  size = 200,
  showDetails = true
}: UpiQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const roundedAmount = Math.max(0, Math.round(amount * 100) / 100);

  // Standard NPCI UPI URI Specification
  // upi://pay?pa={VPA}&pn={MerchantName}&am={Amount}&cu=INR&tn={TransactionNote}
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(restaurantName.trim())}&am=${roundedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Bill ${billNumber} - ${restaurantName}`)}`;

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(upiUri, {
      width: size * 2, // crisp high resolution for scanning
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate UPI QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [upiUri, size]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col items-center text-center p-3.5 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-md">
      {/* Dynamic Amount Banner */}
      <div className="w-full bg-slate-900 text-white py-1.5 px-3 rounded-xl mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-300">Scan & Pay Exact:</span>
        <span className="text-base font-black text-amber-400 tabular-nums">
          {formatCurrency(roundedAmount)}
        </span>
      </div>

      {/* QR Code Canvas Frame */}
      <div className="relative p-2 rounded-xl bg-white border-2 border-slate-900/10 shadow-inner flex items-center justify-center">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`UPI QR Code for ${formatCurrency(roundedAmount)}`}
            width={size}
            height={size}
            className="rounded-lg object-contain"
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg text-xs"
          >
            <QrCode className="w-8 h-8 animate-pulse text-amber-500 mb-1" />
            <span>Generating QR...</span>
          </div>
        )}

        {/* Center UPI Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-800 shadow-md flex items-center justify-center">
            <span className="text-[9px] font-black tracking-tighter text-slate-900">UPI</span>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2.5 w-full space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700">
            <span>UPI ID:</span>
            <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              {upiId}
            </span>
            <button
              onClick={copyUpiId}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
              title="Copy UPI ID"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>PhonePe · Google Pay · Paytm · BHIM</span>
          </p>
        </div>
      )}
    </div>
  );
}
