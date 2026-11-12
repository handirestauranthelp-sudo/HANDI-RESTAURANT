export type OrderType = 'room' | 'counter' | 'takeaway' | 'delivery';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'other';
export type PaymentStatus = 'completed' | 'refunded' | 'cancelled';
export type StaffRole = 'admin' | 'reception' | 'restaurant' | 'kitchen';

export interface MenuVariant {
  name: 'Quarter' | 'Half' | 'Full' | 'Standard';
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  hindiName?: string;
  category: string;
  isVeg: boolean;
  isEgg?: boolean;
  hasVariants: boolean;
  variants?: MenuVariant[];
  price: number; // default or base price
  description?: string;
  isAvailable: boolean;
  sku?: string;
  image?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  variantName?: 'Quarter' | 'Half' | 'Full' | 'Standard';
  rate: number; // Price snapshot locked at moment of ordering
  quantity: number;
  total: number;
  notes?: string;
}

export interface ExtraCharge {
  name: string;
  amount: number;
}

export interface Order {
  id: string; // e.g. HANDI-20261112-0001
  type: OrderType;
  roomNumber?: string; // 101-105, 201-205, 301-305
  customerName?: string;
  customerPhone?: string;
  customerCity?: string;
  customerCountry?: string;
  deliveryAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountType?: 'flat' | 'percent';
  discountReason?: string;
  extraCharges?: ExtraCharge[];
  tax: number;
  grandTotal: number;
  status: OrderStatus;
  cancellationReason?: string;
  cancelledBy?: string;
  createdAt: string; // ISO 8601
  orderTimeFormatted: string;
  createdByStaff: string;
  staffRole: StaffRole;
  notes?: string;
  billId?: string;
  isPaid?: boolean;
}

export interface Payment {
  id: string;
  paymentNumber: string; // e.g. PAY-20261112-0001
  orderId?: string;
  roomNumber?: string;
  billId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  status: PaymentStatus;
  refundReason?: string;
  receivedByStaff: string;
  createdAt: string;
  notes?: string;
}

export interface Bill {
  id: string;
  billNumber: string; // e.g. BILL-20261112-0001
  orderIds: string[];
  roomNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerCity?: string;
  customerCountry?: string;
  orderType: OrderType;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountType?: 'flat' | 'percent';
  discountReason?: string;
  extraCharges?: ExtraCharge[];
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: 'unpaid' | 'partial' | 'paid';
  paymentMethod?: PaymentMethod;
  createdAt: string;
  settledAt?: string;
  generatedByStaff: string;
  collectedByStaff?: string;
  upiPaymentLink?: string;
}

export interface RoomAccount {
  roomNumber: string; // '101'...'305'
  floor: 1 | 2 | 3;
  orders: Order[];
  payments: Payment[];
  bills: Bill[];
  totalFoodOrdersCount: number;
  totalFoodAmount: number;
  totalPaymentReceived: number;
  remainingBalance: number;
  lastOrderTime?: string;
  pendingKitchenCount: number;
  isOccupiedFoodActive: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  roleTitleHindi: string;
  pin: string;
  phone?: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  restaurantHindiName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  altPhone?: string;
  whatsappNumber: string;
  upiId: string; // Default VPA for dynamic QR code generation
  fssaiNumber?: string;
  currency: string;
  gstEnabled: boolean;
  gstNumber: string;
  gstPercent: number;
  defaultServiceChargePercent: number;
  billFooter: string;
  thermalPaperWidth: '80mm' | '58mm';
  defaultPrinterType: 'thermal' | 'a4';
  orderIdPrefix: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  staffName: string;
  timestamp: string;
  category: 'order' | 'payment' | 'menu' | 'settings' | 'settlement';
}

export interface DatabaseState {
  menu: MenuItem[];
  categories: string[];
  orders: Order[];
  payments: Payment[];
  bills: Bill[];
  settings: RestaurantSettings;
  staff: StaffMember[];
  auditLogs: AuditLog[];
  lastUpdated: string;
}
