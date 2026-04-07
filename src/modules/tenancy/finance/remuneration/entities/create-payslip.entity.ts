export class PayslipEntity {
  id: string;
  salonId: string;
  employeeId: string;
  date: Date;
  netAmount: number;
  grossAmount: number;
  contributions: number;
  tfrContribution: number;
  tfrAccumulated: number;
  status: string;
  documentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
