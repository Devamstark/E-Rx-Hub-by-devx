import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Prescription, Patient, User, DoctorDetailsSnapshot } from '../../types';
import { Printer, QrCode, ShieldCheck, FileText, Download } from 'lucide-react';

interface Props {
  prescription: Prescription;
  doctor: User | DoctorDetailsSnapshot | any; // Accommodate User or DoctorDetailsSnapshot
  patient: Patient;
  pharmacy?: User;
  onPrint?: () => void;
  onGenerateQR?: () => void;
}

export const InsuranceReadyRxPrintLayout: React.FC<Props> = ({
  prescription,
  doctor,
  patient,
  pharmacy,
  onPrint,
  onGenerateQR
}) => {
  const [showQR, setShowQR] = useState(true);
  const [policyNo, setPolicyNo] = useState('');
  const [claimId, setClaimId] = useState('');
  const [dispenseAsWritten, setDispenseAsWritten] = useState(false);

  // Generate verification URL dynamically based on current origin
  // Use query param 'mode=verify' to avoid 404s on static hosts without SPA routing config
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://erxdevx.vercel.app';
  const verificationUrl = `${origin}/?mode=verify&rx_id=${prescription.id}`;

  const handlePrint = () => {
    if (onPrint) onPrint();
    window.print();
  };

  const handleDownload = () => {
      // Temporarily change title to ensure "Save as PDF" uses a good filename
      const originalTitle = document.title;
      const safeName = patient.fullName.replace(/[^a-z0-9]/gi, '_');
      document.title = `Rx_${safeName}_${prescription.id}`;
      
      window.print();
      
      // Revert title after print dialog closes (approximate timing)
      setTimeout(() => {
          document.title = originalTitle;
      }, 500);
  };

  const handleGenerateQR = () => {
      setShowQR(!showQR);
      if (onGenerateQR) onGenerateQR();
  };

  // Determine patient age string safely
  const patientAgeStr = patient.dateOfBirth 
    ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Yrs`
    : (prescription.patientAge ? `${prescription.patientAge} Yrs` : 'N/A');

  // Safely handle doctor object structure which might vary between User and Snapshot
  const docName = doctor.name || doctor.doctorName;
  const docQual = doctor.qualifications || 'MBBS';
  const docReg = doctor.licenseNumber || doctor.registrationNumber || doctor.reg_no || 'Pending';
  const docAddress = doctor.clinicAddress || doctor.address || '';
  const docCity = doctor.city || '';
  const docPhone = doctor.phone || '';

  return (
    <div className="bg-gray-100 p-4 sm:p-8 min-h-screen flex flex-col items-center">
        {/* Print Styles Injection */}
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                @page { size: A4; margin: 0; }
                body * { visibility: hidden; }
                #insurance-rx-print-container, #insurance-rx-print-container * { visibility: visible; }
                #insurance-rx-print-container { 
                    visibility: visible !important;
                    position: absolute; 
                    left: 0; 
                    top: 0; 
                    width: 210mm; 
                    min-height: 297mm; 
                    margin: 0; 
                    padding: 15mm; 
                    background: white;
                    box-shadow: none;
                    overflow: visible;
                }
                .no-print { display: none !important; }
                input[type="text"] { border: none; padding: 0; }
            }
        `}} />

        {/* Toolbar - Hidden on Print */}
        <div className="w-full max-w-[210mm] mb-6 flex flex-col sm:flex-row justify-between items-center no-print gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-600"/> Official Print Mode
            </h2>
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={handleGenerateQR}
                    className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium hover:bg-slate-50 text-slate-700 transition-colors"
                >
                    <QrCode className="w-4 h-4 mr-2"/> {showQR ? 'Hide QR' : 'Show QR'}
                </button>
                <button 
                    onClick={handleDownload}
                    className="flex items-center px-3 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-md text-sm font-bold hover:bg-indigo-50 shadow-sm transition-colors"
                >
                    <Download className="w-4 h-4 mr-2"/> Download PDF
                </button>
                <button 
                    onClick={handlePrint}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors"
                >
                    <Printer className="w-4 h-4 mr-2"/> Print
                </button>
            </div>
        </div>

        {/* Paper Container - A4 Portrait */}
        <div 
            id="insurance-rx-print-container"
            className="bg-white w-full max-w-[210mm] min-h-[297mm] p-10 shadow-2xl relative text-slate-900 box-border mx-auto"
        >
            {/* Header: Clinic & Doctor Info */}
            <header className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start">
                <div className="w-7/12 pr-4">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight mb-2 font-serif">
                        {doctor.clinicName || 'Clinic Name'}
                    </h1>
                    <div className="text-xs text-slate-600 leading-relaxed font-sans space-y-0.5">
                        <p>{docAddress}</p>
                        <p>{docCity} {doctor.state ? `, ${doctor.state}` : ''} {doctor.pincode ? `- ${doctor.pincode}` : ''}</p>
                        <p className="mt-1 font-bold flex gap-4">
                            <span>Phone: {docPhone}</span>
                            {doctor.email && <span>Email: {doctor.email}</span>}
                        </p>
                    </div>
                </div>
                <div className="w-5/12 text-right font-sans pl-4 border-l border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">Dr. {docName}</h2>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{docQual}</p>
                    <p className="text-xs font-medium text-indigo-700 mb-2">{doctor.specialty || 'General Physician'}</p>
                    
                    <div className="text-[10px] space-y-0.5 text-slate-600">
                        <p><span className="font-bold">Reg No:</span> {docReg}</p>
                        <p><span className="font-bold">NMC UID:</span> {doctor.nmrUid || 'N/A'}</p>
                        <p>{doctor.stateCouncil || 'Medical Council'}</p>
                    </div>
                </div>
            </header>

            {/* Insurance & Patient Grid */}
            <section className="mb-6 rounded border border-slate-300 overflow-hidden font-sans">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Patient Demographics & Insurance</span>
                    <span className="text-[10px] font-bold uppercase text-slate-500">Rx ID: <span className="text-slate-900 font-mono text-sm">{prescription.id}</span></span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
                    <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Patient Name</span>
                        <span className="font-bold text-base text-slate-900">{patient.fullName}</span>
                    </div>
                    <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Age / Gender</span>
                        <span className="font-medium text-slate-900">{patientAgeStr} / {patient.gender}</span>
                    </div>
                    <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Address</span>
                        <span className="block truncate text-slate-700">{patient.address || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">ABHA ID (Health ID)</span>
                        <span className="font-mono font-bold text-indigo-700">{patient.abhaNumber || 'N/A'}</span>
                    </div>
                    
                    {/* Editable Insurance Fields */}
                    <div className="col-span-2 grid grid-cols-2 gap-8 border-t border-dashed border-slate-200 pt-3 mt-1">
                        <div>
                            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Insurance Policy No.</label>
                            <input 
                                type="text" 
                                className="w-full text-xs font-mono border-b border-slate-300 focus:border-indigo-500 focus:outline-none bg-transparent placeholder-slate-300 print:placeholder-transparent"
                                placeholder="Enter Policy Number"
                                value={policyNo}
                                onChange={(e) => setPolicyNo(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Claim / Pre-Auth ID</label>
                            <input 
                                type="text" 
                                className="w-full text-xs font-mono border-b border-slate-300 focus:border-indigo-500 focus:outline-none bg-transparent placeholder-slate-300 print:placeholder-transparent"
                                placeholder="Enter Claim ID"
                                value={claimId}
                                onChange={(e) => setClaimId(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Clinical Notes */}
            <div className="mb-6 px-1">
                <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-xs font-bold uppercase text-slate-500 font-sans">Diagnosis & Vitals</h3>
                    <span className="text-[10px] text-slate-400">Date: {new Date(prescription.date).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'})} IST</span>
                </div>
                <p className="font-serif font-bold text-lg text-slate-900 mb-3">{prescription.diagnosis}</p>
                {prescription.vitals && Object.values(prescription.vitals).some(Boolean) && (
                    <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-600 border-t border-b border-slate-100 py-2">
                        {prescription.vitals.bp && <span><b className="text-slate-400">BP:</b> {prescription.vitals.bp}</span>}
                        {prescription.vitals.weight && <span><b className="text-slate-400">Wt:</b> {prescription.vitals.weight}kg</span>}
                        {prescription.vitals.temp && <span><b className="text-slate-400">Temp:</b> {prescription.vitals.temp}</span>}
                        {prescription.vitals.spo2 && <span><b className="text-slate-400">SpO2:</b> {prescription.vitals.spo2}%</span>}
                        {prescription.vitals.pulse && <span><b className="text-slate-400">HR:</b> {prescription.vitals.pulse}</span>}
                    </div>
                )}
            </div>

            {/* Medicine Table */}
            <div className="mb-8">
                <div className="flex items-center mb-2">
                    <span className="text-4xl font-serif font-black italic mr-2 text-slate-900">Rx</span>
                </div>
                <table className="w-full text-sm border-collapse font-sans">
                    <thead>
                        <tr className="border-b-2 border-slate-800 text-[10px] uppercase text-left tracking-wider text-slate-500">
                            <th className="py-2 w-5/12">Medicine Name & Strength</th>
                            <th className="py-2 w-2/12">Dosage</th>
                            <th className="py-2 w-2/12">Frequency</th>
                            <th className="py-2 w-1/12">Duration</th>
                            <th className="py-2 w-2/12">Instruction</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-800">
                        {prescription.medicines.map((med, idx) => (
                            <tr key={idx} className="border-b border-slate-200 align-top">
                                <td className="py-3 pr-2">
                                    <span className="font-bold block">{med.name}</span>
                                </td>
                                <td className="py-3 font-medium">{med.dosage}</td>
                                <td className="py-3 font-medium">{med.frequency}</td>
                                <td className="py-3 font-medium">{med.duration}</td>
                                <td className="py-3 italic text-slate-600 text-xs leading-tight">{med.instructions}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Advice & Verification */}
            <div className="grid grid-cols-2 gap-10 mb-8 font-sans">
                {/* Left: Advice */}
                <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Advice / Remarks</h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-800 min-h-[60px]">
                        {prescription.advice || 'Follow medication schedule strictly.'}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="block font-bold text-slate-400 uppercase text-[9px]">Refills</span>
                            <span className="font-bold text-slate-900">{prescription.refills || 0}</span>
                        </div>
                        <div>
                            <span className="block font-bold text-slate-400 uppercase text-[9px]">Follow-up</span>
                            <span className="font-bold text-slate-900">{prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString() : 'PRN'}</span>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center">
                        <input 
                            type="checkbox" 
                            id="daw"
                            checked={dispenseAsWritten} 
                            onChange={(e) => setDispenseAsWritten(e.target.checked)}
                            className="mr-2 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <label htmlFor="daw" className="text-xs font-bold uppercase text-slate-700">Dispense As Written (No Substitution)</label>
                    </div>
                </div>

                {/* Right: Verification & Sign */}
                <div className="flex flex-col justify-between">
                    {/* Pharmacist Box */}
                    <div className="border-2 border-dashed border-slate-300 p-3 rounded h-32 flex flex-col justify-between relative">
                        <span className="absolute top-0 right-0 bg-slate-100 text-[8px] uppercase font-bold px-2 py-0.5 rounded-bl">Pharmacy Use Only</span>
                        <h4 className="text-[10px] font-bold uppercase text-slate-400">Pharmacist Verification</h4>
                        <div className="mt-auto">
                            <div className="border-b border-slate-300 mb-1"></div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                                <span>Signature & Stamp</span>
                                <span>Date</span>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                                <span>Lic No: ________________</span>
                            </div>
                        </div>
                    </div>

                    {/* Doctor Sign */}
                    <div className="mt-6 text-right relative">
                        <div className="h-16 flex items-end justify-end mb-1 relative">
                            {/* Seal Background */}
                            <div className="absolute right-0 bottom-2 opacity-10 print:opacity-20 pointer-events-none">
                                <ShieldCheck className="w-20 h-20 text-indigo-900" />
                            </div>
                            <span className="font-serif italic text-xl text-indigo-900 pr-4 z-10">Dr. {docName.split(' ').pop()}</span>
                        </div>
                        <div className="border-t-2 border-slate-900 w-40 ml-auto"></div>
                        <p className="text-xs font-bold uppercase mt-1">Authorized Signatory</p>
                        <p className="text-[8px] font-mono text-slate-400 mt-1">DS: {prescription.digitalSignatureToken || 'TOKEN_PENDING'}</p>
                    </div>
                </div>
            </div>

            {/* Footer with QR */}
            <footer className="mt-auto pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                <div className="text-[9px] text-slate-400 font-sans max-w-md">
                    <p className="font-bold text-slate-600 mb-1">Generated via DevXWorld e-Rx Hub • Compliant with Pharmacy Act 1948, IT Act 2000 & DPDP Act 2023</p>
                    <p>This is a computer-generated e-prescription digitally signed by a Registered Medical Practitioner (RMP). Physical signature is not required as per IT Act 2000.</p>
                </div>
                {showQR && (
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Scan to Verify</p>
                            <p className="text-[8px] text-slate-400">Secure Cloud Record</p>
                        </div>
                        <QRCodeCanvas value={verificationUrl} size={56} />
                    </div>
                )}
            </footer>
        </div>
    </div>
  );
};