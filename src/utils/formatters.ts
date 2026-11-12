export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return `${formatDate(isoString)} · ${formatTime(isoString)}`;
  } catch {
    return isoString;
  }
}

export function getRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return '';
  }
}

export interface WhatsAppBillPayload {
  billNumber: string;
  roomNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerCity?: string;
  items: { name: string; quantity: number; rate: number; total: number; variantName?: string }[];
  subtotal: number;
  discount: number;
  discountReason?: string;
  extraCharges?: { name: string; amount: number }[];
  taxAmount?: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod?: string;
  createdAt: string;
  generatedByStaff?: string;
  restaurantSettings?: {
    restaurantName: string;
    restaurantHindiName?: string;
    address: string;
    city?: string;
    phone: string;
    whatsappNumber?: string;
    gstNumber?: string;
    fssaiNumber?: string;
    upiId?: string;
  };
}

export function generateWhatsAppMessage(payload: WhatsAppBillPayload): string {
  const s = payload.restaurantSettings;
  const restName = (s?.restaurantName || 'HANDI RESTAURANT').toUpperCase();

  let text = `👑 *${restName}*\n`;
  if (s?.restaurantHindiName) {
    text += `*${s.restaurantHindiName}*\n`;
  }
  if (s?.address) {
    text += `📍 ${s.address}${s.city ? `, ${s.city}` : ''}\n`;
  }
  if (s?.phone) {
    text += `📞 Ph: ${s.phone}\n`;
  }
  if (s?.gstNumber) {
    text += `GSTIN: ${s.gstNumber}\n`;
  }
  if (s?.fssaiNumber) {
    text += `FSSAI Lic: ${s.fssaiNumber}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🧾 *TAX INVOICE / FOOD BILL*\n`;
  text += `Bill No: *${payload.billNumber}*\n`;
  text += `Date: ${formatDateTime(payload.createdAt)}\n`;

  if (payload.roomNumber) {
    text += `🏨 Room Food Account: *Room ${payload.roomNumber}*\n`;
  }
  if (payload.customerName) {
    text += `👤 Guest: *${payload.customerName}*${payload.customerPhone ? ` (${payload.customerPhone})` : ''}\n`;
  }
  if (payload.customerCity) {
    text += `City: ${payload.customerCity}\n`;
  }
  if (payload.generatedByStaff) {
    text += `Staff / Billed By: ${payload.generatedByStaff}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*ORDER ITEMS:*\n`;
  payload.items.forEach((item, idx) => {
    const variant = item.variantName && item.variantName !== 'Standard' ? ` [${item.variantName}]` : '';
    text += `${idx + 1}. ${item.name}${variant}\n`;
    text += `    ${item.quantity} × ₹${item.rate} = *₹${item.total}*\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Subtotal: ₹${payload.subtotal}\n`;

  if (payload.extraCharges && payload.extraCharges.length > 0) {
    payload.extraCharges.forEach(ec => {
      text += `+ ${ec.name}: ₹${ec.amount}\n`;
    });
  }

  if (payload.discount > 0) {
    text += `- Discount${payload.discountReason ? ` (${payload.discountReason})` : ''}: -₹${payload.discount}\n`;
  }

  if (payload.taxAmount && payload.taxAmount > 0) {
    text += `+ GST: ₹${payload.taxAmount}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 *GRAND TOTAL: ₹${payload.grandTotal}*\n`;
  text += `Amount Received: ₹${payload.paidAmount} (${payload.paymentMethod?.toUpperCase() || 'PAID'})\n`;

  if (payload.balanceDue > 0) {
    text += `⚠️ *REMAINING BALANCE DUE: ₹${payload.balanceDue}*\n`;
  } else {
    text += `✅ *STATUS: FULLY SETTLED / PAID*\n`;
  }

  if (s?.upiId && payload.balanceDue > 0) {
    text += `\n📲 Pay online via UPI:\nUPI ID: *${s.upiId}*\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Thank you for dining with Handi Restaurant! Visit Again 🙏`;

  return encodeURIComponent(text);
}
