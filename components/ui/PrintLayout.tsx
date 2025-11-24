
import React from 'react';
import { Prescription } from '../../types';

interface PrintLayoutProps {
  rx: Prescription;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ rx }) => {
  const doc = rx.doctorDetails || {
      name: rx.doctorName,
      qualifications: 'RMP',
      registrationNumber: 'N/A',
      clinicName: 'DevXWorld Network',
      clinicAddress: '',
      phone: '',
      fax: '',
      city: '',
      state: '',
      pincode: '',
      nmrUid: '',
      stateCouncil: '',
      specialty: ''
  };

  return (
    <div className="p-8 bg-white text-black font-sans mx-auto print:p-0" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Professional Header */}
      <div className="border-b-4 border-slate-900 pb-6 mb-6 flex justify-between items-start">
        <div className="w-1/2">
            {/* Clinic Details */}
            <h2 className="text-2xl font-bold text-slate-900 uppercase leading-tight mb-2">{doc.clinicName}</h2>
            <div className="text-sm text-slate-600 space-y-0.5">
                <p className="font-medium">{doc.clinicAddress}</p>
                <p>{doc.city}{doc.city && doc.state ? ', ' : ''}{doc.state} {doc.pincode ? '- ' + doc.pincode : ''}</p>
                <div className="flex gap-4 mt-1 text-xs">
                    {doc.phone && <p><span className="font-bold">Tel:</span> {doc.phone}</p>}
                    {doc.fax && <p><span className="font-bold">Fax:</span> {doc.fax}</p>}
                </div>
            </div>
        </div>
        
        <div className="w-1/2 text-right">
            <h1 className="text-xl font-bold text-slate-900 uppercase">Dr. {doc.name}</h1>
            <p className="text-sm font-bold text-slate-600 uppercase">{doc.qualifications}</p>
            {doc.specialty && <p className="text-xs font-medium text-slate-500 uppercase">{doc.specialty}</p>}
            
            <div className="mt-3 space-y-1 border-t border-slate-300 pt-2 inline-block text-right min-w-[180px]">
                <p className="text-base text-slate-900 font-black tracking-wide border-2 border-slate-900 px-2 py-0.5 inline-block">Reg No: {doc.registrationNumber}</p>
                <p className="text-xs text-slate-600 mt-1">NMR UID: <span className="font-semibold">{doc.nmrUid || 'N/A'}</span></p>
                <p className="text-[10px] text-slate-500 uppercase">{doc.stateCouncil}</p>
            </div>
        </div>
      </div>
      
      <div className="text-center mb-8">
          <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 inline-block pb-1">Official e-Prescription</h3>
      </div>

      {/* Patient Meta Data */}
      <div className="flex justify-between items-end mb-8 bg-slate-50 p-4 rounded border border-slate-200 print:bg-transparent print:border-slate-300 print:border-x-0 print:border-t-0 print:rounded-none">
         <div className="flex-1">
             <div className="flex space-x-12 text-sm">
                 <div>
                     <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Patient Name</span>
                     <span className="font-bold text-slate-900 text-lg">{rx.patientName}</span>
                 </div>
                 <div>
                     <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Age / Sex</span>
                     <span className="font-bold text-slate-900 text-lg">{rx.patientAge}Y / {rx.patientGender}</span>
                 </div>
                 <div>
                     <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Rx ID</span>
                     <span className="font-mono font-medium text-slate-700">#{rx.id}</span>
                 </div>
             </div>
         </div>
         <div className="text-right">
             <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Date of Issue</span>
             <span className="font-bold text-slate-900">{new Date(rx.date).toLocaleString()}</span>
         </div>
      </div>

      {/* Diagnosis */}
      <div className="mb-6 px-1">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Diagnosis / Clinical Notes</p>
          <p className="font-medium text-slate-900 text-sm">{rx.diagnosis}</p>
      </div>

      {/* Rx Symbol */}
      <div className="mb-2 text-slate-900 px-1">
        <span className="text-5xl font-serif italic font-bold">Rx</span>
      </div>

      {/* Medicines */}
      <div className="mb-8">
        <table className="w-full text-sm text-left border-collapse">
            <thead className="border-b-2 border-slate-800">
                <tr>
                    <th className="py-2 font-bold text-slate-800 w-5/12 uppercase text-xs">Medicine</th>
                    <th className="py-2 font-bold text-slate-800 w-2/12 uppercase text-xs">Dosage</th>
                    <th className="py-2 font-bold text-slate-800 w-3/12 uppercase text-xs">Frequency</th>
                    <th className="py-2 font-bold text-slate-800 w-2/12 uppercase text-xs">Duration</th>
                </tr>
            </thead>
            <tbody>
                {rx.medicines.map((m, i) => (
                    <React.Fragment key={i}>
                        <tr className="border-b border-slate-200">
                            <td className="py-3 font-bold text-slate-900 align-top text-base">{m.name}</td>
                            <td className="py-3 align-top text-slate-700 font-medium">{m.dosage}</td>
                            <td className="py-3 align-top text-slate-700 font-medium">{m.frequency}</td>
                            <td className="py-3 align-top text-slate-700 font-medium">{m.duration}</td>
                        </tr>
                        {m.instructions && (
                            <tr>
                                <td colSpan={4} className="pb-4 pt-1 text-xs italic text-slate-600 pl-4">
                                    <span className="font-bold not-italic text-slate-400 text-[10px] uppercase mr-1">Instruction:</span> {m.instructions}
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
      </div>

      {/* Advice & Follow-up */}
      <div className="mb-12 p-4 bg-slate-50 rounded border border-slate-200 print:bg-transparent print:border-slate-300 grid grid-cols-2 gap-4">
          <div className="col-span-2">
              <h4 className="font-bold text-slate-700 mb-2 text-xs uppercase">Additional Advice:</h4>
              <p className="text-slate-800 whitespace-pre-wrap text-sm leading-relaxed">{rx.advice || 'None'}</p>
          </div>
          <div className="border-t border-slate-200 pt-2 mt-2">
              <span className="font-bold text-slate-500 text-xs uppercase">Refills Allowed:</span>
              <span className="ml-2 font-bold text-slate-900">{rx.refills || 0}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 mt-2">
              <span className="font-bold text-slate-500 text-xs uppercase">Next Follow-up:</span>
              <span className="ml-2 font-bold text-slate-900">{rx.followUpDate ? new Date(rx.followUpDate).toLocaleDateString() : 'PRN'}</span>
          </div>
      </div>

      {/* Footer & Signature */}
      <div className="mt-auto pt-4 flex justify-between items-end">
        <div className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
            <p className="font-bold text-slate-800 mb-1">E-Rx Generated by DevXWorld Hub</p>
            <p>This is a digitally signed electronic prescription valid under the IT Act 2000 and Pharmacy Act 1948.</p>
            <p>Pharmacist must verify patient ID before dispensing.</p>
        </div>
        <div className="text-center min-w-[200px]">
             {/* Digital Signature Representation */}
             <div className="h-20 flex flex-col items-center justify-end pb-2 opacity-90">
                <div className="font-script text-2xl text-indigo-900 transform -rotate-3">
                    Signed by Dr. {doc.name.split(' ')[0]}
                </div>
                <span className="text-[8px] font-mono text-slate-400 mt-1 tracking-widest">{rx.digitalSignatureToken}</span>
             </div>
             <div className="border-t-2 border-slate-800 pt-2">
                 <p className="text-sm font-bold uppercase text-slate-900">Dr. {doc.name}</p>
                 <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-0.5">Reg. No: {doc.registrationNumber}</p>
             </div>
        </div>
      </div>
    </div>
  );
};
