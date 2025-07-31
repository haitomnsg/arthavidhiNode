
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { getEmployeeAttendanceReport } from '@/app/actions/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppState } from '@/hooks/use-app-state';

type AttendanceReport = {
    employee: { id: number; name: string; };
    attendance: {
        date: string;
        status: string;
        entryTime: string | null;
        exitTime: string | null;
        workHours: number | null;
    }[];
};

export default function EmployeeReportPage({ params }: { params: { employeeId: number }}) {
    const router = useRouter();
    const { toast } = useToast();
    const { closeTab } = useAppState();
    const employeeId = Number(params.employeeId);
    
    const [report, setReport] = useState<AttendanceReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchReport = useCallback(() => {
        if (isNaN(employeeId)) {
            toast({ title: "Error", description: "Invalid Employee ID.", variant: "destructive" });
            closeTab(`/dashboard/attendance/employees/${employeeId}`);
            return;
        }
        setIsLoading(true);
        getEmployeeAttendanceReport(employeeId, currentDate.getFullYear(), currentDate.getMonth())
            .then(res => {
                if (res.success && res.data) {
                    setReport(res.data);
                } else {
                    toast({ title: "Error", description: res.error || "Failed to load report", variant: "destructive" });
                    closeTab(`/dashboard/attendance/employees/${employeeId}`);
                }
            })
            .finally(() => setIsLoading(false));
    }, [employeeId, currentDate, toast, closeTab]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const changeMonth = (amount: number) => {
        setCurrentDate(current => amount > 0 ? addMonths(current, 1) : subMonths(current, 1));
    };

    if (isLoading || !report) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    const { employee, attendance } = report;
    const firstDayOfMonth = startOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday...

    const attendanceMap = new Map(attendance.map(a => [format(new Date(a.date), 'yyyy-MM-dd'), a]));
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <TooltipProvider>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                            <CardTitle>Attendance Report: {employee.name}</CardTitle>
                            <CardDescription>Monthly overview of employee attendance.</CardDescription>
                         </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold w-36 text-center">
                                {format(currentDate, "MMMM yyyy")}
                            </span>
                            <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-1 text-center font-semibold text-muted-foreground">
                        {weekDays.map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 mt-2">
                        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="border rounded-md h-24" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNumber = i + 1;
                            const dateKey = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber), 'yyyy-MM-dd');
                            const dayAttendance = attendanceMap.get(dateKey);

                            return (
                                <Tooltip key={dayNumber} delayDuration={100}>
                                    <TooltipTrigger asChild>
                                        <div className={cn("border rounded-md h-24 p-2 flex flex-col", {
                                            "bg-green-100 dark:bg-green-900/50": dayAttendance?.status === 'Present',
                                            "bg-red-100 dark:bg-red-900/50": dayAttendance?.status === 'Absent',
                                            "bg-yellow-100 dark:bg-yellow-900/50": dayAttendance?.status === 'OnLeave',
                                        })}>
                                            <span className="font-bold">{dayNumber}</span>
                                            {dayAttendance && (
                                                <div className="text-xs mt-1 flex-grow flex flex-col justify-end">
                                                    <p>{dayAttendance.status}</p>
                                                    {dayAttendance.workHours != null && <p>{dayAttendance.workHours} hrs</p>}
                                                </div>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    {dayAttendance && (
                                        <TooltipContent>
                                            <p className="font-bold">{format(new Date(dayAttendance.date), "PPP")}</p>
                                            <p>Status: {dayAttendance.status}</p>
                                            {dayAttendance.entryTime && <p>In: {dayAttendance.entryTime}</p>}
                                            {dayAttendance.exitTime && <p>Out: {dayAttendance.exitTime}</p>}
                                            {dayAttendance.workHours != null && <p>Total: {dayAttendance.workHours} hours</p>}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
