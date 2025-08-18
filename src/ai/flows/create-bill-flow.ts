
'use server';
/**
 * @fileOverview An AI flow for creating a bill from a natural language prompt.
 *
 * - createBillFromText - A function that handles parsing the user prompt.
 * - CreateBillFromTextInput - The input type for the function.
 * - CreateBillFromTextOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BillItemSchema = z.object({
  description: z.string().optional().describe('The description of the bill item.'),
  quantity: z.number().optional().describe('The quantity of the bill item.'),
  unit: z.string().optional().describe('The unit of the bill item (e.g., Pcs, Kg, Ltr).'),
  rate: z.number().optional().describe('The rate per unit for the bill item.'),
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
  prompt: `You are a world-class billing assistant AI. Your primary task is to accurately parse a user's natural language request and extract structured information to pre-fill a bill.

You must meticulously analyze the user's text to identify the following details:
- Client's Name
- Client's Address
- Client's Phone Number
- A list of all billable items. For each item, you must extract:
    - A description of the item or service.
    - The quantity.
    - The unit of measurement (e.g., 'Pcs', 'Kg', 'Ltr', 'Hours').
    - The rate (price) per unit.

IMPORTANT RULES:
1.  **Do Not Invent Information**: If a piece of information (like an address or phone number) is not present in the user's request, you MUST return a null, undefined, or empty string for that field. Do not guess or create data.
2.  **Handle Ambiguity Gracefully**: If a detail is unclear, prioritize leaving the field blank over providing potentially incorrect information.
3.  **Default Values**: If the user provides a quantity but no unit, default the unit to 'Pcs'. If the user provides an item but no quantity, default the quantity to 1.
4.  **Currency**: Assume all monetary values are in Nepalese Rupees (Rs.). Do not include the currency symbol in the 'rate' field, which must be a number.

Here are some examples of how to handle requests:

User Request: "make a bill for Arti Technologies, phone number 9800000000, with product being the cctv camera 4 for 4000 rs each"
Your Output (JSON):
{
  "clientName": "Arti Technologies",
  "clientPhone": "9800000000",
  "clientAddress": null,
  "items": [
    {
      "description": "CCTV Camera",
      "quantity": 4,
      "unit": "Pcs",
      "rate": 4000
    }
  ]
}

User Request: "Client is Ram Bahadur from Pokhara. He bought a widget for 500."
Your Output (JSON):
{
  "clientName": "Ram Bahadur",
  "clientAddress": "Pokhara",
  "clientPhone": null,
  "items": [
    {
      "description": "Widget",
      "quantity": 1,
      "unit": "Pcs",
      "rate": 500
    }
  ]
}

User Request: "new bill for 2 batteries at 1500 each and one charger for 800"
Your Output (JSON):
{
    "clientName": null,
    "clientAddress": null,
    "clientPhone": null,
    "items": [
        {
            "description": "Battery",
            "quantity": 2,
            "unit": "Pcs",
            "rate": 1500
        },
        {
            "description": "Charger",
            "quantity": 1,
            "unit": "Pcs",
            "rate": 800
        }
    ]
}

Now, process the following user request.

User Request: {{{prompt}}}

Provide the extracted information in the requested JSON format.
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
