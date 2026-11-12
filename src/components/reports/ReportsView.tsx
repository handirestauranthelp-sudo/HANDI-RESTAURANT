import { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  DoorClosed, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  FileSpreadsheet
} from 'lucide-react';

export function ReportsView() {
  const { state, language } = useRestaurant();

  const [reportPeriod, setReportPeriod] = useState<'today' | 'last7' | 'month' | 'all'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Filter orders and payments by period
  const { ordersInPeriod, paymentsInPeriod } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const isMatch = (iso: string) => {
      const d = iso.slice(0, 10);
      if (customStart || customEnd) {
        if (customStart && d < customStart) return false;
        if (customEnd && d > customEnd) return false;
        return true;
      }
      if (reportPeriod === 'today') return d === todayStr;
      if (reportPeriod === 'last7') return d >= sevenDaysAgo;
      if (reportPeriod === 'month') return d >= monthStart;
      return true;
    };

    return {
      ordersInPeriod: state.orders.filter(o => isMatch(o.createdAt)),
      paymentsInPeriod: state.payments.filter(p => isMatch(p.createdAt))
    };
  }, [state.orders, state.payments, reportPeriod, customStart, customEnd]);

  // Compute detailed financial aggregates
  const reportData = useMemo(() => {
    const validOrders = ordersInPeriod.filter(o => o.status !== 'cancelled');
    const cancelledOrders = ordersInPeriod.filter(o => o.status === 'cancelled');

    const roomSales = validOrders.filter(o => o.type === 'room').reduce((s, o) => s + o.grandTotal, 0);
    const outsideSales = validOrders.filter(o => o.type !== 'room').reduce((s, o) => s + o.grandTotal, 0);
    const totalFoodSales = roomSales + outsideSales;

    const completedPayments = paymentsInPeriod.filter(p => p.status === 'completed');
    const totalPaymentsReceived = completedPayments.reduce((s, p) => s + p.amount, 0);

    const cashPayments = completedPayments.filter(p => p.paymentMethod === 'cash').reduce((s, p) => s + p.amount, 0);
    const upiPayments = completedPayments.filter(p => p.paymentMethod === 'upi').reduce((s, p) => s + p.amount, 0);
    const cardPayments = completedPayments.filter(p => p.paymentMethod === 'card').reduce((s, p) => s + p.amount, 0);
    const otherPayments = completedPayments.filter(p => p.paymentMethod === 'other').reduce((s, p) => s + p.amount, 0);

    const outstandingBalance = Math.max(0, totalFoodSales - totalPaymentsReceived);

    // Category Sales
    const categoryTotals: Record<string, number> = {};
    validOrders.forEach(o => {
      o.items.forEach(i => {
        const cat = state.menu.find(m => m.name === i.name)?.category || 'Handi Specials';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + i.total;
      });
    });

    // Room-wise Sales
    const roomTotals: Record<string, number> = {};
    validOrders.filter(o => o.roomNumber).forEach(o => {
      const rm = o.roomNumber!;
      roomTotals[rm] = (roomTotals[rm] || 0) + o.grandTotal;
    });

    // Employee-wise orders
    const staffTotals: Record<string, { count: number; sales: number }> = {};
    validOrders.forEach(o => {
      const s = o.createdByStaff || 'Staff';
      if (!staffTotals[s]) staffTotals[s] = { count: 0, sales: 0 };
      staffTotals[s].count++;
      staffTotals[s].sales += o.grandTotal;
    });

    return {
      totalFoodSales,
      roomSales,
      outsideSales,
      totalPaymentsReceived,
      cashPayments,
      upiPayments,
      cardPayments,
      otherPayments,
      outstandingBalance,
      validOrdersCount: validOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      categoryTotals,
      roomTotals,
      staffTotals
    };
  }, [ordersInPeriod, paymentsInPeriod, state.menu]);

  // Export Report to CSV
  const handleExportCSV = () => {
    let csv = `HANDI RESTAURANT - SALES REPORT\n`;
    csv += `Period: ${reportPeriod.toUpperCase()}\n`;
    csv += `Generated At: ${formatDateTime(new Date().toISOString())}\n\n`;
    csv += `METRIC,AMOUNT (INR)\n`;
    csv += `Total Food Sales,${reportData.totalFoodSales}\n`;
    csv += `Room Orders Sales,${reportData.roomSales}\n`;
    csv += `Outside Orders Sales,${reportData.outsideSales}\n`;
    csv += `Total Payments Received,${reportData.totalPaymentsReceived}\n`;
    csv += `Cash Payments,${reportData.cashPayments}\n`;
    csv += `UPI Payments,${reportData.upiPayments}\n`;
    csv += `Card Payments,${reportData.cardPayments}\n`;
    csv += `Outstanding Balance,${reportData.outstandingBalance}\n`;
    csv += `Valid Orders Count,${reportData.validOrdersCount}\n`;
    csv += `Cancelled Orders Count,${reportData.cancelledOrdersCount}\n\n`;

    csv += `ROOM-WISE SALES\nROOM,SALES (INR)\n`;
    Object.entries(reportData.roomTotals).forEach(([rm, amt]) => {
      csv += `Room ${rm},${amt}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `handi_sales_report_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Financial & Audit Analytics
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">Database Audited</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            {language === 'hi' ? 'दैनिक, साप्ताहिक व मासिक बिक्री रिपोर्ट्स' : 'Daily, Weekly & Monthly Reports'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'कमरा-वार, श्रेणी-वार, स्टाफ-वार व भुगतान माध्यम अनुसार विस्तृत आय विवरण।'
              : 'Detailed breakdown of room sales, category sales, staff performance and payment modes.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {(['today', 'last7', 'month', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => {
                setReportPeriod(p);
                setCustomStart('');
                setCustomEnd('');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                reportPeriod === p && !customStart
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {p === 'today' ? (language === 'hi' ? 'आज (Today)' : 'Today') :
               p === 'last7' ? (language === 'hi' ? 'पिछले 7 दिन' : 'Last 7 Days') :
               p === 'month' ? (language === 'hi' ? 'इस महीने' : 'This Month') : 'All Time'}
            </button>
          ))}
        </div>

        {/* Custom Range */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 bg-slate-900 border border-slate-750 rounded text-xs text-white"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 bg-slate-900 border border-slate-750 rounded text-xs text-white"
          />
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <span className="text-slate-400 text-xs">Total Food Sales</span>
          <div className="text-xl md:text-2xl font-black text-white mt-1 tabular-nums">
            {formatCurrency(reportData.totalFoodSales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{reportData.validOrdersCount} successful orders</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <span className="text-slate-400 text-xs">Room Food Sales</span>
          <div className="text-xl md:text-2xl font-black text-amber-400 mt-1 tabular-nums">
            {formatCurrency(reportData.roomSales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">From 15 fixed rooms</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <span className="text-slate-400 text-xs">Outside Sales</span>
          <div className="text-xl md:text-2xl font-black text-blue-400 mt-1 tabular-nums">
            {formatCurrency(reportData.outsideSales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Counter & Takeaway</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <span className="text-slate-400 text-xs">Payments Collected</span>
          <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1 tabular-nums">
            {formatCurrency(reportData.totalPaymentsReceived)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Outstanding: {formatCurrency(reportData.outstandingBalance)}</div>
        </div>
      </div>

      {/* 2-Column: Room Sales vs Category Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room-wise Sales Table */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DoorClosed className="w-4 h-4 text-amber-400" />
              <span>Room-wise Food Sales</span>
            </h3>
            <span className="text-xs text-slate-400">15 Fixed Rooms</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {Object.keys(reportData.roomTotals).length > 0 ? (
              Object.entries(reportData.roomTotals).map(([rm, amt]) => (
                <div key={rm} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-750 text-xs">
                  <span className="font-bold text-white">Room {rm}</span>
                  <span className="font-bold text-amber-400 font-mono tabular-nums">{formatCurrency(amt)}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No room sales recorded in this period.
              </div>
            )}
          </div>
        </div>

        {/* Category-wise Sales Table */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Category-wise Food Sales</span>
            </h3>
            <span className="text-xs text-slate-400">Menu Groups</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {Object.keys(reportData.categoryTotals).length > 0 ? (
              Object.entries(reportData.categoryTotals).map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-750 text-xs">
                  <span className="font-semibold text-slate-200">{cat}</span>
                  <span className="font-bold text-emerald-400 font-mono tabular-nums">{formatCurrency(amt)}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No category sales recorded in this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Activity & Performance */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
          Staff-wise Order Summary
        </h3>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(reportData.staffTotals).map(([staff, data]) => (
            <div key={staff} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-750">
              <div className="font-bold text-white text-xs">{staff}</div>
              <div className="text-[11px] text-slate-400 mt-1">{data.count} orders placed</div>
              <div className="text-sm font-bold text-amber-400 mt-1 tabular-nums">{formatCurrency(data.sales)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
