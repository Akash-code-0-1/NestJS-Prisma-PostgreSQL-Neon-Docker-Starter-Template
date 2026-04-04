import {
  BundleScheduleType,
  BundleCategory,
  BundlePriceType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class BundleEntity {
  id: string;
  salonId: string;
  name: string;
  category: BundleCategory;
  description: string | null;
  priceType: BundlePriceType;
  price: Decimal;
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
export { BundleCategory, BundleScheduleType, BundlePriceType };
