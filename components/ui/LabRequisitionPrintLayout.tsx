
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { LabReferral, User, Patient } from '../../types';
import { FileText, Printer, X, ShieldCheck, Activity } from 'lucide-react';

interface Props {
  referral: LabReferral;
  doctor: User;
  patient: Patient;
  onClose: () => void;
}

export const LabRequisitionPrintLayout: React.FC<Props> = ({ referral, doctor, patient, onClose }) => {
  // STRICTLY enforcing the production domain as requested
  const BASE_URL = "https://erxdevx.vercel.app";
  const uploadLink = `${BASE_URL}/?mode=lab_upload&ref_id=${referral.id}&code=${referral.accessCode || '0000'}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[100] overflow-y-auto flex justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl relative flex flex-col">
        
        {/* Toolbar - Hidden on Print */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center print:hidden rounded-t-lg">
            <h2 className="font-bold flex items-center gap-2">
                <FileText className="w-5 h-5"/> Lab Requisition Preview
            </h2>
            <div className="flex gap-2">
                <button 
                    onClick={handlePrint} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-bold text-sm flex items-center transition-colors"
                >
                    <Printer className="w-4 h-4 mr-2"/> Print Requisition
                </button>
                <button 
                    onClick={onClose} 
                    className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-md transition-colors"
                >
                    <X className="w-5 h-5"/>
                </button>
            </div>
        </div>

        {/* PRINTABLE AREA */}
        <div className="p-10 flex-1 flex flex-col font-sans text-slate-900">
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: A4; margin: 0; }
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        min-height: 100vh;
                        padding: 15mm;
                        background: white;
                    }
                }
            `}} />
            
            <div className="print-area h-full flex flex-col">
                {/* Header */}
                <header className="border-b-4 border-slate-800 pb-6 mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight mb-2">
                            {doctor.clinicName || 'Clinic Name'}
                        </h1>
                        <div className="text-xs text-slate-600 leading-relaxed font-sans space-y-0.5">
                            <p className="font-bold">{doctor.clinicAddress}</p>
                            <p>{doctor.city}, {doctor.state} {doctor.pincode}</p>
                            <p className="mt-1">Ph: {doctor.phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold text-slate-800">Dr. {doctor.name}</h2>
                        <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">{doctor.qualifications}</p>
                        <p className="text-xs font-medium text-indigo-700">{doctor.specialty || 'General Physician'}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Reg: {doctor.licenseNumber}</p>
                    </div>
                </header>

                <div className="text-center mb-8">
                    <span className="border-2 border-slate-900 px-4 py-1 text-sm font-black uppercase tracking-widest">
                        Lab Investigation Requisition
                    </span>
                </div>

                {/* Patient Info */}
                <section className="mb-8 border border-slate-300 rounded p-4 bg-slate-50 print:bg-white">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                        <h3 className="text-xs font-bold uppercase text-slate-500">Patient Details</h3>
                        <span className="text-xs font-mono text-slate-400">Ref ID: {referral.id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Name</p>
                            <p className="font-bold text-lg">{patient.fullName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Age / Gender</p>
                            <p className="font-bold">
                                {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Yrs / {patient.gender}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Contact</p>
                            <p>{patient.phone}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Date</p>
                            <p>{new Date(referral.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </section>

                {/* Test Requests */}
                <section className="mb-8 flex-1">
                    <h3 className="text-sm font-bold uppercase text-slate-900 border-b-2 border-slate-900 pb-2 mb-4 flex items-center">
                        <Activity className="w-4 h-4 mr-2"/> Requested Investigations
                    </h3>
                    
                    <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
                        <p className="text-xl font-bold text-slate-900 mb-2">{referral.testName}</p>
                        {referral.notes && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Clinical Notes / Diagnosis</p>
                                <p className="text-sm text-slate-700 italic">{referral.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-l-4 border-indigo-500 bg-indigo-50 print:bg-white print:border-slate-300">
                        <p className="text-xs font-bold text-indigo-900 uppercase mb-1 print:text-slate-600">Preferred Lab</p>
                        <p className="font-medium text-slate-800">{referral.labName || 'Any NABL Accredited Laboratory'}</p>
                    </div>
                </section>

                {/* Footer / QR / Sign */}
                <footer className="mt-auto pt-6 border-t-2 border-slate-100 flex items-end justify-between">
                    
                    {/* LAB UPLOAD SECTION */}
                    <div className="flex items-center gap-4 bg-slate-100 p-3 rounded border border-slate-200 print:bg-white print:border-slate-300">
                        <div className="bg-white p-2 rounded shadow-sm border border-slate-200">
                            <QRCodeCanvas value={uploadLink} size={80} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">For Lab Use Only</p>
                            <p className="text-xs font-bold text-slate-900">Scan to Upload Report</p>
                            <p className="text-[9px] text-slate-500 mt-1 max-w-[150px] leading-tight">
                                Upload results directly to patient's secure digital health record.
                            </p>
                            <p className="text-[9px] font-mono mt-1 font-bold">Code: {referral.accessCode || '----'}</p>
                        </div>
                    </div>

                    {/* DOCTOR SIGN */}
                    <div className="text-right">
                        <div className="h-16 mb-2 flex items-end justify-end">
                            <ShieldCheck className="w-16 h-16 text-slate-100 -mb-2 -mr-2 print:hidden"/>
                        </div>
                        <div className="border-t-2 border-slate-800 w-40 ml-auto"></div>
                        <p className="text-xs font-bold uppercase mt-1">Dr. {doctor.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Authorized Signatory</p>
                    </div>
                </footer>
                
                <div className="text-center mt-8 text-[8px] text-slate-400 font-sans print:mt-4">
                    Generated by DevXWorld e-Rx Hub • {new Date().toLocaleString()}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
