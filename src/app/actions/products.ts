
'use server';

import db from '@/lib/db';
import * as z from 'zod';
import { revalidatePath } from 'next/cache';
import type { RowDataPacket, OkPacket } from 'mysql2';
import { writeFile, mkdir } from 'fs/promises';
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
export interface Product {
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
        if (!file || !(file instanceof File) || file.size === 0) return true;
        return file.size <= MAX_FILE_SIZE;
      }, `Max file size is 1MB.`)
      .refine((file) => {
        if (!file || !(file instanceof File) || file.size === 0) return true;
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
    console.log("DEBUG: Raw form values received:", values);

    const validatedFields = productSchema.safeParse({
        ...values,
        id: values.id ? Number(values.id) : undefined,
        categoryId: Number(values.categoryId),
        quantity: Number(values.quantity),
        rate: Number(values.rate),
        photo: values.photo,
    });

    if (!validatedFields.success) {
        console.error("DEBUG: Zod validation failed:", validatedFields.error.flatten());
        return { error: "Invalid fields provided. Check server logs for details." };
    }
    
    const { id, name, categoryId, quantity, rate, photo } = validatedFields.data;
    console.log("DEBUG: Validated data:", { id, name, categoryId, quantity, rate });
    console.log("DEBUG: Photo object type:", photo instanceof File ? 'File' : typeof photo);
    if(photo instanceof File) {
        console.log("DEBUG: Photo details:", { name: photo.name, size: photo.size, type: photo.type });
    }
    
    const userId = await getUserId();
    let photoUrl = values.currentPhotoUrl as string || null;

    if (photo && photo instanceof File && photo.size > 0) {
        console.log("DEBUG: Attempting to upload new photo...");
        try {
            const bytes = await photo.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileExtension = photo.name.split('.').pop();
            const uniqueFilename = `${randomUUID()}.${fileExtension}`;
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
            const path = join(uploadDir, uniqueFilename);
            
            console.log(`DEBUG: Target upload directory: ${uploadDir}`);
            console.log(`DEBUG: Full file path: ${path}`);
            
            await mkdir(uploadDir, { recursive: true });
            console.log("DEBUG: Directory exists or was created.");
            
            await writeFile(path, buffer);
            console.log("DEBUG: File written to disk successfully.");
            
            photoUrl = `/uploads/products/${uniqueFilename}`;
            console.log(`DEBUG: New photoUrl: ${photoUrl}`);

        } catch (e) {
            console.error("DEBUG: File upload error:", e);
            return { error: "Failed to save the photo. See server logs." };
        }
    } else {
        console.log("DEBUG: No new photo to upload, keeping existing one:", photoUrl);
    }


    try {
        if (id) {
            console.log(`DEBUG: Updating product with ID: ${id}`);
            await db.query(
                'UPDATE `Product` SET `name` = ?, `categoryId` = ?, `quantity` = ?, `rate` = ?, `photoUrl` = ? WHERE `id` = ? AND `userId` = ?',
                [name, categoryId, quantity, rate, photoUrl, id, userId]
            );
        } else {
            console.log("DEBUG: Inserting new product.");
            await db.query(
                'INSERT INTO `Product` (`userId`, `name`, `categoryId`, `quantity`, `rate`, `photoUrl`) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, name, categoryId, quantity, rate, photoUrl]
            );
        }
        revalidatePath('/dashboard/products');
        revalidatePath('/dashboard/purchase');
        console.log("DEBUG: Database operation successful and path revalidated.");
        return { success: id ? "Product updated successfully." : "Product added successfully." };
    } catch (error) {
        console.error("DEBUG: Database error:", error);
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

    