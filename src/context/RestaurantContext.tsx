import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DatabaseState, 
  Order, 
  Payment, 
  Bill, 
  MenuItem, 
  RestaurantSettings, 
  StaffMember, 
  AuditLog,
  RoomAccount,
  OrderStatus,
  PaymentMethod
} from '../types/restaurant';
import { INITIAL_MENU, MENU_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_STAFF, FIXED_ROOMS } from '../data/initialMenu';

export type NavigationTab = 
  | 'dashboard' 
  | 'new-order' 
  | 'room-accounts' 
  | 'outside-orders' 
  | 'kitchen-display' 
  | 'menu' 
  | 'bills' 
  | 'payments' 
  | 'reports' 
  | 'staff' 
  | 'settings';

interface RestaurantContextType {
  state: DatabaseState;
  loading: boolean;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentStaff: StaffMember;
  setCurrentStaff: (staff: StaffMember) => void;
  language: 'hi' | 'en';
  setLanguage: (lang: 'hi' | 'en') => void;
  roomAccounts: RoomAccount[];
  selectedRoom: string | null;
  setSelectedRoom: (room: string | null) => void;
  selectedBillForPrint: Bill | null;
  setSelectedBillForPrint: (bill: Bill | null) => void;
  selectedOrderForDetails: Order | null;
  setSelectedOrderForDetails: (order: Order | null) => void;
  isOnline: boolean;
  
  // Actions
  createOrder: (orderData: Partial<Order>) => Promise<{ success: boolean; order?: Order; error?: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus, cancellationReason?: string) => Promise<{ success: boolean }>;
  recordPayment: (paymentData: Partial<Payment>) => Promise<{ success: boolean; payment?: Payment }>;
  settleRoom: (roomNumber: string, options?: {
    paymentMethod?: PaymentMethod;
    discount?: number;
    discountReason?: string;
    extraCharges?: { name: string; amount: number }[];
    customerName?: string;
    customerPhone?: string;
    customerCity?: string;
    customerCountry?: string;
    collectedByStaff?: string;
  }) => Promise<{ success: boolean; bill?: Bill }>;
  generateDirectBill: (orderId: string, options?: {
    paymentMethod?: PaymentMethod;
    paidAmount?: number;
    extraCharges?: { name: string; amount: number }[];
    discountAmount?: number;
    discountReason?: string;
    customerCity?: string;
    customerCountry?: string;
    collectedByStaff?: string;
  }) => Promise<{ success: boolean; bill?: Bill }>;
  updateMenuItem: (id: string, data: Partial<MenuItem>) => Promise<{ success: boolean }>;
  addMenuItem: (item: MenuItem) => Promise<{ success: boolean }>;
  deleteMenuItem: (id: string) => Promise<{ success: boolean }>;
  importCsvMenu: (items: MenuItem[], mode?: 'append' | 'replace') => Promise<{ success: boolean; count?: number; totalMenu?: number }>;
  syncPdfMenu: () => Promise<{ success: boolean; count?: number }>;
  updateSettings: (settings: RestaurantSettings) => Promise<{ success: boolean }>;
  updateStaffMember: (id: string, data: Partial<StaffMember>) => Promise<{ success: boolean }>;
  restoreDatabase: (data: DatabaseState) => Promise<{ success: boolean }>;
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DatabaseState>(() => {
    // Try localStorage fallback first for instant initial render
    const local = localStorage.getItem('handi_restaurant_db');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // pass
      }
    }
    return {
      menu: INITIAL_MENU,
      categories: MENU_CATEGORIES,
      orders: [],
      payments: [],
      bills: [],
      settings: DEFAULT_SETTINGS,
      staff: DEFAULT_STAFF,
      auditLogs: [],
      lastUpdated: new Date().toISOString()
    };
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(DEFAULT_STAFF[0]); // Default to Admin
  const [language, setLanguage] = useState<'hi' | 'en'>('hi'); // Default Hindi for user convenience
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<Bill | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Sync state to localStorage for offline cache
  useEffect(() => {
    localStorage.setItem('handi_restaurant_db', JSON.stringify(state));
  }, [state]);

  // Load from backend API
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
        setIsOnline(true);
      }
    } catch (err) {
      console.warn('API fetch failed, working offline with local storage:', err);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Real-time Live Synchronization via Server-Sent Events (SSE)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout;

    const setupSSE = () => {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsOnline(true);
      };

      eventSource.addEventListener('order_created', (e) => {
        const payload = JSON.parse(e.data);
        setState(prev => ({
          ...prev,
          orders: [payload.order, ...prev.orders.filter(o => o.id !== payload.order.id)],
          auditLogs: payload.auditLog ? [payload.auditLog, ...prev.auditLogs] : prev.auditLogs
        }));
      });

      eventSource.addEventListener('order_status_updated', (e) => {
        const payload = JSON.parse(e.data);
        setState(prev => ({
          ...prev,
          orders: prev.orders.map(o => o.id === payload.order.id ? payload.order : o),
          auditLogs: payload.auditLog ? [payload.auditLog, ...prev.auditLogs] : prev.auditLogs
        }));
      });

      eventSource.addEventListener('payment_received', (e) => {
        const payload = JSON.parse(e.data);
        setState(prev => ({
          ...prev,
          payments: [payload.payment, ...prev.payments.filter(p => p.id !== payload.payment.id)],
          auditLogs: payload.auditLog ? [payload.auditLog, ...prev.auditLogs] : prev.auditLogs
        }));
      });

      eventSource.addEventListener('room_settled', (e) => {
        const payload = JSON.parse(e.data);
        setState(prev => ({
          ...prev,
          bills: [payload.bill, ...prev.bills.filter(b => b.id !== payload.bill.id)],
          orders: prev.orders.map(o => payload.bill.orderIds.includes(o.id) ? { ...o, billId: payload.bill.id, isPaid: true } : o),
          auditLogs: payload.auditLog ? [payload.auditLog, ...prev.auditLogs] : prev.auditLogs
        }));
      });

      eventSource.addEventListener('bill_created', (e) => {
        const payload = JSON.parse(e.data);
        setState(prev => ({
          ...prev,
          bills: [payload.bill, ...prev.bills.filter(b => b.id !== payload.bill.id)],
          orders: prev.orders.map(o => payload.bill.orderIds.includes(o.id) ? { ...o, billId: payload.bill.id, isPaid: true } : o)
        }));
      });

      eventSource.addEventListener('menu_updated', (e) => {
        const payload = JSON.parse(e.data);
        setState(prev => ({
          ...prev,
          menu: payload.menu,
          categories: payload.categories,
          auditLogs: payload.auditLog ? [payload.auditLog, ...prev.auditLogs] : prev.auditLogs
        }));
      });

      eventSource.addEventListener('settings_updated', (e) => {
        const payload = JSON.parse(e.data);
        setState(prev => ({
          ...prev,
          settings: payload.settings
        }));
      });

      eventSource.addEventListener('database_restored', (e) => {
        const payload = JSON.parse(e.data);
        setState(payload);
      });

      eventSource.onerror = () => {
        eventSource?.close();
        // Retry connection in 3s
        retryTimeout = setTimeout(setupSSE, 3000);
      };
    };

    setupSSE();

    return () => {
      eventSource?.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  // Compute 15 fixed room accounts
  const roomAccounts = useMemo((): RoomAccount[] => {
    return FIXED_ROOMS.map(roomDef => {
      const roomNumber = roomDef.roomNumber;
      // All historical orders for this room
      const allRoomOrders = state.orders.filter(o => o.roomNumber === roomNumber);
      
      // All historical payments for this room
      const allRoomPayments = state.payments.filter(p => p.roomNumber === roomNumber && p.status === 'completed');
      
      // All bills generated for this room
      const roomBills = state.bills.filter(b => b.roomNumber === roomNumber);

      // Active / unsettled orders (not cancelled and not yet settled in a bill)
      const activeOrders = allRoomOrders.filter(o => o.status !== 'cancelled' && !o.billId);
      
      // Unsettled payments
      const unbilledPayments = allRoomPayments.filter(p => !p.billId);
      const unbilledPaidSum = unbilledPayments.reduce((sum, p) => sum + p.amount, 0);

      // Total food amount for active session
      const activeFoodTotal = activeOrders.reduce((sum, o) => sum + o.grandTotal, 0);
      const remainingBalance = Math.max(0, activeFoodTotal - unbilledPaidSum);

      // Pending kitchen items in active orders
      const pendingKitchenCount = activeOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length;

      // Last order time
      const sortedOrders = [...allRoomOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lastOrderTime = sortedOrders[0]?.createdAt;

      return {
        roomNumber,
        floor: roomDef.floor,
        orders: allRoomOrders,
        payments: allRoomPayments,
        bills: roomBills,
        totalFoodOrdersCount: allRoomOrders.filter(o => o.status !== 'cancelled').length,
        totalFoodAmount: activeFoodTotal,
        totalPaymentReceived: unbilledPaidSum,
        remainingBalance,
        lastOrderTime,
        pendingKitchenCount,
        isOccupiedFoodActive: activeOrders.length > 0 || remainingBalance > 0
      };
    });
  }, [state.orders, state.payments, state.bills]);

  // Create Order Action
  const createOrder = async (orderData: Partial<Order>) => {
    try {
      const payload = {
        ...orderData,
        createdByStaff: currentStaff.name,
        staffRole: currentStaff.role
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, order: data.order };
      }
      return { success: false, error: 'Server error' };
    } catch {
      // Offline fallback
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const localId = `HANDI-${dateStr}-${String(state.orders.length + 1).padStart(4, '0')}`;
      const offlineOrder: Order = {
        id: localId,
        type: orderData.type || 'counter',
        roomNumber: orderData.roomNumber,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        deliveryAddress: orderData.deliveryAddress,
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        discount: orderData.discount || 0,
        tax: orderData.tax || 0,
        grandTotal: orderData.grandTotal || 0,
        status: 'pending',
        createdAt: now.toISOString(),
        orderTimeFormatted: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        createdByStaff: currentStaff.name,
        staffRole: currentStaff.role,
        notes: orderData.notes || '',
        isPaid: false
      };

      setState(prev => ({
        ...prev,
        orders: [offlineOrder, ...prev.orders],
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            action: 'Offline Order Placed',
            details: `Order ${localId} placed`,
            staffName: currentStaff.name,
            timestamp: now.toISOString(),
            category: 'order'
          },
          ...prev.auditLogs
        ]
      }));

      return { success: true, order: offlineOrder };
    }
  };

  // Update order status (KDS)
  const updateOrderStatus = async (orderId: string, status: OrderStatus, cancellationReason?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cancellationReason, staffName: currentStaff.name })
      });
      if (res.ok) {
        return { success: true };
      }
    } catch {
      // offline fallback
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === orderId ? { ...o, status, cancellationReason } : o)
      }));
    }
    return { success: true };
  };

  // Record payment
  const recordPayment = async (paymentData: Partial<Payment>) => {
    try {
      const payload = {
        ...paymentData,
        receivedByStaff: currentStaff.name
      };
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, payment: data.payment };
      }
    } catch {
      // offline fallback
      const now = new Date();
      const pId = `PAY-${Date.now()}`;
      const offPay: Payment = {
        id: pId,
        paymentNumber: pId,
        orderId: paymentData.orderId,
        roomNumber: paymentData.roomNumber,
        billId: paymentData.billId,
        amount: paymentData.amount || 0,
        paymentMethod: paymentData.paymentMethod || 'cash',
        transactionReference: paymentData.transactionReference,
        status: 'completed',
        receivedByStaff: currentStaff.name,
        createdAt: now.toISOString(),
        notes: paymentData.notes
      };
      setState(prev => ({
        ...prev,
        payments: [offPay, ...prev.payments]
      }));
      return { success: true, payment: offPay };
    }
    return { success: false };
  };

  // Settle room food account with custom charges, discounts, and staff attribution
  const settleRoom = async (roomNumber: string, options?: {
    paymentMethod?: PaymentMethod;
    discount?: number;
    discountReason?: string;
    extraCharges?: { name: string; amount: number }[];
    customerName?: string;
    customerPhone?: string;
    customerCity?: string;
    customerCountry?: string;
    collectedByStaff?: string;
  }) => {
    try {
      const payload = {
        staffName: currentStaff.name,
        collectedByStaff: options?.collectedByStaff || currentStaff.name,
        paymentMethod: options?.paymentMethod,
        discountAmount: options?.discount || 0,
        discountReason: options?.discountReason || '',
        extraCharges: options?.extraCharges || [],
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        customerCity: options?.customerCity,
        customerCountry: options?.customerCountry
      };

      const res = await fetch(`/api/rooms/${roomNumber}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bill) {
          setSelectedBillForPrint(data.bill);
        }
        return { success: true, bill: data.bill };
      }
    } catch (err) {
      console.error('Failed to settle room:', err);
    }
    return { success: false };
  };

  // Generate direct bill for outside order with custom charges, discounts, and customer details
  const generateDirectBill = async (orderId: string, options?: {
    paymentMethod?: PaymentMethod;
    paidAmount?: number;
    extraCharges?: { name: string; amount: number }[];
    discountAmount?: number;
    discountReason?: string;
    customerCity?: string;
    customerCountry?: string;
    collectedByStaff?: string;
  }) => {
    try {
      const payload = {
        orderId,
        staffName: currentStaff.name,
        collectedByStaff: options?.collectedByStaff || currentStaff.name,
        paymentMethod: options?.paymentMethod,
        paidAmount: options?.paidAmount,
        extraCharges: options?.extraCharges || [],
        discountAmount: options?.discountAmount || 0,
        discountReason: options?.discountReason || '',
        customerCity: options?.customerCity,
        customerCountry: options?.customerCountry
      };

      const res = await fetch('/api/bills/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bill) {
          setSelectedBillForPrint(data.bill);
        }
        return { success: true, bill: data.bill };
      }
    } catch (err) {
      console.error('Failed to generate direct bill:', err);
    }
    return { success: false };
  };

  // Batch CSV menu import
  const importCsvMenu = async (items: MenuItem[], mode: 'append' | 'replace' = 'append') => {
    try {
      const res = await fetch('/api/menu/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, mode })
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, count: data.count, totalMenu: data.totalMenu };
      }
    } catch {
      // offline fallback
      setState(prev => {
        let newMenu = [...prev.menu];
        if (mode === 'replace') {
          newMenu = items;
        } else {
          items.forEach(newItem => {
            const idx = newMenu.findIndex(m => m.name.toLowerCase() === newItem.name.toLowerCase());
            if (idx > -1) newMenu[idx] = { ...newMenu[idx], ...newItem };
            else newMenu.push(newItem);
          });
        }
        return { ...prev, menu: newMenu };
      });
      return { success: true, count: items.length, totalMenu: items.length };
    }
    return { success: false };
  };

  // Menu updates
  const updateMenuItem = async (id: string, data: Partial<MenuItem>) => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return { success: true };
    } catch {
      setState(prev => ({
        ...prev,
        menu: prev.menu.map(m => m.id === id ? { ...m, ...data } : m)
      }));
    }
    return { success: true };
  };

  const addMenuItem = async (item: MenuItem) => {
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) return { success: true };
    } catch {
      setState(prev => ({
        ...prev,
        menu: [...prev.menu, item]
      }));
    }
    return { success: true };
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) return { success: true };
    } catch {
      setState(prev => ({
        ...prev,
        menu: prev.menu.filter(m => m.id !== id)
      }));
    }
    return { success: true };
  };

  // Automated Ingestion Script: Re-sync with official PDF menu
  const syncPdfMenu = async () => {
    try {
      const res = await fetch('/api/menu/sync-official-pdf', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        return { success: true, count: data.count };
      }
    } catch {
      setState(prev => ({
        ...prev,
        menu: INITIAL_MENU,
        categories: MENU_CATEGORIES
      }));
    }
    return { success: true, count: INITIAL_MENU.length };
  };

  const updateSettings = async (settings: RestaurantSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) return { success: true };
    } catch {
      setState(prev => ({ ...prev, settings }));
    }
    return { success: true };
  };

  const updateStaffMember = async (id: string, data: Partial<StaffMember>) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return { success: true };
    } catch {
      setState(prev => ({
        ...prev,
        staff: prev.staff.map(s => s.id === id ? { ...s, ...data } : s)
      }));
    }
    return { success: true };
  };

  const restoreDatabase = async (incoming: DatabaseState) => {
    try {
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incoming)
      });
      if (res.ok) return { success: true };
    } catch {
      setState(incoming);
    }
    return { success: true };
  };

  return (
    <RestaurantContext.Provider
      value={{
        state,
        loading,
        activeTab,
        setActiveTab,
        currentStaff,
        setCurrentStaff,
        language,
        setLanguage,
        roomAccounts,
        selectedRoom,
        setSelectedRoom,
        selectedBillForPrint,
        setSelectedBillForPrint,
        selectedOrderForDetails,
        setSelectedOrderForDetails,
        isOnline,
        createOrder,
        updateOrderStatus,
        recordPayment,
        settleRoom,
        generateDirectBill,
        updateMenuItem,
        addMenuItem,
        deleteMenuItem,
        importCsvMenu,
        syncPdfMenu,
        updateSettings,
        updateStaffMember,
        restoreDatabase
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
