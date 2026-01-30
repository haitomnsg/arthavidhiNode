
'use server';
/**
 * @fileOverview An AI flow for creating a bill from a natural language prompt.
 * 
 * NOTE: AI features are disabled for cPanel deployment to reduce resource usage.
 * To enable, reinstall @genkit-ai/googleai and genkit packages.
 */

import { z } from 'zod';

const BillItemSchema = z.object({
  description: z.string().optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  rate: z.number().optional(),
});

const CreateBillFromTextOutputSchema = z.object({
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  items: z.array(BillItemSchema).optional(),
});

export type CreateBillFromTextOutput = z.infer<typeof CreateBillFromTextOutputSchema>;

/**
 * AI bill creation is disabled for cPanel deployment.
 * This function returns an error message instead.
 */
export async function createBillFromText(_promptText: string): Promise<CreateBillFromTextOutput> {
  console.warn('AI features are disabled. createBillFromText called but returning empty result.');
  return {
    clientName: undefined,
    clientAddress: undefined,
    clientPhone: undefined,
    items: [],
  };
}
