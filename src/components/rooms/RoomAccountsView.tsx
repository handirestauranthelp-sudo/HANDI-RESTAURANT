import { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RoomDetailModal } from './RoomDetailModal';
import { formatCurrency, getRelativeTime, formatTime } from '../../utils/formatters';
import { 
  DoorClosed, 
  PlusCircle, 
  Clock, 
  ChefHat, 
  Receipt, 
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';

export function RoomAccountsView() {
  const { 
    roomAccounts, 
    selectedRoom, 
    setSelectedRoom, 
    setActiveTab, 
    language 
  } = useRestaurant();

  const [activeFloorFilter, setActiveFloorFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'clear'>('all');

  const filteredRooms = roomAccounts.filter(room => {
    if (activeFloorFilter !== 'all' && room.floor !== activeFloorFilter) return false;
    if (statusFilter === 'active' && !room.isOccupiedFoodActive) return false;
    if (statusFilter === 'clear' && room.isOccupiedFoodActive) return false;
    return true;
  });

  const activeRoomsCount = roomAccounts.filter(r => r.isOccupiedFoodActive).length;
  const totalOutstanding = roomAccounts.reduce((sum, r) => sum + r.remainingBalance, 0);

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              15 Fixed Rooms
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">Restaurant Food Accounts Only</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            <DoorClosed className="w-5 h-5 text-amber-500" />
            {language === 'hi' ? '15 रूम - फ़ूड रनिंग अकाउंट' : '15 Fixed Room Food Accounts'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'प्रत्येक कमरे के खाने का रनिंग हिसाब। रात 12 बजे रीसेट नहीं होता, खाता सेटल होने तक सुरक्षित रहता है।'
              : 'Continuous food accounts for 15 rooms. Never resets at midnight; stays active until settled.'}
          </p>
        </div>

        {/* Aggregate KPI */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-750 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Food Accounts</div>
            <div className="text-lg font-black text-amber-400 tabular-nums">
              {activeRoomsCount} <span className="text-xs text-slate-500 font-normal">/ 15</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-750 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Outstanding</div>
            <div className="text-lg font-black text-rose-400 tabular-nums">
              {formatCurrency(totalOutstanding)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs">
        {/* Floor Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1">Floor:</span>
          <button
            onClick={() => setActiveFloorFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeFloorFilter === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            All Floors (15)
          </button>
          <button
            onClick={() => setActiveFloorFilter(1)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeFloorFilter === 1
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Floor 1 (101-105)
          </button>
          <button
            onClick={() => setActiveFloorFilter(2)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeFloorFilter === 2
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Floor 2 (201-205)
          </button>
          <button
            onClick={() => setActiveFloorFilter(3)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeFloorFilter === 3
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Floor 3 (301-305)
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              statusFilter === 'all' ? 'bg-slate-750 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              statusFilter === 'active' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Orders ({activeRoomsCount})
          </button>
          <button
            onClick={() => setStatusFilter('clear')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              statusFilter === 'clear' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Clear / Settled ({15 - activeRoomsCount})
          </button>
        </div>
      </div>

      {/* 15 Room Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {filteredRooms.map(room => {
          const isActive = room.isOccupiedFoodActive;
          return (
            <div
              key={room.roomNumber}
              onClick={() => setSelectedRoom(room.roomNumber)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group hover:shadow-xl hover:scale-[1.02] ${
                isActive
                  ? 'bg-slate-850 border-amber-500/50 shadow-md shadow-amber-500/5 hover:border-amber-400'
                  : 'bg-slate-850/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Room Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-sm ${
                      isActive 
                        ? 'bg-amber-500 text-slate-950 font-black' 
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {room.roomNumber}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        Floor {room.floor}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isActive ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Running Account
                          </span>
                        ) : (
                          <span className="text-slate-400">No Active Food</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {room.pendingKitchenCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <ChefHat className="w-3 h-3" />
                      <span>{room.pendingKitchenCount}</span>
                    </span>
                  )}
                </div>

                {/* Account Details */}
                <div className="mt-4 space-y-2 text-xs pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Food Orders:</span>
                    <span className="font-bold text-white tabular-nums">
                      {room.totalFoodOrdersCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Food Billed:</span>
                    <span className="font-bold text-white tabular-nums">
                      {formatCurrency(room.totalFoodAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Paid:</span>
                    <span className="font-bold text-emerald-400 tabular-nums">
                      {formatCurrency(room.totalPaymentReceived)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="font-bold text-slate-300">Balance Due:</span>
                    <span className={`font-black tabular-nums ${
                      room.remainingBalance > 0 ? 'text-amber-400 text-sm' : 'text-emerald-400'
                    }`}>
                      {formatCurrency(room.remainingBalance)}
                    </span>
                  </div>
                </div>

                {room.lastOrderTime && (
                  <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>Last: {formatTime(room.lastOrderTime)} ({getRelativeTime(room.lastOrderTime)})</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRoom(room.roomNumber);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors text-center"
                >
                  {language === 'hi' ? 'खाता देखें' : 'View Account'}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('new-order');
                  }}
                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-400 transition-colors"
                  title={`Add food order to Room ${room.roomNumber}`}
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Detail Modal if open */}
      {selectedRoom && (
        <RoomDetailModal
          roomNumber={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
