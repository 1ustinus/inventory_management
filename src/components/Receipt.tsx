import React from 'react';
import { Sale } from '../types';
import { STORE_NAME, STORE_ADDRESS, STORE_PHONE } from '../constants';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

interface ReceiptProps {
  sale: Sale;
}

export default function Receipt({ sale }: ReceiptProps) {
  return (
    <div className="w-[80mm] p-4 bg-white text-slate-900 mx-auto font-mono text-[10px] space-y-4" id="printable-receipt">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-bold uppercase">{STORE_NAME}</h2>
        <p>{STORE_ADDRESS}</p>
        <p>TEL: {STORE_PHONE}</p>
      </div>

      <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-0.5">
        <div className="flex justify-between">
          <span>TID:</span>
          <span>{sale.transactionId}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{format(new Date(sale.createdAt), 'yyyy-MM-dd HH:mm')}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{sale.cashierId.slice(0, 8)}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between font-bold border-b border-slate-100 pb-1">
          <span className="w-1/2">ITEM</span>
          <span className="w-1/4 text-right">QTY</span>
          <span className="w-1/4 text-right">PRICE</span>
        </div>
        {sale.items.map((item, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex justify-between leading-tight">
              <span className="w-1/2 truncate uppercase">{item.name}</span>
              <span className="w-1/4 text-right">{item.quantity}</span>
              <span className="w-1/4 text-right">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Vat (12%):</span>
          <span>{formatCurrency(sale.tax)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-100">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Payment:</span>
          <span className="uppercase">{sale.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span>Received:</span>
          <span>{formatCurrency(sale.amountReceived)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Change:</span>
          <span>{formatCurrency(sale.change)}</span>
        </div>
      </div>

      <div className="text-center pt-4 border-t border-dashed border-slate-300">
        <p className="font-bold">THANK YOU FOR SHOPPING!</p>
        <p>Please come again.</p>
        <div className="mt-4 opacity-50 flex justify-center">
            {/* Simple placeholder for receipt barcode/QR */}
            <div className="h-8 w-40 bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
