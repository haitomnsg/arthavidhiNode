
'use server';

import db from '@/lib/db';
import * as z from 'zod';
import { revalidatePath } from 'next/cache';
import type { RowDataPacket, OkPacket } from 'mysql2';
import { startOfDay, endOfDay, format } from 'date-fns';

// Define interfaces for our data structures
interface Employee {
    id: number;
    userId: number;
    name: string;
    address: string | null;
    phone: string;
    position: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface Attendance {
    id: number;
    employeeId: number;
    date: Date;
    entryTime: Date | null;
    exitTime: Date | null;
    status: 'Present' | 'Absent' | 'OnLeave';
    remarks: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// TODO: Replace with authenticated user ID from session
const getUserId = async () => {
    return 1;
};

// Schema for adding/editing an employee
const employeeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "A valid phone number is required."),
  position: z.string().min(2, "Position is required."),
  address: z.string().optional(),
});

export const addEmployee = async (values: z.infer<typeof employeeFormSchema>) => {
    const userId = await getUserId();
    const validatedFields = employeeFormSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields provided." };
    }

    const { name, phone, position, address } = validatedFields.data;

    try {
        await db.query(
            'INSERT INTO `Employee` (`userId`, `name`, `phone`, `position`, `address`) VALUES (?, ?, ?, ?, ?)',
            [userId, name, phone, position, address]
        );
        revalidatePath('/dashboard/attendance');
        revalidatePath('/dashboard/attendance/employees');
        return { success: "Employee added successfully." };
    } catch (error) {
        console.error("Failed to add employee:", error);
        return { error: "Database Error: Failed to add employee." };
    }
};

export const getAllEmployees = async () => {
    const userId = await getUserId();
    try {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM `Employee` WHERE `userId` = ? AND `isActive` = true ORDER BY `name` ASC', [userId]);
        return { success: true, data: rows as Employee[] };
    } catch (error) {
        console.error("Failed to fetch employees:", error);
        return { error: "Database Error: Failed to fetch employees." };
    }
}


export const getAttendanceForDate = async (date: Date) => {
    const userId = await getUserId();
    const formattedDate = format(date, 'yyyy-MM-dd');

    try {
        // First, get all active employees
        const [employeeRows] = await db.query<RowDataPacket[]>(
            'SELECT `id`, `name`, `position` FROM `Employee` WHERE `userId` = ? AND `isActive` = true',
            [userId]
        );
        const employees = employeeRows as Employee[];

        if (employees.length === 0) {
            return { success: true, data: [] };
        }

        // Then, get today's attendance records for these employees
        const employeeIds = employees.map(e => e.id);
        const [attendanceRows] = await db.query<RowDataPacket[]>(
            'SELECT * FROM `Attendance` WHERE `employeeId` IN (?) AND `date` = ?',
            [employeeIds, formattedDate]
        );
        const attendanceRecords = attendanceRows as Attendance[];

        // Map attendance to employees
        const attendanceMap = new Map(attendanceRecords.map(a => [a.employeeId, a]));

        const combinedData = employees.map(employee => {
            const attendance = attendanceMap.get(employee.id);
            return {
                employeeId: employee.id,
                name: employee.name,
                position: employee.position,
                attendanceId: attendance?.id || null,
                entryTime: attendance?.entryTime || null,
                exitTime: attendance?.exitTime || null,
                status: attendance?.status || 'Absent',
            };
        });
        
        return { success: true, data: combinedData };
    } catch (error) {
        console.error("Failed to fetch attendance:", error);
        return { error: "Database Error: Failed to fetch attendance data." };
    }
};

export const clockIn = async (employeeId: number, date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const entryTime = new Date();

    try {
        await db.query(
            'INSERT INTO `Attendance` (`employeeId`, `date`, `entryTime`, `status`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `entryTime` = ?, `status` = ?',
            [employeeId, formattedDate, entryTime, 'Present', entryTime, 'Present']
        );
        revalidatePath('/dashboard/attendance');
        return { success: "Clocked in successfully." };
    } catch (error) {
        console.error("Clock-in failed:", error);
        return { error: "Database Error: Failed to clock in." };
    }
};

export const clockOut = async (attendanceId: number) => {
    const exitTime = new Date();
    try {
        const [result] = await db.query<OkPacket>(
            'UPDATE `Attendance` SET `exitTime` = ? WHERE `id` = ?',
            [exitTime, attendanceId]
        );
        if (result.affectedRows === 0) {
            return { error: "Attendance record not found." };
        }
        revalidatePath('/dashboard/attendance');
        return { success: "Clocked out successfully." };
    } catch (error) {
        console.error("Clock-out failed:", error);
        return { error: "Database Error: Failed to clock out." };
    }
};

export const updateAttendanceTime = async (attendanceId: number, type: 'entry' | 'exit', time: string, date: Date) => {
    const columnToUpdate = type === 'entry' ? 'entryTime' : 'exitTime';

    if (!time) {
        try {
            await db.query(`UPDATE Attendance SET ${columnToUpdate} = NULL WHERE id = ?`, [attendanceId]);
            revalidatePath('/dashboard/attendance');
            return { success: "Time cleared." };
        } catch (error) {
            console.error("Failed to clear time:", error);
            return { error: "Database Error: Failed to clear time." };
        }
    }

    try {
        // Fetch the original attendance record to get the correct date
        const [attendanceRows] = await db.query<RowDataPacket[]>('SELECT `date` FROM `Attendance` WHERE `id` = ?', [attendanceId]);
        if (attendanceRows.length === 0) {
            return { error: "Attendance record not found." };
        }
        const originalAttendance = attendanceRows[0] as Attendance;
        const originalDate = new Date(originalAttendance.date);

        // Combine the original date with the new time string
        const [hours, minutes] = time.split(':');
        const newDateTime = new Date(originalDate);
        newDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const [result] = await db.query<OkPacket>(
            `UPDATE Attendance SET ${columnToUpdate} = ? WHERE id = ?`,
            [newDateTime, attendanceId]
        );

        if (result.affectedRows === 0) {
            // This case should theoretically not be hit due to the check above, but it's good practice.
            return { error: "Attendance record not found during update." };
        }
        
        revalidatePath('/dashboard/attendance');
        return { success: "Time updated successfully." };

    } catch (error) {
        console.error("Failed to update time:", error);
        return { error: "Database Error: Failed to update time." };
    }
};


export const markAsAbsent = async (employeeId: number, date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    try {
        await db.query(
            'INSERT INTO `Attendance` (`employeeId`, `date`, `status`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `status` = ?, `entryTime` = NULL, `exitTime` = NULL',
            [employeeId, formattedDate, 'Absent', 'Absent']
        );
        revalidatePath('/dashboard/attendance');
        return { success: "Marked as absent." };
    } catch (error) {
        console.error("Mark as absent failed:", error);
        return { error: "Database Error: Failed to mark as absent." };
    }
};

export const getEmployeeAttendanceReport = async (employeeId: number, year: number, month: number) => {
    try {
        const [employeeRows] = await db.query<RowDataPacket[]>('SELECT `id`, `name` FROM `Employee` WHERE `id` = ?', [employeeId]);
        if (employeeRows.length === 0) {
            return { error: "Employee not found." };
        }
        const employee = employeeRows[0] as Employee;

        // Fetch attendance for the entire month
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const [attendanceRows] = await db.query<RowDataPacket[]>(
            'SELECT * FROM `Attendance` WHERE `employeeId` = ? AND `date` BETWEEN ? AND ?',
            [employeeId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')]
        );

        const attendanceData = (attendanceRows as Attendance[]).map(att => {
            let workHours = null;
            if (att.entryTime && att.exitTime) {
                const diffMs = new Date(att.exitTime).getTime() - new Date(att.entryTime).getTime();
                workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
            }
            return {
                date: format(new Date(att.date), 'yyyy-MM-dd'),
                status: att.status,
                entryTime: att.entryTime ? format(new Date(att.entryTime), 'p') : null,
                exitTime: att.exitTime ? format(new Date(att.exitTime), 'p') : null,
                workHours: workHours
            }
        });

        return { success: true, data: { employee, attendance: attendanceData } };
    } catch (error) {
        console.error("Failed to fetch attendance report:", error);
        return { error: "Database Error: Failed to fetch report." };
    }
}
