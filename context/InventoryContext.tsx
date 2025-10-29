import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { 
    User, Product, Sale, Purchase, Supplier, Action, PurchaseReturn, StockAdjustmentInvoice, 
    SalesReturn, AppState, SupplierPayment, CustomerReceipt, Expense, CompanyInfo, OpeningStockInvoice, 
    OpeningDebtInvoice, AnnualInventoryCount, Stocktake, StockAdjustmentItem 
} from '../types';

// Dummy data
const initialUsers: User[] = [
    { id: 'user1', username: 'admin', password: 'admin', role: 'admin' },
];

const initialSuppliers: Supplier[] = [
    { id: 'sup1', name: 'الشركة المتحدة للأدوية', phone: '07701234567', balance: 150000 },
    { id: 'sup2', name: 'مذخر النقاء', phone: '07801234567', balance: 75000 },
];

const initialProducts: Product[] = [
    // كود المادة | اسم المادة | سعر الشراء | عدد الشرائح | سعر بيع شريحة | سعر بيع باكيت | تاريخ انتهاء | شركة المنجة او الماركة
    { id: '1001', name: 'باندول اكسترا', scientificName: 'Paracetamol, Caffeine', category: 'GSK', costPrice: 1250, stripCount: 2, stripSellPrice: 1000, packetSellPrice: 2000, expiryDate: '2026-12-31', stock: 100 },
    { id: '1002', name: 'فولتارين 50 ملغ', scientificName: 'Diclofenac Sodium', category: 'Novartis', costPrice: 2500, stripCount: 3, stripSellPrice: 1250, packetSellPrice: 3500, expiryDate: '2025-10-31', stock: 50 },
    { id: '1003', name: 'اموكسيل 500 ملغ', scientificName: 'Amoxicillin', category: 'Hikma', costPrice: 1750, stripCount: 2, stripSellPrice: 1000, packetSellPrice: 1900, expiryDate: '2027-01-20', stock: 80 },
    { id: '1004', name: 'بروفين 400 ملغ', scientificName: 'Ibuprofen', category: 'Abbott', costPrice: 900, stripCount: 3, stripSellPrice: 500, packetSellPrice: 1500, expiryDate: '2026-08-15', stock: 120 },
    { id: '1005', name: 'زينات 250 ملغ', scientificName: 'Cefuroxime', category: 'GSK', costPrice: 6000, stripCount: 1, stripSellPrice: 7500, packetSellPrice: 7500, expiryDate: '2025-05-01', stock: 30 },
    { id: '1006', name: 'لوسارتان 50 ملغ', scientificName: 'Losartan', category: 'MSD', costPrice: 4500, stripCount: 2, stripSellPrice: 3000, packetSellPrice: 6000, expiryDate: '2027-03-10', stock: 65 },
    { id: '1007', name: 'اتورفاستاتين 20 ملغ', scientificName: 'Atorvastatin', category: 'Pfizer', costPrice: 8000, stripCount: 3, stripSellPrice: 3500, packetSellPrice: 10000, expiryDate: '2026-11-25', stock: 40 },
];

const initialSales: Sale[] = [
    { 
        id: 'sale1', 
        date: new Date(Date.now() - 86400000).toISOString(), 
        items: [{
            id: initialProducts[0].id,
            name: initialProducts[0].name,
            quantity: 2, 
            sellUnit: 'packet', 
            pricePerUnit: initialProducts[0].packetSellPrice,
            stock: initialProducts[0].stock,
            stripCount: initialProducts[0].stripCount,
        }], 
        subtotal: initialProducts[0].packetSellPrice * 2,
        discount: 0,
        total: initialProducts[0].packetSellPrice * 2 
    },
    { 
        id: 'sale2', 
        date: new Date().toISOString(), 
        items: [
            {
                id: initialProducts[1].id,
                name: initialProducts[1].name,
                quantity: 1, 
                sellUnit: 'packet', 
                pricePerUnit: initialProducts[1].packetSellPrice,
                stock: initialProducts[1].stock,
                stripCount: initialProducts[1].stripCount,
            }, 
            {
                id: initialProducts[3].id,
                name: initialProducts[3].name,
                quantity: 1, 
                sellUnit: 'packet', 
                pricePerUnit: initialProducts[3].packetSellPrice,
                stock: initialProducts[3].stock,
                stripCount: initialProducts[3].stripCount,
            }
        ], 
        subtotal: initialProducts[1].packetSellPrice + initialProducts[3].packetSellPrice,
        discount: 0,
        total: initialProducts[1].packetSellPrice + initialProducts[3].packetSellPrice 
    },
];

const initialExpenseCategories = ['رواتب', 'إيجار', 'فواتير (ماء، كهرباء)', 'صيانة', 'نثريات', 'أخرى'];

const initialCompanyInfo: CompanyInfo = {
    name: 'صيدليتي',
    address: 'بغداد - المنصور',
    phone: '07700000000',
    logo: '',
    footerNotes: 'شكراً لزيارتكم! نتمنى لكم دوام الصحة والعافية.',
    printerSettings: { type: 'a4' }
};


const initialState: AppState = {
  users: initialUsers,
  currentUser: null,
  products: initialProducts,
  sales: initialSales,
  salesReturns: [],
  purchases: [],
  purchaseReturns: [],
  suppliers: initialSuppliers,
  stockAdjustments: [],
  stocktakes: [],
  supplierPayments: [],
  customerReceipts: [],
  expenses: [],
  expenseCategories: initialExpenseCategories,
  companyInfo: initialCompanyInfo,
  openingStockInvoices: [],
  openingDebtInvoices: [],
  annualInventoryCounts: [],
};

const inventoryReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN': {
      const { username, password_hash } = action.payload;
      const user = state.users.find(u => u.username === username && u.password === password_hash);
      if (user) {
        // In a real app, you wouldn't store the password in the currentUser state.
        // This is simplified for this example.
        const { password, ...userToStore } = user;
        return { ...state, currentUser: userToStore };
      }
      // Return current state if login fails
      return state;
    }

    case 'LOGOUT':
      return { ...state, currentUser: null };

    case 'ADD_USER': {
       const newUser: User = { ...action.payload, id: new Date().toISOString() };
       return { ...state, users: [...state.users, newUser] };
    }

    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => u.id === action.payload.id ? action.payload : u)
      };

    case 'DELETE_USER':
      // Prevent deleting the current user or the last admin user
      if (action.payload === state.currentUser?.id) {
          alert("لا يمكنك حذف المستخدم الحالي.");
          return state;
      }
      const admins = state.users.filter(u => u.role === 'admin');
      const userToDelete = state.users.find(u => u.id === action.payload);
      if (admins.length === 1 && userToDelete?.role === 'admin') {
          alert("لا يمكن حذف آخر مدير في النظام.");
          return state;
      }
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload)
      };

    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload],
      };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };

    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };

    case 'ADD_SALE': {
      const sale = action.payload;
      const newProducts = state.products.map(product => {
        const itemsInSale = sale.items.filter(item => item.id === product.id);
        if (itemsInSale.length > 0) {
          const totalDeductedInPackets = itemsInSale.reduce((total, item) => {
             const quantityInPackets = item.sellUnit === 'packet'
                ? item.quantity
                : item.quantity / (product.stripCount || 1);
             return total + quantityInPackets;
          }, 0);
          
          return { ...product, stock: product.stock - totalDeductedInPackets };
        }
        return product;
      });

      return {
        ...state,
        products: newProducts,
        sales: [sale, ...state.sales],
      };
    }

    case 'ADD_SALES_RETURN': {
      const salesReturn = action.payload;
      const newProducts = state.products.map(product => {
        const itemsInReturn = salesReturn.items.filter(item => item.id === product.id);

        if (itemsInReturn.length > 0) {
            const totalReturnedInPackets = itemsInReturn.reduce((total, item) => {
                const quantityInPackets = item.returnUnit === 'packet'
                ? item.quantity
                : item.quantity / (product.stripCount || 1);
                return total + quantityInPackets;
            }, 0);
          
          return { ...product, stock: product.stock + totalReturnedInPackets };
        }
        return product;
      });

      return {
        ...state,
        products: newProducts,
        salesReturns: [salesReturn, ...state.salesReturns],
      };
    }

    case 'ADD_PURCHASE': {
      const purchase = action.payload;
      const newProducts = state.products.map(p => {
        const itemInPurchase = purchase.items.find(item => item.productId === p.id);
        if (itemInPurchase) {
          const newProduct = { ...p };
          newProduct.stock += (itemInPurchase.quantity + itemInPurchase.bonus);
          newProduct.costPrice = itemInPurchase.costPrice;
          newProduct.packetSellPrice = itemInPurchase.packetSellPrice;
          newProduct.stripSellPrice = itemInPurchase.stripSellPrice;
          newProduct.stripCount = itemInPurchase.stripCount;
          newProduct.expiryDate = itemInPurchase.expiryDate;
          return newProduct;
        }
        return p;
      });
      const newSuppliers = state.suppliers.map(s => {
        if (s.id === purchase.supplierId) {
          const newSupplier = { ...s };
          newSupplier.balance += purchase.amountDue;
          return newSupplier;
        }
        return s;
      });

      return {
        ...state,
        products: newProducts,
        suppliers: newSuppliers,
        purchases: [purchase, ...state.purchases],
      };
    }
    
    case 'UPDATE_PURCHASE': {
        const updatedPurchase = action.payload;
        const originalPurchase = state.purchases.find(p => p.id === updatedPurchase.id);
        if (!originalPurchase) return state;

        // Use maps to calculate deltas for products and suppliers
        const productStockDeltas = new Map<string, number>();
        const supplierBalanceDeltas = new Map<string, number>();

        // Calculate deltas from original purchase (values to be subtracted)
        originalPurchase.items.forEach(item => {
            const currentDelta = productStockDeltas.get(item.productId) || 0;
            productStockDeltas.set(item.productId, currentDelta - (item.quantity + item.bonus));
        });
        const originalSupplierBalanceDelta = supplierBalanceDeltas.get(originalPurchase.supplierId) || 0;
        supplierBalanceDeltas.set(originalPurchase.supplierId, originalSupplierBalanceDelta - originalPurchase.amountDue);

        // Calculate deltas from updated purchase (values to be added)
        updatedPurchase.items.forEach(item => {
            const currentDelta = productStockDeltas.get(item.productId) || 0;
            productStockDeltas.set(item.productId, currentDelta + (item.quantity + item.bonus));
        });
        const updatedSupplierBalanceDelta = supplierBalanceDeltas.get(updatedPurchase.supplierId) || 0;
        supplierBalanceDeltas.set(updatedPurchase.supplierId, updatedSupplierBalanceDelta + updatedPurchase.amountDue);
        
        // Apply deltas
        const newProducts = state.products.map(p => {
            if (productStockDeltas.has(p.id)) {
                // For items present in the purchase, update stock and potentially other details
                const itemInNewPurchase = updatedPurchase.items.find(item => item.productId === p.id);
                const newProduct = { ...p, stock: p.stock + (productStockDeltas.get(p.id) || 0) };
                if (itemInNewPurchase) {
                    // Update price info based on the *latest* purchase invoice
                    newProduct.costPrice = itemInNewPurchase.costPrice;
                    newProduct.packetSellPrice = itemInNewPurchase.packetSellPrice;
                    newProduct.stripSellPrice = itemInNewPurchase.stripSellPrice;
                    newProduct.stripCount = itemInNewPurchase.stripCount;
                    newProduct.expiryDate = itemInNewPurchase.expiryDate;
                }
                return newProduct;
            }
            return p;
        });

        const newSuppliers = state.suppliers.map(s => {
            if (supplierBalanceDeltas.has(s.id)) {
                return { ...s, balance: s.balance + (supplierBalanceDeltas.get(s.id) || 0) };
            }
            return s;
        });

        return {
            ...state,
            products: newProducts,
            suppliers: newSuppliers,
            purchases: state.purchases.map(p => p.id === updatedPurchase.id ? updatedPurchase : p),
        };
    }
    
    case 'DELETE_PURCHASE': {
        const purchaseIdToDelete = action.payload;
        const purchaseToDelete = state.purchases.find(p => p.id === purchaseIdToDelete);
        if (!purchaseToDelete) return state;

        const newProducts = state.products.map(p => {
            const itemInPurchase = purchaseToDelete.items.find(item => item.productId === p.id);
            if (itemInPurchase) {
                const newProduct = { ...p };
                newProduct.stock -= (itemInPurchase.quantity + itemInPurchase.bonus);
                return newProduct;
            }
            return p;
        });

        const newSuppliers = state.suppliers.map(s => {
            if (s.id === purchaseToDelete.supplierId) {
                const newSupplier = { ...s };
                newSupplier.balance -= purchaseToDelete.amountDue;
                return newSupplier;
            }
            return s;
        });

        return {
            ...state,
            products: newProducts,
            suppliers: newSuppliers,
            purchases: state.purchases.filter(p => p.id !== purchaseIdToDelete),
        };
    }
    
    case 'CORRUPT_PURCHASE': {
        const purchaseIdToCorrupt = action.payload;
        const purchaseToCorrupt = state.purchases.find(p => p.id === purchaseIdToCorrupt);
        if (!purchaseToCorrupt) return state;

        // Revert stock changes
        const newProducts = state.products.map(p => {
            const itemInPurchase = purchaseToCorrupt.items.find(item => item.productId === p.id);
            if (itemInPurchase) {
                return { ...p, stock: p.stock - (itemInPurchase.quantity + itemInPurchase.bonus) };
            }
            return p;
        });

        // Revert supplier balance changes
        const newSuppliers = state.suppliers.map(s => {
            if (s.id === purchaseToCorrupt.supplierId) {
                return { ...s, balance: s.balance - purchaseToCorrupt.amountDue };
            }
            return s;
        });

        // Remove the purchase invoice
        const newPurchases = state.purchases.filter(p => p.id !== purchaseIdToCorrupt);

        return {
            ...state,
            products: newProducts,
            suppliers: newSuppliers,
            purchases: newPurchases,
        };
    }


    case 'ADD_PURCHASE_RETURN': {
        const purchaseReturn = action.payload;
        const newProducts = state.products.map(p => {
            const itemInReturn = purchaseReturn.items.find(item => item.productId === p.id);
            if (itemInReturn) {
                return { ...p, stock: p.stock - (itemInReturn.quantity + itemInReturn.bonus) };
            }
            return p;
        });
        const newSuppliers = state.suppliers.map(s => {
            if (s.id === purchaseReturn.supplierId) {
                return { ...s, balance: s.balance - purchaseReturn.totalReturnValue };
            }
            return s;
        });

        return {
            ...state,
            products: newProducts,
            suppliers: newSuppliers,
            purchaseReturns: [purchaseReturn, ...state.purchaseReturns],
        };
    }
    
    case 'UPDATE_PURCHASE_RETURN': {
        const updatedReturn = action.payload;
        const originalReturn = state.purchaseReturns.find(pr => pr.id === updatedReturn.id);
        if (!originalReturn) return state;

        const productStockDeltas = new Map<string, number>();
        const supplierBalanceDeltas = new Map<string, number>();

        // Original return decreased stock and supplier balance.
        // To revert: add back stock and add back balance.
        originalReturn.items.forEach(item => {
            const currentDelta = productStockDeltas.get(item.productId) || 0;
            productStockDeltas.set(item.productId, currentDelta + (item.quantity + item.bonus));
        });
        const originalSupplierBalanceDelta = supplierBalanceDeltas.get(originalReturn.supplierId) || 0;
        supplierBalanceDeltas.set(originalReturn.supplierId, originalSupplierBalanceDelta + originalReturn.totalReturnValue);

        // Apply new return's effect: decrease stock and decrease balance.
        updatedReturn.items.forEach(item => {
            const currentDelta = productStockDeltas.get(item.productId) || 0;
            productStockDeltas.set(item.productId, currentDelta - (item.quantity + item.bonus));
        });
        const updatedSupplierBalanceDelta = supplierBalanceDeltas.get(updatedReturn.supplierId) || 0;
        supplierBalanceDeltas.set(updatedReturn.supplierId, updatedSupplierBalanceDelta - updatedReturn.totalReturnValue);

        // Apply deltas
        const newProducts = state.products.map(p => {
            if (productStockDeltas.has(p.id)) {
                return { ...p, stock: p.stock + (productStockDeltas.get(p.id) || 0) };
            }
            return p;
        });

        const newSuppliers = state.suppliers.map(s => {
            if (supplierBalanceDeltas.has(s.id)) {
                return { ...s, balance: s.balance + (supplierBalanceDeltas.get(s.id) || 0) };
            }
            return s;
        });
        
        return {
            ...state,
            products: newProducts,
            suppliers: newSuppliers,
            purchaseReturns: state.purchaseReturns.map(pr => pr.id === updatedReturn.id ? updatedReturn : pr),
        };
    }

    case 'DELETE_PURCHASE_RETURN': {
        const returnIdToDelete = action.payload;
        const returnToDelete = state.purchaseReturns.find(pr => pr.id === returnIdToDelete);
        if (!returnToDelete) return state;
        
        const newProducts = state.products.map(p => {
            const itemInReturn = returnToDelete.items.find(item => item.productId === p.id);
            if (itemInReturn) {
                return { ...p, stock: p.stock + (itemInReturn.quantity + itemInReturn.bonus) };
            }
            return p;
        });
        const newSuppliers = state.suppliers.map(s => {
            if (s.id === returnToDelete.supplierId) {
                return { ...s, balance: s.balance + returnToDelete.totalReturnValue };
            }
            return s;
        });

        return {
            ...state,
            products: newProducts,
            suppliers: newSuppliers,
            purchaseReturns: state.purchaseReturns.filter(pr => pr.id !== returnIdToDelete),
        };
    }

    case 'ADD_STOCK_ADJUSTMENT': {
      const adjustmentInvoice = action.payload;
      const newProducts = state.products.map(p => {
        const itemsToAdjust = adjustmentInvoice.items.filter(item => item.productId === p.id);
        if (itemsToAdjust.length > 0) {
            const totalQuantityChange = itemsToAdjust.reduce((total, item) => {
                const quantityChange = item.reason.includes('loss') || ['damage', 'expiry', 'theft', 'correction'].includes(item.reason) 
                    ? -item.quantity
                    : item.quantity;
                return total + quantityChange;
            }, 0);
          return { ...p, stock: p.stock + totalQuantityChange };
        }
        return p;
      });
      return {
        ...state,
        products: newProducts,
        stockAdjustments: [adjustmentInvoice, ...state.stockAdjustments],
      };
    }

    case 'ADD_STOCKTAKE': {
      const stocktake = action.payload;
      const adjustmentItems: StockAdjustmentItem[] = [];
      
      stocktake.items.forEach(item => {
        if (item.difference !== 0) {
          adjustmentItems.push({
            productId: item.productId,
            name: item.name,
            quantity: Math.abs(item.difference),
            costPrice: item.costPrice,
            reason: item.difference > 0 ? 'stocktake_gain' : 'stocktake_loss',
            itemTotalValue: Math.abs(item.difference) * item.costPrice
          });
        }
      });
      
      let newProducts = [...state.products];
      let newStockAdjustments = [...state.stockAdjustments];

      if (adjustmentItems.length > 0) {
        const adjustmentInvoice: StockAdjustmentInvoice = {
            id: `adj_${stocktake.id}`,
            date: stocktake.date,
            items: adjustmentItems,
            totalLossValue: stocktake.totalValueChange,
            notes: `تسوية تلقائية من جرد رقم: ${stocktake.id.slice(-6)}`,
        };
        
        newProducts = state.products.map(p => {
          const itemToAdjust = adjustmentItems.find(item => item.productId === p.id);
          if (itemToAdjust) {
            const quantityChange = itemToAdjust.reason === 'stocktake_loss' ? -itemToAdjust.quantity : itemToAdjust.quantity;
            return { ...p, stock: p.stock + quantityChange };
          }
          return p;
        });
        
        newStockAdjustments = [adjustmentInvoice, ...state.stockAdjustments];
      }

      return {
        ...state,
        products: newProducts,
        stockAdjustments: newStockAdjustments,
        stocktakes: [stocktake, ...state.stocktakes],
      };
    }


    case 'ADD_SUPPLIER': {
      const newSupplier: Supplier = {
        ...action.payload,
        id: new Date().toISOString(),
        balance: 0,
      };
      return {
        ...state,
        suppliers: [...state.suppliers, newSupplier],
      };
    }

    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s),
      };

    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter(s => s.id !== action.payload),
      };
      
    case 'ADD_SUPPLIER_PAYMENT': {
        const payment = action.payload;
        const totalDeduction = payment.amount + (payment.discount || 0);
        const newSuppliers = state.suppliers.map(s => {
            if (s.id === payment.supplierId) {
                return { ...s, balance: s.balance - totalDeduction };
            }
            return s;
        });

        let newPurchases = state.purchases;
        if (payment.invoicePayments) {
            newPurchases = state.purchases.map(p => {
                const paymentInfo = payment.invoicePayments!.find(inv => inv.invoiceId === p.id);
                if (paymentInfo) {
                    return {
                        ...p,
                        amountPaid: p.amountPaid + paymentInfo.paidAmount,
                        amountDue: p.amountDue - paymentInfo.paidAmount,
                    };
                }
                return p;
            });
        }

        return {
            ...state,
            suppliers: newSuppliers,
            purchases: newPurchases,
            supplierPayments: [payment, ...state.supplierPayments],
        };
    }

    case 'DELETE_SUPPLIER_PAYMENT': {
        const paymentId = action.payload;
        const paymentToDelete = state.supplierPayments.find(p => p.id === paymentId);
        if (!paymentToDelete) return state;

        const totalToAddBack = paymentToDelete.amount + (paymentToDelete.discount || 0);
        const newSuppliers = state.suppliers.map(s => {
            if (s.id === paymentToDelete.supplierId) {
                return { ...s, balance: s.balance + totalToAddBack };
            }
            return s;
        });

        let newPurchases = state.purchases;
        if (paymentToDelete.invoicePayments) {
            newPurchases = state.purchases.map(p => {
                const paymentInfo = paymentToDelete.invoicePayments!.find(inv => inv.invoiceId === p.id);
                if (paymentInfo) {
                    return {
                        ...p,
                        amountPaid: p.amountPaid - paymentInfo.paidAmount,
                        amountDue: p.amountDue + paymentInfo.paidAmount,
                    };
                }
                return p;
            });
        }

        return {
            ...state,
            suppliers: newSuppliers,
            purchases: newPurchases,
            supplierPayments: state.supplierPayments.filter(p => p.id !== paymentId),
        };
    }

    case 'ADD_CUSTOMER_RECEIPT':
      return {
        ...state,
        customerReceipts: [action.payload, ...state.customerReceipts],
      };

    case 'DELETE_CUSTOMER_RECEIPT':
      return {
        ...state,
        customerReceipts: state.customerReceipts.filter(r => r.id !== action.payload),
      };

    case 'ADD_EXPENSE':
        return {
            ...state,
            expenses: [action.payload, ...state.expenses],
        };

    case 'DELETE_EXPENSE':
        return {
            ...state,
            expenses: state.expenses.filter(e => e.id !== action.payload),
        };
    
    case 'ADD_EXPENSE_CATEGORY':
      if (state.expenseCategories.includes(action.payload)) {
        return state; // Avoid duplicates
      }
      return {
        ...state,
        expenseCategories: [...state.expenseCategories, action.payload],
      };

    case 'UPDATE_COMPANY_INFO':
        return {
            ...state,
            companyInfo: action.payload,
        };
    
    case 'ADD_OPENING_STOCK_INVOICE': {
        const invoice = action.payload;
        const updatedProducts = state.products.map(p => {
            const itemsForProduct = invoice.items.filter(i => i.productId === p.id);
            if (itemsForProduct.length > 0) {
                const totalQuantity = itemsForProduct.reduce((sum, item) => sum + item.quantity, 0);
                // Use details from the last entry for this product in the invoice
                const lastItem = itemsForProduct[itemsForProduct.length - 1];
                return {
                    ...p,
                    stock: p.stock + totalQuantity,
                    costPrice: lastItem.costPrice,
                    expiryDate: lastItem.expiryDate,
                    stripCount: lastItem.stripCount,
                    stripSellPrice: lastItem.stripSellPrice,
                };
            }
            return p;
        });
        return {
            ...state,
            products: updatedProducts,
            openingStockInvoices: [invoice, ...state.openingStockInvoices],
        };
    }

    case 'DELETE_OPENING_STOCK_INVOICE': {
        const invoiceId = action.payload;
        const invoiceToDelete = state.openingStockInvoices.find(inv => inv.id === invoiceId);
        if (!invoiceToDelete) return state;

        const updatedProducts = state.products.map(p => {
            const itemsForProduct = invoiceToDelete.items.filter(i => i.productId === p.id);
            if (itemsForProduct.length > 0) {
                const totalQuantity = itemsForProduct.reduce((sum, item) => sum + item.quantity, 0);
                return { ...p, stock: p.stock - totalQuantity };
            }
            return p;
        });
        return {
            ...state,
            products: updatedProducts,
            openingStockInvoices: state.openingStockInvoices.filter(inv => inv.id !== invoiceId),
        };
    }

    case 'ADD_OPENING_DEBT_INVOICE': {
        const invoice = action.payload;
        const updatedSuppliers = state.suppliers.map(s => {
            if (s.id === invoice.supplierId) {
                return { ...s, balance: s.balance + invoice.amountDue };
            }
            return s;
        });
        return {
            ...state,
            suppliers: updatedSuppliers,
            openingDebtInvoices: [invoice, ...state.openingDebtInvoices],
        };
    }

    case 'DELETE_OPENING_DEBT_INVOICE': {
        const invoiceId = action.payload;
        const invoiceToDelete = state.openingDebtInvoices.find(inv => inv.id === invoiceId);
        if (!invoiceToDelete) return state;

        const updatedSuppliers = state.suppliers.map(s => {
            if (s.id === invoiceToDelete.supplierId) {
                return { ...s, balance: s.balance - invoiceToDelete.amountDue };
            }
            return s;
        });
        return {
            ...state,
            suppliers: updatedSuppliers,
            openingDebtInvoices: state.openingDebtInvoices.filter(inv => inv.id !== invoiceId),
        };
    }

    case 'PERFORM_ANNUAL_INVENTORY_COUNT': {
      const snapshot = state.products.map(p => ({
        productId: p.id,
        productName: p.name,
        quantityBefore: p.stock,
        costPrice: p.costPrice,
        totalValueBefore: p.stock * p.costPrice,
      }));

      const totalValueBefore = snapshot.reduce((sum, item) => sum + item.totalValueBefore, 0);

      const newCount: AnnualInventoryCount = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        notes: action.payload.notes,
        snapshot,
        totalValueBefore,
      };

      const zeroedProducts = state.products.map(p => ({ ...p, stock: 0 }));

      return {
        ...state,
        products: zeroedProducts,
        annualInventoryCounts: [newCount, ...state.annualInventoryCounts],
      };
    }

    case 'REPLACE_STATE': {
        const newState = action.payload;
        if (newState && newState.products && newState.sales && newState.suppliers && newState.purchases) {
          return {...newState, currentUser: state.currentUser}; // Keep current user logged in
        }
        console.error("Import failed: Invalid data structure in the imported file.");
        alert("فشل الاستيراد: هيكل البيانات في الملف غير صالح. يرجى التأكد من استخدام ملف نسخة احتياطية صحيح.");
        return state;
    }
    default:
      return state;
  }
};

const InventoryContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export const InventoryProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(inventoryReducer, initialState, (initial) => {
    try {
      const localData = localStorage.getItem('pharmacyState');
      if (localData) {
        let parsed = JSON.parse(localData);
        // Basic migration for new features
        if (!parsed.users) parsed.users = initialUsers;
        if (!parsed.currentUser) parsed.currentUser = null;
        if (!parsed.salesReturns) parsed.salesReturns = [];
        if (!parsed.purchaseReturns) parsed.purchaseReturns = [];
        if (!parsed.supplierPayments) parsed.supplierPayments = [];
        if (!parsed.customerReceipts) parsed.customerReceipts = [];
        if (!parsed.expenses) parsed.expenses = [];
        if (!parsed.expenseCategories) parsed.expenseCategories = initialExpenseCategories;
        if (!parsed.companyInfo) parsed.companyInfo = initialCompanyInfo;
        if (parsed.companyInfo && !parsed.companyInfo.printerSettings) {
            parsed.companyInfo.printerSettings = { type: 'a4' };
        }
        if (!parsed.annualInventoryCounts) parsed.annualInventoryCounts = parsed.inventoryCounts || []; // Migration from old name
        if (parsed.inventoryCounts) delete parsed.inventoryCounts;
        if (!parsed.stocktakes) parsed.stocktakes = [];
        // Migration from old openingBalance to new invoice system
        if (parsed.openingBalance) {
            delete parsed.openingBalance;
        }
        if (!parsed.openingStockInvoices) parsed.openingStockInvoices = [];
        if (!parsed.openingDebtInvoices) parsed.openingDebtInvoices = [];
        
        if (parsed.stockAdjustments && parsed.stockAdjustments.some((s:any) => !s.items)) {
             parsed.stockAdjustments = []; // Reset old format
        } else if (!parsed.stockAdjustments) {
            parsed.stockAdjustments = [];
        }
        if (parsed.suppliers && parsed.suppliers.some((s:any) => s.balance === undefined)) {
            parsed.suppliers.forEach((s:any) => s.balance = 0);
        }
        // Migration to remove supplierId from products
        if (parsed.products && parsed.products.some((p: any) => p.supplierId !== undefined)) {
            parsed.products.forEach((p: any) => delete p.supplierId);
        }
        return {...initial, ...parsed};
      }
      return initial;
    } catch (error) {
      console.error("Could not parse localStorage state", error);
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem('pharmacyState', JSON.stringify(state));
  }, [state]);

  return (
    <InventoryContext.Provider value={{ state, dispatch }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};