# DevXWorld e-Rx Hub - Technical & Setup Guide

## 1. System Overview

**Purpose:**
The DevXWorld e-Rx Hub is a secure, legally compliant e-prescription portal designed for Indian Registered Medical Practitioners (RMPs) and Pharmacies. It facilitates the digital creation, signing, and dispensing of prescriptions while adhering to the DPDP Act 2023 and Telemedicine Practice Guidelines 2020.

**Core Architecture:**
*   **Architecture Pattern:** Client-Side Single Page Application (SPA).
*   **Rendering:** Client-side rendering (React 19).
*   **State Management:** React Context / Local State + Supabase Realtime (simulated via polling/hooks).
*   **Data Persistence:** Hybrid Strategy. Primary: Supabase (PostgreSQL). Fallback: LocalStorage (for offline/demo capabilities).

**Tech Stack:**
*   **Frontend Framework:** React 19 (via ESM imports).
*   **Language:** TypeScript (Strict typing).
*   **Styling:** Tailwind CSS (Utility-first).
*   **Database & Auth:** Supabase (PostgreSQL, GoTrue, Storage).
*   **AI Engine:** Google Gemini API (v1.30.0 via `@google/genai`) - Used for drug interaction checks.
*   **Visualization:** Recharts (Admin analytics).
*   **Icons:** Lucide React.
*   **Build Tooling:** Vite (implied by usage patterns).

---

## 2. Installation & Setup

### Prerequisites
*   **Node.js:** v18.0.0 or higher.
*   **npm/yarn:** Latest version.
*   **Supabase Project:** A standard Supabase project with `users`, `prescriptions`, `patients`, `audit_logs` tables.
*   **Google AI Studio Key:** An API key with access to `gemini-2.5-flash`.

### Local Installation
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/devxworld/erx-hub.git
    cd erx-hub
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Database Setup (Critical):**
    *   Navigate to your Supabase Dashboard > SQL Editor.
    *   Open the file `SUPABASE_SETUP.sql` located in the root of this project.
    *   Copy the contents and run it in the Supabase SQL Editor. This creates the required `audit_logs` and data tables.

4.  **Environment Configuration:**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    API_KEY=your_google_gemini_api_key
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

### Deployment (Vercel/Netlify)
1.  Connect your Git repository to Vercel.
2.  **Build Command:** `npm run build`
3.  **Output Directory:** `dist`
4.  **Environment Variables:** Add the variables listed above in the Vercel Project Settings.

---

## 3. Codebase Documentation

### Folder Structure
*   `components/`: UI building blocks.
    *   `auth/`: Login and Registration logic (`Login.tsx`).
    *   `doctor/`: Doctor specific workflows (`DoctorDashboard`, `CreatePrescription`).
    *   `pharmacy/`: Pharmacy workflows (`PharmacyDashboard`).
    *   `admin/`: System administration (`AdminDashboard`).
    *   `ui/`: Shared components (`Layout`, `PrintLayout`).
*   `services/`: External API integrations.
    *   `db.ts`: Abstracted database layer handling Supabase and LocalStorage fallback.
    *   `geminiService.ts`: AI interaction logic for drug safety checks.
*   `types.ts`: TypeScript interfaces for `User`, `Prescription`, `Patient`, `AuditLog`.
*   `constants.ts`: Static data (`LOW_RISK_GENERIC_LIST`, `INDIAN_STATES`) and Regex patterns.

### Key API Integration Points
*   **`services/db.ts`**:
    *   `loadData()`: Fetches initial state. Implements a robust merge strategy between SQL tables and Blob storage for audit logs.
    *   `logSecurityAction(actorId, action, details)`: Critical function for forensic logging. Tries SQL insert first, falls back to JSON blob if permissions fail.
*   **`services/geminiService.ts`**:
    *   `analyzePrescriptionSafety()`: Sends diagnosis and medicine list to Gemini 2.5 Flash to check for interactions and contraindications. Returns JSON.

### Data Models
*   **User:** Handles Doctors, Pharmacies, and Admins. Differentiated by `role` enum. Contains `verificationStatus`.
*   **Prescription:** core transactional entity. Links `doctorId`, `patientId`, and `pharmacyId`. Statuses: `ISSUED`, `DISPENSED`, `REJECTED`, `REJECTED_STOCK`.
*   **AuditLog:** Forensic trail. `actorId`, `action` (e.g., `USER_LOGIN_SUCCESS`), `timestamp`.

---

## 4. Development Guidelines

### Coding Standards
*   **Type Safety:** No `any`. Define interfaces in `types.ts`.
*   **Security First:** All inputs validted via Regex (defined in `constants.ts`) before submission.
*   **Performance:** Use `useMemo` for heavy filtering in Dashboards.
*   **Chunk Size:** If build warnings occur, use dynamic imports (`React.lazy`) for the Dashboard components to split code chunks.

### Debugging
*   **Local Storage Mode:** If Supabase fails, the app falls back to Local Storage. Check `Application > Local Storage` in DevTools to inspect `devx_users` or `devx_prescriptions`.
*   **Console:** Security logs are printed to console in Dev mode.

### Known Limitations
*   **Offline Mode:** While LocalStorage works, it does not sync across devices. Cloud connection is required for multi-device workflows.