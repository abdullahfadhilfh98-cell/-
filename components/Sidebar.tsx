import React, { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, BarChart2, Pill, X, Archive, FileText, Users, DollarSign, ArrowLeftRight, Settings, DatabaseBackup, Undo, Redo, PackageX, ChevronDown, ReceiptText, LogOut, UserCog, ClipboardCheck } from 'lucide-react';
import type { View } from '../App';
import { User } from '../types';
import { useInventory } from '../context/InventoryContext';


interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentUser: User;
  permissions: View[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen, currentUser, permissions }) => {
  const { dispatch } = useInventory();
  const [openMenus, setOpenMenus] = useState<string[]>(['invoices', 'data', 'financials', 'admin']);

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]);
  }

  const allNavItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, type: 'link', view: 'dashboard' },
    {
      id: 'invoices', label: 'الفواتير', icon: FileText, type: 'menu',
      subItems: [
        { id: 'pos', label: 'نقطة البيع', icon: ShoppingCart, view: 'pos' },
        { id: 'purchases', label: 'المشتريات', icon: Archive, view: 'purchases' },
        { id: 'salesReturns', label: 'إرجاع مبيعات', icon: Undo, view: 'salesReturns' },
        { id: 'purchaseReturns', label: 'إرجاع مشتريات', icon: Redo, view: 'purchaseReturns' },
        { id: 'stocktake', label: 'جرد المخزن', icon: ClipboardCheck, view: 'stocktake' },
        { id: 'stockAdjustments', label: 'تلف و إكسباير', icon: PackageX, view: 'stockAdjustments' },
      ]
    },
    {
      id: 'data', label: 'البيانات', icon: Package, type: 'menu',
      subItems: [
        { id: 'inventory', label: 'المخزون', icon: Package, view: 'inventory' },
        { id: 'suppliers', label: 'الموردين', icon: Users, view: 'suppliers' },
      ]
    },
     {
      id: 'financials', label: 'المالية', icon: DollarSign, type: 'menu',
      subItems: [
        { id: 'financials', label: 'الإدارة المالية', icon: ArrowLeftRight, view: 'financials' },
      ]
    },
    { id: 'reports', label: 'التقارير', icon: BarChart2, type: 'link', view: 'reports' },
     {
      id: 'admin', label: 'الإدارة', icon: Settings, type: 'menu',
      subItems: [
        { id: 'admin', label: 'إعدادات النظام', icon: Settings, view: 'admin' },
      ]
    },
  ];

  const handleNavigation = (view: View) => {
    setActiveView(view);
    if(window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };
  
  const filteredNavItems = allNavItems.map(item => {
    if (item.type === 'link') {
      return permissions.includes(item.view as View) ? item : null;
    }
    if (item.type === 'menu') {
      const filteredSubItems = item.subItems.filter(sub => permissions.includes(sub.view as View));
      return filteredSubItems.length > 0 ? { ...item, subItems: filteredSubItems } : null;
    }
    return null;
  }).filter(Boolean);


  return (
    <>
      <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-40 w-64 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 flex flex-col no-print`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 h-[69px]">
          <div className='flex items-center'>
              <Pill className="text-teal-600" size={28} />
              <h1 className="text-xl font-bold text-teal-600 mr-2">صيدليتي</h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-600">
              <X size={24} />
          </button>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto flex-grow">
          {filteredNavItems.map(item => {
            if (!item) return null;
            if (item.type === 'link') {
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id as View)}
                  className={`flex items-center w-full px-4 py-3 text-right rounded-lg transition-colors duration-200 ${activeView === item.id ? 'bg-teal-500 text-white shadow-md' : 'text-gray-600 hover:bg-teal-50'}`}
                >
                  <item.icon className="ms-3" size={20} />
                  <span className="mr-4 font-medium">{item.label}</span>
                </button>
              );
            }
            if (item.type === 'menu') {
              const isActiveMenu = item.subItems.some(sub => sub.id === activeView);
              return (
                <div key={item.id}>
                  <button onClick={() => toggleMenu(item.id)} className={`flex items-center justify-between w-full px-4 py-3 text-right rounded-lg transition-colors duration-200 ${isActiveMenu ? 'text-teal-600' : 'text-gray-600 hover:bg-teal-50'}`}>
                    <div className="flex items-center">
                      <item.icon className="ms-3" size={20} />
                      <span className="mr-4 font-medium">{item.label}</span>
                    </div>
                    <ChevronDown size={16} className={`transform transition-transform ${openMenus.includes(item.id) ? 'rotate-180' : ''}`} />
                  </button>
                  {openMenus.includes(item.id) && (
                    <div className="mr-4 mt-1 space-y-1 border-r-2 border-teal-200">
                      {item.subItems.map(subItem => (
                        <button
                          key={subItem.id}
                          onClick={() => handleNavigation(subItem.id as View)}
                          className={`flex items-center w-full px-4 py-2.5 text-right rounded-lg transition-colors duration-200 mr-2 ${activeView === subItem.id ? 'bg-teal-500 text-white shadow' : 'text-gray-500 hover:bg-teal-50'}`}
                        >
                          <subItem.icon className="ms-2" size={18} />
                          <span className="mr-3 text-sm font-medium">{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
             <div className="flex items-center p-2 rounded-lg bg-gray-100 mb-3">
                <UserCog size={20} className="text-gray-600"/>
                <div className="mr-3">
                    <p className="font-bold text-sm text-gray-800">{currentUser.username}</p>
                    <p className="text-xs text-gray-500">{currentUser.role === 'admin' ? 'مدير' : currentUser.role === 'pharmacist' ? 'صيدلاني' : 'كاشير'}</p>
                </div>
            </div>
             <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-right rounded-lg transition-colors duration-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="ms-3" size={20} />
                <span className="mr-4 font-medium">تسجيل الخروج</span>
              </button>
        </div>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsOpen(false)}></div>}
    </>
  );
};

export default Sidebar;