
import React, { useState } from 'react';
import { Patient, Prescription, UserDocument } from '../../types';
import { Plus, Search, User, Calendar, Phone, MapPin, HeartPulse, AlertTriangle, Edit2, Save, X, FileText, ArrowLeft, ExternalLink, Clock, CheckCircle, Stethoscope, Activity } from 'lucide-react';
import { PrescriptionModal } from './PrescriptionModal';

interface PatientManagerProps {
    doctorId: string;
    patients: Patient[];
    onAddPatient: (p: Patient) => void;
    onUpdatePatient: (p: Patient) => void;
    prescriptions?: Prescription[];
}

export const PatientManager: React.FC<PatientManagerProps> = ({ doctorId, patients, onAddPatient, onUpdatePatient, prescriptions = [] }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHistoryRx, setSelectedHistoryRx] = useState<Prescription | null>(null);
    
    // Filter patients for this doctor
    const myPatients = patients.filter(p => p.doctorId === doctorId);
    
    const filteredPatients = myPatients.filter(p => 
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm)
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
        setViewingPatient(null); // Switch from view to edit
    };

    const handleViewProfile = (patient: Patient) => {
        setViewingPatient(patient);
        setIsAdding(false);
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
                                <span className="font-mono text-xs bg-slate-200 px-2 rounded">ID: {viewingPatient.id}</span>
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
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Physical Vitals</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-slate-500">Height:</span> <span className="font-medium">{viewingPatient.height || '-'} cm</span></div>
                                    <div><span className="text-slate-500">Weight:</span> <span className="font-medium">{viewingPatient.weight || '-'} kg</span></div>
                                    <div><span className="text-slate-500">Blood:</span> <span className="font-medium text-red-600">{viewingPatient.bloodGroup || '-'}</span></div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Emergency Contact</p>
                                <p className="text-sm font-medium text-slate-900">{viewingPatient.emergencyContact || 'Not Provided'}</p>
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
                </div>

                {/* Modal for History Rx */}
                {selectedHistoryRx && (
                    <PrescriptionModal 
                        prescription={selectedHistoryRx} 
                        onClose={() => setSelectedHistoryRx(null)} 
                    />
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
                        placeholder="Search by Name or Phone..."
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
                                    <h3 className="font-bold text-slate-800 text-base">{patient.fullName}</h3>
                                    <p className="text-xs text-slate-500">{patient.gender}, {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Yrs</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-sm text-slate-600 mb-4 pl-1">
                                <div className="flex items-center text-xs"><Phone className="w-3 h-3 mr-2 text-slate-400"/> {patient.phone}</div>
                                <div className="flex items-center truncate text-xs"><MapPin className="w-3 h-3 mr-2 text-slate-400 shrink-0"/> <span className="truncate">{patient.address || 'No address'}</span></div>
                            </div>

                            {/* Quick Tags */}
                            <div className="flex flex-wrap gap-1">
                                {patient.allergies.length > 0 && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">Allergies</span>}
                                {patient.chronicConditions.length > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold">Chronic</span>}
                                {getPatientPrescriptions(patient).length > 0 && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold">{getPatientPrescriptions(patient).length} Rx</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
