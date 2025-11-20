
import React, { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Medicine, Prescription, User } from '../../types';
import { Plus, Trash2, Send, BrainCircuit, FileText, AlertTriangle } from 'lucide-react';
import { analyzePrescriptionSafety } from '../../services/geminiService';

interface CreatePrescriptionProps {
  doctorId: string;
  doctorName: string;
  onPrescriptionSent: (rx: Prescription) => void;
  verifiedPharmacies: User[];
}

type PrescriptionFormData = Omit<Prescription, 'id' | 'date' | 'status' | 'digitalSignatureToken' | 'doctorId' | 'doctorName' | 'pharmacyName'>;

export const CreatePrescription: React.FC<CreatePrescriptionProps> = ({ doctorId, doctorName, onPrescriptionSent, verifiedPharmacies }) => {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<PrescriptionFormData>({
    defaultValues: {
      medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      patientGender: 'Male'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medicines'
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ safe: boolean; warnings: string[]; advice: string } | null>(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');

  const diagnosis = watch('diagnosis');
  const medicines = watch('medicines');

  const handleAnalyze = async () => {
    if (!diagnosis || medicines.length === 0) return;
    setAnalyzing(true);
    const result = await analyzePrescriptionSafety(diagnosis, medicines);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  const onSubmit = (data: PrescriptionFormData) => {
    if (!selectedPharmacyId) {
        alert("Please select a pharmacy to send the prescription to.");
        return;
    }

    const pharmacy = verifiedPharmacies.find(p => p.id === selectedPharmacyId);
    
    const newRx: Prescription = {
        ...data,
        id: `RX-${Date.now()}`,
        doctorId,
        doctorName,
        pharmacyId: selectedPharmacyId,
        pharmacyName: pharmacy ? pharmacy.name : 'Unassigned',
        date: new Date().toISOString(),
        status: 'ISSUED',
        digitalSignatureToken: `SIG-${Math.random().toString(36).substring(7)}`
    };

    onPrescriptionSent(newRx);
    alert("Prescription Signed & Encrypted. Sent to Pharmacy.");
  };

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <FileText className="mr-2 text-indigo-600"/> New e-Prescription
        </h2>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">Telemedicine Compliant</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Patient Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Patient Name</label>
            <input {...register('patientName', { required: true })} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2" />
            {errors.patientName && <span className="text-xs text-red-500">Required</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Age</label>
            <input type="number" {...register('patientAge', { required: true, min: 0 })} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Gender</label>
            <select {...register('patientGender')} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Diagnosis & AI */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Diagnosis / Symptoms</label>
          <textarea {...register('diagnosis', { required: true })} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2" rows={2} placeholder="e.g. Acute Bronchitis, dry cough"></textarea>
        </div>

        {/* Medicines */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">Medication (Rx)</label>
                <button type="button" onClick={() => append({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                    <Plus className="w-4 h-4 mr-1"/> Add Drug
                </button>
            </div>
            
            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-slate-50 p-3 rounded-md border border-slate-200">
                        <div className="col-span-4">
                            <input {...register(`medicines.${index}.name` as const, { required: true })} placeholder="Medicine Name" className="w-full text-sm border-slate-300 rounded border p-1.5" />
                        </div>
                        <div className="col-span-2">
                             <input {...register(`medicines.${index}.dosage` as const)} placeholder="Dose (500mg)" className="w-full text-sm border-slate-300 rounded border p-1.5" />
                        </div>
                        <div className="col-span-2">
                             <input {...register(`medicines.${index}.frequency` as const)} placeholder="Freq (1-0-1)" className="w-full text-sm border-slate-300 rounded border p-1.5" />
                        </div>
                        <div className="col-span-3">
                             <input {...register(`medicines.${index}.duration` as const)} placeholder="Dur (5 days)" className="w-full text-sm border-slate-300 rounded border p-1.5" />
                        </div>
                        <div className="col-span-1 flex justify-end">
                            <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 p-1.5"><Trash2 className="w-4 h-4"/></button>
                        </div>
                        <div className="col-span-12 mt-1">
                            <input {...register(`medicines.${index}.instructions` as const)} placeholder="Special Instructions (e.g. After food)" className="w-full text-xs border-slate-300 rounded border p-1.5 text-slate-600 bg-white" />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* AI Action */}
        <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-md border border-indigo-100">
            <div className="flex items-center text-indigo-800">
                <BrainCircuit className="w-5 h-5 mr-2"/>
                <span className="font-medium text-sm">AI Clinical Assistant</span>
            </div>
            <button 
                type="button" 
                onClick={handleAnalyze}
                disabled={analyzing || !diagnosis}
                className="text-sm bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded shadow-sm hover:bg-indigo-50 disabled:opacity-50"
            >
                {analyzing ? 'Analyzing...' : 'Check Interactions'}
            </button>
        </div>

        {aiAnalysis && (
            <div className={`p-4 rounded-md border ${aiAnalysis.safe ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start">
                    {aiAnalysis.safe ? <FileText className="w-5 h-5 text-green-600 mr-2 mt-0.5"/> : <AlertTriangle className="w-5 h-5 text-amber-600 mr-2 mt-0.5"/>}
                    <div>
                        <h4 className={`text-sm font-bold ${aiAnalysis.safe ? 'text-green-800' : 'text-amber-800'}`}>
                            {aiAnalysis.safe ? 'No Major Interactions Detected' : 'Potential Issues Detected'}
                        </h4>
                        {aiAnalysis.warnings.length > 0 && (
                            <ul className="mt-1 list-disc list-inside text-xs text-slate-700">
                                {aiAnalysis.warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        )}
                        {aiAnalysis.advice && (
                            <p className="mt-2 text-xs text-slate-600 italic"><strong>Advice:</strong> {aiAnalysis.advice}</p>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div>
            <label className="block text-sm font-medium text-slate-700">Additional Advice</label>
            <textarea {...register('advice')} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2" rows={2}></textarea>
        </div>

        {/* Pharmacy Selection */}
        <div>
            <label className="block text-sm font-medium text-slate-700">Select Pharmacy (Verified)</label>
            {verifiedPharmacies.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded text-sm mt-1">
                    No verified pharmacies found. Please contact Admin to onboard pharmacies.
                </div>
            ) : (
                <select 
                    value={selectedPharmacyId} 
                    onChange={(e) => setSelectedPharmacyId(e.target.value)}
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2"
                    required
                >
                    <option value="">-- Choose Pharmacy --</option>
                    {verifiedPharmacies.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.state})</option>
                    ))}
                </select>
            )}
        </div>

        <div className="pt-4 border-t border-slate-200">
            <button type="submit" className="w-full flex justify-center items-center bg-indigo-700 text-white py-3 rounded-md hover:bg-indigo-800 font-bold shadow-lg transition-all transform hover:scale-[1.01]">
                <Send className="w-5 h-5 mr-2" /> E-Sign & Send Prescription
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">Digitally Signed & Encrypted according to IT Act 2000</p>
        </div>
      </form>
    </div>
  );
};
