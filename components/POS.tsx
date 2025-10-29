import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product, CartItem, Sale } from '../types';
import { Search, PlusCircle, Trash2, ShoppingBag, Box, Minus } from 'lucide-react';

const POS: React.FC = () => {
  const { state, dispatch } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [lastSaleForPrint, setLastSaleForPrint] = useState<Sale | null>(null);

  const filteredProducts = useMemo(() => {
    return state.products.filter(p =>
      p.stock > 0 &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.scientificName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [state.products, searchTerm]);

  useEffect(() => {
    if (lastSaleForPrint) {
      window.print();
      setLastSaleForPrint(null);
    }
  }, [lastSaleForPrint]);

  const getTotalInCartInPackets = (productId: string): number => {
    return cart
      .filter(item => item.id === productId)
      .reduce((total, item) => {
        const quantityInPackets = item.sellUnit === 'packet'
          ? item.quantity
          : item.quantity / (item.stripCount || 1);
        return total + quantityInPackets;
      }, 0);
  };

  const addToCart = (product: Product, sellUnit: 'packet' | 'strip') => {
    const totalInCart = getTotalInCartInPackets(product.id);
    const requestedAmountInPackets = sellUnit === 'strip' ? 1 / (product.stripCount || 1) : 1;

    if (totalInCart + requestedAmountInPackets > product.stock) {
        alert('الكمية المطلوبة تتجاوز المخزون المتاح.');
        return;
    }

    const pricePerUnit = sellUnit === 'packet' ? product.packetSellPrice : product.stripSellPrice!;
    const cartId = `${product.id}-${sellUnit}`;
    
    const existingItem = cart.find(item => `${item.id}-${item.sellUnit}` === cartId);
    
    if (existingItem) {
      setCart(cart.map(item => `${item.id}-${item.sellUnit}` === cartId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        quantity: 1,
        sellUnit,
        pricePerUnit,
        stock: product.stock,
        stripCount: product.stripCount,
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => `${item.id}-${item.sellUnit}` !== cartId));
  };
  
  const updateQuantity = (cartId: string, newQuantity: number) => {
    const itemToUpdate = cart.find(item => `${item.id}-${item.sellUnit}` === cartId);
    if (!itemToUpdate || newQuantity < 1) return;

    const otherItemsInCart = cart.filter(item => item.id === itemToUpdate.id && `${item.id}-${item.sellUnit}` !== cartId);
    const otherItemsInPackets = otherItemsInCart.reduce((total, item) => {
        const quantityInPackets = item.sellUnit === 'packet' ? item.quantity : item.quantity / (item.stripCount || 1);
        return total + quantityInPackets;
    }, 0);

    const newQuantityInPackets = itemToUpdate.sellUnit === 'packet' ? newQuantity : newQuantity / (itemToUpdate.stripCount || 1);
    
    if (otherItemsInPackets + newQuantityInPackets > itemToUpdate.stock) {
        alert('الكمية المطلوبة تتجاوز المخزون المتاح.');
        return;
    }

    setCart(cart.map(item => `${item.id}-${item.sellUnit}` === cartId ? { ...item, quantity: newQuantity } : item));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
  }, [cart]);

  const total = useMemo(() => subtotal - discount, [subtotal, discount]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const newSale: Sale = {
      id: new Date().toISOString(),
      date: new Date().toISOString(),
      items: cart,
      subtotal,
      discount,
      total,
    };
    dispatch({ type: 'ADD_SALE', payload: newSale });
    alert(`تمت عملية البيع بنجاح! الإجمالي: ${formatCurrency(total)}`);
    setLastSaleForPrint(newSale); // Trigger printing
    setCart([]);
    setDiscount(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
  };
  
  const PrintReceipt = () => {
    if (!lastSaleForPrint) return null;
    const { companyInfo } = state;
    const isThermal = companyInfo.printerSettings?.type === 'thermal';
    return (
        <div className={`printable-area p-8 font-sans text-xs ${isThermal ? 'thermal-print' : ''}`} dir="rtl">
            <div className="text-center mb-6">
                 {companyInfo.logo && !isThermal && <img src={companyInfo.logo} alt="شعار الصيدلية" className="h-20 w-auto mx-auto mb-4" />}
                <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
                <p>{companyInfo.address}</p>
                <p>{companyInfo.phone}</p>
            </div>
            <div className="border-t border-b py-2 mb-4 flex justify-between">
                <span>رقم الفاتورة: {lastSaleForPrint.id.slice(-6)}</span>
                <span>التاريخ: {new Date(lastSaleForPrint.date).toLocaleString('ar-IQ')}</span>
            </div>
            <table className="w-full mb-4">
                <thead>
                    <tr className="border-b">
                        <th className="text-right py-2">المادة</th>
                        <th className="text-center py-2">الكمية</th>
                        <th className="text-center py-2">الوحدة</th>
                        <th className="text-center py-2">السعر</th>
                        <th className="text-left py-2">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    {lastSaleForPrint.items.map(item => (
                        <tr key={`${item.id}-${item.sellUnit}`} className="border-b">
                            <td className="py-2">{item.name}</td>
                            <td className="text-center py-2">{item.quantity}</td>
                            <td className="text-center py-2">{item.sellUnit === 'packet' ? 'باكيت' : 'شريط'}</td>
                            <td className="text-center py-2">{formatCurrency(item.pricePerUnit)}</td>
                            <td className="text-left py-2">{formatCurrency(item.pricePerUnit * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="w-1/2 ml-auto space-y-2">
                <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{formatCurrency(lastSaleForPrint.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span>الخصم:</span>
                    <span>{formatCurrency(lastSaleForPrint.discount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                    <span>الإجمالي المطلوب:</span>
                    <span>{formatCurrency(lastSaleForPrint.total)}</span>
                </div>
            </div>
             <div className="text-center mt-8 text-xs text-gray-600">
                <p>{companyInfo.footerNotes}</p>
            </div>
        </div>
    );
  };

  return (
    <>
    <PrintReceipt />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
      {/* Products List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">المنتجات</h2>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="ابحث بالاسم، الكود، او الاسم العلمي..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                  <p className="text-xs text-gray-500">
                    المتاح: {Math.floor(product.stock)} باكيت
                    {product.stock % 1 !== 0 && ` و ${Math.round((product.stock % 1) * (product.stripCount || 1))} شريحة`}
                  </p>
                </div>
                <div className="flex flex-col space-y-2">
                   <button onClick={() => addToCart(product, 'packet')} className="w-full bg-teal-100 text-teal-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-teal-200 flex items-center justify-center gap-2">
                      <Box size={16} />
                      <span>باكيت ({formatCurrency(product.packetSellPrice)})</span>
                   </button>
                   {product.stripCount && product.stripSellPrice ? (
                      <button onClick={() => addToCart(product, 'strip')} className="w-full bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-200 flex items-center justify-center gap-2">
                        <Minus size={16} />
                        <span>شريحة ({formatCurrency(product.stripSellPrice)})</span>
                      </button>
                   ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="bg-white p-6 rounded-xl shadow-md flex flex-col lg:h-[calc(100vh-6rem)]">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">سلة المشتريات</h2>
        {cart.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
            <ShoppingBag size={48} />
            <p className="mt-2">السلة فارغة</p>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto max-h-[50vh]">
            {cart.map(item => (
              <div key={`${item.id}-${item.sellUnit}`} className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-gray-800">{item.name} ({item.sellUnit === 'packet' ? 'باكيت' : 'شريحة'})</p>
                  <p className="text-sm text-gray-500">{formatCurrency(item.pricePerUnit)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(`${item.id}-${item.sellUnit}`, parseInt(e.target.value))}
                    className="w-16 border rounded-md p-1 text-center"
                    min="1"
                  />
                  <button onClick={() => removeFromCart(`${item.id}-${item.sellUnit}`)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="border-t pt-4 mt-auto space-y-2">
          <div className="flex justify-between font-medium">
            <span>المجموع الفرعي:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
           <div className="flex justify-between items-center font-medium">
            <label htmlFor="discount">الخصم:</label>
            <input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 border rounded-md p-1 text-left"
                min="0"
            />
          </div>
          <div className="flex justify-between font-bold text-xl text-teal-600 border-t pt-2">
            <span>الإجمالي:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full bg-teal-600 text-white py-3 rounded-lg text-lg font-bold hover:bg-teal-700 disabled:bg-gray-400">
            إتمام البيع
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default POS;