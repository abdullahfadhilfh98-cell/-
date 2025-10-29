import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Package, TrendingUp, Users, AlertTriangle, Truck, Printer } from 'lucide-react';
import type { View } from '../App';

interface DashboardProps {
  setActiveView: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const { state } = useInventory();

  const totalProducts = state.products.length;
  const lowStockProducts = state.products.filter(p => p.stock < 10).length;
  const totalSuppliers = state.suppliers.length;
  const totalSalesToday = state.sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length;
  const totalSupplierDebt = state.suppliers.reduce((sum, s) => sum + s.balance, 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
  };

  const recentSales = state.sales.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
        <button onClick={() => window.print()} className="no-print bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
            <Printer size={18} />
            <span>طباعة</span>
        </button>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full no-print">
            <Package className="text-blue-600" size={28} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">إجمالي المنتجات</p>
            <p className="text-2xl font-bold text-gray-800">{totalProducts}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full no-print">
            <TrendingUp className="text-green-600" size={28} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">مبيعات اليوم</p>
            <p className="text-2xl font-bold text-gray-800">{totalSalesToday}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-yellow-100 p-3 rounded-full no-print">
            <AlertTriangle className="text-yellow-600" size={28} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">نقص بالمخزون</p>
            <p className="text-2xl font-bold text-gray-800">{lowStockProducts}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-full no-print">
            <Users className="text-purple-600" size={28} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">إجمالي الموردين</p>
            <p className="text-2xl font-bold text-gray-800">{totalSuppliers}</p>
          </div>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full no-print">
            <Truck className="text-red-600" size={28} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">ديون الموردين</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(totalSupplierDebt)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">آخر المبيعات</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-2">رقم الفاتورة</th>
                            <th className="px-4 py-2">التاريخ</th>
                            <th className="px-4 py-2">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentSales.map(sale => (
                            <tr key={sale.id} className="border-b">
                                <td className="px-4 py-2 font-medium">{sale.id.slice(-6)}</td>
                                <td className="px-4 py-2 text-gray-600">{new Date(sale.date).toLocaleDateString('ar-IQ')}</td>
                                <td className="px-4 py-2 font-bold text-teal-600">{formatCurrency(sale.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md no-print">
            <h2 className="text-xl font-bold text-gray-800 mb-4">إجراءات سريعة</h2>
            <div className="space-y-3">
                <button onClick={() => setActiveView('pos')} className="w-full text-right bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors">فاتورة بيع جديدة</button>
                <button onClick={() => setActiveView('purchases')} className="w-full text-right bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors">فاتورة شراء جديدة</button>
                <button onClick={() => setActiveView('inventory')} className="w-full text-right bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors">إدارة المخزون</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;