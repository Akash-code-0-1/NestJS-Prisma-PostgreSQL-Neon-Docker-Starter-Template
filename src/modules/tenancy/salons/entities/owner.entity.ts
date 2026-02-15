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
