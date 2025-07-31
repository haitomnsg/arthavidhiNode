
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, Loader2, PlusCircle, UserPlus, ArrowLeft, Users } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addEmployee, getAllEmployees } from '@/app/actions/attendance';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppState } from '@/hooks/use-app-state';

type Employee = {
    id: number;
    name: string;
    phone: string;
    position: string;
    createdAt: Date;
};

const employeeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "A valid phone number is required."),
  position: z.string().min(2, "Position is required."),
  address: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function ManageEmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { openTab, setActiveTab } = useAppState();

    const handleBackToAttendance = () => {
        openTab({
          id: '/dashboard/attendance',
          title: 'Attendance',
          icon: Users,
          props: {}
        });
        setActiveTab('/dashboard/attendance');
    };

    useEffect(() => {
        setIsLoading(true);
        getAllEmployees().then(res => {
            if (res.success && res.data) {
                setEmployees(res.data);
            } else {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            }
        }).finally(() => setIsLoading(false));
    }, [toast]);
    
    const handleViewReport = (employee: Employee) => {
        openTab({
            id: `/dashboard/attendance/employees/${employee.id}`,
            title: `Report: ${employee.name}`,
            icon: Eye,
            props: { params: { employeeId: employee.id } }
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Manage Employees</CardTitle>
                        <CardDescription>Add, view, and manage your employees.</CardDescription>
                    </div>
                     <div className="flex gap-2">
                        <Button onClick={handleBackToAttendance} variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />Back to Attendance
                        </Button>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button><UserPlus className="mr-2 h-4 w-4" /> Add Employee</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Employee</DialogTitle>
                                    <DialogDescription>Fill in the details below to add a new employee to your roster.</DialogDescription>
                                </DialogHeader>
                                <AddEmployeeForm onSuccess={() => {
                                    setIsFormOpen(false);
                                    getAllEmployees().then(res => res.success && setEmployees(res.data || []));
                                }} />
                            </DialogContent>
                        </Dialog>
                     </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <TableSkeleton />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Joined On</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.length > 0 ? employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell className="font-medium">{employee.name}</TableCell>
                                    <TableCell>{employee.position}</TableCell>
                                    <TableCell>{employee.phone}</TableCell>
                                    <TableCell>{format(new Date(employee.createdAt), 'PP')}</TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="icon" onClick={() => handleViewReport(employee)}>
                                            <Eye className="h-4 w-4 text-primary" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No employees found. Click "Add Employee" to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

function AddEmployeeForm({ onSuccess }: { onSuccess: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeFormSchema),
        defaultValues: { name: "", phone: "", position: "", address: "" },
    });

    const onSubmit = (values: EmployeeFormValues) => {
        startTransition(() => {
            addEmployee(values).then(res => {
                if (res.success) {
                    toast({ title: "Success", description: res.success });
                    onSuccess();
                } else {
                    toast({ title: "Error", description: res.error, variant: "destructive" });
                }
            });
        });
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="position" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Position / Role</FormLabel>
                        <FormControl><Input placeholder="e.g., Sales Manager" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl><Textarea placeholder="123 Main St, Anytown" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <CardFooter className="px-0 pt-4">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isPending ? 'Saving...' : 'Save Employee'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
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
