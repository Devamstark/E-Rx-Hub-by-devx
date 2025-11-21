
import React, { useState } from 'react';
import { Patient } from '../../types';
import { Plus, Search, User, Calendar, Phone, MapPin, HeartPulse, AlertTriangle, Edit2, Save, X } from 'lucide-react';

interface PatientManagerProps {
    doctorId: string;
    patients: Patient[];
    onAddPatient: (p: Patient) => void;
    onUpdatePatient: (p: Patient) => void;
}

export const PatientManager: React.FC<PatientManagerProps> = ({ doctorId, patients, onAddPatient, onUpdatePatient }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
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
        notes: '',
        registeredAt: new Date().toISOString()
    };

    const [formData, setFormData] = useState<Patient>(initialFormState);
    const [allergyInput, setAllergyInput] = useState('');
    const [conditionInput, setConditionInput] = useState('');

    const handleEdit = (patient: Patient) => {
        setFormData(patient);
        setEditingId(patient.id);
        setIsAdding(true);
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
                    {/* Personal Details */}
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

                    {/* Vitals */}
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

                    {/* Clinical Profile */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Clinical Profile</h3>
                        
                        {/* Allergies */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Known Allergies (Drug/Food)</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    className="flex-1 border p-2 rounded text-sm" 
                                    value={allergyInput} 
                                    onChange={e => setAllergyInput(e.target.value)} 
                                    placeholder="e.g. Penicillin, Peanuts"
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

                        {/* Chronic Conditions */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Chronic Conditions / History</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    className="flex-1 border p-2 rounded text-sm" 
                                    value={conditionInput} 
                                    onChange={e => setConditionInput(e.target.value)} 
                                    placeholder="e.g. Type 2 Diabetes, Hypertension"
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

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Critical Medical Notes</label>
                            <textarea className="w-full border p-2 rounded text-sm" rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any past surgeries, ongoing treatments, or family history..."></textarea>
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
                        <div key={patient.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{patient.fullName}</h3>
                                    <p className="text-xs text-slate-500">{patient.gender}, {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Yrs</p>
                                </div>
                                <button onClick={() => handleEdit(patient)} className="text-slate-400 hover:text-indigo-600 p-1 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit2 className="w-4 h-4"/>
                                </button>
                            </div>
                            
                            <div className="space-y-2 text-sm text-slate-600 mb-4">
                                <div className="flex items-center"><Phone className="w-3 h-3 mr-2 text-slate-400"/> {patient.phone}</div>
                                <div className="flex items-center truncate"><MapPin className="w-3 h-3 mr-2 text-slate-400 shrink-0"/> <span className="truncate">{patient.address || 'No address'}</span></div>
                            </div>

                            <div className="space-y-2">
                                {patient.allergies.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {patient.allergies.slice(0, 3).map(a => (
                                            <span key={a} className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">Allergy: {a}</span>
                                        ))}
                                        {patient.allergies.length > 3 && <span className="text-[10px] text-slate-400">+{patient.allergies.length - 3}</span>}
                                    </div>
                                )}
                                {patient.chronicConditions.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {patient.chronicConditions.slice(0, 3).map(c => (
                                            <span key={c} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{c}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
                                <span>ID: {patient.id}</span>
                                <span>Reg: {new Date(patient.registeredAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
