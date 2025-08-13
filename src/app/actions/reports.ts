'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { format } from 'date-fns';

// TODO: Replace with authenticated user ID from session
const getUserId = async () => {
    return 1;
};

interface Bill {
    id: number;
    invoiceNumber: string;
    clientName: string;
    billDate: Date;
    discount: number;
    status: string;
    items?: BillItem[];
}

interface BillItem {
    id: number;
    billId: number;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
}

interface Expense {
    id: number;
    category: string;
    description: string | null;
    amount: number;
    date: Date;
}

interface Purchase {
    id: number;
    supplierName: string;
    purchaseDate: Date;
    items?: PurchaseItem[];
}

interface PurchaseItem {
    id: number;
    purchaseId: number;
    productId: number;
    quantity: number;
    rate: number;
    productName?: string;
}

export const getSalesReport = async (startDate: Date, endDate: Date) => {
    const userId = await getUserId();
    try {
        const [bills] = await db.query<RowDataPacket[]>(
            `SELECT * FROM Bill WHERE userId = ? AND billDate BETWEEN ? AND ?`,
            [userId, startDate, endDate]
        );
        
        const billIds = (bills as Bill[]).map(b => b.id);
        
        if (billIds.length === 0) {
            return {
                success: true,
                data: {
                    summary: { totalRevenue: 0, totalDiscount: 0, totalVat: 0, totalBills: 0 },
                    bills: []
                }
            };
        }

        const [items] = await db.query<RowDataPacket[]>(
            `SELECT * FROM BillItem WHERE billId IN (?)`,
            [billIds]
        );

        const itemsByBillId = (items as BillItem[]).reduce((acc, item) => {
            (acc[item.billId] = acc[item.billId] || []).push(item);
            return acc;
        }, {} as Record<number, BillItem[]>);

        let totalRevenue = 0;
        let totalDiscount = 0;
        let totalVat = 0;

        const processedBills = (bills as Bill[]).map(bill => {
            const billItems = itemsByBillId[bill.id] || [];
            const subtotal = billItems.reduce((acc, item) => acc + item.quantity * item.rate, 0);
            const discount = Number(bill.discount) || 0;
            const subtotalAfterDiscount = subtotal - discount;
            const vat = subtotalAfterDiscount * 0.13;
            const total = subtotalAfterDiscount + vat;

            totalRevenue += total;
            totalDiscount += discount;
            totalVat += vat;

            return {
                ...bill,
                billDate: format(new Date(bill.billDate), 'PPP'),
                amount: total.toFixed(2),
            };
        });

        const summary = {
            totalRevenue,
            totalDiscount,
            totalVat,
            totalBills: bills.length,
        };

        return { success: true, data: { summary, bills: processedBills } };

    } catch (error) {
        console.error("Failed to generate sales report:", error);
        return { error: "Database Error: Could not generate sales report." };
    }
};

export const getExpenseReport = async (startDate: Date, endDate: Date) => {
     const userId = await getUserId();
    try {
        const [expenses] = await db.query<RowDataPacket[]>(
            'SELECT * FROM `Expense` WHERE `userId` = ? AND `date` BETWEEN ? AND ? ORDER BY `date` ASC',
            [userId, startDate, endDate]
        );
        
        let totalExpenses = 0;
        const processedExpenses = (expenses as Expense[]).map(exp => {
            totalExpenses += Number(exp.amount);
            return {
                ...exp,
                date: format(new Date(exp.date), 'PPP'),
                amount: Number(exp.amount).toFixed(2),
            }
        });

        return { success: true, data: { expenses: processedExpenses, totalExpenses } };
    } catch (error) {
        console.error("Failed to generate expense report:", error);
        return { error: "Database Error: Could not generate expense report." };
    }
}

export const getPurchaseReport = async (startDate: Date, endDate: Date) => {
    const userId = await getUserId();
    try {
        const [purchases] = await db.query<RowDataPacket[]>(
            `SELECT * FROM Purchase WHERE userId = ? AND purchaseDate BETWEEN ? AND ?`,
            [userId, startDate, endDate]
        );
        
        const purchaseIds = (purchases as Purchase[]).map(p => p.id);

        if (purchaseIds.length === 0) {
            return {
                success: true,
                data: {
                    summary: { totalCost: 0, totalItems: 0, totalPurchases: 0 },
                    purchases: []
                }
            };
        }

        const [items] = await db.query<RowDataPacket[]>(
            `SELECT pi.*, p.name as productName FROM PurchaseItem pi JOIN Product p ON pi.productId = p.id WHERE pi.purchaseId IN (?)`,
            [purchaseIds]
        );

        const itemsByPurchaseId = (items as PurchaseItem[]).reduce((acc, item) => {
            (acc[item.purchaseId] = acc[item.purchaseId] || []).push(item);
            return acc;
        }, {} as Record<number, PurchaseItem[]>);

        let totalCost = 0;
        let totalItems = 0;

        const processedPurchases = (purchases as Purchase[]).map(purchase => {
            const purchaseItems = itemsByPurchaseId[purchase.id] || [];
            const purchaseTotal = purchaseItems.reduce((acc, item) => acc + item.quantity * Number(item.rate), 0);
            const itemsCount = purchaseItems.reduce((acc, item) => acc + item.quantity, 0);

            totalCost += purchaseTotal;
            totalItems += itemsCount;

            return {
                ...purchase,
                purchaseDate: format(new Date(purchase.purchaseDate), 'PPP'),
                amount: purchaseTotal.toFixed(2),
                itemCount: itemsCount
            };
        });

        const summary = {
            totalCost,
            totalItems,
            totalPurchases: purchases.length,
        };

        return { success: true, data: { summary, purchases: processedPurchases } };

    } catch (error) {
        console.error("Failed to generate purchase report:", error);
        return { error: "Database Error: Could not generate purchase report." };
    }
};


export const getProfitLossReport = async (startDate: Date, endDate: Date) => {
    try {
        const [sales, expenses, purchases] = await Promise.all([
            getSalesReport(startDate, endDate),
            getExpenseReport(startDate, endDate),
            getPurchaseReport(startDate, endDate),
        ]);

        if (sales.error || expenses.error || purchases.error) {
            return { error: "Failed to gather data for P&L report." };
        }

        const totalRevenue = sales.data?.summary.totalRevenue || 0;
        const totalPurchases = purchases.data?.summary.totalCost || 0;
        const totalExpenses = expenses.data?.totalExpenses || 0;

        const grossProfit = totalRevenue - totalPurchases;
        const netProfit = grossProfit - totalExpenses;

        return {
            success: true,
            data: {
                totalRevenue,
                totalPurchases,
                totalExpenses,
                grossProfit,
                netProfit
            }
        };

    } catch (error) {
        console.error("Failed to generate P&L report:", error);
        return { error: "Database Error: Could not generate P&L report." };
    }
};

