export enum BundleScheduleType {
  BOOKED_IN_SEQUENCE = 'BOOKED_IN_SEQUENCE',
  BOOKED_IN_PARALLEL = 'BOOKED_IN_PARALLEL',
}

export enum BundlePriceType {
  REGULAR = 'REGULAR',
  PROMOTION = 'PROMOTION',
}

export enum BundleCategory {
  FIXED = 'FIXED',
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
}

export class BundleEntity {
  id: string;
  salonId: string;
  name: string;
  category: BundleCategory;
  description: string | null;
  priceType: BundlePriceType;
  price: number;
  duration: number;
  scheduleType: BundleScheduleType;
  addToOnlineBook: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  _count?: {
    services: number;
    members: number;
  };

  constructor(partial: Partial<BundleEntity>) {
    Object.assign(this, partial);
  }
}
