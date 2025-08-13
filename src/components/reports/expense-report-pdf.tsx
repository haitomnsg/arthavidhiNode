'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface Company {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    panNumber?: string | null;
    vatNumber?: string | null;
}

interface ExpenseReportData {
    totalExpenses: number;
    expenses: {
        id: number;
        date: string;
        category: string;
        description: string | null;
        amount: string;
    }[];
}

interface PdfProps {
    reportData: ExpenseReportData;
    company: Company;
    dateRange: DateRange;
}

export const generateExpenseReportPdf = ({ reportData, company, dateRange }: PdfProps) => {
    const doc = new jsPDF();
    const { totalExpenses, expenses } = reportData;

    const primaryColor = [255, 135, 3];
    const textColor = [38, 38, 38];
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = 20;

    // --- Header ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Expense Report", margin, y);
    y += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(company?.name || "Your Company", margin, y);
    y += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Period: ${format(dateRange.from!, "PPP")} to ${format(dateRange.to!, "PPP")}`, margin, y);
    y += 15;

    // --- Summary Section ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Summary", margin, y);
    y += 8;

    autoTable(doc, {
        startY: y,
        body: [["Total Expenses", `Rs. ${totalExpenses.toFixed(2)}`]],
        theme: 'grid',
        styles: { fontSize: 11, cellPadding: 3 },
        headStyles: { fillColor: [252, 243, 232], textColor: textColor, fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // --- Detailed Expenses Section ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Detailed Expense List", margin, y);
    y += 8;

    if (expenses.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Date', 'Category', 'Description', 'Amount (Rs.)']],
            body: expenses.map(exp => [
                exp.date,
                exp.category,
                exp.description || 'N/A',
                exp.amount,
            ]),
            theme: 'striped',
            headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
            columnStyles: { 3: { halign: 'right' } }
        });
    } else {
        doc.setFontSize(10);
        doc.text("No expenses found for the selected period.", margin, y);
    }
    
    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
        doc.text(`Generated on: ${format(new Date(), "PPP p")}`, margin, doc.internal.pageSize.height - 10);
    }

    // --- Save ---
    doc.save(`Expense_Report_${format(dateRange.from!, "yyyy-MM-dd")}_to_${format(dateRange.to!, "yyyy-MM-dd")}.pdf`);
};
