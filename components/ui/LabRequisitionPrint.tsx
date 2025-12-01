
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { LabReferral } from '../../types';
import { Printer, X, Microscope, ShieldCheck } from 'lucide-react';

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

    return (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl relative flex flex-col">
                {/* Print Toolbar */}
                <div className="p-4 bg-slate-800 text-white flex justify-between items-center print:hidden sticky top-0 z-10">
                    <h3 className="font-bold flex items-center"><Microscope className="w-5 h-5 mr-2"/> Lab Requisition Preview</h3>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="bg-white text-slate-900 px-4 py-2 rounded font-bold hover:bg-slate-100 flex items-center">
                            <Printer className="w-4 h-4 mr-2"/> Print
                        </button>
                        <button onClick={onClose} className="bg-slate-700 text-white p-2 rounded hover:bg-slate-600"><X className="w-5 h-5"/></button>
                    </div>
                </div>

                {/* Content Area - A4 */}
                <div className="p-[15mm] flex-1 flex flex-col text-slate-900 font-sans bg-white">
                    {/* Professional Header */}
                    <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black uppercase text-slate-900 mb-1 tracking-tight">Diagnostic Request</h1>
                            <p className="text-sm font-bold text-teal-700 uppercase tracking-widest">DevXWorld Health Network</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-slate-800">Dr. {referral.doctorName}</h2>
                            <p className="text-sm text-slate-500 font-mono mt-1 font-bold">REF: {referral.id}</p>
                            <p className="text-xs text-slate-500">Date: {new Date(referral.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Patient & Doctor Info Grid */}
                    <div className="mb-8 border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200">
                            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Requisition Details</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Patient Name</span>
                                <span className="text-lg font-bold text-slate-900 block border-b border-slate-100 pb-1">{referral.patientName}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Patient ID / File</span>
                                <span className="text-base font-mono text-slate-700 block border-b border-slate-100 pb-1">{referral.patientId}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Referring Doctor</span>
                                <span className="text-base font-medium text-slate-900 block">Dr. {referral.doctorName}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Preferred Lab</span>
                                <span className="text-base font-medium text-slate-900 block">{referral.labName || 'Open Referral (Any Certified Lab)'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Test Details (The Main Content) */}
                    <div className="mb-10 flex-grow">
                        <h3 className="text-sm font-bold uppercase text-slate-900 mb-4 border-b-2 border-slate-900 pb-1 inline-block">Tests Required</h3>
                        <div className="bg-slate-50 border-l-4 border-teal-600 p-6 shadow-sm rounded-r-lg">
                            <p className="text-2xl font-bold text-slate-900 mb-3">{referral.testName}</p>
                            {referral.notes && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Clinical Notes / Instructions:</span>
                                    <p className="text-sm text-slate-800 italic mt-1">{referral.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lab Instructions & QR & Access Code */}
                    <div className="mt-auto">
                        <div className="flex justify-between items-end border-t-2 border-dashed border-slate-300 pt-8">
                            <div className="w-2/3 pr-8">
                                <h4 className="font-bold text-slate-800 uppercase mb-2 text-sm">Lab Technician Instructions</h4>
                                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 mb-4 leading-relaxed">
                                    <li>Verify patient identity before sample collection.</li>
                                    <li>Scan the QR code to securely upload reports.</li>
                                    <li>Portal Link: <span className="font-mono bg-slate-100 px-1 text-slate-800">{uploadLink}</span></li>
                                </ul>
                                
                                <div className="inline-block bg-slate-100 border border-slate-200 px-4 py-2 rounded">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase text-center">Security Access Code</p>
                                    <p className="text-2xl font-mono font-bold text-slate-900 text-center tracking-widest">0000</p>
                                </div>
                            </div>
                            
                            <div className="w-1/3 flex flex-col items-center">
                                <div className="border-2 border-slate-900 p-2 bg-white rounded-lg shadow-sm">
                                    <QRCodeCanvas value={uploadLink} size={110} />
                                </div>
                                <p className="text-[10px] font-bold uppercase mt-2 text-slate-500 tracking-wider">Scan to Upload</p>
                            </div>
                        </div>

                        {/* Signature Block */}
                        <div className="mt-12 flex justify-end">
                            <div className="text-center w-48">
                                <div className="h-16 flex items-end justify-center pb-2 relative">
                                     <div className="absolute opacity-10 top-0 left-10">
                                         <ShieldCheck className="w-16 h-16 text-indigo-900"/>
                                     </div>
                                     <span className="font-serif italic text-xl text-indigo-900 z-10">Dr. {referral.doctorName.split(' ').pop()}</span>
                                </div>
                                <div className="border-t-2 border-slate-900"></div>
                                <p className="text-xs font-bold uppercase mt-1 text-slate-900">Authorized Signatory</p>
                                <p className="text-[9px] text-slate-500">Reg. Medical Practitioner</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                        Generated by DevXWorld e-Rx Hub • Digital Health Record System
                    </div>
                </div>
            </div>
            
            {/* Print CSS */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * { visibility: hidden; }
                    .fixed, .fixed * { visibility: visible; position: absolute; left: 0; top: 0; }
                    .print\\:hidden { display: none !important; }
                    .bg-slate-900\\/80 { background: white; }
                    .overflow-y-auto { overflow: visible; }
                    .shadow-2xl { shadow: none; }
                }
            `}} />
        </div>
    );
};
