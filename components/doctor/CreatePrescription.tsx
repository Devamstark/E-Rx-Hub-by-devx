
import React, { useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Medicine, Prescription, User, Patient } from '../../types';
import { Plus, Trash2, Send, BrainCircuit, FileText, AlertTriangle, Info, Video, User as UserIcon, Search, Check, Link2, UserPlus, ChevronDown, ChevronUp, Clock, RotateCcw } from 'lucide-react';
import { analyzePrescriptionSafety } from '../../services/geminiService';
import { COMMON_MEDICINES, RESTRICTED_DRUGS } from '../../constants';

interface CreatePrescriptionProps {
  currentUser: User;
  onPrescriptionSent: (rx: Prescription) => void;
  verifiedPharmacies: User[];
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  prescriptionHistory: Prescription[]; // New Prop for History Lookup
}

type PrescriptionFormData = Omit<Prescription, 'id' | 'date' | 'status' | 'digitalSignatureToken' | 'doctorId' | 'doctorName' | 'pharmacyName' | 'doctorDetails' | 'patientId'>;

const getFrequencyDescription = (freq: string): string => {
    if (!freq) return '';
    const clean = freq.trim().toUpperCase();
    if (clean === '1-0-0' || clean === '1' || clean === 'OD') return 'Once a day (Morning)';
    if (clean === '0-0-1' || clean === 'HS') return 'Once a day (Night)';
    if (clean === '1-0-1' || clean === 'BD' || clean === 'BID') return 'Twice a day (Morning, Night)';
    if (clean === '1-1-1' || clean === 'TDS' || clean === 'TID') return 'Thrice a day';
    if (clean === '1-1-1-1' || clean === 'QID') return 'Four times a day';
    if (clean === 'SOS') return 'As needed';
    if (clean === 'STAT') return 'Immediately';
    if (clean === '0-1-0') return 'Once a day (Afternoon)';
    return freq;
};

export const CreatePrescription: React.FC<CreatePrescriptionProps> = ({ 
    currentUser, 
    onPrescriptionSent, 
    verifiedPharmacies, 
    patients, 
    onAddPatient,
    prescriptionHistory
}) => {
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<PrescriptionFormData>({
    defaultValues: {
      medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      patientGender: 'Male'
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'medicines'
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ safe: boolean; warnings: string[]; advice: string } | null>(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [isPatientVerified, setIsPatientVerified] = useState(false);
  
  // Patient Management State
  const [patientMode, setPatientMode] = useState<'SEARCH' | 'CREATE'>('SEARCH');
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // History Lookup State
  const [historySearch, setHistorySearch] = useState('');
  const [showHistoryResults, setShowHistoryResults] = useState(false);

  // Filtered Autocomplete List
  const safeMedicineList = COMMON_MEDICINES.filter(med => !RESTRICTED_DRUGS.some(restricted => med.toLowerCase().includes(restricted.toLowerCase())));

  // New Patient State
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
      fullName: '', phone: '', dateOfBirth: '', gender: 'Male', address: '', allergies: [], chronicConditions: []
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const diagnosis = watch('diagnosis');
  const medicines = watch('medicines');
  
  const myPatients = patients.filter(p => p.doctorId === currentUser.id);
  const patientResults = myPatients.filter(p => p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) || p.phone.includes(patientSearch));

  // Filter Rx History for Lookup
  const filteredHistory = prescriptionHistory
    .filter(rx => rx.patientName.toLowerCase().includes(historySearch.toLowerCase()))
    .slice(0, 5);

  // Auto-calculate age when New Patient DOB changes
  useEffect(() => {
      if (patientMode === 'CREATE' && newPatient.dateOfBirth) {
          const birthDate = new Date(newPatient.dateOfBirth);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          setValue('patientAge', age > 0 ? age : 0);
          setValue('patientName', newPatient.fullName || '');
          setValue('patientGender', newPatient.gender as any);
      }
  }, [newPatient.dateOfBirth, newPatient.fullName, newPatient.gender, patientMode, setValue]);

  const handleSelectPatient = (patient: Patient) => {
      setValue('patientName', patient.fullName);
      setValue('patientGender', patient.gender);
      
      const birthDate = new Date(patient.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      setValue('patientAge', age);

      setSelectedPatient(patient);
      setPatientSearch('');
      setShowPatientResults(false);
  };

  const handleCopyFromHistory = (rx: Prescription) => {
      setValue('diagnosis', rx.diagnosis);
      replace(rx.medicines);
      setValue('advice', rx.advice);
      setHistorySearch('');
      setShowHistoryResults(false);
      alert(`Copied Rx details from ${rx.patientName}'s record dated ${new Date(rx.date).toLocaleDateString()}`);
  };

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

    let finalPatientId = selectedPatient?.id;
    let finalPatientName = data.patientName;

    // 1. Handle New Patient Creation if in CREATE mode
    if (patientMode === 'CREATE') {
        if (!newPatient.fullName || !newPatient.phone || !newPatient.dateOfBirth) {
            alert("Please complete the New Patient details (Name, Phone, DOB).");
            return;
        }
        
        const createdPatient: Patient = {
            id: `PAT-${Date.now()}`,
            doctorId: currentUser.id,
            fullName: newPatient.fullName,
            phone: newPatient.phone,
            dateOfBirth: newPatient.dateOfBirth,
            gender: newPatient.gender as 'Male' | 'Female' | 'Other',
            address: newPatient.address || '',
            bloodGroup: '',
            height: '',
            weight: '',
            allergies: newPatient.allergies || [],
            chronicConditions: newPatient.chronicConditions || [],
            registeredAt: new Date().toISOString()
        };

        // Save new patient to global state
        onAddPatient(createdPatient);
        finalPatientId = createdPatient.id;
        finalPatientName = createdPatient.fullName;
    } else if (!selectedPatient) {
        alert("Please select an existing patient or create a new one.");
        return;
    }

    // 2. Create Prescription Linked to Patient ID
    const pharmacy = verifiedPharmacies.find(p => p.id === selectedPharmacyId);
    const newRx: Prescription = {
        ...data,
        id: '', // Handled by App.tsx
        doctorId: currentUser.id,
        patientId: finalPatientId, // CRITICAL: Linking Rx to Patient
        patientName: finalPatientName, // Redundant but good for display
        doctorName: currentUser.name,
        doctorDetails: {
            name: currentUser.name,
            qualifications: currentUser.qualifications || 'MBBS (RMP)',
            registrationNumber: currentUser.licenseNumber || 'Pending',
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
    alert("Prescription Signed & Linked to Patient Profile.");
  };

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <FileText className="mr-2 text-indigo-600"/> New e-Prescription
        </h2>
        
        <div className="flex items-center gap-3">
            {/* History Lookup Button/Input */}
            <div className="relative">
                <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-md px-3 py-1.5">
                    <RotateCcw className="w-4 h-4 text-indigo-600 mr-2"/>
                    <input 
                        type="text"
                        placeholder="Copy from Past Rx..."
                        className="bg-transparent border-none text-xs focus:outline-none w-32 text-indigo-800 placeholder-indigo-400"
                        value={historySearch}
                        onChange={(e) => { setHistorySearch(e.target.value); setShowHistoryResults(true); }}
                        onFocus={() => setShowHistoryResults(true)}
                    />
                </div>
                {showHistoryResults && historySearch && (
                    <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-slate-200 rounded-md shadow-xl z-30">
                        <div className="p-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">Select to Autofill</div>
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map(rx => (
                                <button
                                    key={rx.id}
                                    type="button"
                                    onClick={() => handleCopyFromHistory(rx)}
                                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-sm border-b border-slate-50 last:border-0"
                                >
                                    <div className="font-bold text-slate-800">{rx.patientName}</div>
                                    <div className="text-xs text-slate-500 flex justify-between mt-1">
                                        <span>{new Date(rx.date).toLocaleDateString()}</span>
                                        <span className="text-indigo-600">{rx.diagnosis}</span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-xs text-slate-400 italic">No matching history found.</div>
                        )}
                    </div>
                )}
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">Telemedicine Compliant</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Letterhead Preview */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-start gap-3">
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

        {/* PATIENT SELECTION SECTION */}
        <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-sm">
             <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                <label className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center">
                    1. Select Patient
                    {selectedPatient && patientMode === 'SEARCH' && (
                        <span className="ml-3 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full border border-green-200 flex items-center font-bold">
                            <Link2 className="w-3 h-3 mr-1"/> Linked to ID: {selectedPatient.id}
                        </span>
                    )}
                </label>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button 
                        type="button"
                        onClick={() => { setPatientMode('SEARCH'); setSelectedPatient(null); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${patientMode === 'SEARCH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Search className="w-3 h-3 mr-1"/> Use Existing
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setPatientMode('CREATE'); setSelectedPatient(null); setValue('patientName', ''); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${patientMode === 'CREATE' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserPlus className="w-3 h-3 mr-1"/> Create New
                    </button>
                </div>
             </div>

             {patientMode === 'SEARCH' ? (
                 <div className="relative mb-4">
                    {!selectedPatient ? (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400"/>
                            </div>
                            <input 
                                type="text"
                                className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Search your patient list..."
                                value={patientSearch}
                                onChange={e => { setPatientSearch(e.target.value); setShowPatientResults(true); }}
                                onFocus={() => setShowPatientResults(true)}
                            />
                            {showPatientResults && patientSearch && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                    {patientResults.length > 0 ? (
                                        patientResults.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleSelectPatient(p)}
                                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-sm border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-800 group-hover:text-indigo-700 block">{p.fullName}</span>
                                                    <span className="text-xs text-slate-500">{p.gender}, {new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()} Yrs</span>
                                                </div>
                                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded group-hover:bg-white">{p.phone}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-slate-500 italic">No patients found. Switch to "Create New".</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-md">
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold mr-3">
                                    {selectedPatient.fullName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{selectedPatient.fullName}</p>
                                    <p className="text-xs text-slate-500">{selectedPatient.gender}, {selectedPatient.phone}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => { setSelectedPatient(null); setValue('patientName', ''); }} className="text-xs text-red-600 hover:underline font-medium">Change</button>
                        </div>
                    )}
                 </div>
             ) : (
                 /* CREATE NEW PATIENT FORM */
                 <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-4 animate-in fade-in">
                     <h4 className="text-xs font-bold text-teal-700 uppercase mb-3">New Patient Profile</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                         <input 
                            className="border p-2 rounded text-sm" 
                            placeholder="Full Name *" 
                            value={newPatient.fullName} 
                            onChange={e => setNewPatient({...newPatient, fullName: e.target.value})}
                         />
                         <input 
                            className="border p-2 rounded text-sm" 
                            placeholder="Phone Number *" 
                            value={newPatient.phone} 
                            onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
                         />
                         <input 
                            type="date"
                            className="border p-2 rounded text-sm" 
                            value={newPatient.dateOfBirth} 
                            onChange={e => setNewPatient({...newPatient, dateOfBirth: e.target.value})}
                         />
                         <select 
                            className="border p-2 rounded text-sm bg-white"
                            value={newPatient.gender}
                            onChange={e => setNewPatient({...newPatient, gender: e.target.value as any})}
                         >
                             <option value="Male">Male</option>
                             <option value="Female">Female</option>
                             <option value="Other">Other</option>
                         </select>
                         <input 
                            className="border p-2 rounded text-sm sm:col-span-2" 
                            placeholder="Address (Optional)" 
                            value={newPatient.address} 
                            onChange={e => setNewPatient({...newPatient, address: e.target.value})}
                         />
                     </div>
                     
                     {/* Quick Medical History for New Patient */}
                     <div className="border-t border-slate-200 pt-3">
                         <p className="text-xs font-bold text-slate-500 mb-2">Quick Medical History (Optional)</p>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                 <div className="flex gap-2 mb-2">
                                     <input className="border p-1.5 rounded text-xs flex-1" placeholder="Add Allergy" value={newAllergy} onChange={e => setNewAllergy(e.target.value)}/>
                                     <button type="button" onClick={() => { if(newAllergy) { setNewPatient(p => ({...p, allergies: [...(p.allergies||[]), newAllergy]})); setNewAllergy(''); }}} className="bg-slate-200 px-2 rounded text-xs font-bold">+</button>
                                 </div>
                                 <div className="flex flex-wrap gap-1">
                                     {newPatient.allergies?.map(a => <span key={a} className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded">{a}</span>)}
                                 </div>
                             </div>
                             <div>
                                 <div className="flex gap-2 mb-2">
                                     <input className="border p-1.5 rounded text-xs flex-1" placeholder="Add Condition" value={newCondition} onChange={e => setNewCondition(e.target.value)}/>
                                     <button type="button" onClick={() => { if(newCondition) { setNewPatient(p => ({...p, chronicConditions: [...(p.chronicConditions||[]), newCondition]})); setNewCondition(''); }}} className="bg-slate-200 px-2 rounded text-xs font-bold">+</button>
                                 </div>
                                 <div className="flex flex-wrap gap-1">
                                     {newPatient.chronicConditions?.map(c => <span key={c} className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded">{c}</span>)}
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             )}

             {/* Auto-filled Readonly Fields for Rx */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3 rounded border border-slate-100">
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Rx Patient Name</label>
                    <input {...register('patientName', { required: true })} className="block w-full border-slate-200 rounded-md p-2 text-sm bg-white text-slate-700 font-medium" readOnly />
                    {errors.patientName && <span className="text-xs text-red-500">Required</span>}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Calculated Age</label>
                    <input type="number" {...register('patientAge', { required: true, min: 0 })} className="block w-full border-slate-200 rounded-md p-2 text-sm bg-white text-slate-700" readOnly />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Gender</label>
                    <select {...register('patientGender')} className="block w-full border-slate-200 rounded-md p-2 text-sm bg-white text-slate-700 disabled:opacity-100" disabled={true}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Diagnosis & AI */}
        <div>
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">2. Diagnosis / Symptoms</label>
          <textarea {...register('diagnosis', { required: true })} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-sm" rows={2} placeholder="e.g. Acute Bronchitis, dry cough"></textarea>
        </div>

        {/* Medicines */}
        <div>
            <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">3. Medication (Rx)</label>
                <button type="button" onClick={() => append({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })} className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md font-medium flex items-center shadow-sm">
                    <Plus className="w-4 h-4 mr-1"/> Add Drug
                </button>
            </div>
            
            <datalist id="common-medicines">
                {safeMedicineList.map(med => <option key={med} value={med} />)}
            </datalist>

            <div className="space-y-4">
                {fields.map((field, index) => {
                    const currentDosage = medicines[index]?.dosage || '';
                    const currentFreq = medicines[index]?.frequency || '';
                    const currentDur = medicines[index]?.duration || '';
                    const freqDesc = getFrequencyDescription(currentFreq);
                    
                    const fullDirection = `${currentDosage ? currentDosage + ', ' : ''}${freqDesc || currentFreq || '...'}${currentDur ? ' for ' + currentDur : ''}`;

                    return (
                        <div key={field.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-12 gap-3 items-start">
                                <div className="col-span-12 sm:col-span-4">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Medicine Name</label>
                                    <input 
                                      {...register(`medicines.${index}.name` as const, { required: true })} 
                                      list="common-medicines"
                                      placeholder="Type or select..." 
                                      className="w-full text-sm border-slate-300 rounded border p-2 font-medium" 
                                    />
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                     <label className="text-xs font-bold text-slate-500 mb-1 block">Dose</label>
                                     <input {...register(`medicines.${index}.dosage` as const)} placeholder="500mg" className="w-full text-sm border-slate-300 rounded border p-2" />
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                     <label className="text-xs font-bold text-slate-500 mb-1 block">Freq (1-0-1)</label>
                                     <input 
                                        {...register(`medicines.${index}.frequency` as const)} 
                                        placeholder="BD / OD" 
                                        className="w-full text-sm border-slate-300 rounded border p-2" 
                                        title="Use codes like 1-0-1, BD, OD"
                                     />
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                     <label className="text-xs font-bold text-slate-500 mb-1 block">Duration</label>
                                     <input {...register(`medicines.${index}.duration` as const)} placeholder="5 days" className="w-full text-sm border-slate-300 rounded border p-2" />
                                </div>
                                <div className="col-span-12 sm:col-span-1 flex justify-end mt-6">
                                    <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 p-2 bg-white rounded border border-slate-200 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-12 gap-4 mt-3">
                                <div className="col-span-12 sm:col-span-6">
                                    <input {...register(`medicines.${index}.instructions` as const)} placeholder="Special Instructions (e.g. After food)" className="w-full text-xs border-slate-300 rounded border p-2 text-slate-600 bg-white" />
                                </div>
                                <div className="col-span-12 sm:col-span-6 flex items-center">
                                    <div className="bg-indigo-50 border border-indigo-100 rounded px-3 py-1.5 w-full flex items-start">
                                        <Info className="w-4 h-4 text-indigo-500 mr-2 mt-0.5 shrink-0"/>
                                        <p className="text-xs text-indigo-800 truncate">
                                            <span className="font-bold">Direction:</span> {fullDirection}
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
                className="text-sm bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded shadow-sm hover:bg-indigo-50 disabled:opacity-50 font-bold"
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
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">4. Additional Advice</label>
            <textarea {...register('advice')} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-sm" rows={2}></textarea>
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
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">5. Select Pharmacy (Verified)</label>
            {verifiedPharmacies.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded text-sm mt-1">
                    No verified pharmacies found. Please contact Admin to onboard pharmacies.
                </div>
            ) : (
                <select 
                    value={selectedPharmacyId} 
                    onChange={(e) => setSelectedPharmacyId(e.target.value)}
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-sm font-medium"
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
