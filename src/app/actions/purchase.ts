
'use server';

import db from '@/lib/db';
import * as z from 'zod';
import { revalidatePath } from 'next/cache';
import type { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';

// TODO: Replace with authenticated user ID from session
const getUserId = async () => {
    return 1;
};

const purchaseItemSchema = z.object({
  productId: z.coerce.number().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  rate: z.coerce.number().min(0, "Rate must be a positive number"),
});

const purchaseFormSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  supplierAddress: z.string().optional(),
  supplierPhone: z.string().optional(),
  supplierBillNumber: z.string().min(1, "Supplier bill number is required"),
  purchaseDate: z.date({ required_error: "A purchase date is required." }),
  items: z.array(purchaseItemSchema.extend({ productName: z.string().optional() })).min(1, "At least one item is required"),
  remarks: z.string().optional(),
});

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

const updateInventory = async (connection: PoolConnection, items: z.infer<typeof purchaseItemSchema>[], userId: number) => {
    for (const item of items) {
        await connection.query(
            'UPDATE `Product` SET `quantity` = `quantity` + ? WHERE `id` = ? AND `userId` = ?',
            [item.quantity, item.productId, userId]
        );
    }
};

export const createPurchase = async (values: PurchaseFormValues): Promise<{ success?: string; error?: string; }> => {
    const validatedFields = purchaseFormSchema.safeParse(values);

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten());
        return { error: "Invalid fields!" };
    }

    const { items, ...purchaseDetails } = validatedFields.data;
    const userId = await getUserId();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [purchaseResult] = await connection.query<OkPacket>(
            'INSERT INTO `Purchase` (`userId`, `supplierName`, `supplierAddress`, `supplierPhone`, `supplierBillNumber`, `purchaseDate`, `remarks`) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, purchaseDetails.supplierName, purchaseDetails.supplierAddress, purchaseDetails.supplierPhone, purchaseDetails.supplierBillNumber, purchaseDetails.purchaseDate, purchaseDetails.remarks]
        );
        const newPurchaseId = purchaseResult.insertId;

        if (!newPurchaseId) {
            throw new Error("Failed to create purchase record.");
        }

        const purchaseItemsData = items.map(item => [
            newPurchaseId,
            item.productId,
            item.quantity,
            item.rate
        ]);

        await connection.query(
            'INSERT INTO `PurchaseItem` (`purchaseId`, `productId`, `quantity`, `rate`) VALUES ?',
            [purchaseItemsData]
        );
        
        await updateInventory(connection, items, userId);

        await connection.commit();
        
        revalidatePath('/dashboard/purchase');
        revalidatePath('/dashboard/products');
        
        return { success: "Purchase recorded and inventory updated successfully!" };

    } catch (error) {
        await connection.rollback();
        console.error("Failed to create purchase:", error);
        return { error: "Database Error: Failed to record purchase." };
    } finally {
        connection.release();
    }
}

export const getAllPurchases = async () => {
    const userId = await getUserId();
    try {
        const [rows] = await db.query<RowDataPacket[]>(
            'SELECT `id`, `supplierBillNumber`, `supplierName`, `purchaseDate` FROM `Purchase` WHERE `userId` = ? ORDER BY `purchaseDate` DESC, `createdAt` DESC',
            [userId]
        );
        return { success: true, data: rows };
    } catch (error) {
        console.error("Failed to fetch purchases:", error);
        return { error: "Database Error: Could not fetch purchases." };
    }
};
