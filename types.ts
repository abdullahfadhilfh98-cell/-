export type UserRole = 'admin' | 'pharmacist' | 'cashier';

export interface User {
    id: string;
    username: string;
    password?: string;
    role: UserRole;
}

export interface Product {
    id: string;
    name: string;
    scientificName?: string;
    category: string;
    costPrice: number;
    packetSellPrice: number;
    stock: number;
    expiryDate: string;
    stripCount?: number;
    stripSellPrice?: number;
}

export interface CartItem {
    id: string;
    name: string;
    quantity: number;
    sellUnit: 'packet' | 'strip';
    pricePerUnit: number;
    stock: number;
    stripCount?: number;
}

export interface Sale {
    id: string;
    date: string; // ISO string
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
}

export interface SalesReturnItem {
    id: string;
    name: string;
    quantity: number;
    returnUnit: 'packet' | 'strip';
    pricePerUnit: number;
    stripCount?: number;
}

export interface SalesReturn {
    id: string;
    date: string; // ISO string
    items: SalesReturnItem[];
    subtotal: number;
    discount: number;
    totalReturnValue: number;
    notes?: string;
}

export interface PurchaseItem {
    productId: string;
    name: string;
    quantity: number;
    bonus: number;
    costPrice: number;
    discountPercentage?: number;
    packetSellPrice: number;
    stripSellPrice?: number;
    stripCount?: number;
    expiryDate: string;
    itemTotal: number;
}

export interface Purchase {
    id: string;
    supplierId: string;
    invoiceNumber: string;
    invoiceDate: string; // YYYY-MM-DD
    arrivalDate?: string;
    items: PurchaseItem[];
    subtotal: number;
    discount: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    paymentDueDate?: string;
    notes: string;
}

export interface PurchaseReturnItem {
    productId: string;
    name: string;
    quantity: number;
    bonus: number;
    costPrice: number;
    itemTotal: number;
}

export interface PurchaseReturn {
    id: string;
    supplierId: string;
    invoiceNumber: string; // reference to original purchase invoice number
    returnDate: string; // YYYY-MM-DD
    items: PurchaseReturnItem[];
    subtotal: number;
    discount: number;
    totalReturnValue: number;
    notes: string;
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    phone: string;
    email?: string;
    address?: string;
    balance: number;
}

export interface StockAdjustmentItem {
    productId: string;
    name: string;
    quantity: number;
    costPrice: number;
    reason: 'damage' | 'expiry' | 'theft' | 'correction' | 'other' | 'stocktake_gain' | 'stocktake_loss' | string;
    itemTotalValue: number;
}

export interface StockAdjustmentInvoice {
    id: string;
    date: string;
    items: StockAdjustmentItem[];
    totalLossValue: number;
    notes: string;
}

export interface StocktakeItem {
    productId: string;
    name: string;
    systemStock: number;
    actualStock: number;
    difference: number;
    costPrice: number;
}

export interface Stocktake {
    id: string;
    date: string;
    items: StocktakeItem[];
    totalValueChange: number;
    notes: string;
}

export interface SupplierPayment {
    id: string;
    supplierId: string;
    amount: number;
    discount?: number;
    date: string;
    paymentMethod: 'cash' | 'bank' | 'cheque';
    notes: string;
    invoicePayments?: { invoiceId: string; paidAmount: number }[];
}

export interface CustomerReceipt {
    id: string;
    customerName: string;
    amount: number;
    date: string;
    paymentMethod: 'cash' | 'bank' | 'cheque';
    notes: string;
}

export interface Expense {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    paymentMethod: 'cash' | 'bank';
}

export interface CompanyInfo {
    name: string;
    address: string;
    phone: string;
    logo: string;
    footerNotes: string;
    printerSettings: {
        type: 'a4' | 'thermal';
    }
}

export interface OpeningStockItemDetail {
    productId: string;
    name: string;
    quantity: number;
    costPrice: number;
    expiryDate: string;
    stripCount?: number;
    stripSellPrice?: number;
    itemTotalValue: number;
}

export interface OpeningStockInvoice {
    id: string;
    date: string;
    notes: string;
    items: OpeningStockItemDetail[];
    totalValue: number;
}

export interface OpeningDebtInvoice {
    id: string;
    date: string;
    supplierId: string;
    oldInvoiceNumber: string;
    oldInvoiceDate: string;
    amountDue: number;
    notes: string;
}

export interface AnnualInventoryCount {
    id: string;
    date: string;
    notes: string;
    snapshot: {
        productId: string;
        productName: string;
        quantityBefore: number;
        costPrice: number;
        totalValueBefore: number;
    }[];
    totalValueBefore: number;
}

export interface AppState {
    users: User[];
    currentUser: Omit<User, 'password'> | null;
    products: Product[];
    sales: Sale[];
    salesReturns: SalesReturn[];
    purchases: Purchase[];
    purchaseReturns: PurchaseReturn[];
    suppliers: Supplier[];
    stockAdjustments: StockAdjustmentInvoice[];
    stocktakes: Stocktake[];
    supplierPayments: SupplierPayment[];
    customerReceipts: CustomerReceipt[];
    expenses: Expense[];
    expenseCategories: string[];
    companyInfo: CompanyInfo;
    openingStockInvoices: OpeningStockInvoice[];
    openingDebtInvoices: OpeningDebtInvoice[];
    annualInventoryCounts: AnnualInventoryCount[];
}

export type Action =
  | { type: 'LOGIN'; payload: { username: string; password_hash: string } }
  | { type: 'LOGOUT' }
  | { type: 'ADD_USER'; payload: Omit<User, 'id'> }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'ADD_SALES_RETURN'; payload: SalesReturn }
  | { type: 'ADD_PURCHASE'; payload: Purchase }
  | { type: 'UPDATE_PURCHASE'; payload: Purchase }
  | { type: 'DELETE_PURCHASE'; payload: string }
  | { type: 'CORRUPT_PURCHASE'; payload: string }
  | { type: 'ADD_PURCHASE_RETURN'; payload: PurchaseReturn }
  | { type: 'UPDATE_PURCHASE_RETURN'; payload: PurchaseReturn }
  | { type: 'DELETE_PURCHASE_RETURN'; payload: string }
  | { type: 'ADD_STOCK_ADJUSTMENT'; payload: StockAdjustmentInvoice }
  | { type: 'ADD_STOCKTAKE'; payload: Stocktake }
  | { type: 'ADD_SUPPLIER'; payload: Omit<Supplier, 'id' | 'balance'> }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'ADD_SUPPLIER_PAYMENT'; payload: SupplierPayment }
  | { type: 'DELETE_SUPPLIER_PAYMENT'; payload: string }
  | { type: 'ADD_CUSTOMER_RECEIPT'; payload: CustomerReceipt }
  | { type: 'DELETE_CUSTOMER_RECEIPT'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_EXPENSE_CATEGORY'; payload: string }
  | { type: 'UPDATE_COMPANY_INFO'; payload: CompanyInfo }
  | { type: 'ADD_OPENING_STOCK_INVOICE'; payload: OpeningStockInvoice }
  | { type: 'DELETE_OPENING_STOCK_INVOICE'; payload: string }
  | { type: 'ADD_OPENING_DEBT_INVOICE'; payload: OpeningDebtInvoice }
  | { type: 'DELETE_OPENING_DEBT_INVOICE'; payload: string }
  | { type: 'PERFORM_ANNUAL_INVENTORY_COUNT', payload: { notes: string } }
  | { type: 'REPLACE_STATE'; payload: any };
