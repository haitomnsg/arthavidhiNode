
'use server';

import db from '@/lib/db';
import * as z from 'zod';
import { revalidatePath } from 'next/cache';
import type { RowDataPacket, OkPacket } from 'mysql2';

// TODO: Replace with authenticated user ID from session
const getUserId = async () => {
    return 1;
};

// Interface for Product Category data
interface ProductCategory {
    id: number;
    userId: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

// Interface for Product data
interface Product {
    id: number;
    userId: number;
    categoryId: number;
    name: string;
    quantity: number;
    rate: number;
    photoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Zod schema for Product Category
const productCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Category name is required."),
});

// Zod schema for Product
const productSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Product name is required."),
    categoryId: z.coerce.number().min(1, "Category is required."),
    quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
    rate: z.coerce.number().min(0, "Rate cannot be negative."),
    photoUrl: z.string().url("Please enter a valid URL.").or(z.literal("")).optional(),
});


// ====== CATEGORY ACTIONS ======

export const getProductCategories = async () => {
    const userId = await getUserId();
    try {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM `ProductCategory` WHERE `userId` = ? ORDER BY `name` ASC', [userId]);
        return { success: true, data: rows as ProductCategory[] };
    } catch (error) {
        console.error("Failed to fetch product categories:", error);
        return { success: false, error: "Database Error: Could not fetch categories." };
    }
};

export const upsertProductCategory = async (values: z.infer<typeof productCategorySchema>) => {
    const validatedFields = productCategorySchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: "Invalid fields provided." };
    }
    const { id, name } = validatedFields.data;
    const userId = await getUserId();

    try {
        if (id) {
            await db.query(
                'UPDATE `ProductCategory` SET `name` = ? WHERE `id` = ? AND `userId` = ?',
                [name, id, userId]
            );
        } else {
            await db.query(
                'INSERT INTO `ProductCategory` (`userId`, `name`) VALUES (?, ?)',
                [userId, name]
            );
        }
        revalidatePath('/dashboard/products');
        return { success: id ? "Category updated successfully." : "Category added successfully." };
    } catch (error) {
        console.error("Failed to upsert category:", error);
        return { error: "Database Error: Could not save the category." };
    }
};

export const deleteProductCategory = async (id: number) => {
    const userId = await getUserId();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // Check if any products are using this category
        const [products] = await connection.query<RowDataPacket[]>('SELECT `id` FROM `Product` WHERE `categoryId` = ? AND `userId` = ?', [id, userId]);
        if (products.length > 0) {
            await connection.rollback();
            return { error: "Cannot delete category as it is currently in use by products." };
        }

        const [result] = await connection.query<OkPacket>('DELETE FROM `ProductCategory` WHERE `id` = ? AND `userId` = ?', [id, userId]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return { error: "Category not found or you do not have permission to delete it." };
        }
        
        await connection.commit();
        revalidatePath('/dashboard/products');
        return { success: "Category deleted successfully." };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to delete category:", error);
        return { error: "Database Error: Could not delete the category." };
    } finally {
        connection.release();
    }
};


// ====== PRODUCT ACTIONS ======

export const getProducts = async () => {
    const userId = await getUserId();
    try {
        const query = `
            SELECT p.*, pc.name as categoryName 
            FROM Product p
            JOIN ProductCategory pc ON p.categoryId = pc.id
            WHERE p.userId = ? 
            ORDER BY p.name ASC
        `;
        const [rows] = await db.query<RowDataPacket[]>(query, [userId]);
        return { success: true, data: rows as (Product & { categoryName: string })[] };
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return { success: false, error: "Database Error: Could not fetch products." };
    }
};

export const upsertProduct = async (values: z.infer<typeof productSchema>) => {
    const validatedFields = productSchema.safeParse(values);
    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten());
        return { error: "Invalid fields provided." };
    }
    const { id, name, categoryId, quantity, rate, photoUrl } = validatedFields.data;
    const userId = await getUserId();

    try {
        if (id) {
            await db.query(
                'UPDATE `Product` SET `name` = ?, `categoryId` = ?, `quantity` = ?, `rate` = ?, `photoUrl` = ? WHERE `id` = ? AND `userId` = ?',
                [name, categoryId, quantity, rate, photoUrl || null, id, userId]
            );
        } else {
            await db.query(
                'INSERT INTO `Product` (`userId`, `name`, `categoryId`, `quantity`, `rate`, `photoUrl`) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, name, categoryId, quantity, rate, photoUrl || null]
            );
        }
        revalidatePath('/dashboard/products');
        return { success: id ? "Product updated successfully." : "Product added successfully." };
    } catch (error) {
        console.error("Failed to upsert product:", error);
        return { error: "Database Error: Could not save the product." };
    }
};

export const deleteProduct = async (id: number) => {
    const userId = await getUserId();
    try {
        const [result] = await db.query<OkPacket>('DELETE FROM `Product` WHERE `id` = ? AND `userId` = ?', [id, userId]);
        if (result.affectedRows === 0) {
            return { error: "Product not found or you do not have permission to delete it." };
        }
        revalidatePath('/dashboard/products');
        return { success: "Product deleted successfully." };
    } catch (error) {
        console.error("Failed to delete product:", error);
        return { error: "Database Error: Could not delete the product." };
    }
};
