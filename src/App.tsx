import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { NewOrderView } from './components/pos/NewOrderView';
import { RoomAccountsView } from './components/rooms/RoomAccountsView';
import { OutsideOrdersView } from './components/pos/OutsideOrdersView';
import { KitchenDisplayView } from './components/kds/KitchenDisplayView';
import { MenuManagementView } from './components/menu/MenuManagementView';
import { AllBillsView } from './components/billing/AllBillsView';
import { PaymentsView } from './components/payments/PaymentsView';
import { ReportsView } from './components/reports/ReportsView';
import { StaffManagementView } from './components/staff/StaffManagementView';
import { SettingsView } from './components/settings/SettingsView';
import { PrintBillModal } from './components/billing/PrintBillModal';
import { UtensilsCrossed } from 'lucide-react';

function AppContent() {
  const { activeTab, selectedBillForPrint, setSelectedBillForPrint, loading } = useRestaurant();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/20 mb-4 animate-bounce">
          <UtensilsCrossed className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">Handi Restaurant POS</h1>
        <p className="text-xs text-amber-400 font-semibold mt-1">लोड हो रहा है... कृपया प्रतीक्षा करें</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <Header />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <Sidebar />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-900">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'new-order' && <NewOrderView />}
            {activeTab === 'room-accounts' && <RoomAccountsView />}
            {activeTab === 'outside-orders' && <OutsideOrdersView />}
            {activeTab === 'kitchen-display' && <KitchenDisplayView />}
            {activeTab === 'menu' && <MenuManagementView />}
            {activeTab === 'bills' && <AllBillsView />}
            {activeTab === 'payments' && <PaymentsView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'staff' && <StaffManagementView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Printable Bill Modal (Thermal & A4) */}
      {selectedBillForPrint && (
        <PrintBillModal
          bill={selectedBillForPrint}
          onClose={() => setSelectedBillForPrint(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <AppContent />
    </RestaurantProvider>
  );
}
