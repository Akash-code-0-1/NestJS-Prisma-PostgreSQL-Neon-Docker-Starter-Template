export class ServiceEntity {
  id: string;

  salonId: string;

  serviceName: string;

  categories: string[];

  duration: number;

  postBreakMin: number;

  price: number;

  vat: number;

  description?: string;

  icon?: string;

  createdAt: Date;

  updatedAt: Date;

  constructor(partial: Partial<ServiceEntity>) {
    Object.assign(this, partial);
  }
}
