
'use server';

import db from '@/lib/db';
import * as z from 'zod';
import { revalidatePath } from 'next/cache';
import type { RowDataPacket, OkPacket } from 'mysql2';
import type { ExpenseFormValues } from '@/app/dashboard/expenses/page'; // Import type from client component

// TODO: Replace with authenticated user ID from session
const getUserId = async () => {
    return 1;
};

// Interface for Expense data
interface Expense {
    id: number;
    userId: number;
    category: string;
    description: string | null;
    amount: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Zod schema is now in the page.tsx file
export const expenseFormSchema = z.object({
  id: z.number().optional(), // For updates
  category: z.string().min(1, "Category is required."),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  date: z.date({ required_error: "A date for the expense is required." }),
  description: z.string().optional(),
});


// Action to get all expenses for the user
export const getExpenses = async () => {
    const userId = await getUserId();
    try {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM `Expense` WHERE `userId` = ? ORDER BY `date` DESC', [userId]);
        return { success: true, data: rows as Expense[] };
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        return { success: false, error: "Database Error: Could not fetch expenses." };
    }
};

// Action to add or update an expense
export const upsertExpense = async (values: ExpenseFormValues) => {
    const validatedFields = expenseFormSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: "Invalid fields provided." };
    }
    const { id, category, amount, date, description } = validatedFields.data;
    const userId = await getUserId();

    try {
        if (id) {
            // Update existing expense
            await db.query(
                'UPDATE `Expense` SET `category` = ?, `amount` = ?, `date` = ?, `description` = ? WHERE `id` = ? AND `userId` = ?',
                [category, amount, date, description, id, userId]
            );
        } else {
            // Insert new expense
            await db.query(
                'INSERT INTO `Expense` (`userId`, `category`, `amount`, `date`, `description`) VALUES (?, ?, ?, ?, ?)',
                [userId, category, amount, date, description]
            );
        }
        revalidatePath('/dashboard/expenses');
        return { success: id ? "Expense updated successfully." : "Expense added successfully." };
    } catch (error) {
        console.error("Failed to upsert expense:", error);
        return { error: "Database Error: Could not save the expense." };
    }
};

// Action to delete an expense
export const deleteExpense = async (id: number) => {
    const userId = await getUserId();
    try {
        const [result] = await db.query<OkPacket>('DELETE FROM `Expense` WHERE `id` = ? AND `userId` = ?', [id, userId]);
        if (result.affectedRows === 0) {
            return { error: "Expense not found or you do not have permission to delete it." };
        }
        revalidatePath('/dashboard/expenses');
        return { success: "Expense deleted successfully." };
    } catch (error) {
        console.error("Failed to delete expense:", error);
        return { error: "Database Error: Could not delete the expense." };
    }
};

// Action to get expense stats
export const getExpenseStats = async () => {
    const userId = await getUserId();
    try {
        // Total expenses this month
        const [monthlyResult] = await db.query<RowDataPacket[]>(
            "SELECT SUM(amount) as total FROM `Expense` WHERE `userId` = ? AND MONTH(`date`) = MONTH(CURDATE()) AND YEAR(`date`) = YEAR(CURDATE())",
            [userId]
        );
        const totalThisMonth = monthlyResult[0].total || 0;

        // Total expenses all time
        const [totalResult] = await db.query<RowDataPacket[]>(
             "SELECT SUM(amount) as total FROM `Expense` WHERE `userId` = ?",
             [userId]
        );
        const totalAllTime = totalResult[0].total || 0;
        
        // Expenses by category this month
        const [categoryResult] = await db.query<RowDataPacket[]>(
            "SELECT `category`, SUM(`amount`) as total FROM `Expense` WHERE `userId` = ? AND MONTH(`date`) = MONTH(CURDATE()) AND YEAR(`date`) = YEAR(CURDATE()) GROUP BY `category` ORDER BY total DESC",
            [userId]
        );

        return {
            success: true,
            data: {
                totalThisMonth: parseFloat(totalThisMonth),
                totalAllTime: parseFloat(totalAllTime),
                byCategory: categoryResult as { category: string; total: number; }[]
            }
        };
    } catch (error) {
        console.error("Failed to fetch expense stats:", error);
        return { success: false, error: "Database Error: Could not fetch stats." };
    }
}
