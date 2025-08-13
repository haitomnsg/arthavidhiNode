
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, PlusCircle, Save, X, ShoppingCart, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getProducts, Product } from '@/app/actions/products';
import { createPurchase, PurchaseFormValues, getAllPurchases } from '@/app/actions/purchase';
import { Separator } from '@/components/ui/separator';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const purchaseItemSchema = z.object({
  productId: z.coerce.number().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  rate: z.coerce.number().min(0, "Rate must be a positive number"),
});

const purchaseFormSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  supplierAddress: z.string().optional(),
  supplierPhone: z.string().optional(),
  supplierBillNumber: z.string().min(1, "Supplier bill number is required"),
  purchaseDate: z.date({ required_error: "A purchase date is required." }),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  remarks: z.string().optional(),
});


function PurchaseItems({ control, products }: { control: any, products: Product[] }) {
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  
  const productOptions = products.map(p => ({ label: p.name, value: p.id }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Purchase Items</h3>
      {fields.map((field, index) => (
         <div key={field.id} className="flex w-full gap-4 items-end p-4 border rounded-lg relative">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
                <div className="md:col-span-7">
                     <FormField
                      name={`items.${index}.productId`}
                      control={control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                           <Combobox
                                options={productOptions}
                                value={field.value}
                                onChange={(value) => field.onChange(Number(value))}
                                placeholder="Select a product..."
                                searchPlaceholder="Search products..."
                                emptyPlaceholder="No products found."
                            />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="md:col-span-2">
                     <FormField name={`items.${index}.quantity`} control={control} render={({ field }) => (<FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} placeholder="1" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="md:col-span-3">
                    <FormField name={`items.${index}.rate`} control={control} render={({ field }) => (<FormItem><FormLabel>Rate (Rs.)</FormLabel><FormControl><Input type="number" {...field} placeholder="100.00" /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ productId: 0, quantity: 1, rate: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
    </div>
  );
}


export default function PurchasePage() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-3">
                <PurchaseForm />
            </div>
            <div className="lg:col-span-2">
                <PurchaseHistory />
            </div>
        </div>
    );
}

function PurchaseForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts().then(res => {
      if(res.success && res.data) {
        setProducts(res.data as Product[]);
      } else {
        toast({ title: "Error", description: "Could not load products.", variant: "destructive" });
      }
    });
  }, [toast]);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierName: "",
      supplierAddress: "",
      supplierPhone: "",
      supplierBillNumber: "",
      purchaseDate: new Date(),
      items: [{ productId: 0, quantity: 1, rate: 0 }],
      remarks: "",
    },
  });
  
  const onSubmit = (values: PurchaseFormValues) => {
    startTransition(async () => {
      const result = await createPurchase(values);
      if (result.success) {
        toast({ title: "Success", description: result.success });
        form.reset();
        window.dispatchEvent(new CustomEvent('purchasesUpdated'));
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>Record a New Purchase</CardTitle>
            <CardDescription>Enter details from your supplier's bill to update your inventory.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Supplier Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField name="supplierName" control={form.control} render={({ field }) => (<FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Wholesale Corp" /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="supplierPhone" control={form.control} render={({ field }) => (<FormItem><FormLabel>Supplier Phone (Optional)</FormLabel><FormControl><Input {...field} placeholder="9876543210" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField name="supplierAddress" control={form.control} render={({ field }) => (<FormItem><FormLabel>Supplier Address (Optional)</FormLabel><FormControl><Textarea {...field} placeholder="123 Industrial Rd, Anytown..." /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            <Separator />
            
             <div className="space-y-4">
                <h3 className="text-lg font-medium">Bill Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <FormField name="supplierBillNumber" control={form.control} render={({ field }) => (<FormItem><FormLabel>Supplier Bill Number</FormLabel><FormControl><Input {...field} placeholder="e.g., #S-5123" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="purchaseDate" control={form.control} render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Purchase Date</FormLabel>
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
                    )} />
                </div>
            </div>
            
            <Separator />

            <PurchaseItems control={form.control} products={products} />

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Remarks</h3>
              <FormField name="remarks" control={form.control} render={({ field }) => (<FormItem><FormLabel>Remarks (Optional)</FormLabel><FormControl><Textarea {...field} placeholder="Add any notes about this purchase..." /></FormControl><FormMessage /></FormItem>)} />
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending || products.length === 0} size="lg">
              {isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Purchase & Update Stock</>}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}


type PurchaseLog = {
    id: number;
    supplierBillNumber: string;
    supplierName: string;
    purchaseDate: Date;
}

function PurchaseHistory() {
    const [history, setHistory] = useState<PurchaseLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchHistory = () => {
        setIsLoading(true);
        getAllPurchases().then(res => {
            if(res.success) {
                setHistory(res.data || []);
            } else {
                toast({ title: "Error", description: "Failed to load purchase history.", variant: "destructive"});
            }
        }).finally(() => setIsLoading(false));
    }

    useEffect(() => {
        fetchHistory();

        const handleUpdate = () => fetchHistory();
        window.addEventListener('purchasesUpdated', handleUpdate);
        return () => window.removeEventListener('purchasesUpdated', handleUpdate);
    }, [toast]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>A log of all your past purchases.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <TableSkeleton />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bill #</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length > 0 ? history.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.supplierBillNumber}</TableCell>
                                    <TableCell>{log.supplierName}</TableCell>
                                    <TableCell>{format(new Date(log.purchaseDate), 'PP')}</TableCell>
                                    <TableCell className="text-center">
                                       <div className="flex gap-1 justify-center">
                                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4 text-primary" /></Button>
                                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4 text-primary" /></Button>
                                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                       </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No purchase history found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-5 w-20" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead><Skeleton className="h-5 w-20" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
