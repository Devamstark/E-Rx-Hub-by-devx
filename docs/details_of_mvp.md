# DevXWorld e-Rx Hub: Comprehensive MVP Feature Specification

**Version:** 1.3 (Release Candidate)
**Date:** March 2025
**Author:** DevXWorld Engineering Team

---

## 1. Executive Summary
The **DevXWorld e-Rx Hub** is a cloud-native, legally compliant telemedicine and pharmacy ERP platform designed for the Indian healthcare ecosystem. It bridges the gap between Registered Medical Practitioners (RMPs) and Pharmacies while strictly adhering to the **DPDP Act 2023**, **IT Act 2000**, and **Telemedicine Practice Guidelines 2020**.

This MVP delivers a complete "Clinic-to-Chemist" digital workflow with integrated AI safety checks, financial ledgers, and forensic auditing.

---

## 2. Core Architecture & Technology

### 2.1 Tech Stack
*   **Frontend:** React 19 (TypeScript, ESM Modules).
*   **Styling:** Tailwind CSS (Utility-first, responsive).
*   **State Management:** React Hooks + Local Storage Sync.
*   **Database (Hybrid):**
    *   **Primary:** Supabase (PostgreSQL) for cloud synchronization.
    *   **Fallback:** LocalStorage for offline-first capability.
*   **AI Engine:** Google Gemini API (`gemini-2.5-flash`) for clinical decision support.
*   **Visualization:** Recharts for analytics.
*   **Icons:** Lucide React.

### 2.2 Security & Compliance Layers
*   **Role-Based Access Control (RBAC):** Strict separation between Doctor, Pharmacy, and Admin views.
*   **Forensic Audit Trail:** Immutable logging of all critical actions (Login, Rx Creation, Dispensing, record modification) with timestamps (IST).
*   **Session Security:** 30-minute idle timeout with a 30-second warning countdown to prevent unauthorized access on shared devices.
*   **Digital Signatures:** Simulation of cryptographic token generation for e-prescriptions.
*   **Consent Framework:** Explicit "DPDP Act Consent" checkbox required during registration.

---

## 3. Doctor Module Features

### 3.1 Onboarding & Verification
*   **Registration:** Captures Medical Council Registration Number, State Council, and NMR UID.
*   **Document Upload:** Mandatory upload of Medical Degree and Registration Certificate.
*   **Verification Gate:** Account remains "Pending" until manually approved by an Admin.

### 3.2 Dashboard
*   **Quick Stats:** Daily patient visits, Total Rx issued.
*   **Navigation:** Quick access to Queue, Rx Creation, Patients, History, Labs, Certificates, and Analytics.

### 3.3 The "Smart" Prescription Pad
*   **Patient Selection:** Smart search (Name/Phone) or "Create New Patient" workflow.
*   **Telemedicine Compliance:** Mandatory checkbox certifying patient identity verification (Video/Audio).
*   **Vitals Recording:** BP, Pulse, Temperature, SpO2, Weight.
*   **Voice Dictation:** Integrated speech-to-text for Diagnosis and Advice fields.
*   **Drug Interaction Check (AI):** Real-time analysis of prescribed medicines against the diagnosis using Gemini AI to flag contraindications.
*   **Medicine Database:** Autocomplete with "Low Risk Generic List", filtering out Schedule X narcotics for safety.
*   **Templates:** Save and load common prescriptions (e.g., "Viral Fever Protocol").
*   **Pharmacy Selection:** Direct routing of Rx to verified pharmacies.

### 3.4 Patient Management
*   **Directory:** List of all treated patients with quick search.
*   **Detailed Profile:** View demographics, chronic conditions, allergies, and Rx history.
*   **ABHA Integration:** Fields for Ayushman Bharat Health Account (ABHA) number and address with a simulated verification API.

### 3.5 Clinical Tools
*   **Appointment Manager:** Schedule visits, manage daily queue (Waiting/In-Consult/Completed).
*   **Lab Referrals:** Create digital test requisitions and view mock pathology reports.
*   **Medical Certificates:** Generate official Sick Leave, Fitness, or Referral letters on the doctor's letterhead.
*   **Calculators:** Integrated BMI and Pediatric Dosage calculators.

---

## 4. Pharmacy Module Features (ERP Edition)

### 4.1 Dashboard & E-Rx Queue
*   **Pending Queue:** Real-time feed of prescriptions sent by doctors.
*   **Processing Workflow:**
    1.  **Patient Matching:** Auto-match incoming Rx to existing customer database or create a new profile.
    2.  **Dispensing:** Mark as "Dispensed" (deducts stock) or "Rejected" (Stock unavailable/Invalid).
    3.  **Notifications:** Status updates sent back to the prescribing doctor.

### 4.2 Point of Sale (POS) & Billing
*   **Billing Interface:** Search inventory by Name/Generic/Barcode.
*   **Virtual Numpad:** Touch-friendly input for quantities and pricing.
*   **Payment Modes:** Cash, UPI, Card, Credit, and Partial Payments.
*   **Thermal Receipt:** CSS-optimized print layout for 80mm thermal printers.
*   **Quick Add:** Rapidly add non-inventory items to the bill and stock simultaneously.

### 4.3 Inventory & Stock Management
*   **Master List:** Track Batch Numbers, Expiry Dates, MRP, and Purchase Price.
*   **GRN (Goods Received Note):** Entry form for adding bulk stock from suppliers.
*   **Low Stock Alerts:** Visual indicators for items below minimum levels.
*   **Expiry Tracking:** Highlights items nearing expiration.

### 4.4 Financial Ledger
*   **Supplier Ledger:** Track amounts payable to distributors. Record payments made.
*   **Customer Credit:** Track "Khata" (credit) for patients. Record partial payments and dues.
*   **Sales Returns:** Process refunds or exchanges, automatically updating inventory and customer balance.

### 4.5 AI Business Intelligence
*   **Inventory Analysis:** Gemini AI analyzes sales vs. stock to suggest reordering.
*   **Pricing Tips:** AI suggestions for discounting near-expiry items.

---

## 5. Admin & Compliance Module

### 5.1 User Registry
*   **Verification Queue:** Review pending Doctor/Pharmacy applications and uploaded documents.
*   **Document Viewer:** In-app preview of uploaded PDFs/Images.
*   **Actions:** Approve, Reject, Terminate (Block), or Permanently Delete users.
*   **Password Reset:** Generate temporary credentials for users.

### 5.2 Security & Audit
*   **Security Logs:** A detailed table of every system action (Login, Logout, Data Access).
*   **Filtering:** Filter logs by role (Doctor/Pharmacy/Admin) to investigate incidents.

### 5.3 Internal Management
*   **Role Management:** Create sub-admins (Compliance Officer, Reviewer) with specific permission sets.
*   **Analytics:** System-wide stats on active users, total prescriptions, and top-performing entities.

---

## 6. Database Schema (Supabase)

The system utilizes a relational schema with JSONB columns for flexibility.

*   `users`: Stores profile, role, verification status, and embedded inventory/documents.
*   `prescriptions`: Stores clinical data, doctor/patient linkage, and status.
*   `patients`: Stores demographics, clinical history (allergies), and ABHA details.
*   `audit_logs`: Stores actor_id, action type, timestamp, and details.
*   `sales`: Stores POS invoice data.
*   `sales_returns`: Stores return transactions.
*   `suppliers` / `customers`: Stores ledger balances.
*   `appointments`: Stores scheduling data.
*   `lab_referrals`: Stores diagnostic requests.
*   `med_certificates`: Stores issued certificates.

---

## 7. Future Roadmap
*   **Integration:** Live API integration with ABDM (NDHM) sandbox.
*   **Payment Gateway:** Real integration for subscription fees.
*   **Inventory API:** Connection to CDSCO drug database for standardized medicine data.
