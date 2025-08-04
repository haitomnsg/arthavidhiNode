
"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { format } from 'date-fns';
import { Loader2, UserPlus, Users, PlusCircle, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceForDate, clockIn, clockOut, updateAttendanceTime, markAsAbsent } from '@/app/actions/attendance';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useAppState } from '@/hooks/use-app-state';

type AttendanceData = {
    employeeId: number;
    name: string;
    position: string;
    attendanceId: number | null;
    entryTime: Date | string | null;
    exitTime: Date | string | null;
    status: string;
};

export default function AttendancePage() {
    const [date, setDate] = useState(new Date());
    const [attendance, setAttendance] = useState<AttendanceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const { openTab } = useAppState();
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        setIsLoading(true);
        getAttendanceForDate(date)
            .then(res => {
                if (res.success) {
                    setAttendance(res.data);
                } else {
                    toast({ title: "Error", description: res.error, variant: "destructive" });
                }
            })
            .finally(() => setIsLoading(false));
    }, [date, toast]);

    const filteredAttendance = useMemo(() => {
        if (!searchTerm) return attendance;
        return attendance.filter(
          (att) =>
            att.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            att.position.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, attendance]);
    
    const handleManageEmployees = () => {
        openTab({
          id: '/dashboard/attendance/employees',
          title: 'Manage Employees',
          icon: Users
        });
    };

    const handleClockIn = (employeeId: number) => {
        startTransition(() => {
            clockIn(employeeId, date).then(res => {
                if (res.success) {
                    toast({ title: "Success", description: res.success });
                    getAttendanceForDate(date).then(r => r.success && setAttendance(r.data));
                } else {
                    toast({ title: "Error", description: res.error, variant: "destructive" });
                }
            });
        });
    };

    const handleClockOut = (attendanceId: number) => {
        startTransition(() => {
            clockOut(attendanceId).then(res => {
                if (res.success) {
                    toast({ title: "Success", description: res.success });
                    getAttendanceForDate(date).then(r => r.success && setAttendance(r.data));
                } else {
                    toast({ title: "Error", description: res.error, variant: "destructive" });
                }
            });
        });
    };
    
    const handleMarkAbsent = (employeeId: number) => {
        startTransition(() => {
            markAsAbsent(employeeId, date).then(res => {
                if (res.success) {
                    toast({ title: "Success", description: res.success });
                    getAttendanceForDate(date).then(r => r.success && setAttendance(r.data));
                } else {
                    toast({ title: "Error", description: res.error, variant: "destructive" });
                }
            });
        });
    };

    const handleTimeChange = (attendanceId: number, type: 'entry' | 'exit', time: string) => {
        startTransition(() => {
            updateAttendanceTime(attendanceId, type, time, date).then(res => {
                if(res.success) {
                    toast({ title: "Success", description: res.success });
                    getAttendanceForDate(date).then(r => r.success && setAttendance(r.data));
                } else {
                    toast({ title: "Error", description: res.error, variant: "destructive" });
                }
            })
        })
    }
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Present':
                return <span className="text-sm text-green-600 font-semibold">Present</span>;
            case 'Absent':
                return <span className="text-sm text-red-600 font-semibold">Absent</span>;
            case 'OnLeave':
                return <span className="text-sm text-yellow-600 font-semibold">On Leave</span>;
            default:
                return null;
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Daily Attendance</CardTitle>
                        <CardDescription>
                            Manage employee clock-ins and clock-outs for {format(date, "PPP")}.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleManageEmployees} variant="outline">
                            <Users className="mr-2 h-4 w-4" /> Manage Employees
                        </Button>
                        <Input
                            type="date"
                            value={format(date, 'yyyy-MM-dd')}
                            onChange={(e) => setDate(new Date(e.target.value))}
                            className="w-48"
                        />
                    </div>
                </div>
                 <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by employee name or position..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Entry Time</TableHead>
                                <TableHead>Exit Time</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAttendance.length > 0 ? filteredAttendance.map(att => (
                                <TableRow key={att.employeeId}>
                                    <TableCell className="font-medium">{att.name}</TableCell>
                                    <TableCell>{att.position}</TableCell>
                                    <TableCell>{getStatusBadge(att.status)}</TableCell>
                                    <TableCell>
                                        {att.entryTime ? (
                                            <Input 
                                                type="time" 
                                                defaultValue={format(new Date(att.entryTime), 'HH:mm')}
                                                onBlur={(e) => att.attendanceId && handleTimeChange(att.attendanceId, 'entry', e.target.value)}
                                                className="w-32"
                                                disabled={isPending}
                                            />
                                        ) : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        {att.exitTime ? (
                                            <Input 
                                                type="time" 
                                                defaultValue={format(new Date(att.exitTime), 'HH:mm')}
                                                onBlur={(e) => att.attendanceId && handleTimeChange(att.attendanceId, 'exit', e.target.value)}
                                                className="w-32"
                                                disabled={isPending}
                                            />
                                        ) : (att.entryTime ? "Pending" : "N/A")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                       <div className="flex gap-2 justify-end">
                                            {!att.entryTime && att.status === 'Absent' ? (
                                                <>
                                                    <Button size="sm" onClick={() => handleClockIn(att.employeeId)} disabled={isPending}>Clock In</Button>
                                                </>
                                            ) : !att.exitTime && att.status === 'Present' ? (
                                                <Button size="sm" variant="destructive" onClick={() => att.attendanceId && handleClockOut(att.attendanceId)} disabled={isPending}>Clock Out</Button>
                                            ) : att.status === 'Present' && att.exitTime ? (
                                                <span className="text-sm text-green-600 font-semibold">Completed</span>
                                            ) : (
                                                 <Button size="sm" variant="secondary" onClick={() => handleMarkAbsent(att.employeeId)} disabled={isPending}>Mark Absent</Button>
                                            )
                                        }
                                       </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No employees found. <a onClick={handleManageEmployees} className="text-primary underline cursor-pointer">Add an employee</a> to begin.
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

    

    