export class AppointmentEntity {
  id: string;
  salonId: string;
  clientId: string;

  date: Date;
  note?: string;
  status: string;

  participants: any[];
  payment?: any;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<AppointmentEntity>) {
    Object.assign(this, partial);
  }
}
