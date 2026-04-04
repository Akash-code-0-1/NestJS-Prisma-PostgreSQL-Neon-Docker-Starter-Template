// src/modules/tenancy/receipts/entities/receipt.entity.ts
import { Expose, Type } from 'class-transformer';

export class ReceiptItemEntity {
  id: string;
  description: string;
  quantity: number;

  @Expose()
  @Type(() => Number)
  unitPrice: number;

  @Expose()
  @Type(() => Number)
  vatRate: number;

  constructor(partial: Partial<ReceiptItemEntity>) {
    Object.assign(this, partial);
  }
}

export class ReceiptEntity {
  id: string;
  receiptNumber: string;
  clientName: string;
  clientEmail: string | null;

  @Expose()
  @Type(() => Number)
  totalAmount: number;

  status: string;
  method: string;
  isIndependent: boolean;
  appointmentId: string | null;

  @Type(() => ReceiptItemEntity)
  items: ReceiptItemEntity[];

  createdAt: Date;

  constructor(partial: Partial<ReceiptEntity>) {
    Object.assign(this, partial);
  }
}
