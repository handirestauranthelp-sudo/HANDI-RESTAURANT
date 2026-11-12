import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { StaffMember } from '../../types/restaurant';
import { formatDateTime } from '../../utils/formatters';
import { 
  Users, 
  ShieldCheck, 
  KeyRound, 
  Phone, 
  Activity, 
  Clock, 
  CheckCircle,
  Lock
} from 'lucide-react';

export function StaffManagementView() {
  const { state, updateStaffMember, currentStaff, language } = useRestaurant();

  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [newPin, setNewPin] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isAdmin = currentStaff.role === 'admin';

  const handleEditClick = (staff: StaffMember) => {
    setEditingStaff(staff);
    setNewPin(staff.pin);
    setNewName(staff.name);
    setNewPhone(staff.phone || '');
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    await updateStaffMember(editingStaff.id, {
      pin: newPin,
      name: newName,
      phone: newPhone
    });

    setStatusMsg(`Credentials updated for ${editingStaff.role.toUpperCase()}`);
    setEditingStaff(null);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const rolePermissions = [
    {
      role: 'ADMIN / OWNER',
      titleHi: 'व्यवस्थापक / मालिक',
      access: ['Full Access', 'Menu & Prices', 'Staff Accounts', 'Reports & Backup', 'Settings', 'Billing & Orders']
    },
    {
      role: 'RECEPTION',
      titleHi: 'रिसेप्शन काउंटर',
      access: ['15 Room Accounts', 'Take Room Orders', 'Food Bill Generation', 'Payment Records', 'Reprint Receipts']
    },
    {
      role: 'RESTAURANT STAFF',
      titleHi: 'रेस्टोरेंट सर्विस / वेटर',
      access: ['Room Food Orders', 'Outside Customer Orders', 'View Menu & Prices', 'Track Order Status']
    },
    {
      role: 'KITCHEN STAFF',
      titleHi: 'किचन / रसोई दल',
      access: ['Kitchen Display System (KDS)', 'Dish Quantities', 'Update Order Status (Preparing/Ready)', 'Order Notes']
    }
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              4 Staff Accounts
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">Role-Based Access Control</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            {language === 'hi' ? 'स्टाफ प्रबंधन व 4 कर्मचारी खाते' : 'Staff Accounts & Access Management'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'मालिक, रिसेप्शन, रेस्टोरेंट व किचन दल के लिए 4 सुरक्षित खाते।'
              : 'Dedicated logins for Admin, Reception, Restaurant Staff, and Kitchen team.'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-750 text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Session</div>
          <div className="text-sm font-bold text-amber-400">{currentStaff.name} ({currentStaff.role})</div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 4 Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {state.staff.map((staff, idx) => {
          const perm = rolePermissions.find(p => p.role.includes(staff.role.toUpperCase()));
          const isCurrent = staff.id === currentStaff.id;

          return (
            <div
              key={staff.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isCurrent 
                  ? 'bg-slate-850 border-amber-500/60 shadow-lg ring-1 ring-amber-500/30' 
                  : 'bg-slate-850/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Role #{idx + 1}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      Logged In
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-white">{staff.name}</h3>
                  <div className="text-xs text-amber-400/90 font-medium mt-0.5">{staff.roleTitleHindi}</div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{staff.phone || 'No phone'}</span>
                  </div>
                </div>

                {/* PIN Display */}
                <div className="mt-4 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Access PIN:</span>
                  </span>
                  <span className="font-mono text-sm font-bold text-white tracking-widest">
                    {staff.pin}
                  </span>
                </div>

                {/* Permissions bullets */}
                <div className="mt-4 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Permissions:
                  </div>
                  {perm?.access.map((acc, aIdx) => (
                    <div key={aIdx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{acc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit credentials button */}
              <button
                onClick={() => handleEditClick(staff)}
                className="mt-5 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
              >
                Change PIN / Details
              </button>
            </div>
          );
        })}
      </div>

      {/* Audit Log Table */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Staff Activity Audit Log</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every staff action (order created, kitchen status, payment, settlement) is logged permanently.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{state.auditLogs.length} events logged</span>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Staff</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {state.auditLogs.slice(0, 25).map(log => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatDateTime(log.timestamp)}</span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                    {log.staffName}
                  </td>
                  <td className="py-2.5 px-3 text-amber-400 font-medium whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-750 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              <span>Update Credentials · {editingStaff.role.toUpperCase()}</span>
            </h3>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Staff Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">4-Digit Access PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center text-lg tracking-widest"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
