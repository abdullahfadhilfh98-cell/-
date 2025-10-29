import React, { useState, useMemo, useRef, useCallback, useEffect, useReducer } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Purchase, PurchaseItem, Supplier } from '../types';
import { PlusCircle, Trash2, Edit, Save, FilePlus, Search, XCircle, Printer, FileX2 } from 'lucide-react';
import SearchableProductInput from './common/SearchableProductInput';
import SearchableSupplierInput from './common/SearchableSupplierInput';

const today = new Date().toISOString().split('T')[0];

const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);

// --- New Local Reducer for Form State Management ---
type ItemFormState = {
    key: string; 
    productId: string;
    code: string;
    quantity: number;
    bonus: number;
    costPrice: number;
    discountPercentage: number;
    packetSellPrice: number;
    stripSellPrice: number;
    stripCount: number;
    expiryDate: string;
};

const createNewItem = (): ItemFormState => ({
    key: `item_${Date.now()}_${Math.random()}`,
    productId: '', code: '', quantity: 1, bonus: 0, costPrice: 0, discountPercentage: 0, packetSellPrice: 0, stripSellPrice: 0, stripCount: 0, expiryDate: '',
});

type FormState = {
    supplierId: string;
    invoiceNumber: string;
    invoiceDate: string;
    notes: string;
    discount: number;
    amountPaid: number;
    items: ItemFormState[];
};

type FormAction =
  | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'items'>; value: string | number }
  | { type: 'SET_ITEMS'; items: ItemFormState[] }
  | { type: 'ADD_ITEM' }
  | { type: 'REMOVE_ITEM'; key: string }
  | { type: 'UPDATE_ITEM'; key: string; field: keyof ItemFormState; value: any; product?: any };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ITEMS':
      return { ...state, items: action.items };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, createNewItem()] };
    case 'REMOVE_ITEM':
      if (state.items.length <= 1) return state;
      return { ...state, items: state.items.filter(item => item.key !== action.key) };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item => {
          if (item.key === action.key) {
            const updatedItem = { ...item, [action.field]: action.value };
            if (action.product) {
               updatedItem.code = action.product.id;
               updatedItem.costPrice = action.product.costPrice;
               updatedItem.packetSellPrice = action.product.packetSellPrice;
               updatedItem.stripSellPrice = action.product.stripSellPrice || 0;
               updatedItem.stripCount = action.product.stripCount || 0;
            }
            return updatedItem;
          }
          return item;
        }),
      };
    default:
      return state;
  }
};


interface PurchaseFormProps {
  purchaseToEdit?: Purchase;
  onSave: (purchaseData: Omit<Purchase, 'id' | 'arrivalDate' | 'paymentDueDate'>, editingId: string | null) => void;
  onCancel: () => void;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ purchaseToEdit, onSave, onCancel }) => {
    const { state: globalState } = useInventory();
    
    const getInitialState = useCallback((): FormState => {
        if (purchaseToEdit) {
            return {
                supplierId: purchaseToEdit.supplierId,
                invoiceNumber: purchaseToEdit.invoiceNumber,
                invoiceDate: purchaseToEdit.invoiceDate,
                notes: purchaseToEdit.notes,
                discount: purchaseToEdit.discount,
                amountPaid: purchaseToEdit.amountPaid,
                items: purchaseToEdit.items.map(pItem => ({
                    key: `item_${pItem.productId}_${Math.random()}`,
                    productId: pItem.productId, code: pItem.productId, quantity: pItem.quantity, bonus: pItem.bonus, costPrice: pItem.costPrice,
                    discountPercentage: pItem.discountPercentage || 0, packetSellPrice: pItem.packetSellPrice, stripSellPrice: pItem.stripSellPrice || 0,
                    stripCount: pItem.stripCount || 0, expiryDate: pItem.expiryDate,
                }))
            };
        }
        return {
            supplierId: '', invoiceNumber: '', invoiceDate: today, notes: '', discount: 0, amountPaid: 0, items: [createNewItem()]
        };
    }, [purchaseToEdit]);

    const [state, dispatch] = useReducer(formReducer, getInitialState());
    const itemInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    const { subtotal, total, amountDue } = useMemo(() => {
        const subtotalCalc = state.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
        const totalCalc = subtotalCalc - state.discount;
        const amountDueCalc = totalCalc - state.amountPaid;
        return { subtotal: subtotalCalc, total: totalCalc, amountDue: amountDueCalc };
    }, [state.items, state.discount, state.amountPaid]);

    const handleItemChange = (key: string, field: keyof ItemFormState, value: any) => {
        if (field === 'productId') {
            const product = globalState.products.find(p => p.id === value);
            dispatch({ type: 'UPDATE_ITEM', key, field, value, product });
        } else {
            dispatch({ type: 'UPDATE_ITEM', key, field, value });
        }
    };
    
    const handleCodeEnter = (e: React.KeyboardEvent<HTMLInputElement>, key: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const itemToUpdate = state.items.find(i => i.key === key);
            if (!itemToUpdate || !itemToUpdate.code) return;
            const product = globalState.products.find(p => p.id.toLowerCase() === itemToUpdate.code.toLowerCase());
            if (product) {
                handleItemChange(key, 'productId', product.id);
                itemInputRefs.current.get(`${key}-quantity`)?.focus();
            } else {
                alert('المنتج غير موجود!');
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.supplierId || !state.invoiceNumber) { alert('يرجى اختيار المورد وإدخال رقم الفاتورة.'); return; }
        const validItems = state.items.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) { alert('يجب إضافة مادة واحدة على الأقل وبكمية صحيحة.'); return; }

        const purchaseItems: PurchaseItem[] = validItems.map(item => {
            const product = globalState.products.find(p => p.id === item.productId)!;
            const itemSubtotal = item.costPrice * item.quantity;
            return {
                productId: item.productId, name: product.name, quantity: item.quantity, bonus: item.bonus, costPrice: item.costPrice,
                discountPercentage: item.discountPercentage, packetSellPrice: item.packetSellPrice, stripSellPrice: item.stripSellPrice,
                stripCount: item.stripCount, expiryDate: item.expiryDate, itemTotal: itemSubtotal,
            };
        });
        
        const { items, ...formData } = state;
        const purchaseData = { ...formData, items: purchaseItems, subtotal, total, amountDue };
        onSave(purchaseData, purchaseToEdit?.id || null);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md no-print">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{purchaseToEdit ? 'تعديل فاتورة شراء' : 'فاتورة شراء جديدة'}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">المورد</label>
                        <SearchableSupplierInput suppliers={globalState.suppliers} value={state.supplierId} onChange={(id) => dispatch({type: 'SET_FIELD', field: 'supplierId', value: id})} required={true}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">رقم الفاتورة</label>
                        <input type="text" value={state.invoiceNumber} onChange={(e) => dispatch({type: 'SET_FIELD', field: 'invoiceNumber', value: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">تاريخ الفاتورة</label>
                        <input type="date" value={state.invoiceDate} onChange={(e) => dispatch({type: 'SET_FIELD', field: 'invoiceDate', value: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                </div>

                <div className="overflow-x-auto -mx-4">
                    <table className="min-w-full text-sm">
                        <thead className="text-right text-gray-600"><tr><th className="p-2 w-[10%]">الكود</th><th className="p-2 w-[25%]">المادة</th><th className="p-2">الكمية</th><th className="p-2">شراء</th><th className="p-2">بيع</th><th className="p-2">إكسباير</th><th className="p-2">المجموع</th><th className="p-2"></th></tr></thead>
                        <tbody>
                            {state.items.map((item) => (
                                <tr key={item.key} className="border-b">
                                    <td><input type="text" placeholder="الكود" value={item.code} ref={(el) => { if (el) itemInputRefs.current.set(`${item.key}-code`, el); else itemInputRefs.current.delete(`${item.key}-code`); }} onChange={e => handleItemChange(item.key, 'code', e.target.value)} onKeyDown={e => handleCodeEnter(e, item.key)} className="w-full border-gray-200 rounded p-1.5" /></td>
                                    <td><SearchableProductInput products={globalState.products} value={item.productId} onChange={productId => handleItemChange(item.key, 'productId', productId)} /></td>
                                    <td><input type="number" value={item.quantity} ref={(el) => { if (el) itemInputRefs.current.set(`${item.key}-quantity`, el); else itemInputRefs.current.delete(`${item.key}-quantity`); }} onChange={e => handleItemChange(item.key, 'quantity', Number(e.target.value))} className="w-20 border-gray-200 rounded p-1.5" min="1" /></td>
                                    <td><input type="number" value={item.costPrice} onChange={e => handleItemChange(item.key, 'costPrice', Number(e.target.value))} className="w-24 border-gray-200 rounded p-1.5" /></td>
                                    <td><input type="number" value={item.packetSellPrice} onChange={e => handleItemChange(item.key, 'packetSellPrice', Number(e.target.value))} className="w-24 border-gray-200 rounded p-1.5" /></td>
                                    <td><input type="date" value={item.expiryDate} onChange={e => handleItemChange(item.key, 'expiryDate', e.target.value)} className="w-36 border-gray-200 rounded p-1.5" required /></td>
                                    <td className="p-2 font-semibold text-center">{formatCurrency(item.costPrice * item.quantity)}</td>
                                    <td><button type="button" onClick={() => dispatch({type: 'REMOVE_ITEM', key: item.key})} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button type="button" onClick={() => dispatch({type: 'ADD_ITEM'})} className="text-sm text-teal-600 font-medium flex items-center gap-1"><PlusCircle size={16} /> إضافة مادة</button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
                        <textarea value={state.notes} onChange={e => dispatch({type: 'SET_FIELD', field: 'notes', value: e.target.value})} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
                    </div>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center"><label className="font-medium">المجموع:</label><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between items-center"><label className="font-medium">خصم:</label><input type="number" value={state.discount} onChange={e => dispatch({type: 'SET_FIELD', field: 'discount', value: Number(e.target.value)})} className="w-32 border-gray-300 rounded p-1 text-left" placeholder="0" /></div>
                        <div className="flex justify-between items-center text-xl font-bold border-t pt-2"><span>الصافي:</span><span className="text-teal-600">{formatCurrency(total)}</span></div>
                        <div className="flex justify-between items-center"><label className="font-medium">المدفوع:</label><input type="number" value={state.amountPaid} onChange={e => dispatch({type: 'SET_FIELD', field: 'amountPaid', value: Number(e.target.value)})} className="w-32 border-gray-300 rounded p-1 text-left" placeholder="0" /></div>
                        <div className="flex justify-between items-center font-bold text-red-600"><span>المتبقي:</span><span>{formatCurrency(amountDue)}</span></div>
                    </div>
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                     <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300"><XCircle size={18}/> <span>إلغاء</span></button>
                    <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><Save size={20} /><span>{purchaseToEdit ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</span></button>
                </div>
            </form>
        </div>
    );
}

const PurchasesList: React.FC<{ onEdit: (p: Purchase) => void, onDelete: (id: string) => void, onCorrupt: (id: string) => void, setPurchaseToPrint: (p: Purchase) => void }> = ({ onEdit, onDelete, onCorrupt, setPurchaseToPrint }) => {
    const { state } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const filteredPurchases = useMemo(() => {
        return state.purchases.filter(purchase => {
            const supplier = state.suppliers.find(s => s.id === purchase.supplierId);
            return (
                purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }).sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    }, [state.purchases, state.suppliers, searchTerm]);

    return (
         <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">سجل فواتير الشراء</h2>
                 <button onClick={() => window.print()} className="no-print bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                    <Printer size={18} /><span>طباعة السجل</span>
                </button>
            </div>
            <div className="relative mb-4 no-print">
                <input type="text" placeholder="ابحث برقم الفاتورة أو اسم المورد..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/3 border border-gray-300 rounded-full shadow-sm py-2 px-4 pr-10"/>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">رقم الفاتورة</th><th className="px-6 py-3">المورد</th><th className="px-6 py-3">التاريخ</th><th className="px-6 py-3">الإجمالي</th><th className="px-6 py-3 no-print">إجراءات</th></tr></thead>
                    <tbody>
                        {filteredPurchases.map(purchase => {
                            const supplier = state.suppliers.find(s => s.id === purchase.supplierId);
                            return (
                                <tr key={purchase.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{purchase.invoiceNumber}</td>
                                    <td className="px-6 py-4">{supplier?.name || 'غير معروف'}</td>
                                    <td className="px-6 py-4">{new Date(purchase.invoiceDate).toLocaleDateString('ar-IQ')}</td>
                                    <td className="px-6 py-4 font-bold text-teal-600">{formatCurrency(purchase.total)}</td>
                                    <td className="px-6 py-4 flex items-center gap-3 no-print">
                                        <button onClick={() => setPurchaseToPrint(purchase)} className="text-gray-500 hover:text-blue-600 p-1" title="طباعة"><Printer size={18} /></button>
                                        <button onClick={() => onEdit(purchase)} className="text-blue-600 hover:text-blue-800" title="تعديل"><Edit size={18} /></button>
                                        <button onClick={() => onDelete(purchase.id)} className="text-red-600 hover:text-red-800" title="حذف"><Trash2 size={18} /></button>
                                        <button onClick={() => onCorrupt(purchase.id)} className="text-yellow-600 hover:text-yellow-800" title="إتلاف الفاتورة"><FileX2 size={18} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const PrintablePurchaseInvoice: React.FC<{ purchase: Purchase; companyInfo: any, supplier?: Supplier }> = ({ purchase, companyInfo, supplier }) => (
     <div className="printable-area p-8 font-sans text-xs" dir="rtl">
        <div className="text-center mb-6"><h2 className="text-xl font-bold mt-4 border-y-2 py-1">فاتورة شراء</h2></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div><p><strong>من:</strong> {supplier?.name || 'مورد غير محدد'}</p><p><strong>هاتف:</strong> {supplier?.phone}</p></div>
            <div className="text-left"><p><strong>رقم الفاتورة:</strong> {purchase.invoiceNumber}</p><p><strong>التاريخ:</strong> {new Date(purchase.invoiceDate).toLocaleDateString('ar-IQ')}</p></div>
        </div>
        <table className="w-full mb-4 text-xs">
            <thead><tr className="border-b"><th className="text-right py-2">المادة</th><th className="text-center py-2">الكمية</th><th className="text-center py-2">الكلفة</th><th className="text-left py-2">الإجمالي</th></tr></thead>
            <tbody>{purchase.items.map((item, idx) => (<tr key={idx} className="border-b"><td className="py-2">{item.name}</td><td className="text-center py-2">{item.quantity}</td><td className="text-center py-2">{formatCurrency(item.costPrice)}</td><td className="text-left py-2">{formatCurrency(item.itemTotal)}</td></tr>))}</tbody>
        </table>
        <div className="w-1/2 ml-auto space-y-2">
            <div className="flex justify-between"><span>المجموع الفرعي:</span><span>{formatCurrency(purchase.subtotal)}</span></div>
            <div className="flex justify-between"><span>الخصم:</span><span>{formatCurrency(purchase.discount)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>الإجمالي:</span><span>{formatCurrency(purchase.total)}</span></div>
        </div>
        <div className="text-center mt-8 text-xs text-gray-600"><p>{purchase.notes}</p></div>
    </div>
);


const Purchases: React.FC = () => {
    const { state, dispatch } = useInventory();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | undefined>(undefined);
    const [purchaseToPrint, setPurchaseToPrint] = useState<Purchase | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (purchaseToPrint) { window.print(); setPurchaseToPrint(null); }
    }, [purchaseToPrint]);

    const handleNew = useCallback(() => {
        setPurchaseToEdit(undefined);
        setView('form');
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    }, []);
    
    const handleEdit = useCallback((p: Purchase) => {
        setPurchaseToEdit(p);
        setView('form');
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    }, []);

    const handleCancel = useCallback(() => {
        setPurchaseToEdit(undefined);
        setView('list');
    }, []);
    
    const handleSave = useCallback((purchaseData: Omit<Purchase, 'id' | 'arrivalDate' | 'paymentDueDate'>, editingId: string | null) => {
        const fullPurchaseData = {
            ...purchaseData,
            arrivalDate: purchaseData.invoiceDate,
            paymentDueDate: purchaseData.invoiceDate,
        };

        if (editingId) {
            dispatch({ type: 'UPDATE_PURCHASE', payload: { ...fullPurchaseData, id: editingId } });
            alert('تم تعديل الفاتورة بنجاح!');
        } else {
            dispatch({ type: 'ADD_PURCHASE', payload: { ...fullPurchaseData, id: new Date().toISOString() } });
            alert('تم حفظ الفاتورة بنجاح!');
        }
        setView('list');
    }, [dispatch]);

    const handleDelete = useCallback((purchaseId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم عكس التغييرات على المخزون وحساب المورد.')) {
            dispatch({ type: 'DELETE_PURCHASE', payload: purchaseId });
        }
    }, [dispatch]);

    const handleCorrupt = useCallback((purchaseId: string) => {
        if (window.confirm('تحذير: هذا الإجراء سيقوم بإتلاف الفاتورة وحذفها نهائياً، مع عكس تأثيرها على المخزون وديون المورد. لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟')) {
            dispatch({ type: 'CORRUPT_PURCHASE', payload: purchaseId });
        }
    }, [dispatch]);
    
    const handlePrint = useCallback((purchase: Purchase) => {
        setPurchaseToPrint(purchase);
    }, []);

    return (
        <>
            {purchaseToPrint && <PrintablePurchaseInvoice purchase={purchaseToPrint} companyInfo={state.companyInfo} supplier={state.suppliers.find(s=>s.id === purchaseToPrint.supplierId)} />}
            <div className="space-y-8">
                 {view === 'list' && (
                    <div className="flex justify-end no-print">
                        <button onClick={handleNew} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700">
                            <FilePlus size={20} /><span>فاتورة شراء جديدة</span>
                        </button>
                    </div>
                )}
                <div ref={formRef}>
                    {view === 'form' && <PurchaseForm purchaseToEdit={purchaseToEdit} onSave={handleSave} onCancel={handleCancel} />}
                </div>
                {view === 'list' && <PurchasesList onEdit={handleEdit} onDelete={handleDelete} onCorrupt={handleCorrupt} setPurchaseToPrint={handlePrint} />}
            </div>
        </>
    );
};

export default Purchases;