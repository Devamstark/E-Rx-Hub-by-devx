🌐 DevXWorld e-Rx Hub: Secure & Compliant Digital Prescription Platform

Company: DevXWorld Inc.

Tagline: Developer Shapes the Future.

🚀 Project Overview

The DevXWorld e-Rx Hub is a critical digital health application designed to modernize prescription processes in India. This platform facilitates the secure, traceable, and legally compliant digital transfer of prescriptions (e-Rx) directly from verified Doctors (RMPs) to verified Pharmacies.

Compliance Focus:

This system is built and maintained to adhere strictly to:

DPDP Act 2023 (Data Residency): All health data is stored securely in India (Mumbai region).

IT Act 2000 (Integrity): Features immutable audit logs and time-based session management.

Telemedicine Practice Guidelines 2020: Enforces explicit patient consent and RMP verification protocols.

✨ Key Features & Security Moats

Category

Feature

Compliance / Security Purpose

Security

Time-Based Logout (30m)

Automatically terminates idle sessions to prevent unauthorized access.

Security

Role-Based Audit Logs

Forensic trail logging all logins, Rx creation, and dispenses, filterable by user role.

Compliance

Schedule X Exclusion Filter

Frontend filters prevent prescribing high-risk narcotics from the low-risk autocomplete list, routing exceptions to Admin review.

Compliance

Manual Vetting Protocol

Admin must manually verify Doctor's Medical Registration Number (MRN) and Pharmacy License against official sites before account activation.

Usability

Static Drug Autocomplete

Provides fast, standardized suggestions (low-risk generics) to speed up prescribing, replacing manual typing.

Integrity

Immutable Prescription

Rx data is digitally locked upon signing; Pharmacies can only update the dispense status, not the clinical data.

💻 Tech Stack

Component

Technology

Role

Frontend

React 19 / TypeScript / Vite

Single Page Application (SPA) development and strict typing.

Styling

Tailwind CSS

Utility-first styling framework.

Database & Auth

Supabase (PostgreSQL)

Primary data persistence, real-time subscriptions, and JWT-based authentication.

External Integration

Google Gemini API

(Planned/Simulated) Used for drug interaction safety checks.

⚙️ Local Installation & Setup Guide

Prerequisites

Node.js (v18.0.0 or higher)

npm or yarn

A dedicated Supabase Project

1. Clone the Repository

git clone [https://github.com/Devamstark/E-Rx-Hub-by-devx.git](https://github.com/Devamstark/E-Rx-Hub-by-devx.git)
cd E-Rx-Hub-by-devx


2. Install Dependencies

npm install


3. Environment Configuration

Create a .env file in the root directory and populate it with your Supabase and Gemini keys:

# CRITICAL: Ensure Supabase project is configured for Mumbai region
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
API_KEY=your_google_gemini_api_key


4. Run Development Server

npm run dev


Access the application at http://localhost:5173.

📑 Documentation & Support

All compliance protocols, user manuals, and detailed architecture diagrams are available in the repository's documentation suite.

Auditor/Developer Guide: See COMPLIANCE_PROTOCOL.md for security, data model, and verification policies.
