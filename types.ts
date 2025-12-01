

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
  TERMINATED = 'TERMINATED',
  DIRECTORY = 'DIRECTORY'
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
  genericName?: string; 
  manufacturer: string;
  batchNumber: string;
  barcode?: string;
  expiryDate: string;
  stock: number;
  minStockLevel: number;
  purchasePrice: number; 
  mrp: number; 
  unitPrice?: number; 
  isNarcotic: boolean; 
  gstPercentage?: number;
  hsnCode?: string;
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
  doctorId: string; 
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  address: string;
  emergencyContact?: string;
  
  // ABDM / ABHA Integration
  abhaNumber?: string;   // 14 digit ID
  abhaAddress?: string;  // e.g. name@abdm
  isAbhaVerified?: boolean;

  height?: string; 
  weight?: string; 
  bloodGroup?: string;

  allergies: string[]; 
  chronicConditions: string[]; 
  pastSurgeries?: string;
  currentMedications?: string;
  familyHistory?: string;
  pastMedications?: string;
  documents?: UserDocument[];
  
  notes?: string;
  registeredAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; 
  role: UserRole;
  verificationStatus: VerificationStatus;
  registrationDate: string;
  
  licenseNumber?: string;
  state?: string;
  gstin?: string; 
  
  documents?: UserDocument[];

  qualifications?: string; 
  nmrUid?: string; 
  clinicName?: string;
  clinicAddress?: string;
  city?: string;
  pincode?: string;
  phone?: string;
  fax?: string;
  stateCouncil?: string;
  specialty?: string;

  inventory?: InventoryItem[];
  doctorDirectory?: DoctorDirectoryEntry[];

  terminatedAt?: string | null;
  terminatedBy?: string | null;
  terminationReason?: string | null;

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
  qualifications: string; 
  registrationNumber: string;
  nmrUid: string; 
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
  dosage: string; 
  frequency: string; 
  duration: string; 
  instructions: string; 
}

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

export interface PrescriptionVitals {
  bp?: string;
  pulse?: string;
  temp?: string;
  spo2?: string;
  weight?: string;
}

export interface Prescription {
  id: string;
  doctorId: string;
  doctorName: string; 
  doctorDetails?: DoctorDetailsSnapshot; 
  patientId?: string; 
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  
  // Clinical Data
  vitals?: PrescriptionVitals;
  diagnosis: string;
  medicines: Medicine[];
  advice: string;
  
  date: string; 
  status: 'ISSUED' | 'DISPENSED' | 'REJECTED' | 'CANCELLED' | 'REJECTED_STOCK' | 'SENT_TO_PHARMACY';
  pharmacyId?: string;
  pharmacyName?: string;
  digitalSignatureToken: string;
  
  refills?: number;
  followUpDate?: string;
  
  // ABDM Link
  linkedToAbha?: boolean;
}

export interface PrescriptionTemplate {
    id: string;
    name: string; 
    doctorId: string;
    diagnosis: string;
    medicines: Medicine[];
    advice: string;
}

export interface LabReferral {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  testName: string;
  labName?: string;
  date: string;
  status: 'PENDING' | 'COMPLETED';
  reportUrl?: string; 
  notes?: string;
  accessCode?: string; // 4-digit code for public upload access
}

// --- NEW: Appointments & Certificates ---

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  patientGender?: string;
  patientAge?: number;
  date: string; // ISO Date String
  timeSlot: string; // e.g. "10:30 AM"
  status: 'SCHEDULED' | 'WAITING' | 'IN_CONSULT' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  type: 'VISIT' | 'VIDEO' | 'FOLLOW_UP';
  reason?: string;
}

export interface MedicalCertificate {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  type: 'SICK_LEAVE' | 'FITNESS' | 'REFERRAL';
  issueDate: string;
  startDate?: string; // For Sick Leave
  endDate?: string;   // For Sick Leave
  restDays?: number;
  diagnosis?: string;
  remarks: string;
}

export interface VerificationError {
  field: string;
  message: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  details: string;
  timestamp: string;
}

// --- ERP ADDITIONS ---

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email?: string;
  gstin?: string;
  address?: string;
  balance: number; 
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  balance: number; 
}

export interface SaleItem {
  inventoryId: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  mrp: number; 
  costPrice: number; 
  gstPercentage: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string; 
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subTotal: number;
  gstAmount: number;
  discountAmount: number;
  roundedTotal: number;
  amountPaid?: number; 
  balanceDue?: number; 
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'PARTIAL';
  pharmacyId: string;
}

export interface SalesReturn {
    id: string;
    originalInvoiceId: string;
    invoiceNumber: string; 
    date: string;
    customerName: string;
    items: SaleItem[]; 
    refundAmount: number;
    reason: string;
}

export interface GRNItem {
    name: string;
    manufacturer: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    purchasePrice: number;
    mrp: number;
    gstPercentage: number;
    isNarcotic: boolean;
    hsnCode?: string;
}

export interface GRN {
    id: string;
    supplierId: string;
    supplierName: string;
    date: string;
    invoiceNumber: string;
    items: GRNItem[];
    totalAmount: number;
    pharmacyId: string;
}

export interface Expense {
    id: string;
    date: string;
    category: string; 
    description: string;
    amount: number;
    pharmacyId: string;
}