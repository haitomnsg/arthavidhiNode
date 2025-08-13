'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface Company {
    name?: string | null;
}

interface ProfitLossReportData {
    totalRevenue: number;
    totalPurchases: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
}

interface PdfProps {
    reportData: ProfitLossReportData;
    company: Company;
    dateRange: DateRange;
}

export const generateProfitLossReportPdf = ({ reportData, company, dateRange }: PdfProps) => {
    const doc = new jsPDF();
    const { totalRevenue, totalPurchases, totalExpenses, grossProfit, netProfit } = reportData;

    const primaryColor = [255, 135, 3];
    const textColor = [38, 38, 38];
    const successColor = [34, 197, 94];
    const dangerColor = [239, 68, 68];
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = 20;

    // --- Header ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Profit & Loss Statement", margin, y);
    y += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(company?.name || "Your Company", margin, y);
    y += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`For the period: ${format(dateRange.from!, "PPP")} to ${format(dateRange.to!, "PPP")}`, margin, y);
    y += 15;

    // --- P&L Table ---
    const formatCurrency = (val: number) => `Rs. ${val.toFixed(2)}`;
    
    const tableBody = [
        ["Total Revenue", formatCurrency(totalRevenue)],
        ["Cost of Goods Sold (Purchases)", `( ${formatCurrency(totalPurchases)} )`],
        [{ content: "Gross Profit", styles: { fontStyle: 'bold' } }, { content: formatCurrency(grossProfit), styles: { fontStyle: 'bold' } }],
        ["Operating Expenses", `( ${formatCurrency(totalExpenses)} )`],
    ];

    autoTable(doc, {
        startY: y,
        body: tableBody,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 3, overflow: 'linebreak' },
        columnStyles: { 1: { halign: 'right' } },
        didParseCell: (data) => {
             if (data.row.index === 2) { // Gross Profit row
                data.cell.styles.borderWidth = { top: 0.5, bottom: 0.1 };
                data.cell.styles.borderColor = [150,150,150];
            }
        }
    });
    
    y = (doc as any).lastAutoTable.finalY + 5;

    // --- Net Profit/Loss ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');

    const netProfitColor = netProfit >= 0 ? successColor : dangerColor;
    doc.setTextColor(netProfitColor[0], netProfitColor[1], netProfitColor[2]);
    doc.rect(margin, y, pageWidth - (margin * 2), 12, 'F');
    doc.setTextColor(255, 255, 255);
    
    doc.text("Net Profit / (Loss)", margin + 5, y + 8);
    doc.text(formatCurrency(netProfit), pageWidth - margin - 5, y + 8, { align: 'right' });


    // --- Footer ---
    y = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text("This is an unaudited report generated for internal purposes.", pageWidth / 2, y, { align: 'center' });
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
        doc.text(`Generated on: ${format(new Date(), "PPP p")}`, margin, doc.internal.pageSize.height - 10);
    }

    // --- Save ---
    doc.save(`Profit_Loss_Report_${format(dateRange.from!, "yyyy-MM-dd")}_to_${format(dateRange.to!, "yyyy-MM-dd")}.pdf`);
};
