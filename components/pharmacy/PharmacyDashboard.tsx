
import React, { useState } from 'react';
import { CheckCircle, Eye, Package, Search, Users, ShoppingCart, Plus, Save, Trash2, Stethoscope, BarChart3, ScanBarcode, X, Activity, Clock, FileText, Phone, MapPin, Edit2, Ban, UserPlus, Link2, User, AlertOctagon } from 'lucide-react';
import { Prescription, User as UserType, InventoryItem, DoctorDirectoryEntry, Patient } from '../../types';
import { PrescriptionModal } from '../doctor/PrescriptionModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PharmacyDashboardProps {
    prescriptions: Prescription[];
    onDispense: (id: string, patientId?: string) => void;
    onReject: (id: string, reason?: string) => void;
    currentUser: UserType;
    onUpdateUser: (user: UserType) => void;
    patients: Patient[];
    onAddPatient: (p: Patient) => void;
    onUpdatePatient: (p: Patient) => void;
}

export const PharmacyDashboard: React.FC<PharmacyDashboardProps> = ({ 
    prescriptions, 
    onDispense,
    onReject, 
    currentUser, 
    onUpdateUser,
    patients,
    onAddPatient,
    onUpdatePatient
}) => {
  const [view, setView] = useState<'DASHBOARD' | 'ERX' | 'PATIENTS' | 'INVENTORY' | 'DOCTORS' | 'REPORTS'>('DASHBOARD');
  const [erxTab, setErxTab] = useState<'QUEUE' | 'HISTORY'>('QUEUE');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingRx, setProcessingRx] = useState<Prescription | null>(null);

  // --- Data Filters ---
  const myPrescriptions = prescriptions.filter(p => p.pharmacyId === currentUser.id);
  const queue = myPrescriptions.filter(p => p.status === 'ISSUED');
  const history = myPrescriptions.filter(p => p.status === 'DISPENSED' || p.status === 'REJECTED' || p.status === 'REJECTED_STOCK');
  const dispensedCount = myPrescriptions.filter(p => p.status === 'DISPENSED').length;

  // --- Inventory State ---
  const initialItemState: InventoryItem = {
      id: '', name: '', manufacturer: '', batchNumber: '', barcode: '', expiryDate: '', stock: 0, minStockLevel: 10, purchasePrice: 0, mrp: 0, isNarcotic: false
  };
  const [newItem, setNewItem] = useState<InventoryItem>(initialItemState);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');

  // --- Doctor Directory State ---
  const [newDoc, setNewDoc] = useState<DoctorDirectoryEntry>({ id: '', name: '', hospital: '', phone: '', email: '', address: '', specialty: '' });
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);

  // --- Patient Edit State ---
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatientProfile, setViewingPatientProfile] = useState<Patient | null>(null);

  // --- CALCULATIONS FOR REPORTS ---
  const inventory = currentUser.inventory || [];
  const totalInventoryValue = inventory.reduce((acc, item) => acc + (item.purchasePrice * item.stock), 0);
  const lowStockItems = inventory.filter(i => i.stock <= i.minStockLevel);

  const financialData = [
      { name: 'Revenue', value: dispensedCount * 150, fill: '#10b981' },
      { name: 'Cost', value: dispensedCount * 100, fill: '#ef4444' },
  ];

  // --- HANDLERS ---

  const handleAddInventory = () => {
      if(!newItem.name || !newItem.stock || !newItem.mrp) return;
      const inventory = currentUser.inventory || [];
      const itemToAdd = { ...newItem, id: `inv-${Date.now()}` };
      onUpdateUser({
          ...currentUser,
          inventory: [...inventory, itemToAdd]
      });
      setNewItem(initialItemState);
      setIsAddItemOpen(false);
  };

  const handleDeleteInventory = (itemId: string) => {
      const inventory = currentUser.inventory || [];
      onUpdateUser({
          ...currentUser,
          inventory: inventory.filter(i => i.id !== itemId)
      });
  };

  const handleAddDoctor = () => {
      if(!newDoc.name) return;
      const directory = currentUser.doctorDirectory || [];
      const docToAdd = { ...newDoc, id: `doc-dir-${Date.now()}` };
      onUpdateUser({
          ...currentUser,
          doctorDirectory: [...directory, docToAdd]
      });
      setNewDoc({ id: '', name: '', hospital: '', phone: '', email: '', address: '', specialty: '' });
      setIsAddDocOpen(false);
  };

  const handleDeleteDoctor = (docId: string) => {
      const directory = currentUser.doctorDirectory || [];
      onUpdateUser({
          ...currentUser,
          doctorDirectory: directory.filter(d => d.id !== docId)
      });
  };

  const handleUpdatePatientProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingPatient) {
          onUpdatePatient(editingPatient);
          setEditingPatient(null);
      }
  };

  // Filter Patients: Only show patients who have prescriptions dispensed by THIS pharmacy
  // Logic: Get all unique patientIds from 'myPrescriptions' where status is DISPENSED
  const myPatientIds = Array.from(new Set(myPrescriptions.map(p => p.patientId).filter(Boolean)));
  // Also include patients matching by name if ID is missing (legacy support)
  const myPatientNames = Array.from(new Set(myPrescriptions.map(p => p.patientName)));
  
  const myPatients = patients.filter(p => 
      myPatientIds.includes(p.id) || myPatientNames.includes(p.fullName)
  );

  // --- MODAL: PROCESS PRESCRIPTION (PATIENT MATCH) ---
  const ProcessRxModal = () => {
      if (!processingRx) return null;

      // Find potential matches
      const matches = patients.filter(p => 
          p.fullName.toLowerCase() === processingRx.patientName.toLowerCase() ||
          (p.id === processingRx.patientId)
      );

      // Form state for New Patient
      const [mode, setMode] = useState<'MATCH' | 'CREATE'>(matches.length > 0 ? 'MATCH' : 'CREATE');
      const [selectedMatchId, setSelectedMatchId] = useState<string | null>(matches.length > 0 ? matches[0].id : null);
      
      // Auto-fill logic for new patient
      const [newPatientData, setNewPatientData] = useState<Partial<Patient>>({
          fullName: processingRx.patientName,
          gender: processingRx.patientGender,
          // Estimate DOB from Age if not provided in Rx (Rx usually has age)
          dateOfBirth: new Date(new Date().getFullYear() - processingRx.patientAge, 0, 1).toISOString().split('T')[0], 
          phone: '',
          address: '',
          chronicConditions: processingRx.diagnosis ? [processingRx.diagnosis] : []
      });

      const handleConfirmDispense = () => {
          if (mode === 'MATCH' && selectedMatchId) {
              onDispense(processingRx.id, selectedMatchId);
              setProcessingRx(null);
          } else if (mode === 'CREATE') {
              if (!newPatientData.phone) {
                  alert("Phone number is required for new patient.");
                  return;
              }
              const newId = `PAT-${Date.now()}`;
              const newPatient: Patient = {
                  id: newId,
                  doctorId: processingRx.doctorId, // Linked to prescribing doctor
                  fullName: newPatientData.fullName || '',
                  dateOfBirth: newPatientData.dateOfBirth || '',
                  gender: newPatientData.gender as any,
                  phone: newPatientData.phone,
                  address: newPatientData.address || '',
                  bloodGroup: '',
                  height: '',
                  weight: '',
                  allergies: [],
                  chronicConditions: newPatientData.chronicConditions || [],
                  registeredAt: new Date().toISOString(),
                  documents: []
              };
              onAddPatient(newPatient);
              onDispense(processingRx.id, newId);
              setProcessingRx(null);
          }
      };

      return (
          <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-indigo-900 p-4 flex justify-between items-center">
                      <h3 className="text-white font-bold flex items-center">
                          <Package className="w-5 h-5 mr-2"/> Process Dispensing: Rx #{processingRx.id}
                      </h3>
                      <button onClick={() => setProcessingRx(null)} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="p-6">
                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-md mb-6 flex justify-between items-center">
                          <div>
                              <p className="text-xs font-bold text-indigo-800 uppercase">Incoming Patient Data</p>
                              <p className="font-bold text-slate-900">{processingRx.patientName}</p>
                              <p className="text-xs text-slate-600">{processingRx.patientGender}, {processingRx.patientAge} Years</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs font-bold text-indigo-800 uppercase">Diagnosis</p>
                              <p className="text-sm text-slate-900 font-medium">{processingRx.diagnosis}</p>
                          </div>
                      </div>

                      <div className="flex gap-2 mb-6 border-b border-slate-200">
                          <button 
                            onClick={() => setMode('MATCH')}
                            className={`pb-2 px-4 text-sm font-bold transition-colors border-b-2 ${mode === 'MATCH' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                          >
                              Existing Patient ({matches.length})
                          </button>
                          <button 
                            onClick={() => setMode('CREATE')}
                            className={`pb-2 px-4 text-sm font-bold transition-colors border-b-2 ${mode === 'CREATE' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                          >
                              Create New Profile
                          </button>
                      </div>

                      {mode === 'MATCH' ? (
                          <div className="space-y-3 min-h-[200px]">
                              {matches.length > 0 ? (
                                  matches.map(m => (
                                      <label key={m.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedMatchId === m.id ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                                          <input 
                                            type="radio" 
                                            name="match" 
                                            checked={selectedMatchId === m.id} 
                                            onChange={() => setSelectedMatchId(m.id)}
                                            className="mr-3 h-4 w-4 text-indigo-600"
                                          />
                                          <div className="flex-1">
                                              <p className="font-bold text-slate-900">{m.fullName}</p>
                                              <p className="text-xs text-slate-500">{m.phone} • {m.gender}</p>
                                          </div>
                                          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">{m.id}</span>
                                      </label>
                                  ))
                              ) : (
                                  <div className="text-center py-8 text-slate-500">
                                      <Search className="w-12 h-12 mx-auto mb-2 text-slate-300"/>
                                      <p>No matches found in your database.</p>
                                      <button onClick={() => setMode('CREATE')} className="text-teal-600 font-bold text-sm mt-2 hover:underline">Create New Profile &rarr;</button>
                                  </div>
                              )}
                          </div>
                      ) : (
                          <div className="space-y-4 animate-in fade-in">
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                      <input className="w-full border border-slate-300 rounded p-2 text-sm bg-slate-50" value={newPatientData.fullName} readOnly />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number *</label>
                                      <input className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="Enter Phone" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} autoFocus />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Date of Birth</label>
                                      <input type="date" className="w-full border border-slate-300 rounded p-2 text-sm" value={newPatientData.dateOfBirth} onChange={e => setNewPatientData({...newPatientData, dateOfBirth: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Gender</label>
                                      <select className="w-full border border-slate-300 rounded p-2 text-sm" value={newPatientData.gender} onChange={e => setNewPatientData({...newPatientData, gender: e.target.value as any})}>
                                          <option value="Male">Male</option>
                                          <option value="Female">Female</option>
                                          <option value="Other">Other</option>
                                      </select>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                                  <input className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="Enter Address" value={newPatientData.address} onChange={e => setNewPatientData({...newPatientData, address: e.target.value})} />
                              </div>
                              <div className="bg-amber-50 p-3 rounded border border-amber-100 text-xs text-amber-800">
                                  <p><strong>Note:</strong> This will create a new permanent patient profile in your pharmacy database and link this prescription to it.</p>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
                      <button onClick={() => setProcessingRx(null)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded">Cancel</button>
                      <button 
                        onClick={handleConfirmDispense}
                        disabled={mode === 'MATCH' && !selectedMatchId}
                        className="bg-green-600 text-white px-6 py-2 rounded font-bold text-sm hover:bg-green-700 shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <CheckCircle className="w-4 h-4 mr-2"/> Confirm & Dispense
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Pharmacy Operations</h1>
            <p className="text-slate-500 text-sm">License: <span className="font-mono font-medium text-slate-700">{currentUser.licenseNumber}</span></p>
        </div>
        <div className="flex gap-6">
            <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Inventory Value</p>
                <p className="text-lg font-bold text-indigo-600">₹{totalInventoryValue.toLocaleString()}</p>
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Low Stock Alerts</p>
                <p className={`text-lg font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-green-600'}`}>{lowStockItems.length}</p>
            </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
          {[
              { id: 'DASHBOARD', label: 'Dashboard', icon: Activity },
              { id: 'ERX', label: 'E-Rx Management', icon: Package },
              { id: 'PATIENTS', label: 'Patient Profiles', icon: Users },
              { id: 'INVENTORY', label: 'Inventory', icon: ShoppingCart },
              { id: 'DOCTORS', label: 'Doctors', icon: Stethoscope },
              { id: 'REPORTS', label: 'Reports', icon: BarChart3 },
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`px-4 py-3 rounded-lg text-sm font-bold flex items-center whitespace-nowrap transition-all border ${
                    view === tab.id 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2"/> {tab.label}
              </button>
          ))}
      </div>

      {/* === VIEW: DASHBOARD (Stats) === */}
      {view === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-xs font-bold text-slate-500 uppercase">New E-Rx Pending</p>
                          <h3 className="text-3xl font-bold text-slate-900 mt-2">{queue.length}</h3>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg"><Package className="w-6 h-6 text-blue-600"/></div>
                  </div>
                  <div className="mt-4">
                      <button onClick={() => setView('ERX')} className="text-sm text-blue-600 font-bold hover:underline">View Queue &rarr;</button>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-xs font-bold text-slate-500 uppercase">Processed Today</p>
                          <h3 className="text-3xl font-bold text-green-600 mt-2">{history.filter(h => new Date(h.date).toDateString() === new Date().toDateString()).length}</h3>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600"/></div>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-xs font-bold text-slate-500 uppercase">My Patients</p>
                          <h3 className="text-3xl font-bold text-indigo-600 mt-2">{myPatients.length}</h3>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded-lg"><Users className="w-6 h-6 text-indigo-600"/></div>
                  </div>
                  <div className="mt-4">
                      <button onClick={() => setView('PATIENTS')} className="text-sm text-indigo-600 font-bold hover:underline">Manage Profiles &rarr;</button>
                  </div>
              </div>
          </div>
      )}

      {/* === VIEW: E-RX MANAGEMENT === */}
      {view === 'ERX' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex bg-slate-100 p-1 rounded-lg w-max border border-slate-200">
                  <button 
                    onClick={() => setErxTab('QUEUE')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${erxTab === 'QUEUE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      Pending Queue ({queue.length})
                  </button>
                  <button 
                    onClick={() => setErxTab('HISTORY')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${erxTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      History Log
                  </button>
              </div>

              {erxTab === 'QUEUE' && (
                  <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Patient Details</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Medicines (Rx)</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {queue.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-3" />
                                        <p className="text-lg font-medium text-slate-600">Queue Empty</p>
                                        <p className="text-sm text-slate-400">No pending prescriptions to process.</p>
                                    </td>
                                </tr>
                            ) : (
                                queue.map((rx) => (
                                <tr key={rx.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(rx.date).toLocaleDateString()}
                                        <span className="block text-xs text-slate-400">{new Date(rx.date).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm font-bold text-slate-900">{rx.patientName}</p>
                                        <p className="text-xs text-slate-500">{rx.patientGender}, {rx.patientAge} Yrs</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        <div className="font-medium">Dr. {rx.doctorName}</div>
                                        <div className="text-xs text-slate-400">ID: {rx.doctorId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {rx.medicines.map(m => m.name).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => onReject(rx.id, 'REJECTED_STOCK')}
                                                className="text-amber-600 hover:text-amber-800 px-3 py-1.5 rounded border border-amber-200 hover:bg-amber-50 transition-colors text-xs flex items-center"
                                                title="Out of Stock"
                                            >
                                                <AlertOctagon className="w-3 h-3 mr-1"/> No Stock
                                            </button>
                                            <button 
                                                onClick={() => onReject(rx.id, 'REJECTED')}
                                                className="text-red-600 hover:text-red-800 px-3 py-1.5 rounded border border-red-200 hover:bg-red-50 transition-colors text-xs"
                                                title="Reject Prescription"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => setProcessingRx(rx)}
                                                className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded shadow-sm flex items-center ml-auto transition-colors"
                                            >
                                                Process
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                ))
                            )}
                        </tbody>
                        </table>
                    </div>
                  </div>
              )}

              {erxTab === 'HISTORY' && (
                  <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Processed Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Rx ID</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Patient</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Doctor</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                              {history.length === 0 ? (
                                  <tr>
                                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">No history available.</td>
                                  </tr>
                              ) : (
                                  history.map((rx) => (
                                      <tr key={rx.id} className="hover:bg-slate-50">
                                          <td className="px-6 py-4 text-xs text-slate-500">{new Date(rx.date).toLocaleDateString()}</td>
                                          <td className="px-6 py-4 text-xs font-mono text-slate-400">{rx.id}</td>
                                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{rx.patientName}</td>
                                          <td className="px-6 py-4 text-sm text-slate-600">Dr. {rx.doctorName}</td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                                  rx.status === 'DISPENSED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                  rx.status === 'REJECTED_STOCK' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                  'bg-red-50 text-red-700 border-red-200'
                                              }`}>
                                                  {rx.status === 'REJECTED_STOCK' ? 'OUT OF STOCK' : rx.status}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              <button onClick={() => setSelectedRx(rx)} className="text-indigo-600 hover:underline text-xs font-bold">View Receipt</button>
                                          </td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      )}

      {/* === VIEW: PATIENT PROFILES === */}
      {view === 'PATIENTS' && (
          <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-800">Pharmacy Patient Directory</h3>
                 <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Search by Name or Phone..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-72 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                 </div>
             </div>
             <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-white">
                     <tr>
                         <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Contact</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Vitals</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Last Visit</th>
                         <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Manage</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                     {myPatients.filter(p => 
                        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.phone.includes(searchTerm)
                     ).map((p) => (
                         <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4">
                                 <div className="flex items-center">
                                     <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3">
                                         {p.fullName.charAt(0)}
                                     </div>
                                     <div>
                                         <p className="text-sm font-bold text-slate-900">{p.fullName}</p>
                                         <p className="text-xs text-slate-500">{p.gender}, {new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()} Yrs</p>
                                     </div>
                                 </div>
                             </td>
                             <td className="px-6 py-4 text-sm text-slate-600">
                                 <div className="flex items-center text-xs"><Phone className="w-3 h-3 mr-1 text-slate-400"/> {p.phone}</div>
                             </td>
                             <td className="px-6 py-4 text-xs text-slate-600">
                                 {p.bloodGroup && <span className="bg-red-50 text-red-700 px-1.5 rounded border border-red-100 mr-1">{p.bloodGroup}</span>}
                                 {p.height && <span className="text-slate-500">{p.height}cm</span>} 
                                 {p.weight && <span className="text-slate-500">, {p.weight}kg</span>}
                             </td>
                             <td className="px-6 py-4 text-xs text-slate-500">
                                 {myPrescriptions.filter(rx => rx.patientId === p.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] 
                                    ? new Date(myPrescriptions.filter(rx => rx.patientId === p.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString()
                                    : 'N/A'
                                 }
                             </td>
                             <td className="px-6 py-4 text-right">
                                 <button 
                                    onClick={() => setEditingPatient(p)} 
                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors"
                                 >
                                     View / Edit
                                 </button>
                             </td>
                         </tr>
                     ))}
                     {myPatients.length === 0 && (
                         <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No patients associated with dispensed prescriptions yet.</td></tr>
                     )}
                 </tbody>
             </table>
          </div>
      )}

      {/* === VIEW: INVENTORY === */}
      {view === 'INVENTORY' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              {/* Add Item Card */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Inventory Master</h3>
                            <p className="text-xs text-slate-500">Manage stock, pricing, and batch details.</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <ScanBarcode className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
                                <input 
                                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-48 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Scan Barcode..."
                                    value={barcodeInput}
                                    onChange={e => setBarcodeInput(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => setIsAddItemOpen(!isAddItemOpen)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2"/> Add Item
                            </button>
                        </div>
                   </div>

                   {isAddItemOpen && (
                       <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6 animate-in fade-in slide-in-from-top-2">
                           <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider border-b border-slate-200 pb-2">New Product Entry</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                               <div className="col-span-2">
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Medicine Name *</label>
                                   <input className="w-full border p-2 rounded text-sm" placeholder="e.g. Dolo 650" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
                               </div>
                               <div className="col-span-2">
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Manufacturer</label>
                                   <input className="w-full border p-2 rounded text-sm" placeholder="e.g. Micro Labs" value={newItem.manufacturer} onChange={(e) => setNewItem({...newItem, manufacturer: e.target.value})} />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Batch No.</label>
                                   <input className="w-full border p-2 rounded text-sm" placeholder="B-123" value={newItem.batchNumber} onChange={(e) => setNewItem({...newItem, batchNumber: e.target.value})} />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Expiry Date</label>
                                   <input type="date" className="w-full border p-2 rounded text-sm" value={newItem.expiryDate} onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})} />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Purchase Price (₹)</label>
                                   <input type="number" className="w-full border p-2 rounded text-sm" value={newItem.purchasePrice || ''} onChange={(e) => setNewItem({...newItem, purchasePrice: parseFloat(e.target.value)})} />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">MRP (₹) *</label>
                                   <input type="number" className="w-full border p-2 rounded text-sm" value={newItem.mrp || ''} onChange={(e) => setNewItem({...newItem, mrp: parseFloat(e.target.value)})} />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Stock Qty *</label>
                                   <input type="number" className="w-full border p-2 rounded text-sm" value={newItem.stock || ''} onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value)})} />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Min Stock Alert</label>
                                   <input type="number" className="w-full border p-2 rounded text-sm" value={newItem.minStockLevel} onChange={(e) => setNewItem({...newItem, minStockLevel: parseInt(e.target.value)})} />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Barcode</label>
                                   <input className="w-full border p-2 rounded text-sm" placeholder="Scanned Code" value={newItem.barcode || ''} onChange={(e) => setNewItem({...newItem, barcode: e.target.value})} />
                               </div>
                               <div className="flex items-center pt-6">
                                   <input type="checkbox" id="narc" className="mr-2" checked={newItem.isNarcotic} onChange={(e) => setNewItem({...newItem, isNarcotic: e.target.checked})} />
                                   <label htmlFor="narc" className="text-sm font-bold text-red-600">Narcotic / Controlled?</label>
                               </div>
                           </div>
                           <div className="flex justify-end gap-2">
                               <button onClick={() => setIsAddItemOpen(false)} className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded">Cancel</button>
                               <button onClick={handleAddInventory} className="bg-green-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-green-700 flex items-center shadow-sm">
                                   <Save className="w-4 h-4 mr-2"/> Save Product
                               </button>
                           </div>
                       </div>
                   )}

                   <div className="overflow-x-auto border border-slate-200 rounded-lg">
                       <table className="min-w-full divide-y divide-slate-200">
                           <thead className="bg-slate-50">
                               <tr>
                                   <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Product Details</th>
                                   <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Batch Info</th>
                                   <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Pricing (₹)</th>
                                   <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Stock Level</th>
                                   <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Action</th>
                               </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-slate-200">
                               {(!currentUser.inventory || currentUser.inventory.length === 0) ? (
                                   <tr>
                                       <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Inventory is empty.</td>
                                   </tr>
                               ) : (
                                   currentUser.inventory.map(item => (
                                       <tr key={item.id} className="hover:bg-slate-50">
                                           <td className="px-4 py-3">
                                               <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                               <p className="text-xs text-slate-500">{item.manufacturer}</p>
                                               {item.isNarcotic && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 mt-1 inline-block">NARCOTIC</span>}
                                           </td>
                                           <td className="px-4 py-3 text-xs text-slate-600">
                                               <p>Batch: <span className="font-mono">{item.batchNumber || '-'}</span></p>
                                               <p>Exp: <span className="font-medium text-slate-800">{item.expiryDate || '-'}</span></p>
                                           </td>
                                           <td className="px-4 py-3 text-right">
                                               <p className="text-sm font-bold text-slate-800">MRP: {item.mrp}</p>
                                               <p className="text-xs text-slate-400">Buy: {item.purchasePrice}</p>
                                           </td>
                                           <td className="px-4 py-3 text-right">
                                               <p className={`text-sm font-bold ${item.stock <= item.minStockLevel ? 'text-red-600' : 'text-green-600'}`}>{item.stock} Units</p>
                                           </td>
                                           <td className="px-4 py-3 text-center">
                                               <button 
                                                onClick={() => handleDeleteInventory(item.id)}
                                                className="text-slate-400 hover:text-red-600 p-2"
                                               >
                                                   <Trash2 className="w-4 h-4"/>
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
      )}

      {/* === VIEW: DOCTOR DIRECTORY === */}
      {view === 'DOCTORS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h3 className="font-bold text-slate-800 text-lg">Doctor Directory</h3>
                          <p className="text-xs text-slate-500">Manage contacts for verification and queries.</p>
                      </div>
                      <button 
                        onClick={() => setIsAddDocOpen(!isAddDocOpen)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center transition-colors"
                      >
                          <Plus className="w-4 h-4 mr-2"/> Add Contact
                      </button>
                  </div>

                  {isAddDocOpen && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6">
                          <h4 className="text-sm font-bold text-indigo-900 mb-3">New Doctor Contact</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <input className="border p-2 rounded text-sm" placeholder="Doctor Name *" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} />
                              <input className="border p-2 rounded text-sm" placeholder="Specialty" value={newDoc.specialty} onChange={e => setNewDoc({...newDoc, specialty: e.target.value})} />
                              <input className="border p-2 rounded text-sm" placeholder="Hospital / Clinic" value={newDoc.hospital} onChange={e => setNewDoc({...newDoc, hospital: e.target.value})} />
                              <input className="border p-2 rounded text-sm" placeholder="Phone" value={newDoc.phone} onChange={e => setNewDoc({...newDoc, phone: e.target.value})} />
                              <input className="border p-2 rounded text-sm" placeholder="Email" value={newDoc.email} onChange={e => setNewDoc({...newDoc, email: e.target.value})} />
                              <input className="border p-2 rounded text-sm" placeholder="Address" value={newDoc.address} onChange={e => setNewDoc({...newDoc, address: e.target.value})} />
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                              <button onClick={() => setIsAddDocOpen(false)} className="text-sm text-slate-500 px-3 py-1 font-medium">Cancel</button>
                              <button onClick={handleAddDoctor} className="bg-indigo-600 text-white px-4 py-1 rounded text-sm font-bold">Save</button>
                          </div>
                      </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentUser.doctorDirectory?.map(doc => (
                          <div key={doc.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all relative group">
                              <button onClick={() => handleDeleteDoctor(doc.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X className="w-4 h-4"/></button>
                              <div className="flex items-center mb-3">
                                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3">
                                      <Stethoscope className="w-5 h-5"/>
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-900">{doc.name}</h4>
                                      <p className="text-xs text-indigo-600 font-medium">{doc.specialty}</p>
                                  </div>
                              </div>
                              <div className="text-xs text-slate-600 space-y-1">
                                  <p>{doc.hospital}</p>
                                  <p className="flex items-center"><span className="font-bold w-12">Phone:</span> {doc.phone}</p>
                                  <p className="flex items-center"><span className="font-bold w-12">Email:</span> {doc.email}</p>
                              </div>
                          </div>
                      ))}
                      {(!currentUser.doctorDirectory || currentUser.doctorDirectory.length === 0) && (
                          <div className="col-span-full text-center py-8 text-slate-400 italic">No doctor contacts added yet.</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* === VIEW: REPORTS === */}
      {view === 'REPORTS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Financials */}
                  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-6">Financial Overview</h3>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={financialData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                                    {financialData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="mt-4 flex justify-between text-sm border-t border-slate-100 pt-4">
                          <div>
                              <p className="text-slate-500 text-xs font-bold uppercase">Est. Revenue</p>
                              <p className="font-bold text-green-600">₹{(dispensedCount * 150).toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-slate-500 text-xs font-bold uppercase">Est. Cost</p>
                              <p className="font-bold text-red-500">₹{(dispensedCount * 100).toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-slate-500 text-xs font-bold uppercase">Net Profit</p>
                              <p className="font-bold text-indigo-700">₹{(dispensedCount * 50).toLocaleString()}</p>
                          </div>
                      </div>
                  </div>

                  {/* Recent Log */}
                  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4">Recent Activity Log</h3>
                      <div className="space-y-0 overflow-y-auto h-64 pr-2 divide-y divide-slate-100">
                          {myPrescriptions.slice(0, 10).map((rx, i) => (
                              <div key={i} className="py-3 flex justify-between items-center">
                                  <div>
                                      <p className="text-xs font-bold text-slate-700">Rx #{rx.id}</p>
                                      <p className="text-[10px] text-slate-500">{new Date(rx.date).toLocaleString()}</p>
                                  </div>
                                  <div className="text-right">
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                                          rx.status === 'DISPENSED' ? 'bg-green-50 text-green-700 border-green-100' : 
                                          rx.status === 'REJECTED_STOCK' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                          rx.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' : 
                                          'bg-blue-50 text-blue-700 border-blue-100'
                                      }`}>
                                          {rx.status === 'REJECTED_STOCK' ? 'OUT OF STOCK' : rx.status}
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Patient Edit Modal */}
      {editingPatient && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center">
                          <Edit2 className="w-5 h-5 mr-2 text-indigo-600"/> Edit Patient Profile
                      </h3>
                      <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                  </div>
                  <form onSubmit={handleUpdatePatientProfile} className="space-y-4">
                      <div className="bg-amber-50 p-3 rounded border border-amber-100 text-xs text-amber-800 mb-4">
                          Note: You can update demographics (Address, Phone, Vitals). Clinical history is managed by Doctors.
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Name</label>
                          <input disabled className="w-full border bg-slate-50 p-2 rounded text-sm text-slate-500" value={editingPatient.fullName} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                              <input className="w-full border p-2 rounded text-sm" value={editingPatient.phone} onChange={e => setEditingPatient({...editingPatient, phone: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Blood Group</label>
                              <input className="w-full border p-2 rounded text-sm" value={editingPatient.bloodGroup || ''} onChange={e => setEditingPatient({...editingPatient, bloodGroup: e.target.value})} />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Height (cm)</label>
                              <input className="w-full border p-2 rounded text-sm" value={editingPatient.height || ''} onChange={e => setEditingPatient({...editingPatient, height: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weight (kg)</label>
                              <input className="w-full border p-2 rounded text-sm" value={editingPatient.weight || ''} onChange={e => setEditingPatient({...editingPatient, weight: e.target.value})} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                          <input className="w-full border p-2 rounded text-sm" value={editingPatient.address} onChange={e => setEditingPatient({...editingPatient, address: e.target.value})} />
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                          <button type="button" onClick={() => setEditingPatient(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded">Cancel</button>
                          <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm">Save Changes</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <ProcessRxModal />

      {/* Detailed Prescription Modal */}
      {selectedRx && (
          <PrescriptionModal 
            prescription={selectedRx} 
            onClose={() => setSelectedRx(null)} 
            onDispense={(id) => onDispense(id)}
            isPharmacy={true}
          />
      )}
    </div>
  );
};
