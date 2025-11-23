# e-Rx Hub: Compliance & Security Protocol

**Version:** 1.2
**Status:** Audit Ready
**Applicable Regulations:** DPDP Act 2023 (India), IT Act 2000, Telemedicine Practice Guidelines 2020.

---

## 1. Compliance Requirements

### Data Privacy & Protection (DPDP Act 2023)
*   **Consent Architecture:**
    *   **Explicit Consent:** Users must explicitly agree to data processing terms during registration (Checkbox implemented in `Login.tsx`).
    *   **Purpose Limitation:** Data is collected solely for the purpose of medical prescription and dispensing.
    *   **Data Minimization:** Only essential clinical data (Diagnosis, Vitals) is required.

### Telemedicine Compliance
*   **RMP Verification:** Doctors must upload Medical Degree and State Council Registration. These are manually verified by Admins before account activation.
*   **Patient Identification:** The `CreatePrescription` workflow forces the doctor to acknowledge they have verified the patient's identity via video/audio before prescribing.
*   **Record Maintenance:** All prescriptions are stored indefinitely (or per statutory limits) in the database with timestamps.

### Data Retention
*   **Prescriptions:** Retained for legal duration (typically 3+ years).
*   **Audit Logs:** Security logs are immutable and retained for forensic analysis.

---

## 2. Security Architecture

### Authentication & Authorization
*   **Method:** Supabase Auth (JWT).
*   **Two-Factor Authentication (2FA):** Simulated 2FA (OTP) step implemented in `Login.tsx` for all roles.
*   **Role-Based Access Control (RBAC):**
    *   **Doctors:** Can only see their own patients and prescriptions.
    *   **Pharmacies:** Can only see prescriptions assigned to them or processed by them.
    *   **Admins:** Have global view but cannot alter clinical data.

### Input Hardening & Integrity
*   **Regex Validation:** Strict enforcement on registration.
    *   **Medical Reg No:** `^[a-zA-Z0-9]{5,15}$` (Prevents SQLi/XSS via ID fields).
    *   **Phone:** `^\d{10}$` (Strict length).
    *   **Pincode:** `^\d{6}$`.
*   **Sanitization:** React automatically escapes output, preventing XSS in rendered views.

### Session Management
*   **Idle Timeout:** Global activity listener in `App.tsx`.
    *   **Limit:** 30 Minutes.
    *   **Warning:** 30 seconds prior to termination.
    *   **Action:** Immediate destruction of session tokens and redirect to login.

---

## 3. Risk Mitigation

### Threat Model: Unauthorized Access
*   **Mitigation:**
    *   Accounts are created in `PENDING` state.
    *   Admins must manually approve via `AdminDashboard` after reviewing uploaded documents.
    *   Login attempts are logged (`USER_LOGIN_SUCCESS`).

### Threat Model: Insider Threat (Data Leak)
*   **Mitigation:**
    *   Forensic Audit Logs in `AdminDashboard`.
    *   Every action (View, Dispense, Login, Logout) is recorded with `actor_id` and `timestamp`.
    *   Admins cannot decrypt patient passwords (hashed).

### Threat Model: Drug Abuse
*   **Mitigation:**
    *   **Restricted Drugs:** The frontend filters out high-risk narcotics (e.g., Morphine, Fentanyl) from the autocomplete suggestions.
    *   **Inventory Tracking:** Pharmacies track stock of narcotic items via the `isNarcotic` flag.

---

## 4. Incident Response

### Access Control Breach
1.  **Detection:** Anomaly in Security Logs (e.g., multiple logins from different IPs).
2.  **Containment:** Admin uses "Terminate Account" in `UserRegistry` to immediately block the user.
3.  **Audit:** Review `Security Log` tab filtered by the compromised User ID.

### Service Outage
1.  **Failover:** Application automatically falls back to LocalStorage if Supabase connection fails (`dbService.ts`).
2.  **Recovery:** Once connection restores, users must re-authenticate. Note: Offline data currently does not auto-sync to cloud to prevent conflict.
