import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Sale, Purchase, Product, AnnualInventoryCount, Stocktake, CompanyInfo, SalesReturn, PurchaseReturn, Supplier } from '../types';
import { ChevronDown, ChevronUp, ShoppingCart, Archive, Package, BarChartHorizontal, ReceiptText, ClipboardList, ClipboardCheck, PackageX, Printer, Undo, Redo } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);
const lastMonthStr = lastMonth.toISOString().split('T')[0];

// Common utility functions
const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' });
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

// Printable Components
const PrintableSaleInvoice: React.FC<{ sale: Sale; companyInfo: CompanyInfo }> = ({ sale, companyInfo }) => (
    <div className="printable-area p-8 font-sans text-xs" dir="rtl">
        <div className="text-center mb-6">
            {companyInfo.logo && <img src={companyInfo.logo} alt="شعار الصيدلية" className="h-20 w-auto mx-auto mb-4" />}
            <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
            <p>{companyInfo.address}</p>
            <p>{companyInfo.phone}</p>
            <h2 className="text-xl font-bold mt-4 border-y-2 py-1">فاتورة بيع</h2>
        </div>
        <div className="border-t border-b py-2 mb-4 flex justify-between">
            <span>رقم الفاتورة: {sale.id.slice(-6)}</span>
            <span>التاريخ: {formatDateTime(sale.date)}</span>
        </div>
        <table className="w-full mb-4 text-xs">
            <thead><tr className="border-b"><th className="text-right py-2">المادة</th><th className="text-center py-2">الكمية</th><th className="text-center py-2">الوحدة</th><th className="text-center py-2">السعر</th><th className="text-left py-2">الإجمالي</th></tr></thead>
            <tbody>{sale.items.map(item => (<tr key={`${item.id}-${item.sellUnit}`} className="border-b"><td className="py-2">{item.name}</td><td className="text-center py-2">{item.quantity}</td><td className="text-center py-2">{item.sellUnit === 'packet' ? 'باكيت' : 'شريط'}</td><td className="text-center py-2">{formatCurrency(item.pricePerUnit)}</td><td className="text-left py-2">{formatCurrency(item.pricePerUnit * item.quantity)}</td></tr>))}</tbody>
        </table>
        <div className="w-1/2 ml-auto space-y-2">
            <div className="flex justify-between"><span>المجموع الفرعي:</span><span>{formatCurrency(sale.subtotal)}</span></div>
            <div className="flex justify-between"><span>الخصم:</span><span>{formatCurrency(sale.discount)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>الإجمالي المطلوب:</span><span>{formatCurrency(sale.total)}</span></div>
        </div>
        <div className="text-center mt-8 text-xs text-gray-600"><p>{companyInfo.footerNotes}</p></div>
    </div>
);

const PrintablePurchaseInvoice: React.FC<{ purchase: Purchase; companyInfo: CompanyInfo, supplier?: Supplier }> = ({ purchase, companyInfo, supplier }) => (
     <div className="printable-area p-8 font-sans text-xs" dir="rtl">
        <div className="text-center mb-6"><h2 className="text-xl font-bold mt-4 border-y-2 py-1">فاتورة شراء</h2></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div><p><strong>من:</strong> {supplier?.name || 'مورد غير محدد'}</p><p><strong>هاتف:</strong> {supplier?.phone}</p></div>
            <div className="text-left"><p><strong>رقم الفاتورة:</strong> {purchase.invoiceNumber}</p><p><strong>التاريخ:</strong> {formatDate(purchase.invoiceDate)}</p></div>
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

const PrintableSalesReturn: React.FC<{ salesReturn: SalesReturn; companyInfo: CompanyInfo }> = ({ salesReturn, companyInfo }) => (
    <div className="printable-area p-8 font-sans text-xs" dir="rtl">
        <div className="text-center mb-6">
             {companyInfo.logo && <img src={companyInfo.logo} alt="شعار الصيدلية" className="h-20 w-auto mx-auto mb-4" />}
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
        <div className="text-center mt-8 text-xs text-gray-600"><p>{salesReturn.notes}</p></div>
    </div>
);

const PrintablePurchaseReturn: React.FC<{ purchaseReturn: PurchaseReturn; companyInfo: CompanyInfo, supplier?: Supplier }> = ({ purchaseReturn, companyInfo, supplier }) => (
    <div className="printable-area p-8 font-sans text-xs" dir="rtl">
        <div className="text-center mb-6"><h2 className="text-xl font-bold mt-4 border-y-2 py-1">فاتورة إرجاع مشتريات</h2></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div><p><strong>إلى:</strong> {supplier?.name || 'مورد غير محدد'}</p></div>
            <div className="text-left"><p><strong>مرجع الفاتورة:</strong> {purchaseReturn.invoiceNumber}</p><p><strong>تاريخ الإرجاع:</strong> {formatDate(purchaseReturn.returnDate)}</p></div>
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

// Sales Report Component
const SalesReport: React.FC<{ setSaleToPrint: (sale: Sale) => void }> = ({ setSaleToPrint }) => {
    const { state } = useInventory();
    const [expandedSale, setExpandedSale] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(lastMonthStr);
    const [startTime, setStartTime] = useState('00:00');
    const [endDate, setEndDate] = useState(today);
    const [endTime, setEndTime] = useState('23:59');

    const filteredSales = useMemo(() => {
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        return state.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= start && saleDate <= end;
        });
    }, [state.sales, startDate, startTime, endDate, endTime]);
    
    const salesTotal = useMemo(() => filteredSales.reduce((acc, sale) => { acc.subtotal += sale.subtotal; acc.discount += sale.discount; acc.total += sale.total; return acc; }, { subtotal: 0, discount: 0, total: 0 }), [filteredSales]);
    const toggleSaleDetails = (saleId: string) => setExpandedSale(p => p === saleId ? null : saleId);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg no-print">
                <div><label className="text-sm font-medium text-gray-700">من تاريخ ووقت</label><div className="flex gap-2 mt-1"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2" /><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="border-gray-300 rounded-md shadow-sm p-2" /></div></div>
                <div><label className="text-sm font-medium text-gray-700">إلى تاريخ ووقت</label><div className="flex gap-2 mt-1"><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2" /><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border-gray-300 rounded-md shadow-sm p-2" /></div></div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 w-10 no-print"></th><th className="px-6 py-3">رقم الفاتورة</th><th className="px-6 py-3">التاريخ والوقت</th><th className="px-6 py-3">الصافي</th><th className="px-6 py-3 w-10 no-print">طباعة</th></tr></thead>
                    <tbody>
                        {filteredSales.map(sale => (
                            <React.Fragment key={sale.id}>
                                <tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>
                                    <td className="px-6 py-4 no-print">{expandedSale === sale.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                                    <td className="px-6 py-4 font-medium">{sale.id.slice(-6)}</td><td className="px-6 py-4">{formatDateTime(sale.date)}</td><td className="px-6 py-4 font-bold text-teal-600">{formatCurrency(sale.total)}</td>
                                    <td className="px-6 py-4 no-print"><button onClick={(e) => { e.stopPropagation(); setSaleToPrint(sale); }} className="text-gray-500 hover:text-blue-600 p-1"><Printer size={18} /></button></td>
                                </tr>
                                {expandedSale === sale.id && (<tr className="bg-gray-50 no-print"><td colSpan={5} className="p-4"><div className="p-4 bg-white rounded-md border"><h4 className="font-bold mb-2">تفاصيل الفاتورة:</h4><ul className="text-xs">{sale.items.map(item => (<li key={`${item.id}-${item.sellUnit}`} className="flex justify-between py-1 border-b last:border-b-0"><span>{item.name} ({item.sellUnit === 'packet' ? 'باكيت' : 'شريحة'}) (x{item.quantity})</span><span>{formatCurrency(item.pricePerUnit * item.quantity)}</span></li>))}</ul><div className="text-sm mt-2 pt-2 border-t font-semibold"><span>الخصم: {formatCurrency(sale.discount)}</span></div></div></td></tr>)}
                            </React.Fragment>
                        ))}
                    </tbody>
                     <tfoot className="bg-gray-100 font-bold"><tr><td colSpan={3} className="px-6 py-3 text-lg">الإجمالي</td><td className="px-6 py-3 text-lg text-teal-700">{formatCurrency(salesTotal.total)}</td><td className="no-print"></td></tr></tfoot>
                </table>
            </div>
        </div>
    );
};

// Purchases Report Component
const PurchasesReport: React.FC<{ setPurchaseToPrint: (purchase: Purchase) => void }> = ({ setPurchaseToPrint }) => {
    const { state } = useInventory();
    const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(lastMonthStr);
    const [endDate, setEndDate] = useState(today);

     const filteredPurchases = useMemo(() => state.purchases.filter(purchase => { const purchaseDate = new Date(purchase.invoiceDate); const start = new Date(startDate); const end = new Date(endDate); end.setHours(23, 59, 59, 999); return purchaseDate >= start && purchaseDate <= end; }), [state.purchases, startDate, endDate]);
    const purchasesTotal = useMemo(() => filteredPurchases.reduce((acc, p) => { acc.total += p.total; return acc; }, { total: 0 }), [filteredPurchases]);
    const togglePurchaseDetails = (purchaseId: string) => setExpandedPurchase(p => p === purchaseId ? null : purchaseId);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg no-print">
                <div><label className="text-sm font-medium text-gray-700">من تاريخ</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 mt-1" /></div>
                <div><label className="text-sm font-medium text-gray-700">إلى تاريخ</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 mt-1" /></div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 w-10 no-print"></th><th className="px-6 py-3">رقم الفاتورة</th><th className="px-6 py-3">المورد</th><th className="px-6 py-3">الإجمالي</th><th className="px-6 py-3 w-10 no-print">طباعة</th></tr></thead>
                    <tbody>
                        {filteredPurchases.map(p => {
                            const supplier = state.suppliers.find(s => s.id === p.supplierId);
                            return (
                                <React.Fragment key={p.id}>
                                    <tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => togglePurchaseDetails(p.id)}>
                                        <td className="px-6 py-4 no-print">{expandedPurchase === p.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                                        <td className="px-6 py-4 font-medium">{p.invoiceNumber}</td><td className="px-6 py-4">{supplier?.name || "غير معروف"}</td><td className="px-6 py-4 font-bold text-blue-600">{formatCurrency(p.total)}</td>
                                        <td className="px-6 py-4 no-print"><button onClick={(e) => { e.stopPropagation(); setPurchaseToPrint(p); }} className="text-gray-500 hover:text-blue-600 p-1"><Printer size={18} /></button></td>
                                    </tr>
                                    {expandedPurchase === p.id && (<tr className="bg-gray-50 no-print"><td colSpan={5} className="p-4"><div className="p-4 bg-white rounded-md border"><h4 className="font-bold mb-2">تفاصيل الفاتورة:</h4><ul className="text-xs">{p.items.map((item, idx) => (<li key={idx} className="flex justify-between py-1 border-b last:border-b-0"><span>{item.name} (x{item.quantity})</span><span>{formatCurrency(item.itemTotal)}</span></li>))}</ul></div></td></tr>)}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                     <tfoot className="bg-gray-100 font-bold"><tr><td colSpan={3} className="px-6 py-3 text-lg">الإجمالي</td><td className="px-6 py-3 text-lg text-blue-700">{formatCurrency(purchasesTotal.total)}</td><td className="no-print"></td></tr></tfoot>
                </table>
            </div>
        </div>
    );
};

const SalesReturnsReport: React.FC<{ setSalesReturnToPrint: (sr: SalesReturn) => void }> = ({ setSalesReturnToPrint }) => {
    const { state } = useInventory();
    const [expandedReturn, setExpandedReturn] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(lastMonthStr);
    const [endDate, setEndDate] = useState(today);

    const filteredReturns = useMemo(() => state.salesReturns.filter(sr => { const d = new Date(sr.date); const start = new Date(startDate); const end = new Date(endDate); end.setHours(23, 59, 59, 999); return d >= start && d <= end; }), [state.salesReturns, startDate, endDate]);
    const returnsTotal = useMemo(() => filteredReturns.reduce((sum, sr) => sum + sr.totalReturnValue, 0), [filteredReturns]);
    const toggleDetails = (id: string) => setExpandedReturn(p => p === id ? null : id);

    return (
        <div className="space-y-4">
             <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg no-print">
                <div><label className="text-sm font-medium text-gray-700">من تاريخ</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 mt-1" /></div>
                <div><label className="text-sm font-medium text-gray-700">إلى تاريخ</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 mt-1" /></div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 w-10 no-print"></th><th className="px-6 py-3">رقم المرجع</th><th className="px-6 py-3">التاريخ</th><th className="px-6 py-3">إجمالي القيمة</th><th className="px-6 py-3 w-10 no-print">طباعة</th></tr></thead>
                    <tbody>
                        {filteredReturns.map(sr => (
                            <React.Fragment key={sr.id}>
                                <tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleDetails(sr.id)}>
                                    <td className="px-6 py-4 no-print">{expandedReturn === sr.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</td>
                                    <td className="px-6 py-4 font-medium">{sr.id.slice(-6)}</td><td className="px-6 py-4">{formatDateTime(sr.date)}</td><td className="px-6 py-4 font-bold text-red-600">{formatCurrency(sr.totalReturnValue)}</td>
                                    <td className="px-6 py-4 no-print"><button onClick={(e) => { e.stopPropagation(); setSalesReturnToPrint(sr); }} className="text-gray-500 hover:text-blue-600 p-1"><Printer size={18} /></button></td>
                                </tr>
                                {expandedReturn === sr.id && (<tr className="bg-gray-50 no-print"><td colSpan={5} className="p-4"><div className="p-4 bg-white rounded-md border"><h4 className="font-bold mb-2">تفاصيل الإرجاع:</h4><ul className="text-xs">{sr.items.map(item => (<li key={`${item.id}-${item.returnUnit}`} className="flex justify-between py-1 border-b last:border-b-0"><span>{item.name} ({item.returnUnit === 'packet' ? 'باكيت' : 'شريحة'}) (x{item.quantity})</span><span>{formatCurrency(item.pricePerUnit * item.quantity)}</span></li>))}</ul></div></td></tr>)}
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold"><tr><td colSpan={3} className="px-6 py-3 text-lg">الإجمالي</td><td className="px-6 py-3 text-lg text-red-700">{formatCurrency(returnsTotal)}</td><td className="no-print"></td></tr></tfoot>
                </table>
            </div>
        </div>
    );
};

const PurchaseReturnsReport: React.FC<{ setPurchaseReturnToPrint: (pr: PurchaseReturn) => void }> = ({ setPurchaseReturnToPrint }) => {
    const { state } = useInventory();
    const [expandedReturn, setExpandedReturn] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(lastMonthStr);
    const [endDate, setEndDate] = useState(today);

    const filteredReturns = useMemo(() => state.purchaseReturns.filter(pr => { const d = new Date(pr.returnDate); const start = new Date(startDate); const end = new Date(endDate); end.setHours(23, 59, 59, 999); return d >= start && d <= end; }), [state.purchaseReturns, startDate, endDate]);
    const returnsTotal = useMemo(() => filteredReturns.reduce((sum, pr) => sum + pr.totalReturnValue, 0), [filteredReturns]);
    const toggleDetails = (id: string) => setExpandedReturn(p => p === id ? null : id);

    return (
         <div className="space-y-4">
             <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg no-print">
                <div><label className="text-sm font-medium text-gray-700">من تاريخ</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 mt-1" /></div>
                <div><label className="text-sm font-medium text-gray-700">إلى تاريخ</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 mt-1" /></div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 w-10 no-print"></th><th className="px-6 py-3">التاريخ</th><th className="px-6 py-3">المورد</th><th className="px-6 py-3">إجمالي القيمة</th><th className="px-6 py-3 w-10 no-print">طباعة</th></tr></thead>
                    <tbody>
                        {filteredReturns.map(pr => {
                            const supplier = state.suppliers.find(s => s.id === pr.supplierId);
                            return (
                                <React.Fragment key={pr.id}>
                                    <tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleDetails(pr.id)}>
                                        <td className="px-6 py-4 no-print">{expandedReturn === pr.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</td>
                                        <td className="px-6 py-4">{formatDate(pr.returnDate)}</td><td className="px-6 py-4">{supplier?.name}</td><td className="px-6 py-4 font-bold text-red-600">{formatCurrency(pr.totalReturnValue)}</td>
                                        <td className="px-6 py-4 no-print"><button onClick={(e) => { e.stopPropagation(); setPurchaseReturnToPrint(pr); }} className="text-gray-500 hover:text-blue-600 p-1"><Printer size={18} /></button></td>
                                    </tr>
                                    {expandedReturn === pr.id && (<tr className="bg-gray-50 no-print"><td colSpan={5} className="p-4"><div className="p-4 bg-white rounded-md border"><h4 className="font-bold mb-2">تفاصيل الإرجاع:</h4><ul className="text-xs">{pr.items.map((item, idx) => (<li key={idx} className="flex justify-between py-1 border-b last:border-b-0"><span>{item.name} (x{item.quantity})</span><span>{formatCurrency(item.itemTotal)}</span></li>))}</ul></div></td></tr>)}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                     <tfoot className="bg-gray-100 font-bold"><tr><td colSpan={3} className="px-6 py-3 text-lg">الإجمالي</td><td className="px-6 py-3 text-lg text-red-700">{formatCurrency(returnsTotal)}</td><td className="no-print"></td></tr></tfoot>
                </table>
            </div>
        </div>
    );
};

const InventoryReport: React.FC = () => {
    const { state } = useInventory();
    const inventoryTotals = useMemo(() => state.products.reduce((acc, p) => { acc.totalCostValue += p.stock * p.costPrice; acc.totalSellValue += p.stock * p.packetSellPrice; return acc; }, { totalCostValue: 0, totalSellValue: 0 }), [state.products]);
    return(<div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">المادة</th><th className="px-6 py-3">الكمية (باكيت)</th><th className="px-6 py-3">كلفة الباكيت</th><th className="px-6 py-3">إجمالي الكلفة</th><th className="px-6 py-3">سعر بيع الباكيت</th><th className="px-6 py-3">إجمالي سعر البيع</th></tr></thead><tbody>{state.products.map(p => (<tr key={p.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4 font-medium text-gray-900">{p.name}</td><td className="px-6 py-4">{p.stock.toFixed(2)}</td><td className="px-6 py-4">{formatCurrency(p.costPrice)}</td><td className="px-6 py-4 font-semibold text-red-600">{formatCurrency(p.stock * p.costPrice)}</td><td className="px-6 py-4">{formatCurrency(p.packetSellPrice)}</td><td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(p.stock * p.packetSellPrice)}</td></tr>))}</tbody><tfoot className="bg-gray-100 font-bold"><tr><td colSpan={3} className="px-6 py-3 text-lg">الإجمالي</td><td className="px-6 py-3 text-lg text-red-700">{formatCurrency(inventoryTotals.totalCostValue)}</td><td></td><td className="px-6 py-3 text-lg text-green-700">{formatCurrency(inventoryTotals.totalSellValue)}</td></tr></tfoot></table></div>);
};

const ExpensesReport: React.FC = () => {
    const { state } = useInventory();
    const [startDate, setStartDate] = useState(lastMonthStr);
    const [endDate, setEndDate] = useState(today);
    const filteredExpenses = useMemo(() => state.expenses.filter(expense => { const expenseDate = new Date(expense.date); const start = new Date(startDate); const end = new Date(endDate); end.setHours(23, 59, 59, 999); return expenseDate >= start && expenseDate <= end; }), [state.expenses, startDate, endDate]);
    const expensesTotal = useMemo(() => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0), [filteredExpenses]);
    const expensesByCategory = useMemo(() => { const categoryMap: Record<string, number> = {}; filteredExpenses.forEach(expense => { categoryMap[expense.category] = (categoryMap[expense.category] || 0) + expense.amount; }); return Object.entries(categoryMap).sort(([, a], [, b]) => b - a); }, [filteredExpenses]);
    return (<div className="space-y-4"><div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg no-print"><div><label className="text-sm font-medium text-gray-700">من تاريخ</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 mt-1" /></div><div><label className="text-sm font-medium text-gray-700">إلى تاريخ</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 mt-1" /></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="md:col-span-2 overflow-x-auto"><h3 className="text-lg font-bold text-gray-800 mb-2">تفاصيل المصاريف</h3><table className="w-full text-sm text-right text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">التاريخ</th><th className="px-6 py-3">الفئة</th><th className="px-6 py-3">الوصف</th><th className="px-6 py-3">المبلغ</th></tr></thead><tbody>{filteredExpenses.map(expense => (<tr key={expense.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4">{formatDate(expense.date)}</td><td className="px-6 py-4 font-medium">{expense.category}</td><td className="px-6 py-4">{expense.description}</td><td className="px-6 py-4 font-bold text-red-600">{formatCurrency(expense.amount)}</td></tr>))}</tbody><tfoot className="bg-gray-100 font-bold"><tr><td colSpan={3} className="px-6 py-3 text-lg">الإجمالي</td><td className="px-6 py-3 text-lg text-red-700">{formatCurrency(expensesTotal)}</td></tr></tfoot></table></div><div><h3 className="text-lg font-bold text-gray-800 mb-2">ملخص حسب الفئة</h3><div className="bg-gray-50 p-4 rounded-lg space-y-2">{expensesByCategory.map(([category, total]) => (<div key={category} className="flex justify-between items-center text-sm"><span className="font-medium text-gray-700">{category}</span><span className="font-bold text-gray-800">{formatCurrency(total)}</span></div>))}{expensesByCategory.length > 0 && <div className="border-t my-2"></div>}<div className="flex justify-between items-center font-bold"><span className="text-gray-700">الإجمالي</span><span className="text-red-600">{formatCurrency(expensesTotal)}</span></div></div></div></div></div>);
};

const StockAdjustmentsReport: React.FC = () => {
    const { state } = useInventory();
    const [expandedAdjustment, setExpandedAdjustment] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(lastMonthStr);
    const [endDate, setEndDate] = useState(today);
    const filteredAdjustments = useMemo(() => state.stockAdjustments.filter(adj => { const adjDate = new Date(adj.date); const start = new Date(startDate); const end = new Date(endDate); end.setHours(23, 59, 59, 999); return adjDate >= start && adjDate <= end; }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [state.stockAdjustments, startDate, endDate]);
    const adjustmentsTotal = useMemo(() => filteredAdjustments.reduce((sum, adj) => sum + adj.totalLossValue, 0), [filteredAdjustments]);
    const toggleDetails = (id: string) => setExpandedAdjustment(p => p === id ? null : id);
    const reasonMap: Record<string, string> = { 'damage': 'تلف', 'expiry': 'إكسباير', 'correction': 'تصحيح', 'theft': 'سرقة', 'other': 'آخر', 'stocktake_gain': 'زيادة بالجرد', 'stocktake_loss': 'نقص بالجرد' };
    return (<div className="space-y-4"><div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg no-print"><div><label className="text-sm font-medium text-gray-700">من تاريخ</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 mt-1" /></div><div><label className="text-sm font-medium text-gray-700">إلى تاريخ</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 mt-1" /></div></div><div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 w-10 no-print"></th><th className="px-6 py-3">التاريخ</th><th className="px-6 py-3">ملاحظات</th><th className="px-6 py-3">إجمالي الخسارة</th></tr></thead><tbody>{filteredAdjustments.map(adj => (<React.Fragment key={adj.id}><tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleDetails(adj.id)}><td className="px-6 py-4 no-print">{expandedAdjustment === adj.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td><td className="px-6 py-4">{formatDate(adj.date)}</td><td className="px-6 py-4 text-xs">{adj.notes}</td><td className="px-6 py-4 font-bold text-red-600">{formatCurrency(adj.totalLossValue)}</td></tr>{expandedAdjustment === adj.id && (<tr className="bg-gray-50 no-print"><td colSpan={4} className="p-4"><div className="p-4 bg-white rounded-md border"><h4 className="font-bold mb-2">تفاصيل التسوية:</h4><table className="w-full text-xs text-right"><thead className="bg-gray-100"><tr><th className="p-2">المادة</th><th className="p-2">الكمية</th><th className="p-2">السبب</th><th className="p-2">القيمة</th></tr></thead><tbody>{adj.items.map((item, idx) => (<tr key={idx} className="border-b"><td className="p-2">{item.name}</td><td className="p-2 text-center">{item.quantity}</td><td className="p-2 text-center">{reasonMap[item.reason] || item.reason}</td><td className="p-2">{formatCurrency(item.itemTotalValue)}</td></tr>))}</tbody></table></div></td></tr>)}</React.Fragment>))}</tbody><tfoot className="bg-gray-100 font-bold"><tr><td colSpan={3} className="px-6 py-3 text-lg">الإجمالي</td><td className="px-6 py-3 text-lg text-red-700">{formatCurrency(adjustmentsTotal)}</td></tr></tfoot></table></div></div>);
};

const ProfitSummary: React.FC = () => {
    const { state } = useInventory();
    const [startDate, setStartDate] = useState(lastMonthStr); const [startTime, setStartTime] = useState('00:00'); const [endDate, setEndDate] = useState(today); const [endTime, setEndTime] = useState('23:59');
    const summary = useMemo(() => { const startDateTime = new Date(`${startDate}T${startTime}`); const endDateTime = new Date(`${endDate}T${endTime}`); const startDateOnly = new Date(startDate); startDateOnly.setHours(0, 0, 0, 0); const endDateOnly = new Date(endDate); endDateOnly.setHours(23, 59, 59, 999); const salesInRange = state.sales.filter(s => { const saleDate = new Date(s.date); return saleDate >= startDateTime && saleDate <= endDateTime; }); const salesReturnsInRange = state.salesReturns.filter(sr => { const returnDate = new Date(sr.date); return returnDate >= startDateTime && returnDate <= endDateTime; }); const expensesInRange = state.expenses.filter(e => { const expenseDate = new Date(e.date); return expenseDate >= startDateOnly && expenseDate <= endDateOnly; }); const totalSales = salesInRange.reduce((sum, s) => sum + s.total, 0); const totalSalesReturns = salesReturnsInRange.reduce((sum, sr) => sum + sr.totalReturnValue, 0); const netSales = totalSales - totalSalesReturns; const costOfGoodsSold = salesInRange.reduce((cogs, sale) => { return cogs + sale.items.reduce((itemCogs, item) => { const product = state.products.find(p => p.id === item.id); if (!product) return itemCogs; const quantityInPackets = item.sellUnit === 'packet' ? item.quantity : item.quantity / (product.stripCount || 1); return itemCogs + (quantityInPackets * product.costPrice); }, 0); }, 0); const grossProfit = netSales - costOfGoodsSold; const totalExpenses = expensesInRange.reduce((sum, e) => sum + e.amount, 0); const netProfit = grossProfit - totalExpenses; return { totalSales, totalSalesReturns, netSales, costOfGoodsSold, grossProfit, totalExpenses, netProfit }; }, [state, startDate, startTime, endDate, endTime]);
    return (<div className="space-y-4"><div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg no-print"><div><label className="text-sm font-medium text-gray-700">من تاريخ ووقت</label><div className="flex gap-2 mt-1"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2" /><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="border-gray-300 rounded-md shadow-sm p-2" /></div></div><div><label className="text-sm font-medium text-gray-700">إلى تاريخ ووقت</label><div className="flex gap-2 mt-1"><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2" /><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border-gray-300 rounded-md shadow-sm p-2" /></div></div></div><div className="max-w-2xl mx-auto bg-gray-50 p-6 rounded-lg border"><div className="space-y-4 text-lg"><div className="flex justify-between items-center"><span className="text-gray-600">إجمالي المبيعات</span><span className="font-semibold text-green-600">{formatCurrency(summary.totalSales)}</span></div><div className="flex justify-between items-center"><span className="text-gray-600">(مطروحاً) إجمالي مرتجع المبيعات</span><span className="font-semibold text-yellow-600">({formatCurrency(summary.totalSalesReturns)})</span></div><div className="flex justify-between items-center font-bold border-t pt-2"><span className="text-gray-800">صافي المبيعات</span><span className="text-teal-700 text-xl">{formatCurrency(summary.netSales)}</span></div><div className="flex justify-between items-center mt-4"><span className="text-gray-600">(مطروحاً) كلفة البضاعة المباعة</span><span className="font-semibold text-orange-600">({formatCurrency(summary.costOfGoodsSold)})</span></div><div className="flex justify-between items-center font-bold text-xl bg-blue-100 p-3 rounded-md my-4"><span className="text-blue-800">مجمل الربح</span><span className="text-blue-700">{formatCurrency(summary.grossProfit)}</span></div><div className="flex justify-between items-center"><span className="text-gray-600">(مطروحاً) إجمالي المصاريف</span><span className="font-semibold text-red-600">({formatCurrency(summary.totalExpenses)})</span></div><div className="flex justify-between items-center font-bold text-2xl bg-gray-800 text-white p-4 rounded-md mt-4"><span className="">صافي الربح التقريبي</span><span className={summary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(summary.netProfit)}</span></div></div></div></div>);
};

const AnnualInventoryCountReport: React.FC = () => {
    const { state } = useInventory();
    const [expandedCount, setExpandedCount] = useState<string | null>(null); const toggleCountDetails = (countId: string) => setExpandedCount(p => p === countId ? null : countId);
    return (<div className="space-y-4">{state.annualInventoryCounts.length === 0 ? (<p className="text-gray-500 text-center">لا توجد عمليات جرد سنوي مسجلة.</p>) : (<div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 w-10 no-print"></th><th className="px-6 py-3">تاريخ الجرد</th><th className="px-6 py-3">إجمالي قيمة المخزون (قبل)</th><th className="px-6 py-3">ملاحظات</th></tr></thead><tbody>{state.annualInventoryCounts.map(count => (<React.Fragment key={count.id}><tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleCountDetails(count.id)}><td className="px-6 py-4 no-print">{expandedCount === count.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td><td className="px-6 py-4 font-medium">{formatDateTime(count.date)}</td><td className="px-6 py-4 font-bold text-red-600">{formatCurrency(count.totalValueBefore)}</td><td className="px-6 py-4 text-xs">{count.notes}</td></tr>{expandedCount === count.id && (<tr className="bg-gray-50 no-print"><td colSpan={4} className="p-4"><div className="p-4 bg-white rounded-md border"><h4 className="font-bold mb-2">تفاصيل الجرد (الكميات قبل التصفير):</h4><table className="w-full text-sm text-right"><thead className="bg-gray-100"><tr><th className="p-2">المادة</th><th className="p-2">الكمية</th><th className="p-2">الكلفة</th><th className="p-2">الإجمالي</th></tr></thead><tbody>{count.snapshot.map(item => (<tr key={item.productId} className="border-b last:border-b-0"><td className="p-2">{item.productName}</td><td className="p-2">{item.quantityBefore}</td><td className="p-2">{formatCurrency(item.costPrice)}</td><td className="p-2">{formatCurrency(item.totalValueBefore)}</td></tr>))}</tbody></table></div></td></tr>)}</React.Fragment>))}</tbody></table></div>)}</div>);
};

const StocktakeReport: React.FC = () => {
    const { state } = useInventory();
    const [expanded, setExpanded] = useState<string | null>(null); const toggle = (id: string) => setExpanded(p => p === id ? null : id); const sortedStocktakes = useMemo(() => [...state.stocktakes].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [state.stocktakes]);
    return (<div className="space-y-4">{sortedStocktakes.length === 0 ? (<p className="text-center text-gray-500">لا توجد فواتير جرد مسجلة.</p>) : (<div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 w-10 no-print"></th><th className="px-6 py-3">تاريخ الجرد</th><th className="px-6 py-3">ملاحظات</th><th className="px-6 py-3">قيمة التغيير</th></tr></thead><tbody>{sortedStocktakes.map(st => (<React.Fragment key={st.id}><tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggle(st.id)}><td className="px-6 py-4 no-print">{expanded === st.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</td><td className="px-6 py-4 font-medium">{formatDate(st.date)}</td><td className="px-6 py-4 text-xs">{st.notes}</td><td className={`px-6 py-4 font-bold ${st.totalValueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(st.totalValueChange)}</td></tr>{expanded === st.id && (<tr className="bg-gray-50 no-print"><td colSpan={4} className="p-4"><div className="p-4 bg-white rounded-md border"><h4 className="font-bold mb-2">تفاصيل فاتورة الجرد</h4><table className="w-full text-xs"><thead className="bg-gray-100"><tr><th className="p-2 text-right">المادة</th><th className="p-2">كمية النظام</th><th className="p-2">الكمية الفعلية</th><th className="p-2">الفرق</th></tr></thead><tbody>{st.items.map(item => (<tr key={item.productId} className="border-b"><td className="p-2">{item.name}</td><td className="p-2 text-center">{item.systemStock.toFixed(2)}</td><td className="p-2 text-center">{item.actualStock.toFixed(2)}</td><td className={`p-2 text-center font-bold ${item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : ''}`}>{item.difference.toFixed(2)}</td></tr>))}</tbody></table></div></td></tr>)}</React.Fragment>))}</tbody></table></div>)}</div>);
};

type ReportTab = 'sales' | 'purchases' | 'salesReturns' | 'purchaseReturns' | 'inventory' | 'expenses' | 'stockAdjustments' | 'profit' | 'stocktakes' | 'annualCounts';

const Reports: React.FC = () => {
    const { state } = useInventory();
    const [activeTab, setActiveTab] = useState<ReportTab>('sales');
    const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
    const [purchaseToPrint, setPurchaseToPrint] = useState<Purchase | null>(null);
    const [salesReturnToPrint, setSalesReturnToPrint] = useState<SalesReturn | null>(null);
    const [purchaseReturnToPrint, setPurchaseReturnToPrint] = useState<PurchaseReturn | null>(null);
    
    useEffect(() => { if (saleToPrint) { window.print(); setSaleToPrint(null); }}, [saleToPrint]);
    useEffect(() => { if (purchaseToPrint) { window.print(); setPurchaseToPrint(null); }}, [purchaseToPrint]);
    useEffect(() => { if (salesReturnToPrint) { window.print(); setSalesReturnToPrint(null); }}, [salesReturnToPrint]);
    useEffect(() => { if (purchaseReturnToPrint) { window.print(); setPurchaseReturnToPrint(null); }}, [purchaseReturnToPrint]);

    const tabs: { id: ReportTab; label: string; icon: React.ElementType }[] = [
        { id: 'sales', label: 'المبيعات', icon: ShoppingCart },
        { id: 'purchases', label: 'المشتريات', icon: Archive },
        { id: 'salesReturns', label: 'مرتجع المبيعات', icon: Undo },
        { id: 'purchaseReturns', label: 'مرتجع المشتريات', icon: Redo },
        { id: 'inventory', label: 'المخزون', icon: Package },
        { id: 'expenses', label: 'المصاريف', icon: ReceiptText },
        { id: 'stockAdjustments', label: 'تلف وإكسباير', icon: PackageX },
        { id: 'profit', label: 'ملخص الأرباح', icon: BarChartHorizontal },
        { id: 'stocktakes', label: 'تقارير جرد المخزن', icon: ClipboardCheck },
        { id: 'annualCounts', label: 'تقارير الجرد السنوي', icon: ClipboardList },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'sales': return <SalesReport setSaleToPrint={setSaleToPrint} />;
            case 'purchases': return <PurchasesReport setPurchaseToPrint={setPurchaseToPrint} />;
            case 'salesReturns': return <SalesReturnsReport setSalesReturnToPrint={setSalesReturnToPrint} />;
            case 'purchaseReturns': return <PurchaseReturnsReport setPurchaseReturnToPrint={setPurchaseReturnToPrint} />;
            case 'inventory': return <InventoryReport />;
            case 'expenses': return <ExpensesReport />;
            case 'stockAdjustments': return <StockAdjustmentsReport />;
            case 'profit': return <ProfitSummary />;
            case 'stocktakes': return <StocktakeReport />;
            case 'annualCounts': return <AnnualInventoryCountReport />;
            default: return null;
        }
    };

    return (
        <>
            {saleToPrint && <PrintableSaleInvoice sale={saleToPrint} companyInfo={state.companyInfo} />}
            {purchaseToPrint && <PrintablePurchaseInvoice purchase={purchaseToPrint} companyInfo={state.companyInfo} supplier={state.suppliers.find(s=>s.id === purchaseToPrint.supplierId)} />}
            {salesReturnToPrint && <PrintableSalesReturn salesReturn={salesReturnToPrint} companyInfo={state.companyInfo} />}
            {purchaseReturnToPrint && <PrintablePurchaseReturn purchaseReturn={purchaseReturnToPrint} companyInfo={state.companyInfo} supplier={state.suppliers.find(s=>s.id === purchaseReturnToPrint.supplierId)} />}

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-6 no-print">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">التقارير</h1>
                    <button onClick={() => window.print()} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                        <Printer size={18} />
                        <span>طباعة التقرير</span>
                    </button>
                </div>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex gap-4 overflow-x-auto" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors flex-shrink-0`}><tab.icon className="ml-2 h-5 w-5" /><span>{tab.label}</span></button>
                        ))}
                    </nav>
                </div>
                <div className="pt-4">{renderContent()}</div>
            </div>
        </>
    );
};

export default Reports;