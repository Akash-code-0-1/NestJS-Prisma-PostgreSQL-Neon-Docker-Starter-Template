export class VoucherPurchaseEntity {
  id: string;
  voucherId: string;
  salonId: string;
  userId: string;

  code: string;

  senderName: string;
  recipientName: string;
  recipientEmail: string;

  expiryDate: Date;
  status: string;

  createdAt: Date;

  constructor(partial: Partial<VoucherPurchaseEntity>) {
    Object.assign(this, partial);
  }
}
