// src/modules/salons/entities/owner.entity.ts

export class OwnerEntity {
  id: string;
  firstName: string;
  lastName: string;

  // Security/Status tracking
  invitationSent: boolean;

  // Foreign Key
  salonId: string;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<OwnerEntity>) {
    Object.assign(this, partial);
  }
}
