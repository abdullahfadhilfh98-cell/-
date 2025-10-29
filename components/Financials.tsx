import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { SupplierPayment, CustomerReceipt, Expense, CompanyInfo, Supplier } from '../types';
import SearchableSupplierInput from './common/SearchableSupplierInput';
import { DollarSign, Save, Trash2, ArrowUpCircle, ArrowDownCircle, ListChecks, ReceiptText, Printer } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];
type FinancialsTab = 'payment' | 'receipt' | 'debts' | 'expenses';

// Common utility functions
const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' });

// Printable Components
const PrintablePaymentVoucher: React.FC<{ payment: SupplierPayment, companyInfo: CompanyInfo, supplier?: Supplier }> = ({ payment, companyInfo, supplier }) => (
    <div className="printable-area p-8 font-sans text-sm" dir="rtl">
        <div className="text-center mb-6"><h1 className="text-2xl font-bold">{companyInfo.name}</h1><p>{companyInfo.address} - {companyInfo.phone}</p><h2 className="text-xl font-bold mt-4 border-y-2 py-1">سند دفع</h2></div>
        <div className="flex justify-between mb-4"><span>الرقم: {payment.id.slice(-6)}</span><span>التاريخ: {formatDate(payment.date)}</span></div>
        <div className="border p-4 rounded-md space-y-2">
            <p><strong>تم دفع إلى السيد/الشركة:</strong> {supplier?.name || 'مورد غير محدد'}</p>
            <p><strong>مبلغ وقدره:</strong> {formatCurrency(payment.amount)}</p>
            <p><strong>خصم مكتسب:</strong> {formatCurrency(payment.discount || 0)}</p>
            <p><strong>وذلك عن:</strong> {payment.notes || 'دفعة من الحساب'}</p>
        </div>
        <div className="flex justify-around mt-12 pt-8">
            <div className="text-center"><p className="border-t pt-2">المستلم</p></div>
            <div className="text-center"><p className="border-t pt-2">المحاسب</p></div>
        </div>
    </div>
);

const PrintableReceiptVoucher: React.FC<{ receipt: CustomerReceipt, companyInfo: CompanyInfo }> = ({ receipt, companyInfo }) => (
    <div className="printable-area p-8 font-sans text-sm" dir="rtl">
        <div className="text-center mb-6"><h1 className="text-2xl font-bold">{companyInfo.name}</h1><p>{companyInfo.address} - {companyInfo.phone}</p><h2 className="text-xl font-bold mt-4 border-y-2 py-1">سند قبض</h2></div>
        <div className="flex justify-between mb-4"><span>الرقم: {receipt.id.slice(-6)}</span><span>التاريخ: {formatDate(receipt.date)}</span></div>
        <div className="border p-4 rounded-md space-y-2">
            <p><strong>استلمنا من السيد/الشركة:</strong> {receipt.customerName}</p>
            <p><strong>مبلغ وقدره:</strong> {formatCurrency(receipt.amount)}</p>
            <p><strong>وذلك عن:</strong> {receipt.notes || 'دفعة للحساب'}</p>
        </div>
        <div className="flex justify-around mt-12 pt-8">
            <div className="text-center"><p className="border-t pt-2">الدافع</p></div>
            <div className="text-center"><p className="border-t pt-2">المستلم</p></div>
        </div>
    </div>
);

const PrintableExpenseVoucher: React.FC<{ expense: Expense, companyInfo: CompanyInfo }> = ({ expense, companyInfo }) => (
     <div className="printable-area p-8 font-sans text-sm" dir="rtl">
        <div className="text-center mb-6"><h1 className="text-2xl font-bold">{companyInfo.name}</h1><p>{companyInfo.address} - {companyInfo.phone}</p><h2 className="text-xl font-bold mt-4 border-y-2 py-1">سند صرف</h2></div>
        <div className="flex justify-between mb-4"><span>الرقم: {expense.id.slice(-6)}</span><span>التاريخ: {formatDate(expense.date)}</span></div>
        <div className="border p-4 rounded-md space-y-2">
            <p><strong>تم صرف مبلغ وقدره:</strong> {formatCurrency(expense.amount)}</p>
            <p><strong>وذلك عن:</strong> ({expense.category}) - {expense.description}</p>
        </div>
        <div className="flex justify-around mt-12 pt-8">
            <div className="text-center"><p className="border-t pt-2">المستلم</p></div>
            <div className="text-center"><p className="border-t pt-2">المحاسب</p></div>
        </div>
    </div>
);


const SupplierPayments: React.FC<{ setPaymentToPrint: (p: SupplierPayment) => void }> = ({ setPaymentToPrint }) => {
  const { state, dispatch } = useInventory();
  const initialFormState = { supplierId: '', amount: 0, discount: 0, date: today, paymentMethod: 'cash' as 'cash' | 'bank' | 'cheque', notes: '' };
  const [formData, setFormData] = useState(initialFormState);
  const [selectedInvoices, setSelectedInvoices] = useState<Record<string, boolean>>({});
  const selectedSupplier = useMemo(() => state.suppliers.find(s => s.id === formData.supplierId), [formData.supplierId, state.suppliers]);
  const unpaidInvoices = useMemo(() => { if (!formData.supplierId) return []; return state.purchases.filter(p => p.supplierId === formData.supplierId && p.amountDue > 0).sort((a,b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()); }, [formData.supplierId, state.purchases]);
  useEffect(() => { const totalToPay = unpaidInvoices.filter(invoice => selectedInvoices[invoice.id]).reduce((sum, invoice) => sum + invoice.amountDue, 0); setFormData(f => ({ ...f, amount: totalToPay })); }, [selectedInvoices, unpaidInvoices]);
  const handleInvoiceSelectionChange = (invoiceId: string) => setSelectedInvoices(prev => ({ ...prev, [invoiceId]: !prev[invoiceId] }));
  const resetForm = () => { setFormData(initialFormState); setSelectedInvoices({}); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.supplierId || formData.amount < 0) { alert('يرجى اختيار المورد وإدخال مبلغ صحيح.'); return; } const totalDeduction = formData.amount + (formData.discount || 0); if(totalDeduction <= 0){ alert('يجب أن يكون إجمالي المبلغ المدفوع أو الخصم أكبر من صفر.'); return; } if (selectedSupplier && totalDeduction > selectedSupplier.balance && Object.keys(selectedInvoices).length === 0) { if (!window.confirm(`إجمالي الخصم (الدفع + الخصم = ${formatCurrency(totalDeduction)}) أكبر من رصيد المورد (${formatCurrency(selectedSupplier.balance)}). هل تريد المتابعة؟`)) { return; } } const invoicePayments = Object.keys(selectedInvoices).filter(id => selectedInvoices[id]).map(id => ({ invoiceId: id, paidAmount: unpaidInvoices.find(inv => inv.id === id)!.amountDue })); const newPayment: SupplierPayment = { id: new Date().toISOString(), ...formData, discount: formData.discount || 0, invoicePayments: invoicePayments.length > 0 ? invoicePayments : undefined }; dispatch({ type: 'ADD_SUPPLIER_PAYMENT', payload: newPayment }); alert('تم حفظ سند الدفع بنجاح!'); resetForm(); };
  const handleDelete = (paymentId: string) => { if (window.confirm('هل أنت متأكد من حذف سند الدفع هذا؟')) { dispatch({ type: 'DELETE_SUPPLIER_PAYMENT', payload: paymentId }); } };
  const sortedPayments = useMemo(() => [...state.supplierPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [state.supplierPayments]);
  return (<div className="space-y-8"><form onSubmit={handleSubmit} className="space-y-4 no-print"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"><div className="lg:col-span-2"><label className="block text-sm font-medium text-gray-700">اختر المورد</label><SearchableSupplierInput suppliers={state.suppliers} value={formData.supplierId} onChange={(id) => { setFormData(f => ({...f, supplierId: id, discount: 0})); setSelectedInvoices({}); }} required /></div><div><label className="block text-sm font-medium text-gray-700">المبلغ المدفوع</label><input type="number" value={formData.amount} onChange={(e) => setFormData(f => ({...f, amount: Number(e.target.value)}))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 read-only:bg-gray-200" required min="0" readOnly={Object.values(selectedInvoices).some(v => v)} /></div><div><label className="block text-sm font-medium text-gray-700">خصم مكتسب</label><input type="number" value={formData.discount} onChange={(e) => setFormData(f => ({...f, discount: Number(e.target.value)}))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min="0" /></div><div><label className="block text-sm font-medium text-gray-700">تاريخ الدفع</label><input type="date" value={formData.date} onChange={(e) => setFormData(f => ({...f, date: e.target.value}))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required /></div></div>{unpaidInvoices.length > 0 && (<div className="col-span-full border-t pt-4 mt-4"><h3 className="text-lg font-medium text-gray-800 mb-2">تسديد فواتير المورد</h3><div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-gray-50">{unpaidInvoices.map(invoice => (<div key={invoice.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-100"><label htmlFor={`invoice-${invoice.id}`} className="flex items-center gap-3 cursor-pointer w-full"><input type="checkbox" id={`invoice-${invoice.id}`} checked={!!selectedInvoices[invoice.id]} onChange={() => handleInvoiceSelectionChange(invoice.id)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" /><div className="flex-grow flex justify-between"><div><span className="font-medium text-gray-700">فاتورة رقم: {invoice.invoiceNumber}</span><span className="text-sm text-gray-500 mx-2">({new Date(invoice.invoiceDate).toLocaleDateString('ar-IQ')})</span></div><span className="font-semibold text-red-600">{formatCurrency(invoice.amountDue)}</span></div></label></div>))}</div></div>)}{<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><div><label className="block text-sm font-medium text-gray-700">ملاحظات</label><textarea value={formData.notes} onChange={(e) => setFormData(f => ({...f, notes: e.target.value}))} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea><div className="mt-2"><label className="block text-sm font-medium text-gray-700">طريقة الدفع</label><select value={formData.paymentMethod} onChange={(e) => setFormData(f => ({...f, paymentMethod: e.target.value as any}))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"><option value="cash">نقدي</option><option value="bank">تحويل بنكي</option><option value="cheque">صك</option></select></div></div>{selectedSupplier && (<div className="bg-yellow-50 p-4 rounded-lg flex flex-col justify-center items-center"><p className="text-sm text-gray-600">الرصيد الحالي للمورد</p><p className="text-2xl font-bold text-red-600">{formatCurrency(selectedSupplier.balance)}</p><p className="text-sm text-gray-600 mt-2">الرصيد بعد الدفع: <span className="font-bold text-green-700"> {formatCurrency(selectedSupplier.balance - (formData.amount + (formData.discount || 0)))}</span></p></div>)}</div>}<div className="flex justify-end pt-4 border-t"><button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><Save size={20} /><span>حفظ السند</span></button></div></form><div className="border-t pt-6 mt-6"><h2 className="text-xl font-bold text-gray-800 mb-4">سجل سندات الدفع</h2><div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">التاريخ</th><th className="px-6 py-3">اسم المورد</th><th className="px-6 py-3">المبلغ المدفوع</th><th className="px-6 py-3">الخصم</th><th className="px-6 py-3 no-print">إجراءات</th></tr></thead><tbody>{sortedPayments.map(payment => { const supplier = state.suppliers.find(s => s.id === payment.supplierId); return (<tr key={payment.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4">{new Date(payment.date).toLocaleDateString('ar-IQ')}</td><td className="px-6 py-4 font-medium">{supplier?.name || 'مورد محذوف'}</td><td className="px-6 py-4 font-bold text-green-600">{formatCurrency(payment.amount)}</td><td className="px-6 py-4 font-bold text-blue-600">{formatCurrency(payment.discount || 0)}</td><td className="px-6 py-4 flex items-center gap-2 no-print"><button onClick={() => setPaymentToPrint(payment)} className="text-gray-500 hover:text-blue-600"><Printer size={18} /></button><button onClick={() => handleDelete(payment.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></td></tr>); })}</tbody></table></div></div></div>);
};

const CustomerReceipts: React.FC<{ setReceiptToPrint: (r: CustomerReceipt) => void }> = ({ setReceiptToPrint }) => {
  const { state, dispatch } = useInventory();
  const initialFormState: Omit<CustomerReceipt, 'id'> = { customerName: '', amount: 0, date: today, paymentMethod: 'cash', notes: '' };
  const [formData, setFormData] = useState(initialFormState);
  const resetForm = () => setFormData(initialFormState);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.customerName || formData.amount <= 0) { alert('يرجى إدخال اسم العميل ومبلغ صحيح.'); return; } const newReceipt: CustomerReceipt = { ...formData, id: new Date().toISOString() }; dispatch({ type: 'ADD_CUSTOMER_RECEIPT', payload: newReceipt }); alert('تم حفظ سند القبض بنجاح!'); resetForm(); };
  const handleDelete = (receiptId: string) => { if (window.confirm('هل أنت متأكد من حذف سند القبض هذا؟')) { dispatch({ type: 'DELETE_CUSTOMER_RECEIPT', payload: receiptId }); } };
  const sortedReceipts = useMemo(() => [...state.customerReceipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [state.customerReceipts]);
  return (<div className="space-y-8"><form onSubmit={handleSubmit} className="space-y-4 no-print"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div><label className="block text-sm font-medium text-gray-700">اسم العميل/الدافع</label><input type="text" value={formData.customerName} onChange={e => setFormData(f=>({...f, customerName: e.target.value}))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required /></div><div><label className="block text-sm font-medium text-gray-700">المبلغ المقبوض</label><input type="number" value={formData.amount} onChange={e => setFormData(f=>({...f, amount: Number(e.target.value)}))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required min="1" /></div><div><label className="block text-sm font-medium text-gray-700">تاريخ القبض</label><input type="date" value={formData.date} onChange={e => setFormData(f=>({...f, date: e.target.value}))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required /></div><div><label className="block text-sm font-medium text-gray-700">طريقة الدفع</label><select value={formData.paymentMethod} onChange={e => setFormData(f => ({...f, paymentMethod: e.target.value as any}))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"><option value="cash">نقدي</option><option value="bank">تحويل بنكي</option><option value="cheque">صك</option></select></div></div><div><label className="block text-sm font-medium text-gray-700">ملاحظات</label><textarea value={formData.notes} onChange={e => setFormData(f=>({...f, notes: e.target.value}))} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea></div><div className="flex justify-end pt-4 border-t"><button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><Save size={20} /><span>حفظ السند</span></button></div></form><div className="border-t pt-6 mt-6"><h2 className="text-xl font-bold text-gray-800 mb-4">سجل سندات القبض</h2><div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">التاريخ</th><th className="px-6 py-3">اسم العميل/الدافع</th><th className="px-6 py-3">المبلغ</th><th className="px-6 py-3 no-print">إجراءات</th></tr></thead><tbody>{sortedReceipts.map(receipt => (<tr key={receipt.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4">{new Date(receipt.date).toLocaleDateString('ar-IQ')}</td><td className="px-6 py-4 font-medium">{receipt.customerName}</td><td className="px-6 py-4 font-bold text-green-600">{formatCurrency(receipt.amount)}</td><td className="px-6 py-4 flex items-center gap-2 no-print"><button onClick={() => setReceiptToPrint(receipt)} className="text-gray-500 hover:text-blue-600"><Printer size={18} /></button><button onClick={() => handleDelete(receipt.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div></div></div>);
};

const SupplierDebts: React.FC = () => {
    const { state } = useInventory();
    const suppliersWithDebt = useMemo(() => state.suppliers.filter(s => s.balance > 0).sort((a,b) => b.balance - a.balance), [state.suppliers]);
    const totalDebt = useMemo(() => suppliersWithDebt.reduce((sum, s) => sum + s.balance, 0), [suppliersWithDebt]);
    return(<div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">اسم المورد</th><th className="px-6 py-3">رقم الهاتف</th><th className="px-6 py-3">الرصيد (الدين)</th></tr></thead><tbody>{suppliersWithDebt.map(supplier => (<tr key={supplier.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4 font-medium text-gray-900">{supplier.name}</td><td className="px-6 py-4">{supplier.phone}</td><td className="px-6 py-4 font-semibold text-red-600">{formatCurrency(supplier.balance)}</td></tr>))}</tbody><tfoot className="bg-gray-100 font-bold"><tr><td colSpan={2} className="px-6 py-3 text-lg">الإجمالي</td><td className="px-6 py-3 text-lg text-red-700">{formatCurrency(totalDebt)}</td></tr></tfoot></table></div>);
};

const Expenses: React.FC<{ setExpenseToPrint: (e: Expense) => void }> = ({ setExpenseToPrint }) => {
  const { state, dispatch } = useInventory();
  const initialFormState: Omit<Expense, 'id'> = { date: today, category: state.expenseCategories[0] || 'نثريات', description: '', amount: 0, paymentMethod: 'cash' };
  const [formData, setFormData] = useState(initialFormState);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const resetForm = () => { setFormData(initialFormState); setShowNewCategoryInput(false); setNewCategoryInput(''); }
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const value = e.target.value; if (value === 'add_new') { setShowNewCategoryInput(true); } else { setFormData(f => ({ ...f, category: value })); setShowNewCategoryInput(false); } };
  const handleAddNewCategory = () => { if (newCategoryInput.trim() === '') { alert('يرجى إدخال اسم فئة صحيح.'); return; } const trimmedCategory = newCategoryInput.trim(); if (state.expenseCategories.includes(trimmedCategory)) { alert('هذه الفئة موجودة بالفعل.'); return; } dispatch({ type: 'ADD_EXPENSE_CATEGORY', payload: trimmedCategory }); setFormData(f => ({ ...f, category: trimmedCategory })); setNewCategoryInput(''); setShowNewCategoryInput(false); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (formData.amount <= 0 || !formData.description.trim()) { alert('يرجى إدخال وصف ومبلغ صحيح للمصروف.'); return; } const newExpense: Expense = { ...formData, id: new Date().toISOString() }; dispatch({ type: 'ADD_EXPENSE', payload: newExpense }); alert('تم حفظ المصروف بنجاح!'); resetForm(); };
  const handleDelete = (expenseId: string) => { if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) { dispatch({ type: 'DELETE_EXPENSE', payload: expenseId }); } };
  const sortedExpenses = useMemo(() => [...state.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [state.expenses]);
  return (<div className="space-y-8"><form onSubmit={handleSubmit} className="space-y-4 no-print"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start"><div><label className="block text-sm font-medium text-gray-700">تاريخ المصروف</label><input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required /></div><div><label className="block text-sm font-medium text-gray-700">فئة المصروف</label><select value={showNewCategoryInput ? 'add_new' : formData.category} onChange={handleCategoryChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">{state.expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}<option value="add_new" className="font-bold text-teal-600">-- إضافة فئة جديدة --</option></select>{showNewCategoryInput && (<div className="mt-2 flex gap-2"><input type="text" value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="اسم الفئة الجديدة" autoFocus /><button type="button" onClick={handleAddNewCategory} className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm shrink-0 hover:bg-blue-600">إضافة</button></div>)}</div><div><label className="block text-sm font-medium text-gray-700">المبلغ</label><input type="number" value={formData.amount} onChange={e => setFormData(f => ({ ...f, amount: Number(e.target.value) }))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required min="1" /></div><div><label className="block text-sm font-medium text-gray-700">طريقة الدفع</label><select value={formData.paymentMethod} onChange={e => setFormData(f => ({ ...f, paymentMethod: e.target.value as any }))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"><option value="cash">نقدي</option><option value="bank">تحويل بنكي</option></select></div></div><div><label className="block text-sm font-medium text-gray-700">الوصف</label><textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="اكتب تفاصيل المصروف هنا..." required></textarea></div><div className="flex justify-end pt-4 border-t"><button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><Save size={20} /><span>حفظ المصروف</span></button></div></form><div className="border-t pt-6 mt-6"><h2 className="text-xl font-bold text-gray-800 mb-4">سجل المصاريف</h2><div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">التاريخ</th><th className="px-6 py-3">الفئة</th><th className="px-6 py-3">الوصف</th><th className="px-6 py-3">المبلغ</th><th className="px-6 py-3 no-print">إجراءات</th></tr></thead><tbody>{sortedExpenses.map(expense => (<tr key={expense.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('ar-IQ')}</td><td className="px-6 py-4 font-medium">{expense.category}</td><td className="px-6 py-4">{expense.description}</td><td className="px-6 py-4 font-bold text-red-600">{formatCurrency(expense.amount)}</td><td className="px-6 py-4 flex items-center gap-2 no-print"><button onClick={() => setExpenseToPrint(expense)} className="text-gray-500 hover:text-blue-600"><Printer size={18} /></button><button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div></div></div>);
}

const Financials: React.FC = () => {
  const { state } = useInventory();
  const [activeTab, setActiveTab] = useState<FinancialsTab>('payment');
  const [paymentToPrint, setPaymentToPrint] = useState<SupplierPayment | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<CustomerReceipt | null>(null);
  const [expenseToPrint, setExpenseToPrint] = useState<Expense | null>(null);

  useEffect(() => { if(paymentToPrint) { window.print(); setPaymentToPrint(null); }}, [paymentToPrint]);
  useEffect(() => { if(receiptToPrint) { window.print(); setReceiptToPrint(null); }}, [receiptToPrint]);
  useEffect(() => { if(expenseToPrint) { window.print(); setExpenseToPrint(null); }}, [expenseToPrint]);

  const tabs: { id: FinancialsTab; label: string; icon: React.ElementType }[] = [
    { id: 'payment', label: 'سندات الدفع', icon: ArrowUpCircle }, { id: 'receipt', label: 'سندات القبض', icon: ArrowDownCircle }, { id: 'expenses', label: 'المصاريف', icon: ReceiptText }, { id: 'debts', label: 'ديون الموردين', icon: ListChecks },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'payment': return <SupplierPayments setPaymentToPrint={setPaymentToPrint} />;
      case 'receipt': return <CustomerReceipts setReceiptToPrint={setReceiptToPrint} />;
      case 'expenses': return <Expenses setExpenseToPrint={setExpenseToPrint} />;
      case 'debts': return <SupplierDebts />;
      default: return null;
    }
  };

  return (
    <>
        {paymentToPrint && <PrintablePaymentVoucher payment={paymentToPrint} companyInfo={state.companyInfo} supplier={state.suppliers.find(s => s.id === paymentToPrint.supplierId)} />}
        {receiptToPrint && <PrintableReceiptVoucher receipt={receiptToPrint} companyInfo={state.companyInfo} />}
        {expenseToPrint && <PrintableExpenseVoucher expense={expenseToPrint} companyInfo={state.companyInfo} />}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-4"><DollarSign size={32} className="text-teal-600" /><h1 className="text-2xl font-bold text-gray-800">الإدارة المالية</h1></div>
                 <button onClick={() => window.print()} className="no-print bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                    <Printer size={18} />
                    <span>طباعة</span>
                </button>
            </div>
            <div className="border-b border-gray-200 no-print"><nav className="-mb-px flex gap-4 overflow-x-auto" aria-label="Tabs">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors flex-shrink-0`}><tab.icon className="ml-2 h-5 w-5" /><span>{tab.label}</span></button>))}</nav></div>
            <div className="pt-4">{renderContent()}</div>
        </div>
    </>
  );
};

export default Financials;