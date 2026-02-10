// src/modules/salons/entities/salon.entity.ts

export class SalonEntity {
  id: string;
  name: string;
  businessType: string;
  vtaNumber: string;
  employeeCount: string;

  // Contact Info
  email: string;
  phoneNumber: string;

  // Provenance
  country: string;
  city: string;
  province: string;
  zipCode: string;

  // Subscription
  trialPeriod: string;
  initialPlan: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Relations (Only included if you fetch them)
  owners?: any[];

  constructor(partial: Partial<SalonEntity>) {
    Object.assign(this, partial);
  }
}
