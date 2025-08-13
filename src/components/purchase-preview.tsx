
'use client';

import { format } from 'date-fns';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import type { PurchaseFormValues } from '@/app/dashboard/purchase/page';

// Define types locally
interface Company {
    id: number;
    userId: number;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    panNumber?: string | null;
    vatNumber?: string | null;
}

interface PurchasePreviewProps {
    company: Partial<Company>;
    purchase: Partial<PurchaseFormValues> | any;
    total: number;
}

export function PurchasePreview({ company, purchase, total }: PurchasePreviewProps) {
  const formattedDate = purchase.purchaseDate ? format(new Date(purchase.purchaseDate), "PPP") : format(new Date(), "PPP");
  
  return (
    <div className="bg-card text-card-foreground p-8 rounded-lg border print:border-none print:shadow-none">
       <header className="flex justify-between items-start mb-8">
        <div>
          <Logo />
          <p className="font-bold text-lg mt-4">{company?.name || "Your Company"}</p>
          <p className="text-muted-foreground text-sm">{company?.address}</p>
          <div className="text-muted-foreground text-sm flex flex-wrap gap-x-1">
            {company?.phone && <span>Phone: {company.phone}</span>}
            {company?.email && company?.phone && <span>|</span>}
            {company?.email && <span>Email: {company.email}</span>}
          </div>
          <div className="text-muted-foreground text-sm flex flex-wrap gap-x-1">
            {company?.panNumber && <span>PAN: {company.panNumber}</span>}
            {company?.vatNumber && company?.panNumber && <span>|</span>}
            {company?.vatNumber && <span>VAT: {company.vatNumber}</span>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold uppercase text-primary">Purchase Entry</h2>
          <p className="text-muted-foreground">Bill # {purchase.supplierBillNumber || "..."}</p>
        </div>
       </header>
       <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h4 className="font-semibold mb-2">Supplier:</h4>
          <p className="font-bold">{purchase.supplierName || "Supplier Name"}</p>
          <p className="text-sm text-muted-foreground">{purchase.supplierAddress || "Supplier Address"}</p>
          <p className="text-sm text-muted-foreground">{purchase.supplierPhone || "Supplier Phone"}</p>
        </div>
         <div className="text-right">
          <p><span className="font-semibold">Purchase Date:</span> {formattedDate}</p>
        </div>
       </div>

       <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left font-semibold">Item</th>
              <th className="p-3 text-center font-semibold">Qty</th>
              <th className="p-3 text-right font-semibold">Rate</th>
              <th className="p-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(purchase.items && purchase.items.length > 0 && (purchase.items[0].productName || (purchase.items[0].rate || 0) > 0)) ? purchase.items.map((item: any, index: number) => (
              <tr key={index} className="border-b">
                <td className="p-3">{item.productName || '...'}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">Rs. {(Number(item.rate) || 0).toFixed(2)}</td>
                <td className="p-3 text-right">Rs. {((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toFixed(2)}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Add items to see them here.</td></tr>
            )}
          </tbody>
        </table>
       </div>

       <div className="mt-8 flex justify-between items-start">
         <div className="w-1/2">
             {purchase.remarks && (
                 <div>
                     <h4 className="font-semibold text-sm mb-1">Remarks:</h4>
                     <p className="text-xs text-muted-foreground whitespace-pre-wrap">{purchase.remarks}</p>
                 </div>
             )}
         </div>
         <div className="w-full max-w-xs space-y-2">
            <Separator />
            <div className="flex justify-between font-bold text-lg"><span className="text-primary">Total</span><span className="text-primary">Rs. {total.toFixed(2)}</span></div>
         </div>
       </div>

       <footer className="mt-16 text-center text-xs text-muted-foreground">
        <p>ArthaVidhi - Billing Software by Haitomns Groups</p>
       </footer>
    </div>
  )
}
