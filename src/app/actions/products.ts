
'use server';

import db from '@/lib/db';
import * as z from 'zod';
import { revalidatePath } from 'next/cache';
import type { RowDataPacket, OkPacket } from 'mysql2';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';


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

const MAX_FILE_SIZE = 1024 * 1024 * 1; // 1MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];

// Zod schema for Product
const productSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Product name is required."),
    categoryId: z.coerce.number().min(1, "Category is required."),
    quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
    rate: z.coerce.number().min(0, "Rate cannot be negative."),
    photo: z
      .any()
      .refine((file) => {
        if (!file || !(file instanceof File)) return true; // Not a new file, so skip validation
        return file.size <= MAX_FILE_SIZE;
      }, `Max file size is 1MB.`)
      .refine((file) => {
        if (!file || !(file instanceof File)) return true;
        return ACCEPTED_IMAGE_TYPES.includes(file.type);
      }, "Only .jpg and .png formats are supported.")
      .optional(),
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

export const upsertProduct = async (formData: FormData) => {
    const values = Object.fromEntries(formData.entries());

    const validatedFields = productSchema.safeParse({
        ...values,
        id: values.id ? Number(values.id) : undefined,
        categoryId: Number(values.categoryId),
        quantity: Number(values.quantity),
        rate: Number(values.rate),
        photo: values.photo,
    });

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten());
        return { error: "Invalid fields provided." };
    }
    
    const { id, name, categoryId, quantity, rate, photo } = validatedFields.data;
    const userId = await getUserId();

    let photoUrl = values.currentPhotoUrl as string || null;

    if (photo && photo instanceof File && photo.size > 0) {
        try {
            const bytes = await photo.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileExtension = photo.name.split('.').pop();
            const uniqueFilename = `${randomUUID()}.${fileExtension}`;
            const path = join(process.cwd(), 'public', 'uploads', 'products', uniqueFilename);
            
            // Ensure the directory exists. This is a good practice but might require `fs/promises` `mkdir`.
            // For simplicity, we assume 'public/uploads/products' exists.
            // You can create it manually or add `await mkdir(dirname(path), { recursive: true });`
            
            await writeFile(path, buffer);
            photoUrl = `/uploads/products/${uniqueFilename}`; // The public URL path
        } catch (e) {
            console.error("File upload error:", e);
            return { error: "Failed to save the photo." };
        }
    }


    try {
        if (id) {
            await db.query(
                'UPDATE `Product` SET `name` = ?, `categoryId` = ?, `quantity` = ?, `rate` = ?, `photoUrl` = ? WHERE `id` = ? AND `userId` = ?',
                [name, categoryId, quantity, rate, photoUrl, id, userId]
            );
        } else {
            await db.query(
                'INSERT INTO `Product` (`userId`, `name`, `categoryId`, `quantity`, `rate`, `photoUrl`) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, name, categoryId, quantity, rate, photoUrl]
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
