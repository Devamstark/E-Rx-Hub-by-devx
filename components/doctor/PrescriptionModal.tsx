
import React from 'react';
import { Prescription, Patient } from '../../types';
import { X, Printer, Share2, FileText, User, MapPin, Phone, AlertTriangle } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import { PrintLayout } from '../ui/PrintLayout';

// Helper for frequency in view
const getFrequencyInWords = (freq: string): string => {
    if (!freq) return '';
    const f = freq.toUpperCase().trim();
    if (f === '1-0-0' || f === 'OD') return 'Once daily (Morning)';
    if (f === '0-1-0') return 'Once daily (Afternoon)';
    if (f === '0-0-1' || f === 'HS') return 'Once daily (Night)';
    if (f === '1-0-1' || f === 'BD' || f === 'BID') return 'Twice daily';
    if (f === '1-1-1' || f === 'TDS' || f === 'TID') return 'Thrice daily';
    return freq;
};

interface PrescriptionModalProps {
  prescription: Prescription;
  patientProfile?: Patient | null;
  onClose: () => void;
  onDispense?: (id: string) => void;
  isPharmacy?: boolean;
  customAction?: React.ReactNode;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ 
  prescription, 
  patientProfile,
  onClose, 
  customAction
}) => {

  const doc = prescription.doctorDetails || {
      name: prescription.doctorName,
      qualifications: 'Registered Medical Practitioner',
      registrationNumber: 'N/A',
      clinicName: 'DevXWorld Network',
      clinicAddress: '',
      phone: '',
      email: '',
      specialty: '',
      city: '',
      state: '',
      pincode: ''
  };

  const pat = prescription.patientDetails || {
      name: prescription.patientName,
      age: prescription.patientAge,
      gender: prescription.patientGender,
      address: patientProfile?.address || '',
      phone: patientProfile?.phone || '',
      allergies: patientProfile?.allergies || []
  };

  // This ensures the PRINT button still generates the STRICT LEGAL LAYOUT
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const content = ReactDOMServer.renderToString(<PrintLayout rx={prescription} />);
      printWindow.document.write(`
        <html>
          <head>
            <title>Rx-${prescription.id}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
            <style>
              @media print { body { -webkit-print-color-adjust: exact; } @page { margin: 0; } }
              .font-script { font-family: 'Dancing Script', cursive; }
            </style>
          </head>
          <body class="bg-white">${content}<script>window.onload = () => { window.print(); window.close(); };</script></body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleWhatsAppShare = () => {
      const message = `*Digital Prescription from Dr. ${doc.name}*\n\n*Rx ID:* ${prescription.id}\n*Patient:* ${pat.name}\n\n*Medicines:*\n${prescription.medicines.map(m => `- ${m.name} (${m.dosage}): ${m.instructions}`).join('\n')}\n\n*Notes:* ${prescription.advice || 'None'}\n\n_Generated via DevXWorld e-Rx_`;
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header - Dark Blue Modern Look */}
        <div className="bg-[#312e81] px-6 py-4 flex justify-between items-center shrink-0">
          <div>
              <h3 className="text-white font-bold text-lg flex items-center"><FileText className="mr-2 h-5 w-5"/> Digital Prescription</h3>
              <p className="text-indigo-200 text-xs font-mono mt-0.5">{prescription.id}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleWhatsAppShare} className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-600 transition-colors flex items-center shadow-sm">
                <Share2 className="w-4 h-4 mr-2"/> WhatsApp
            </button>
            <button onClick={handlePrint} className="bg-white/10 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-white/20 transition-colors flex items-center">
                <Printer className="w-4 h-4 mr-2"/> Print
            </button>
            <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors text-white">
                <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Content - Modern Card Layout */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
            
            {/* Doctor & Patient Cards */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Doctor */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Prescribed By</p>
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {doc.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900">Dr. {doc.name}</h4>
                                <p className="text-sm font-medium text-indigo-600">{doc.qualifications}</p>
                                <p className="text-xs text-slate-500 mt-1">{doc.clinicName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Patient */}
                    <div className="md:text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Patient Details</p>
                        <h4 className="text-lg font-bold text-slate-900">{pat.name}</h4>
                        <p className="text-sm text-slate-600">{pat.age} Years, {pat.gender}</p>
                        {pat.phone && <p className="text-xs text-slate-500 mt-1 flex items-center justify-end"><Phone className="w-3 h-3 mr-1"/> {pat.phone}</p>}
                        {pat.address && <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-end"><MapPin className="w-3 h-3 mr-1"/> {pat.address}</p>}
                        
                        {pat.allergies && pat.allergies.length > 0 && (
                            <div className="mt-2 flex justify-end">
                                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1"/> Known Allergies: {pat.allergies.join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Diagnosis */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-800 mb-2">Diagnosis / Clinical Notes</h4>
                <div className="bg-white border border-slate-200 p-4 rounded-md text-sm text-slate-700 shadow-sm">
                    {prescription.diagnosis || 'No diagnosis recorded.'}
                </div>
            </div>

            {/* Medicines */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center"><FileText className="w-4 h-4 mr-2 text-indigo-600"/> Medication Details</h4>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4 font-bold">Medicine Name</th>
                                <th className="py-3 px-4 font-bold">Dosage</th>
                                <th className="py-3 px-4 font-bold">Frequency</th>
                                <th className="py-3 px-4 font-bold">Duration</th>
                                <th className="py-3 px-4 font-bold">Instructions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {prescription.medicines.map((m, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 font-bold text-slate-800">
                                        {m.name}
                                        {m.strength && <span className="text-slate-500 font-normal text-xs ml-1">({m.strength})</span>}
                                    </td>
                                    <td className="py-3 px-4 text-slate-600">{m.dosage}</td>
                                    <td className="py-3 px-4 text-slate-600">{m.frequency}</td>
                                    <td className="py-3 px-4 text-slate-600">{m.duration}</td>
                                    <td className="py-3 px-4 text-slate-500 italic">{m.instructions || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes */}
            {prescription.advice && (
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-800 mb-2">Notes / Remarks</h4>
                    <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md text-sm text-yellow-900">
                        {prescription.advice}
                    </div>
                </div>
            )}

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="font-mono text-xs text-slate-400 mb-1">Digital Signature: {prescription.digitalSignatureToken}</p>
                <p className="text-[10px] text-slate-400">Generated via DevXWorld e-Rx • Compliant with IT Act 2000</p>
            </div>
        </div>

        {/* Status Bar / Actions */}
        <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center">
                <span className="text-xs font-bold text-slate-500 mr-2">Status:</span>
                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                    prescription.status === 'ISSUED' ? 'bg-blue-100 text-blue-700' :
                    prescription.status === 'DISPENSED' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                }`}>
                    {prescription.status}
                </span>
            </div>
            {customAction}
        </div>
      </div>
    </div>
  );
};
