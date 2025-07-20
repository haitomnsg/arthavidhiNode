
'use server';

import db from '@/lib/db';
import * as z from 'zod';
import { revalidatePath } from 'next/cache';
import type { RowDataPacket, OkPacket } from 'mysql2';

interface Quotation {
    id: number;
    userId: number;
    quotationNumber: string;
    clientName: string;
    clientAddress: string;
    clientPhone: string;
    clientPanNumber: string | null;
    clientVatNumber: string | null;
    quotationDate: Date;
    remarks: string | null;
    createdAt: Date;
    updatedAt: Date;
    items?: QuotationItem[];
}

interface QuotationItem {
    id: number;
    quotationId: number;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    createdAt: Date;
    updatedAt: Date;
}


const quotationItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required."),
  rate: z.coerce.number().min(0, "Rate must be a positive number"),
});

const quotationFormSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  clientPhone: z.string().min(1, "Client phone is required"),
  panNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  quotationDate: z.date(),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  remarks: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

export const getNextQuotationNumber = async (): Promise<string> => {
    try {
        const [lastQuotationRows] = await db.query<RowDataPacket[]>(
            'SELECT `quotationNumber` FROM `Quotation` ORDER BY `id` DESC LIMIT 1'
        );

        if (lastQuotationRows.length > 0 && lastQuotationRows[0].quotationNumber.startsWith('QN-')) {
            const lastNum = parseInt(lastQuotationRows[0].quotationNumber.substring(3), 10);
            return `QN-${String(lastNum + 1).padStart(4, '0')}`;
        } else {
            return 'QN-0001';
        }
    } catch (error) {
        console.error("Failed to fetch next quotation number:", error);
        return 'QN-ERROR';
    }
};


export const createQuotation = async (values: QuotationFormValues): Promise<{ success?: string; error?: string; data?: any; }> => {
    const validatedFields = quotationFormSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const {
        items,
        panNumber,
        vatNumber,
        ...quotationDetails
    } = validatedFields.data;

    // TODO: Replace with authenticated user ID from session
    const userId = 1; 

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const quotationNumber = await getNextQuotationNumber();
        if (quotationNumber === 'QN-ERROR') {
            throw new Error("Could not generate a quotation number.");
        }

        const [quotationResult] = await connection.query<OkPacket>(
            'INSERT INTO `Quotation` (`clientName`, `clientAddress`, `clientPhone`, `clientPanNumber`, `clientVatNumber`, `quotationDate`, `userId`, `quotationNumber`, `remarks`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [quotationDetails.clientName, quotationDetails.clientAddress, quotationDetails.clientPhone, panNumber, vatNumber, quotationDetails.quotationDate, userId, quotationNumber, quotationDetails.remarks]
        );
        const newQuotationId = quotationResult.insertId;

        if (!newQuotationId) {
            throw new Error("Failed to create quotation.");
        }

        const quotationItemsData = items.map(item => [
            newQuotationId,
            item.description,
            item.quantity,
            item.unit,
            item.rate
        ]);

        await connection.query(
            'INSERT INTO `QuotationItem` (`quotationId`, `description`, `quantity`, `unit`, `rate`) VALUES ?',
            [quotationItemsData]
        );

        await connection.commit();
        
        revalidatePath('/dashboard/quotations');

        const pdfDataResponse = await getQuotationDetails(newQuotationId);

        if (pdfDataResponse.error) {
             return { error: pdfDataResponse.error };
        }
        
        return { 
            success: "Quotation saved successfully!",
            data: pdfDataResponse.data
        };
    } catch (error) {
        await connection.rollback();
        console.error("Failed to create quotation:", error);
        return { error: "Database Error: Failed to create quotation." };
    } finally {
        connection.release();
    }
}

export const getAllQuotations = async () => {
    try {
        const [quotations] = await db.query<RowDataPacket[]>('SELECT * FROM `Quotation` ORDER BY `createdAt` DESC');
        const quotationsData = quotations as Quotation[];

        if (quotationsData.length === 0) {
            return { success: true, data: [] };
        }

        const quotationIds = quotationsData.map(q => q.id);
        const [items] = await db.query<RowDataPacket[]>('SELECT * FROM `QuotationItem` WHERE `quotationId` IN (?)', [quotationIds]);
        const itemsData = items as QuotationItem[];

        const itemsByQuotationId = itemsData.reduce((acc, item) => {
            (acc[item.quotationId] = acc[item.quotationId] || []).push(item);
            return acc;
        }, {} as Record<number, QuotationItem[]>);

        const quotationsWithTotals = quotationsData.map(quotation => {
            const quotationItems = itemsByQuotationId[quotation.id] || [];
            const subtotal = quotationItems.reduce((acc, item) => acc + item.quantity * item.rate, 0);
            const vat = subtotal * 0.13;
            const total = subtotal + vat;

            return {
                id: quotation.id,
                quotationNumber: quotation.quotationNumber,
                clientName: quotation.clientName,
                quotationDate: quotation.quotationDate,
                amount: total,
            };
        });

        return { success: true, data: quotationsWithTotals };
    } catch (error) {
        console.error("Failed to fetch quotations:", error);
        return { success: false, error: "Database Error: Failed to fetch quotations." };
    }
};

export const getQuotationDetails = async (quotationId: number): Promise<{ success?: boolean; error?: string; data?: any; }> => {
    try {
        const [quotationRows] = await db.query<RowDataPacket[]>('SELECT * FROM `Quotation` WHERE `id` = ?', [quotationId]);
        
        if (quotationRows.length === 0) {
            return { error: "Quotation not found." };
        }
        
        const quotation = quotationRows[0] as Quotation;

        const [itemRows] = await db.query<RowDataPacket[]>('SELECT * FROM `QuotationItem` WHERE `quotationId` = ?', [quotationId]);
        quotation.items = (itemRows as QuotationItem[]).map(item => ({
            ...item,
            rate: Number(item.rate) || 0,
            quantity: Number(item.quantity) || 0,
        }));

        const [companyRows] = await db.query<RowDataPacket[]>('SELECT * FROM `Company` WHERE `userId` = ?', [quotation.userId]);
        const company = companyRows[0] || {};

        const subtotal = quotation.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
        const vat = subtotal * 0.13;
        const total = subtotal + vat;

        const totals = { subtotal, vat, total };

        return { 
            success: true,
            data: { quotation, company, totals } 
        };

    } catch (error) {
        console.error(`Failed to get quotation data (ID: ${quotationId}):`, error);
        return { error: "Database Error: Failed to retrieve quotation data." };
    }
}


export const deleteQuotation = async (quotationId: number): Promise<{ success?: string; error?: string; }> => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM `QuotationItem` WHERE `quotationId` = ?', [quotationId]);
        await connection.query('DELETE FROM `Quotation` WHERE `id` = ?', [quotationId]);
        await connection.commit();

        revalidatePath('/dashboard/quotations');
        
        return { success: "Quotation deleted successfully." };
    } catch (error) {
        await connection.rollback();
        console.error(`Failed to delete quotation ${quotationId}:`, error);
        return { error: "Database Error: Failed to delete quotation." };
    } finally {
        connection.release();
    }
};

const updateQuotationFormSchema = quotationFormSchema.extend({
  quotationId: z.number(),
});

export type UpdateQuotationFormValues = z.infer<typeof updateQuotationFormSchema>;

export const updateQuotation = async (values: UpdateQuotationFormValues): Promise<{ success?: string; error?: string; }> => {
    const validatedFields = updateQuotationFormSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const {
        quotationId,
        items,
        panNumber,
        vatNumber,
        ...quotationDetails
    } = validatedFields.data;

    // TODO: Replace with authenticated user ID from session
    const userId = 1;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [updateResult] = await connection.query<OkPacket>(
            'UPDATE `Quotation` SET `clientName` = ?, `clientAddress` = ?, `clientPhone` = ?, `clientPanNumber` = ?, `clientVatNumber` = ?, `quotationDate` = ?, `remarks` = ? WHERE `id` = ? AND `userId` = ?',
            [quotationDetails.clientName, quotationDetails.clientAddress, quotationDetails.clientPhone, panNumber, vatNumber, quotationDetails.quotationDate, quotationDetails.remarks, quotationId, userId]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error("Quotation not found or user not authorized to update.");
        }
        
        await connection.query('DELETE FROM `QuotationItem` WHERE `quotationId` = ?', [quotationId]);

        if (items.length > 0) {
            const quotationItemsData = items.map(item => [
                quotationId,
                item.description,
                item.quantity,
                item.unit,
                item.rate
            ]);
            await connection.query(
                'INSERT INTO `QuotationItem` (`quotationId`, `description`, `quantity`, `unit`, `rate`) VALUES ?',
                [quotationItemsData]
            );
        }

        await connection.commit();
        
        revalidatePath(`/dashboard/quotations/${quotationId}`);
        revalidatePath('/dashboard/quotations');
        
        return { success: "Quotation updated successfully!" };

    } catch (error) {
        await connection.rollback();
        console.error("Failed to update quotation:", error);
        return { error: "Database Error: Failed to update quotation." };
    } finally {
        connection.release();
    }
}
