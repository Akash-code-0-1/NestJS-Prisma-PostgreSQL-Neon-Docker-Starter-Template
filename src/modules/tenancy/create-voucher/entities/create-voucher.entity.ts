export class VoucherEntity {
  id: string;
  salonId: string;

  title: string;
  subtitle?: string;

  value: number;
  price: number;

  discountPercent?: number;

  description?: string;

  validityDays: number;

  imageUrl?: string;
  theme?: string;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<VoucherEntity>) {
    Object.assign(this, partial);
  }
}
