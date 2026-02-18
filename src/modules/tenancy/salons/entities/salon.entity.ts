export class SalonEntity {
  id: string;
  name: string;
  businessType: string;
  vtaNumber: string;
  employeeCount: string;
  email: string;
  phoneNumber: string;
  country: string;
  city: string;
  province: string;
  zipCode: string;
  trialPeriod: string;
  initialPlan: string;
  createdAt: Date;
  updatedAt: Date;
  owners?: OwnerEntity[];

  constructor(partial: Partial<SalonEntity>) {
    Object.assign(this, partial);
  }
}

export class OwnerEntity {
  id: string;
  firstName: string;
  lastName: string;
  invitationSent: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<OwnerEntity>) {
    Object.assign(this, partial);
  }
}
