
import React from 'react';
import { Prescription } from '../../types';
import { X, Printer, CheckCircle, FileText, ClipboardList, Share2 } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import { PrintLayout } from '../ui/PrintLayout';

interface PrescriptionModalProps {
  prescription: Prescription;
  onClose: () => void;
  onDispense?: (id: string) => void;
  isPharmacy?: boolean;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ 
  prescription, 
  onClose, 
  onDispense, 
  isPharmacy = false 
}) => {

  // Use snapshot details if available, else fallback to legacy/simple data
  const docName = prescription.doctorDetails?.name || prescription.doctorName;
  const docQual = prescription.doctorDetails?.qualifications || 'Registered Medical Practitioner';
  const docSpecialty = prescription.doctorDetails?.specialty;
  const clinicName = prescription.doctorDetails?.clinicName || 'DevXWorld Network';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const content = ReactDOMServer.renderToString(<PrintLayout rx={prescription} />);
      
      // Set title for print header/footer
      const printTitle = `Sent by DevXWorld - ${prescription.id}`;

      printWindow.document.write(`
        <html>
          <head>
            <title>${printTitle}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact; }
                @page { margin: 10mm; size: A4; }
              }
              .font-script { font-family: 'Dancing Script', cursive; }
            </style>
          </head>
          <body class="bg-white">
            ${content}
            <script>
              window.onload = () => { window.print(); window.close(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleShare = () => {
    const text = `*${clinicName}*
Dr. ${docName} (${docQual}${docSpecialty ? ' - ' + docSpecialty : ''})

*Rx for:* ${prescription.patientName} (${prescription.patientAge}Y)
*Diagnosis:* ${prescription.diagnosis}

*Medicines:*
${prescription.medicines.map(m => `- ${m.name} (${m.dosage}) | ${m.frequency}`).join('\n')}

*Link:* https://devxworld.erx/track/${prescription.id}
    `.trim();

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

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
                <Share2 className="w-4 h-4 mr-2" /> WhatsApp
            </button>
            <button 
                onClick={handlePrint}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
                title="Print PDF"
            >
                <Printer className="w-4 h-4 mr-2" /> Print
            </button>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto grow">
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
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
              Diagnosis / Clinical Notes
            </h4>
            <div className="p-3 bg-white border border-slate-200 rounded text-slate-700 text-sm">
              {prescription.diagnosis}
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
          
          {/* Advice */}
          {prescription.advice && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-xs font-bold text-blue-800 uppercase mb-1">Additional Advice</h4>
              <p className="text-sm text-blue-900">{prescription.advice}</p>
            </div>
          )}

          {/* Footer Info */}
          <div className="text-center sm:text-left pt-4 border-t border-slate-100">
             <p className="text-xs text-slate-400 font-mono">Digital Signature: {prescription.digitalSignatureToken}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0 rounded-b-xl">
           <div className="text-xs text-slate-500">
               Status: <span className="font-bold">{prescription.status}</span>
           </div>
           
           {isPharmacy && onDispense && (
                <div>
                    {prescription.status === 'ISSUED' ? (
                        <button 
                        onClick={() => { onDispense(prescription.id); onClose(); }}
                        className="bg-green-600 text-white px-6 py-2 rounded-md font-bold shadow hover:bg-green-700 transition-colors flex items-center"
                        >
                            <CheckCircle className="w-4 h-4 mr-2"/> Dispense Now
                        </button>
                    ) : (
                        <span className="inline-flex items-center px-4 py-2 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200 cursor-not-allowed">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-600"/> Already Dispensed
                        </span>
                    )}
                </div>
           )}
        </div>
      </div>
    </div>
  );
};
