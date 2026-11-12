import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { StaffMember } from '../../types/restaurant';
import { X, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

interface StaffSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StaffSwitcherModal({ isOpen, onClose }: StaffSwitcherModalProps) {
  const { state, currentStaff, setCurrentStaff, language } = useRestaurant();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember>(currentStaff);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaff.pin && pin !== selectedStaff.pin) {
      setError(language === 'hi' ? 'गलत पिन कोड (Default PINs: Admin 1234, Reception 2222, Restaurant 3333, Kitchen 4444)' : 'Incorrect PIN. Please try again.');
      return;
    }
    setCurrentStaff(selectedStaff);
    setError('');
    setPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-slate-850 rounded-2xl border border-slate-700 shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-750">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              {language === 'hi' ? 'स्टाफ लॉगिन / कर्मचारी बदलें' : 'Switch Staff Account'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'hi' ? '4 प्राधिकृत कर्मचारी खाते' : '4 Authorized Staff Accounts'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSwitch} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {state.staff.map(staff => {
              const isSelected = selectedStaff.id === staff.id;
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaff(staff);
                    setError('');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    {staff.role}
                  </div>
                  <div className="text-sm font-bold mt-1 text-white">{staff.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{staff.roleTitleHindi}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">PIN: {staff.pin}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-2 border-t border-slate-750">
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                {language === 'hi' ? '4 अंकों का स्टाफ पिन (PIN) दर्ज करें:' : 'Enter 4-Digit Staff PIN:'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Default: {selectedStaff.pin}</span>
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl tracking-widest text-white focus:outline-none focus:border-amber-500 font-mono"
              autoFocus
            />
            {error && <p className="text-xs text-rose-400 mt-2 font-medium">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl bg-slate-800 border border-slate-700"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {language === 'hi' ? 'लॉगिन करें' : 'Switch Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
