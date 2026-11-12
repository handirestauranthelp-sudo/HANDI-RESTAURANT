import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_MENU, MENU_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_STAFF } from './src/data/initialMenu';
import { DatabaseState, Order, Payment, Bill, MenuItem, RestaurantSettings, AuditLog } from './src/types/restaurant';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dev server must run on port 3000 per environment constraints
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'handi_db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state and persistent file sync
let db: DatabaseState = loadDatabase();

function loadDatabase(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.menu) && parsed.menu.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading database file, initializing defaults:', err);
  }

  // Initial Seed from authentic Handi Restaurant PDF Menu
  const initial: DatabaseState = {
    menu: INITIAL_MENU,
    categories: MENU_CATEGORIES,
    orders: [],
    payments: [],
    bills: [],
    settings: DEFAULT_SETTINGS,
    staff: DEFAULT_STAFF,
    auditLogs: [
      {
        id: 'log-1',
        action: 'System Initialized',
        details: 'Authentic Handi Restaurant PDF Menu imported with 75 dishes and 15 Room Accounts.',
        staffName: 'System',
        timestamp: new Date().toISOString(),
        category: 'menu'
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  saveDatabase(initial);
  return initial;
}

function saveDatabase(state: DatabaseState) {
  try {
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// Server-Sent Events (SSE) clients for real-time live synchronization
type SSEClient = {
  id: string;
  res: Response;
};
let sseClients: SSEClient[] = [];

function broadcast(eventType: string, payload: unknown) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(message);
    } catch {
      // client disconnected
    }
  });
}

function generateOrderId(prefix = 'HANDI'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Count existing orders today
  const countToday = db.orders.filter(o => o.id.includes(dateStr)).length + 1;
  const seq = String(countToday).padStart(4, '0');
  let id = `${prefix}-${dateStr}-${seq}`;

  // Ensure unique ID
  let safety = 1;
  while (db.orders.some(o => o.id === id)) {
    id = `${prefix}-${dateStr}-${String(countToday + safety).padStart(4, '0')}`;
    safety++;
  }
  return id;
}

function generatePaymentId(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const count = db.payments.filter(p => p.id.includes(dateStr)).length + 1;
  return `PAY-${dateStr}-${String(count).padStart(4, '0')}`;
}

function generateBillId(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const count = db.bills.filter(b => b.id.includes(dateStr)).length + 1;
  return `BILL-${dateStr}-${String(count).padStart(4, '0')}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Get full state
  app.get('/api/state', (_req, res) => {
    res.json(db);
  });

  // Real-time SSE Stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

    const clientId = `${Date.now()}-${Math.random()}`;
    const newClient: SSEClient = { id: clientId, res };
    sseClients.push(newClient);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c.id !== clientId);
    });
  });

  // Create new order
  app.post('/api/orders', (req, res) => {
    try {
      const body = req.body;
      const orderId = generateOrderId(db.settings.orderIdPrefix || 'HANDI');
      const now = new Date();

      const newOrder: Order = {
        id: orderId,
        type: body.type || 'counter',
        roomNumber: body.roomNumber || undefined,
        customerName: body.customerName || undefined,
        customerPhone: body.customerPhone || undefined,
        customerCity: body.customerCity || undefined,
        customerCountry: body.customerCountry || undefined,
        deliveryAddress: body.deliveryAddress || undefined,
        items: body.items || [],
        subtotal: Number(body.subtotal) || 0,
        discount: Number(body.discount) || 0,
        discountType: body.discountType || 'flat',
        discountReason: body.discountReason || '',
        extraCharges: body.extraCharges || [],
        tax: Number(body.tax) || 0,
        grandTotal: Number(body.grandTotal) || 0,
        status: 'pending',
        createdAt: now.toISOString(),
        orderTimeFormatted: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        createdByStaff: body.createdByStaff || 'Restaurant Staff',
        staffRole: body.staffRole || 'restaurant',
        notes: body.notes || '',
        isPaid: false
      };

      db.orders.unshift(newOrder);

      // Add audit log
      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: 'New Order Created',
        details: `Order ${orderId} placed for ${newOrder.type === 'room' ? `Room ${newOrder.roomNumber}` : newOrder.type} (₹${newOrder.grandTotal}) by ${newOrder.createdByStaff}`,
        staffName: newOrder.createdByStaff,
        timestamp: now.toISOString(),
        category: 'order'
      };
      db.auditLogs.unshift(log);

      saveDatabase(db);
      broadcast('order_created', { order: newOrder, auditLog: log });
      res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Update order status (KDS Kitchen Display System)
  app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, cancellationReason, staffName } = req.body;
    const order = db.orders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const previousStatus = order.status;
    order.status = status;

    if (status === 'cancelled') {
      order.cancellationReason = cancellationReason || 'Cancelled by staff';
      order.cancelledBy = staffName || 'Staff';
    }

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: `Order Status Changed: ${previousStatus.toUpperCase()} → ${status.toUpperCase()}`,
      details: `Order ${order.id} status updated to ${status}${cancellationReason ? ` (Reason: ${cancellationReason})` : ''}`,
      staffName: staffName || 'Kitchen Staff',
      timestamp: new Date().toISOString(),
      category: 'order'
    };
    db.auditLogs.unshift(log);

    saveDatabase(db);
    broadcast('order_status_updated', { order, auditLog: log });
    res.json({ success: true, order });
  });

  // Record payment
  app.post('/api/payments', (req, res) => {
    try {
      const body = req.body;
      const paymentId = generatePaymentId();
      const now = new Date();

      const newPayment: Payment = {
        id: paymentId,
        paymentNumber: paymentId,
        orderId: body.orderId || undefined,
        roomNumber: body.roomNumber || undefined,
        billId: body.billId || undefined,
        amount: Number(body.amount) || 0,
        paymentMethod: body.paymentMethod || 'cash',
        transactionReference: body.transactionReference || undefined,
        status: 'completed',
        receivedByStaff: body.receivedByStaff || 'Reception Staff',
        createdAt: now.toISOString(),
        notes: body.notes || ''
      };

      db.payments.unshift(newPayment);

      // If tied to a specific order, update order isPaid flag if fully covered
      if (newPayment.orderId) {
        const order = db.orders.find(o => o.id === newPayment.orderId);
        if (order) {
          const totalPaidForOrder = db.payments
            .filter(p => p.orderId === order.id && p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);
          if (totalPaidForOrder >= order.grandTotal) {
            order.isPaid = true;
          }
        }
      }

      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: 'Payment Received',
        details: `Received ₹${newPayment.amount} via ${newPayment.paymentMethod.toUpperCase()} for ${newPayment.roomNumber ? `Room ${newPayment.roomNumber}` : `Order ${newPayment.orderId || 'Direct'}`} by ${newPayment.receivedByStaff}`,
        staffName: newPayment.receivedByStaff,
        timestamp: now.toISOString(),
        category: 'payment'
      };
      db.auditLogs.unshift(log);

      saveDatabase(db);
      broadcast('payment_received', { payment: newPayment, auditLog: log });
      res.status(201).json({ success: true, payment: newPayment });
    } catch (err) {
      console.error('Error recording payment:', err);
      res.status(500).json({ error: 'Failed to record payment' });
    }
  });

  // Settle room account & generate consolidated bill without deleting history
  app.post('/api/rooms/:roomNumber/settle', (req, res) => {
    try {
      const { roomNumber } = req.params;
      const { 
        staffName, 
        collectedByStaff,
        paymentMethod, 
        discountAmount = 0, 
        discountReason = '',
        extraCharges = [],
        customerName,
        customerPhone,
        customerCity,
        customerCountry
      } = req.body;

      // Find active unsettled orders for this room
      const roomOrders = db.orders.filter(
        o => o.roomNumber === roomNumber && o.status !== 'cancelled' && !o.billId
      );

      if (roomOrders.length === 0) {
        return res.status(400).json({ error: 'No active unsettled food orders for this room.' });
      }

      // Collect all order items
      const consolidatedItems = roomOrders.flatMap(o => o.items);
      const subtotal = roomOrders.reduce((sum, o) => sum + o.subtotal, 0);
      const taxAmount = roomOrders.reduce((sum, o) => sum + o.tax, 0);
      
      const extraChargesTotal = (extraCharges as { name: string; amount: number }[]).reduce(
        (sum, ec) => sum + (Number(ec.amount) || 0), 0
      );
      
      const grandTotal = Math.max(0, subtotal + taxAmount + extraChargesTotal - discountAmount);

      // Check existing payments made for this room that aren't tied to a prior bill
      const roomPayments = db.payments.filter(
        p => p.roomNumber === roomNumber && p.status === 'completed' && !p.billId
      );
      const alreadyPaid = roomPayments.reduce((sum, p) => sum + p.amount, 0);
      const balanceToPay = Math.max(0, grandTotal - alreadyPaid);

      const billId = generateBillId();
      const now = new Date();

      // If user provided payment method to settle remaining balance immediately
      if (balanceToPay > 0 && paymentMethod) {
        const autoPayment: Payment = {
          id: generatePaymentId(),
          paymentNumber: generatePaymentId(),
          roomNumber,
          billId,
          amount: balanceToPay,
          paymentMethod,
          status: 'completed',
          receivedByStaff: collectedByStaff || staffName || 'Reception',
          createdAt: now.toISOString(),
          notes: `Settlement payment for Bill ${billId}`
        };
        db.payments.unshift(autoPayment);
      }

      const totalPaidNow = balanceToPay > 0 && paymentMethod ? grandTotal : alreadyPaid;

      const newBill: Bill = {
        id: billId,
        billNumber: billId,
        orderIds: roomOrders.map(o => o.id),
        roomNumber,
        customerName: customerName || roomOrders.find(o => o.customerName)?.customerName,
        customerPhone: customerPhone || roomOrders.find(o => o.customerPhone)?.customerPhone,
        customerCity: customerCity || roomOrders.find(o => o.customerCity)?.customerCity,
        customerCountry: customerCountry || roomOrders.find(o => o.customerCountry)?.customerCountry,
        orderType: 'room',
        items: consolidatedItems,
        subtotal,
        discount: discountAmount,
        discountReason,
        extraCharges: extraCharges || [],
        taxPercent: db.settings.gstEnabled ? db.settings.gstPercent : 0,
        taxAmount,
        grandTotal,
        paidAmount: totalPaidNow,
        balanceDue: Math.max(0, grandTotal - totalPaidNow),
        status: totalPaidNow >= grandTotal ? 'paid' : (totalPaidNow > 0 ? 'partial' : 'unpaid'),
        paymentMethod: paymentMethod || undefined,
        createdAt: now.toISOString(),
        settledAt: totalPaidNow >= grandTotal ? now.toISOString() : undefined,
        generatedByStaff: staffName || 'Reception Staff',
        collectedByStaff: collectedByStaff || staffName || 'Reception Staff'
      };

      // Link orders and unbilled payments to this bill
      roomOrders.forEach(o => {
        o.billId = billId;
        o.isPaid = true;
      });
      roomPayments.forEach(p => {
        p.billId = billId;
      });

      db.bills.unshift(newBill);

      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: 'Room Account Settled',
        details: `Room ${roomNumber} food account settled. Bill ${billId} generated for ₹${grandTotal} by ${newBill.generatedByStaff}.`,
        staffName: staffName || 'Reception Staff',
        timestamp: now.toISOString(),
        category: 'settlement'
      };
      db.auditLogs.unshift(log);

      saveDatabase(db);
      broadcast('room_settled', { roomNumber, bill: newBill, auditLog: log });
      res.json({ success: true, bill: newBill });
    } catch (err) {
      console.error('Error settling room:', err);
      res.status(500).json({ error: 'Failed to settle room account' });
    }
  });

  // Create Outside Order Bill
  app.post('/api/bills/direct', (req, res) => {
    try {
      const { 
        orderId, 
        staffName, 
        collectedByStaff,
        paymentMethod, 
        paidAmount, 
        extraCharges = [], 
        discountAmount = 0, 
        discountReason = '',
        customerCity,
        customerCountry
      } = req.body;
      
      const order = db.orders.find(o => o.id === orderId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const extraChargesTotal = (extraCharges as { name: string; amount: number }[]).reduce(
        (sum, ec) => sum + (Number(ec.amount) || 0), 0
      );

      const computedGrandTotal = Math.max(0, order.subtotal + order.tax + extraChargesTotal - discountAmount);

      const billId = generateBillId();
      const now = new Date();
      const amountReceived = paidAmount !== undefined ? Number(paidAmount) : computedGrandTotal;

      if (amountReceived > 0 && paymentMethod) {
        const payment: Payment = {
          id: generatePaymentId(),
          paymentNumber: generatePaymentId(),
          orderId: order.id,
          billId,
          amount: amountReceived,
          paymentMethod,
          status: 'completed',
          receivedByStaff: collectedByStaff || staffName || 'Staff',
          createdAt: now.toISOString(),
          notes: `Direct billing payment for ${order.id}`
        };
        db.payments.unshift(payment);
      }

      const newBill: Bill = {
        id: billId,
        billNumber: billId,
        orderIds: [order.id],
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerCity: customerCity || order.customerCity,
        customerCountry: customerCountry || order.customerCountry,
        orderType: order.type,
        items: order.items,
        subtotal: order.subtotal,
        discount: discountAmount || order.discount,
        discountReason: discountReason || order.discountReason,
        extraCharges: extraCharges.length > 0 ? extraCharges : (order.extraCharges || []),
        taxPercent: db.settings.gstEnabled ? db.settings.gstPercent : 0,
        taxAmount: order.tax,
        grandTotal: computedGrandTotal,
        paidAmount: amountReceived,
        balanceDue: Math.max(0, computedGrandTotal - amountReceived),
        status: amountReceived >= computedGrandTotal ? 'paid' : (amountReceived > 0 ? 'partial' : 'unpaid'),
        paymentMethod: paymentMethod || undefined,
        createdAt: now.toISOString(),
        settledAt: amountReceived >= computedGrandTotal ? now.toISOString() : undefined,
        generatedByStaff: staffName || 'Restaurant Staff',
        collectedByStaff: collectedByStaff || staffName || 'Restaurant Staff'
      };

      order.billId = billId;
      order.isPaid = amountReceived >= computedGrandTotal;

      db.bills.unshift(newBill);

      saveDatabase(db);
      broadcast('bill_created', { bill: newBill });
      res.json({ success: true, bill: newBill });
    } catch (err) {
      console.error('Error generating bill:', err);
      res.status(500).json({ error: 'Failed to generate bill' });
    }
  });

  // Batch CSV Menu Import endpoint
  app.post('/api/menu/import-csv', (req, res) => {
    try {
      const { items, mode = 'append' } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No items provided in CSV' });
      }

      if (mode === 'replace') {
        db.menu = items;
      } else {
        // Append or update existing items by name or SKU
        items.forEach((newItem: MenuItem) => {
          const existingIdx = db.menu.findIndex(
            m => (newItem.sku && m.sku === newItem.sku) || m.name.toLowerCase() === newItem.name.toLowerCase()
          );
          if (existingIdx > -1) {
            db.menu[existingIdx] = { ...db.menu[existingIdx], ...newItem };
          } else {
            db.menu.push(newItem);
          }
        });
      }

      // Ensure all categories exist
      db.menu.forEach(item => {
        if (item.category && !db.categories.includes(item.category)) {
          db.categories.push(item.category);
        }
      });

      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: 'CSV Menu Import',
        details: `Imported ${items.length} items from CSV in ${mode} mode.`,
        staffName: 'Admin',
        timestamp: new Date().toISOString(),
        category: 'menu'
      };
      db.auditLogs.unshift(log);

      saveDatabase(db);
      broadcast('menu_updated', { menu: db.menu, categories: db.categories, auditLog: log });
      res.json({ success: true, count: items.length, totalMenu: db.menu.length });
    } catch (err) {
      console.error('Failed to import CSV menu:', err);
      res.status(500).json({ error: 'Failed to import CSV' });
    }
  });

  // Menu Management
  app.post('/api/menu', (req, res) => {
    try {
      const item: MenuItem = req.body;
      if (!item.name || !item.category) {
        return res.status(400).json({ error: 'Name and category are required' });
      }
      item.id = item.id || `item-${Date.now()}`;
      db.menu.push(item);
      if (!db.categories.includes(item.category)) {
        db.categories.push(item.category);
      }
      saveDatabase(db);
      broadcast('menu_updated', { menu: db.menu, categories: db.categories });
      res.status(201).json({ success: true, item });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add menu item' });
    }
  });

  app.put('/api/menu/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updated: MenuItem = req.body;
      const index = db.menu.findIndex(m => m.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      // Old bills retain original prices because OrderItem stores a snapshot `rate`!
      db.menu[index] = { ...db.menu[index], ...updated };
      saveDatabase(db);
      broadcast('menu_updated', { menu: db.menu, categories: db.categories });
      res.json({ success: true, item: db.menu[index] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  });

  app.delete('/api/menu/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.menu = db.menu.filter(m => m.id !== id);
      saveDatabase(db);
      broadcast('menu_updated', { menu: db.menu, categories: db.categories });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete menu item' });
    }
  });

  // Automated Ingestion Script: Re-sync with official PDF menu
  app.post('/api/menu/sync-official-pdf', (_req, res) => {
    try {
      db.menu = INITIAL_MENU;
      db.categories = MENU_CATEGORIES;
      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: 'Official Menu Sync',
        details: 'Automated menu ingestion reloaded 75 items with authentic PDF prices.',
        staffName: 'Admin',
        timestamp: new Date().toISOString(),
        category: 'menu'
      };
      db.auditLogs.unshift(log);
      saveDatabase(db);
      broadcast('menu_updated', { menu: db.menu, categories: db.categories, auditLog: log });
      res.json({ success: true, count: INITIAL_MENU.length });
    } catch (err) {
      res.status(500).json({ error: 'Failed to sync menu' });
    }
  });

  // Settings update
  app.put('/api/settings', (req, res) => {
    try {
      const newSettings: RestaurantSettings = req.body;
      db.settings = { ...db.settings, ...newSettings };
      saveDatabase(db);
      broadcast('settings_updated', { settings: db.settings });
      res.json({ success: true, settings: db.settings });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Staff PIN / Info update
  app.put('/api/staff/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { pin, phone, name } = req.body;
      const staffMember = db.staff.find(s => s.id === id);
      if (!staffMember) {
        return res.status(404).json({ error: 'Staff member not found' });
      }
      if (pin) staffMember.pin = pin;
      if (phone) staffMember.phone = phone;
      if (name) staffMember.name = name;
      saveDatabase(db);
      res.json({ success: true, staff: db.staff });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update staff' });
    }
  });

  // Export full database
  app.get('/api/export', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=handi_restaurant_backup_${Date.now()}.json`);
    res.send(JSON.stringify(db, null, 2));
  });

  // Restore database
  app.post('/api/restore', (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming || !Array.isArray(incoming.menu)) {
        return res.status(400).json({ error: 'Invalid database backup structure' });
      }
      db = incoming;
      saveDatabase(db);
      broadcast('database_restored', db);
      res.json({ success: true, message: 'Database successfully restored' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to restore database' });
    }
  });

  // Mount Vite development middleware or serve production static files
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Handi Restaurant POS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
