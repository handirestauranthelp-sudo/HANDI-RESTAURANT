import { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { 
  CreditCard, 
  Search, 
  Calendar, 
  Banknote, 
  QrCode, 
  PlusCircle, 
  DoorClosed,
  CheckCircle2,
  FileText
} from 'lucide-react';

export function PaymentsView() {
  const { state, language } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<'all' | 'cash' | 'upi' | 'card' | 'other'>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Computed summary
  const summary = useMemo(() => {
    let totalCash = 0;
    let totalUpi = 0;
    let totalCard = 0;
    let totalOther = 0;

    state.payments.forEach(p => {
      if (p.status !== 'completed') return;
      if (p.paymentMethod === 'cash') totalCash += p.amount;
      else if (p.paymentMethod === 'upi') totalUpi += p.amount;
      else if (p.paymentMethod === 'card') totalCard += p.amount;
      else totalOther += p.amount;
    });

    return {
      totalCash,
      totalUpi,
      totalCard,
      totalOther,
      grandTotal: totalCash + totalUpi + totalCard + totalOther
    };
  }, [state.payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return state.payments.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        p.id.toLowerCase().includes(q) ||
        (p.roomNumber && p.roomNumber.toLowerCase().includes(q)) ||
        (p.orderId && p.orderId.toLowerCase().includes(q)) ||
        (p.receivedByStaff && p.receivedByStaff.toLowerCase().includes(q)) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(q));

      const matchesMethod = filterMethod === 'all' || p.paymentMethod === filterMethod;

      const pDate = p.createdAt.slice(0, 10);
      const matchesStart = !filterStartDate || pDate >= filterStartDate;
      const matchesEnd = !filterEndDate || pDate <= filterEndDate;

      return matchesSearch && matchesMethod && matchesStart && matchesEnd;
    });
  }, [state.payments, searchQuery, filterMethod, filterStartDate, filterEndDate]);

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Payment Management
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">Cash, UPI & Card Audit</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            {language === 'hi' ? 'भुगतान लेजर (Payment Records)' : 'Payments Ledger & History'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'कमरा-वार व बाहरी बिलों के लिए प्राप्त सभी भुगतान, स्टाफ विवरण और रसीदें।'
              : 'Detailed tracking of full & partial payments, UPI, Cash and Card receipts.'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-750 text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Collections</div>
          <div className="text-xl font-black text-emerald-400 tabular-nums">
            {formatCurrency(summary.grandTotal)}
          </div>
        </div>
      </div>

      {/* 4 Method KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>UPI / QR</span>
            <QrCode className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-2 tabular-nums">
            {formatCurrency(summary.totalUpi)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Cash (नकद)</span>
            <Banknote className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 mt-2 tabular-nums">
            {formatCurrency(summary.totalCash)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Cards</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-400 mt-2 tabular-nums">
            {formatCurrency(summary.totalCard)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Other / Direct</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-300 mt-2 tabular-nums">
            {formatCurrency(summary.totalOther)}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Payment ID, Room Number or Staff..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {(['all', 'upi', 'cash', 'card', 'other'] as const).map(m => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                  filterMethod === m ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-slate-850 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Target / Account</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Received By</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {p.paymentNumber || p.id}
                  </td>

                  <td className="py-3 px-4">
                    {p.roomNumber ? (
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <DoorClosed className="w-3.5 h-3.5" />
                        <span>Room {p.roomNumber}</span>
                      </span>
                    ) : p.orderId ? (
                      <span className="font-mono text-slate-300">Order {p.orderId}</span>
                    ) : (
                      <span className="text-slate-400">Direct Bill</span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-bold text-emerald-400 text-sm tabular-nums">
                    {formatCurrency(p.amount)}
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {p.paymentMethod}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    {p.receivedByStaff}
                  </td>

                  <td className="py-3 px-4 text-slate-400">
                    {formatDateTime(p.createdAt)}
                  </td>

                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {p.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No payments found matching the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
