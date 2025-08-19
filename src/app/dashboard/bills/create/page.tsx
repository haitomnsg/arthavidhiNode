
"use client";

import React, { useTransition, useState, useEffect, useMemo, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import {
  CalendarIcon,
  PlusCircle,
  Save,
  X,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createBill, getNextInvoiceNumber } from "@/app/actions/bills";
import { getCompanyDetails } from "@/app/actions/company";
import { generateBillPdf } from "@/components/bill-pdf-download";
import { BillPreview } from "@/components/bill-preview";
import { useAppState } from "@/hooks/use-app-state";
import { createBillFromText } from "@/ai/flows/create-bill-flow";

interface Company {
  id: number;
  userId: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  panNumber?: string | null;
  vatNumber?: string | null;
}


const billItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required."),
  rate: z.coerce.number().min(0, "Rate must be a positive number"),
});

const billFormSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  clientPhone: z.string().min(1, "Client phone is required"),
  panNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  billDate: z.date({ required_error: "A bill date is required." }),
  dueDate: z.date({ required_error: "A due date is required." }),
  items: z.array(billItemSchema).min(1, "At least one item is required"),
  discountType: z.enum(['percentage', 'amount']).default('amount'),
  discountPercentage: z.coerce.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100").optional(),
  discountAmount: z.coerce.number().min(0, "Cannot be negative").optional(),
  remarks: z.string().optional(),
});

export type BillFormValues = z.infer<typeof billFormSchema>;

const BillItems = ({ control }: { control: any }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <div className="space-y-4">
       <h3 className="text-lg font-medium">Bill Items</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg relative">
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
                <FormField name={`items.${index}.description`} control={control} render={({ field }) => (<FormItem className="md:col-span-5"><FormLabel>Description</FormLabel><FormControl><Input {...field} placeholder="Item or service"/></FormControl><FormMessage /></FormItem>)} />
                <FormField name={`items.${index}.quantity`} control={control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} placeholder="1"/></FormControl><FormMessage /></FormItem>)} />
                <FormField name={`items.${index}.unit`} control={control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Unit</FormLabel><FormControl><Input {...field} placeholder="Pcs"/></FormControl><FormMessage /></FormItem>)} />
                <FormField name={`items.${index}.rate`} control={control} render={({ field }) => (<FormItem className="md:col-span-3"><FormLabel>Rate (Rs.)</FormLabel><FormControl><Input type="number" {...field} placeholder="100.00"/></FormControl><FormMessage /></FormItem>)} />
             </div>
             <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => append({ description: "", quantity: 1, unit: "Pcs", rate: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
    </div>
  );
}


export default function CreateBillPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();
  const [aiPrompt, setAiPrompt] = useState("");
  const [companyDetails, setCompanyDetails] = useState<Partial<Company>>({});
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>("#INV-PREVIEW");
  const { billState, setBillState, resetBillState, closeTab, setActiveTab } = useAppState();

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: billState.form,
  });
  
  const handleBlur = useCallback(() => {
    setBillState({ form: form.getValues() });
  }, [form, setBillState]);
  
  useEffect(() => {
    form.reset(billState.form);
  }, [billState, form]);

  useEffect(() => {
    getCompanyDetails().then(setCompanyDetails);
    getNextInvoiceNumber().then(setNextInvoiceNumber);
  }, []);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'discountType') {
        if (value.discountType === 'percentage') {
          form.setValue('discountAmount', 0);
        } else {
          form.setValue('discountPercentage', 0);
        }
        handleBlur();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, handleBlur]);

  const billData = useWatch({ control: form.control });

  const { subtotal, discount, subtotalAfterDiscount, vat, total, appliedDiscountLabel } = useMemo(() => {
    const { items, discountType, discountAmount, discountPercentage } = billData;

    const calculatedSubtotal = (items || []).reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return acc + quantity * rate;
    }, 0);

    let calculatedDiscount = 0;
    let label = 'Discount';

    if (discountType === 'percentage') {
        const percentage = Number(discountPercentage) || 0;
        if (percentage > 0) {
            calculatedDiscount = calculatedSubtotal * (percentage / 100);
            label = `Discount (${percentage}%)`;
        }
    } else {
        calculatedDiscount = Number(discountAmount) || 0;
    }

    const calculatedSubtotalAfterDiscount = calculatedSubtotal - calculatedDiscount;
    const calculatedVat = calculatedSubtotalAfterDiscount * 0.13;
    const calculatedTotal = calculatedSubtotalAfterDiscount + calculatedVat;

    return {
      subtotal: calculatedSubtotal,
      discount: calculatedDiscount,
      subtotalAfterDiscount: calculatedSubtotalAfterDiscount,
      vat: calculatedVat,
      total: calculatedTotal,
      appliedDiscountLabel: label,
    };
  }, [billData]);
  
  const handleReset = () => {
      const defaultState = resetBillState();
      form.reset(defaultState.form);
      toast({ title: "Form Cleared", description: "The bill form has been reset."});
  }

  const handleAiGenerate = () => {
    startAiTransition(async () => {
        try {
            const result = await createBillFromText(aiPrompt);

            if (result) {
                toast({ title: "AI Success", description: "Form has been populated." });
                const currentValues = form.getValues();
                const newValues = {
                    ...currentValues,
                    clientName: result.clientName || currentValues.clientName,
                    clientAddress: result.clientAddress || currentValues.clientAddress,
                    clientPhone: result.clientPhone || currentValues.clientPhone,
                    items: result.items && result.items.length > 0 ? result.items : currentValues.items,
                };
                form.reset(newValues);
                handleBlur(); // Save new state
            } else {
                 toast({ title: "AI Info", description: "Could not extract details. Please try a different prompt.", variant: "destructive"});
            }

        } catch (error) {
            console.error("AI generation failed:", error);
            toast({ title: "AI Error", description: "Could not get response from AI.", variant: "destructive"});
        }
    });
  }

  const onSubmit = (values: BillFormValues) => {
    startTransition(async () => {
      const serverResponse = await createBill(values);
      
      if (serverResponse.error) {
        toast({
          title: "Error",
          description: serverResponse.error,
          variant: "destructive",
        });
        return;
      }
      
      if (serverResponse.success && serverResponse.data) {
        toast({
          title: "Bill Saved",
          description: serverResponse.success,
        });
        
        resetBillState();
        closeTab('/dashboard/bills/create');
        setActiveTab('/dashboard/bills');
        
        try {
            generateBillPdf(serverResponse.data);
        } catch (pdfError) {
            console.error("Failed to generate PDF on client:", pdfError);
            toast({
                title: "PDF Generation Failed",
                description: "The bill was saved, but the PDF could not be generated. You can download it later from the 'Find Bills' page.",
                variant: "destructive",
            });
        }
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
        <div className="min-w-0 print:hidden space-y-6">
          <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <CardTitle>Create Bill with AI</CardTitle>
                </div>
                <CardDescription>
                    Describe the bill you want to create and let AI fill the form.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Input 
                        placeholder="e.g., make a bill for Ram with 2 CCTV cameras at 4000 each..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                    />
                    <Button onClick={handleAiGenerate} disabled={isAiPending || !aiPrompt}>
                        {isAiPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
                    </Button>
                </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Create a New Bill</CardTitle>
                    <CardDescription>
                      Fill in the details below. The form is saved automatically.
                    </CardDescription>
                </div>
                <Button onClick={handleReset} variant="outline" size="sm">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset Form
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} onBlur={handleBlur} id="bill-form" className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Client Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <FormField name="clientName" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Client Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Acme Inc."/></FormControl><FormMessage /></FormItem>)} />
                       <FormField name="clientPhone" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Client Phone</FormLabel><FormControl><Input {...field} placeholder="9876543210"/></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField name="clientAddress" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Client Address</FormLabel><FormControl><Textarea {...field} placeholder="123 Main St, Anytown..."/></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField name="panNumber" control={form.control} render={({ field }) => ( <FormItem><FormLabel>PAN Number (Optional)</FormLabel><FormControl><Input {...field} placeholder="Client's PAN"/></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="vatNumber" control={form.control} render={({ field }) => ( <FormItem><FormLabel>VAT Number (Optional)</FormLabel><FormControl><Input {...field} placeholder="Client's VAT"/></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField name="billDate" control={form.control} render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>Bill Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}</Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={new Date(field.value)} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <FormField name="dueDate" control={form.control} render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}</Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={new Date(field.value)} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}/>
                     </div>
                  </div>

                  <Separator />

                  <BillItems control={form.control} />
                  
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Discount</h3>
                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex items-center space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="amount" />
                                </FormControl>
                                <FormLabel className="font-normal">In Amount (Rs.)</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="percentage" />
                                </FormControl>
                                <FormLabel className="font-normal">In Percentage (%)</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            name="discountAmount"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            placeholder="e.g. 100"
                                            disabled={billData.discountType === 'percentage'}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="discountPercentage"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Percentage</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            placeholder="e.g. 10"
                                            disabled={billData.discountType === 'amount'}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Remarks</h3>
                    <FormField name="remarks" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks (Optional)</FormLabel>
                            <FormControl>
                                <Textarea {...field} placeholder="Add any additional notes, terms, or conditions here." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>
                </form>
              </Form>
            </CardContent>
             <CardFooter>
               <Button type="submit" form="bill-form" disabled={isPending || !form.formState.isValid} size="lg">
                 {isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save & Download Bill</>}
               </Button>
             </CardFooter>
          </Card>
        </div>
        <div className="min-w-0">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Bill Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <BillPreview 
                company={companyDetails} 
                bill={billData} 
                subtotal={subtotal} 
                discount={discount}
                subtotalAfterDiscount={subtotalAfterDiscount}
                vat={vat} 
                total={total} 
                appliedDiscountLabel={appliedDiscountLabel}
                invoiceNumber={nextInvoiceNumber} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
