export class MemberProfileEntity {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  startDate: Date;
  contractType: string;
  status: string;
  location: string;

  personalData: {
    dob: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    emergencyContact: { name: string; phone: string };
  };

  contract: {
    endDate: string;
    taxIdCode: string;
    role: string;
    remuneration: string;
    iban: string;
  };

  address: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
  };

  services: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
    isActive: boolean;
  }>;

  additionalData: {
    certifications: string[];
    completedCourses: string[];
    languages: Array<{ name: string; level: string }>;
    directManager: {
      name: string;
      lastAccess: Date;
      permits: string;
    } | null;
  };

  socialLinks: Array<{ platform: string; status: string }>;

  constructor(partial: Partial<MemberProfileEntity>) {
    Object.assign(this, partial);
  }
}
