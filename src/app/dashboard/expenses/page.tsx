
"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { format } from 'date-fns';
import { PlusCircle, Wallet, Edit, Trash2, CalendarIcon, Loader2, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { getExpenses, getExpenseStats, upsertExpense, deleteExpense } from '@/app/actions/expenses';
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

// Define schema and types here, in the client component
export const expenseFormSchema = z.object({
  id: z.number().optional(), // For updates
  category: z.string().min(1, "Category is required."),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  date: z.date({ required_error: "A date for the expense is required." }),
  description: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;


type Expense = {
  id: number;
  category: string;
  description: string | null;
  amount: number;
  date: Date;
};

type ExpenseStats = {
    totalThisMonth: number;
    totalAllTime: number;
    byCategory: { category: string; total: number; }[];
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [stats, setStats] = useState<ExpenseStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");

    const fetchExpenses = () => {
        setIsLoading(true);
        Promise.all([getExpenses(), getExpenseStats()]).then(([expensesRes, statsRes]) => {
            if (expensesRes.success) setExpenses(expensesRes.data);
            else toast({ title: "Error", description: expensesRes.error, variant: "destructive" });

            if (statsRes.success) setStats(statsRes.data);
            else toast({ title: "Error", description: statsRes.error, variant: "destructive" });
        }).finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleOpenForm = (expense: Expense | null = null) => {
        setSelectedExpense(expense);
        setIsFormOpen(true);
    };
    
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedExpense(null);
    }
    
    const filteredExpenses = useMemo(() => {
        if (!searchTerm) return expenses;
        return expenses.filter(expense => 
            expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, expenses]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">Track and manage your company's expenses.</p>
                </div>
                 <Button onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </div>

            <ExpenseStatsDashboard stats={stats} isLoading={isLoading} />
            
            <Card>
                <CardHeader>
                    <CardTitle>All Expenses</CardTitle>
                    <CardDescription>A complete log of your recorded expenses.</CardDescription>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by category or description..."
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <ExpenseTable expenses={filteredExpenses} isLoading={isLoading} onEdit={handleOpenForm} onDeleted={fetchExpenses} />
                </CardContent>
            </Card>

            <ExpenseFormDialog
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSuccess={fetchExpenses}
                expense={selectedExpense}
            />
        </div>
    );
}

function ExpenseStatsDashboard({ stats, isLoading }: { stats: ExpenseStats | null, isLoading: boolean }) {
    if (isLoading || !stats) {
        return (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Card className="lg:col-span-2"><Skeleton className="h-28" /></Card>
            </div>
        )
    }
    
    return (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expenses (This Month)</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rs. {stats.totalThisMonth.toFixed(2)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expenses (All Time)</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rs. {stats.totalAllTime.toFixed(2)}</div>
                </CardContent>
            </Card>
             <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Top Categories (This Month)</CardTitle>
                </CardHeader>
                <CardContent>
                     {stats.byCategory.length > 0 ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {stats.byCategory.map(cat => (
                                <div key={cat.category} className="text-sm">
                                    <span className="font-semibold">{cat.category}:</span>
                                    <span className="text-muted-foreground ml-1">Rs. {Number(cat.total).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No expenses recorded this month.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function ExpenseTable({ expenses, isLoading, onEdit, onDeleted }: { expenses: Expense[], isLoading: boolean, onEdit: (expense: Expense) => void, onDeleted: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleDelete = (id: number) => {
        startTransition(async () => {
            const result = await deleteExpense(id);
            if (result.success) {
                toast({ title: "Success", description: result.success });
                onDeleted();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {expenses.length > 0 ? expenses.map((expense) => (
                    <TableRow key={expense.id}>
                        <TableCell>{format(new Date(expense.date), "PPP")}</TableCell>
                        <TableCell className="font-medium">{expense.category}</TableCell>
                        <TableCell className="text-muted-foreground">{expense.description || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold">Rs. {Number(expense.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(expense)} disabled={isPending}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the expense record. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(expense.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No expenses found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

function ExpenseFormDialog({ isOpen, onClose, onSuccess, expense }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, expense: Expense | null }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseFormSchema),
    });

    useEffect(() => {
        if (isOpen) {
            if (expense) {
                form.reset({
                    id: expense.id,
                    category: expense.category,
                    amount: expense.amount,
                    date: new Date(expense.date),
                    description: expense.description || ""
                });
            } else {
                form.reset({
                    category: "",
                    amount: 0,
                    date: new Date(),
                    description: ""
                });
            }
        }
    }, [isOpen, expense, form]);

    const onSubmit = (values: ExpenseFormValues) => {
        startTransition(async () => {
            const result = await upsertExpense(values);
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
                <DialogHeader>
                    <DialogTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to record an expense.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl><Input placeholder="e.g., Office Supplies" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (Rs.)</FormLabel>
                                    <FormControl><Input type="number" placeholder="1000.00" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date of Expense</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl><Textarea placeholder="Details about the expense..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {isPending ? 'Saving...' : 'Save Expense'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

    