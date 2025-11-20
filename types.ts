
export enum UserRole {
  DOCTOR = 'DOCTOR',
  PHARMACY = 'PHARMACY',
  ADMIN = 'ADMIN'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  INCOMPLETE = 'INCOMPLETE',
  TERMINATED = 'TERMINATED'
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPLIANCE_ADMIN = 'COMPLIANCE_ADMIN',
  REVIEWER = 'REVIEWER'
}

export enum AdminPermission {
  VIEW_DOCTOR_LIST = 'VIEW_DOCTOR_LIST',
  APPROVE_REJECT_DOCTOR = 'APPROVE_REJECT_DOCTOR',
  VIEW_PHARMACY_LIST = 'VIEW_PHARMACY_LIST',
  APPROVE_REJECT_PHARMACY = 'APPROVE_REJECT_PHARMACY',
  TERMINATE_ACCOUNTS = 'TERMINATE_ACCOUNTS',
  ACCESS_LOGS_AUDITS = 'ACCESS_LOGS_AUDITS',
  MANAGE_SYSTEM_SETTINGS = 'MANAGE_SYSTEM_SETTINGS',
  MANAGE_ADMIN_ACCOUNTS = 'MANAGE_ADMIN_ACCOUNTS'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For mock auth only
  role: UserRole;
  verificationStatus: VerificationStatus;
  registrationDate: string;
  licenseNumber?: string;
  state?: string;
  
  // Termination details
  terminatedAt?: string | null;
  terminatedBy?: string | null;
  terminationReason?: string | null;

  // Security
  forcePasswordChange?: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DoctorProfile {
  devxId: string;
  medicalDegree: string;
  registrationNumber: string;
  stateCouncil: string;
  specialty?: string;
  clinicName: string;
  clinicAddress: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface Medicine {
  name: string;
  dosage: string; // e.g., 500mg
  frequency: string; // e.g., 1-0-1
  duration: string; // e.g., 5 days
  instructions: string; // e.g., After food
}

export interface Prescription {
  id: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  diagnosis: string;
  medicines: Medicine[];
  advice: string;
  date: string; // ISO string
  status: 'ISSUED' | 'DISPENSED' | 'REJECTED' | 'CANCELLED';
  pharmacyId?: string;
  pharmacyName?: string;
  digitalSignatureToken: string;
}

export interface VerificationError {
  field: string;
  message: string;
}
