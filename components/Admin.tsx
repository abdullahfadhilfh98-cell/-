import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useInventory } from '../context/InventoryContext';
import { DatabaseBackup, UploadCloud, Settings, Building, Save, ImagePlus, Users as UsersIcon, PlusCircle, Edit, Trash2, Wallet, PackagePlus, ClipboardList, AlertTriangle, Printer } from 'lucide-react';
import { CompanyInfo, User, UserRole, OpeningStockInvoice, OpeningStockItemDetail, OpeningDebtInvoice } from '../types';
import Modal from './common/Modal';
import SearchableProductInput from './common/SearchableProductInput';
import SearchableSupplierInput from './common/SearchableSupplierInput';

const today = new Date().toISOString().split('T')[0];

const CompanyInfoForm: React.FC = () => {
    const { state, dispatch } = useInventory();
    const [formData, setFormData] = useState<CompanyInfo>(state.companyInfo);

    useEffect(() => {
        setFormData(state.companyInfo);
    }, [state.companyInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'UPDATE_COMPANY_INFO', payload: formData });
        alert('تم حفظ بيانات الصيدلية بنجاح!');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">اسم الصيدلية</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700">رقم الهاتف</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">العنوان</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">ملاحظات أسفل الفاتورة</label><textarea name="footerNotes" rows={3} value={formData.footerNotes} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea></div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">شعار الصيدلية</label>
                    <div className="mt-1 flex items-center gap-4">
                         {formData.logo && <img src={formData.logo} alt="الشعار الحالي" className="h-16 w-16 object-contain rounded-md border p-1" />}
                         <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"><ImagePlus size={16}/><span>{formData.logo ? 'تغيير الشعار' : 'رفع شعار'}</span></label>
                        <input id="logo-upload" name="logo" type="file" className="hidden" accept="image/*" onChange={handleLogoChange}/>
                    </div>
                </div>
            </div>
             <div className="flex justify-end pt-4 border-t">
                <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 shadow-sm"><Save size={20} /><span>حفظ التغييرات</span></button>
            </div>
        </form>
    );
};

const DataManagement: React.FC = () => {
    const { state, dispatch } = useInventory();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = () => {
        try {
            const stateToBackup = { ...state, currentUser: null }; // Don't backup logged in user
            const dataStr = JSON.stringify(stateToBackup, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `pharmacy_backup_${new Date().toISOString().slice(0,10)}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            alert('تم تصدير النسخة الاحتياطية بنجاح!');
        } catch (error) {
            console.error("Backup failed:", error);
            alert('حدث خطأ أثناء إنشاء النسخة الاحتياطية.');
        }
    };
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!window.confirm("سيؤدي استيراد البيانات إلى استبدال جميع البيانات الحالية. هل أنت متأكد من المتابعة؟\n\n⚠️ الرجاء التأكد من أن لديك نسخة احتياطية حديثة قبل المتابعة.")) {
            if(fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read");
                const data = JSON.parse(text);
                dispatch({ type: 'REPLACE_STATE', payload: data });
                alert('تم استيراد البيانات بنجاح! سيتم تحديث التطبيق.');
            } catch (error) {
                console.error("Import failed:", error);
                alert('فشل استيراد الملف. يرجى التأكد من أنه ملف نسخة احتياطية صالح.');
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };
    return (
         <div className="space-y-8">
            <div>
                <h4 className="font-medium text-lg">تصدير (نسخ احتياطي)</h4>
                <p className="text-gray-600 text-sm mb-3">قم بتصدير جميع بيانات الصيدلية إلى ملف للحفاظ عليها.</p>
                <button onClick={handleBackup} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm text-sm"><DatabaseBackup size={18} /><span>تصدير البيانات</span></button>
            </div>
            <div className="border-t pt-8">
                <h4 className="font-medium text-lg">استيراد (استعادة)</h4>
                <p className="text-gray-600 text-sm mb-3">استيراد بيانات من ملف. <strong className="text-red-600">سيتم حذف جميع البيانات الحالية.</strong></p>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" id="import-file-input" />
                <label htmlFor="import-file-input" className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm w-fit text-sm"><UploadCloud size={18} /><span>اختر ملف للاستيراد</span></label>
            </div>
        </div>
    );
};

const UserManagement: React.FC = () => {
    const { state, dispatch } = useInventory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const initialFormState = { username: '', password: '', role: 'cashier' as UserRole };
    const [formData, setFormData] = useState(initialFormState);

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user);
        setFormData(user ? { ...user, password: '' } : initialFormState);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData(initialFormState);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username) {
            alert('اسم المستخدم مطلوب.'); return;
        }
        if (!editingUser && !formData.password) {
            alert('كلمة المرور مطلوبة عند إنشاء مستخدم جديد.'); return;
        }

        if (editingUser) {
            const payload: User = { ...editingUser, ...formData };
            if (!formData.password) { // If password field is empty, don't change it
                delete payload.password;
            }
            dispatch({ type: 'UPDATE_USER', payload });
        } else {
            dispatch({ type: 'ADD_USER', payload: formData as Omit<User, 'id'> });
        }
        handleCloseModal();
    };

    const handleDelete = (userId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            dispatch({ type: 'DELETE_USER', payload: userId });
        }
    };
    
    const roleMap: Record<UserRole, string> = { admin: 'مدير', pharmacist: 'صيدلاني', cashier: 'كاشير' };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={() => handleOpenModal()} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><PlusCircle size={20} /><span>إضافة مستخدم</span></button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr><th className="px-6 py-3">اسم المستخدم</th><th className="px-6 py-3">الصلاحية</th><th className="px-6 py-3">إجراءات</th></tr>
                    </thead>
                    <tbody>
                        {state.users.map(user => (
                            <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                                <td className="px-6 py-4">{roleMap[user.role]}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">اسم المستخدم</label><input type="text" name="username" value={formData.username} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700">كلمة المرور</label><input type="password" name="password" value={formData.password} placeholder={editingUser ? 'اتركه فارغاً لعدم التغيير' : ''} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">الصلاحية</label><select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"><option value="cashier">كاشير</option><option value="pharmacist">صيدلاني</option><option value="admin">مدير</option></select></div>
                    <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">إلغاء</button><button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">{editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}</button></div>
                </form>
            </Modal>
        </div>
    );
};

// Opening Balances Component
const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);

type StockItemFormState = {
    key: string;
    productId: string | undefined;
    quantityInPackets: number;
    quantityInStrips: number;
    costPrice: number;
    expiryDate: string;
    stripCount: number;
    stripSellPrice: number;
};
const createNewStockItem = (): StockItemFormState => ({ key: `item_${Date.now()}_${Math.random()}`, productId: undefined, quantityInPackets: 0, quantityInStrips: 0, costPrice: 0, expiryDate: '', stripCount: 0, stripSellPrice: 0 });

const OpeningBalances: React.FC = () => {
    const { state, dispatch } = useInventory();

    // Stock Invoice State
    const [stockInvoiceDate, setStockInvoiceDate] = useState(today);
    const [stockInvoiceNotes, setStockInvoiceNotes] = useState('');
    const [stockItems, setStockItems] = useState<StockItemFormState[]>([createNewStockItem()]);

    // Debt Invoice State
    const [debtInvoiceSupplierId, setDebtInvoiceSupplierId] = useState('');
    const [debtInvoiceOldNumber, setDebtInvoiceOldNumber] = useState('');
    const [debtInvoiceOldDate, setDebtInvoiceOldDate] = useState(today);
    const [debtInvoiceAmountDue, setDebtInvoiceAmountDue] = useState(0);
    const [debtInvoiceNotes, setDebtInvoiceNotes] = useState('');

    const handleStockItemChange = useCallback((key: string, field: keyof StockItemFormState, value: string | number) => {
        setStockItems(currentItems => currentItems.map(item => {
            if (item.key === key) {
                const updatedItem = { ...item };
                if ((field === 'quantityInPackets' || field === 'quantityInStrips') && Number(value) < 0) value = 0;
                (updatedItem as any)[field] = value;
                if (field === 'productId') {
                    const product = state.products.find(p => p.id === value);
                    if (product) {
                        updatedItem.costPrice = product.costPrice;
                        updatedItem.expiryDate = product.expiryDate;
                        updatedItem.stripCount = product.stripCount || 0;
                        updatedItem.stripSellPrice = product.stripSellPrice || 0;
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    }, [state.products]);
    
    const addStockItemRow = useCallback(() => setStockItems(prev => [...prev, createNewStockItem()]), []);
    const removeStockItemRow = useCallback((key: string) => { 
        setStockItems(prev => {
            if (prev.length > 1) {
                return prev.filter(item => item.key !== key)
            }
            return prev;
        });
     }, []);

    const resetStockForm = useCallback(() => {
        setStockInvoiceDate(today);
        setStockInvoiceNotes('');
        setStockItems([createNewStockItem()]);
    }, []);
    
    const handleSaveStockInvoice = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const validItems = stockItems.filter(item => item.productId && ((item.quantityInPackets || 0) + (item.quantityInStrips || 0) > 0));
        if (validItems.length === 0) {
            alert('يرجى إضافة مادة واحدة على الأقل.'); return;
        }

        const openingBalanceItems: OpeningStockItemDetail[] = validItems.map(item => {
            const product = state.products.find(p => p.id === item.productId)!;
            const stripCount = item.stripCount > 0 ? item.stripCount : (product?.stripCount || 1);
            const effectiveStripCount = stripCount > 0 ? stripCount : 1;
            const totalQuantity = (item.quantityInPackets || 0) + ((item.quantityInStrips || 0) / effectiveStripCount);
            return {
                productId: item.productId!,
                name: product.name,
                quantity: totalQuantity,
                costPrice: item.costPrice,
                expiryDate: item.expiryDate,
                stripCount: item.stripCount,
                stripSellPrice: item.stripSellPrice,
                itemTotalValue: totalQuantity * item.costPrice,
            };
        });

        const totalValue = openingBalanceItems.reduce((sum, item) => sum + item.itemTotalValue, 0);

        const payload: OpeningStockInvoice = { id: new Date().toISOString(), date: stockInvoiceDate, notes: stockInvoiceNotes, items: openingBalanceItems, totalValue };
        dispatch({ type: 'ADD_OPENING_STOCK_INVOICE', payload });
        alert('تم حفظ فاتورة المخزون الافتتاحي بنجاح!');
        resetStockForm();
    }, [stockItems, state.products, stockInvoiceDate, stockInvoiceNotes, dispatch, resetStockForm]);

    const handleDeleteStockInvoice = (invoiceId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم عكس تأثيرها على المخزون.')) {
            dispatch({ type: 'DELETE_OPENING_STOCK_INVOICE', payload: invoiceId });
        }
    };

    const resetDebtForm = useCallback(() => {
        setDebtInvoiceSupplierId('');
        setDebtInvoiceOldNumber('');
        setDebtInvoiceOldDate(today);
        setDebtInvoiceAmountDue(0);
        setDebtInvoiceNotes('');
    }, []);

    const handleSaveDebtInvoice = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!debtInvoiceSupplierId || !debtInvoiceOldNumber || debtInvoiceAmountDue <= 0) {
            alert('يرجى اختيار المورد، إدخال رقم الفاتورة القديم، ومبلغ الدين.'); return;
        }
        const payload: OpeningDebtInvoice = {
            id: new Date().toISOString(),
            date: today,
            supplierId: debtInvoiceSupplierId,
            oldInvoiceNumber: debtInvoiceOldNumber,
            oldInvoiceDate: debtInvoiceOldDate,
            amountDue: debtInvoiceAmountDue,
            notes: debtInvoiceNotes,
        };
        dispatch({ type: 'ADD_OPENING_DEBT_INVOICE', payload });
        alert('تم حفظ فاتورة الدين الافتتاحي بنجاح!');
        resetDebtForm();
    }, [debtInvoiceSupplierId, debtInvoiceOldNumber, debtInvoiceOldDate, debtInvoiceAmountDue, debtInvoiceNotes, dispatch, resetDebtForm]);
    
    const handleDeleteDebtInvoice = (invoiceId: string) => {
        if (window.confirm('هل أنت متأكد من حذف فاتورة الدين هذه؟ سيتم عكس تأثيرها على رصيد المورد.')) {
            dispatch({ type: 'DELETE_OPENING_DEBT_INVOICE', payload: invoiceId });
        }
    };


    return (
        <div className="space-y-8">
            {/* Opening Stock Invoices */}
            <div className="p-6 border rounded-lg bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><PackagePlus size={24} /> فواتير المخزون الافتتاحي</h3>
                <form onSubmit={handleSaveStockInvoice} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div><label className="block text-sm font-medium">تاريخ الإدخال</label><input type="date" value={stockInvoiceDate} onChange={e => setStockInvoiceDate(e.target.value)} className="mt-1 w-full border-gray-300 rounded p-1.5" /></div>
                         <div><label className="block text-sm font-medium">ملاحظات/مرجع</label><input type="text" value={stockInvoiceNotes} onChange={e => setStockInvoiceNotes(e.target.value)} className="mt-1 w-full border-gray-300 rounded p-1.5" /></div>
                    </div>
                    <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead><tr>
                            <th className="p-2 w-3/12 text-right">المادة</th><th className="p-2 text-right">كمية (باكيت)</th><th className="p-2 text-right">كمية (شريط)</th><th className="p-2 text-right">الكلفة</th><th className="p-2 text-right">الإكسباير</th><th></th>
                        </tr></thead>
                        <tbody>{stockItems.map((item) => (
                            <tr key={item.key} className="border-b">
                                <td><SearchableProductInput products={state.products} value={item.productId} onChange={pid => handleStockItemChange(item.key, 'productId', pid)} /></td>
                                <td><input type="number" value={item.quantityInPackets} onChange={e => handleStockItemChange(item.key, 'quantityInPackets', Number(e.target.value))} className="w-full border-gray-200 rounded p-1.5" min="0" /></td>
                                <td><input type="number" value={item.quantityInStrips} onChange={e => handleStockItemChange(item.key, 'quantityInStrips', Number(e.target.value))} className="w-full border-gray-200 rounded p-1.5" min="0" /></td>
                                <td><input type="number" value={item.costPrice} onChange={e => handleStockItemChange(item.key, 'costPrice', Number(e.target.value))} className="w-full border-gray-200 rounded p-1.5" /></td>
                                <td><input type="date" value={item.expiryDate} onChange={e => handleStockItemChange(item.key, 'expiryDate', e.target.value)} className="w-full border-gray-200 rounded p-1.5" /></td>
                                <td><button type="button" onClick={() => removeStockItemRow(item.key)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button></td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                    <button type="button" onClick={addStockItemRow} className="text-sm text-teal-600 font-medium flex items-center gap-1 mt-3"><PlusCircle size={16} /> إضافة مادة</button>
                    <div className="flex justify-end pt-4 mt-4 border-t"><button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><Save size={20} /><span>حفظ فاتورة المخزون</span></button></div>
                </form>
                 <div className="mt-8">
                    <h4 className="font-bold text-gray-700 mb-2">الفواتير المحفوظة</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {state.openingStockInvoices.map(inv => (<div key={inv.id} className="bg-white p-2 rounded border flex justify-between items-center text-sm"><div><span className="font-semibold">{new Date(inv.date).toLocaleDateString('ar-IQ')}</span> - {inv.notes} ({inv.items.length} مواد)</div><div className="flex items-center gap-4"><span className="font-bold">{formatCurrency(inv.totalValue)}</span><button onClick={() => handleDeleteStockInvoice(inv.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></div></div>))}
                    </div>
                </div>
            </div>

            {/* Opening Debt Invoices */}
            <div className="p-6 border rounded-lg bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><UsersIcon size={24} /> فواتير الديون الافتتاحية</h3>
                <form onSubmit={handleSaveDebtInvoice} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="lg:col-span-2"><label className="block text-sm font-medium">المورد</label><SearchableSupplierInput suppliers={state.suppliers} value={debtInvoiceSupplierId} onChange={setDebtInvoiceSupplierId} required/></div>
                        <div><label className="block text-sm font-medium">رقم الفاتورة القديم</label><input type="text" value={debtInvoiceOldNumber} onChange={e => setDebtInvoiceOldNumber(e.target.value)} className="mt-1 w-full border-gray-300 rounded p-1.5" required/></div>
                         <div><label className="block text-sm font-medium">تاريخها</label><input type="date" value={debtInvoiceOldDate} onChange={e => setDebtInvoiceOldDate(e.target.value)} className="mt-1 w-full border-gray-300 rounded p-1.5" /></div>
                        <div><label className="block text-sm font-medium">قيمة الدين</label><input type="number" value={debtInvoiceAmountDue} onChange={e => setDebtInvoiceAmountDue(Number(e.target.value))} className="mt-1 w-full border-gray-300 rounded p-1.5" required min="1"/></div>
                        <div className="lg:col-span-3"><label className="block text-sm font-medium">ملاحظات</label><input type="text" value={debtInvoiceNotes} onChange={e => setDebtInvoiceNotes(e.target.value)} className="mt-1 w-full border-gray-300 rounded p-1.5" /></div>
                        <div className="flex items-end"><button type="submit" className="w-full bg-teal-600 text-white px-4 py-1.5 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-700"><Save size={20} /><span>حفظ الدين</span></button></div>
                    </div>
                </form>
                 <div className="mt-8">
                    <h4 className="font-bold text-gray-700 mb-2">الديون المسجلة</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {state.openingDebtInvoices.map(inv => (<div key={inv.id} className="bg-white p-2 rounded border flex justify-between items-center text-sm"><div><span className="font-semibold">{state.suppliers.find(s=>s.id === inv.supplierId)?.name}</span> - فاتورة {inv.oldInvoiceNumber}</div><div className="flex items-center gap-4"><span className="font-bold text-red-600">{formatCurrency(inv.amountDue)}</span><button onClick={() => handleDeleteDebtInvoice(inv.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></div></div>))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const AnnualInventoryCount: React.FC = () => {
    const { state, dispatch } = useInventory();
    const [notes, setNotes] = useState('');

    const totalStockValue = useMemo(() => {
        return state.products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
    }, [state.products]);

    const handlePerformCount = useCallback(() => {
        const confirmation = window.prompt("هذه عملية خطيرة وستقوم بتصفير كميات جميع المواد في المخزون. للتأكيد، يرجى كتابة 'تأكيد' في المربع أدناه.");
        if (confirmation === 'تأكيد') {
            dispatch({ type: 'PERFORM_ANNUAL_INVENTORY_COUNT', payload: { notes } });
            alert('تمت عملية الجرد وتصفير المخزون بنجاح!');
            setNotes('');
        } else {
            alert('تم إلغاء عملية الجرد.');
        }
    }, [dispatch, notes]);

    return (
        <div className="p-6 border rounded-lg bg-yellow-50">
            <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2"><AlertTriangle size={24} /> إجراء الجرد السنوي وتصفير المخزون</h3>
            <div className="space-y-4">
                <p className="text-sm text-gray-700">
                    هذا الإجراء سيقوم بتسجيل تقرير بالحالة الحالية للمخزون (الكميات والقيم) ثم سيقوم بتصفير كمية جميع المواد إلى <strong>صفر</strong>.
                    هذه العملية لا يمكن التراجع عنها وتستخدم عادةً في نهاية السنة المالية للبدء من جديد.
                </p>
                <p className="font-bold">القيمة الإجمالية للمخزون الحالي: {formatCurrency(totalStockValue)}</p>
                <div>
                    <label htmlFor="countNotes" className="block text-sm font-medium text-gray-700">ملاحظات (اختياري)</label>
                    <input
                        type="text"
                        id="countNotes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1 block w-full md:w-1/2 border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="مثال: جرد نهاية عام 2024"
                    />
                </div>
                <div className="pt-4">
                    <button
                        onClick={handlePerformCount}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 shadow-sm"
                    >
                        <ClipboardList size={20} />
                        <span>بدء عملية الجرد وتصفير المخزون</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const PrinterSettingsForm: React.FC = () => {
    const { state, dispatch } = useInventory();
    
    const handlePrinterTypeChange = (type: 'a4' | 'thermal') => {
        const updatedCompanyInfo: CompanyInfo = {
            ...state.companyInfo,
            printerSettings: {
                type: type,
            }
        };
        dispatch({ type: 'UPDATE_COMPANY_INFO', payload: updatedCompanyInfo });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-800">نوع طابعة الفواتير (نقطة البيع)</h3>
                <p className="text-sm text-gray-500 mt-1">اختر نوع الطابعة المستخدمة لطباعة فواتير نقطة البيع (POS). سيؤثر هذا على تنسيق الفاتورة المطبوعة.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${state.companyInfo.printerSettings.type === 'a4' ? 'bg-teal-50 border-teal-500' : 'bg-white border-gray-200'}`}>
                    <input
                        type="radio"
                        name="printerType"
                        value="a4"
                        checked={state.companyInfo.printerSettings.type === 'a4'}
                        onChange={() => handlePrinterTypeChange('a4')}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                    />
                    <div>
                        <span className="font-bold text-gray-800">طابعة عادية (A4)</span>
                        <p className="text-sm text-gray-600">للطباعة على ورق بحجم A4 القياسي.</p>
                    </div>
                </label>
                 <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${state.companyInfo.printerSettings.type === 'thermal' ? 'bg-teal-50 border-teal-500' : 'bg-white border-gray-200'}`}>
                    <input
                        type="radio"
                        name="printerType"
                        value="thermal"
                        checked={state.companyInfo.printerSettings.type === 'thermal'}
                        onChange={() => handlePrinterTypeChange('thermal')}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                    />
                     <div>
                        <span className="font-bold text-gray-800">طابعة حرارية (80mm)</span>
                        <p className="text-sm text-gray-600">للطباعة على رولات الفواتير الحرارية الصغيرة.</p>
                    </div>
                </label>
            </div>
             <div className="flex justify-end pt-4 border-t">
                 <p className="text-sm text-gray-500">يتم الحفظ تلقائياً عند تغيير الخيار.</p>
            </div>
        </div>
    );
};

type AdminTab = 'company' | 'data' | 'users' | 'openingBalances' | 'annualCount' | 'printer';

const Admin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('company');

     const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
        { id: 'company', label: 'بيانات الصيدلية', icon: Building },
        { id: 'data', label: 'إدارة البيانات', icon: DatabaseBackup },
        { id: 'users', label: 'المستخدمين', icon: UsersIcon },
        { id: 'openingBalances', label: 'أرصدة أول المدة', icon: Wallet },
        { id: 'annualCount', label: 'الجرد السنوي', icon: ClipboardList },
        { id: 'printer', label: 'إعدادات الطابعة', icon: Printer },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'company': return <CompanyInfoForm />;
            case 'data': return <DataManagement />;
            case 'users': return <UserManagement />;
            case 'openingBalances': return <OpeningBalances />;
            case 'annualCount': return <AnnualInventoryCount />;
            case 'printer': return <PrinterSettingsForm />;
            default: return null;
        }
    };

  return (
    <div className="space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-6">
            <div className="flex items-center gap-4 border-b pb-4"><Settings size={32} className="text-teal-600" /><h1 className="text-2xl font-bold text-gray-800">إعدادات النظام</h1></div>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-4 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors flex-shrink-0`}><tab.icon className="ml-2 h-5 w-5" /><span>{tab.label}</span></button>))}
                </nav>
            </div>
            <div className="pt-4">{renderContent()}</div>
        </div>
    </div>
  );
};

export default Admin;