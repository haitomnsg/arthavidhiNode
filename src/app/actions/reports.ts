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
