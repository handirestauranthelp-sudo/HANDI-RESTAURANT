import { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Bill } from '../../types/restaurant';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { 
  Receipt, 
  Search, 
  Printer, 
  Calendar, 
  DoorClosed, 
  Store, 
  Filter,
  Share2,
  FileText
} from 'lucide-react';

export function AllBillsView() {
  const { state, setSelectedBillForPrint, language } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'room' | 'outside'>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Filter bills
  const filteredBills = useMemo(() => {
    return state.bills.filter(bill => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        bill.billNumber.toLowerCase().includes(q) ||
        (bill.roomNumber && bill.roomNumber.toLowerCase().includes(q)) ||
        (bill.customerName && bill.customerName.toLowerCase().includes(q)) ||
        (bill.customerPhone && bill.customerPhone.includes(q)) ||
        bill.orderIds.some(id => id.toLowerCase().includes(q));

      const matchesType = filterType === 'all' || 
        (filterType === 'room' && bill.orderType === 'room') ||
        (filterType === 'outside' && bill.orderType !== 'room');

      // Date range filter
      const billDate = bill.createdAt.slice(0, 10);
      const matchesStart = !filterStartDate || billDate >= filterStartDate;
      const matchesEnd = !filterEndDate || billDate <= filterEndDate;

      return matchesSearch && matchesType && matchesStart && matchesEnd;
    });
  }, [state.bills, searchQuery, filterType, filterStartDate, filterEndDate]);

  const totalBilled = filteredBills.reduce((s, b) => s + b.grandTotal, 0);
  const totalReceived = filteredBills.reduce((s, b) => s + b.paidAmount, 0);
  const totalBalance = filteredBills.reduce((s, b) => s + b.balanceDue, 0);

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Billing Ledger
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">Permanent Records</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            {language === 'hi' ? 'सभी बिल (All Invoices & Bills)' : 'All Generated Bills'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'कमरा नंबर, बिल नंबर, मोबाइल नंबर या तारीख से खोजें और पुनः प्रिंट करें।'
              : 'Search and reprint previous bills by room, bill number, phone or date.'}
          </p>
        </div>

        {/* Ledger Summary */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-750 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Invoiced</div>
            <div className="text-lg font-black text-white tabular-nums">
              {formatCurrency(totalBilled)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-750 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Balance Due</div>
            <div className="text-lg font-black text-amber-400 tabular-nums">
              {formatCurrency(totalBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bill No (e.g. BILL-2026...), Room (101), Customer Name or Phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('room')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'room' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
              }`}
            >
              Room Bills
            </button>
            <button
              onClick={() => setFilterType('outside')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'outside' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
              }`}
            >
              Outside Bills
            </button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400 flex-wrap">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Date Filter:</span>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="px-2 py-1 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white"
          />
          <span>to</span>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="px-2 py-1 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white"
          />
          {(filterStartDate || filterEndDate) && (
            <button
              onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
              className="text-amber-400 hover:underline font-medium"
            >
              Clear Dates
            </button>
          )}
        </div>
      </div>

      {/* Bills Table */}
      <div className="rounded-2xl bg-slate-850 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Source / Customer</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBills.map(bill => {
                const isRoom = bill.orderType === 'room';
                return (
                  <tr key={bill.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {bill.billNumber}
                    </td>

                    <td className="py-3 px-4">
                      {isRoom ? (
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <DoorClosed className="w-3.5 h-3.5" />
                          <span>Room {bill.roomNumber}</span>
                        </span>
                      ) : (
                        <div className="text-slate-300">
                          <span className="font-semibold">{bill.customerName || 'Direct Counter'}</span>
                          {bill.customerPhone && <span className="text-[10px] text-slate-500 block">{bill.customerPhone}</span>}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {formatDateTime(bill.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-slate-300 tabular-nums">
                      {bill.items.reduce((s, i) => s + i.quantity, 0)} items
                    </td>

                    <td className="py-3 px-4 text-slate-400 tabular-nums">
                      {formatCurrency(bill.subtotal)}
                    </td>

                    <td className="py-3 px-4 font-bold text-white tabular-nums">
                      {formatCurrency(bill.grandTotal)}
                    </td>

                    <td className="py-3 px-4 font-semibold text-emerald-400 tabular-nums">
                      {formatCurrency(bill.paidAmount)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        bill.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        bill.status === 'partial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {bill.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedBillForPrint(bill)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBills.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs space-y-1">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto stroke-1 mb-2" />
            <p className="font-semibold text-slate-300">No bills found</p>
            <p>Bills will appear here once food orders or room accounts are settled.</p>
          </div>
        )}
      </div>
    </div>
  );
}
