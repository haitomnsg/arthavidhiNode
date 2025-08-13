
"use client";

import React, { useState, useTransition } from "react";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { AreaChart, CalendarIcon, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { getSalesReport } from "@/app/actions/reports";
import { generateSalesReportPdf } from "@/components/reports/sales-report-pdf";
import { getCompanyDetails } from "@/app/actions/company";

type ReportCardProps = {
  title: string;
  description: string;
  onGenerate: (dateRange: DateRange) => void;
  isGenerating: boolean;
};

const ReportCard: React.FC<ReportCardProps> = ({ title, description, onGenerate, isGenerating }) => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const handleGenerate = () => {
    if (date) {
      onGenerate(date);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} disabled={isGenerating || !date?.from || !date?.to}>
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Generate Report
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function ReportsPage() {
    const { toast } = useToast();
    const [isGenerating, startTransition] = useTransition();

    const handleGenerateSalesReport = async (dateRange: DateRange) => {
        if (!dateRange.from || !dateRange.to) return;
        
        startTransition(async () => {
            const [salesResponse, companyResponse] = await Promise.all([
                getSalesReport(dateRange.from!, dateRange.to!),
                getCompanyDetails()
            ]);

            if (salesResponse.error) {
                toast({ title: "Error", description: salesResponse.error, variant: "destructive" });
                return;
            }
            if (salesResponse.success) {
                try {
                    generateSalesReportPdf({
                        reportData: salesResponse.data,
                        company: companyResponse,
                        dateRange,
                    });
                } catch (e) {
                    toast({ title: "PDF Error", description: "Failed to generate PDF.", variant: "destructive" });
                }
            }
        });
    };
    
    const handleNotImplemented = () => {
        toast({
            title: "Coming Soon!",
            description: "This report type is not yet implemented.",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <AreaChart className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports Manager</h1>
                    <p className="text-muted-foreground">
                        Generate and download detailed reports for your business operations.
                    </p>
                </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ReportCard
                    title="Sales Report"
                    description="Summary of revenue, discounts, and VAT from all bills."
                    onGenerate={handleGenerateSalesReport}
                    isGenerating={isGenerating}
                />
                <ReportCard
                    title="Expense Report"
                    description="Detailed breakdown of all expenses by category."
                    onGenerate={handleNotImplemented}
                    isGenerating={isGenerating}
                />
                <ReportCard
                    title="Purchase Report"
                    description="Summary of all inventory purchases and costs from suppliers."
                    onGenerate={handleNotImplemented}
                    isGenerating={isGenerating}
                />
                 <ReportCard
                    title="Profit & Loss Report"
                    description="Compares revenue vs. expenses to estimate profitability."
                    onGenerate={handleNotImplemented}
                    isGenerating={isGenerating}
                />
            </div>
        </div>
    );
}
