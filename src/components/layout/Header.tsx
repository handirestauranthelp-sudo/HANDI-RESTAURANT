import { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { StaffSwitcherModal } from './StaffSwitcherModal';
import { 
  PlusCircle, 
  User, 
  Languages, 
  Radio, 
  UtensilsCrossed 
} from 'lucide-react';

export function Header() {
  const { 
    state, 
    currentStaff, 
    language, 
    setLanguage, 
    setActiveTab, 
    isOnline 
  } = useRestaurant();
  
  const [showStaffModal, setShowStaffModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-base md:text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                {language === 'hi' ? state.settings.restaurantHindiName : state.settings.restaurantName}
              </div>
              <div className="text-[11px] text-amber-400/90 font-medium">
                Smart POS & Food Accounts
              </div>
            </div>
          </button>
        </div>

        {/* Live sync & Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
            <Radio className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className={isOnline ? 'text-emerald-300' : 'text-rose-300'}>
              {isOnline ? (language === 'hi' ? 'लाइव सिंक चालू' : 'Live Sync Online') : (language === 'hi' ? 'ऑफ़लाइन' : 'Offline')}
            </span>
          </span>
          <span className="text-slate-600">·</span>
          <span>15 Fixed Rooms</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            title="Switch Language / भाषा बदलें"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'hi' ? 'English' : 'हिन्दी'}</span>
          </button>

          {/* Current Staff Switcher */}
          <button
            onClick={() => setShowStaffModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-white transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <User className="w-3.5 h-3.5 text-slate-400" />
            <div className="text-left hidden md:block">
              <span className="text-white block leading-tight">{currentStaff.name}</span>
              <span className="text-[10px] text-amber-400 uppercase tracking-wider">{currentStaff.role}</span>
            </div>
          </button>

          {/* Quick New Order CTA */}
          <button
            onClick={() => setActiveTab('new-order')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs md:text-sm font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span className="whitespace-nowrap">{language === 'hi' ? 'नया ऑर्डर' : 'New Order'}</span>
          </button>
        </div>
      </header>

      <StaffSwitcherModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
      />
    </>
  );
}
