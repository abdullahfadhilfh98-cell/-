import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types';
import { PlusCircle, Edit, Trash2, Search, Save, XCircle, FilePlus, Printer } from 'lucide-react';

type FormState = Omit<Product, 'supplierId'>;

const Inventory: React.FC = () => {
  const { state, dispatch } = useInventory();
  
  const initialFormState: Product = {
    id: '',
    name: '',
    scientificName: '',
    category: '',
    packetSellPrice: 0,
    costPrice: 0,
    stock: 0,
    expiryDate: '',
    stripCount: 0,
    stripSellPrice: 0,
  };

  const [formData, setFormData] = useState<Product>(initialFormState);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    return state.products.filter(p =>
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.scientificName && p.scientificName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.products, searchTerm]);

  const handleEditClick = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({ ...product });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditingProductId(null);
    setFormData(initialFormState);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['packetSellPrice', 'costPrice', 'stock', 'stripCount', 'stripSellPrice'];
    setFormData({ ...formData, [name]: numericFields.includes(name) ? Number(value) : value });
  };

  const handleSaveAndAddAnother = () => {
    if (!formData.name.trim() || !formData.category.trim() || !formData.id.trim()) {
        alert("يرجى إدخال كود المادة، الاسم، والشركة المنتجة على الأقل.");
        return;
    }
    if (state.products.some(p => p.id === formData.id)) {
        alert("كود المادة مستخدم بالفعل. يرجى إدخال كود فريد.");
        return;
    }
    dispatch({ type: 'ADD_PRODUCT', payload: formData });
    alert('تم إضافة المنتج بنجاح!');
    setFormData(initialFormState); // Reset for another new product
  };

  const handleSaveChanges = () => {
    if (!editingProductId) return;
     if (!formData.name.trim() || !formData.category.trim()) {
        alert("يرجى إدخال اسم المنتج والشركة المنتجة على الأقل.");
        return;
    }
    dispatch({ type: 'UPDATE_PRODUCT', payload: { ...formData, id: editingProductId } });
    alert('تم تعديل المنتج بنجاح!');
    handleCancelEdit();
  };


  const handleDelete = (productId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      dispatch({ type: 'DELETE_PRODUCT', payload: productId });
      // If the deleted product was being edited, cancel the edit mode.
      if (editingProductId === productId) {
          handleCancelEdit();
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount);
  };
  
  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-xl shadow-md no-print">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {editingProductId ? `تعديل المنتج: ${state.products.find(p=>p.id===editingProductId)?.name}` : 'إضافة منتج جديد'}
        </h1>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">كود المادة</label>
                    <input type="text" name="id" value={formData.id} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!!editingProductId} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">الاسم التجاري</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">الاسم العلمي</label>
                    <input type="text" name="scientificName" value={formData.scientificName || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">الشركة المنتجة / الماركة</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">سعر بيع الباكيت</label>
                    <input type="number" name="packetSellPrice" value={formData.packetSellPrice} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">سعر الشراء (الكلفة)</label>
                    <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">الكمية بالمخزون</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">عدد الشرائح (اختياري)</label>
                    <input type="number" name="stripCount" value={formData.stripCount || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">سعر بيع الشريحة (اختياري)</label>
                    <input type="number" name="stripSellPrice" value={formData.stripSellPrice || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">تاريخ الانتهاء</label>
                    <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
                {editingProductId ? (
                    <>
                        <button type="button" onClick={handleCancelEdit} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                             <XCircle size={18}/> <span>إلغاء</span>
                        </button>
                        <button type="button" onClick={handleSaveChanges} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                            <Save size={18}/> <span>حفظ التعديلات</span>
                        </button>
                    </>
                ) : (
                     <button type="button" onClick={handleSaveAndAddAnother} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700">
                        <Save size={18}/> <span>حفظ وإضافة آخر</span>
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">قائمة المواد</h2>
            <button onClick={() => window.print()} className="no-print bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                <Printer size={18} />
                <span>طباعة القائمة</span>
            </button>
        </div>
        <div className="relative mb-4 no-print">
            <input
                type="text"
                placeholder="ابحث بالكود، الاسم التجاري أو العلمي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-full shadow-sm py-2 px-4 pr-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                <th className="px-6 py-3">الكود</th>
                <th className="px-6 py-3">الاسم التجاري</th>
                <th className="px-6 py-3">الاسم العلمي</th>
                <th className="px-6 py-3">سعر بيع الباكيت</th>
                <th className="px-6 py-3">الكمية</th>
                <th className="px-6 py-3">تاريخ الانتهاء</th>
                <th className="px-6 py-3 no-print">إجراءات</th>
                </tr>
            </thead>
            <tbody>
                {filteredProducts.map(product => (
                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-gray-600">{product.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4">{product.scientificName}</td>
                    <td className="px-6 py-4">{formatCurrency(product.packetSellPrice)}</td>
                    <td className="px-6 py-4">{product.stock}</td>
                    <td className="px-6 py-4">{new Date(product.expiryDate).toLocaleDateString('ar-IQ')}</td>
                    <td className="px-6 py-4 flex gap-2 no-print">
                    <button onClick={() => handleEditClick(product)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;