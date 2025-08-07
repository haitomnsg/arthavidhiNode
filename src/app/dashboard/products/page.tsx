
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Edit, Trash2, Loader2, Package, Search, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    getProductCategories,
    getProducts,
    upsertProductCategory,
    deleteProductCategory,
    upsertProduct,
    deleteProduct
} from '@/app/actions/products';


// Schemas and Types
const productCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Category name is required."),
});
type ProductCategoryFormValues = z.infer<typeof productCategorySchema>;

const productSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Product name is required."),
    categoryId: z.coerce.number({invalid_type_error: "Category is required."}).min(1, "Category is required."),
    quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
    rate: z.coerce.number().min(0, "Rate cannot be negative."),
    photoUrl: z.string().url("Please enter a valid URL.").or(z.literal("")).optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

interface ProductCategory {
  id: number;
  name: string;
}
interface Product {
  id: number;
  name: string;
  quantity: number;
  rate: number;
  photoUrl: string | null;
  categoryName: string;
  categoryId: number;
}

// Main Page Component
export default function ProductsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">Manage your product inventory and categories.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <ProductCategoryManager />
                </div>
                <div className="lg:col-span-2">
                    <ProductManager />
                </div>
            </div>
        </div>
    );
}

// Product Category Manager Component
function ProductCategoryManager() {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const fetchCategories = () => {
        setIsLoading(true);
        getProductCategories().then(res => {
            if (res.success) setCategories(res.data || []);
            else toast({ title: "Error", description: res.error, variant: "destructive" });
        }).finally(() => setIsLoading(false));
    };

    useEffect(fetchCategories, [toast]);
    
    const handleOpenForm = (category: ProductCategory | null = null) => {
        setSelectedCategory(category);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedCategory(null);
    }
    
    const handleDelete = (id: number) => {
        startTransition(async () => {
            const result = await deleteProductCategory(id);
            if(result.success) {
                toast({ title: "Success", description: result.success });
                fetchCategories();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Categories</CardTitle>
                        <CardDescription>Product groups</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : (
                    <Table>
                        <TableBody>
                            {categories.length > 0 ? categories.map(cat => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(cat)} disabled={isPending}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone and will delete the category.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(cat.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={2} className="h-24 text-center">No categories found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <CategoryFormDialog 
                isOpen={isFormOpen} 
                onClose={handleCloseForm} 
                onSuccess={fetchCategories} 
                category={selectedCategory} 
            />
        </Card>
    );
}

// Product Manager Component
function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const fetchData = () => {
        setIsLoading(true);
        Promise.all([getProducts(), getProductCategories()]).then(([productsRes, categoriesRes]) => {
            if (productsRes.success) setProducts(productsRes.data || []);
            else toast({ title: "Error", description: productsRes.error, variant: "destructive" });
            
            if (categoriesRes.success) setCategories(categoriesRes.data || []);
            else toast({ title: "Error", description: categoriesRes.error, variant: "destructive" });
        }).finally(() => setIsLoading(false));
    };

    useEffect(fetchData, [toast]);

    const handleOpenForm = (product: Product | null = null) => {
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedProduct(null);
    }

    const handleDelete = (id: number) => {
        startTransition(async () => {
            const result = await deleteProduct(id);
            if(result.success) {
                toast({ title: "Success", description: result.success });
                fetchData();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };
    
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Products</CardTitle>
                        <CardDescription>Your inventory of items</CardDescription>
                    </div>
                     <Button onClick={() => handleOpenForm()} disabled={categories.length === 0}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </div>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or category..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-center">Stock</TableHead>
                                <TableHead className="text-right">Rate</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.length > 0 ? filteredProducts.map(prod => (
                                <TableRow key={prod.id}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                                        {prod.photoUrl ? (
                                            <Image src={prod.photoUrl} alt={prod.name} width={40} height={40} className="object-cover rounded-md" data-ai-hint="product image" />
                                        ) : (
                                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        </div>
                                        {prod.name}
                                    </TableCell>
                                    <TableCell>{prod.categoryName}</TableCell>
                                    <TableCell className="text-center">{prod.quantity}</TableCell>
                                    <TableCell className="text-right">Rs. {prod.rate.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                       <div className="flex items-center justify-center">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(prod)} disabled={isPending}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" disabled={isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone and will delete the product.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(prod.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No products found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            {categories.length === 0 && !isLoading && (
                 <CardFooter>
                    <p className="text-sm text-muted-foreground">Please add a category first to be able to add products.</p>
                </CardFooter>
            )}

            <ProductFormDialog
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSuccess={fetchData}
                product={selectedProduct}
                categories={categories}
            />
        </Card>
    );
}

// Forms in Dialogs
function CategoryFormDialog({ isOpen, onClose, onSuccess, category }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, category: ProductCategory | null }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const form = useForm<ProductCategoryFormValues>({ resolver: zodResolver(productCategorySchema) });

    useEffect(() => {
        if (isOpen) {
            form.reset(category ? { id: category.id, name: category.name } : { name: "" });
        }
    }, [isOpen, category, form]);

    const onSubmit = (values: ProductCategoryFormValues) => {
        startTransition(async () => {
            const result = await upsertProductCategory(values);
            if(result.success) {
                toast({ title: "Success", description: result.success });
                onSuccess();
                onClose();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>{category ? 'Edit Category' : 'Add New Category'}</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Category Name</FormLabel><FormControl><Input placeholder="e.g., Electronics" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function ProductFormDialog({ isOpen, onClose, onSuccess, product, categories }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, product: Product | null, categories: ProductCategory[] }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const form = useForm<ProductFormValues>({ resolver: zodResolver(productSchema) });

    useEffect(() => {
        if (isOpen) {
            if (product) {
                form.reset({
                    id: product.id,
                    name: product.name,
                    categoryId: product.categoryId,
                    quantity: product.quantity,
                    rate: product.rate,
                    photoUrl: product.photoUrl || "",
                });
            } else {
                form.reset({
                    name: "",
                    categoryId: undefined,
                    quantity: 0,
                    rate: 0,
                    photoUrl: "",
                });
            }
        }
    }, [isOpen, product, form]);

    const onSubmit = (values: ProductFormValues) => {
        startTransition(async () => {
            const result = await upsertProduct(values);
            if(result.success) {
                toast({ title: "Success", description: result.success });
                onSuccess();
                onClose();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader><DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle><DialogDescription>Fill in the product details below.</DialogDescription></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Laptop" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="categoryId" render={({ field }) => (
                                <FormItem><FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="quantity" render={({ field }) => (
                                <FormItem><FormLabel>Stock Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="rate" render={({ field }) => (
                                <FormItem><FormLabel>Rate (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="photoUrl" render={({ field }) => (
                            <FormItem><FormLabel>Photo URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Product'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


