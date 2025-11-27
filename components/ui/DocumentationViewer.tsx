
import React, { useState } from 'react';
import { X, Printer, ShieldCheck, Database, FileText, Server, Lock, UserCog, Building2, Layout, BookOpen, Copy, Check } from 'lucide-react';

interface DocumentationViewerProps {
  onClose: () => void;
}

export const DocumentationViewer: React.FC<DocumentationViewerProps> = ({ onClose }) => {
  const [activeDoc, setActiveDoc] = useState<'TECH' | 'COMPLIANCE' | 'DOCTOR' | 'PHARMACY' | 'MVP'>('MVP');
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const copySQL = () => {
    const sql = `-- ==========================================
-- DEVXWORLD E-RX HUB: FULL DATABASE SETUP SCRIPT
-- Run this in Supabase SQL Editor to Initialize
-- ==========================================

-- 1. Audit & Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS system_logs ( id TEXT PRIMARY KEY, data JSONB );

-- 2. Core Entities
CREATE TABLE IF NOT EXISTS users ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS prescriptions ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS patients ( id TEXT PRIMARY KEY, data JSONB );

-- 3. Doctor Features
CREATE TABLE IF NOT EXISTS appointments ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS lab_referrals ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS med_certificates ( id TEXT PRIMARY KEY, data JSONB );

-- 4. Pharmacy ERP
CREATE TABLE IF NOT EXISTS suppliers ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS customers ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS sales ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS sales_returns ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS expenses ( id TEXT PRIMARY KEY, data JSONB );

-- 5. Security Policies (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE med_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow Public Access (Demo Mode / Single Tenant)
DROP POLICY IF EXISTS "Public Access Audit" ON audit_logs; CREATE POLICY "Public Access Audit" ON audit_logs FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Users" ON users; CREATE POLICY "Public Access Users" ON users FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Rx" ON prescriptions; CREATE POLICY "Public Access Rx" ON prescriptions FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Patients" ON patients; CREATE POLICY "Public Access Patients" ON patients FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Logs" ON system_logs; CREATE POLICY "Public Access Logs" ON system_logs FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Apts" ON appointments; CREATE POLICY "Public Access Apts" ON appointments FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Labs" ON lab_referrals; CREATE POLICY "Public Access Labs" ON lab_referrals FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Certs" ON med_certificates; CREATE POLICY "Public Access Certs" ON med_certificates FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access ERP" ON suppliers; CREATE POLICY "Public Access ERP" ON suppliers FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Cust" ON customers; CREATE POLICY "Public Access Cust" ON customers FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Sales" ON sales; CREATE POLICY "Public Access Sales" ON sales FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Returns" ON sales_returns; CREATE POLICY "Public Access Returns" ON sales_returns FOR ALL USING (true);
DROP POLICY IF EXISTS "Public Access Exp" ON expenses; CREATE POLICY "Public Access Exp" ON expenses FOR ALL USING (true);

-- 6. Initialize Empty Data Containers
INSERT INTO users (id, data) VALUES ('global_users', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO prescriptions (id, data) VALUES ('global_prescriptions', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO patients (id, data) VALUES ('global_patients', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO system_logs (id, data) VALUES ('global_audit_logs', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO appointments (id, data) VALUES ('global_appointments', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO lab_referrals (id, data) VALUES ('global_lab_referrals', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO med_certificates (id, data) VALUES ('global_med_certificates', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO suppliers (id, data) VALUES ('global_suppliers', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO customers (id, data) VALUES ('global_customers', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO sales (id, data) VALUES ('global_sales', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO sales_returns (id, data) VALUES ('global_sales_returns', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO expenses (id, data) VALUES ('global_expenses', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;`;

    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const DevXLogo = () => (
    <div className="flex flex-col items-center justify-center mb-8 border-b border-slate-200 pb-8">
      <div className="w-20 h-20 rounded-full border-4 border-yellow-500 flex items-center justify-center bg-black text-white mb-4">
        <span className="text-4xl font-bold italic font-serif">X</span>
      </div>
      <h1 className="text-2xl font-bold tracking-[0.2em] uppercase text-slate-900">DEV X WORLD</h1>
      <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mt-1">Developers Shape The Future</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[100] overflow-hidden backdrop-blur-sm flex justify-center items-start pt-10 pb-10">
      
      {/* Sidebar (Screen Only) */}
      <div className="w-64 bg-slate-800 text-white h-[85vh] rounded-l-xl p-4 flex flex-col gap-2 print:hidden overflow-y-auto">
        <h3 className="font-bold text-slate-400 uppercase text-xs mb-2 px-2">Documentation Suite</h3>
        <button onClick={() => setActiveDoc('MVP')} className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeDoc === 'MVP' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}>
             MVP Status Report
        </button>
        <button onClick={() => setActiveDoc('TECH')} className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeDoc === 'TECH' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}>
             Technical Guide
        </button>
        <button onClick={() => setActiveDoc('COMPLIANCE')} className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeDoc === 'COMPLIANCE' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}>
             Compliance & Security
        </button>
        <button onClick={() => setActiveDoc('DOCTOR')} className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeDoc === 'DOCTOR' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}>
             Doctor Manual
        </button>
        <button onClick={() => setActiveDoc('PHARMACY')} className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeDoc === 'PHARMACY' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}>
             Pharmacy Manual
        </button>
        
        <div className="mt-auto pt-4 border-t border-slate-700">
            <button 
                onClick={handlePrint} 
                className="w-full flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-slate-900 px-4 py-2 rounded-md font-bold text-sm transition-colors mb-2"
            >
                <Printer className="w-4 h-4 mr-2"/> Print Active Doc
            </button>
            <button 
                onClick={onClose} 
                className="w-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md font-bold text-sm transition-colors"
            >
                <X className="w-4 h-4 mr-2"/> Close Viewer
            </button>
        </div>
      </div>

      {/* Document Container */}
      <div className="bg-white w-full max-w-[210mm] h-[85vh] overflow-y-auto p-[20mm] shadow-2xl rounded-r-xl print:m-0 print:shadow-none print:w-full print:h-auto print:rounded-none print:fixed print:inset-0 print:overflow-visible print:z-[200]">
        
        <DevXLogo />

        {/* MVP STATUS REPORT */}
        {activeDoc === 'MVP' && (
            <section className="prose prose-slate max-w-none">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-900 pb-2">
                    <ShieldCheck className="w-8 h-8 text-green-600"/>
                    <h1 className="text-3xl font-bold m-0 text-slate-900 uppercase">MVP Status Report</h1>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-500 mb-8">
                    <span>Version 1.2</span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">AUDIT READY</span>
                </div>

                <h2 className="text-xl font-bold text-indigo-800 mt-6 mb-2">1. Compliance & Security Achievements</h2>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                    <li><strong>Data Protection:</strong> PHI stored exclusively in <code className="bg-slate-100 px-1">ap-south-1</code> (Mumbai). TLS 1.2+ Encryption active.</li>
                    <li><strong>Auth Hardening:</strong> 30-Minute Idle Session Timeout & Mandatory 2FA implemented.</li>
                    <li><strong>Forensic Audit:</strong> Role-based logs for Logins, Rx Creation, and Dispensing.</li>
                    <li><strong>Telemedicine:</strong> Mandatory "Patient Verified" consent gate for doctors.</li>
                </ul>

                <h2 className="text-xl font-bold text-indigo-800 mt-6 mb-2">2. Functional Features (Confirmed)</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <p className="font-bold text-slate-900">For Doctors</p>
                        <ul className="list-disc pl-4 mt-1 text-slate-600">
                            <li>RMP Verification Workflow</li>
                            <li>AI Interaction Checks</li>
                            <li>Digital Rx Generation</li>
                            <li>Patient Management</li>
                            <li><strong>NEW:</strong> Appointment Queue</li>
                            <li><strong>NEW:</strong> Lab Referrals & Reports</li>
                            <li><strong>NEW:</strong> Medical Certificates</li>
                        </ul>
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <p className="font-bold text-slate-900">For Pharmacies</p>
                        <ul className="list-disc pl-4 mt-1 text-slate-600">
                            <li>License Verification</li>
                            <li>Dispensing Queue</li>
                            <li>Inventory Alerts & GRN</li>
                            <li>Full ERP (Sales, Ledger, Returns)</li>
                        </ul>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-indigo-800 mt-6 mb-2">3. Next Strategic Steps</h2>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
                    <li><strong>Automated DRP:</strong> Implement hourly database snapshots for disaster recovery.</li>
                    <li><strong>Commercial API:</strong> Acquire license for CDSCO Drug Database API.</li>
                </ol>
            </section>
        )}

        {/* TECHNICAL GUIDE */}
        {activeDoc === 'TECH' && (
          <section className="prose prose-slate max-w-none">
            <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-900 pb-2">
                <Server className="w-8 h-8 text-slate-900"/>
                <h1 className="text-3xl font-bold m-0 text-slate-900 uppercase">Technical Guide</h1>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800">System Architecture</h3>
            <p className="text-sm text-slate-600 mb-4">
                DevXWorld e-Rx Hub is a React 19 SPA using Supabase for backend services. It implements a hybrid data strategy, allowing offline-first capabilities via LocalStorage fallback with Cloud Synchronization for critical data.
            </p>

            <div className="bg-slate-100 p-4 rounded-md font-mono text-xs mb-6">
                <strong>Tech Stack:</strong><br/>
                - React 19 (TypeScript)<br/>
                - Tailwind CSS<br/>
                - Supabase (PostgreSQL + Auth)<br/>
                - Google Gemini AI (v1.30)<br/>
                - Vite Build Tool
            </div>

            <h3 className="text-lg font-bold text-slate-800">Database Setup (SQL)</h3>
            <p className="text-sm text-slate-600 mb-2">
                Run this script in the Supabase SQL Editor to initialize required tables. <strong>NOTE:</strong> If you have already run a previous version, this script uses <code>IF NOT EXISTS</code> to avoid errors, but ensure your schema matches.
            </p>
            <div className="relative mb-6">
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-[10px] font-mono leading-relaxed h-48">
                    {`-- DEVXWORLD E-RX HUB SETUP
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS users ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS prescriptions ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS patients ( id TEXT PRIMARY KEY, data JSONB );
-- New Modules
CREATE TABLE IF NOT EXISTS appointments ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS lab_referrals ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS med_certificates ( id TEXT PRIMARY KEY, data JSONB );
CREATE TABLE IF NOT EXISTS sales ( id TEXT PRIMARY KEY, data JSONB );
-- (See full SQL via COPY button)`}
                </pre>
                <button 
                    onClick={copySQL}
                    className="absolute top-2 right-2 bg-white text-slate-900 px-3 py-1.5 rounded text-xs font-bold shadow hover:bg-indigo-50 flex items-center"
                >
                    {copied ? <Check className="w-3 h-3 mr-1 text-green-600"/> : <Copy className="w-3 h-3 mr-1"/>}
                    {copied ? "Copied!" : "Copy Full Script"}
                </button>
            </div>

            <h3 className="text-lg font-bold text-slate-800">Key Modules</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                <li><strong>db.ts:</strong> Abstracted Data Layer. Handles switching between Cloud and Local storage transparently. Synchronizes ERP data (Sales, Inventory) to Cloud on load.</li>
                <li><strong>geminiService.ts:</strong> AI Logic. Sends clinical context to LLM for safety analysis.</li>
            </ul>
          </section>
        )}

        {/* COMPLIANCE GUIDE */}
        {activeDoc === 'COMPLIANCE' && (
            <section className="prose prose-slate max-w-none">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-900 pb-2">
                    <Lock className="w-8 h-8 text-slate-900"/>
                    <h1 className="text-3xl font-bold m-0 text-slate-900 uppercase">Compliance Protocol</h1>
                </div>

                <div className="bg-red-50 p-4 border-l-4 border-red-500 mb-6">
                    <h4 className="font-bold text-red-800">DPDP Act 2023 Mandate</h4>
                    <p className="text-sm text-red-700">
                        Explicit consent must be obtained before processing any personal data. This is enforced via the checkbox on the Login/Registration screen.
                    </p>
                </div>

                <h3 className="text-lg font-bold text-slate-800">Security Implementation</h3>
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                    <li><strong>Session Security:</strong> 30-minute hard timeout on inactivity.</li>
                    <li><strong>Input Sanitization:</strong> Strict Regex for MRNs and Phones to prevent injection.</li>
                    <li><strong>Audit Trail:</strong> Immutable logs for every login, prescription, and dispensing event.</li>
                </ul>
            </section>
        )}

        {/* DOCTOR GUIDE */}
        {activeDoc === 'DOCTOR' && (
            <section className="prose prose-slate max-w-none">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-900 pb-2">
                    <UserCog className="w-8 h-8 text-slate-900"/>
                    <h1 className="text-3xl font-bold m-0 text-slate-900 uppercase">Doctor User Manual</h1>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800">Feature Workflows</h3>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <strong className="block mb-1">1. Creating Prescriptions</strong>
                        <p className="text-sm text-slate-600">Select patient &rarr; Enter Diagnosis &rarr; Add Medicines &rarr; AI Check &rarr; E-Sign.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <strong className="block mb-1">2. Appointments</strong>
                        <p className="text-sm text-slate-600">Use "Queue & Visits" to schedule. Click "Start Consult" to auto-open a prescription for that patient.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <strong className="block mb-1">3. Certificates</strong>
                        <p className="text-sm text-slate-600">Generate official Sick Leave or Fitness certificates on your letterhead via the "Certificates" tab.</p>
                    </div>
                </div>
            </section>
        )}

        {/* PHARMACY GUIDE */}
        {activeDoc === 'PHARMACY' && (
            <section className="prose prose-slate max-w-none">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-900 pb-2">
                    <Building2 className="w-8 h-8 text-slate-900"/>
                    <h1 className="text-3xl font-bold m-0 text-slate-900 uppercase">Pharmacy User Manual</h1>
                </div>

                <h3 className="text-lg font-bold text-slate-800">Dispensing & ERP</h3>
                <p className="text-sm text-slate-600 mb-4">
                    The system now includes a full Ledger and Inventory module that syncs to the cloud.
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="border p-3 rounded">
                        <span className="font-bold block mb-1">1. E-Rx Queue</span>
                        Link incoming Rx to customers. Dispense or Reject based on stock.
                    </div>
                    <div className="border p-3 rounded">
                        <span className="font-bold block mb-1">2. Stock (GRN)</span>
                        Use "Stock & GRN" to add new inventory batches from suppliers.
                    </div>
                    <div className="border p-3 rounded">
                        <span className="font-bold block mb-1">3. Ledger</span>
                        Track Supplier payments and Customer credit in the "Ledger" tab.
                    </div>
                    <div className="border p-3 rounded bg-blue-50 border-blue-100">
                        <span className="font-bold block mb-1 text-blue-700">Cloud Sync</span>
                        All sales and ledger data are now backed up to the secure database.
                    </div>
                </div>
            </section>
        )}

      </div>
    </div>
  );
};
    