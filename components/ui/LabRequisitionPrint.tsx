
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { LabReferral } from '../../types';
import { Printer, X, Microscope, ShieldCheck, Download, Mail, MapPin, Phone } from 'lucide-react';

interface Props {
    referral: LabReferral;
    onClose: () => void;
}

export const LabRequisitionPrint: React.FC<Props> = ({ referral, onClose }) => {
    // Generate the upload link dynamically based on current origin, defaulting to production
    const origin = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? window.location.origin 
        : 'https://erxdevx.vercel.app';
        
    const uploadLink = `${origin}/?mode=lab-upload&ref_id=${referral.id}`;

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const originalTitle = document.title;
        // Set filename for "Save as PDF"
        document.title = `Lab_Requisition_${referral.patientName.replace(/\s/g, '_')}`;
        window.print();
        setTimeout(() => { document.title = originalTitle; }, 500);
    };

    // Helper to calculate age if not directly provided but DOB is available
    const getAge = () => {
        if (referral.patientAge) return referral.patientAge;
        if (referral.patientDob) {
            const age = new Date().getFullYear() - new Date(referral.patientDob).getFullYear();
            return isNaN(age) ? 'N/A' : age;
        }
        return 'N/A';
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 z-[100] flex justify-center backdrop-blur-sm">
            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * { visibility: hidden; }
                    #lab-requisition-print, #lab-requisition-print * { visibility: visible; }
                    #lab-requisition-print { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        min-height: 100%;
                        margin: 0; 
                        padding: 10mm; 
                        background: white; 
                        box-shadow: none;
                    }
                    .no-print { display: none !important; }
                    /* Hide scrollbars during print */
                    ::-webkit-scrollbar { display: none; }
                }
            `}} />

            <div className="w-full max-w-[210mm] flex flex-col h-full bg-white shadow-2xl relative">
                {/* Print Toolbar - STICKY TOP */}
                <div className="p-4 bg-slate-800 text-white flex justify-between items-center no-print shrink-0 shadow-md z-10">
                    <h3 className="font-bold flex items-center"><Microscope className="w-5 h-5 mr-2"/> Lab Requisition Preview</h3>
                    <div className="flex gap-2">
                        <button onClick={handleDownload} className="bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded font-bold hover:bg-slate-100 flex items-center text-sm">
                            <Download className="w-4 h-4 mr-2"/> Download PDF
                        </button>
                        <button onClick={handlePrint} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 flex items-center text-sm">
                            <Printer className="w-4 h-4 mr-2"/> Print
                        </button>
                        <button onClick={onClose} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 flex items-center text-sm">
                            <X className="w-4 h-4 mr-1"/> Close
                        </button>
                    </div>
                </div>

                {/* Content Area - Scrollable Container */}
                <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8 flex justify-center">
                    {/* A4 Paper Target */}
                    <div id="lab-requisition-print" className="w-[210mm] min-h-[297mm] bg-white p-[15mm] flex flex-col text-slate-900 font-sans shadow-lg relative">
                        
                        {/* Header: Doctor / Clinic Details */}
                        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-start shrink-0">
                            <div className="w-2/3">
                                <h1 className="text-2xl font-black uppercase text-slate-900 mb-1 tracking-tight">Diagnostic Request</h1>
                                <p className="text-sm font-bold text-teal-700 uppercase tracking-widest mb-4">DevXWorld Health Network</p>
                                
                                {/* Detailed Doctor Info */}
                                <div className="text-xs text-slate-600 space-y-1">
                                    <p className="font-bold text-sm text-slate-800 uppercase">Referring Dr. {referral.doctorName}</p>
                                    <p>Reg No: RMP-VERIFIED</p>
                                    <p className="flex items-center"><MapPin className="w-3 h-3 mr-1 inline"/> Clinic Address: Digital Clinic, DevXWorld Network</p>
                                    <p className="flex items-center"><Phone className="w-3 h-3 mr-1 inline"/> +91 98765 43210</p>
                                    <p className="flex items-center"><Mail className="w-3 h-3 mr-1 inline"/> support@devxworld.com</p>
                                </div>
                            </div>
                            <div className="text-right w-1/3">
                                <div className="bg-slate-100 border border-slate-200 p-2 rounded text-center mb-2">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Referral ID</p>
                                    <p className="text-sm font-mono font-bold">{referral.id}</p>
                                </div>
                                <p className="text-xs text-slate-500 font-bold">Date: {new Date(referral.date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Patient Details Grid */}
                        <div className="mb-8 border border-slate-300 rounded-lg overflow-hidden shrink-0">
                            <div className="bg-slate-100 px-6 py-2 border-b border-slate-300">
                                <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider">Patient Information</h3>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-12">
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Patient Name</span>
                                    <span className="text-xl font-bold text-slate-900 block">{referral.patientName}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Age / Gender / DOB</span>
                                    <span className="text-base font-medium text-slate-900 block">
                                        {getAge()} Yrs / {referral.patientGender || 'N/A'} 
                                        {referral.patientDob && <span className="text-sm text-slate-500 ml-1">({new Date(referral.patientDob).toLocaleDateString()})</span>}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Address & Contact</span>
                                    <span className="text-sm font-medium text-slate-900 block">{referral.patientAddress || 'N/A'}</span>
                                    {referral.patientPhone && <span className="text-xs text-slate-500 block mt-0.5">Ph: {referral.patientPhone}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Test Details (The Main Content) */}
                        <div className="mb-10 flex-grow">
                            <h3 className="text-sm font-bold uppercase text-slate-900 mb-4 border-b-2 border-slate-900 pb-1 inline-block">Investigation(s) Required</h3>
                            <div className="bg-white border-l-4 border-slate-900 p-6 shadow-sm border border-slate-200 border-l-slate-900 rounded-r-lg">
                                <p className="text-2xl font-bold text-slate-900 mb-2">{referral.testName}</p>
                                {referral.notes && (
                                    <div className="mt-4 pt-4 border-t border-dashed border-slate-300">
                                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Clinical Notes / Specific Instructions:</span>
                                        <p className="text-sm text-slate-800 italic">{referral.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Section: Instructions & QR */}
                        <div className="mt-auto shrink-0">
                            <div className="flex justify-between items-end border-t-2 border-slate-800 pt-6">
                                
                                {/* Left: Instructions */}
                                <div className="w-2/3 pr-8">
                                    <h4 className="font-bold text-slate-800 uppercase mb-2 text-sm">Instructions to Laboratory</h4>
                                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 mb-6 leading-relaxed">
                                        <li>Please verify patient identity before sample collection.</li>
                                        <li>Perform tests as per standard NABL protocols.</li>
                                        <li><strong>Upload Reports:</strong> Scan the QR code or visit the link below.</li>
                                    </ul>
                                    
                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded flex items-center justify-between max-w-sm">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Upload Link</p>
                                            <p className="text-[10px] font-mono text-indigo-700 truncate w-48">{uploadLink}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Access Code</p>
                                            <p className="text-xl font-mono font-bold text-slate-900">0000</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Right: QR & Signature */}
                                <div className="w-1/3 flex flex-col items-end">
                                    <div className="flex flex-col items-center mb-6">
                                        <div className="border-2 border-slate-900 p-1 bg-white">
                                            <QRCodeCanvas value={uploadLink} size={100} />
                                        </div>
                                        <p className="text-[9px] font-bold uppercase mt-1 text-slate-500">Scan to Upload</p>
                                    </div>

                                    <div className="text-center w-40">
                                        <div className="h-12 flex items-end justify-center pb-1 relative">
                                             <div className="absolute opacity-10 bottom-0">
                                                 <ShieldCheck className="w-12 h-12 text-indigo-900"/>
                                             </div>
                                             <span className="font-serif italic text-lg text-indigo-900 z-10">Dr. {referral.doctorName.split(' ').pop()}</span>
                                        </div>
                                        <div className="border-t border-slate-900"></div>
                                        <p className="text-[10px] font-bold uppercase mt-1 text-slate-900">Authorized Signatory</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Bar */}
                        <div className="mt-8 text-center text-[9px] text-slate-400 border-t border-slate-100 pt-2 shrink-0">
                            Generated by DevXWorld e-Rx Hub • Digital Health Record System
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
