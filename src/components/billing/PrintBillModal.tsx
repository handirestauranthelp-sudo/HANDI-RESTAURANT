import { useState, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Bill, ExtraCharge } from '../../types/restaurant';
import { formatCurrency, formatDateTime, generateWhatsAppMessage } from '../../utils/formatters';
import { UpiQrCode } from '../common/UpiQrCode';
import html2canvas from 'html2canvas';
import { 
  Printer, 
  Share2, 
  X, 
  FileText, 
  CheckCircle2, 
  Store,
  Layers,
  Download,
  Plus,
  Minus,
  Sparkles,
  User,
  Phone,
  QrCode,
  Image as ImageIcon,
  Check
} from 'lucide-react';

interface PrintBillModalProps {
  bill: Bill;
  onClose: () => void;
}

export function PrintBillModal({ bill, onClose }: PrintBillModalProps) {
  const { state, currentStaff, language } = useRestaurant();
  const [formatType, setFormatType] = useState<'thermal' | 'a4'>('thermal');
  const [showQrCode, setShowQrCode] = useState(true);
  
  // Dynamic Adjustments (Service Charge, Discount, Custom adjustments)
  const [discountAmount, setDiscountAmount] = useState<number>(bill.discount || 0);
  const [discountReason, setDiscountReason] = useState<string>(bill.discountReason || 'Discount');
  
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>(
    bill.extraCharges && bill.extraCharges.length > 0 
      ? bill.extraCharges 
      : (state.settings.defaultServiceChargePercent > 0 
          ? [{ name: 'Service Charge', amount: Math.round((bill.subtotal * state.settings.defaultServiceChargePercent) / 100) }]
          : [])
  );
  const [newChargeName, setNewChargeName] = useState('Service Charge');
  const [newChargeAmount, setNewChargeAmount] = useState<string>('');
  const [showChargeInputs, setShowChargeInputs] = useState(false);

  // Customer Contact Editing for instant WhatsApp
  const [customerPhone, setCustomerPhone] = useState(bill.customerPhone || '');
  const [customerName, setCustomerName] = useState(bill.customerName || '');
  const [customerCity, setCustomerCity] = useState(bill.customerCity || state.settings.city || '');
  const [collectedByStaff, setCollectedByStaff] = useState(bill.collectedByStaff || currentStaff.name);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageDownloadUrl, setImageDownloadUrl] = useState<string | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Recalculate dynamic totals
  const totalExtraCharges = extraCharges.reduce((s, ec) => s + (Number(ec.amount) || 0), 0);
  const effectiveGrandTotal = Math.max(0, bill.subtotal + bill.taxAmount + totalExtraCharges - discountAmount);
  const effectiveBalanceDue = Math.max(0, effectiveGrandTotal - bill.paidAmount);

  // Add custom extra charge
  const handleAddExtraCharge = () => {
    const amt = Number(newChargeAmount);
    if (!newChargeName || isNaN(amt) || amt <= 0) return;
    setExtraCharges(prev => [...prev, { name: newChargeName.trim(), amount: amt }]);
    setNewChargeAmount('');
    setShowChargeInputs(false);
  };

  const handleRemoveCharge = (index: number) => {
    setExtraCharges(prev => prev.filter((_, i) => i !== index));
  };

  // Trigger native browser print dialog
  const handlePrint = () => {
    window.print();
  };

  // Capture Receipt as High Resolution PNG/JPG Image
  const handleDownloadBillImage = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // 2x high resolution
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      const dataUrl = canvas.toDataURL('image/png');
      setImageDownloadUrl(dataUrl);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Handi_Restaurant_${bill.billNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to capture receipt image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const encodedText = generateWhatsAppMessage({
      billNumber: bill.billNumber,
      roomNumber: bill.roomNumber,
      customerName: customerName || bill.customerName,
      customerPhone: customerPhone || bill.customerPhone,
      customerCity: customerCity,
      items: bill.items,
      subtotal: bill.subtotal,
      discount: discountAmount,
      discountReason,
      extraCharges,
      taxAmount: bill.taxAmount,
      grandTotal: effectiveGrandTotal,
      paidAmount: bill.paidAmount,
      balanceDue: effectiveBalanceDue,
      paymentMethod: bill.paymentMethod,
      createdAt: bill.createdAt,
      generatedByStaff: bill.generatedByStaff,
      restaurantSettings: state.settings
    });

    const targetPhone = customerPhone ? customerPhone.replace(/[^0-9]/g, '') : '';
    const url = targetPhone 
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Controls (No-Print) */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {language === 'hi' ? 'स्मार्ट बिल व भुगतान' : 'Smart Bill & Payments'}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
              {bill.billNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle: 80mm Thermal vs A4 Full Invoice */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-750">
              <button
                onClick={() => setFormatType('thermal')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  formatType === 'thermal'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm POS Thermal
              </button>
              <button
                onClick={() => setFormatType('a4')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  formatType === 'a4'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Tax Invoice
              </button>
            </div>

            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                showQrCode ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle UPI QR Code display"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">UPI QR</span>
            </button>

            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Dynamic Charges, Discount, Customer WhatsApp Number */}
        <div className="p-3 bg-slate-850/80 border-b border-slate-800 text-xs no-print space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {/* Customer WhatsApp Phone */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>Customer WhatsApp No:</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-0.5 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Customer Name:</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>

            {/* Discount Adjuster */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                Discount (छूट ₹):
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min={0}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Reason..."
                  className="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-[11px]"
                />
              </div>
            </div>

            {/* Staff who collected */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                Payment Collected By:
              </label>
              <select
                value={collectedByStaff}
                onChange={(e) => setCollectedByStaff(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                {state.staff.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Extra Charges management (Service charge, packaging, delivery) */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400">Custom Charges:</span>
              {extraCharges.map((ec, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-slate-700 text-[11px]"
                >
                  <span>{ec.name}: ₹{ec.amount}</span>
                  <button
                    onClick={() => handleRemoveCharge(idx)}
                    className="text-slate-400 hover:text-rose-400 ml-1"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {!showChargeInputs && (
                <button
                  type="button"
                  onClick={() => setShowChargeInputs(true)}
                  className="text-[11px] text-amber-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Service Charge / Packaging</span>
                </button>
              )}
            </div>

            {showChargeInputs && (
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-750">
                <input
                  type="text"
                  value={newChargeName}
                  onChange={(e) => setNewChargeName(e.target.value)}
                  placeholder="Charge Name (e.g. Service Charge)"
                  className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-white w-32"
                />
                <input
                  type="number"
                  value={newChargeAmount}
                  onChange={(e) => setNewChargeAmount(e.target.value)}
                  placeholder="Amount ₹"
                  className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-white w-20 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddExtraCharge}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px]"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowChargeInputs(false)}
                  className="text-slate-400 hover:text-white px-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Printable Viewport Container */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 flex flex-col md:flex-row items-center md:items-start justify-center gap-6 bg-slate-950">
          {/* Main Receipt Container (#printable-receipt is captured by CSS @media print) */}
          <div
            id="printable-receipt"
            ref={receiptRef}
            className={`bg-white text-black p-5 shadow-2xl transition-all ${
              formatType === 'thermal'
                ? 'w-[320px] font-mono text-xs rounded-lg'
                : 'w-full max-w-[580px] font-sans text-xs rounded-xl border border-neutral-300'
            }`}
          >
            {/* Header: Restaurant Branding & Full Details */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-400">
              <h2 className="text-base font-black tracking-wider uppercase text-black">
                {state.settings.restaurantName}
              </h2>
              <div className="text-[11px] font-semibold text-neutral-800">
                {state.settings.restaurantHindiName}
              </div>
              <p className="text-[10px] text-neutral-600 mt-1 leading-tight">
                {state.settings.address}
                {state.settings.city ? `, ${state.settings.city} - ${state.settings.pincode}` : ''}
              </p>
              <p className="text-[10px] text-neutral-600 mt-0.5">
                Ph: {state.settings.phone} {state.settings.altPhone ? `· ${state.settings.altPhone}` : ''}
              </p>
              {state.settings.gstEnabled && state.settings.gstNumber && (
                <p className="text-[10px] font-bold text-neutral-800 mt-0.5">
                  GSTIN: {state.settings.gstNumber}
                </p>
              )}
              {state.settings.fssaiNumber && (
                <p className="text-[9px] text-neutral-600 mt-0.5">
                  FSSAI Lic No: {state.settings.fssaiNumber}
                </p>
              )}
            </div>

            {/* Bill & Customer Metadata */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>Bill No: {bill.billNumber}</span>
                <span className="uppercase">{bill.orderType}</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>Date: {formatDateTime(bill.createdAt)}</span>
              </div>
              {bill.roomNumber && (
                <div className="flex justify-between font-bold text-black text-xs">
                  <span>ROOM NUMBER:</span>
                  <span className="text-sm font-black">{bill.roomNumber}</span>
                </div>
              )}
              {(customerName || bill.customerName) && (
                <div className="flex justify-between text-neutral-800">
                  <span>Guest Name:</span>
                  <span className="font-semibold">{customerName || bill.customerName}</span>
                </div>
              )}
              {(customerPhone || bill.customerPhone) && (
                <div className="flex justify-between text-neutral-800 font-mono">
                  <span>Mobile:</span>
                  <span>{customerPhone || bill.customerPhone}</span>
                </div>
              )}
              {customerCity && (
                <div className="flex justify-between text-neutral-600 text-[10px]">
                  <span>City:</span>
                  <span>{customerCity}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600 text-[10px] pt-0.5 border-t border-neutral-100">
                <span>Billed By: {bill.generatedByStaff || currentStaff.name}</span>
                <span>Collected By: {collectedByStaff}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-neutral-400">
              <div className="flex justify-between font-bold pb-1 text-[10px] border-b border-neutral-300">
                <span className="w-1/2">ITEM</span>
                <span className="w-1/6 text-center">QTY</span>
                <span className="w-1/6 text-right">RATE</span>
                <span className="w-1/6 text-right">AMT</span>
              </div>

              <div className="divide-y divide-neutral-100 pt-1 space-y-1">
                {bill.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] pt-1">
                    <span className="w-1/2 font-medium">
                      {item.name}
                      {item.variantName && item.variantName !== 'Standard' ? ` (${item.variantName})` : ''}
                    </span>
                    <span className="w-1/6 text-center tabular-nums">{item.quantity}</span>
                    <span className="w-1/6 text-right tabular-nums">₹{item.rate}</span>
                    <span className="w-1/6 text-right font-bold tabular-nums">₹{item.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Calculations */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold tabular-nums">₹{bill.subtotal}</span>
              </div>

              {/* Extra Charges (Service Charge, etc.) */}
              {extraCharges.map((ec, idx) => (
                <div key={idx} className="flex justify-between text-neutral-800">
                  <span>+ {ec.name}:</span>
                  <span className="font-bold tabular-nums">+₹{ec.amount}</span>
                </div>
              ))}

              {discountAmount > 0 && (
                <div className="flex justify-between text-neutral-700">
                  <span>- Discount ({discountReason}):</span>
                  <span className="font-bold tabular-nums">-₹{discountAmount}</span>
                </div>
              )}

              {state.settings.gstEnabled && bill.taxAmount > 0 && (
                <div className="flex justify-between text-neutral-700">
                  <span>+ GST ({bill.taxPercent}%):</span>
                  <span className="font-bold tabular-nums">+₹{bill.taxAmount}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-xs md:text-sm pt-1 border-t border-neutral-300">
                <span>GRAND TOTAL:</span>
                <span className="text-sm md:text-base font-black">₹{effectiveGrandTotal}</span>
              </div>

              <div className="flex justify-between text-neutral-800 pt-1">
                <span>Payment Received:</span>
                <span className="font-bold tabular-nums">₹{bill.paidAmount}</span>
              </div>

              {effectiveBalanceDue > 0 ? (
                <div className="flex justify-between font-bold text-red-600">
                  <span>BALANCE DUE:</span>
                  <span className="tabular-nums">₹{effectiveBalanceDue}</span>
                </div>
              ) : (
                <div className="flex justify-between font-bold text-emerald-700 text-[10px]">
                  <span>STATUS:</span>
                  <span>PAID IN FULL ({bill.paymentMethod?.toUpperCase() || 'CASH'})</span>
                </div>
              )}
            </div>

            {/* Dynamic UPI QR Code for Exact Total Amount (Integrated in Receipt) */}
            {state.settings.upiId && showQrCode && (
              <div className="py-3 text-center border-b border-dashed border-neutral-400 flex flex-col items-center">
                <span className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1">
                  Scan UPI QR to Pay Exact: ₹{effectiveBalanceDue > 0 ? effectiveBalanceDue : effectiveGrandTotal}
                </span>
                <UpiQrCode
                  amount={effectiveBalanceDue > 0 ? effectiveBalanceDue : effectiveGrandTotal}
                  upiId={state.settings.upiId}
                  restaurantName={state.settings.restaurantName}
                  billNumber={bill.billNumber}
                  size={120}
                  showDetails={false}
                />
                <span className="text-[9px] text-neutral-600 mt-1 font-mono">
                  UPI VPA: {state.settings.upiId}
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-neutral-600 space-y-1">
              <p className="font-medium">{state.settings.billFooter}</p>
              <p className="text-[9px] text-neutral-500">Printed: {formatDateTime(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Side Panel: Big Interactive UPI QR Code & Instructions */}
          {state.settings.upiId && showQrCode && (
            <div className="w-full md:w-64 bg-slate-900 border border-slate-750 p-4 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-3 no-print">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <QrCode className="w-4 h-4" />
                <span>Customer Counter QR</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Customer can scan this QR code with PhonePe, Google Pay or Paytm. The exact bill amount will be automatically entered!
              </p>

              <UpiQrCode
                amount={effectiveBalanceDue > 0 ? effectiveBalanceDue : effectiveGrandTotal}
                upiId={state.settings.upiId}
                restaurantName={state.settings.restaurantName}
                billNumber={bill.billNumber}
                size={180}
                showDetails={true}
              />
            </div>
          )}
        </div>

        {/* Footer Actions (No-Print) */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download Bill Image / Snapshot */}
            <button
              onClick={handleDownloadBillImage}
              disabled={isGeneratingImage}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 text-xs font-bold transition-all shadow-sm"
              title="Download Receipt Image (PNG)"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{isGeneratingImage ? 'Capturing...' : (language === 'hi' ? 'बिल इमेज डाउनलोड' : 'Download Image')}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'व्हाट्सएप भेजें' : 'Share WhatsApp'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'hi' ? 'बिल प्रिंट करें (Print)' : 'Print Bill'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
