
"use client";

import React, { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { Eye, Loader2, UserPlus, ArrowLeft, Users, CalendarClock, Upload, X, Image as ImageIcon, Pencil, Trash2, Calendar, Phone, MapPin, CreditCard, Fingerprint, User } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

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
  DialogFooter,
} from "@/components/ui/dialog";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addEmployee, getAllEmployees, updateEmployee, deleteEmployee } from '@/app/actions/attendance';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppState } from '@/hooks/use-app-state';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Employee = {
    id: number;
    name: string;
    phone: string;
    position: string;
    address?: string | null;
    citizenshipNumber: string;
    panNumber: string | null;
    photoUrl: string | null;
    citizenshipFrontUrl: string | null;
    citizenshipBackUrl: string | null;
    createdAt: Date;
};

const employeeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "A valid phone number is required."),
  position: z.string().min(2, "Position is required."),
  address: z.string().optional(),
  citizenshipNumber: z.string().min(1, "Citizenship number is required."),
  panNumber: z.string().optional(),
  photoUrl: z.string().optional(),
  citizenshipFrontUrl: z.string().optional(),
  citizenshipBackUrl: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function ManageEmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { openTab, setActiveTab } = useAppState();
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    const fetchEmployees = () => {
        setIsLoading(true);
        getAllEmployees().then(res => {
            if (res.success && res.data) {
                setEmployees(res.data);
            } else {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            }
        }).finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchEmployees();
    }, [toast]);

    const handleBackToAttendance = () => {
        openTab({
          id: '/dashboard/attendance',
          title: 'Attendance',
          icon: Users,
          props: {}
        });
        setActiveTab('/dashboard/attendance');
    };
    
    const handleViewAttendance = (employee: Employee) => {
        openTab({
            id: `/dashboard/attendance/employees/${employee.id}`,
            title: `Report: ${employee.name}`,
            icon: CalendarClock,
            props: { params: { employeeId: employee.id } }
        });
    };

    const handleViewDetails = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsViewOpen(true);
    };

    const handleEditEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsEditOpen(true);
    };

    const handleDeleteEmployee = async (employeeId: number) => {
        setIsDeleting(true);
        const result = await deleteEmployee(employeeId);
        setIsDeleting(false);
        
        if (result.success) {
            toast({ title: "Success", description: result.success });
            fetchEmployees();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };
    
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = employees.slice(indexOfFirstRecord, indexOfLastRecord);
    const nPages = Math.ceil(employees.length / recordsPerPage);
    const pageNumbers = Array.from({ length: nPages }, (_, i) => i + 1);


    return (
        <>
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
                            <DialogContent className="max-w-2xl max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle>Add New Employee</DialogTitle>
                                    <DialogDescription>Fill in the details below to add a new employee to your roster.</DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-[70vh] pr-4">
                                    <AddEmployeeForm onSuccess={() => {
                                        setIsFormOpen(false);
                                        fetchEmployees();
                                    }} />
                                </ScrollArea>
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
                                <TableHead>Employee</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Citizenship No.</TableHead>
                                <TableHead>Joined On</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentRecords.length > 0 ? currentRecords.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={employee.photoUrl || undefined} alt={employee.name} />
                                                <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{employee.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{employee.position}</Badge>
                                    </TableCell>
                                    <TableCell>{employee.phone}</TableCell>
                                    <TableCell className="font-mono text-sm">{employee.citizenshipNumber || '-'}</TableCell>
                                    <TableCell>{format(new Date(employee.createdAt), 'PP')}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(employee)}>
                                                            <Eye className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View Details</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => handleViewAttendance(employee)}>
                                                            <Calendar className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View Attendance</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditEmployee(employee)}>
                                                            <Pencil className="h-4 w-4 text-amber-600" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit Employee</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            
                                            <AlertDialog>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Delete Employee</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete <strong>{employee.name}</strong>? This action cannot be undone. All attendance records for this employee will be preserved but the employee will be marked as inactive.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteEmployee(employee.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No employees found. Click "Add Employee" to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            {nPages > 1 && (
              <CardFooter>
                <div className="flex justify-center items-center w-full space-x-2">
                  {pageNumbers.map(pgNumber => (
                    <Button 
                      key={pgNumber} 
                      onClick={() => setCurrentPage(pgNumber)}
                      variant={currentPage === pgNumber ? 'default' : 'outline'}
                      size="icon"
                      className={cn(currentPage === pgNumber && "bg-primary text-primary-foreground")}
                    >
                      {pgNumber}
                    </Button>
                  ))}
                </div>
              </CardFooter>
            )}
        </Card>

        {/* View Employee Details Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Employee Details</DialogTitle>
                    <DialogDescription>View complete information about this employee.</DialogDescription>
                </DialogHeader>
                {selectedEmployee && (
                    <ScrollArea className="max-h-[70vh]">
                        <div className="space-y-6 pr-4">
                            {/* Header with Photo */}
                            <div className="flex items-start gap-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={selectedEmployee.photoUrl || undefined} alt={selectedEmployee.name} />
                                    <AvatarFallback className="text-2xl">{selectedEmployee.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold">{selectedEmployee.name}</h3>
                                    <Badge variant="secondary" className="mt-1">{selectedEmployee.position}</Badge>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Joined on {format(new Date(selectedEmployee.createdAt), 'PPP')}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Contact Information */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground">Contact Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedEmployee.phone}</span>
                                    </div>
                                    {selectedEmployee.address && (
                                        <div className="flex items-start gap-2 col-span-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <span>{selectedEmployee.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Identity Information */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground">Identity Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Fingerprint className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Citizenship No.</p>
                                            <p className="font-mono">{selectedEmployee.citizenshipNumber || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">PAN Number</p>
                                            <p className="font-mono">{selectedEmployee.panNumber || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Citizenship Documents */}
                            {(selectedEmployee.citizenshipFrontUrl || selectedEmployee.citizenshipBackUrl) && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm text-muted-foreground">Citizenship Documents</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedEmployee.citizenshipFrontUrl && (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-muted-foreground">Front Side</p>
                                                    <div className="relative aspect-[3/2] rounded-lg overflow-hidden border bg-muted">
                                                        <Image
                                                            src={selectedEmployee.citizenshipFrontUrl}
                                                            alt="Citizenship Front"
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {selectedEmployee.citizenshipBackUrl && (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-muted-foreground">Back Side</p>
                                                    <div className="relative aspect-[3/2] rounded-lg overflow-hidden border bg-muted">
                                                        <Image
                                                            src={selectedEmployee.citizenshipBackUrl}
                                                            alt="Citizenship Back"
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </ScrollArea>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                    <Button onClick={() => {
                        setIsViewOpen(false);
                        if (selectedEmployee) handleViewAttendance(selectedEmployee);
                    }}>
                        <Calendar className="mr-2 h-4 w-4" />
                        View Attendance
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Edit Employee</DialogTitle>
                    <DialogDescription>Update the employee information below.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    {selectedEmployee && (
                        <EditEmployeeForm 
                            employee={selectedEmployee}
                            onSuccess={() => {
                                setIsEditOpen(false);
                                setSelectedEmployee(null);
                                fetchEmployees();
                            }} 
                        />
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
        </>
    );
}

function AddEmployeeForm({ onSuccess }: { onSuccess: () => void }) {
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    
    // Refs for file inputs
    const photoInputRef = useRef<HTMLInputElement>(null);
    const citizenshipFrontInputRef = useRef<HTMLInputElement>(null);
    const citizenshipBackInputRef = useRef<HTMLInputElement>(null);
    
    // Preview states
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [citizenshipFrontPreview, setCitizenshipFrontPreview] = useState<string | null>(null);
    const [citizenshipBackPreview, setCitizenshipBackPreview] = useState<string | null>(null);
    
    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeFormSchema),
        defaultValues: { 
            name: "", 
            phone: "", 
            position: "", 
            address: "",
            citizenshipNumber: "",
            panNumber: "",
            photoUrl: "",
            citizenshipFrontUrl: "",
            citizenshipBackUrl: "",
        },
    });

    const uploadFile = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'employeeImages');
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
            
            const data = await response.json();
            return data.url;
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: "Upload Error",
                description: error instanceof Error ? error.message : "Failed to upload file",
                variant: "destructive"
            });
            return null;
        }
    };

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldName: 'photoUrl' | 'citizenshipFrontUrl' | 'citizenshipBackUrl',
        setPreview: React.Dispatch<React.SetStateAction<string | null>>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: "Invalid File",
                description: "Only JPEG, PNG, and WebP images are allowed.",
                variant: "destructive"
            });
            return;
        }
        
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "File size must be less than 5MB.",
                variant: "destructive"
            });
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        // Upload file
        setIsUploading(true);
        const url = await uploadFile(file);
        setIsUploading(false);
        
        if (url) {
            form.setValue(fieldName, url);
            toast({
                title: "Success",
                description: "Image uploaded successfully.",
            });
        } else {
            setPreview(null);
        }
    };

    const clearFile = (
        fieldName: 'photoUrl' | 'citizenshipFrontUrl' | 'citizenshipBackUrl',
        setPreview: React.Dispatch<React.SetStateAction<string | null>>,
        inputRef: React.RefObject<HTMLInputElement | null>
    ) => {
        form.setValue(fieldName, '');
        setPreview(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="position" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Position / Role *</FormLabel>
                                <FormControl><Input placeholder="e.g., Sales Manager" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address (Optional)</FormLabel>
                                <FormControl><Input placeholder="123 Main St, Anytown" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                {/* Identity Information */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground">Identity Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="citizenshipNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Citizenship Number *</FormLabel>
                                <FormControl><Input placeholder="e.g., 12-34-56-78901" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="panNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>PAN Number (Optional)</FormLabel>
                                <FormControl><Input placeholder="e.g., 123456789" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground">Employee Photo</h3>
                    <FormField control={form.control} name="photoUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Profile Photo</FormLabel>
                            <FormControl>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        ref={photoInputRef}
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) => handleFileChange(e, 'photoUrl', setPhotoPreview)}
                                        className="hidden"
                                    />
                                    {photoPreview ? (
                                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                                            <Image
                                                src={photoPreview}
                                                alt="Photo preview"
                                                fill
                                                className="object-cover"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => clearFile('photoUrl', setPhotoPreview, photoInputRef)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => photoInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-32 h-32 flex flex-col gap-2"
                                        >
                                            {isUploading ? (
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            ) : (
                                                <>
                                                    <Upload className="h-6 w-6" />
                                                    <span className="text-xs">Upload Photo</span>
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </FormControl>
                            <FormDescription>Upload a passport-size photo (Max 5MB)</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                {/* Citizenship Documents */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground">Citizenship Documents</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Front Side */}
                        <FormField control={form.control} name="citizenshipFrontUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Citizenship Card (Front)</FormLabel>
                                <FormControl>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            ref={citizenshipFrontInputRef}
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(e) => handleFileChange(e, 'citizenshipFrontUrl', setCitizenshipFrontPreview)}
                                            className="hidden"
                                        />
                                        {citizenshipFrontPreview ? (
                                            <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                                                <Image
                                                    src={citizenshipFrontPreview}
                                                    alt="Citizenship front preview"
                                                    fill
                                                    className="object-contain"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6"
                                                    onClick={() => clearFile('citizenshipFrontUrl', setCitizenshipFrontPreview, citizenshipFrontInputRef)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => citizenshipFrontInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="w-full h-32 flex flex-col gap-2"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ImageIcon className="h-6 w-6" />
                                                        <span className="text-xs">Upload Front</span>
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Back Side */}
                        <FormField control={form.control} name="citizenshipBackUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Citizenship Card (Back)</FormLabel>
                                <FormControl>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            ref={citizenshipBackInputRef}
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(e) => handleFileChange(e, 'citizenshipBackUrl', setCitizenshipBackPreview)}
                                            className="hidden"
                                        />
                                        {citizenshipBackPreview ? (
                                            <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                                                <Image
                                                    src={citizenshipBackPreview}
                                                    alt="Citizenship back preview"
                                                    fill
                                                    className="object-contain"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6"
                                                    onClick={() => clearFile('citizenshipBackUrl', setCitizenshipBackPreview, citizenshipBackInputRef)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => citizenshipBackInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="w-full h-32 flex flex-col gap-2"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ImageIcon className="h-6 w-6" />
                                                        <span className="text-xs">Upload Back</span>
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <FormDescription>Upload clear photos of both sides of the citizenship card (Max 5MB each)</FormDescription>
                </div>

                <CardFooter className="px-0 pt-4">
                    <Button type="submit" disabled={isPending || isUploading}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isPending ? 'Saving...' : 'Save Employee'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    )
}

function EditEmployeeForm({ employee, onSuccess }: { employee: Employee; onSuccess: () => void }) {
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    
    // Refs for file inputs
    const photoInputRef = useRef<HTMLInputElement>(null);
    const citizenshipFrontInputRef = useRef<HTMLInputElement>(null);
    const citizenshipBackInputRef = useRef<HTMLInputElement>(null);
    
    // Preview states - initialize with existing URLs
    const [photoPreview, setPhotoPreview] = useState<string | null>(employee.photoUrl);
    const [citizenshipFrontPreview, setCitizenshipFrontPreview] = useState<string | null>(employee.citizenshipFrontUrl);
    const [citizenshipBackPreview, setCitizenshipBackPreview] = useState<string | null>(employee.citizenshipBackUrl);
    
    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeFormSchema),
        defaultValues: { 
            name: employee.name, 
            phone: employee.phone, 
            position: employee.position, 
            address: employee.address || "",
            citizenshipNumber: employee.citizenshipNumber || "",
            panNumber: employee.panNumber || "",
            photoUrl: employee.photoUrl || "",
            citizenshipFrontUrl: employee.citizenshipFrontUrl || "",
            citizenshipBackUrl: employee.citizenshipBackUrl || "",
        },
    });

    const uploadFile = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'employeeImages');
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
            
            const data = await response.json();
            return data.url;
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: "Upload Error",
                description: error instanceof Error ? error.message : "Failed to upload file",
                variant: "destructive"
            });
            return null;
        }
    };

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldName: 'photoUrl' | 'citizenshipFrontUrl' | 'citizenshipBackUrl',
        setPreview: React.Dispatch<React.SetStateAction<string | null>>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: "Invalid File",
                description: "Only JPEG, PNG, and WebP images are allowed.",
                variant: "destructive"
            });
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "File size must be less than 5MB.",
                variant: "destructive"
            });
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        setIsUploading(true);
        const url = await uploadFile(file);
        setIsUploading(false);
        
        if (url) {
            form.setValue(fieldName, url);
            toast({
                title: "Success",
                description: "Image uploaded successfully.",
            });
        } else {
            setPreview(form.getValues(fieldName) || null);
        }
    };

    const clearFile = (
        fieldName: 'photoUrl' | 'citizenshipFrontUrl' | 'citizenshipBackUrl',
        setPreview: React.Dispatch<React.SetStateAction<string | null>>,
        inputRef: React.RefObject<HTMLInputElement | null>
    ) => {
        form.setValue(fieldName, '');
        setPreview(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const onSubmit = (values: EmployeeFormValues) => {
        startTransition(() => {
            updateEmployee(employee.id, values).then(res => {
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="position" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Position / Role *</FormLabel>
                                <FormControl><Input placeholder="e.g., Sales Manager" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address (Optional)</FormLabel>
                                <FormControl><Input placeholder="123 Main St, Anytown" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                {/* Identity Information */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground">Identity Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="citizenshipNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Citizenship Number *</FormLabel>
                                <FormControl><Input placeholder="e.g., 12-34-56-78901" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="panNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>PAN Number (Optional)</FormLabel>
                                <FormControl><Input placeholder="e.g., 123456789" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground">Employee Photo</h3>
                    <FormField control={form.control} name="photoUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Profile Photo</FormLabel>
                            <FormControl>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        ref={photoInputRef}
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) => handleFileChange(e, 'photoUrl', setPhotoPreview)}
                                        className="hidden"
                                    />
                                    {photoPreview ? (
                                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                                            <Image
                                                src={photoPreview}
                                                alt="Photo preview"
                                                fill
                                                className="object-cover"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => clearFile('photoUrl', setPhotoPreview, photoInputRef)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => photoInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-32 h-32 flex flex-col gap-2"
                                        >
                                            {isUploading ? (
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            ) : (
                                                <>
                                                    <Upload className="h-6 w-6" />
                                                    <span className="text-xs">Upload Photo</span>
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </FormControl>
                            <FormDescription>Upload a passport-size photo (Max 5MB)</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                {/* Citizenship Documents */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground">Citizenship Documents</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Front Side */}
                        <FormField control={form.control} name="citizenshipFrontUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Citizenship Card (Front)</FormLabel>
                                <FormControl>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            ref={citizenshipFrontInputRef}
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(e) => handleFileChange(e, 'citizenshipFrontUrl', setCitizenshipFrontPreview)}
                                            className="hidden"
                                        />
                                        {citizenshipFrontPreview ? (
                                            <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                                                <Image
                                                    src={citizenshipFrontPreview}
                                                    alt="Citizenship front preview"
                                                    fill
                                                    className="object-contain"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6"
                                                    onClick={() => clearFile('citizenshipFrontUrl', setCitizenshipFrontPreview, citizenshipFrontInputRef)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => citizenshipFrontInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="w-full h-32 flex flex-col gap-2"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ImageIcon className="h-6 w-6" />
                                                        <span className="text-xs">Upload Front</span>
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Back Side */}
                        <FormField control={form.control} name="citizenshipBackUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Citizenship Card (Back)</FormLabel>
                                <FormControl>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            ref={citizenshipBackInputRef}
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(e) => handleFileChange(e, 'citizenshipBackUrl', setCitizenshipBackPreview)}
                                            className="hidden"
                                        />
                                        {citizenshipBackPreview ? (
                                            <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                                                <Image
                                                    src={citizenshipBackPreview}
                                                    alt="Citizenship back preview"
                                                    fill
                                                    className="object-contain"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6"
                                                    onClick={() => clearFile('citizenshipBackUrl', setCitizenshipBackPreview, citizenshipBackInputRef)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => citizenshipBackInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="w-full h-32 flex flex-col gap-2"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ImageIcon className="h-6 w-6" />
                                                        <span className="text-xs">Upload Back</span>
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <FormDescription>Upload clear photos of both sides of the citizenship card (Max 5MB each)</FormDescription>
                </div>

                <CardFooter className="px-0 pt-4">
                    <Button type="submit" disabled={isPending || isUploading}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isPending ? 'Updating...' : 'Update Employee'}
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
            <TableHead><Skeleton className="h-5 w-40" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-5 w-28 mx-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell>
                <div className="flex justify-center gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
