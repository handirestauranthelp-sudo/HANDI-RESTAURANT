import { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, PaymentMethod } from '../../types/restaurant';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { UpiQrCode } from '../common/UpiQrCode';
import { 
  ShoppingBag, 
  Store, 
  Truck, 
  Search, 
  Receipt, 
  CheckCircle2, 
  PlusCircle, 
  Clock,
  Printer,
  QrCode
} from 'lucide-react';

export function OutsideOrdersView() {
  const { state, generateDirectBill, setActiveTab, setSelectedBillForPrint, currentStaff, language } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'counter' | 'takeaway' | 'delivery'>('all');
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Outside orders only
  const outsideOrders = useMemo(() => {
    return state.orders.filter(order => {
      if (order.type === 'room') return false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        order.id.toLowerCase().includes(q) ||
        (order.customerName && order.customerName.toLowerCase().includes(q)) ||
        (order.customerPhone && order.customerPhone.includes(q));

      const matchesType = filterType === 'all' || order.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [state.orders, searchQuery, filterType]);

  const handleOpenBillModal = (order: Order) => {
    setBillingOrder(order);
    setPaidAmount(order.grandTotal.toString());
  };

  const handleCreateDirectBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingOrder) return;

    setIsSubmitting(true);
    const res = await generateDirectBill(
      billingOrder.id,
      {
        paymentMethod,
        paidAmount: Number(paidAmount) || billingOrder.grandTotal,
        customerCity: billingOrder.customerCity,
        customerCountry: billingOrder.customerCountry,
        collectedByStaff: currentStaff.name
      }
    );
    setIsSubmitting(false);

    if (res.success && res.bill) {
      setSelectedBillForPrint(res.bill);
      setBillingOrder(null);
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Outside Dining & Takeaway
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">Separate Billing Stream</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
            {language === 'hi' ? 'बाहरी ग्राहक ऑर्डर (Outside Orders)' : 'Outside Customer Orders'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'काउंटर, टेकअवे/पार्सल एवं होम डिलीवरी ऑर्डर्स और त्वरित बिलिंग।'
              : 'Counter sales, takeaway parcels, home delivery orders and fast billing.'}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('new-order')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'hi' ? 'नया बाहरी ऑर्डर' : 'Take Outside Order'}</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, customer name or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All Outside ({outsideOrders.length})
          </button>
          <button
            onClick={() => setFilterType('counter')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'counter' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Counter
          </button>
          <button
            onClick={() => setFilterType('takeaway')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'takeaway' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Takeaway
          </button>
          <button
            onClick={() => setFilterType('delivery')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'delivery' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Delivery
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {outsideOrders.map(order => {
          const hasBill = Boolean(order.billId);
          return (
            <div
              key={order.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                hasBill ? 'bg-slate-850/60 border-slate-800' : 'bg-slate-850 border-slate-750 shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                      {order.type === 'counter' ? <Store className="w-5 h-5" /> :
                       order.type === 'delivery' ? <Truck className="w-5 h-5" /> :
                       <ShoppingBag className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-mono font-bold text-white text-xs">{order.id}</div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">{order.type}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    order.status === 'served' ? 'bg-emerald-500/20 text-emerald-400' :
                    order.status === 'cancelled' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="py-2.5 text-xs text-slate-300 space-y-1">
                  {order.customerName && (
                    <div><span className="text-slate-500">Name:</span> {order.customerName}</div>
                  )}
                  {order.customerPhone && (
                    <div><span className="text-slate-500">Phone:</span> {order.customerPhone}</div>
                  )}
                  {order.deliveryAddress && (
                    <div className="text-[11px] text-slate-400"><span className="text-slate-500">Address:</span> {order.deliveryAddress}</div>
                  )}
                </div>

                {/* Items */}
                <div className="py-2 border-t border-slate-800 space-y-1 text-xs">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span>{item.name} {item.variantName && item.variantName !== 'Standard' ? `(${item.variantName})` : ''} x{item.quantity}</span>
                      <span className="font-mono text-white">₹{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Action */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Grand Total</div>
                  <div className="text-base font-black text-amber-400 tabular-nums">
                    {formatCurrency(order.grandTotal)}
                  </div>
                </div>

                {hasBill ? (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Billed ({order.billId})</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleOpenBillModal(order)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Generate Bill</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {outsideOrders.length === 0 && (
        <div className="py-12 text-center text-slate-500 text-xs rounded-2xl bg-slate-850 border border-slate-800">
          No outside customer orders found.
        </div>
      )}

      {/* Bill & Collect Payment Modal for Outside Order */}
      {billingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-750 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              <span>Bill & Collect Payment · {billingOrder.id}</span>
            </h3>

            <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 text-center">
              <span className="text-xs text-slate-400 block">Total Due Amount</span>
              <span className="text-2xl font-black text-amber-400 tabular-nums">
                {formatCurrency(billingOrder.grandTotal)}
              </span>
            </div>

            <form onSubmit={handleCreateDirectBill} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Payment Method:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'upi', 'card', 'other'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        paymentMethod === m
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'upi' && (
                <div className="p-2.5 bg-slate-850 rounded-xl border border-slate-750">
                  <UpiQrCode
                    amount={Number(paidAmount) || billingOrder.grandTotal}
                    upiId={state.settings.upiId || 'handirestaurant@upi'}
                    restaurantName={state.settings.restaurantName}
                    billNumber={billingOrder.id}
                    size={140}
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Amount Received (₹):
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setBillingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  Generate & Print Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
