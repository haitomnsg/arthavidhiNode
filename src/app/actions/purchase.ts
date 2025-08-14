
'use server';

import db from '@/lib/db';
import * as z from 'zod';
import { revalidatePath } from 'next/cache';
import type { RowDataPacket, OkPacket } from 'mysql2';
import { getProducts } from './products';

// TODO: Replace with authenticated user ID from session
const getUserId = async () => {
    return 1;
};

// Define interfaces for our data structures
interface Purchase {
    id: number;
    userId: number;
    supplierName: string;
    supplierPhone: string;
    supplierAddress: string | null;
    supplierPan: string | null;
    supplierVat: string | null;
    supplierBillNumber: string;
    purchaseDate: Date;
    remarks: string | null;
    createdAt: Date;
    updatedAt: Date;
    items?: PurchaseItem[];
    totalAmount?: number;
}

interface PurchaseItem {
    id: number;
    purchaseId: number;
    productId: number;
    productName: string;
    quantity: number;
    unit: string;
    rate: number;
}

// Schema for adding a purchase
const purchaseItemSchema = z.object({
  productId: z.coerce.number().min(1, "Product is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  unit: z.string().min(1, "Unit is required."),
  rate: z.coerce.number().min(0, "Rate must be a positive number."),
});

const purchaseFormSchema = z.object({
  supplierName: z.string().min(2, "Supplier name is required."),
  supplierPhone: z.string().min(10, "A valid phone number is required."),
  supplierAddress: z.string().optional(),
  supplierPan: z.string().optional(),
  supplierVat: z.string().optional(),
  supplierBillNumber: z.string().min(1, "Supplier bill number is required."),
  purchaseDate: z.date(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required."),
  remarks: z.string().optional(),
});

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export const createPurchase = async (values: PurchaseFormValues) => {
    const userId = await getUserId();
    const validatedFields = purchaseFormSchema.safeParse(values);

    if (!validatedFields.success) {
        console.error("Validation Errors:", validatedFields.error.flatten());
        return { error: "Invalid fields provided. Please check the form." };
    }

    const { items, ...purchaseDetails } = validatedFields.data;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create the main Purchase record
        const [purchaseResult] = await connection.query<OkPacket>(
            'INSERT INTO `Purchase` (`userId`, `supplierName`, `supplierPhone`, `supplierAddress`, `supplierPan`, `supplierVat`, `supplierBillNumber`, `purchaseDate`, `remarks`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, purchaseDetails.supplierName, purchaseDetails.supplierPhone, purchaseDetails.supplierAddress, purchaseDetails.supplierPan, purchaseDetails.supplierVat, purchaseDetails.supplierBillNumber, purchaseDetails.purchaseDate, purchaseDetails.remarks]
        );
        const newPurchaseId = purchaseResult.insertId;

        // 2. Prepare and insert PurchaseItem records
        const allProductsRes = await getProducts();
        if(!allProductsRes.success) throw new Error("Could not fetch products for validation.");
        const allProducts = allProductsRes.data!;
        const productMap = new Map(allProducts.map(p => [p.id, p]));

        const purchaseItemsData = items.map(item => {
            const product = productMap.get(item.productId);
            if (!product) throw new Error(`Product with ID ${item.productId} not found.`);
            return [newPurchaseId, item.productId, product.name, item.quantity, item.unit, item.rate];
        });

        await connection.query(
            'INSERT INTO `PurchaseItem` (`purchaseId`, `productId`, `productName`, `quantity`, `unit`, `rate`) VALUES ?',
            [purchaseItemsData]
        );

        // 3. Update stock quantity for each product
        for (const item of items) {
            await connection.query(
                'UPDATE `Product` SET `quantity` = `quantity` + ? WHERE `id` = ?',
                [item.quantity, item.productId]
            );
        }

        await connection.commit();
        
        revalidatePath('/dashboard/purchase');
        revalidatePath('/dashboard/products');

        return { success: "Purchase recorded successfully!" };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to create purchase:", error);
        if (error instanceof Error) {
            return { error: `Database Error: ${error.message}` };
        }
        return { error: "Database Error: An unknown error occurred." };
    } finally {
        connection.release();
    }
};

export const getPurchases = async () => {
    const userId = await getUserId();
    try {
        const [purchaseRows] = await db.query<RowDataPacket[]>(`
            SELECT p.*, SUM(pi.quantity * pi.rate) as totalAmount
            FROM Purchase p
            LEFT JOIN PurchaseItem pi ON p.id = pi.purchaseId
            WHERE p.userId = ?
            GROUP BY p.id
            ORDER BY p.purchaseDate DESC, p.createdAt DESC
        `, [userId]);

        return { success: true, data: purchaseRows as Purchase[] };
    } catch (error) {
        console.error("Failed to fetch purchases:", error);
        return { success: false, error: "Database error: Could not fetch purchases." };
    }
};
