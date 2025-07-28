
"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Save,
  PlusCircle,
  X,
  CalendarIcon,
  RotateCcw,
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getCompanyDetails } from "@/app/actions/company";
import { generateQuotationPdf } from "@/components/quotation-pdf-download";
import { QuotationPreview } from "@/components/quotation-preview";
import { createQuotation, getNextQuotationNumber } from "@/app/actions/quotations";
import { useAppState } from "@/hooks/use-app-state";

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
  quotationDate: z.date({ required_error: "A quotation date is required." }),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  remarks: z.string().optional(),
});

export type QuotationFormValues = z.infer<typeof quotationFormSchema>;

export default function CreateQuotationPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [companyDetails, setCompanyDetails] = useState<Partial<Company>>({});
  const [nextQuotationNumber, setNextQuotationNumber] = useState<string>("#QUO-PREVIEW");
  const { quotationState, setQuotationState, resetQuotationState } = useAppState();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    values: quotationState,
  });
  
  useEffect(() => {
    getCompanyDetails().then(setCompanyDetails);
    getNextQuotationNumber().then(setNextQuotationNumber);
  }, []);

  useEffect(() => {
    const subscription = form.watch((value) => {
      setQuotationState(value as QuotationFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form, setQuotationState]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const quotationData = form.watch();

  const { subtotal, vat, total } = useMemo(() => {
    const { items } = quotationData;

    const calculatedSubtotal = (items || []).reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return acc + quantity * rate;
    }, 0);
    
    const calculatedVat = calculatedSubtotal * 0.13;
    const calculatedTotal = calculatedSubtotal + calculatedVat;

    return {
      subtotal: calculatedSubtotal,
      vat: calculatedVat,
      total: calculatedTotal,
    };
  }, [quotationData]);
  
  const handleReset = () => {
    resetQuotationState();
    form.reset(quotationState);
    toast({ title: "Form Cleared", description: "The quotation form has been reset."});
  }

  const onSubmit = (values: QuotationFormValues) => {
    startTransition(async () => {
      const serverResponse = await createQuotation(values);
      
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
          title: "Quotation Saved",
          description: serverResponse.success,
        });

        handleReset();
        getNextQuotationNumber().then(setNextQuotationNumber);

        try {
            generateQuotationPdf(serverResponse.data);
        } catch (pdfError) {
            console.error("Failed to generate PDF on client:", pdfError);
            toast({
                title: "PDF Generation Failed",
                description: "The quotation was saved, but the PDF could not be generated. You can download it later from the 'Find Quotations' page.",
                variant: "destructive",
            });
        }
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
        <div className="min-w-0 print:hidden">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Create a New Quotation</CardTitle>
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
                <form onSubmit={form.handleSubmit(onSubmit)} id="quotation-form" className="space-y-8">
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
                    <FormField name="quotationDate" control={form.control} render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel>Quotation Date</FormLabel>
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

                  <Separator />

                  <div className="space-y-4">
                     <h3 className="text-lg font-medium">Quotation Items</h3>
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg relative">
                           <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
                              <FormField name={`items.${index}.description`} control={form.control} render={({ field }) => (<FormItem className="md:col-span-5"><FormLabel>Description</FormLabel><FormControl><Input {...field} placeholder="Item or service"/></FormControl><FormMessage /></FormItem>)} />
                              <FormField name={`items.${index}.quantity`} control={form.control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} placeholder="1"/></FormControl><FormMessage /></FormItem>)} />
                              <FormField name={`items.${index}.unit`} control={form.control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Unit</FormLabel><FormControl><Input {...field} placeholder="Pcs"/></FormControl><FormMessage /></FormItem>)} />
                              <FormField name={`items.${index}.rate`} control={form.control} render={({ field }) => (<FormItem className="md:col-span-3"><FormLabel>Rate (Rs.)</FormLabel><FormControl><Input type="number" {...field} placeholder="100.00"/></FormControl><FormMessage /></FormItem>)} />
                           </div>
                           <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => append({ description: "", quantity: 1, unit: "Pcs", rate: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
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
               <Button type="submit" form="quotation-form" disabled={isPending || !form.formState.isValid} size="lg">
                 {isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save & Download Quotation</>}
               </Button>
             </CardFooter>
          </Card>
        </div>
        <div className="min-w-0">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Quotation Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <QuotationPreview
                company={companyDetails} 
                quotation={quotationData} 
                subtotal={subtotal}
                vat={vat} 
                total={total}
                quotationNumber={nextQuotationNumber}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
