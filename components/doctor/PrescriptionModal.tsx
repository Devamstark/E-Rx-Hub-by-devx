import React, { useState } from 'react';
import { Prescription, Patient } from '../../types';
import { X, Printer, CheckCircle, FileText, ClipboardList, Share2, AlertOctagon, Repeat, Calendar, Activity, ArrowLeft } from 'lucide-react';
import { InsuranceReadyRxPrintLayout } from '../ui/InsuranceReadyRxPrintLayout';

interface PrescriptionModalProps {
  prescription: Prescription;
  onClose: () => void;
  onDispense?: (id: string) => void;
  isPharmacy?: boolean;
  patientProfile?: Patient | null; // Optional: Full patient profile for accurate printing
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ 
  prescription, 
  onClose, 
  onDispense, 
  isPharmacy = false,
  patientProfile
}) => {
  const [showPrintLayout, setShowPrintLayout] = useState(false);

  // Use snapshot details if available, else fallback to legacy/simple data
  const docName = prescription.doctorDetails?.name || prescription.doctorName;
  const docQual = prescription.doctorDetails?.qualifications || 'Registered Medical Practitioner';
  const docSpecialty = prescription.doctorDetails?.specialty;
  const clinicName = prescription.doctorDetails?.clinicName || 'DevXWorld Network';

  const handleShare = () => {
    // Generate link based on current domain origin
    const origin = window.location.origin;
    // Use query param mode to ensure index.html loads on static hosts, avoiding 404
    const trackingLink = `${origin}/?mode=verify&rx_id=${prescription.id}`;

    const text = `*${clinicName}*
Dr. ${docName} (${docQual}${docSpecialty ? ' - ' + docSpecialty : ''})

*Rx for:* ${prescription.patientName} (${prescription.patientAge}Y)
*Diagnosis:* ${prescription.diagnosis}

*Medicines:*
${prescription.medicines.map(m => `- ${m.name} (${m.dosage}) | ${m.frequency}`).join('\n')}

*Follow-up:* ${prescription.followUpDate || 'PRN'}

*Verify & Track:* ${trackingLink}
    `.trim();

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Reconstruct minimal patient object for print layout if profile not passed
  const fallbackPatient: Patient = {
      id: prescription.patientId || '',
      fullName: prescription.patientName,
      gender: prescription.patientGender,
      dateOfBirth: '', // derived
      phone: '',
      address: '',
      doctorId: prescription.doctorId,
      allergies: [],
      chronicConditions: [],
      registeredAt: ''
  };

  const printPatient = patientProfile || fallbackPatient;

  // Reconstruct doctor object for print layout
  const printDoctor = prescription.doctorDetails || {
      name: docName,
      qualifications: docQual,
      specialty: docSpecialty,
      clinicName: clinicName,
      clinicAddress: '',
      phone: '',
      licenseNumber: 'Pending'
  };

  if (showPrintLayout) {
      return (
          <div className="fixed inset-0 bg-white z-[60] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-slate-900 text-white px-4 py-2 flex items-center justify-between no-print shadow-md">
                  <div className="flex items-center">
                      <button onClick={() => setShowPrintLayout(false)} className="mr-3 p-1 hover:bg-slate-700 rounded-full">
                          <ArrowLeft className="w-5 h-5"/>
                      </button>
                      <span className="font-bold text-sm">Return to Digital View</span>
                  </div>
                  <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full">
                      <X className="w-5 h-5"/>
                  </button>
              </div>
              <InsuranceReadyRxPrintLayout 
                  prescription={prescription} 
                  patient={printPatient} 
                  doctor={printDoctor}
              />
          </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shrink-0">
          <div className="text-white">
            <h3 className="font-bold text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5 text-indigo-300"/> Digital Prescription
            </h3>
            <p className="text-xs text-indigo-300 font-mono mt-0.5">{prescription.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={handleShare}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors shadow-sm border border-green-500"
                title="Share via WhatsApp"
            >
                <Share2 className="w-4 h-4 mr-2" /> Share
            </button>
            <button 
                onClick={() => setShowPrintLayout(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors border border-white/20"
                title="Official Print Layout"
            >
                <Printer className="w-4 h-4 mr-2" /> Print Official
            </button>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors ml-2">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto grow">
          
          {/* Status Banner for Doctor feedback */}
          {prescription.status === 'REJECTED_STOCK' && (
             <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center mb-4 animate-in slide-in-from-top-2">
                 <AlertOctagon className="w-6 h-6 text-amber-600 mr-3" />
                 <div>
                     <h4 className="text-sm font-bold text-amber-800">Pharmacy Feedback: Out of Stock</h4>
                     <p className="text-xs text-amber-700">The pharmacy rejected this prescription due to unavailable stock.</p>
                 </div>
             </div>
          )}

          {/* Doctor & Patient Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Prescribed By</p>
              <p className="text-lg font-bold text-slate-800">Dr. {docName}</p>
              <p className="text-sm font-medium text-indigo-700">
                {docQual} {docSpecialty ? <span className="text-slate-500">• {docSpecialty}</span> : ''}
              </p>
              <p className="text-xs text-slate-500 mt-1">{clinicName}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Patient Details</p>
              <p className="text-lg font-bold text-slate-800">{prescription.patientName}</p>
              <p className="text-sm text-slate-500">{prescription.patientAge} Years, {prescription.patientGender}</p>
              {patientProfile?.phone && <p className="text-xs text-slate-500 mt-1">Ph: {patientProfile.phone}</p>}
            </div>
          </div>

          {/* Clinical Data: Vitals & Diagnosis */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-teal-600"/> Clinical Notes
            </h4>
            <div className="space-y-3">
                {prescription.vitals && Object.values(prescription.vitals).some(v => v) && (
                    <div className="flex gap-4 text-sm bg-teal-50 border border-teal-100 p-3 rounded">
                        {prescription.vitals.bp && <div><span className="font-bold text-slate-500 text-xs uppercase">BP:</span> <span className="font-mono">{prescription.vitals.bp}</span></div>}
                        {prescription.vitals.pulse && <div><span className="font-bold text-slate-500 text-xs uppercase">Pulse:</span> <span className="font-mono">{prescription.vitals.pulse}</span></div>}
                        {prescription.vitals.temp && <div><span className="font-bold text-slate-500 text-xs uppercase">Temp:</span> <span className="font-mono">{prescription.vitals.temp}</span></div>}
                        {prescription.vitals.spo2 && <div><span className="font-bold text-slate-500 text-xs uppercase">SpO2:</span> <span className="font-mono">{prescription.vitals.spo2}%</span></div>}
                        {prescription.vitals.weight && <div><span className="font-bold text-slate-500 text-xs uppercase">Weight:</span> <span className="font-mono">{prescription.vitals.weight} kg</span></div>}
                    </div>
                )}
                <div className="p-3 bg-white border border-slate-200 rounded text-slate-700 text-sm">
                  <span className="font-bold text-xs uppercase text-slate-400 block mb-1">Diagnosis:</span>
                  {prescription.diagnosis}
                </div>
            </div>
          </div>

          {/* Medicines Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
              <ClipboardList className="w-4 h-4 mr-2 text-indigo-600"/> Medication Details
            </h4>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Medicine Name</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Dosage</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Frequency</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Duration</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescription.medicines.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                      <td className="px-4 py-3 text-slate-600">{m.dosage}</td>
                      <td className="px-4 py-3 text-slate-600">{m.frequency}</td>
                      <td className="px-4 py-3 text-slate-600">{m.duration}</td>
                      <td className="px-4 py-3 text-slate-500 italic text-xs">{m.instructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Advice & Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {prescription.advice && (
                <div className="sm:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-800 uppercase mb-1">Additional Advice</h4>
                  <p className="text-sm text-blue-900">{prescription.advice}</p>
                </div>
              )}
              <div className="bg-slate-50 p-3 rounded border border-slate-100 flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-500 uppercase flex items-center"><Repeat className="w-3 h-3 mr-1"/> Refills</span>
                   <span className="font-bold text-slate-900">{prescription.refills || 0}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100 flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-500 uppercase flex items-center"><Calendar className="w-3 h-3 mr-1"/> Follow-up</span>
                   <span className="font-bold text-slate-900">{prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString() : 'PRN'}</span>
              </div>
          </div>

          {/* Footer Info */}
          <div className="text-center sm:text-left pt-4 border-t border-slate-100">
             <p className="text-xs text-slate-400 font-mono">Digital Signature: {prescription.digitalSignatureToken}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0 rounded-b-xl">
           <div className="text-xs text-slate-500">
               Status: <span className="font-bold">{prescription.status === 'REJECTED_STOCK' ? 'OUT OF STOCK' : prescription.status}</span>
           </div>
           
           {isPharmacy && onDispense && (
                <div>
                    {prescription.status === 'SENT_TO_PHARMACY' ? (
                        <button 
                        onClick={() => { onDispense(prescription.id); onClose(); }}
                        className="bg-green-600 text-white px-6 py-2 rounded-md font-bold shadow hover:bg-green-700 transition-colors flex items-center"
                        >
                            <CheckCircle className="w-4 h-4 mr-2"/> Dispense Now
                        </button>
                    ) : (
                        <span className="inline-flex items-center px-4 py-2 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200 cursor-not-allowed">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-600"/> 
                            {prescription.status === 'DISPENSED' ? 'Already Dispensed' : 'Action Locked'}
                        </span>
                    )}
                </div>
           )}
        </div>
      </div>
    </div>
  );
};