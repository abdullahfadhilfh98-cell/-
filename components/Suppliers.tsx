import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Supplier } from '../types';
import Modal from './common/Modal';
import { PlusCircle, Edit, Trash2, Printer } from 'lucide-react';

const Suppliers: React.FC = () => {
    const { state, dispatch } = useInventory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const initialFormState: Omit<Supplier, 'id' | 'balance'> = {
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const handleOpenModal = (supplier: Supplier | null = null) => {
        setEditingSupplier(supplier);
        setFormData(supplier ? { ...supplier } : initialFormState);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setFormData(initialFormState);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            // Preserve balance on update
            dispatch({ type: 'UPDATE_SUPPLIER', payload: { ...formData, id: editingSupplier.id, balance: editingSupplier.balance } });
        } else {
            dispatch({ type: 'ADD_SUPPLIER', payload: formData });
        }
        handleCloseModal();
    };

    const handleDelete = (supplierId: string) => {
        const supplier = state.suppliers.find(s => s.id === supplierId);
        if (supplier && supplier.balance > 0) {
            alert('لا يمكن حذف مورد عليه رصيد دين. يرجى تصفية الحساب أولاً.');
            return;
        }
        if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
            dispatch({ type: 'DELETE_SUPPLIER', payload: supplierId });
        }
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
    };


    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">الموردين</h1>
                <div className="flex items-center gap-2 no-print">
                    <button onClick={() => window.print()} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                        <Printer size={18} />
                    </button>
                    <button onClick={() => handleOpenModal()} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700">
                        <PlusCircle size={20} />
                        <span>إضافة مورد</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">اسم المورد</th>
                            <th className="px-6 py-3">رقم الهاتف</th>
                            <th className="px-6 py-3">الرصيد (الدين)</th>
                            <th className="px-6 py-3 no-print">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.suppliers.map(supplier => (
                            <tr key={supplier.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{supplier.name}</td>
                                <td className="px-6 py-4">{supplier.phone}</td>
                                <td className={`px-6 py-4 font-semibold ${supplier.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(supplier.balance)}</td>
                                <td className="px-6 py-4 flex gap-2 no-print">
                                    <button onClick={() => handleOpenModal(supplier)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(supplier.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">اسم المورد</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">الشخص المسؤول (اختياري)</label>
                        <input type="text" name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">العنوان (اختياري)</label>
                        <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">إلغاء</button>
                        <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">{editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Suppliers;