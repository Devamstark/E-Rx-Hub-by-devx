
import React from 'react';
import { Prescription } from '../../types';

interface PrintLayoutProps {
  rx: Prescription;
}

const getFrequencyInWords = (freq: string): string => {
    if (!freq) return '';
    const f = freq.toUpperCase().trim();
    if (f === '1-0-0' || f === 'OD') return 'Once daily (Morning)';
    if (f === '0-1-0') return 'Once daily (Afternoon)';
    if (f === '0-0-1' || f === 'HS') return 'Once daily (Night)';
    if (f === '1-0-1' || f === 'BD' || f === 'BID') return 'Twice daily (Morning & Night)';
    if (f === '1-1-1' || f === 'TDS' || f === 'TID') return 'Thrice daily';
    if (f === '1-1-1-1' || f === 'QID') return 'Four times daily';
    if (f === 'SOS') return 'As needed';
    if (f === 'STAT') return 'Immediately';
    if (/^\d-\d-\d$/.test(f)) {
        const [m, a, n] = f.split('-').map(Number);
        const parts = [];
        if (m) parts.push('Morning');
        if (a) parts.push('Afternoon');
        if (n) parts.push('Night');
        return parts.length > 0 ? parts.join(', ') : f;
    }
    return freq;
};

export const PrintLayout: React.FC<PrintLayoutProps> = ({ rx }) => {
  const doc = rx.doctorDetails || {
      name: rx.doctorName,
      qualifications: 'Registered Medical Practitioner',
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
      specialty: '',
      email: ''
  };

  const pat = rx.patientDetails || {
      name: rx.patientName,
      age: rx.patientAge,
      gender: rx.patientGender,
      address: '',
      phone: '',
      allergies: [],
      chronicConditions: []
  };

  return (
    <div className="p-10 bg-white text-black font-sans mx-auto print:p-0 flex flex-col" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
      
      {/* 1. HEADER: TITLE & CLINIC */}
      <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-5xl font-serif font-bold text-slate-900 mb-2 tracking-wider">E-Rx</h1>
          <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-800">{doc.clinicName}</h2>
      </div>

      {/* 2. DOCTOR INFO */}
      <div className="mb-6 pb-4 border-b border-slate-300">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Prescribing Doctor</h3>
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-lg font-bold text-slate-900">Dr. {doc.name}</p>
                  <p className="text-sm font-medium text-slate-700">{doc.qualifications}</p>
                  {doc.specialty && <p className="text-sm font-medium text-slate-700">{doc.specialty}</p>}
              </div>
              <div className="text-right text-sm text-slate-600 max-w-[50%]">
                  <p>{doc.clinicAddress}</p>
                  <p>{doc.city}, {doc.state} - {doc.pincode}</p>
                  <p>Contact: {doc.phone}</p>
              </div>
          </div>
      </div>

      {/* 3. PATIENT INFO */}
      <div className="mb-6 pb-4 border-b border-slate-300">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Patient Details</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="flex"><span className="font-bold w-24">Name:</span> {pat.name}</div>
              <div className="flex"><span className="font-bold w-24">Age / Sex:</span> {pat.age} Y / {pat.gender}</div>
              <div className="flex"><span className="font-bold w-24">Contact:</span> {pat.phone || 'N/A'}</div>
              <div className="flex"><span className="font-bold w-24">Address:</span> {pat.address || 'N/A'}</div>
              <div className="col-span-2 flex mt-1">
                  <span className="font-bold w-24">Allergies:</span> 
                  <span className={`${pat.allergies && pat.allergies.length > 0 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                      {pat.allergies && pat.allergies.length > 0 ? pat.allergies.join(', ') : 'None'}
                  </span>
              </div>
              {pat.chronicConditions && pat.chronicConditions.length > 0 && (
                  <div className="col-span-2 flex">
                      <span className="font-bold w-24">Medical Hx:</span> {pat.chronicConditions.join(', ')}
                  </div>
              )}
          </div>
      </div>

      {/* 4. RX DETAILS (Diagnosis + ID) */}
      <div className="mb-4 flex justify-between items-end">
          <div>
              {rx.diagnosis && (
                  <div className="mb-2">
                      <span className="font-bold text-sm mr-2">Diagnosis:</span>
                      <span className="text-sm">{rx.diagnosis}</span>
                  </div>
              )}
          </div>
          <div className="text-right text-sm">
              <p><span className="font-bold">Date:</span> {new Date(rx.date).toLocaleDateString()}</p>
              <p><span className="font-bold">Rx ID:</span> {rx.id}</p>
          </div>
      </div>

      {/* Rx Symbol */}
      <div className="text-4xl font-serif font-bold italic text-slate-800 mb-2">Rx</div>

      {/* MEDICINES TABLE */}
      <div className="mb-6 flex-grow">
          <table className="w-full text-sm border-collapse">
              <thead>
                  <tr className="border-b-2 border-slate-800 text-left">
                      <th className="py-2 pr-2 w-10 text-center">#</th>
                      <th className="py-2 pr-2 w-1/3">Medicine & Strength</th>
                      <th className="py-2 pr-2 w-1/12">Route</th>
                      <th className="py-2 pr-2 w-1/12">Dose</th>
                      <th className="py-2 pr-2 w-1/4">Frequency</th>
                      <th className="py-2 pr-2 w-1/12">Dur.</th>
                      <th className="py-2 w-1/6">Instructions</th>
                  </tr>
              </thead>
              <tbody className="text-slate-800">
                  {rx.medicines.map((m, i) => (
                      <tr key={i} className="border-b border-slate-200 align-top">
                          <td className="py-3 text-center font-bold text-slate-500">{i + 1}</td>
                          <td className="py-3 font-bold">
                              {m.name} {m.strength ? `(${m.strength})` : ''}
                              <div className="text-xs font-normal text-slate-500 mt-0.5">Refills: {m.refill || 0}</div>
                          </td>
                          <td className="py-3">{m.route || 'Oral'}</td>
                          <td className="py-3">{m.dosage}</td>
                          <td className="py-3 font-medium">{getFrequencyInWords(m.frequency)}</td>
                          <td className="py-3">{m.duration}</td>
                          <td className="py-3 italic text-xs">{m.instructions || '-'}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* 5. NOTES / REMARKS */}
      <div className="mb-8 border-t border-slate-300 pt-4">
          <h3 className="font-bold text-slate-700 uppercase text-sm mb-2">Notes / Remarks:</h3>
          <div className="text-sm text-slate-800 min-h-[60px]">
              {rx.advice ? (
                  <ul className="list-disc list-inside">
                      {rx.advice.split('\n').map((line, i) => <li key={i} className="mb-1">{line}</li>)}
                  </ul>
              ) : 'None'}
          </div>
      </div>

      {/* 6. FOOTER SECTION (Legal) */}
      <div className="mt-auto border-t-2 border-slate-900 pt-6">
          <div className="flex justify-between items-end mb-6">
              <div className="w-1/2">
                  {/* QR Code Placeholder Box */}
                  <div className="border border-slate-300 w-24 h-24 flex items-center justify-center bg-slate-50 text-xs text-slate-400 text-center p-2">
                      Rx ID: {rx.id}<br/>[QR CODE]
                  </div>
              </div>
              <div className="w-1/2 text-right">
                  <div className="font-script text-xl text-slate-900 mb-2">
                      Signature of Dr. {doc.name.split(' ')[0]}
                  </div>
                  <p className="font-bold text-slate-900 text-base">Dr. {doc.name}</p>
                  <p className="font-bold text-slate-800 text-sm uppercase">REG. NO: {doc.registrationNumber}</p>
              </div>
          </div>

          <div className="text-center space-y-3">
              <p className="font-bold text-xs text-slate-900 border-b border-slate-300 pb-2 inline-block px-4">
                  Substitution Allowed / <span className="line-through text-slate-400">Not Allowed</span> (Strike out whichever is not applicable)
              </p>
              
              <div className="text-[10px] text-slate-600 leading-tight max-w-3xl mx-auto">
                  <p>This prescription is generated via a Telemedicine consultation compliant with Telemedicine Practice Guidelines 2020.</p>
                  <p>Valid for dispensing in India under Drugs & Cosmetics Act, 1940.</p>
                  <p className="mt-1 font-mono text-[8px] text-slate-400">Token: {rx.digitalSignatureToken}</p>
              </div>
          </div>
      </div>
    </div>
  );
};
