import { useRestaurant, NavigationTab } from '../../context/RestaurantContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  DoorClosed, 
  ShoppingBag, 
  ChefHat, 
  Utensils, 
  Receipt, 
  CreditCard, 
  BarChart3, 
  Users, 
  Settings,
  Sparkles
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  labelEn: string;
  labelHi: string;
  icon: typeof LayoutDashboard;
  badge?: number | string;
  badgeColor?: string;
}

export function Sidebar() {
  const { activeTab, setActiveTab, language, roomAccounts, state } = useRestaurant();

  // Calculate live badge numbers
  const occupiedRoomsCount = roomAccounts.filter(r => r.isOccupiedFoodActive).length;
  const pendingKitchenCount = state.orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  const outsideOrdersCount = state.orders.filter(o => o.type !== 'room' && !o.billId && o.status !== 'cancelled').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', labelEn: 'Dashboard', labelHi: 'डैशबोर्ड', icon: LayoutDashboard },
    { id: 'new-order', labelEn: 'New Order', labelHi: 'नया ऑर्डर', icon: PlusCircle },
    { 
      id: 'room-accounts', 
      labelEn: '15 Room Accounts', 
      labelHi: '15 रूम खाते', 
      icon: DoorClosed,
      badge: occupiedRoomsCount > 0 ? `${occupiedRoomsCount} Active` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300'
    },
    { 
      id: 'outside-orders', 
      labelEn: 'Outside Orders', 
      labelHi: 'बाहरी ऑर्डर', 
      icon: ShoppingBag,
      badge: outsideOrdersCount > 0 ? outsideOrdersCount : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300'
    },
    { 
      id: 'kitchen-display', 
      labelEn: 'Kitchen Display', 
      labelHi: 'किचन KDS', 
      icon: ChefHat,
      badge: pendingKitchenCount > 0 ? pendingKitchenCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300'
    },
    { id: 'menu', labelEn: 'Menu Management', labelHi: 'मेन्यू प्रबंधन', icon: Utensils },
    { id: 'bills', labelEn: 'All Bills', labelHi: 'सभी बिल', icon: Receipt },
    { id: 'payments', labelEn: 'Payments', labelHi: 'भुगतान रिकॉर्ड', icon: CreditCard },
    { id: 'reports', labelEn: 'Sales Reports', labelHi: 'बिक्री रिपोर्ट्स', icon: BarChart3 },
    { id: 'staff', labelEn: 'Staff Logins', labelHi: 'स्टाफ प्रबंधन', icon: Users },
    { id: 'settings', labelEn: 'Settings & DB', labelHi: 'सेटिंग्स व बैकअप', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-slate-900 border-r border-slate-800 p-3 justify-between overflow-y-auto">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {language === 'hi' ? 'मुख्य नेविगेशन' : 'MAIN NAVIGATION'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400 group-hover:text-amber-400'
                }`} />
                <span className="truncate">{language === 'hi' ? item.labelHi : item.labelEn}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-slate-950/20 text-slate-950' : item.badgeColor || 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Handi Restaurant Quick Card */}
      <div className="p-3 mt-4 rounded-xl bg-slate-850 border border-slate-800 text-left">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Handi Restaurant POS</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          {language === 'hi'
            ? 'केवल फ़ूड बिलिंग व 15 रूम खाते। कोई होटल/रूम रेंट नहीं।'
            : 'Food billing & 15 room accounts only. No room rent.'}
        </p>
      </div>
    </aside>
  );
}
