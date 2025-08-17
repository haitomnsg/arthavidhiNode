
'use server';
/**
 * @fileOverview An AI flow for creating a bill from a natural language prompt.
 *
 * - createBillFromText - A function that handles parsing the user prompt.
 * - CreateBillFromTextInput - The input type for the function.
 * - CreateBillFromTextOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BillItemSchema = z.object({
  description: z.string().describe('The description of the bill item.'),
  quantity: z.number().describe('The quantity of the bill item.'),
  unit: z.string().describe('The unit of the bill item (e.g., Pcs, Kg, Ltr).'),
  rate: z.number().describe('The rate per unit for the bill item.'),
});

const CreateBillFromTextOutputSchema = z.object({
  clientName: z.string().optional().describe('The name of the client.'),
  clientAddress: z.string().optional().describe('The address of the client.'),
  clientPhone: z.string().optional().describe('The phone number of the client.'),
  items: z.array(BillItemSchema).optional().describe('An array of bill items.'),
});

export type CreateBillFromTextOutput = z.infer<typeof CreateBillFromTextOutputSchema>;

const prompt = ai.definePrompt({
  name: 'createBillPrompt',
  input: { schema: z.string() },
  output: { schema: CreateBillFromTextOutputSchema },
  prompt: `You are an expert billing assistant. Your task is to parse the user's request and extract the necessary information to create a bill.

User Request: {{{prompt}}}

Extract the following details:
- Client Name
- Client Address
- Client Phone
- A list of all items, including their description, quantity, unit, and rate.

Today's date is ${new Date().toLocaleDateString()}. If the user doesn't specify a date, assume it's today.
If any information is missing, leave the corresponding field blank.
Provide the output in the requested JSON format.
`,
});

const createBillFlow = ai.defineFlow(
  {
    name: 'createBillFlow',
    inputSchema: z.string(),
    outputSchema: CreateBillFromTextOutputSchema,
  },
  async (promptText) => {
    const { output } = await prompt(promptText);
    return output!;
  }
);


export async function createBillFromText(promptText: string): Promise<CreateBillFromTextOutput> {
    return await createBillFlow(promptText);
}
