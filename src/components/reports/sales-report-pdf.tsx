
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

interface SalesReportData {
    summary: {
        totalRevenue: number;
        totalDiscount: number;
        totalVat: number;
        totalBills: number;
    };
    bills: {
        id: number;
        invoiceNumber: string;
        clientName: string;
        billDate: string;
        amount: string;
        status: string;
    }[];
}

interface PdfProps {
    reportData: SalesReportData;
    company: Company;
    dateRange: DateRange;
}

export const generateSalesReportPdf = ({ reportData, company, dateRange }: PdfProps) => {
    const doc = new jsPDF();
    const { summary, bills } = reportData;

    const primaryColor = [255, 135, 3];
    const textColor = [38, 38, 38];
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = 20;

    // --- Header ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Sales Report", margin, y);
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

    const summaryData = [
        ["Total Revenue", `Rs. ${summary.totalRevenue.toFixed(2)}`],
        ["Total Discount", `Rs. ${summary.totalDiscount.toFixed(2)}`],
        ["Total VAT Collected", `Rs. ${summary.totalVat.toFixed(2)}`],
        ["Total Bills Issued", summary.totalBills.toString()],
    ];

    autoTable(doc, {
        startY: y,
        body: summaryData,
        theme: 'grid',
        styles: {
            fontSize: 11,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [252, 243, 232],
            textColor: textColor,
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { fontStyle: 'bold' },
        }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // --- Detailed Bills Section ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Detailed Bill List", margin, y);
    y += 8;

    if (bills.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Invoice #', 'Client Name', 'Date', 'Status', 'Amount (Rs.)']],
            body: bills.map(bill => [
                bill.invoiceNumber,
                bill.clientName,
                bill.billDate,
                bill.status,
                bill.amount,
            ]),
            theme: 'striped',
            headStyles: {
                fillColor: [50, 50, 50],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            columnStyles: {
                4: { halign: 'right' }
            }
        });
    } else {
        doc.setFontSize(10);
        doc.text("No bills found for the selected period.", margin, y);
    }
    
    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth - margin,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
        doc.text(
            `Generated on: ${format(new Date(), "PPP p")}`,
            margin,
            doc.internal.pageSize.height - 10
        );
    }

    // --- Save ---
    doc.save(`Sales_Report_${format(dateRange.from!, "yyyy-MM-dd")}_to_${format(dateRange.to!, "yyyy-MM-dd")}.pdf`);
};
