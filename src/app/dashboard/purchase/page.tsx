
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import { PlusCircle, ShoppingCart, Loader2, X, CalendarIcon, Edit, Trash2, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';
import type { Product } from '@/app/actions/products';
import { getProducts } from '@/app/actions/products';
import { createPurchase, getPurchases, PurchaseFormValues } from '@/app/actions/purchase';

// Schemas and Types
const purchaseItemSchema = z.object({
  productId: z.coerce.number().min(1, "Product is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  unit: z.string().min(1, "Unit is required."),
  rate: z.coerce.number().min(0, "Rate must be a positive number."),
});

const purchaseFormSchema = z.object({
  supplierName: z.string().min(2, "Supplier name is required."),
  supplierPhone: z.string().min(10, "A valid phone number is required."),
  supplierAddress: z.string().optional(),
  supplierPan: z.string().optional(),
  supplierVat: z.string().optional(),
  supplierBillNumber: z.string().min(1, "Supplier bill number is required."),
  purchaseDate: z.date(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required."),
  remarks: z.string().optional(),
});


// Main Page Component
export default function PurchasePage() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();

    const fetchPurchases = () => {
        setIsLoading(true);
        getPurchases().then(res => {
            if (res.success) {
                setPurchases(res.data || []);
            } else {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            }
        }).finally(() => setIsLoading(false));
    };

    useEffect(fetchPurchases, [toast]);

    return (
        <div className="space-y-6">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button className="hidden" id="hidden-purchase-dialog-trigger"></Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record New Purchase</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to record a new purchase and update your inventory.
                        </DialogDescription>
                    </DialogHeader>
                    <AddPurchaseForm 
                        onSuccess={() => {
                            setIsFormOpen(false);
                            fetchPurchases();
                        }} 
                    />
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Purchase History</CardTitle>
                            <CardDescription>A log of all your inventory purchases.</CardDescription>
                        </div>
                        <Button onClick={() => setIsFormOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Purchase
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TableSkeleton />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Supplier Bill #</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.length > 0 ? purchases.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{format(new Date(p.purchaseDate), 'PP')}</TableCell>
                                        <TableCell className="font-medium">{p.supplierName}</TableCell>
                                        <TableCell>{p.supplierBillNumber}</TableCell>
                                        <TableCell className="text-right">Rs. {Number(p.totalAmount || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="ghost" size="icon" disabled><Eye className="h-4 w-4 text-primary" /></Button>
                                                <Button variant="ghost" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" disabled><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No purchases recorded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Add Purchase Form Component
function AddPurchaseForm({ onSuccess }: { onSuccess: () => void }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [products, setProducts] = useState<Product[]>([]);

    const form = useForm<PurchaseFormValues>({
        resolver: zodResolver(purchaseFormSchema),
        defaultValues: {
            supplierName: "",
            supplierPhone: "",
            supplierAddress: "",
            supplierPan: "",
            supplierVat: "",
            supplierBillNumber: "",
            purchaseDate: new Date(),
            items: [{ productId: 0, quantity: 1, unit: "Pcs", rate: 0 }],
            remarks: "",
        },
    });

    useEffect(() => {
        getProducts().then(res => {
            if (res.success) setProducts(res.data || []);
        });
    }, []);

    const onSubmit = (values: PurchaseFormValues) => {
        startTransition(async () => {
            const result = await createPurchase(values);
            if (result.success) {
                toast({ title: "Success", description: result.success });
                onSuccess();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    return (
        <FormProvider {...form}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Supplier Details */}
                    <Card>
                        <CardHeader><CardTitle>Supplier Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="supplierName" render={({ field }) => (<FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="supplierPhone" render={({ field }) => (<FormItem><FormLabel>Supplier Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="supplierAddress" render={({ field }) => (<FormItem><FormLabel>Supplier Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="supplierPan" render={({ field }) => (<FormItem><FormLabel>PAN (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="supplierVat" render={({ field }) => (<FormItem><FormLabel>VAT (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase Details */}
                    <Card>
                        <CardHeader><CardTitle>Purchase Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="supplierBillNumber" render={({ field }) => (<FormItem><FormLabel>Supplier Bill Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                                 <FormItem className="flex flex-col"><FormLabel>Purchase Date</FormLabel>
                                     <Popover><PopoverTrigger asChild><FormControl>
                                         <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button>
                                     </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                         <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                     </PopoverContent></Popover><FormMessage />
                                 </FormItem>
                             )}/>
                        </CardContent>
                    </Card>

                    {/* Purchase Items */}
                    <Card>
                        <CardHeader><CardTitle>Purchase Items</CardTitle></CardHeader>
                        <CardContent>
                            <PurchaseItems control={form.control} products={products} />
                        </CardContent>
                    </Card>
                    
                    {/* Remarks */}
                    <Card>
                         <CardHeader><CardTitle>Remarks</CardTitle></CardHeader>
                         <CardContent>
                            <FormField control={form.control} name="remarks" render={({ field }) => (<FormItem><FormControl><Textarea {...field} placeholder="Add any notes about the purchase..." /></FormControl><FormMessage /></FormItem>)} />
                         </CardContent>
                    </Card>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => document.getElementById('hidden-purchase-dialog-trigger')?.click()}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Purchase
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </FormProvider>
    );
}

// Purchase Items Sub-component
function PurchaseItems({ control, products }: { control: any, products: Product[] }) {
    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const productOptions = products.map(p => ({ label: p.name, value: p.id }));

    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                    <FormField name={`items.${index}.productId`} control={control} render={({ field }) => (
                        <FormItem className="md:col-span-6 flex flex-col justify-end">
                            <FormLabel>Product Name</FormLabel>
                            <Combobox
                                options={productOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select a product..."
                                searchPlaceholder='Search products...'
                                emptyPlaceholder='No products found.'
                            />
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField name={`items.${index}.quantity`} control={control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name={`items.${index}.unit`} control={control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Unit</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name={`items.${index}.rate`} control={control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Rate</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    
                    <div className="md:col-span-12 flex justify-end">
                         <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></Button>
                    </div>
                </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ productId: 0, quantity: 1, unit: 'Pcs', rate: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
        </div>
    );
}

// Table Skeleton Component
function TableSkeleton() {
    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20 ml-auto" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
