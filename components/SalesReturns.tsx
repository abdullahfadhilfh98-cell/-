import React, { useState, useMemo, useCallback, useEffect, useReducer } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product, SalesReturnItem, SalesReturn, CompanyInfo } from '../types';
import { Search, Trash2, Box, Minus, Undo } from 'lucide-react';

const PrintableSalesReturn: React.FC<{ salesReturn: SalesReturn; companyInfo: CompanyInfo }> = ({ salesReturn, companyInfo }) => {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
    const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    const isThermal = companyInfo.printerSettings?.type === 'thermal';

    return (
        <div className={`printable-area p-8 font-sans text-xs ${isThermal ? 'thermal-print' : ''}`} dir="rtl">
            <div className="text-center mb-6">
                 {companyInfo.logo && !isThermal && <img src={companyInfo.logo} alt="شعار الصيدلية" className="h-20 w-auto mx-auto mb-4" />}
                <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
                <h2 className="text-xl font-bold mt-4 border-y-2 py-1">فاتورة إرجاع مبيعات</h2>
            </div>
            <div className="border-t border-b py-2 mb-4 flex justify-between">
                <span>رقم المرجع: {salesReturn.id.slice(-6)}</span>
                <span>التاريخ: {formatDateTime(salesReturn.date)}</span>
            </div>
            <table className="w-full mb-4 text-xs">
                <thead><tr className="border-b"><th className="text-right py-2">المادة</th><th className="text-center py-2">الكمية</th><th className="text-center py-2">الوحدة</th><th className="text-center py-2">السعر</th><th className="text-left py-2">الإجمالي</th></tr></thead>
                <tbody>{salesReturn.items.map(item => (<tr key={`${item.id}-${item.returnUnit}`} className="border-b"><td className="py-2">{item.name}</td><td className="text-center py-2">{item.quantity}</td><td className="text-center py-2">{item.returnUnit === 'packet' ? 'باكيت' : 'شريط'}</td><td className="text-center py-2">{formatCurrency(item.pricePerUnit)}</td><td className="text-left py-2">{formatCurrency(item.pricePerUnit * item.quantity)}</td></tr>))}</tbody>
            </table>
            <div className="w-1/2 ml-auto space-y-2">
                <div className="flex justify-between"><span>المجموع الفرعي:</span><span>{formatCurrency(salesReturn.subtotal)}</span></div>
                <div className="flex justify-between"><span>الخصم:</span><span>{formatCurrency(salesReturn.discount)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>إجمالي القيمة المرتجعة:</span><span>{formatCurrency(salesReturn.totalReturnValue)}</span></div>
            </div>
            <div className="text-center mt-8 text-xs text-gray-600"><p>{salesReturn.notes || companyInfo.footerNotes}</p></div>
        </div>
    );
};

// --- New Local Reducer for Return Cart State Management ---
interface ReturnState {
  cart: SalesReturnItem[];
  discount: number;
  notes: string;
}

type ReturnAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; unit: 'packet' | 'strip' } }
  | { type: 'REMOVE_ITEM'; payload: string } // cartId
  | { type: 'UPDATE_QUANTITY'; payload: { cartId: string; newQuantity: number } }
  | { type: 'SET_DISCOUNT'; payload: number }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'RESET' };

const returnReducer = (state: ReturnState, action: ReturnAction): ReturnState => {
    switch(action.type) {
        case 'ADD_ITEM': {
            const { product, unit } = action.payload;
            const pricePerUnit = unit === 'packet' ? product.packetSellPrice : product.stripSellPrice!;
            const cartId = `${product.id}-${unit}`;
            const existingItem = state.cart.find(item => `${item.id}-${item.returnUnit}` === cartId);
            
            if (existingItem) {
                return { ...state, cart: state.cart.map(item => item === existingItem ? { ...item, quantity: item.quantity + 1 } : item) };
            } else {
                const newItem: SalesReturnItem = { id: product.id, name: product.name, quantity: 1, returnUnit: unit, pricePerUnit, stripCount: product.stripCount };
                return { ...state, cart: [...state.cart, newItem] };
            }
        }
        case 'REMOVE_ITEM':
            return { ...state, cart: state.cart.filter(item => `${item.id}-${item.returnUnit}` !== action.payload) };
        case 'UPDATE_QUANTITY': {
            if (action.payload.newQuantity < 1) return state;
            return {
                ...state,
                cart: state.cart.map(item => `${item.id}-${item.returnUnit}` === action.payload.cartId ? { ...item, quantity: action.payload.newQuantity } : item)
            };
        }
        case 'SET_DISCOUNT':
            return { ...state, discount: action.payload };
        case 'SET_NOTES':
            return { ...state, notes: action.payload };
        case 'RESET':
            return { cart: [], discount: 0, notes: '' };
        default:
            return state;
    }
}

const SalesReturns: React.FC = () => {
  const { state: globalState, dispatch: globalDispatch } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [state, dispatch] = useReducer(returnReducer, { cart: [], discount: 0, notes: '' });
  const [lastReturnForPrint, setLastReturnForPrint] = useState<SalesReturn | null>(null);

  useEffect(() => {
    if (lastReturnForPrint) {
      window.print();
      setLastReturnForPrint(null);
    }
  }, [lastReturnForPrint]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return globalState.products;
    return globalState.products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.scientificName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [globalState.products, searchTerm]);

  const subtotal = useMemo(() => {
    return state.cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
  }, [state.cart]);

  const totalReturnValue = useMemo(() => subtotal - state.discount, [subtotal, state.discount]);

  const handleProcessReturn = useCallback(() => {
    if (state.cart.length === 0) return;
    const newReturn: SalesReturn = {
      id: new Date().toISOString(), date: new Date().toISOString(), items: state.cart, subtotal, discount: state.discount, totalReturnValue, notes: state.notes,
    };
    globalDispatch({ type: 'ADD_SALES_RETURN', payload: newReturn });
    alert(`تمت عملية الإرجاع بنجاح! إجمالي القيمة المرتجعة: ${formatCurrency(totalReturnValue)}`);
    setLastReturnForPrint(newReturn);
    dispatch({type: 'RESET'});
  }, [state, subtotal, totalReturnValue, globalDispatch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <>
      {lastReturnForPrint && <PrintableSalesReturn salesReturn={lastReturnForPrint} companyInfo={globalState.companyInfo} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Products List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">إرجاع مبيعات: اختيار المواد</h2>
          <div className="relative mb-4">
            <input
              type="text" placeholder="ابحث بالاسم، الكود، او الاسم العلمي..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-full shadow-sm py-2 px-4 pr-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="border rounded-lg p-4 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{product.name}</h3>
                    <p className="text-xs text-gray-500">المتاح: {Math.floor(product.stock)} باكيت</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button onClick={() => dispatch({type: 'ADD_ITEM', payload: {product, unit: 'packet'}})} className="w-full bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-yellow-200 flex items-center justify-center gap-2">
                        <Box size={16} /><span>إرجاع باكيت ({formatCurrency(product.packetSellPrice)})</span>
                    </button>
                    {product.stripCount && product.stripSellPrice ? (
                        <button onClick={() => dispatch({type: 'ADD_ITEM', payload: {product, unit: 'strip'}})} className="w-full bg-orange-100 text-orange-800 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-orange-200 flex items-center justify-center gap-2">
                          <Minus size={16} /><span>إرجاع شريحة ({formatCurrency(product.stripSellPrice)})</span>
                        </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Return Cart */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col lg:h-[calc(100vh-6rem)]">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">فاتورة الإرجاع</h2>
          {state.cart.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
              <Undo size={48} /><p className="mt-2">اختر مواد للإرجاع</p>
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto max-h-[45vh]">
              {state.cart.map(item => {
                const cartId = `${item.id}-${item.returnUnit}`;
                return (
                <div key={cartId} className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-gray-800">{item.name} ({item.returnUnit === 'packet' ? 'باكيت' : 'شريحة'})</p>
                    <p className="text-sm text-gray-500">{formatCurrency(item.pricePerUnit)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={item.quantity} onChange={(e) => dispatch({type: 'UPDATE_QUANTITY', payload: {cartId, newQuantity: parseInt(e.target.value)} })} className="w-16 border rounded-md p-1 text-center" min="1"/>
                    <button onClick={() => dispatch({type: 'REMOVE_ITEM', payload: cartId})} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  </div>
                </div>
              )})}
            </div>
          )}
          <div className="border-t pt-4 mt-auto space-y-2">
            <div className="flex justify-between font-medium"><span>المجموع الفرعي:</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between items-center font-medium">
              <label htmlFor="discount">الخصم:</label>
              <input id="discount" type="number" value={state.discount} onChange={(e) => dispatch({type: 'SET_DISCOUNT', payload: Number(e.target.value)})} className="w-24 border rounded-md p-1 text-left" min="0"/>
            </div>
            <div className="flex justify-between font-bold text-xl text-red-600 border-t pt-2"><span>إجمالي الإرجاع:</span><span>{formatCurrency(totalReturnValue)}</span></div>
            <div><textarea value={state.notes} onChange={e => dispatch({type: 'SET_NOTES', payload: e.target.value})} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" placeholder="ملاحظات (اختياري)"></textarea></div>
            <button onClick={handleProcessReturn} disabled={state.cart.length === 0} className="w-full bg-red-600 text-white py-3 rounded-lg text-lg font-bold hover:bg-red-700 disabled:bg-gray-400">حفظ فاتورة الإرجاع</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SalesReturns;
