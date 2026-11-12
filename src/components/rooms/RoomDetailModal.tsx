import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RoomAccount, PaymentMethod, ExtraCharge } from '../../types/restaurant';
import { formatCurrency, formatDateTime, formatTime } from '../../utils/formatters';
import { UpiQrCode } from '../common/UpiQrCode';
import { 
  X, 
  DoorClosed, 
  PlusCircle, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  AlertCircle,
  Calendar,
  History,
  ChefHat,
  User,
  Phone,
  MapPin,
  QrCode,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';

interface RoomDetailModalProps {
  roomNumber: string;
  onClose: () => void;
}

export function RoomDetailModal({ roomNumber, onClose }: RoomDetailModalProps) {
  const { 
    state,
    roomAccounts, 
    recordPayment, 
    settleRoom, 
    setActiveTab, 
    setSelectedBillForPrint, 
    currentStaff,
    language 
  } = useRestaurant();

  const [activeTab, setActiveTabInternal] = useState<'current' | 'history' | 'payment' | 'settle'>('current');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Settlement Specific States
  const [settlementDiscount, setSettlementDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('Discount');
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [newChargeName, setNewChargeName] = useState('Service Charge');
  const [newChargeAmount, setNewChargeAmount] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerCity, setCustomerCity] = useState<string>(state.settings.city || 'Jaipur');
  const [collectedByStaff, setCollectedByStaff] = useState<string>(currentStaff.name);

  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const room = roomAccounts.find(r => r.roomNumber === roomNumber);

  // Active / Unsettled orders for current running food session
  const activeOrders = useMemo(() => {
    if (!room) return [];
    return room.orders.filter(o => o.status !== 'cancelled' && !o.billId);
  }, [room]);

  // Active unbilled payments
  const activePayments = useMemo(() => {
    if (!room) return [];
    return room.payments.filter(p => !p.billId && p.status === 'completed');
  }, [room]);

  // Historical settled bills for this room
  const settledBills = useMemo(() => {
    if (!room) return [];
    return room.bills;
  }, [room]);

  // Filtered orders for date range review
  const allHistoricalOrders = useMemo(() => {
    if (!room) return [];
    return room.orders.filter(order => {
      if (!filterStartDate && !filterEndDate) return true;
      const orderDate = order.createdAt.slice(0, 10);
      if (filterStartDate && orderDate < filterStartDate) return false;
      if (filterEndDate && orderDate > filterEndDate) return false;
      return true;
    });
  }, [room, filterStartDate, filterEndDate]);

  if (!room) return null;

  // Handle Recording Partial / Multiple Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    await recordPayment({
      roomNumber,
      amount,
      paymentMethod,
      notes: paymentNotes || `Partial payment for Room ${roomNumber}`
    });
    setIsSubmitting(false);
    setPaymentAmount('');
    setPaymentNotes('');
    setActiveTabInternal('current');
  };

  // Calculations for settlement
  const totalExtraCharges = useMemo(() => {
    return extraCharges.reduce((s, ec) => s + (Number(ec.amount) || 0), 0);
  }, [extraCharges]);

  const netPayable = useMemo(() => {
    return Math.max(0, room.remainingBalance + totalExtraCharges - settlementDiscount);
  }, [room.remainingBalance, totalExtraCharges, settlementDiscount]);

  const handleAddExtraCharge = () => {
    const amt = Number(newChargeAmount);
    if (!newChargeName || isNaN(amt) || amt <= 0) return;
    setExtraCharges(prev => [...prev, { name: newChargeName.trim(), amount: amt }]);
    setNewChargeAmount('');
  };

  const handleRemoveCharge = (index: number) => {
    setExtraCharges(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Full Account Settlement
  const handleSettleAccount = async () => {
    if (activeOrders.length === 0) return;
    const confirmMsg = language === 'hi' 
      ? `क्या आप कमरा ${roomNumber} का फ़ूड खाता सेटल करके फ़ाइनल बिल जनरेट करना चाहते हैं? कुल देय: ₹${netPayable}`
      : `Settle Room ${roomNumber} food account and generate final bill? Net Due: ₹${netPayable}`;
    
    if (window.confirm(confirmMsg)) {
      setIsSubmitting(true);
      const res = await settleRoom(roomNumber, {
        paymentMethod,
        discount: settlementDiscount,
        discountReason: discountReason || 'Settlement Discount',
        extraCharges,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerCity: customerCity.trim() || undefined,
        collectedByStaff
      });
      setIsSubmitting(false);
      if (res.success && res.bill) {
        setSelectedBillForPrint(res.bill);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-4 md:p-5 bg-slate-850 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex flex-col items-center justify-center">
              <span className="text-[10px] font-semibold text-slate-400">ROOM</span>
              <span className="text-lg font-black text-white">{room.roomNumber}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  {language === 'hi' ? `कमरा ${room.roomNumber} - फ़ूड अकाउंट` : `Room ${room.roomNumber} - Food Account`}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Floor {room.floor}
                </span>
                {room.isOccupiedFoodActive ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Active Orders
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Settled / Clear
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'hi' 
                  ? 'केवल रेस्टोरेंट खाने का रनिंग अकाउंट (कोई रूम रेंट नहीं)' 
                  : 'Running restaurant food account only (No room rent)'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial KPI Banner for this room */}
        <div className="grid grid-cols-3 bg-slate-850/50 border-b border-slate-850 p-4 text-center divide-x divide-slate-800">
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              {language === 'hi' ? 'कुल फ़ूड बिल (Active)' : 'Total Food Billed'}
            </div>
            <div className="text-base md:text-xl font-black text-white mt-0.5 tabular-nums">
              {formatCurrency(room.totalFoodAmount)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{activeOrders.length} orders pending settlement</div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400">
              {language === 'hi' ? 'प्राप्त भुगतान (Paid)' : 'Payment Received'}
            </div>
            <div className="text-base md:text-xl font-black text-emerald-400 mt-0.5 tabular-nums">
              {formatCurrency(room.totalPaymentReceived)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{activePayments.length} payments recorded</div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-slate-400">
              {language === 'hi' ? 'बाकी राशि (Balance Due)' : 'Remaining Balance'}
            </div>
            <div className={`text-base md:text-xl font-black mt-0.5 tabular-nums ${
              room.remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {formatCurrency(room.remainingBalance)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {room.remainingBalance > 0 ? 'Pending Payment' : 'Fully Settled'}
            </div>
          </div>
        </div>

        {/* Inner Tabs: Current Running Session | Record Payment | History | Settle & Bill */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTabInternal('current')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'current'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'वर्तमान रनिंग ऑर्डर्स' : 'Current Orders'} ({activeOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTabInternal('payment')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'payment'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'आंशिक भुगतान' : 'Partial Payment'}</span>
          </button>

          {activeOrders.length > 0 && (
            <button
              onClick={() => setActiveTabInternal('settle')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'settle'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'खाता सेटल व बिल' : 'Settle & Bill'} (₹{netPayable})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTabInternal('history')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'पुराना इतिहास' : 'History'} ({room.bills.length})</span>
          </button>
        </div>

        {/* Tab Content Viewport */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Current Running Food Session */}
          {activeTab === 'current' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {language === 'hi' ? 'कमरे के रनिंग फ़ूड ऑर्डर्स की सूची:' : 'Food Order History in Active Session:'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {language === 'hi'
                      ? 'अतिथि एक दिन में या कई दिनों में जितनी बार भी खाना मंगाएं, सभी यहाँ जुड़ते हैं।'
                      : 'All orders accumulate in this running food account until settled.'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('new-order');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{language === 'hi' ? 'रूम में खाना जोड़ें' : 'Add Food Order'}</span>
                </button>
              </div>

              {activeOrders.length > 0 ? (
                <div className="space-y-3">
                  {activeOrders.map((order, idx) => (
                    <div key={order.id} className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-2.5">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{order.id}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'served' ? 'bg-emerald-500/20 text-emerald-400' :
                          order.status === 'ready' ? 'bg-blue-500/20 text-blue-400' :
                          order.status === 'preparing' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Items table */}
                      <div className="space-y-1.5 text-xs">
                        {order.items.map((item, iIdx) => (
                          <div key={iIdx} className="flex items-center justify-between text-slate-300">
                            <div>
                              <span className="font-medium text-white">{item.name}</span>
                              {item.variantName && item.variantName !== 'Standard' && (
                                <span className="text-amber-400 ml-1 text-[11px]">({item.variantName})</span>
                              )}
                              <span className="text-slate-400 ml-2">× {item.quantity}</span>
                            </div>
                            <span className="font-mono text-white tabular-nums">
                              ₹{item.total}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                        <span className="text-[11px] text-slate-400">Billed by {order.createdByStaff}</span>
                        <div className="font-bold text-amber-400 tabular-nums">
                          Total: {formatCurrency(order.grandTotal)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                  <ChefHat className="w-8 h-8 text-slate-600 mx-auto stroke-1" />
                  <p className="font-semibold text-slate-300">
                    {language === 'hi' ? 'कमरा 101 में अभी कोई सक्रिय फ़ूड ऑर्डर नहीं है।' : `No active food orders for Room ${roomNumber}.`}
                  </p>
                  <p className="text-slate-500">
                    {language === 'hi' ? '"रूम में खाना जोड़ें" दबाकर नया ऑर्डर दर्ज करें।' : 'Click "Add Food Order" above to place an order.'}
                  </p>
                </div>
              )}

              {/* Running Payments Recorded */}
              {activePayments.length > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {language === 'hi' ? 'प्राप्त आंशिक भुगतान (Partial Payments Received):' : 'Payments Recorded:'}
                  </div>
                  {activePayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs text-emerald-200">
                      <span>{p.paymentMethod.toUpperCase()} · {formatDateTime(p.createdAt)} ({p.receivedByStaff})</span>
                      <span className="font-bold font-mono">₹{p.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Record Partial / Full Payment */}
          {activeTab === 'payment' && (
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Current Remaining Food Balance</span>
                <span className="text-2xl font-black text-amber-400 tabular-nums">
                  {formatCurrency(room.remainingBalance)}
                </span>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 bg-slate-850 p-5 rounded-xl border border-slate-750">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  {language === 'hi' ? 'आंशिक या पूर्ण भुगतान दर्ज करें' : 'Record Food Payment'}
                </h4>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {language === 'hi' ? 'भुगतान राशि (₹ Amount):' : 'Amount (₹):'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={room.remainingBalance > 0 ? room.remainingBalance * 2 : 100000}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={room.remainingBalance.toString()}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(room.remainingBalance.toString())}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                    >
                      Fill Full Balance (₹{room.remainingBalance})
                    </button>
                    {room.remainingBalance > 500 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount('500')}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      >
                        ₹500
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {language === 'hi' ? 'भुगतान का माध्यम (Method):' : 'Payment Method:'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['cash', 'upi', 'card', 'other'] as PaymentMethod[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                          paymentMethod === m
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {language === 'hi' ? 'टिप्पणी / संदर्भ (वैकल्पिक):' : 'Notes / Ref:'}
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Paid by Guest UPI"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'hi' ? 'भुगतान सुरक्षित सेव करें' : 'Save Payment'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: History & Settled Bills */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Date range filter */}
              <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Date Range Filter:</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <span className="text-slate-500">to</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  {(filterStartDate || filterEndDate) && (
                    <button
                      onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                      className="text-amber-400 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Past Bills */}
              {settledBills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'hi' ? 'पूर्व में सेटल किए गए बिल (Settled Bills):' : 'Settled Bills Archive:'}
                  </h4>
                  {settledBills.map(b => (
                    <div key={b.id} className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-mono font-bold text-white">{b.billNumber}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(b.createdAt)} · {b.items.length} items
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-white tabular-nums">{formatCurrency(b.grandTotal)}</div>
                          <div className="text-[10px] text-emerald-400 font-medium uppercase">{b.status}</div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBillForPrint(b);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 font-bold"
                        >
                          Reprint
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Complete order log */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {language === 'hi' ? 'सभी ऐतिहासिक ऑर्डर (All Historical Orders):' : 'All Historical Orders:'}
                </h4>
                {allHistoricalOrders.length > 0 ? (
                  allHistoricalOrders.map(order => (
                    <div key={order.id} className="p-3 rounded-xl bg-slate-850/70 border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-white mr-2">{order.id}</span>
                        <span className="text-slate-400">{formatDateTime(order.createdAt)}</span>
                        <span className="text-slate-500 ml-2">({order.items.length} items)</span>
                      </div>
                      <span className="font-bold text-white tabular-nums">{formatCurrency(order.grandTotal)}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No orders matching selected criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Settle Account & Generate Bill */}
          {activeTab === 'settle' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left col: Guest info, extra charges, staff, discount (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  {/* Guest Info (Optional) */}
                  <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'अतिथि की जानकारी (बिल व WhatsApp हेतु)' : 'Guest Details (For Bill & WhatsApp)'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">
                          {language === 'hi' ? 'अतिथि का नाम (Name)' : 'Guest Name'}
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">
                          {language === 'hi' ? 'WhatsApp मोबाइल नंबर' : 'WhatsApp Mobile'}
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 mb-1">
                          {language === 'hi' ? 'शहर / पता (City)' : 'Guest City / Address'}
                        </label>
                        <input
                          type="text"
                          value={customerCity}
                          onChange={(e) => setCustomerCity(e.target.value)}
                          placeholder="e.g. Jaipur"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Extra Charges (Service Charge, Packaging etc.) */}
                  <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {language === 'hi' ? 'अतिरिक्त शुल्क / सर्विस चार्ज (Extra Charges)' : 'Service Charge & Extra Additions'}
                      </h4>
                      <span className="text-[11px] font-bold text-amber-400 font-mono">
                        +{formatCurrency(totalExtraCharges)}
                      </span>
                    </div>

                    {extraCharges.length > 0 && (
                      <div className="space-y-1.5">
                        {extraCharges.map((ec, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-750">
                            <span className="font-medium text-white">{ec.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-amber-400">+₹{ec.amount}</span>
                              <button
                                onClick={() => handleRemoveCharge(idx)}
                                className="text-slate-400 hover:text-rose-400 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add extra charge inputs */}
                    <div className="flex items-center gap-2 text-xs pt-1">
                      <input
                        type="text"
                        value={newChargeName}
                        onChange={(e) => setNewChargeName(e.target.value)}
                        placeholder="Charge Name (e.g. Service Charge)"
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white"
                      />
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          min={1}
                          value={newChargeAmount}
                          onChange={(e) => setNewChargeAmount(e.target.value)}
                          placeholder="Amount"
                          className="w-full pl-6 pr-2 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddExtraCharge}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Discount & Staff Collector */}
                  <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">
                          {language === 'hi' ? 'छूट / डिस्काउंट (₹ Discount)' : 'Discount Amount (₹)'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                          <input
                            type="number"
                            min={0}
                            value={settlementDiscount || ''}
                            onChange={(e) => setSettlementDiscount(Math.max(0, Number(e.target.value) || 0))}
                            placeholder="0"
                            className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">
                          {language === 'hi' ? 'बिल संग्रहकर्ता स्टाफ (Collected By)' : 'Payment Collected By Staff'}
                        </label>
                        <select
                          value={collectedByStaff}
                          onChange={(e) => setCollectedByStaff(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold"
                        >
                          {state.staff.map(s => (
                            <option key={s.id} value={s.name}>
                              {s.name} ({s.role.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      {language === 'hi' ? 'भुगतान का माध्यम (Payment Method):' : 'Payment Method:'}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['cash', 'upi', 'card', 'other'] as PaymentMethod[]).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                            paymentMethod === m
                              ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                              : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {m === 'upi' && <QrCode className="w-3.5 h-3.5" />}
                          <span>{m}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right col: Dynamic UPI QR Preview & Financial Summary (5 cols) */}
                <div className="md:col-span-5 space-y-4">
                  {/* If UPI chosen: Live Dynamic QR code for EXACT netPayable amount */}
                  {paymentMethod === 'upi' ? (
                    <div className="p-3 bg-slate-850 rounded-2xl border border-slate-750">
                      <div className="text-center mb-2">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                          {language === 'hi' ? 'ग्राहक हेतु लाइव UPI QR कोड' : 'Live UPI QR For Customer'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {language === 'hi' ? 'स्कैन करते ही ऑटोमैटिक सटीक बिल राशि खुलेगी' : 'Customer pays locked exact bill amount'}
                        </span>
                      </div>
                      <UpiQrCode
                        amount={netPayable}
                        upiId={state.settings.upiId || 'handirestaurant@upi'}
                        restaurantName={state.settings.restaurantName}
                        billNumber={`ROOM-${roomNumber}`}
                        size={170}
                      />
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-850 border border-slate-750 text-center space-y-2">
                      <CreditCard className="w-8 h-8 text-slate-500 mx-auto" />
                      <div className="text-sm font-bold text-white uppercase">{paymentMethod} Payment Selected</div>
                      <p className="text-xs text-slate-400">
                        {language === 'hi' 
                          ? 'बिल सेटल करते ही बिल का प्रिंट और WhatsApp शेयरिंग विंडो खुलेगी।'
                          : 'Settling account will finalize the bill and open the print & WhatsApp dialog.'}
                      </p>
                    </div>
                  )}

                  {/* Summary Breakdown */}
                  <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Total Active Food Orders</span>
                      <span className="font-mono text-slate-200 tabular-nums">{formatCurrency(room.totalFoodAmount)}</span>
                    </div>

                    {room.totalPaymentReceived > 0 && (
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Partial Payments Received</span>
                        <span className="font-mono tabular-nums">-{formatCurrency(room.totalPaymentReceived)}</span>
                      </div>
                    )}

                    {totalExtraCharges > 0 && (
                      <div className="flex items-center justify-between text-amber-400">
                        <span>Extra Charges (Service etc.)</span>
                        <span className="font-mono tabular-nums">+{formatCurrency(totalExtraCharges)}</span>
                      </div>
                    )}

                    {settlementDiscount > 0 && (
                      <div className="flex items-center justify-between text-rose-400">
                        <span>Discount Applied</span>
                        <span className="font-mono tabular-nums">-{formatCurrency(settlementDiscount)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-750 flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Net Final Due:</span>
                      <span className="text-xl font-black text-amber-400 tabular-nums">{formatCurrency(netPayable)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSettleAccount}
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {isSubmitting 
                        ? 'Settling Account...' 
                        : language === 'hi' 
                          ? `खाता सेटल करें व बिल निकालें (₹${netPayable})` 
                          : `Finalize Bill & Settle (₹${netPayable})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Account Settlement Action */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {activeOrders.length > 0 ? (
              <span>
                {activeOrders.length} food orders pending settlement · Net Due: <strong className="text-amber-400">{formatCurrency(netPayable)}</strong>
              </span>
            ) : (
              <span className="text-emerald-400">Account is balanced & clear.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-300 w-full sm:w-auto"
            >
              {language === 'hi' ? 'बंद करें' : 'Close'}
            </button>

            {activeOrders.length > 0 && (
              <button
                onClick={() => {
                  if (activeTab !== 'settle') {
                    setActiveTabInternal('settle');
                  } else {
                    handleSettleAccount();
                  }
                }}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Receipt className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {activeTab !== 'settle'
                    ? (language === 'hi' ? 'खाता सेटल व बिलिंग पर जाएँ' : 'Go to Settle & Bill')
                    : (language === 'hi' ? `फ़ाइनल बिल निकालें (₹${netPayable})` : `Finalize & Print Bill (₹${netPayable})`)}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
