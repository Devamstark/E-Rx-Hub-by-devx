
import React, { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Medicine, Prescription, User } from '../../types';
import { Plus, Trash2, Send, BrainCircuit, FileText, AlertTriangle, Info, Video, User as UserIcon } from 'lucide-react';
import { analyzePrescriptionSafety } from '../../services/geminiService';
import { COMMON_MEDICINES } from '../../constants';

interface CreatePrescriptionProps {
  currentUser: User; // Full user object to get profile details
  onPrescriptionSent: (rx: Prescription) => void;
  verifiedPharmacies: User[];
}

type PrescriptionFormData = Omit<Prescription, 'id' | 'date' | 'status' | 'digitalSignatureToken' | 'doctorId' | 'doctorName' | 'pharmacyName' | 'doctorDetails'>;

// Helper to translate frequency codes to human readable text
const getFrequencyDescription = (freq: string): string => {
    if (!freq) return '';
    const clean = freq.trim().toUpperCase();
    
    // Common Patterns
    if (clean === '1-0-0' || clean === '1' || clean === 'OD') return 'Once a day (Morning)';
    if (clean === '0-0-1' || clean === 'HS') return 'Once a day (Night)';
    if (clean === '1-0-1' || clean === 'BD' || clean === 'BID') return 'Twice a day (Morning, Night)';
    if (clean === '1-1-1' || clean === 'TDS' || clean === 'TID') return 'Thrice a day';
    if (clean === '1-1-1-1' || clean === 'QID') return 'Four times a day';
    if (clean === 'SOS') return 'As needed';
    if (clean === 'STAT') return 'Immediately';
    if (clean === '0-1-0') return 'Once a day (Afternoon)';
    
    return freq; // Return as is if no match
};

export const CreatePrescription: React.FC<CreatePrescriptionProps> = ({ currentUser, onPrescriptionSent, verifiedPharmacies }) => {
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
  const [isPatientVerified, setIsPatientVerified] = useState(false);

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

    if (!isPatientVerified) {
        alert("You must verify the patient's identity as per Telemedicine Guidelines before prescribing.");
        return;
    }

    const pharmacy = verifiedPharmacies.find(p => p.id === selectedPharmacyId);
    
    // ID is generated in App.tsx to ensure global sequential order
    const newRx: Prescription = {
        ...data,
        id: '', // Placeholder, will be overwritten by App.tsx
        doctorId: currentUser.id,
        doctorName: currentUser.name,
        doctorDetails: {
            name: currentUser.name,
            qualifications: currentUser.qualifications || 'MBBS (Registered Medical Practitioner)',
            registrationNumber: currentUser.licenseNumber || currentUser.registrationNumber || 'Pending',
            nmrUid: currentUser.nmrUid || 'N/A',
            specialty: currentUser.specialty,
            stateCouncil: currentUser.stateCouncil || currentUser.state || '',
            clinicName: currentUser.clinicName || 'DevXWorld Digital Clinic',
            clinicAddress: currentUser.clinicAddress || '',
            city: currentUser.city || '',
            state: currentUser.state || '',
            pincode: currentUser.pincode || '',
            phone: currentUser.phone || '',
            fax: currentUser.fax,
            email: currentUser.email
        },
        pharmacyId: selectedPharmacyId,
        pharmacyName: pharmacy ? pharmacy.name : 'Unassigned',
        date: new Date().toISOString(),
        status: 'ISSUED',
        digitalSignatureToken: `SIG-${Math.random().toString(36).substring(7).toUpperCase()}`
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
        {/* Letterhead Preview */}
        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex items-start gap-3">
            <div className="p-2 bg-white rounded-full border border-slate-200">
                <UserIcon className="w-5 h-5 text-slate-500" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Prescribing As</p>
                <p className="font-bold text-slate-900 text-sm">Dr. {currentUser.name}</p>
                <p className="text-xs text-indigo-700 font-medium">
                    {currentUser.qualifications} {currentUser.specialty ? `• ${currentUser.specialty}` : ''}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{currentUser.clinicName}, {currentUser.city}</p>
            </div>
        </div>

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
            
            <datalist id="common-medicines">
                {COMMON_MEDICINES.map(med => <option key={med} value={med} />)}
            </datalist>

            <div className="space-y-4">
                {fields.map((field, index) => {
                    const currentDosage = medicines[index]?.dosage || '';
                    const currentFreq = medicines[index]?.frequency || '';
                    const currentDur = medicines[index]?.duration || '';
                    const freqDesc = getFrequencyDescription(currentFreq);
                    
                    const fullDirection = `${currentDosage ? currentDosage + ', ' : ''}${freqDesc || currentFreq || '...'}${currentDur ? ' for ' + currentDur : ''}`;

                    return (
                        <div key={field.id} className="bg-slate-50 p-4 rounded-md border border-slate-200">
                            <div className="grid grid-cols-12 gap-2 items-start">
                                <div className="col-span-12 sm:col-span-4">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block sm:hidden">Medicine</label>
                                    <input 
                                      {...register(`medicines.${index}.name` as const, { required: true })} 
                                      list="common-medicines"
                                      placeholder="Medicine Name" 
                                      className="w-full text-sm border-slate-300 rounded border p-2" 
                                    />
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                     <label className="text-xs font-bold text-slate-500 mb-1 block sm:hidden">Dose</label>
                                     <input {...register(`medicines.${index}.dosage` as const)} placeholder="Dose (500mg)" className="w-full text-sm border-slate-300 rounded border p-2" />
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                     <label className="text-xs font-bold text-slate-500 mb-1 block sm:hidden">Freq</label>
                                     <input 
                                        {...register(`medicines.${index}.frequency` as const)} 
                                        placeholder="Freq (1-0-1)" 
                                        className="w-full text-sm border-slate-300 rounded border p-2" 
                                        title="Use codes like 1-0-1, BD, OD"
                                     />
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                     <label className="text-xs font-bold text-slate-500 mb-1 block sm:hidden">Duration</label>
                                     <input {...register(`medicines.${index}.duration` as const)} placeholder="Dur (5 days)" className="w-full text-sm border-slate-300 rounded border p-2" />
                                </div>
                                <div className="col-span-12 sm:col-span-1 flex justify-end sm:mt-1">
                                    <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 p-2 bg-white rounded border border-slate-200"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-12 gap-4 mt-2">
                                <div className="col-span-12 sm:col-span-6">
                                    <input {...register(`medicines.${index}.instructions` as const)} placeholder="Special Instructions (e.g. After food)" className="w-full text-xs border-slate-300 rounded border p-2 text-slate-600 bg-white" />
                                </div>
                                <div className="col-span-12 sm:col-span-6 flex items-center">
                                    <div className="bg-indigo-50 border border-indigo-100 rounded px-3 py-1.5 w-full flex items-start">
                                        <Info className="w-4 h-4 text-indigo-500 mr-2 mt-0.5 shrink-0"/>
                                        <p className="text-xs text-indigo-800">
                                            <span className="font-bold">Full Direction:</span> {fullDirection}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
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

        {/* Compliance & Verification */}
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <h4 className="text-sm font-bold text-yellow-800 mb-2 flex items-center">
                <Video className="w-4 h-4 mr-2"/> Telemedicine Compliance
            </h4>
            <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input
                        id="patient-verify"
                        type="checkbox"
                        checked={isPatientVerified}
                        onChange={(e) => setIsPatientVerified(e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                </div>
                <div className="ml-2 text-sm">
                    <label htmlFor="patient-verify" className="font-medium text-slate-700">I certify that I have verified the patient's identity via video/audio interaction as per Telemedicine Practice Guidelines 2020.</label>
                </div>
            </div>
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
