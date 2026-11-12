import { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderStatus } from '../../types/restaurant';
import { formatTime, getRelativeTime } from '../../utils/formatters';
import { 
  ChefHat, 
  Clock, 
  DoorClosed, 
  Store, 
  CheckCircle2, 
  Play, 
  BellRing, 
  XCircle, 
  Volume2, 
  VolumeX,
  AlertTriangle
} from 'lucide-react';

export function KitchenDisplayView() {
  const { state, updateOrderStatus, language } = useRestaurant();
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Orders filtered for KDS
  const filteredOrders = useMemo(() => {
    return state.orders.filter(order => {
      if (filterStatus === 'active') {
        return order.status === 'pending' || order.status === 'preparing' || order.status === 'ready';
      }
      if (filterStatus === 'all') return true;
      return order.status === filterStatus;
    });
  }, [state.orders, filterStatus]);

  const activeCount = state.orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    await updateOrderStatus(cancelModalOrder.id, 'cancelled', cancelReason || 'Cancelled by Kitchen Staff');
    setCancelModalOrder(null);
    setCancelReason('');
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* KDS Header */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
              KDS · Kitchen Display System
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">Live Order Queue</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-rose-500" />
            {language === 'hi' ? 'रसोई डिस्प्ले सिस्टम (Kitchen KDS)' : 'Kitchen Order Display (KDS)'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'रिसेप्शन व रेस्टोरेंट से आते ही नए ऑर्डर तुरंत यहाँ दिखाई देते हैं।'
              : 'Incoming room & outside orders appear in real time for chefs & kitchen team.'}
          </p>
        </div>

        {/* Action Controls & Sound Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Alert Chime: ON' : 'Chime: OFF'}</span>
          </button>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-750 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Orders Cooking</div>
            <div className="text-lg font-black text-rose-400 tabular-nums">
              {activeCount}
            </div>
          </div>
        </div>
      </div>

      {/* Status Segmented Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'active', label: language === 'hi' ? 'सक्रिय किचन ऑर्डर (Active)' : 'Active Orders', count: activeCount },
          { id: 'pending', label: language === 'hi' ? 'लंबित (Pending)' : 'Pending', count: state.orders.filter(o => o.status === 'pending').length },
          { id: 'preparing', label: language === 'hi' ? 'तैयार हो रहा है (Preparing)' : 'Preparing', count: state.orders.filter(o => o.status === 'preparing').length },
          { id: 'ready', label: language === 'hi' ? 'तैयार है (Ready to Serve)' : 'Ready', count: state.orders.filter(o => o.status === 'ready').length },
          { id: 'served', label: language === 'hi' ? 'सर्व हो चुके (Served)' : 'Served', count: state.orders.filter(o => o.status === 'served').length },
          { id: 'all', label: language === 'hi' ? 'सभी ऑर्डर (All)' : 'All Orders', count: state.orders.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterStatus === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              filterStatus === tab.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map(order => {
          const isRoom = order.type === 'room';
          const isPending = order.status === 'pending';
          const isPreparing = order.status === 'preparing';
          const isReady = order.status === 'ready';
          const isServed = order.status === 'served';
          const isCancelled = order.status === 'cancelled';

          return (
            <div
              key={order.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-md ${
                isPending ? 'bg-slate-850 border-amber-500/60 shadow-amber-500/5 ring-1 ring-amber-500/30' :
                isPreparing ? 'bg-slate-850 border-blue-500/60 shadow-blue-500/5 ring-1 ring-blue-500/30' :
                isReady ? 'bg-slate-850 border-emerald-500/60 shadow-emerald-500/5 ring-1 ring-emerald-500/30' :
                isCancelled ? 'bg-slate-900 border-rose-900/50 opacity-70' :
                'bg-slate-850/70 border-slate-800'
              }`}
            >
              <div>
                {/* Header: Destination & Time */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {isRoom ? (
                      <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black flex flex-col items-center justify-center shadow-sm">
                        <span className="text-[9px] uppercase font-bold opacity-80">ROOM</span>
                        <span className="text-base font-black leading-none">{order.roomNumber}</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold flex flex-col items-center justify-center">
                        <Store className="w-4 h-4 text-amber-400" />
                        <span className="text-[9px] uppercase mt-0.5">{order.type}</span>
                      </div>
                    )}

                    <div>
                      <div className="font-mono font-bold text-white text-xs">{order.id}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{order.orderTimeFormatted || formatTime(order.createdAt)}</span>
                        <span className="text-amber-400 font-semibold font-mono">({getRelativeTime(order.createdAt)})</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isPending ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' :
                    isPreparing ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                    isReady ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    isCancelled ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Items List */}
                <div className="py-3 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Dishes To Prepare ({order.items.reduce((s, i) => s + i.quantity, 0)}):
                  </div>

                  <div className="space-y-1.5 divide-y divide-slate-800/40">
                    {order.items.map((item, iIdx) => (
                      <div key={iIdx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-800 text-amber-400 font-black text-xs flex items-center justify-center border border-slate-750">
                            {item.quantity}×
                          </span>
                          <div>
                            <span className="font-bold text-white text-sm">{item.name}</span>
                            {item.variantName && item.variantName !== 'Standard' && (
                              <span className="text-xs text-amber-400 font-semibold ml-1.5 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                                {item.variantName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Special Notes */}
                  {order.notes && (
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Chef Note:</strong> {order.notes}</span>
                    </div>
                  )}

                  {/* Cancellation Reason if cancelled */}
                  {isCancelled && order.cancellationReason && (
                    <div className="mt-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      <strong>Cancellation Reason:</strong> {order.cancellationReason}
                      {order.cancelledBy && <div className="text-[10px] text-slate-400">By: {order.cancelledBy}</div>}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Action Buttons */}
              {!isCancelled && !isServed && (
                <div className="pt-3 border-t border-slate-800 flex items-center gap-1.5">
                  {isPending && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'preparing')}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Preparing</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'ready')}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Mark Ready</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'served')}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Mark Served</span>
                    </button>
                  )}

                  <button
                    onClick={() => setCancelModalOrder(order)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-750 transition-colors"
                    title="Cancel Order with Reason"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="py-16 text-center text-slate-500 text-xs rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
          <ChefHat className="w-10 h-10 text-slate-600 mx-auto stroke-1" />
          <p className="font-bold text-slate-300">Kitchen Display is Clean</p>
          <p>No orders in the "{filterStatus}" queue.</p>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-750 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Cancel Order {cancelModalOrder.id}?</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cancelled orders remain permanently in the audit history with reason and employee details.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reason for cancellation:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Guest changed mind, Item out of stock..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
