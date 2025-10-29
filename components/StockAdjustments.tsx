import React, { useState, useMemo, useCallback } from 'react';
import { useInventory } from '../context/InventoryContext';
import { StockAdjustmentInvoice, StockAdjustmentItem } from '../types';
import { PackageX, PlusCircle, Trash2, Save, FilePlus, Printer } from 'lucide-react';
import SearchableProductInput from './common/SearchableProductInput';

const today = new Date().toISOString().split('T')[0];

type ItemFormState = Omit<StockAdjustmentItem, 'name' | 'itemTotalValue' | 'productId'> & { productId: string | undefined };

const initialItemState: ItemFormState = {
    productId: undefined,
    quantity: 1,
    costPrice: 0,
    reason: 'expiry',
};

const StockAdjustments: React.FC = () => {
    const { state, dispatch } = useInventory();
    
    // Form State
    const [adjustmentDate, setAdjustmentDate] = useState(today);
    const [items, setItems] = useState<ItemFormState[]>([initialItemState]);
    const [notes, setNotes] = useState('');

    const totalLossValue = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    }, [items]);

    const handleItemChange = useCallback((index: number, field: keyof ItemFormState, value: string | number) => {
        setItems(currentItems => {
            const newItems = [...currentItems];
            const currentItem = { ...newItems[index] };
            
            if (field === 'productId') {
                const product = state.products.find(p => p.id === value);
                (currentItem as any)[field] = value;
                if (product) {
                    currentItem.costPrice = product.costPrice;
                }
            } else if (field === 'quantity') {
                const product = state.products.find(p => p.id === currentItem.productId);
                const newQuantity = Number(value);
                if (product && newQuantity > product.stock) {
                    alert(`الكمية المسحوبة لا يمكن أن تتجاوز الكمية المتاحة (${product.stock})`);
                    (currentItem as any)[field] = product.stock;
                } else {
                     (currentItem as any)[field] = newQuantity;
                }
            } else {
                (currentItem as any)[field] = value;
            }
    
            newItems[index] = currentItem;
            return newItems;
        });
    }, [state.products]);

    const addItem = useCallback(() => {
        setItems(prev => [...prev, initialItemState]);
    }, []);

    const removeItem = useCallback((index: number) => {
        setItems(prev => {
            if (prev.length > 1) {
                return prev.filter((_, i) => i !== index);
            }
            return prev;
        });
    }, []);
    
    const resetForm = useCallback(() => {
        setAdjustmentDate(today);
        setItems([initialItemState]);
        setNotes('');
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (items.some(i => !i.productId || i.quantity <= 0)) {
            alert('يرجى ملء جميع بيانات المواد بشكل صحيح.');
            return;
        }

        const adjustmentItems: StockAdjustmentItem[] = items.map(item => {
            const product = state.products.find(p => p.id === item.productId)!;
            return {
                ...item,
                productId: item.productId!,
                name: product.name,
                itemTotalValue: item.costPrice * item.quantity,
                reason: item.reason || 'other',
            };
        });

        const adjustmentInvoice: StockAdjustmentInvoice = {
            id: new Date().toISOString(),
            date: adjustmentDate,
            items: adjustmentItems,
            totalLossValue,
            notes,
        };
        
        dispatch({ type: 'ADD_STOCK_ADJUSTMENT', payload: adjustmentInvoice });
        alert('تم حفظ تسوية المخزون بنجاح!');
        resetForm();
    }, [items, adjustmentDate, notes, totalLossValue, state.products, dispatch, resetForm]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md no-print">
                <div className="flex items-center gap-4 mb-6">
                    <PackageX size={32} className="text-red-600" />
                    <h1 className="text-2xl font-bold text-gray-800">فاتورة تسوية المخزون (تلف وإكسباير)</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="md:w-1/4">
                        <label className="block text-sm font-medium text-gray-700">تاريخ التسوية</label>
                        <input type="date" value={adjustmentDate} onChange={(e) => setAdjustmentDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-right text-gray-600">
                                <tr>
                                    <th className="p-2 w-4/12">المادة</th>
                                    <th className="p-2 w-2/12">الكمية</th>
                                    <th className="p-2 w-2/12">السبب</th>
                                    <th className="p-2 w-2/12">الكلفة</th>
                                    <th className="p-2 w-2/12">القيمة</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => {
                                    const product = state.products.find(p => p.id === item.productId);
                                    return(
                                    <tr key={index} className="border-b">
                                        <td>
                                             <SearchableProductInput
                                                products={state.products}
                                                value={item.productId}
                                                onChange={productId => handleItemChange(index, 'productId', productId)}
                                                placeholder="اختر مادة..."
                                             />
                                        </td>
                                        <td><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className="w-full border-gray-200 rounded p-1.5" min="1" max={product?.stock} /></td>
                                        <td>
                                             <select value={item.reason} onChange={(e) => handleItemChange(index, 'reason', e.target.value as any)} className="w-full border-gray-200 rounded p-1.5" required>
                                                <option value="expiry">إكسباير</option>
                                                <option value="damage">تلف</option>
                                                <option value="theft">سرقة</option>
                                                <option value="correction">تصحيح</option>
                                                <option value="other">آخر</option>
                                            </select>
                                        </td>
                                        <td><input type="number" value={item.costPrice} onChange={e => handleItemChange(index, 'costPrice', Number(e.target.value))} className="w-full border-gray-200 rounded p-1.5" readOnly /></td>
                                        <td className="p-2 font-semibold">{formatCurrency(item.quantity * item.costPrice)}</td>
                                        <td><button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button></td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    <button type="button" onClick={addItem} className="text-sm text-teal-600 font-medium flex items-center gap-1"><PlusCircle size={16} /> إضافة مادة أخرى</button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
                        </div>
                        <div className="space-y-3 bg-red-50 p-4 rounded-lg flex items-center justify-center">
                             <div className="text-center">
                                <span className="font-medium text-lg">إجمالي قيمة الخسارة:</span>
                                <p className="font-bold text-2xl text-red-600">{formatCurrency(totalLossValue)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={resetForm} className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600">
                            <FilePlus size={20} /><span>تسوية جديدة</span>
                        </button>
                        <button type="submit" className="bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
                            <Save size={20} /><span>حفظ التسوية</span>
                        </button>
                    </div>
                </form>
            </div>

             <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">آخر التسويات</h2>
                     <button onClick={() => window.print()} className="no-print bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                        <Printer size={18} />
                        <span>طباعة السجل</span>
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">تاريخ التسوية</th>
                                <th className="px-6 py-3">عدد المواد</th>
                                <th className="px-6 py-3">إجمالي الخسارة</th>
                                <th className="px-6 py-3">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.stockAdjustments.map(adj => (
                                <tr key={adj.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(adj.date).toLocaleDateString('ar-IQ')}</td>
                                    <td className="px-6 py-4">{adj.items.length}</td>
                                    <td className="px-6 py-4 font-bold text-red-500">{formatCurrency(adj.totalLossValue)}</td>
                                    <td className="px-6 py-4 text-xs">{adj.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustments;