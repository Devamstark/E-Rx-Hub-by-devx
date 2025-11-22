
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

export enum DocumentType {
  MEDICAL_DEGREE = 'MEDICAL_DEGREE',
  NMC_REGISTRATION = 'NMC_REGISTRATION',
  PHARMACY_LICENSE = 'PHARMACY_LICENSE',
  CLINIC_LICENSE = 'CLINIC_LICENSE',
  OTHER = 'OTHER'
}

export interface UserDocument {
  id: string;
  type: DocumentType;
  url: string;
  name: string;
  uploadedAt: string;
}

export interface DbConfig {
    url: string;
    key: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  manufacturer: string;
  batchNumber: string;
  barcode?: string;
  expiryDate: string;
  stock: number;
  minStockLevel: number;
  purchasePrice: number; // Cost to pharmacy
  mrp: number; // Selling price
  unitPrice?: number; // Deprecated, use mrp
  isNarcotic: boolean; // Controlled substance flag
}

export interface DoctorDirectoryEntry {
  id: string;
  name: string;
  hospital: string;
  phone: string;
  email: string;
  address: string;
  specialty: string;
}

export interface Patient {
  id: string;
  doctorId: string; // Links patient to the specific doctor
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  address: string;
  emergencyContact?: string;
  
  // Vitals & Physical
  height?: string; // cm
  weight?: string; // kg
  bloodGroup?: string;

  // Medical History
  allergies: string[]; // Drug, Food, etc.
  chronicConditions: string[]; // Diabetes, HTN, etc.
  pastSurgeries?: string;
  currentMedications?: string;
  familyHistory?: string;
  pastMedications?: string;
  documents?: UserDocument[];
  
  notes?: string;
  registeredAt: string;
  lastVisit?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For mock auth only
  role: UserRole;
  verificationStatus: VerificationStatus;
  registrationDate: string;
  
  // Common License info
  licenseNumber?: string;
  state?: string;
  
  // Documents
  documents?: UserDocument[];

  // Doctor Specific Extended Profile
  qualifications?: string; // e.g. MBBS, MD
  nmrUid?: string; // National Medical Register UID
  clinicName?: string;
  clinicAddress?: string;
  city?: string;
  pincode?: string;
  phone?: string;
  fax?: string;
  stateCouncil?: string;
  specialty?: string;

  // Pharmacy specific
  inventory?: InventoryItem[];
  doctorDirectory?: DoctorDirectoryEntry[];

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
  medicalDegree: string; // Primary degree (dropdown)
  qualifications: string; // Full string: MBBS, MD (Ent)
  registrationNumber: string;
  nmrUid: string; // National Medical Register UID
  stateCouncil: string;
  specialty?: string;
  clinicName: string;
  clinicAddress: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  fax?: string;
  documents?: UserDocument[];
}

export interface Medicine {
  name: string;
  dosage: string; // e.g., 1 Tablet
  strength?: string; // e.g., 500mg
  route?: string; // e.g., Oral
  frequency: string; // e.g., 1-0-1
  duration: string; // e.g., 5 days
  instructions: string; // e.g., After food
  refill?: string; // e.g., 0
}

// Snapshot of doctor details at the time of prescription
export interface DoctorDetailsSnapshot {
  name: string;
  qualifications: string;
  registrationNumber: string;
  nmrUid: string;
  stateCouncil: string;
  clinicName: string;
  clinicAddress: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  fax?: string;
  email: string;
  specialty?: string;
}

export interface PatientDetailsSnapshot {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  phone: string;
  allergies: string[];
  chronicConditions?: string[];
}

export interface Prescription {
  id: string;
  doctorId: string;
  doctorName: string; // Kept for backward compatibility/searches
  doctorDetails?: DoctorDetailsSnapshot; // Full snapshot
  patientId?: string; // Link to Patient Profile
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientDetails?: PatientDetailsSnapshot; // Full snapshot at time of issue
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
