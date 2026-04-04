export class ContactMessageEntity {
  id: string;
  salonId: string;
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ContactMessageEntity>) {
    Object.assign(this, partial);
  }
}
