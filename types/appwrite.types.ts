import { Models } from "node-appwrite";

export interface Patient extends Models.Document {
  userId: string;
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  primaryPhysician: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  allergies: string | undefined;
  currentMedication: string | undefined;
  familyMedicalHistory: string | undefined;
  pastMedicalHistory: string | undefined;
  identificationType: string | undefined;
  identificationNumber: string | undefined;
  identificationDocument: FormData | undefined;
  privacyConsent: boolean;
}

export interface Appointment extends Models.Document {
 patientId: string | { $id: string };
  patient: Patient;
  schedule: Date;
  status: Status;
  primaryPhysician: string;
  reason: string;
  note: string;
  userId: string;
  cancellationReason: string | null;
  reports?: { url: string; type: string; fileName?: string; uploadedAt: string }[]; 
}


export interface Doctor {
  $id?: string;
  name: string;
  image?: string | FormData;
  imageId?: string;
  imageUrl?: string;
  specialization?: string;
  experience?: number;
  email?: string;
  phone?: string;
 availability?: Record<string, { start: string; end: string }[]>;
}

export interface RawDoctor {
  $id?: string;
  name: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  specialization?: string;
  availability: Record<string, string[]>; 
}
