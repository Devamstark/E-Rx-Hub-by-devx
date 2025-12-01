
import React, { useState } from 'react';
import { Patient, Prescription, LabReferral } from '../../types';
import { Plus, Search, User, Phone, MapPin, HeartPulse, AlertTriangle, Edit2, Save, X, FileText, ArrowLeft, ExternalLink, ShieldCheck, Loader2, Stethoscope, Activity, Microscope, CheckCircle2, Clock } from 'lucide-react';
import { PrescriptionModal } from './PrescriptionModal';

interface PatientManagerProps {
    doctorId: string;
    patients: Patient[];
    onAddPatient: (p: Patient) => void;
    onUpdatePatient: (p: Patient) => void;
    prescriptions?: Prescription[];
    labReferrals?: LabReferral[];
}

export const PatientManager: React.FC<PatientManagerProps> = ({ 
    doctorId, 
    patients, 
    onAddPatient, 
    onUpdatePatient, 
    prescriptions = [],
    labReferrals = []
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHistoryRx, setSelectedHistoryRx] = useState<Prescription | null>(null);
    const [viewingReport, setViewingReport] = useState<LabReferral | null>(null);
    
    // ABHA Verification State
    const [verifyingAbha, setVerifyingAbha] = useState(false);
    const [abhaVerified, setAbhaVerified] = useState(false);
    
    // Filter patients for this doctor
    const myPatients = patients.filter(p => p.doctorId === doctorId);
    
    const filteredPatients = myPatients.filter(p => 
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        (p.abhaAddress && p.abhaAddress.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const initialFormState: Patient = {
        id: '',
        doctorId: doctorId,
        fullName: '',
        dateOfBirth: '',
        gender: 'Male',
        phone: '',
        address: '',
        emergencyContact: '',
        abhaNumber: '',
        abhaAddress: '',
        isAbhaVerified: false,
        bloodGroup: '',
        height: '',
        weight: '',
        allergies: [],
        chronicConditions: [],
        pastSurgeries: '',
        familyHistory: '',
        currentMedications: '',
        pastMedications: '',
        notes: '',
        documents: [],
        registeredAt: new Date().toISOString()
    };

    const [formData, setFormData] = useState<Patient>(initialFormState);
    const [allergyInput, setAllergyInput] = useState('');
    const [conditionInput, setConditionInput] = useState('');

    const handleEdit = (patient: Patient) => {
        setFormData(patient);
        setEditingId(patient.id);
        setIsAdding(true);
        setAbhaVerified(!!patient.isAbhaVerified);
        setViewingPatient(null); // Switch from view to edit
    };

    const handleViewProfile = (patient: Patient) => {
        setViewingPatient(patient);
        setIsAdding(false);
    };

    const handleVerifyAbha = () => {
        if (!formData.abhaNumber && !formData.abhaAddress) {
            alert("Please enter ABHA Number or Address");
            return;
        }
        setVerifyingAbha(true);
        // Simulate NHA API Call
        setTimeout(() => {
            setVerifyingAbha(false);
            setAbhaVerified(true);
            setFormData(prev => ({ ...prev, isAbhaVerified: true }));
            alert("ABHA Verified Successfully with National Health Authority.");
        }, 1500);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingId) {
            onUpdatePatient(formData);
        } else {
            onAddPatient({
                ...formData,
                id: `PAT-${Date.now()}`,
                registeredAt: new Date().toISOString()
            });
        }
        
        setIsAdding(false);
        setEditingId(null);
        setFormData(initialFormState);
        setAbhaVerified(false);
    };

    const addAllergy = () => {
        if (allergyInput.trim()) {
            setFormData(prev => ({ ...prev, allergies: [...prev.allergies, allergyInput.trim()] }));
            setAllergyInput('');
        }
    };

    const addCondition = () => {
        if (conditionInput.trim()) {
            setFormData(prev => ({ ...prev, chronicConditions: [...prev.chronicConditions, conditionInput.trim()] }));
            setConditionInput('');
        }
    };

    const getPatientPrescriptions = (patient: Patient) => {
        return prescriptions.filter(rx => rx.patientId === patient.id || (rx.patientName && rx.patientName.toLowerCase() === patient.fullName.toLowerCase()));
    };

    const getPatientLabs = (patient: Patient) => {
        return labReferrals.filter(l => l.patientId === patient.id);
    };

    // --- ADD / EDIT FORM ---
    if (isAdding) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        {editingId ? <Edit2 className="w-5 h-5 mr-2 text-indigo-600"/> : <Plus className="w-5 h-5 mr-2 text-teal-600"/>}
                        {editingId ? 'Update Patient Profile' : 'Register New Patient'}
                    </h2>
                    <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6"/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* SECTION: ABDM Integration */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-orange-800 uppercase mb-3 flex items-center">
                            <ShieldCheck className="w-4 h-4 mr-1"/> Ayushman Bharat Digital Mission (ABDM)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">ABHA Number (14-digits)</label>
                                <input 
                                    className="w-full border border-orange-200 rounded p-2 text-sm focus:ring-orange-500" 
                                    value={formData.abhaNumber || ''}
                                    onChange={e => setFormData({...formData, abhaNumber: e.target.value.replace(/\D/g,'').slice(0,14)})}
                                    placeholder="XX-XXXX-XXXX-XXXX"
                                    maxLength={14}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">ABHA Address (PHR)</label>
                                <input 
                                    className="w-full border border-orange-200 rounded p-2 text-sm focus:ring-orange-500" 
                                    value={formData.abhaAddress || ''}
                                    onChange={e => setFormData({...formData, abhaAddress: e.target.value})}
                                    placeholder="username@abdm"
                                />
                            </div>
                            <div>
                                {abhaVerified ? (
                                    <button type="button" disabled className="w-full flex items-center justify-center bg-green-100 text-green-700 font-bold py-2 rounded border border-green-200 cursor-default">
                                        <CheckCircle2 className="w-4 h-4 mr-2"/> Verified
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={handleVerifyAbha}
                                        disabled={verifyingAbha}
                                        className="w-full bg-orange-600 text-white font-medium py-2 rounded hover:bg-orange-700 flex items-center justify-center"
                                    >
                                        {verifyingAbha ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <ShieldCheck className="w-4 h-4 mr-2"/>}
                                        Verify Identity
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 1: Personal */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center"><User className="w-4 h-4 mr-1"/> Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                                <input required className="w-full border p-2 rounded text-sm" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. John Doe"/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                                <input required className="w-full border p-2 rounded text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91..."/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth *</label>
                                <input type="date" required className="w-full border p-2 rounded text-sm" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Gender *</label>
                                <select className="w-full border p-2 rounded text-sm" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Full Address</label>
                                <input className="w-full border p-2 rounded text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street, City, State, Pincode"/>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Vitals */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center"><HeartPulse className="w-4 h-4 mr-1"/> Vitals & Emergency</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                                <input className="w-full border p-2 rounded text-sm" value={formData.bloodGroup || ''} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} placeholder="e.g. O+"/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Height (cm)</label>
                                <input className="w-full border p-2 rounded text-sm" value={formData.height || ''} onChange={e => setFormData({...formData, height: e.target.value})} placeholder="e.g. 175"/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Weight (kg)</label>
                                <input className="w-full border p-2 rounded text-sm" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="e.g. 70"/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Contact</label>
                                <input className="w-full border p-2 rounded text-sm" value={formData.emergencyContact || ''} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} placeholder="Name & Phone"/>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Clinical */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Clinical Profile</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Known Allergies</label>
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            className="flex-1 border p-2 rounded text-sm" 
                                            value={allergyInput} 
                                            onChange={e => setAllergyInput(e.target.value)} 
                                            placeholder="e.g. Penicillin"
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                                        />
                                        <button type="button" onClick={addAllergy} className="bg-slate-100 px-3 rounded text-sm font-bold text-slate-600 hover:bg-slate-200">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.allergies.map((a, i) => (
                                            <span key={i} className="bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs flex items-center border border-red-100">
                                                {a} <button type="button" onClick={() => setFormData(prev => ({...prev, allergies: prev.allergies.filter((_, idx) => idx !== i)}))} className="ml-1 hover:text-red-900">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Chronic Conditions</label>
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            className="flex-1 border p-2 rounded text-sm" 
                                            value={conditionInput} 
                                            onChange={e => setConditionInput(e.target.value)} 
                                            placeholder="e.g. Hypertension"
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                                        />
                                        <button type="button" onClick={addCondition} className="bg-slate-100 px-3 rounded text-sm font-bold text-slate-600 hover:bg-slate-200">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.chronicConditions.map((c, i) => (
                                            <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center border border-blue-100">
                                                {c} <button type="button" onClick={() => setFormData(prev => ({...prev, chronicConditions: prev.chronicConditions.filter((_, idx) => idx !== i)}))} className="ml-1 hover:text-blue-900">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Current Medications</label>
                                    <textarea className="w-full border p-2 rounded text-sm" rows={2} value={formData.currentMedications || ''} onChange={e => setFormData({...formData, currentMedications: e.target.value})} placeholder="Ongoing meds..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Past Surgeries</label>
                                    <textarea className="w-full border p-2 rounded text-sm" rows={2} value={formData.pastSurgeries || ''} onChange={e => setFormData({...formData, pastSurgeries: e.target.value})} placeholder="History..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded text-sm">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium text-sm flex items-center">
                            <Save className="w-4 h-4 mr-2"/> {editingId ? 'Update Profile' : 'Save Patient'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // --- VIEW DETAILS MODE (Profile) ---
    if (viewingPatient) {
        const patientRx = getPatientPrescriptions(viewingPatient);
        const patientLabs = getPatientLabs(viewingPatient);
        
        return (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-right-4">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewingPatient(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{viewingPatient.fullName}</h2>
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                                <User className="w-4 h-4"/>
                                <span>{viewingPatient.gender}, {new Date().getFullYear() - new Date(viewingPatient.dateOfBirth).getFullYear()} Years</span>
                                <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                {viewingPatient.isAbhaVerified ? (
                                    <span className="flex items-center text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold border border-green-200">
                                        <ShieldCheck className="w-3 h-3 mr-1"/> ABDM Linked
                                    </span>
                                ) : (
                                    <span className="font-mono text-xs bg-slate-200 px-2 rounded">ID: {viewingPatient.id}</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleEdit(viewingPatient)} 
                        className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-100"
                    >
                        <Edit2 className="w-4 h-4 mr-2"/> Edit Profile
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* SECTION 1: PATIENT DETAILS */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center border-b border-slate-100 pb-2">
                            <User className="w-4 h-4 mr-2 text-indigo-600"/> 1. Patient Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Contact Info</p>
                                <p className="text-sm font-medium text-slate-900 flex items-center mb-1"><Phone className="w-3 h-3 mr-2 text-slate-400"/> {viewingPatient.phone}</p>
                                <p className="text-sm text-slate-700 flex items-start"><MapPin className="w-3 h-3 mr-2 text-slate-400 mt-1"/> {viewingPatient.address}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">ABDM Profile</p>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-900"><span className="text-slate-500 text-xs">ABHA No:</span> {viewingPatient.abhaNumber || 'Not Linked'}</p>
                                    <p className="text-sm text-slate-900"><span className="text-slate-500 text-xs">Address:</span> {viewingPatient.abhaAddress || '-'}</p>
                                    <p className="text-xs mt-1">
                                        {viewingPatient.isAbhaVerified ? <span className="text-green-600 font-bold">● Verified</span> : <span className="text-amber-500">● Unverified</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Physical Vitals</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-slate-500">Height:</span> <span className="font-medium">{viewingPatient.height || '-'} cm</span></div>
                                    <div><span className="text-slate-500">Weight:</span> <span className="font-medium">{viewingPatient.weight || '-'} kg</span></div>
                                    <div><span className="text-slate-500">Blood:</span> <span className="font-medium text-red-600">{viewingPatient.bloodGroup || '-'}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: MEDICAL INFO */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center border-b border-slate-100 pb-2">
                            <Activity className="w-4 h-4 mr-2 text-red-600"/> 2. Medical Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-red-100 rounded-lg p-4 shadow-sm">
                                <p className="text-xs font-bold text-red-600 uppercase mb-2 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> Allergies</p>
                                {viewingPatient.allergies.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {viewingPatient.allergies.map(a => <span key={a} className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-100">{a}</span>)}
                                    </div>
                                ) : <p className="text-sm text-slate-400 italic">No known allergies.</p>}
                            </div>
                            <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm">
                                <p className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center"><HeartPulse className="w-3 h-3 mr-1"/> Chronic Conditions</p>
                                {viewingPatient.chronicConditions.length > 0 ? (
                                    <ul className="list-disc list-inside text-sm text-slate-700">
                                        {viewingPatient.chronicConditions.map(c => <li key={c}>{c}</li>)}
                                    </ul>
                                ) : <p className="text-sm text-slate-400 italic">No chronic conditions.</p>}
                            </div>
                            {viewingPatient.pastSurgeries && (
                                <div className="col-span-full bg-slate-50 p-3 rounded border border-slate-200 text-sm">
                                    <span className="font-bold text-slate-600">Surgical History: </span>
                                    <span className="text-slate-800">{viewingPatient.pastSurgeries}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: PRESCRIPTION HISTORY */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                            <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-indigo-600"/> 3. Prescription History (Rx)
                            </h3>
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-bold border border-indigo-100">
                                {patientRx.length} Records
                            </span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Rx Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Pharmacy</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">View</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {patientRx.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                <Stethoscope className="w-8 h-8 mx-auto text-slate-300 mb-2"/>
                                                No prescriptions found for this patient.
                                            </td>
                                        </tr>
                                    ) : (
                                        patientRx.map(rx => (
                                            <tr key={rx.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                                    #{rx.id}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                                                    {new Date(rx.date).toLocaleDateString()} <span className="text-slate-400 text-xs">{new Date(rx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {rx.pharmacyName || <span className="italic text-slate-400">Pending Assignment</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold border uppercase ${
                                                        rx.status === 'DISPENSED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                        rx.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                        {rx.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => setSelectedHistoryRx(rx)}
                                                        className="text-indigo-600 hover:text-indigo-800 text-xs font-bold border border-indigo-100 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        View Rx
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION 4: LAB REPORTS */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                            <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center">
                                <Microscope className="w-4 h-4 mr-2 text-teal-600"/> 4. Lab & Diagnostic Reports
                            </h3>
                            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-bold border border-teal-100">
                                {patientLabs.length} Reports
                            </span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Test Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Lab / Center</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Report</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {patientLabs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                <Microscope className="w-8 h-8 mx-auto text-slate-300 mb-2"/>
                                                No lab reports attached.
                                            </td>
                                        </tr>
                                    ) : (
                                        patientLabs.map(lab => (
                                            <tr key={lab.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                                                    {new Date(lab.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-800">
                                                    {lab.testName}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {lab.labName || 'Any Lab'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {lab.status === 'COMPLETED' ? (
                                                        <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full font-bold border border-green-200 flex items-center w-max">
                                                            <CheckCircle2 className="w-3 h-3 mr-1"/> Ready
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-bold border border-amber-200 flex items-center w-max">
                                                            <Clock className="w-3 h-3 mr-1"/> Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {lab.status === 'COMPLETED' && (
                                                        <button 
                                                            onClick={() => setViewingReport(lab)}
                                                            className="text-teal-600 hover:text-teal-800 text-xs font-bold border border-teal-100 hover:bg-teal-50 px-3 py-1.5 rounded transition-colors inline-flex items-center"
                                                        >
                                                            <FileText className="w-3 h-3 mr-1"/> View
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal for History Rx */}
                {selectedHistoryRx && (
                    <PrescriptionModal 
                        prescription={selectedHistoryRx} 
                        onClose={() => setSelectedHistoryRx(null)} 
                    />
                )}

                {/* Modal for Report Viewer */}
                {viewingReport && (
                    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
                            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold flex items-center"><FileText className="w-5 h-5 mr-2"/> Diagnostic Report</h3>
                                    <p className="text-xs text-slate-400 font-mono mt-1">REF: {viewingReport.id}</p>
                                </div>
                                <button onClick={() => setViewingReport(null)} className="text-slate-400 hover:text-white"><X className="w-6 h-6"/></button>
                            </div>
                            <div className="p-8 bg-white">
                                <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                                     <div>
                                         <h2 className="text-2xl font-bold text-slate-900 uppercase">{viewingReport.labName || 'Diagnostic Center'}</h2>
                                         <p className="text-sm text-slate-500">Pathology & Radiology Services</p>
                                     </div>
                                     <div className="text-right text-sm">
                                         <p><span className="font-bold text-slate-600">Patient:</span> {viewingReport.patientName}</p>
                                         <p><span className="font-bold text-slate-600">Date:</span> {new Date().toLocaleDateString()}</p>
                                     </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="font-bold text-slate-800 mb-2 uppercase text-sm border-b border-slate-200 pb-1">Test Results: {viewingReport.testName}</h4>
                                    <div className="bg-slate-50 p-4 rounded border border-slate-100 font-mono text-sm space-y-2">
                                        <div className="flex justify-between border-b border-slate-200 pb-1 mb-1 font-bold text-slate-500">
                                            <span>PARAMETER</span>
                                            <span>RESULT</span>
                                            <span>REF RANGE</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Haemoglobin</span>
                                            <span className="font-bold">13.5 g/dL</span>
                                            <span className="text-slate-500">12.0 - 15.0</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total WBC</span>
                                            <span className="font-bold">6,500 /cumm</span>
                                            <span className="text-slate-500">4000 - 10000</span>
                                        </div>
                                        <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-xs italic text-slate-500">
                                            Digital Report. {viewingReport.reportUrl === 'mock_report.pdf' ? '(Simulation Data)' : ''}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-center">
                                    {viewingReport.reportUrl && viewingReport.reportUrl !== 'mock_report.pdf' && (
                                        <a 
                                            href={viewingReport.reportUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 inline-block mr-2"
                                        >
                                            Download Original PDF
                                        </a>
                                    )}
                                    <button onClick={() => setViewingReport(null)} className="bg-slate-100 text-slate-700 px-6 py-2 rounded font-bold hover:bg-slate-200 inline-block">
                                        Close Viewer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- DEFAULT LIST VIEW ---
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                    <input 
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" 
                        placeholder="Search by Name, Phone, or ABHA..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => { setFormData(initialFormState); setEditingId(null); setIsAdding(true); }}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center shadow-sm w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4 mr-2"/> Add New Patient
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500">
                        <User className="w-12 h-12 mx-auto mb-3 text-slate-300"/>
                        <p>No patients found. Add a new patient to get started.</p>
                    </div>
                ) : (
                    filteredPatients.map(patient => (
                        <div 
                            key={patient.id} 
                            onClick={() => handleViewProfile(patient)}
                            className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-5 group cursor-pointer relative"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-4 h-4 text-indigo-400"/>
                            </div>
                            
                            <div className="flex items-start mb-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm mr-3 border border-indigo-100">
                                    {patient.fullName.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        <h3 className="font-bold text-slate-800 text-base">{patient.fullName}</h3>
                                        {patient.isAbhaVerified && (
                                            <span title="ABDM Verified" className="flex items-center">
                                                <ShieldCheck className="w-3 h-3 text-green-500"/>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">{patient.gender}, {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Yrs</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-sm text-slate-600 mb-4 pl-1">
                                <div className="flex items-center text-xs"><Phone className="w-3 h-3 mr-2 text-slate-400"/> {patient.phone}</div>
                                {patient.abhaNumber && (
                                    <div className="flex items-center text-xs text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded w-max border border-orange-100">
                                        <ShieldCheck className="w-3 h-3 mr-1"/> {patient.abhaAddress || patient.abhaNumber}
                                    </div>
                                )}
                            </div>

                            {/* Quick Tags */}
                            <div className="flex flex-wrap gap-1">
                                {patient.allergies.length > 0 && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">Allergies</span>}
                                {patient.chronicConditions.length > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold">Chronic</span>}
                                {getPatientPrescriptions(patient).length > 0 && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold">{getPatientPrescriptions(patient).length} Rx</span>}
                                {getPatientLabs(patient).length > 0 && <span className="text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded border border-teal-100 font-bold">{getPatientLabs(patient).length} Labs</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
