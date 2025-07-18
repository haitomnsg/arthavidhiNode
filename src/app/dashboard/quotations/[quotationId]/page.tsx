
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, Loader2, Save, Trash2, ArrowLeft, Pencil } from 'lucide-react';

import { getQuotationDetails, deleteQuotation } from '@/app/actions/quotations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { generateQuotationPdf } from '@/components/quotation-pdf-download';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { QuotationPreview } from '@/components/quotation-preview';
import { EditQuotationForm } from '@/components/edit-quotation-form';

type QuotationDataType = {
  quotation: any;
  company: any;
  totals: any;
};

export default function ViewQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const quotationId = Number(params.quotationId);

  const [quotationData, setQuotationData] = useState<QuotationDataType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchQuotationData = useCallback(() => {
    if (isNaN(quotationId)) {
      toast({ title: "Error", description: "Invalid Quotation ID.", variant: "destructive" });
      router.push('/dashboard/quotations');
      return;
    }
    setIsLoading(true);
    getQuotationDetails(quotationId).then(res => {
      if (res.success && res.data) {
        setQuotationData(res.data);
      } else {
        toast({ title: "Error", description: res.error || "Failed to fetch quotation details.", variant: "destructive" });
        router.push('/dashboard/quotations');
      }
    }).finally(() => {
      setIsLoading(false);
    });
  }, [quotationId, router, toast]);

  useEffect(() => {
    fetchQuotationData();
  }, [fetchQuotationData]);

  const handleDownload = () => {
    if (!quotationData) return;
    setIsDownloading(true);
    try {
      generateQuotationPdf(quotationData);
    } catch (error) {
      toast({ title: "Download Failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    startTransition(() => {
      deleteQuotation(quotationId).then(res => {
        if (res.success) {
          toast({ title: "Success", description: res.success });
          router.push('/dashboard/quotations');
        } else {
          toast({ title: "Error", description: res.error, variant: "destructive" });
        }
      });
    });
  };

  if (isLoading || !quotationData) {
    return <ViewQuotationSkeleton />;
  }

  const { quotation, company, totals } = quotationData;

  return (
    <>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quotation #{quotation.quotationNumber}</DialogTitle>
            <DialogDescription>
              Make changes to the quotation details and items below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <EditQuotationForm
            quotationData={quotationData}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              fetchQuotationData();
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quotation Details</CardTitle>
                  <CardDescription>Viewing quotation #{quotation.quotationNumber}</CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/quotations">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to All Quotations
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <QuotationPreview
                company={company}
                quotation={quotation}
                subtotal={totals.subtotal}
                vat={totals.vat}
                total={totals.total}
                quotationNumber={quotation.quotationNumber}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage this quotation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setIsEditDialogOpen(true)} className="w-full">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Quotation
              </Button>

              <Button onClick={handleDownload} disabled={isDownloading} className="w-full">
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isPending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Quotation
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this quotation
                      and all of its associated data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                      {isPending ? 'Deleting...' : 'Continue'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function ViewQuotationSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-8 border rounded-lg">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <Skeleton className="h-8 w-32 mb-4" />
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-64 mb-1" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                     <div className="text-right">
                        <Skeleton className="h-9 w-32 mb-2" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <Skeleton className="h-5 w-16 mb-2" />
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-48 mb-1" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <Skeleton className="h-40 w-full" />
                <div className="flex justify-end mt-8">
                    <div className="w-full max-w-xs space-y-3">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card className="sticky top-20">
            <CardHeader>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
