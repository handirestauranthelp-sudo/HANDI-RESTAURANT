import { useState } from 'react';
import { useRestaurant, NavigationTab } from '../../context/RestaurantContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  DoorClosed, 
  ChefHat, 
  MoreHorizontal,
  Receipt,
  Utensils,
  CreditCard,
  BarChart3,
  Settings,
  Users,
  ShoppingBag,
  X
} from 'lucide-react';

export function MobileNav() {
  const { activeTab, setActiveTab, language, roomAccounts, state } = useRestaurant();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const occupiedRoomsCount = roomAccounts.filter(r => r.isOccupiedFoodActive).length;
  const pendingKitchenCount = state.orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;

  const quickNav = [
    { id: 'dashboard' as NavigationTab, labelHi: 'डैशबोर्ड', labelEn: 'Dash', icon: LayoutDashboard },
    { id: 'new-order' as NavigationTab, labelHi: 'नया ऑर्डर', labelEn: 'Order', icon: PlusCircle, isPrimary: true },
    { 
      id: 'room-accounts' as NavigationTab, 
      labelHi: '15 रूम', 
      labelEn: 'Rooms', 
      icon: DoorClosed,
      badge: occupiedRoomsCount > 0 ? occupiedRoomsCount : undefined
    },
    { 
      id: 'kitchen-display' as NavigationTab, 
      labelHi: 'किचन KDS', 
      labelEn: 'KDS', 
      icon: ChefHat,
      badge: pendingKitchenCount > 0 ? pendingKitchenCount : undefined
    },
  ];

  const moreItems: { id: NavigationTab; labelHi: string; labelEn: string; icon: typeof Receipt }[] = [
    { id: 'outside-orders', labelHi: 'बाहरी ऑर्डर (Outside)', labelEn: 'Outside Orders', icon: ShoppingBag },
    { id: 'bills', labelHi: 'सभी बिल (All Bills)', labelEn: 'All Bills', icon: Receipt },
    { id: 'menu', labelHi: 'मेन्यू प्रबंधन (Menu)', labelEn: 'Menu Management', icon: Utensils },
    { id: 'payments', labelHi: 'भुगतान रिकॉर्ड (Payments)', labelEn: 'Payments', icon: CreditCard },
    { id: 'reports', labelHi: 'बिक्री रिपोर्ट्स (Reports)', labelEn: 'Sales Reports', icon: BarChart3 },
    { id: 'staff', labelHi: 'स्टाफ लॉगिन (Staff)', labelEn: 'Staff Management', icon: Users },
    { id: 'settings', labelHi: 'सेटिंग्स व डेटा (Settings)', labelEn: 'Settings & DB', icon: Settings },
  ];

  return (
    <>
      {/* More Menu Drawer */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <span className="text-sm font-bold text-white">
                {language === 'hi' ? 'सभी सुविधाएं' : 'All Modules'}
              </span>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {moreItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowMoreMenu(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' 
                        : 'bg-slate-850 border-slate-800 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{language === 'hi' ? item.labelHi : item.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden h-16 bg-slate-900/98 backdrop-blur-md border-t border-slate-800 px-3 flex items-center justify-around">
        {quickNav.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="-mt-5 w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex flex-col items-center justify-center font-bold shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform"
              >
                <Icon className="w-6 h-6 stroke-[2.5]" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 text-[10px] font-semibold transition-all ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[56px]">{language === 'hi' ? item.labelHi : item.labelEn}</span>
            </button>
          );
        })}

        {/* More menu toggle */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 text-[10px] font-semibold transition-all ${
            showMoreMenu ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>{language === 'hi' ? 'और मेन्यू' : 'More'}</span>
        </button>
      </nav>
    </>
  );
}
