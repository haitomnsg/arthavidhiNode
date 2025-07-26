
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { format } from 'date-fns';
import { Loader2, UserPlus, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceForDate, clockIn, clockOut, updateAttendanceTime } from '@/app/actions/attendance';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

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
                        <Button asChild variant="outline">
                            <Link href="/dashboard/attendance/employees">
                                <Users className="mr-2 h-4 w-4" /> Manage Employees
                            </Link>
                        </Button>
                        <Input
                            type="date"
                            value={format(date, 'yyyy-MM-dd')}
                            onChange={(e) => setDate(new Date(e.target.value))}
                            className="w-48"
                        />
                    </div>
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
                                <TableHead>Entry Time</TableHead>
                                <TableHead>Exit Time</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendance.length > 0 ? attendance.map(att => (
                                <TableRow key={att.employeeId}>
                                    <TableCell className="font-medium">{att.name}</TableCell>
                                    <TableCell>{att.position}</TableCell>
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
                                        {!att.entryTime ? (
                                            <Button size="sm" onClick={() => handleClockIn(att.employeeId)} disabled={isPending}>Clock In</Button>
                                        ) : !att.exitTime ? (
                                            <Button size="sm" variant="destructive" onClick={() => att.attendanceId && handleClockOut(att.attendanceId)} disabled={isPending}>Clock Out</Button>
                                        ) : (
                                            <span className="text-sm text-green-600 font-semibold">Completed</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No employees found. <Link href="/dashboard/attendance/employees" className="text-primary underline">Add an employee</Link> to begin.
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
