import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Reports from './components/Reports';
import Purchases from './components/Purchases';
import Suppliers from './components/Suppliers';
import SalesReturns from './components/SalesReturns';
import PurchaseReturns from './components/PurchaseReturns';
import StockAdjustments from './components/StockAdjustments';
import Stocktake from './components/Stocktake';
import Financials from './components/Financials';
import Admin from './components/Admin';
import Login from './components/Login';
import { UserRole } from './types';

import { Menu, X } from 'lucide-react';

export type View = 
  | 'dashboard' 
  | 'inventory' 
  | 'pos' 
  | 'purchases'
  | 'salesReturns'
  | 'purchaseReturns'
  | 'stockAdjustments'
  | 'stocktake'
  | 'reports' 
  | 'suppliers'
  | 'financials'
  | 'admin';

const permissions: Record<UserRole, View[]> = {
    admin: ['dashboard', 'inventory', 'pos', 'purchases', 'salesReturns', 'purchaseReturns', 'stockAdjustments', 'stocktake', 'reports', 'suppliers', 'financials', 'admin'],
    pharmacist: ['dashboard', 'inventory', 'pos', 'purchases', 'salesReturns', 'purchaseReturns', 'stockAdjustments', 'stocktake', 'suppliers'],
    cashier: ['dashboard', 'pos', 'salesReturns'],
};

const AppContent: React.FC = () => {
  const { state } = useInventory();
  const { currentUser } = state;
  
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) {
    return <Login />;
  }

  const hasPermission = (view: View) => permissions[currentUser.role].includes(view);
  
  const handleSetView = (view: View) => {
      if (hasPermission(view)) {
          setActiveView(view);
      } else {
          // Default to dashboard if no permission
          setActiveView('dashboard');
      }
  }

  const renderView = () => {
    if (!hasPermission(activeView)) {
        return <Dashboard setActiveView={handleSetView} />;
    }
    switch (activeView) {
      case 'dashboard':
        return <Dashboard setActiveView={handleSetView} />;
      case 'inventory':
        return <Inventory />;
      case 'pos':
        return <POS />;
      case 'reports':
        return <Reports />;
      case 'purchases':
        return <Purchases />;
      case 'suppliers':
        return <Suppliers />;
      case 'salesReturns':
        return <SalesReturns />;
      case 'purchaseReturns':
        return <PurchaseReturns />;
      case 'stockAdjustments':
          return <StockAdjustments />;
      case 'stocktake':
          return <Stocktake />;
      case 'financials':
        return <Financials />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard setActiveView={handleSetView} />;
    }
  };

  return (
      <div className="bg-gray-100 min-h-screen font-sans">
        <div className="flex">
          <Sidebar 
            activeView={activeView} 
            setActiveView={handleSetView} 
            isOpen={isSidebarOpen} 
            setIsOpen={setSidebarOpen} 
            currentUser={currentUser}
            permissions={permissions[currentUser.role]}
          />
          
          <main className="flex-1 transition-all duration-300 md:mr-64 printable-page">
             <div className="md:hidden p-4 bg-white shadow-md flex justify-between items-center sticky top-0 z-20 no-print">
                <h1 className="text-xl font-bold text-teal-600">نظام الصيدلية</h1>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
             </div>
            <div className="p-4 md:p-8">
              {renderView()}
            </div>
          </main>
        </div>
      </div>
  );
};

const App: React.FC = () => {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  )
}

export default App;