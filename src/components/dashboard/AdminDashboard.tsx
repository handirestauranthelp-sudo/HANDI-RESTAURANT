import { useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatTime, getRelativeTime } from '../../utils/formatters';
import { 
  TrendingUp, 
  DoorClosed, 
  ShoppingBag, 
  Banknote, 
  AlertCircle, 
  UtensilsCrossed, 
  ChefHat, 
  CheckCircle2, 
  ArrowUpRight,
  Clock,
  PlusCircle,
  CreditCard,
  Receipt
} from 'lucide-react';

export function AdminDashboard() {
  const { state, setActiveTab, setSelectedRoom, language } = useRestaurant();

  // Compute live dashboard metrics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    const validOrders = state.orders.filter(o => o.status !== 'cancelled');
    const todayOrders = validOrders.filter(o => o.createdAt.startsWith(todayStr));

    const todayRoomOrders = todayOrders.filter(o => o.type === 'room');
    const todayOutsideOrders = todayOrders.filter(o => o.type !== 'room');

    const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    // Payments received today
    const todayPayments = state.payments
      .filter(p => p.status === 'completed' && p.createdAt.startsWith(todayStr))
      .reduce((sum, p) => sum + p.amount, 0);

    // Total payments received all time
    const totalPaymentsReceived = state.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    // Pending Amount across all unsettled active room orders + outside orders
    const totalBilledAllTime = validOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const pendingAmount = Math.max(0, totalBilledAllTime - totalPaymentsReceived);

    // Kitchen order states
    const pendingKitchenOrders = state.orders.filter(o => o.status === 'pending' || o.status === 'preparing');
    const completedOrders = state.orders.filter(o => o.status === 'served');

    // Best-selling dishes
    const itemCounts: Record<string, { name: string; count: number; revenue: number; category: string }> = {};
    validOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.name;
        if (!itemCounts[key]) {
          itemCounts[key] = { name: item.name, count: 0, revenue: 0, category: '' };
        }
        itemCounts[key].count += item.quantity;
        itemCounts[key].revenue += item.total;
      });
    });

    const bestSellers = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Category-wise sales
    const categoryTotals: Record<string, number> = {};
    validOrders.forEach(order => {
      order.items.forEach(item => {
        // find category from menu
        const menuItem = state.menu.find(m => m.name === item.name);
        const cat = menuItem?.category || 'Handi Specials';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.total;
      });
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Payment methods breakdown
    const methodTotals = {
      cash: 0,
      upi: 0,
      card: 0,
      other: 0
    };
    state.payments
      .filter(p => p.status === 'completed')
      .forEach(p => {
        const m = p.paymentMethod as keyof typeof methodTotals;
        if (methodTotals[m] !== undefined) {
          methodTotals[m] += p.amount;
        } else {
          methodTotals.other += p.amount;
        }
      });

    return {
      todaySales,
      todayRoomOrdersCount: todayRoomOrders.length,
      todayOutsideOrdersCount: todayOutsideOrders.length,
      todayPayments,
      totalPaymentsReceived,
      pendingAmount,
      totalOrdersCount: state.orders.length,
      pendingKitchenCount: pendingKitchenOrders.length,
      completedOrdersCount: completedOrders.length,
      bestSellers,
      categoryBreakdown,
      methodTotals,
      recentOrders: state.orders.slice(0, 7)
    };
  }, [state.orders, state.payments, state.menu]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-850 via-slate-800 to-slate-850 border border-slate-750 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Live POS Dashboard
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-1.5 tracking-tight">
            {language === 'hi' ? 'हांडी रेस्टोरेंट - कंट्रोल सेंटर' : 'Handi Restaurant - Command Center'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'hi' 
              ? '15 रूम के खाने का हिसाब, बाहरी ग्राहक, किचन KDS और स्मार्ट बिलिंग' 
              : '15 room food billing, outside counter orders, kitchen KDS & smart payments'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveTab('new-order')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'hi' ? 'नया ऑर्डर लें' : 'Take New Order'}</span>
          </button>

          <button
            onClick={() => setActiveTab('room-accounts')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <DoorClosed className="w-4 h-4 text-amber-400" />
            <span>{language === 'hi' ? '15 रूम खाते' : '15 Room Accounts'}</span>
          </button>

          <button
            onClick={() => setActiveTab('kitchen-display')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <ChefHat className="w-4 h-4 text-rose-400" />
            <span>{language === 'hi' ? 'किचन KDS' : 'Kitchen KDS'}</span>
          </button>
        </div>
      </div>

      {/* 8 POS Key Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* 1. Today's Total Sales */}
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{language === 'hi' ? 'आज की कुल बिक्री' : "Today's Total Sales"}</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white mt-2 tabular-nums">
            {formatCurrency(stats.todaySales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{stats.todayRoomOrdersCount + stats.todayOutsideOrdersCount} orders</span>
            <span>· Today</span>
          </div>
        </div>

        {/* 2. Today's Room Orders */}
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{language === 'hi' ? 'कमरे के ऑर्डर' : "Room Food Orders"}</span>
            <DoorClosed className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white mt-2 tabular-nums">
            {stats.todayRoomOrdersCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {language === 'hi' ? '15 फिक्स कमरों से' : 'Across 15 fixed rooms'}
          </div>
        </div>

        {/* 3. Today's Outside Customer Orders */}
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{language === 'hi' ? 'बाहरी ग्राहक ऑर्डर' : "Outside Orders"}</span>
            <ShoppingBag className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white mt-2 tabular-nums">
            {stats.todayOutsideOrdersCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {language === 'hi' ? 'काउंटर / पार्सल / डिलीवरी' : 'Counter, Takeaway & Delivery'}
          </div>
        </div>

        {/* 4. Total Payments Received */}
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{language === 'hi' ? 'प्राप्त भुगतान (आज)' : "Payments Today"}</span>
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-400 mt-2 tabular-nums">
            {formatCurrency(stats.todayPayments)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total: {formatCurrency(stats.totalPaymentsReceived)}
          </div>
        </div>

        {/* 5. Pending Amount */}
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{language === 'hi' ? 'बाकी राशि (Pending)' : "Pending Balance"}</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl md:text-2xl font-black text-amber-400 mt-2 tabular-nums">
            {formatCurrency(stats.pendingAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {language === 'hi' ? 'सक्रिय कमरों का बकाया' : 'Unsettled room balances'}
          </div>
        </div>

        {/* 6. Total Orders Count */}
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{language === 'hi' ? 'कुल ऑर्डर' : "Total Orders"}</span>
            <UtensilsCrossed className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white mt-2 tabular-nums">
            {stats.totalOrdersCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Lifetime recorded
          </div>
        </div>

        {/* 7. Pending Kitchen Orders */}
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{language === 'hi' ? 'किचन में लंबित' : "Kitchen Pending"}</span>
            <ChefHat className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-rose-400 mt-2 tabular-nums">
            {stats.pendingKitchenCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.pendingKitchenCount > 0 ? (
              <span className="text-rose-400 font-medium">Needs Attention</span>
            ) : (
              <span className="text-emerald-400">Kitchen all clear</span>
            )}
          </div>
        </div>

        {/* 8. Completed Orders */}
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{language === 'hi' ? 'सर्व किए गए ऑर्डर' : "Served Orders"}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-300 mt-2 tabular-nums">
            {stats.completedOrdersCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {language === 'hi' ? 'सफलतापूर्वक सर्व हुए' : 'Successfully served'}
          </div>
        </div>
      </div>

      {/* 2-Column Analytics Section: Best Sellers & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best-Selling Dishes */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'hi' ? 'सर्वाधिक बिकने वाले व्यंजन (Best-Selling Dishes)' : 'Top Selling Food Items'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'hi' ? 'हांडी व रेस्टोरेंट मेन्यू की वास्तविक बिक्री' : 'Based on actual recorded order items'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('menu')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>{language === 'hi' ? 'पूरा मेन्यू देखें' : 'View Menu'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {stats.bestSellers.length > 0 ? (
              stats.bestSellers.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-750/70 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs md:text-sm font-bold text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400">{item.count} portions ordered</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs md:text-sm font-bold text-amber-400 tabular-nums">
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className="text-[10px] text-slate-500">Revenue</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                {language === 'hi' 
                  ? 'अभी कोई ऑर्डर दर्ज नहीं हुआ है। "नया ऑर्डर" बटन दबाकर पहला ऑर्डर बनाएं!' 
                  : 'No orders recorded yet. Click "Take New Order" to start!'}
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {language === 'hi' ? 'भुगतान माध्यम (Payments)' : 'Payment Methods'}
              </h3>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-750 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">UPI / QR Code</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">{formatCurrency(stats.methodTotals.upi)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-750 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Cash (नकद)</span>
                <span className="text-sm font-bold text-amber-400 tabular-nums">{formatCurrency(stats.methodTotals.cash)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-750 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Debit / Credit Card</span>
                <span className="text-sm font-bold text-blue-400 tabular-nums">{formatCurrency(stats.methodTotals.card)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-750 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Other / Direct</span>
                <span className="text-sm font-bold text-slate-300 tabular-nums">{formatCurrency(stats.methodTotals.other)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('payments')}
            className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'भुगतान लेजर देखें' : 'View Payment Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">
              {language === 'hi' ? 'हालिया ऑर्डर्स (Recent Orders)' : 'Recent Live Orders'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'hi' ? 'कमरे व बाहरी ग्राहकों के ताज़ा ऑर्डर' : 'Real-time feed of recent orders'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('bills')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {stats.recentOrders.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.recentOrders.map(order => {
                  const isRoom = order.type === 'room';
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-white">
                        {order.id}
                      </td>
                      <td className="py-3 px-3">
                        {isRoom ? (
                          <button
                            onClick={() => {
                              setSelectedRoom(order.roomNumber || null);
                              setActiveTab('room-accounts');
                            }}
                            className="font-bold text-amber-400 hover:underline"
                          >
                            Room {order.roomNumber}
                          </button>
                        ) : (
                          <span className="capitalize text-slate-300">{order.type}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                        {order.items.map(i => `${i.name}${i.variantName ? ` (${i.variantName})` : ''} x${i.quantity}`).join(', ')}
                      </td>
                      <td className="py-3 px-3 text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{order.orderTimeFormatted || formatTime(order.createdAt)}</span>
                        <span className="text-[10px] text-slate-500">({getRelativeTime(order.createdAt)})</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-white tabular-nums">
                        {formatCurrency(order.grandTotal)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'served' ? 'bg-emerald-500/20 text-emerald-400' :
                          order.status === 'ready' ? 'bg-blue-500/20 text-blue-400' :
                          order.status === 'preparing' ? 'bg-amber-500/20 text-amber-400' :
                          order.status === 'cancelled' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {order.createdByStaff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recent orders yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
