
import React, { useState } from 'react';
import { X, Printer, ShieldCheck, Database, FileText, Server, Lock, UserCog, Building2, Layout, BookOpen } from 'lucide-react';

interface DocumentationViewerProps {
  onClose: () => void;
}

export const DocumentationViewer: React.FC<DocumentationViewerProps> = ({ onClose }) => {
  const [activeDoc, setActiveDoc] = useState<'TECH' | 'COMPLIANCE' | 'DOCTOR' | 'PHARMACY' | 'MVP'>('MVP');

  const handlePrint = () => {
    window.print();
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
                    <span>Version 1.0</span>
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
                        </ul>
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <p className="font-bold text-slate-900">For Pharmacies</p>
                        <ul className="list-disc pl-4 mt-1 text-slate-600">
                            <li>License Verification</li>
                            <li>Dispensing Queue</li>
                            <li>Inventory Alerts</li>
                            <li>Stock Management</li>
                        </ul>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-indigo-800 mt-6 mb-2">3. Next Strategic Steps</h2>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
                    <li><strong>Patient History Lookup:</strong> Enable doctors to clone previous Rxs (Retention Moat).</li>
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
                DevXWorld e-Rx Hub is a React 19 SPA using Supabase for backend services. It implements a hybrid data strategy, allowing offline-first capabilities via LocalStorage fallback.
            </p>

            <div className="bg-slate-100 p-4 rounded-md font-mono text-xs mb-6">
                <strong>Tech Stack:</strong><br/>
                - React 19 (TypeScript)<br/>
                - Tailwind CSS<br/>
                - Supabase (PostgreSQL + Auth)<br/>
                - Google Gemini AI (v1.30)<br/>
                - Vite Build Tool
            </div>

            <h3 className="text-lg font-bold text-slate-800">Key Modules</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                <li><strong>db.ts:</strong> Abstracted Data Layer. Handles switching between Cloud and Local storage transparently.</li>
                <li><strong>geminiService.ts:</strong> AI Logic. Sends clinical context to LLM for safety analysis.</li>
                <li><strong>DocumentationViewer.tsx:</strong> The component rendering this very document.</li>
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
                
                <h3 className="text-lg font-bold text-slate-800">Workflow: Creating an Rx</h3>
                <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-2">
                    <li><strong>Select Patient:</strong> Use the search bar or create a new profile.</li>
                    <li><strong>Enter Diagnosis:</strong> Clinical notes are mandatory.</li>
                    <li><strong>Add Medicines:</strong> Use the autocomplete for generic names.</li>
                    <li><strong>AI Check:</strong> Click "Check Interactions" to verify safety.</li>
                    <li><strong>Select Pharmacy:</strong> Choose a verified partner.</li>
                    <li><strong>Sign & Send:</strong> Confirm patient identity and sign digitally.</li>
                </ol>
            </section>
        )}

        {/* PHARMACY GUIDE */}
        {activeDoc === 'PHARMACY' && (
            <section className="prose prose-slate max-w-none">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-900 pb-2">
                    <Building2 className="w-8 h-8 text-slate-900"/>
                    <h1 className="text-3xl font-bold m-0 text-slate-900 uppercase">Pharmacy User Manual</h1>
                </div>

                <h3 className="text-lg font-bold text-slate-800">Dispensing Process</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Navigate to <strong>E-Rx Management</strong> to see your queue.
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="border p-3 rounded">
                        <span className="font-bold block mb-1">1. Match Patient</span>
                        Link the incoming Rx to an existing customer profile or create a new one.
                    </div>
                    <div className="border p-3 rounded">
                        <span className="font-bold block mb-1">2. Verify Stock</span>
                        Ensure batch numbers and expiry dates match physical stock.
                    </div>
                    <div className="border p-3 rounded">
                        <span className="font-bold block mb-1">3. Dispense</span>
                        Click "Confirm & Dispense". This updates the doctor's record instantly.
                    </div>
                    <div className="border p-3 rounded bg-red-50 border-red-100">
                        <span className="font-bold block mb-1 text-red-700">Rejections</span>
                        Use "No Stock" or "Reject" if fulfillment is impossible.
                    </div>
                </div>
            </section>
        )}

      </div>
    </div>
  );
};
