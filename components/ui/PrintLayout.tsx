
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
      {/* Main Header: E-RX & Rx ID */}
      <div className="border-b-4 border-indigo-900 pb-4 mb-6 flex justify-between items-start">
        <div className="w-1/2">
            {/* Requested Change: Big E-RX and Rx Number */}
            <h1 className="text-6xl font-black uppercase text-indigo-900 tracking-tighter leading-none mb-2">E-RX</h1>
            <p className="text-xl font-mono font-bold text-slate-600 mb-4 tracking-widest pl-1">#{rx.id}</p>

            {/* Clinic Details (Moved below as sub-info) */}
            <div className="mt-2 border-l-4 border-indigo-100 pl-3">
                <h2 className="text-lg font-bold text-slate-800 uppercase leading-tight">{doc.clinicName}</h2>
                <div className="text-sm text-slate-600 space-y-0.5 mt-1">
                    <p className="font-medium">{doc.clinicAddress}</p>
                    <p>{doc.city}{doc.city && doc.state ? ', ' : ''}{doc.state} {doc.pincode ? '- ' + doc.pincode : ''}</p>
                    <div className="flex gap-4 mt-1 text-xs">
                        {doc.phone && <p><span className="font-bold">Tel:</span> {doc.phone}</p>}
                        {doc.fax && <p><span className="font-bold">Fax:</span> {doc.fax}</p>}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="w-1/2 text-right pt-2">
            <h2 className="text-2xl font-bold text-slate-900">Dr. {doc.name}</h2>
            <p className="text-sm font-bold text-indigo-700 uppercase">{doc.qualifications}</p>
            {doc.specialty && <p className="text-xs font-bold text-slate-500 uppercase">{doc.specialty}</p>}
            
            <div className="mt-3 space-y-0.5 border-t border-slate-200 pt-2 inline-block text-right">
                <p className="text-xs text-slate-600">Reg No: <span className="font-semibold text-slate-900">{doc.registrationNumber}</span></p>
                <p className="text-xs text-slate-600">NMR UID: <span className="font-semibold text-slate-900">{doc.nmrUid || 'N/A'}</span></p>
                <p className="text-[10px] text-slate-400">{doc.stateCouncil}</p>
            </div>
        </div>
      </div>

      {/* Patient Meta Data */}
      <div className="flex justify-between items-end mb-6 border-b border-slate-300 pb-2 bg-slate-50 p-3 rounded-sm print:bg-transparent print:p-0">
         <div className="flex-1">
             <div className="flex space-x-8 text-sm">
                 <div>
                     <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Patient Name</span>
                     <span className="font-bold text-slate-900 text-base">{rx.patientName}</span>
                 </div>
                 <div>
                     <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Age / Sex</span>
                     <span className="font-bold text-slate-900 text-base">{rx.patientAge}Y / {rx.patientGender}</span>
                 </div>
             </div>
         </div>
         <div className="text-right">
             <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Date of Issue</span>
             <span className="font-bold text-slate-900">{new Date(rx.date).toLocaleString()}</span>
         </div>
      </div>

      {/* Diagnosis */}
      <div className="mb-6 px-1">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Diagnosis / Clinical Notes</p>
          <p className="font-medium text-slate-900 text-sm">{rx.diagnosis}</p>
      </div>

      {/* Rx Symbol */}
      <div className="mb-2 text-indigo-900 px-1">
        <span className="text-4xl font-serif italic font-bold">Rx</span>
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
                            <td className="py-3 font-bold text-slate-900 align-top">{m.name}</td>
                            <td className="py-3 align-top text-slate-700">{m.dosage}</td>
                            <td className="py-3 align-top text-slate-700">{m.frequency}</td>
                            <td className="py-3 align-top text-slate-700">{m.duration}</td>
                        </tr>
                        {m.instructions && (
                            <tr>
                                <td colSpan={4} className="pb-3 pt-0 text-xs italic text-slate-500 pl-2 border-b border-slate-100">
                                    <span className="font-semibold">Instruction:</span> {m.instructions}
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
      </div>

      {/* Advice */}
      {rx.advice && (
          <div className="mb-12 p-4 bg-slate-50 rounded border border-slate-200 print:border-slate-300">
              <h4 className="font-bold text-slate-700 mb-1 text-xs uppercase">Additional Advice:</h4>
              <p className="text-slate-800 whitespace-pre-wrap text-sm">{rx.advice}</p>
          </div>
      )}

      {/* Footer & Signature */}
      <div className="mt-auto pt-8 border-t-2 border-slate-800 flex justify-between items-end">
        <div className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
            <p className="font-bold text-indigo-900 mb-1">E-Rx Sent by DevXWorld</p>
            <p>This is a digitally signed electronic prescription valid under the IT Act 2000 and Pharmacy Act 1948.</p>
            <p>Dispense only against valid identification.</p>
        </div>
        <div className="text-center min-w-[150px]">
             {/* Digital Signature Representation */}
             <div className="h-16 flex flex-col items-center justify-end pb-2 opacity-90">
                <span className="text-[8px] font-mono text-slate-300 mb-1">{rx.digitalSignatureToken}</span>
                <div className="font-script text-xl text-indigo-800 transform -rotate-3">
                    Signed by Dr. {doc.name.split(' ')[0]}
                </div>
             </div>
             <div className="border-t border-slate-500 pt-1">
                 <p className="text-sm font-bold uppercase text-slate-900">Dr. {doc.name}</p>
                 <p className="text-[10px] text-slate-500 uppercase tracking-wider">{doc.qualifications}</p>
             </div>
        </div>
      </div>
    </div>
  );
};
