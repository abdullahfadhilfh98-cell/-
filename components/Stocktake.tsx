import React, { useState, useMemo, useCallback, useReducer } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Stocktake, StocktakeItem } from '../types';
import { PlusCircle, Trash2, Save, ClipboardCheck } from 'lucide-react';
import SearchableProductInput from './common/SearchableProductInput';

const today = new Date().toISOString().split('T')[0];

type ItemState = {
    key: string; 
    productId: string | undefined;
    systemStock: number;
    actualPackets: number;
    actualStrips: number;
};
const createNewItem = (): ItemState => ({ key: `item_${Date.now()}_${Math.random()}`, productId: undefined, systemStock: 0, actualPackets: 0, actualStrips: 0 });

type FormState = {
    date: string;
    notes: string;
    items: ItemState[];
};
type FormAction =
  | { type: 'SET_FIELD'; field: 'date' | 'notes'; value: string }
  | { type: 'ADD_ITEM' }
  | { type: 'REMOVE_ITEM'; key: string }
  | { type: 'UPDATE_ITEM'; key: string; field: keyof ItemState; value: any; systemStock?: number }
  | { type: 'RESET' };

const formReducer = (state: FormState, action: FormAction): FormState => {
    switch (action.type) {
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
                        if (action.systemStock !== undefined) {
                            updatedItem.systemStock = action.systemStock;
                        }
                        return updatedItem;
                    }
                    return item;
                })
            };
        case 'RESET': return { date: today, notes: '', items: [createNewItem()] };
        default: return state;
    }
};

const Stocktake: React.FC = () => {
    const { state: globalState, dispatch: globalDispatch } = useInventory();
    const [state, dispatch] = useReducer(formReducer, { date: today, notes: '', items: [createNewItem()] });

    const handleItemChange = (key: string, field: keyof ItemState, value: any) => {
        const product = globalState.products.find(p => p.id === (field === 'productId' ? value : state.items.find(i=> i.key === key)?.productId));
        dispatch({ type: 'UPDATE_ITEM', key, field, value, systemStock: product?.stock });
    };
    
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const validItems = state.items.filter(item => item.productId);
        if (validItems.length === 0) {
            alert('يجب إضافة مادة واحدة على الأقل للجرد.');
            return;
        }

        const stocktakeItems: StocktakeItem[] = validItems.map(item => {
            const product = globalState.products.find(p => p.id === item.productId)!;
            const stripCount = product.stripCount || 1;
            const actualStock = (item.actualPackets || 0) + ((item.actualStrips || 0) / stripCount);
            const difference = actualStock - item.systemStock;
            return {
                productId: product.id, name: product.name, systemStock: item.systemStock,
                actualStock: actualStock, difference: difference, costPrice: product.costPrice,
            };
        });
        
        const totalValueChange = stocktakeItems.reduce((sum, item) => sum + (item.difference * item.costPrice), 0);
        const { date, notes, items } = state;
        const newStocktake: Stocktake = { id: new Date().toISOString(), date, notes, items: stocktakeItems, totalValueChange };

        globalDispatch({ type: 'ADD_STOCKTAKE', payload: newStocktake });
        alert('تم حفظ فاتورة الجرد بنجاح! سيتم تحديث المخزون تلقائيًا.');
        dispatch({ type: 'RESET' });

    }, [state, globalState.products, globalDispatch]);

    return (
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        <div className="flex items-center gap-4">
            <ClipboardCheck size={32} className="text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-800">فاتورة جرد المخزن</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium">تاريخ الجرد</label>
                    <input type="date" value={state.date} onChange={e => dispatch({type: 'SET_FIELD', field: 'date', value: e.target.value})} className="mt-1 w-full border-gray-300 rounded p-1.5" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">ملاحظات</label>
                    <input type="text" value={state.notes} onChange={e => dispatch({type: 'SET_FIELD', field: 'notes', value: e.target.value})} className="mt-1 w-full border-gray-300 rounded p-1.5" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-right text-gray-600">
                        <tr>
                            <th className="p-2 w-3/12">المادة</th>
                            <th className="p-2 text-center">كمية النظام</th>
                            <th className="p-2">الكمية الفعلية (باكيت)</th>
                            <th className="p-2">الكمية الفعلية (شريط)</th>
                            <th className="p-2 text-center">الفرق</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.items.map(item => {
                            const product = globalState.products.find(p => p.id === item.productId);
                            const stripCount = product?.stripCount || 1;
                            const actualStock = (item.actualPackets || 0) + ((item.actualStrips || 0) / stripCount);
                            const difference = item.productId ? actualStock - item.systemStock : 0;
                            return (
                                <tr key={item.key} className="border-b">
                                    <td><SearchableProductInput products={globalState.products} value={item.productId} onChange={pid => handleItemChange(item.key, 'productId', pid)} /></td>
                                    <td className="text-center font-mono p-2">{item.systemStock.toFixed(2)}</td>
                                    <td><input type="number" value={item.actualPackets} onChange={e => handleItemChange(item.key, 'actualPackets', Number(e.target.value))} className="w-full border-gray-200 rounded p-1.5" min="0" /></td>
                                    <td><input type="number" value={item.actualStrips} onChange={e => handleItemChange(item.key, 'actualStrips', Number(e.target.value))} className="w-full border-gray-200 rounded p-1.5" min="0" /></td>
                                    <td className={`text-center font-bold p-2 ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : ''}`}>{difference.toFixed(2)}</td>
                                    <td><button type="button" onClick={() => dispatch({type: 'REMOVE_ITEM', key: item.key})} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <button type="button" onClick={() => dispatch({type: 'ADD_ITEM'})} className="text-sm text-teal-600 font-medium flex items-center gap-1"><PlusCircle size={16} /> إضافة مادة</button>
            <div className="flex justify-end pt-4 border-t">
                <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700">
                    <Save size={20} /><span>حفظ فاتورة الجرد</span>
                </button>
            </div>
        </form>
      </div>
    );
};

export default Stocktake;
