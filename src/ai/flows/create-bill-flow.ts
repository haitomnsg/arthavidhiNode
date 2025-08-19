
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
  prompt: `You are an expert billing assistant. Your task is to extract structured information from a user's request and return it ONLY as a JSON object. Do not provide any conversational text or explanations.

  You must parse the user's text to find:
- Client's Name
- Client's Address
- Client's Phone Number
- A list of all billable items. For each item, extract:
    - description
    - quantity (default to 1 if not specified)
    - unit (default to 'Pcs' if not specified)
    - rate

RULES:
1.  If a piece of information is not present, the field MUST be null or an empty string. Do not make up information.
2.  Return ONLY the JSON object.

EXAMPLES:

User Request: "make a bill for Arti Technologies, phone number 9800000000, with product being the cctv camera 4 for 4000 rs each"
Your Output (JSON):
{
  "clientName": "Arti Technologies",
  "clientPhone": "9800000000",
  "clientAddress": null,
  "items": [
    {
      "description": "cctv camera",
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
      "description": "widget",
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

Process the following user request.

User Request: {{{prompt}}}
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
