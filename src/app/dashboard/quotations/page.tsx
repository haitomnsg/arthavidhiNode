
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Download, Eye, PlusCircle, Search, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getAllQuotations, getQuotationDetails } from "@/app/actions/quotations";
import { generateQuotationPdf } from "@/components/quotation-pdf-download";

type Quotation = {
  id: number;
  quotationNumber: string;
  clientName: string;
  quotationDate: Date;
  amount: number;
};

export default function AllQuotationsPage() {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getAllQuotations().then((res) => {
      if (res.success && res.data) {
        setQuotations(res.data);
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
      setIsLoading(false);
    });
  }, [toast]);

  const filteredQuotations = useMemo(() => {
    if (!searchTerm) return quotations;
    return quotations.filter(
      (q) =>
        q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, quotations]);

  const handleDownload = async (quotationId: number) => {
    setDownloadingId(quotationId);
    try {
      const res = await getQuotationDetails(quotationId);
      if (res.success && res.data) {
        generateQuotationPdf(res.data);
      } else {
        toast({
          title: "Download Failed",
          description: res.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Find Quotation</CardTitle>
              <CardDescription>Search and manage your quotations.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/dashboard/quotations/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Quotation
              </Link>
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by quotation # or client name..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length > 0 ? (
                  filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">
                        {quotation.quotationNumber}
                      </TableCell>
                      <TableCell>{quotation.clientName}</TableCell>
                      <TableCell>{format(new Date(quotation.quotationDate), "PP")}</TableCell>
                      <TableCell className="text-right">
                        Rs. {quotation.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(quotation.id)}
                                disabled={downloadingId === quotation.id}
                              >
                                {downloadingId === quotation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : (
                                  <Download className="h-4 w-4 text-primary" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download Quotation</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/dashboard/quotations/${quotation.id}`}>
                                  <Eye className="h-4 w-4 text-primary" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Quotation</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No quotations found.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableHead>
            <TableHead className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-full" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
