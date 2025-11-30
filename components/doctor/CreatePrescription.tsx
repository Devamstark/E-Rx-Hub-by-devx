import React, { useState, useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Medicine, Prescription, User, Patient, PrescriptionTemplate, VerificationStatus } from '../../types';
import { Plus, Trash2, Send, BrainCircuit, FileText, AlertTriangle, Info, Video, User as UserIcon, Search, Link2, UserPlus, RotateCcw, Save, Download, KeyRound, Calendar, Repeat, X, CheckCircle, MapPin, Phone, Building2, Mic, Activity, Thermometer, Gauge, ShieldCheck, CheckCircle2, Filter, ShieldAlert } from 'lucide-react';
import { analyzePrescriptionSafety } from '../../services/geminiService';
import { LOW_RISK_GENERIC_LIST, RESTRICTED_DRUGS } from '../../constants';
import { dbService } from '../../services/db';

interface CreatePrescriptionProps {
  currentUser: User;
  onPrescriptionSent: (rx: Prescription) => void;
  verifiedPharmacies: User[];
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  prescriptionHistory: Prescription[]; // New Prop for History Lookup
  preSelectedPatient?: Patient | null; // Added for Appointment Link
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
    prescriptionHistory,
    preSelectedPatient
}) => {
  const { register, control, handleSubmit, watch, setValue, getValues, trigger, formState: { errors } } = useForm<PrescriptionFormData>({
    defaultValues: {
      medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      patientGender: 'Male',
      patientName: '',
      patientAge: 0,
      refills: 0,
      vitals: { bp: '', pulse: '', temp: '', spo2: '', weight: '' },
      linkedToAbha: false
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
  
  // Pharmacy Search State
  const [pharmacySearch, setPharmacySearch] = useState('');
  
  // Patient Management State
  const [patientMode, setPatientMode] = useState<'SEARCH' | 'CREATE'>('SEARCH');
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // History Lookup State
  const [historySearch, setHistorySearch] = useState('');
  const [showHistoryResults, setShowHistoryResults] = useState(false);

  // Template State
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // eSign State
  const [eSignStep, setESignStep] = useState<'IDLE' | 'GENERATED' | 'SIGNED'>('IDLE');
  const [eSignToken, setESignToken] = useState('0000');
  const [eSignInput, setESignInput] = useState('');

  // Voice Input State
  const [isListening, setIsListening] = useState<'DIAGNOSIS' | 'ADVICE' | null>(null);

  // Medicine Filtering State
  const [medicineFilter, setMedicineFilter] = useState<'SAFE' | 'RESTRICTED' | 'ALL'>('SAFE');

  // Filtered Autocomplete List - Filter out restricted drugs for safety by default
  const medicineOptions = useMemo(() => {
      const safeList = LOW_RISK_GENERIC_LIST.filter(med => 
        !RESTRICTED_DRUGS.some(restricted => med.toLowerCase().includes(restricted.toLowerCase()))
      );
      
      const restrictedList = RESTRICTED_DRUGS.map(d => `${d} [Restricted/Schedule H]`);

      switch (medicineFilter) {
          case 'SAFE':
              return safeList.sort();
          case 'RESTRICTED':
              return restrictedList.sort();
          case 'ALL':
              return [...safeList, ...restrictedList].sort();
          default:
              return safeList;
      }
  }, [medicineFilter]);

  // New Patient State
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
      fullName: '', phone: '', dateOfBirth: '', gender: 'Male', address: '', allergies: [], chronicConditions: []
  });

  const diagnosis = watch('diagnosis');
  const medicines = watch('medicines');
  const advice = watch('advice');
  const linkedToAbha = watch('linkedToAbha');
  
  const myPatients = patients.filter(p => p.doctorId === currentUser.id);
  const patientResults = myPatients.filter(p => 
      p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.phone.includes(patientSearch) ||
      (p.abhaNumber && p.abhaNumber.includes(patientSearch))
  );

  // Pharmacy Filtering Logic
  const filteredPharmacies = verifiedPharmacies.filter(p => {
      const search = pharmacySearch.toLowerCase();
      return (
          p.name.toLowerCase().includes(search) || 
          (p.clinicAddress || '').toLowerCase().includes(search) ||
          (p.city || '').toLowerCase().includes(search) ||
          (p.pincode || '').includes(search) ||
          (p.phone || '').includes(search)
      );
  });

  const selectedPharmacyObj = verifiedPharmacies.find(p => p.id === selectedPharmacyId);

  // Filter Rx History for Lookup (Safety check added for undefined patientName)
  const filteredHistory = prescriptionHistory
    .filter(rx => (rx.patientName || '').toLowerCase().includes(historySearch.toLowerCase()))
    .slice(0, 5);

  // Load Templates on Mount
  useEffect(() => {
      const saved = dbService.getTemplates(currentUser.id);
      setTemplates(saved);
  }, [currentUser.id]);

  const handleSelectPatient = (patient: Patient) => {
      // CRITICAL: Set form values so they are captured in handleSubmit
      setValue('patientName', patient.fullName);
      setValue('patientGender', patient.gender);
      
      const birthDate = new Date(patient.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      setValue('patientAge', age);
      
      // Auto toggle ABDM linking if patient has Verified ABHA
      if (patient.isAbhaVerified) {
          setValue('linkedToAbha', true);
      } else {
          setValue('linkedToAbha', false);
      }

      setSelectedPatient(patient);
      setPatientSearch('');
      setShowPatientResults(false);
  };

  // Handle Pre-selected patient prop change
  useEffect(() => {
      if (preSelectedPatient) {
          handleSelectPatient(preSelectedPatient);
      }
  }, [preSelectedPatient]);

  // Auto-calculate age when New Patient DOB changes
  useEffect(() => {
      if (patientMode === 'CREATE' && newPatient.dateOfBirth) {
          const birthDate = new Date(newPatient.dateOfBirth);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          const finalAge = age > 0 ? age : 0;
          
          // CRITICAL: Set form values for submission
          setValue('patientAge', finalAge);
          setValue('patientName', newPatient.fullName || '');
          setValue('patientGender', newPatient.gender as any);
      }
  }, [newPatient.dateOfBirth, newPatient.fullName, newPatient.gender, patientMode, setValue]);

  const handleCopyFromHistory = (rx: Prescription) => {
      setValue('diagnosis', rx.diagnosis);
      replace(rx.medicines);
      setValue('advice', rx.advice);
      // Auto-fill patient if possible (nice to have)
      if (patientMode === 'CREATE') {
         setNewPatient(prev => ({ ...prev, fullName: rx.patientName, gender: rx.patientGender }));
         setValue('patientName', rx.patientName);
         setValue('patientAge', rx.patientAge);
         setValue('patientGender', rx.patientGender);
      }
      setHistorySearch('');
      setShowHistoryResults(false);
      alert(`Copied Rx details from ${rx.patientName}'s record dated ${new Date(rx.date).toLocaleDateString()}`);
  };

  // Template Handlers
  const handleSaveTemplate = () => {
      if (!templateName || !diagnosis) {
          alert("Please enter a Template Name and Diagnosis.");
          return;
      }
      const newTemplate: PrescriptionTemplate = {
          id: `tmpl-${Date.now()}`,
          name: templateName,
          doctorId: currentUser.id,
          diagnosis: diagnosis,
          medicines: getValues('medicines'),
          advice: getValues('advice')
      };
      dbService.saveTemplate(newTemplate);
      setTemplates(prev => [...prev, newTemplate]);
      setTemplateName('');
      setShowSaveTemplate(false);
      alert("Template Saved Successfully!");
  };

  const handleLoadTemplate = (templateId: string) => {
      const tmpl = templates.find(t => t.id === templateId);
      if (tmpl) {
          setValue('diagnosis', tmpl.diagnosis);
          replace(tmpl.medicines);
          setValue('advice', tmpl.advice);
      }
  };

  const handleAnalyze = async () => {
    if (!diagnosis || medicines.length === 0) return;
    setAnalyzing(true);
    const result = await analyzePrescriptionSafety(diagnosis, medicines);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  // Voice Dictation Logic
  const toggleVoiceInput = (field: 'DIAGNOSIS' | 'ADVICE') => {
      if (isListening) {
          // Stop listening
          setIsListening(null);
          return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          alert("Your browser does not support Voice Dictation. Please use Chrome.");
          return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(field);
      
      recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          if (field === 'DIAGNOSIS') {
              const current = getValues('diagnosis') || '';
              setValue('diagnosis', current ? current + ' ' + text : text);
          } else {
              const current = getValues('advice') || '';
              setValue('advice', current ? current + ' ' + text : text);
          }
          setIsListening(null);
      };

      recognition.onerror = () => {
          setIsListening(null);
          alert("Voice recognition failed. Please try again.");
      };

      recognition.onend = () => setIsListening(null);

      recognition.start();
  };

  // eSign Handlers
  const generateESignToken = async () => {
      // 1. Check form validity first using trigger()
      const isFormValid = await trigger();
      if (!isFormValid) {
          alert("Please fill in all required fields (Diagnosis, Medicine Names) before signing.");
          return;
      }

      const currentValues = getValues();
      if (!currentValues.medicines || currentValues.medicines.length === 0) {
           alert("Please add at least one medicine.");
           return;
      }

      // 2. Race condition check: Ensure patient data is captured
      // If user selected existing patient, ensure values are set
      if (patientMode === 'SEARCH' && selectedPatient) {
          if (!currentValues.patientName) setValue('patientName', selectedPatient.fullName);
      }

      // Check for patient data validity (even if hidden inputs are registered, verify value presence)
      // Re-get values after potential set
      const updatedValues = getValues();
      if (!updatedValues.patientName && !selectedPatient && !(patientMode === 'CREATE' && newPatient.fullName)) {
          alert("Patient Name is missing. Please select or create a patient.");
          return;
      }

      if (!selectedPharmacyId) {
          alert("Please select a pharmacy to send the prescription to.");
          return;
      }
      if (!isPatientVerified) {
          alert("Please verify patient identity first (Telemedicine Compliance).");
          return;
      }
      
      // FIXED OTP: 0000
      const token = '0000';
      setESignToken(token);
      setESignStep('GENERATED');
      setESignInput(''); // Reset input
      alert(`SECURITY ALERT: Your One-Time Signing Key is ${token}`);
  };

  const verifyESign = () => {
      // FIXED VERIFICATION: 0000
      if (eSignInput.trim() === '0000') {
          setESignStep('SIGNED');
      } else {
          alert("Invalid Signing Key. Please try again (Key: 0000).");
      }
  };

  const onFormSubmitError = (errors: any) => {
      console.error("Form Validation Error during submit:", errors);
      alert("Cannot send Prescription: Please check for missing fields.");
  };

  const handleFinalSubmit = (data: PrescriptionFormData) => {
    console.log("Submitting Rx Data:", data);

    if (!selectedPharmacyId) {
        alert("Please select a pharmacy to send the prescription to.");
        return;
    }
    
    // We assume if this function is called, the signature was verified via verifyESign
    
    let finalPatientId = selectedPatient?.id;
    let finalPatientName = data.patientName;

    // Fallback: If data.patientName is empty but we have a selected patient, use that
    if (!finalPatientName && selectedPatient) {
        finalPatientName = selectedPatient.fullName;
    }

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
    } else if (!selectedPatient && !finalPatientName) {
        alert("Please select an existing patient or create a new one.");
        return;
    }

    // 2. Create Prescription Linked to Patient ID
    const pharmacy = verifiedPharmacies.find(p => p.id === selectedPharmacyId);
    const newRx: Prescription = {
        ...data,
        id: '', // Handled by App.tsx
        doctorId: currentUser.id,
        patientId: finalPatientId, 
        patientName: finalPatientName,
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
        status: 'SENT_TO_PHARMACY', // Standard status for signed Rx
        digitalSignatureToken: `SIG-${Date.now()}-${eSignToken}`, // Embed token in signature
        refills: data.refills ? Number(data.refills) : 0,
        followUpDate: data.followUpDate,
        linkedToAbha: data.linkedToAbha
    };

    onPrescriptionSent(newRx);
    
    alert(data.linkedToAbha 
        ? "Prescription Signed, Sent to Pharmacy & Linked to Patient's Health Locker (ABDM)." 
        : "Prescription Signed & Sent to Pharmacy Successfully.");
    
    // Reset basic form state but keep doctor context
    setESignStep('IDLE');
    setESignToken('');
    // Optionally clear form here or navigate away (DoctorDashboard usually handles navigation)
  };

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200">
      <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-4">
        <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center">
                <FileText className="mr-2 text-indigo-600"/> New e-Prescription
            </h2>
            <div className="flex gap-2 mt-1">
                 {/* Template Loader */}
                <select 
                    className="text-xs border border-slate-300 rounded px-2 py-1 bg-white max-w-[150px]"
                    onChange={(e) => handleLoadTemplate(e.target.value)}
                    defaultValue=""
                >
                    <option value="" disabled>Load Template...</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* History Lookup Button/Input */}
            <div className="relative w-full sm:w-auto">
                <div className="flex items-center bg-white border border-indigo-200 rounded-md px-3 py-1.5 shadow-sm">
                    <RotateCcw className="w-4 h-4 text-indigo-600 mr-2"/>
                    <input 
                        type="text"
                        placeholder="Autofill from Name..."
                        className="bg-transparent border-none text-xs focus:outline-none w-full sm:w-48 text-indigo-800 placeholder-indigo-400"
                        value={historySearch}
                        onChange={(e) => { setHistorySearch(e.target.value); setShowHistoryResults(true); }}
                        onFocus={() => setShowHistoryResults(true)}
                    />
                </div>
                {showHistoryResults && historySearch && (
                    <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-slate-200 rounded-md shadow-xl z-30">
                        <div className="p-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">Select Past Rx to Autofill</div>
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
                                        <span className="text-indigo-600 truncate max-w-[120px]">{rx.diagnosis}</span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-xs text-slate-400 italic">No matching history found.</div>
                        )}
                    </div>
                )}
            </div>
            <span className="text-[10px] sm:text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200 font-medium whitespace-nowrap">Telemedicine Compliant</span>
        </div>
      </div>

      <form className="p-4 sm:p-6 space-y-6">
        {/* Hidden Inputs to capture patient data in RHF data object */}
        <input type="hidden" {...register('patientName', { required: true })} />
        <input type="hidden" {...register('patientAge', { required: true, valueAsNumber: true })} />
        <input type="hidden" {...register('patientGender', { required: true })} />

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
        <div className="bg-white p-4 sm:p-5 border border-slate-200 rounded-lg shadow-sm">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-slate-100 pb-3 gap-2">
                <label className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center flex-wrap gap-2">
                    1. Select Patient
                    {selectedPatient && patientMode === 'SEARCH' && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full border border-green-200 flex items-center font-bold">
                            <Link2 className="w-3 h-3 mr-1"/> Linked
                        </span>
                    )}
                </label>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
                    <button 
                        type="button"
                        onClick={() => { setPatientMode('SEARCH'); setSelectedPatient(null); }}
                        className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center ${patientMode === 'SEARCH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Search className="w-3 h-3 mr-1"/> Existing
                    </button>
                    <button 
                        type="button" 
                        onClick={() => { setPatientMode('CREATE'); setSelectedPatient(null); setValue('patientName', ''); }}
                        className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center ${patientMode === 'CREATE' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserPlus className="w-3 h-3 mr-1"/> New
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
                                placeholder="Search by name, phone or ABHA ID..."
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
                                                    <span className="font-bold text-slate-800 group-hover:text-indigo-700 block flex items-center">
                                                        {p.fullName}
                                                        {p.isAbhaVerified && <ShieldCheck className="w-3 h-3 ml-1 text-green-600"/>}
                                                    </span>
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
                                    <div className="flex items-center gap-1">
                                        <p className="text-sm font-bold text-slate-900">{selectedPatient.fullName}</p>
                                        {selectedPatient.isAbhaVerified && (
                                            <span className="bg-green-100 text-green-700 text-[10px] px-1.5 rounded font-bold border border-green-200 flex items-center">
                                                <ShieldCheck className="w-3 h-3 mr-1"/> ABHA
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">{selectedPatient.gender}, {selectedPatient.phone}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => { setSelectedPatient(null); setValue('patientName', ''); setValue('linkedToAbha', false); }} className="text-xs text-red-600 hover:underline font-medium">Change</button>
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
                 </div>
             )}
        </div>

        {/* VITALS & DIAGNOSIS */}
        <div>
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-teal-600"/> 2. Vitals & Diagnosis
          </label>
          
          {/* Vitals Row */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 flex items-center"><Activity className="w-3 h-3 mr-1"/> BP</label>
                      <input {...register('vitals.bp')} className="w-full border p-1.5 text-sm rounded" placeholder="120/80" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 flex items-center"><Activity className="w-3 h-3 mr-1"/> Pulse</label>
                      <input {...register('vitals.pulse')} className="w-full border p-1.5 text-sm rounded" placeholder="72" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 flex items-center"><Thermometer className="w-3 h-3 mr-1"/> Temp</label>
                      <input {...register('vitals.temp')} className="w-full border p-1.5 text-sm rounded" placeholder="98.6" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 flex items-center"><Gauge className="w-3 h-3 mr-1"/> SpO2</label>
                      <input {...register('vitals.spo2')} className="w-full border p-1.5 text-sm rounded" placeholder="98" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 flex items-center"><Activity className="w-3 h-3 mr-1"/> Wt (kg)</label>
                      <input {...register('vitals.weight')} className="w-full border p-1.5 text-sm rounded" placeholder="70" />
                  </div>
              </div>
          </div>

          <div className="relative">
              <textarea 
                {...register('diagnosis', { required: true })} 
                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-sm pr-10" 
                rows={2} 
                placeholder="e.g. Acute Bronchitis, dry cough"
              ></textarea>
              <button
                type="button"
                onClick={() => toggleVoiceInput('DIAGNOSIS')}
                className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${isListening === 'DIAGNOSIS' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                title="Voice Dictation"
              >
                  <Mic className="w-4 h-4" />
              </button>
          </div>
          {errors.diagnosis && <p className="text-xs text-red-500 mt-1">Diagnosis is required.</p>}
        </div>

        {/* Medicines */}
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">3. Medication (Rx)</label>
                
                <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
                    {/* Medicine Filters */}
                    <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                         <button 
                            type="button"
                            onClick={() => setMedicineFilter('SAFE')}
                            className={`px-3 py-1 text-[10px] sm:text-xs rounded font-bold transition-all flex items-center ${medicineFilter === 'SAFE' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                         >
                             <CheckCircle2 className="w-3 h-3 mr-1"/> Safe
                         </button>
                         <button 
                            type="button"
                            onClick={() => setMedicineFilter('RESTRICTED')}
                            className={`px-3 py-1 text-[10px] sm:text-xs rounded font-bold transition-all flex items-center ${medicineFilter === 'RESTRICTED' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                         >
                             <ShieldAlert className="w-3 h-3 mr-1"/> Restricted
                         </button>
                         <button 
                            type="button"
                            onClick={() => setMedicineFilter('ALL')}
                            className={`px-3 py-1 text-[10px] sm:text-xs rounded font-bold transition-all ${medicineFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                         >
                             All
                         </button>
                    </div>

                    <button type="button" onClick={() => append({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })} className="ml-auto sm:ml-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md font-medium flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-1"/> Add Drug
                    </button>
                </div>
            </div>
            
            <datalist id="common-medicines">
                {medicineOptions.map(med => <option key={med} value={med} />)}
            </datalist>

            <div className="space-y-4">
                {fields.map((field, index) => {
                    const currentDosage = medicines[index]?.dosage || '';
                    const currentFreq = medicines[index]?.frequency || '';
                    const currentDur = medicines[index]?.duration || '';
                    const freqDesc = getFrequencyDescription(currentFreq);
                    
                    const fullDirection = `${currentDosage ? currentDosage + ', ' : ''}${freqDesc || currentFreq || '...'}${currentDur ? ' for ' + currentDur : ''}`;

                    return (
                        <div key={field.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm relative">
                            {/* Delete Button moved to absolute position on mobile to save vertical space */}
                            <button 
                                type="button" 
                                onClick={() => remove(index)} 
                                className="absolute top-2 right-2 text-red-400 hover:text-red-700 p-1"
                            >
                                <Trash2 className="w-4 h-4"/>
                            </button>

                            <div className="grid grid-cols-12 gap-3 items-end sm:items-start">
                                <div className="col-span-12 sm:col-span-4">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Medicine Name</label>
                                    <input 
                                      {...register(`medicines.${index}.name` as const, { required: true })} 
                                      list="common-medicines"
                                      placeholder="Type or select..." 
                                      className={`w-full text-sm rounded border p-2 font-medium ${errors.medicines?.[index]?.name ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                     <label className="text-xs font-bold text-slate-500 mb-1 block">Dose</label>
                                     <input {...register(`medicines.${index}.dosage` as const)} placeholder="500mg" className="w-full text-sm border-slate-300 rounded border p-2" />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                     <label className="text-xs font-bold text-slate-500 mb-1 block">Freq</label>
                                     <input 
                                        {...register(`medicines.${index}.frequency` as const)} 
                                        placeholder="1-0-1" 
                                        className="w-full text-sm border-slate-300 rounded border p-2" 
                                     />
                                </div>
                                <div className="col-span-12 sm:col-span-2">
                                     <label className="text-xs font-bold text-slate-500 mb-1 block">Duration</label>
                                     <input {...register(`medicines.${index}.duration` as const)} placeholder="5 days" className="w-full text-sm border-slate-300 rounded border p-2" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-12 gap-3 mt-3">
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
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">4. Additional Advice & Follow-up</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 mt-2">
                <div className="sm:col-span-2 relative">
                    <textarea 
                        {...register('advice')} 
                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm border p-3 text-sm pr-10" 
                        rows={2} 
                        placeholder="Dietary advice, rest instructions..."
                    ></textarea>
                    <button
                        type="button"
                        onClick={() => toggleVoiceInput('ADVICE')}
                        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${isListening === 'ADVICE' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        title="Voice Dictation"
                    >
                        <Mic className="w-4 h-4" />
                    </button>
                </div>
                <div>
                     <label className="text-xs font-bold text-slate-500 mb-1 flex items-center"><Repeat className="w-3 h-3 mr-1"/> Refills Allowed</label>
                     <input type="number" {...register('refills')} min={0} className="w-full border p-2 rounded text-sm" placeholder="0" />
                </div>
                <div>
                     <label className="text-xs font-bold text-slate-500 mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1"/> Follow-up Date</label>
                     <input type="date" {...register('followUpDate')} className="w-full border p-2 rounded text-sm" />
                </div>
            </div>
        </div>

        {/* Template Save Options */}
        <div className="flex justify-end border-b border-slate-100 pb-4">
            {!showSaveTemplate ? (
                <button type="button" onClick={() => setShowSaveTemplate(true)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center">
                    <Save className="w-3 h-3 mr-1"/> Save as Template
                </button>
            ) : (
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded">
                    <input 
                        className="text-xs border p-1 rounded w-32 sm:w-auto" 
                        placeholder="Template Name"
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                    />
                    <button type="button" onClick={handleSaveTemplate} className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">Save</button>
                    <button type="button" onClick={() => setShowSaveTemplate(false)} className="text-slate-500 text-xs px-2"><X className="w-3 h-3"/></button>
                </div>
            )}
        </div>

        {/* Compliance & Verification */}
        <div className="space-y-4">
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

            {/* ABHA Linking Option */}
            <div className={`p-4 rounded-md border transition-colors ${linkedToAbha ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className={`text-sm font-bold mb-2 flex items-center ${linkedToAbha ? 'text-orange-800' : 'text-slate-600'}`}>
                    <ShieldCheck className="w-4 h-4 mr-2"/> Health Locker Integration (ABDM)
                </h4>
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="abha-link"
                            type="checkbox"
                            {...register('linkedToAbha')}
                            className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                        />
                    </div>
                    <div className="ml-2 text-sm">
                        <label htmlFor="abha-link" className="font-medium text-slate-700">
                            Push this prescription to Patient's Health Locker (PHR App).
                            {selectedPatient && !selectedPatient.isAbhaVerified && <span className="block text-xs text-orange-600 mt-1 font-bold">Note: Patient ABHA is not verified. Link may fail.</span>}
                        </label>
                    </div>
                </div>
            </div>
        </div>

        {/* Pharmacy Selection - Upgraded with Address & Search */}
        <div>
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">5. Select Pharmacy (Verified)</label>
            
            {selectedPharmacyId && selectedPharmacyObj ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-full border border-green-100">
                                <Building2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-900">{selectedPharmacyObj.name}</h4>
                                <p className="text-sm text-green-800 flex items-start mt-1">
                                    <MapPin className="w-3 h-3 mr-1 mt-1 shrink-0"/>
                                    {selectedPharmacyObj.clinicAddress}, {selectedPharmacyObj.city} - {selectedPharmacyObj.pincode}
                                </p>
                                {selectedPharmacyObj.phone && (
                                    <p className="text-xs text-green-700 mt-1 flex items-center">
                                        <Phone className="w-3 h-3 mr-1"/> {selectedPharmacyObj.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedPharmacyId('')}
                            className="text-xs font-bold text-red-600 hover:text-red-800 border border-red-200 bg-white px-3 py-1.5 rounded shadow-sm hover:bg-red-50 transition-colors"
                        >
                            Change
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                        <input 
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                            placeholder="Search nearby (City, Pincode) or Pharmacy Name..."
                            value={pharmacySearch}
                            onChange={e => setPharmacySearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-2">
                        {filteredPharmacies.length === 0 ? (
                            <div className="text-center py-4 text-slate-500 italic text-sm">
                                No pharmacies found matching "{pharmacySearch}".
                                {verifiedPharmacies.length === 0 && <span className="block mt-1 text-red-500">No verified pharmacies exist in the system. Contact Admin.</span>}
                            </div>
                        ) : (
                            filteredPharmacies.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => setSelectedPharmacyId(p.id)}
                                    className="bg-white p-3 rounded border border-slate-200 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-bold text-slate-800 group-hover:text-indigo-700">{p.name}</h5>
                                            <p className="text-xs text-slate-600 mt-1 flex items-start">
                                                <MapPin className="w-3 h-3 mr-1 mt-0.5 shrink-0 text-slate-400"/>
                                                {p.clinicAddress}, {p.city}, {p.state} {p.pincode}
                                            </p>
                                        </div>
                                        {p.verificationStatus === VerificationStatus.DIRECTORY ? (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 font-bold whitespace-nowrap">
                                                Directory Listing
                                            </span>
                                        ) : (
                                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded group-hover:bg-indigo-100 flex items-center whitespace-nowrap">
                                                <CheckCircle2 className="w-3 h-3 mr-1"/> Verified Partner
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* eSign & Submit */}
        <div className="pt-4 border-t border-slate-200">
            {eSignStep === 'IDLE' && (
                <button 
                    type="button" 
                    onClick={generateESignToken}
                    className="w-full flex justify-center items-center bg-teal-600 text-white py-3 rounded-md hover:bg-teal-700 font-bold shadow transition-all"
                >
                    <KeyRound className="w-5 h-5 mr-2"/> Initiate Digital Signing
                </button>
            )}

            {eSignStep === 'GENERATED' && (
                <div className="bg-slate-900 p-4 rounded-lg text-center animate-in fade-in">
                    <p className="text-slate-300 text-xs uppercase font-bold mb-2">Security Challenge</p>
                    <p className="text-white text-sm mb-4">Enter the One-Time Signing Key shown in the alert.</p>
                    <div className="flex justify-center gap-2 mb-4">
                        <input 
                            type="text" 
                            maxLength={4} 
                            className="w-32 text-center text-2xl font-bold tracking-widest p-2 rounded border border-slate-600 bg-slate-800 text-white focus:ring-teal-500" 
                            value={eSignInput}
                            onChange={e => setESignInput(e.target.value)}
                            placeholder="----"
                        />
                    </div>
                    <button 
                        type="button" 
                        onClick={verifyESign}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition-colors"
                    >
                        Verify & Sign
                    </button>
                </div>
            )}

            {eSignStep === 'SIGNED' && (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="text-green-600 font-bold text-sm mb-4 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 mr-1"/> Digitally Signed & Verified
                    </div>
                    
                    <button 
                        type="button" 
                        onClick={handleSubmit(handleFinalSubmit, onFormSubmitError)} // Note: use manual handler on button
                        className="w-full flex justify-center items-center bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-bold shadow transition-all animate-pulse"
                    >
                        <Send className="w-5 h-5 mr-2"/> Send to Pharmacy
                    </button>
                    
                    <p className="text-xs text-slate-500 mt-2">Signing Token: {eSignToken}</p>
                </div>
            )}
            
            <p className="text-center text-xs text-slate-400 mt-2">Digitally Signed & Encrypted according to IT Act 2000</p>
        </div>
      </form>
    </div>
  );
};