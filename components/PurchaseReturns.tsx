import React, { useState, useMemo, useRef, useCallback, useEffect, useReducer } from 'react';
import { useInventory } from '../context/InventoryContext';
import { PurchaseReturn, PurchaseReturnItem, Supplier } from '../types';
import { PlusCircle, Trash2, Edit, Save, Search, XCircle, Redo, Printer, FilePlus } from 'lucide-react';
import SearchableProductInput from './common/SearchableProductInput';
import SearchableSupplierInput from './common/SearchableSupplierInput';

const today = new Date().toISOString().split('T')[0];
const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);

// --- New Local Reducer for Form State Management ---
type ItemFormState = {
    key: string; productId: string; code: string; quantity: number; bonus: number; costPrice: number;
};
const createNewItem = (): ItemFormState => ({ key: `item_${Date.now()}_${Math.random()}`, productId: '', code: '', quantity: 1, bonus: 0, costPrice: 0 });

type FormState = {
    supplierId: string;
    invoiceNumber: string;
    returnDate: string;
    notes: string;
    discount: number;
    items: ItemFormState[];
};
type FormAction =
  | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'items'>; value: string | number }
  | { type: 'ADD_ITEM' }
  | { type: 'REMOVE_ITEM'; key: string }
  | { type: 'UPDATE_ITEM'; key: string; field: keyof ItemFormState; value: any; product?: any; maxStock?: number };

const formReducer = (state: FormState, action: FormAction): FormState => {
    switch(action.type) {
        case 'SET_FIELD': return { ...state, [action.field]: action.value };
        case 'ADD_ITEM': return { ...state, items: [...state.items, createNewItem()] };
        case 'REMOVE_ITEM':
            if (state.items.length <= 1) return state;
            return { ...state, items: state.items.filter(i => i.key !== action.key) };
        case 'UPDATE_ITEM':
            return {
                ...state,
                items: state.items.map(item => {
                    if (item.key === action.key) {
                        const updatedItem = { ...item, [action.field]: action.value };
                        if (action.product) {
                            updatedItem.code = action.product.id;
                            updatedItem.costPrice = action.product.costPrice;
                        }
                        if ((action.field === 'quantity' || action.field === 'bonus') && action.maxStock !== undefined) {
                            const newQuantity = action.field === 'quantity' ? Number(action.value) : updatedItem.quantity;
                            const newBonus = action.field === 'bonus' ? Number(action.value) : updatedItem.bonus;
                            if ((newQuantity + newBonus) > action.maxStock) {
                                alert(`لا يمكن إرجاع كمية أكبر من المتوفر في المخزون (${action.maxStock})`);
                                if (action.field === 'quantity') updatedItem.quantity = action.maxStock;
                                if (action.field === 'bonus') updatedItem.bonus = 0;
                            }
                        }
                        return updatedItem;
                    }
                    return item;
                })
            };
        default: return state;
    }
};

interface PurchaseReturnFormProps {
  returnToEdit?: PurchaseReturn;
  onSave: (returnData: Omit<PurchaseReturn, 'id'>, editingId: string | null) => void;
  onCancel: () => void;
}

const PurchaseReturnForm: React.FC<PurchaseReturnFormProps> = ({ returnToEdit, onSave, onCancel }) => {
    const { state: globalState } = useInventory();
    
    const getInitialState = useCallback((): FormState => {
        if (returnToEdit) {
            return {
                supplierId: returnToEdit.supplierId,
                invoiceNumber: returnToEdit.invoiceNumber,
                returnDate: returnToEdit.returnDate,
                notes: returnToEdit.notes,
                discount: returnToEdit.discount,
                items: returnToEdit.items.map(item => ({
                    key: `item_${item.productId}_${Math.random()}`, productId: item.productId, code: item.productId,
                    quantity: item.quantity, bonus: item.bonus, costPrice: item.costPrice,
                }))
            };
        }
        return { supplierId: '', invoiceNumber: '', returnDate: today, notes: '', discount: 0, items: [createNewItem()] };
    }, [returnToEdit]);

    const [state, dispatch] = useReducer(formReducer, getInitialState());
    const itemInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    const { subtotal, totalReturnValue } = useMemo(() => {
        const subtotalCalc = state.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
        return { subtotal: subtotalCalc, totalReturnValue: subtotalCalc - state.discount };
    }, [state.items, state.discount]);

    const handleItemChange = (key: string, field: keyof ItemFormState, value: any) => {
        const product = globalState.products.find(p => p.id === (field === 'productId' ? value : state.items.find(i => i.key === key)?.productId));
        dispatch({ type: 'UPDATE_ITEM', key, field, value, product, maxStock: product?.stock });
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
            } else { alert('المنتج غير موجود!'); }
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.supplierId) { alert('يرجى اختيار المورد.'); return; }
        const validItems = state.items.filter(item => item.productId && (item.quantity > 0 || item.bonus > 0));
        if (validItems.length === 0) { alert('يجب إضافة مادة واحدة على الأقل بكمية صحيحة.'); return; }

        const returnItems: PurchaseReturnItem[] = validItems.map(item => {
            const product = globalState.products.find(p => p.id === item.productId)!;
            return { productId: item.productId, name: product.name, quantity: item.quantity, bonus: item.bonus, costPrice: item.costPrice, itemTotal: item.costPrice * item.quantity };
        });
        
        const { items, ...formData } = state;
        const returnData: Omit<PurchaseReturn, 'id'> = { ...formData, items: returnItems, subtotal, totalReturnValue };
        onSave(returnData, returnToEdit?.id || null);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md no-print">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{returnToEdit ? 'تعديل فاتورة إرجاع' : 'فاتورة إرجاع مشتريات'}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">المورد</label>
                        <SearchableSupplierInput suppliers={globalState.suppliers} value={state.supplierId} onChange={id => dispatch({type: 'SET_FIELD', field: 'supplierId', value: id})} required={true}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">مرجع الفاتورة (اختياري)</label>
                        <input type="text" value={state.invoiceNumber} onChange={e => dispatch({type: 'SET_FIELD', field: 'invoiceNumber', value: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">تاريخ الإرجاع</label>
                        <input type="date" value={state.returnDate} onChange={e => dispatch({type: 'SET_FIELD', field: 'returnDate', value: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                </div>
                <div className="overflow-x-auto -mx-4">
                    <table className="min-w-full text-sm">
                        <thead className="text-right text-gray-600"><tr><th className="p-2 w-[10%]">الكود</th><th className="p-2 w-[30%]">المادة</th><th className="p-2">الكمية</th><th className="p-2">البونص</th><th className="p-2">الكلفة</th><th className="p-2">المجموع</th><th className="p-2"></th></tr></thead>
                        <tbody>
                            {state.items.map((item) => (
                                <tr key={item.key} className="border-b">
                                    <td><input type="text" placeholder="الكود" value={item.code} ref={(el) => { if (el) itemInputRefs.current.set(`${item.key}-code`, el); }} onChange={e => handleItemChange(item.key, 'code', e.target.value)} onKeyDown={e => handleCodeEnter(e, item.key)} className="w-full border-gray-200 rounded p-1.5" /></td>
                                    <td><SearchableProductInput products={globalState.products} value={item.productId} onChange={productId => handleItemChange(item.key, 'productId', productId)} /></td>
                                    <td><input type="number" value={item.quantity} ref={(el) => { if (el) itemInputRefs.current.set(`${item.key}-quantity`, el); }} onChange={e => handleItemChange(item.key, 'quantity', Number(e.target.value))} className="w-20 border-gray-200 rounded p-1.5" min="0" /></td>
                                    <td><input type="number" value={item.bonus} onChange={e => handleItemChange(item.key, 'bonus', Number(e.target.value))} className="w-20 border-gray-200 rounded p-1.5" min="0" /></td>
                                    <td><input type="number" value={item.costPrice} onChange={e => handleItemChange(item.key, 'costPrice', Number(e.target.value))} className="w-24 border-gray-200 rounded p-1.5" /></td>
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
                        <div className="flex justify-between items-center"><span className="font-medium">المجموع:</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between items-center"><label className="font-medium">خصم:</label><input type="number" placeholder="0" value={state.discount} onChange={e => dispatch({type: 'SET_FIELD', field: 'discount', value: Number(e.target.value)})} className="w-32 border-gray-300 rounded p-1 text-left" /></div>
                        <div className="flex justify-between items-center text-xl font-bold border-t pt-2"><span>إجمالي الإرجاع:</span><span className="text-red-600">{formatCurrency(totalReturnValue)}</span></div>
                        <small className="block text-center">(سيتم خصم هذا المبلغ من رصيد المورد)</small>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300"><XCircle size={18}/> <span>إلغاء</span></button>
                    <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><Save size={20} /><span>{returnToEdit ? 'حفظ التعديلات' : 'حفظ الإرجاع'}</span></button>
                </div>
            </form>
        </div>
    );
};

const PurchaseReturnsList: React.FC<{ onEdit: (pr: PurchaseReturn) => void, onDelete: (id: string) => void, setReturnToPrint: (pr: PurchaseReturn) => void }> = ({ onEdit, onDelete, setReturnToPrint }) => {
    const { state } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const filteredReturns = useMemo(() => {
        return state.purchaseReturns.filter(pr => {
            const supplier = state.suppliers.find(s => s.id === pr.supplierId);
            const search = searchTerm.toLowerCase();
            return (pr.invoiceNumber.toLowerCase().includes(search) || (supplier?.name.toLowerCase() || '').includes(search));
        }).sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());
    }, [state.purchaseReturns, state.suppliers, searchTerm]);

    return (
         <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">سجل إرجاع المشتريات</h2>
                <button onClick={() => window.print()} className="no-print bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                    <Printer size={18} /><span>طباعة السجل</span>
                </button>
            </div>
            <div className="relative mb-4 no-print">
                <input type="text" placeholder="ابحث بالمرجع أو اسم المورد..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/3 border border-gray-300 rounded-full shadow-sm py-2 px-4 pr-10"/>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">تاريخ الإرجاع</th><th className="px-6 py-3">المورد</th><th className="px-6 py-3">مرجع الفاتورة</th><th className="px-6 py-3">إجمالي القيمة</th><th className="px-6 py-3 no-print">إجراءات</th></tr></thead>
                    <tbody>
                        {filteredReturns.map(pr => (
                            <tr key={pr.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">{new Date(pr.returnDate).toLocaleDateString('ar-IQ')}</td>
                                <td className="px-6 py-4 font-medium">{state.suppliers.find(s => s.id === pr.supplierId)?.name || 'غير معروف'}</td>
                                <td className="px-6 py-4">{pr.invoiceNumber}</td>
                                <td className="px-6 py-4 font-bold text-red-500">{formatCurrency(pr.totalReturnValue)}</td>
                                <td className="px-6 py-4 flex items-center gap-3 no-print">
                                    <button onClick={() => setReturnToPrint(pr)} className="text-gray-500 hover:text-blue-600 p-1"><Printer size={18} /></button>
                                    <button onClick={() => onEdit(pr)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                    <button onClick={() => onDelete(pr.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PrintablePurchaseReturn: React.FC<{ purchaseReturn: PurchaseReturn; companyInfo: any, supplier?: Supplier }> = ({ purchaseReturn, companyInfo, supplier }) => (
    <div className="printable-area p-8 font-sans text-xs" dir="rtl">
        <div className="text-center mb-6"><h2 className="text-xl font-bold mt-4 border-y-2 py-1">فاتورة إرجاع مشتريات</h2></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div><p><strong>إلى:</strong> {supplier?.name || 'مورد غير محدد'}</p></div>
            <div className="text-left"><p><strong>مرجع الفاتورة:</strong> {purchaseReturn.invoiceNumber}</p><p><strong>تاريخ الإرجاع:</strong> {new Date(purchaseReturn.returnDate).toLocaleDateString('ar-IQ')}</p></div>
        </div>
        <table className="w-full mb-4 text-xs">
            <thead><tr className="border-b"><th className="text-right py-2">المادة</th><th className="text-center py-2">الكمية</th><th className="text-center py-2">الكلفة</th><th className="text-left py-2">الإجمالي</th></tr></thead>
            <tbody>{purchaseReturn.items.map((item, idx) => (<tr key={idx} className="border-b"><td className="py-2">{item.name}</td><td className="text-center py-2">{item.quantity}</td><td className="text-center py-2">{formatCurrency(item.costPrice)}</td><td className="text-left py-2">{formatCurrency(item.itemTotal)}</td></tr>))}</tbody>
        </table>
        <div className="w-1/2 ml-auto space-y-2">
            <div className="flex justify-between"><span>المجموع الفرعي:</span><span>{formatCurrency(purchaseReturn.subtotal)}</span></div>
            <div className="flex justify-between"><span>الخصم:</span><span>{formatCurrency(purchaseReturn.discount)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>إجمالي القيمة المرتجعة:</span><span>{formatCurrency(purchaseReturn.totalReturnValue)}</span></div>
        </div>
        <div className="text-center mt-8 text-xs text-gray-600"><p>{purchaseReturn.notes}</p></div>
    </div>
);


const PurchaseReturns: React.FC = () => {
    const { state, dispatch } = useInventory();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [returnToEdit, setReturnToEdit] = useState<PurchaseReturn | undefined>(undefined);
    const [returnToPrint, setReturnToPrint] = useState<PurchaseReturn | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (returnToPrint) { window.print(); setReturnToPrint(null); }
    }, [returnToPrint]);

    const handleNew = useCallback(() => {
        setReturnToEdit(undefined);
        setView('form');
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    }, []);

    const handleEdit = useCallback((pr: PurchaseReturn) => {
        setReturnToEdit(pr);
        setView('form');
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    }, []);
    
    const handleCancel = useCallback(() => {
        setReturnToEdit(undefined);
        setView('list');
    }, []);

    const handleSave = useCallback((returnData: Omit<PurchaseReturn, 'id'>, editingId: string | null) => {
        if (editingId) {
            dispatch({ type: 'UPDATE_PURCHASE_RETURN', payload: { ...returnData, id: editingId } });
            alert('تم تعديل فاتورة الإرجاع بنجاح!');
        } else {
            dispatch({ type: 'ADD_PURCHASE_RETURN', payload: { ...returnData, id: new Date().toISOString() } });
            alert('تم حفظ فاتورة الإرجاع بنجاح!');
        }
        setView('list');
    }, [dispatch]);

    const handleDelete = useCallback((returnId: string) => {
        if (window.confirm('هل أنت متأكد من حذف فاتورة الإرجاع هذه؟ سيتم عكس التغييرات على المخزون وحساب المورد.')) {
            dispatch({ type: 'DELETE_PURCHASE_RETURN', payload: returnId });
        }
    }, [dispatch]);

    const handlePrint = useCallback((purchaseReturn: PurchaseReturn) => {
        setReturnToPrint(purchaseReturn);
    }, []);

    return (
        <>
        {returnToPrint && <PrintablePurchaseReturn purchaseReturn={returnToPrint} companyInfo={state.companyInfo} supplier={state.suppliers.find(s=>s.id === returnToPrint.supplierId)} />}
        <div className="space-y-8">
            {view === 'list' && (
                <div className="flex justify-end no-print">
                    <button onClick={handleNew} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700">
                        <FilePlus size={20} /><span>فاتورة إرجاع جديدة</span>
                    </button>
                </div>
            )}
            <div ref={formRef}>
                {view === 'form' && <PurchaseReturnForm returnToEdit={returnToEdit} onSave={handleSave} onCancel={handleCancel} />}
            </div>
            {view === 'list' && <PurchaseReturnsList onEdit={handleEdit} onDelete={handleDelete} setReturnToPrint={handlePrint} />}
        </div>
        </>
    );
};

export default PurchaseReturns;
