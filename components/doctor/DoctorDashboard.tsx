
import React, { useState, useMemo } from 'react';
import { DoctorProfile, VerificationStatus, Prescription, User, Patient, LabReferral, Appointment, MedicalCertificate } from '../../types';
import { DoctorVerification } from './DoctorVerification';
import { CreatePrescription } from './CreatePrescription';
import { ClipboardList, User as UserIcon, History, Bell, Eye, Users, BarChart3, Calculator, Activity, TrendingUp, Scale, Baby, TestTube, FileBarChart, CheckCircle2, Clock, Send, Microscope, FileText, X, Calendar, Video, FileBadge, CheckSquare, BadgeCheck, Plus, Trash2 } from 'lucide-react';
import { PrescriptionModal } from './PrescriptionModal';
import { PatientManager } from './PatientManager';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DoctorDashboardProps {
  status: VerificationStatus;
  onVerificationComplete: (p: DoctorProfile) => void;
  prescriptions: Prescription[];
  onCreatePrescription: (rx: Prescription) => void;
  currentUser: User;
  verifiedPharmacies: User[];
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  onUpdatePatient: (p: Patient) => void;
  labReferrals?: LabReferral[];
  onAddLabReferral?: (ref: LabReferral) => void;
  appointments?: Appointment[];
  onUpdateAppointment?: (apt: Appointment) => void;
  onAddAppointment?: (apt: Appointment) => void;
  onDeleteAppointment?: (id: string) => void;
  certificates?: MedicalCertificate[];
  onAddCertificate?: (cert: MedicalCertificate) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ 
    status, 
    onVerificationComplete,
    prescriptions,
    onCreatePrescription,
    currentUser,
    verifiedPharmacies,
    patients,
    onAddPatient,
    onUpdatePatient,
    labReferrals = [],
    onAddLabReferral,
    appointments = [],
    onUpdateAppointment,
    onAddAppointment,
    onDeleteAppointment,
    certificates = [],
    onAddCertificate
}) => {
  const [view, setView] = useState<'NEW_RX' | 'HISTORY' | 'PATIENTS' | 'ANALYTICS' | 'TOOLS' | 'LABS' | 'APPOINTMENTS' | 'CERTIFICATES'>('APPOINTMENTS');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [consultPatient, setConsultPatient] = useState<Patient | null>(null);

  // Filter prescriptions for this specific doctor
  const myPrescriptions = prescriptions.filter(p => p.doctorId === currentUser.id);
  const myPatients = patients.filter(p => p.doctorId === currentUser.id);
  const myReferrals = labReferrals.filter(l => l.doctorId === currentUser.id);
  const myAppointments = appointments.filter(a => a.doctorId === currentUser.id);
  const myCertificates = certificates.filter(c => c.doctorId === currentUser.id);

  // --- APPOINTMENTS LOGIC ---
  const [showAptForm, setShowAptForm] = useState(false);
  const [newApt, setNewApt] = useState<Partial<Appointment>>({ type: 'VISIT' });

  const todaysAppointments = myAppointments.filter(a => 
    new Date(a.date).toDateString() === new Date().toDateString()
  ).sort((a,b) => a.timeSlot.localeCompare(b.timeSlot));

  const handleStartConsult = (apt: Appointment) => {
      // 1. Update status
      if (onUpdateAppointment) {
          onUpdateAppointment({ ...apt, status: 'IN_CONSULT' });
      }
      // 2. Find patient
      const p = myPatients.find(p => p.id === apt.patientId);
      if (p) {
          setConsultPatient(p);
          setView('NEW_RX');
      }
  };

  const handleCancelApt = (apt: Appointment) => {
      if (confirm("Cancel this appointment?") && onUpdateAppointment) {
          onUpdateAppointment({ ...apt, status: 'CANCELLED' });
      }
  };

  const handleDeleteApt = (id: string) => {
      if (confirm("Are you sure you want to permanently delete this appointment?")) {
          if (onDeleteAppointment) onDeleteAppointment(id);
      }
  };

  const handleScheduleApt = () => {
      if (!onAddAppointment || !newApt.patientId || !newApt.date || !newApt.timeSlot) {
          alert("Please select a Patient, Date, and Time Slot.");
          return;
      }
      
      const p = myPatients.find(pat => pat.id === newApt.patientId);
      if (!p) return;

      const apt: Appointment = {
          id: `APT-${Date.now()}`,
          doctorId: currentUser.id,
          patientId: p.id,
          patientName: p.fullName,
          patientGender: p.gender,
          patientAge: new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear(),
          date: newApt.date, 
          timeSlot: newApt.timeSlot,
          status: 'SCHEDULED',
          type: newApt.type as any || 'VISIT',
          reason: newApt.reason || 'Check-up'
      };

      onAddAppointment(apt);
      setShowAptForm(false);
      setNewApt({ type: 'VISIT' });
      alert("Appointment Scheduled Successfully!");
  };

  // --- CERTIFICATES LOGIC ---
  const [showCertForm, setShowCertForm] = useState(false);
  const [certData, setCertData] = useState<Partial<MedicalCertificate>>({});
  const [printingCert, setPrintingCert] = useState<MedicalCertificate | null>(null);

  const handleCreateCert = () => {
      if (!onAddCertificate || !certData.patientId || !certData.type || !certData.remarks) return;
      const p = myPatients.find(pat => pat.id === certData.patientId);
      if (!p) return;

      const newCert: MedicalCertificate = {
          id: `CERT-${Date.now()}`,
          doctorId: currentUser.id,
          patientId: p.id,
          patientName: p.fullName,
          type: certData.type,
          issueDate: new Date().toISOString(),
          startDate: certData.startDate,
          endDate: certData.endDate,
          diagnosis: certData.diagnosis,
          remarks: certData.remarks,
          restDays: certData.restDays
      };
      
      onAddCertificate(newCert);
      setCertData({});
      setShowCertForm(false);
      setPrintingCert(newCert); // Auto open for print
  };

  // Lab State
  const [selectedLabPatient, setSelectedLabPatient] = useState('');
  const [labTestName, setLabTestName] = useState('');
  const [preferredLab, setPreferredLab] = useState('');
  const [labNotes, setLabNotes] = useState('');
  const [viewingReport, setViewingReport] = useState<LabReferral | null>(null);

  // --- ANALYTICS DATA PREP ---
  const analyticsData = useMemo(() => {
      // 1. Diagnoses Distribution
      const diagnosisCount: Record<string, number> = {};
      myPrescriptions.forEach(rx => {
          const d = rx.diagnosis.split(',')[0].trim(); // Simple split
          diagnosisCount[d] = (diagnosisCount[d] || 0) + 1;
      });
      const diagnosisData = Object.entries(diagnosisCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);

      // 2. Daily Activity (Last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
      }).reverse();

      const activityData = last7Days.map(date => {
          return {
              date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
              count: myPrescriptions.filter(rx => rx.date.startsWith(date)).length
          };
      });

      return { diagnosisData, activityData };
  }, [myPrescriptions]);

  // --- CALCULATOR STATES ---
  const [bmiData, setBmiData] = useState({ weight: '', height: '', result: '' });
  const [doseData, setDoseData] = useState({ weight: '', dosePerKg: '', result: '' });

  const calculateBMI = () => {
      const w = parseFloat(bmiData.weight);
      const h = parseFloat(bmiData.height) / 100; // cm to m
      if(w > 0 && h > 0) {
          const bmi = (w / (h * h)).toFixed(1);
          let cat = '';
          if(parseFloat(bmi) < 18.5) cat = 'Underweight';
          else if(parseFloat(bmi) < 25) cat = 'Normal';
          else if(parseFloat(bmi) < 30) cat = 'Overweight';
          else cat = 'Obese';
          setBmiData({ ...bmiData, result: `${bmi} (${cat})` });
      }
  };

  const calculateDose = () => {
      const w = parseFloat(doseData.weight);
      const d = parseFloat(doseData.dosePerKg);
      if(w > 0 && d > 0) {
          const total = (w * d).toFixed(0);
          setDoseData({ ...doseData, result: `${total} mg / day` });
      }
  };

  const handleCreateReferral = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onAddLabReferral || !selectedLabPatient || !labTestName) return;

      const p = myPatients.find(pat => pat.id === selectedLabPatient);
      if (!p) return;

      const newRef: LabReferral = {
          id: `REF-${Date.now()}`,
          patientId: p.id,
          patientName: p.fullName,
          doctorId: currentUser.id,
          doctorName: currentUser.name,
          testName: labTestName,
          labName: preferredLab,
          date: new Date().toISOString(),
          status: 'PENDING',
          notes: labNotes
      };
      
      onAddLabReferral(newRef);
      // Reset
      setLabTestName('');
      setPreferredLab('');
      setLabNotes('');
      alert("Lab Requisition Created Successfully");
  };

  if (status !== VerificationStatus.VERIFIED) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Complete Your Profile</h1>
          <p className="text-slate-600 mt-2">DevXWorld requires strict verification for RMPs before issuing prescriptions.</p>
        </div>
        <DoctorVerification onComplete={onVerificationComplete} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Sidebar / Menu */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
            <div className="flex items-center space-x-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-indigo-600"/>
                </div>
                <div className="overflow-hidden">
                    <p className="font-bold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full inline-block border border-green-200">Verified RMP</p>
                </div>
            </div>
            <nav className="space-y-2">
                <button 
                    onClick={() => setView('APPOINTMENTS')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${view === 'APPOINTMENTS' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Calendar className="w-5 h-5"/> <span>Queue & Visits</span>
                </button>
                <button 
                    onClick={() => { setView('NEW_RX'); setConsultPatient(null); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${view === 'NEW_RX' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <ClipboardList className="w-5 h-5"/> <span>Create Prescription</span>
                </button>
                <button 
                     onClick={() => setView('PATIENTS')}
                     className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${view === 'PATIENTS' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Users className="w-5 h-5"/> <span>My Patients</span>
                </button>
                <button 
                     onClick={() => setView('HISTORY')}
                     className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${view === 'HISTORY' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <History className="w-5 h-5"/> <span>Rx Logs</span>
                </button>
                <button 
                     onClick={() => setView('LABS')}
                     className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${view === 'LABS' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <TestTube className="w-5 h-5"/> <span>Lab & Diagnostics</span>
                </button>
                <button 
                     onClick={() => setView('CERTIFICATES')}
                     className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${view === 'CERTIFICATES' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <FileBadge className="w-5 h-5"/> <span>Certificates</span>
                </button>
                <button 
                     onClick={() => setView('ANALYTICS')}
                     className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${view === 'ANALYTICS' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <BarChart3 className="w-5 h-5"/> <span>Practice Analytics</span>
                </button>
                <button 
                     onClick={() => setView('TOOLS')}
                     className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${view === 'TOOLS' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Calculator className="w-5 h-5"/> <span>Clinical Tools</span>
                </button>
            </nav>
        </div>

        {/* Mini Stats (Visible on all views) */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg p-4 text-white shadow-md">
            <h4 className="text-xs font-bold uppercase opacity-80 mb-2">My Practice Stats</h4>
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm">Today's Visits</span>
                <span className="text-2xl font-bold">{todaysAppointments.length}</span>
            </div>
             <div className="flex justify-between items-end">
                <span className="text-sm">Rx Issued</span>
                <span className="text-2xl font-bold">{myPrescriptions.length}</span>
            </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="lg:col-span-9">
        {view === 'APPOINTMENTS' && (
            <div className="bg-white rounded-lg shadow border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2 relative">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <Calendar className="w-6 h-6 mr-2 text-indigo-600"/> Appointment Queue
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full font-bold border border-indigo-100 hidden sm:inline-block">
                            {new Date().toLocaleDateString()}
                        </span>
                        <button 
                            onClick={() => setShowAptForm(true)}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-bold hover:bg-indigo-700 flex items-center shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-1"/> Schedule New
                        </button>
                    </div>
                </div>

                {/* NEW APPOINTMENT MODAL */}
                {showAptForm && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg p-4">
                        <div className="bg-white w-full max-w-md shadow-2xl rounded-xl border border-indigo-100 p-6 animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                <h3 className="font-bold text-slate-800">Schedule Appointment</h3>
                                <button onClick={() => setShowAptForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Select Patient</label>
                                    <select 
                                        className="w-full border p-2 rounded text-sm" 
                                        value={newApt.patientId || ''}
                                        onChange={(e) => setNewApt({...newApt, patientId: e.target.value})}
                                    >
                                        <option value="">-- Choose --</option>
                                        {myPatients.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                                        <input type="date" className="w-full border p-2 rounded text-sm" value={newApt.date || ''} onChange={e => setNewApt({...newApt, date: e.target.value})}/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Time Slot</label>
                                        <input type="time" className="w-full border p-2 rounded text-sm" value={newApt.timeSlot || ''} onChange={e => setNewApt({...newApt, timeSlot: e.target.value})}/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                                        <select className="w-full border p-2 rounded text-sm" value={newApt.type} onChange={e => setNewApt({...newApt, type: e.target.value as any})}>
                                            <option value="VISIT">In-Clinic Visit</option>
                                            <option value="VIDEO">Video Consult</option>
                                            <option value="FOLLOW_UP">Follow Up</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Reason</label>
                                        <input className="w-full border p-2 rounded text-sm" placeholder="e.g. Fever" value={newApt.reason || ''} onChange={e => setNewApt({...newApt, reason: e.target.value})}/>
                                    </div>
                                </div>
                                <button onClick={handleScheduleApt} className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700 mt-2">Confirm Booking</button>
                            </div>
                        </div>
                    </div>
                )}

                {todaysAppointments.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                        <p className="text-slate-500 font-medium">No appointments scheduled for today.</p>
                        <p className="text-xs text-slate-400 mt-1">Walk-ins can be managed directly via "Create Prescription".</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todaysAppointments.map(apt => (
                            <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-all">
                                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                    <div className="text-center min-w-[60px]">
                                        <div className="text-lg font-bold text-slate-800">{apt.timeSlot}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">{apt.type}</div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{apt.patientName}</h4>
                                        <p className="text-xs text-slate-500">{apt.patientGender}, {apt.patientAge} Yrs • {apt.reason}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    {apt.status === 'WAITING' || apt.status === 'SCHEDULED' ? (
                                        <>
                                            <button 
                                                onClick={() => handleCancelApt(apt)}
                                                className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => handleStartConsult(apt)}
                                                className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm flex items-center justify-center"
                                            >
                                                Start Consult <Send className="w-3 h-3 ml-2"/>
                                            </button>
                                        </>
                                    ) : (
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                            apt.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                            apt.status === 'IN_CONSULT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {apt.status.replace('_', ' ')}
                                        </span>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteApt(apt.id); }}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete Appointment Record"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {view === 'CERTIFICATES' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <FileBadge className="w-6 h-6 mr-2 text-teal-600"/> Medical Certificates
                    </h2>
                    <button 
                        onClick={() => setShowCertForm(true)}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-teal-700"
                    >
                        <CheckSquare className="w-4 h-4 mr-2"/> Issue New
                    </button>
                </div>

                {showCertForm && (
                     <div className="bg-white p-6 rounded-lg shadow-lg border border-teal-200 mb-6 animate-in slide-in-from-top-4">
                         <h3 className="font-bold text-teal-800 mb-4 border-b border-teal-100 pb-2">Generate Official Certificate</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Patient</label>
                                 <select 
                                    className="w-full border p-2 rounded text-sm"
                                    value={certData.patientId || ''}
                                    onChange={e => setCertData({...certData, patientId: e.target.value})}
                                 >
                                     <option value="">-- Choose Patient --</option>
                                     {myPatients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Certificate Type</label>
                                 <select 
                                    className="w-full border p-2 rounded text-sm"
                                    value={certData.type || 'SICK_LEAVE'}
                                    onChange={e => setCertData({...certData, type: e.target.value as any})}
                                 >
                                     <option value="SICK_LEAVE">Sick Leave Certificate</option>
                                     <option value="FITNESS">Medical Fitness Certificate</option>
                                     <option value="REFERRAL">Referral Letter</option>
                                 </select>
                             </div>
                             
                             {certData.type === 'SICK_LEAVE' && (
                                 <>
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                                         <input type="date" className="w-full border p-2 rounded text-sm" onChange={e => setCertData({...certData, startDate: e.target.value})}/>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
                                         <input type="date" className="w-full border p-2 rounded text-sm" onChange={e => setCertData({...certData, endDate: e.target.value})}/>
                                     </div>
                                 </>
                             )}
                             
                             <div className="md:col-span-2">
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diagnosis / Reason</label>
                                 <input className="w-full border p-2 rounded text-sm" placeholder="e.g. Viral Fever" onChange={e => setCertData({...certData, diagnosis: e.target.value})}/>
                             </div>
                             <div className="md:col-span-2">
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Clinical Remarks</label>
                                 <textarea className="w-full border p-2 rounded text-sm" rows={2} placeholder="Advised rest for..." onChange={e => setCertData({...certData, remarks: e.target.value})}></textarea>
                             </div>
                         </div>
                         <div className="flex justify-end gap-3">
                             <button onClick={() => setShowCertForm(false)} className="text-slate-500 font-bold text-sm">Cancel</button>
                             <button onClick={handleCreateCert} className="bg-teal-600 text-white px-6 py-2 rounded font-bold hover:bg-teal-700">Generate & Print</button>
                         </div>
                     </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myCertificates.map(cert => (
                        <div key={cert.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800">{cert.patientName}</h4>
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono">{new Date(cert.issueDate).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-indigo-600 font-bold uppercase mb-2">{cert.type.replace('_', ' ')}</p>
                            <p className="text-xs text-slate-500 line-clamp-2 italic">"{cert.remarks}"</p>
                            <button 
                                onClick={() => setPrintingCert(cert)}
                                className="mt-3 w-full border border-slate-200 text-slate-600 text-xs font-bold py-1.5 rounded hover:bg-slate-50 flex items-center justify-center"
                            >
                                <Eye className="w-3 h-3 mr-1"/> View / Print
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Certificate Print Modal */}
        {printingCert && (
            <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-2xl h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
                    <div className="bg-slate-100 p-4 flex justify-between items-center border-b border-slate-200">
                        <h3 className="font-bold text-slate-700">Certificate Preview</h3>
                        <div className="flex gap-2">
                             <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-indigo-700 flex items-center">
                                 <Clock className="w-4 h-4 mr-2"/> Print
                             </button>
                             <button onClick={() => setPrintingCert(null)} className="text-slate-500 hover:text-slate-700"><X className="w-6 h-6"/></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8 print:p-0 print:bg-white">
                        <div className="bg-white shadow-lg p-10 max-w-[210mm] mx-auto min-h-[297mm] print:shadow-none print:w-full" id="cert-print-area">
                             {/* Letterhead */}
                             <div className="border-b-4 border-slate-800 pb-4 mb-8 flex justify-between items-end">
                                 <div>
                                     <h1 className="text-2xl font-bold uppercase text-slate-900">{currentUser.clinicName || 'Clinic Name'}</h1>
                                     <p className="text-sm text-slate-600">{currentUser.clinicAddress}</p>
                                     <p className="text-sm text-slate-600">{currentUser.city}, {currentUser.state}</p>
                                 </div>
                                 <div className="text-right">
                                     <h2 className="text-xl font-bold text-slate-900">Dr. {currentUser.name}</h2>
                                     <p className="text-xs font-bold uppercase text-slate-500">{currentUser.qualifications}</p>
                                     <p className="text-xs text-slate-500">Reg No: {currentUser.licenseNumber}</p>
                                 </div>
                             </div>

                             <div className="text-center mb-12">
                                 <span className="text-xl font-black uppercase tracking-widest border-b-2 border-slate-300 pb-1 inline-block">
                                     {printingCert.type === 'SICK_LEAVE' ? 'MEDICAL CERTIFICATE FOR LEAVE' : printingCert.type === 'FITNESS' ? 'MEDICAL FITNESS CERTIFICATE' : 'REFERRAL LETTER'}
                                 </span>
                             </div>

                             <div className="text-lg leading-loose font-serif text-slate-800 px-4 mb-12">
                                 {printingCert.type === 'SICK_LEAVE' ? (
                                     <p>
                                         This is to certify that <strong>Mr./Ms. {printingCert.patientName}</strong> is suffering from <strong>{printingCert.diagnosis}</strong> and is under my treatment.
                                         <br/><br/>
                                         He/She is advised rest for <strong>{Math.ceil((new Date(printingCert.endDate!).getTime() - new Date(printingCert.startDate!).getTime())/(1000*60*60*24)) + 1} days</strong> 
                                         from <strong>{new Date(printingCert.startDate!).toLocaleDateString()}</strong> to <strong>{new Date(printingCert.endDate!).toLocaleDateString()}</strong>.
                                     </p>
                                 ) : (
                                     <p>
                                         This is to certify that <strong>Mr./Ms. {printingCert.patientName}</strong> has recovered from <strong>{printingCert.diagnosis}</strong> and is now clinically fit to resume duties/classes effective from <strong>{new Date().toLocaleDateString()}</strong>.
                                     </p>
                                 )}
                                 <br/>
                                 <p className="font-bold text-sm text-slate-500 uppercase mt-4">Remarks:</p>
                                 <p className="italic">{printingCert.remarks}</p>
                             </div>

                             <div className="mt-20 flex justify-between items-end px-4">
                                 <div className="text-sm text-slate-500">
                                     Date: {new Date(printingCert.issueDate).toLocaleDateString()}<br/>
                                     Place: {currentUser.city}
                                 </div>
                                 <div className="text-center">
                                     <div className="h-16 mb-2"></div> {/* Space for sign */}
                                     <p className="font-bold border-t border-slate-400 pt-2 px-8">Dr. {currentUser.name}</p>
                                     <p className="text-xs uppercase">Authorized Signatory</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {view === 'NEW_RX' && (
            <CreatePrescription 
                currentUser={currentUser}
                onPrescriptionSent={(rx) => { onCreatePrescription(rx); setView('HISTORY'); }}
                verifiedPharmacies={verifiedPharmacies}
                patients={patients}
                onAddPatient={onAddPatient}
                prescriptionHistory={myPrescriptions}
                preSelectedPatient={consultPatient}
            />
        )}

        {view === 'PATIENTS' && (
            <div className="bg-white rounded-lg shadow border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Patient Management</h2>
                <PatientManager 
                    doctorId={currentUser.id} 
                    patients={patients} 
                    onAddPatient={onAddPatient}
                    onUpdatePatient={onUpdatePatient}
                    prescriptions={myPrescriptions}
                    labReferrals={myReferrals}
                />
            </div>
        )}

        {view === 'HISTORY' && (
            <div className="bg-white rounded-lg shadow border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Prescription History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Pharmacy</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200 text-sm">
                            {myPrescriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-slate-500">No prescriptions issued yet.</td>
                                </tr>
                            ) : (
                                myPrescriptions.map((rx) => (
                                    <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                            {new Date(rx.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{rx.patientName}</td>
                                        <td className="px-6 py-4 text-slate-500">{rx.pharmacyName || 'Unknown'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                rx.status === 'DISPENSED' ? 'bg-green-100 text-green-800' : 
                                                rx.status === 'REJECTED_STOCK' ? 'bg-orange-100 text-orange-800' :
                                                rx.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {rx.status === 'REJECTED_STOCK' ? 'OUT OF STOCK' : rx.status === 'SENT_TO_PHARMACY' ? 'SENT TO PHARMACY' : rx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedRx(rx)}
                                                className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end ml-auto"
                                            >
                                                <Eye className="w-4 h-4 mr-1"/> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {view === 'LABS' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex items-center justify-between">
                     <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <Microscope className="w-6 h-6 mr-2 text-indigo-600"/> Lab & Diagnostics
                     </h2>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                     {/* Referral Form */}
                     <div className="md:col-span-5">
                         <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                             <h3 className="font-bold text-slate-700 mb-4 flex items-center border-b border-slate-100 pb-2">
                                 <Send className="w-4 h-4 mr-2 text-teal-600"/> New Test Requisition
                             </h3>
                             <form onSubmit={handleCreateReferral} className="space-y-4">
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Patient</label>
                                     <select 
                                        className="w-full border p-2 rounded text-sm"
                                        required
                                        value={selectedLabPatient}
                                        onChange={e => setSelectedLabPatient(e.target.value)}
                                     >
                                         <option value="">-- Choose Patient --</option>
                                         {myPatients.map(p => (
                                             <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>
                                         ))}
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Test Name(s)</label>
                                     <input 
                                        className="w-full border p-2 rounded text-sm" 
                                        placeholder="e.g. CBC, Lipid Profile, X-Ray Chest PA"
                                        required
                                        value={labTestName}
                                        onChange={e => setLabTestName(e.target.value)}
                                     />
                                     <p className="text-[10px] text-slate-400 mt-1">Separate multiple tests with commas.</p>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preferred Lab (Optional)</label>
                                     <input 
                                        className="w-full border p-2 rounded text-sm" 
                                        placeholder="e.g. Metropolis, Dr. Lal PathLabs"
                                        value={preferredLab}
                                        onChange={e => setPreferredLab(e.target.value)}
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Clinical Notes</label>
                                     <textarea 
                                        className="w-full border p-2 rounded text-sm" 
                                        rows={2}
                                        placeholder="Specific instructions..."
                                        value={labNotes}
                                        onChange={e => setLabNotes(e.target.value)}
                                     />
                                 </div>
                                 <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded font-bold hover:bg-teal-700 transition-colors">
                                     Send Referral
                                 </button>
                             </form>
                         </div>
                     </div>

                     {/* Referral History / Reports */}
                     <div className="md:col-span-7">
                         <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                             <div className="p-4 bg-slate-50 border-b border-slate-200">
                                 <h3 className="font-bold text-slate-700 flex items-center">
                                     <FileBarChart className="w-4 h-4 mr-2 text-indigo-600"/> Recent Activity
                                 </h3>
                             </div>
                             <div className="overflow-y-auto flex-1 p-0">
                                 <table className="w-full text-sm text-left">
                                     <thead className="bg-white border-b border-slate-100 text-xs text-slate-500 uppercase">
                                         <tr>
                                             <th className="p-3">Date</th>
                                             <th className="p-3">Patient</th>
                                             <th className="p-3">Test</th>
                                             <th className="p-3 text-right">Status</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-50">
                                         {myReferrals.length === 0 ? (
                                             <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No lab referrals created yet.</td></tr>
                                         ) : (
                                             myReferrals.map(ref => (
                                                 <tr key={ref.id} className="hover:bg-indigo-50/50">
                                                     <td className="p-3 text-slate-500">{new Date(ref.date).toLocaleDateString()}</td>
                                                     <td className="p-3 font-medium text-slate-800">{ref.patientName}</td>
                                                     <td className="p-3 text-slate-600 truncate max-w-[120px]" title={ref.testName}>{ref.testName}</td>
                                                     <td className="p-3 text-right">
                                                         {ref.status === 'COMPLETED' ? (
                                                             <button 
                                                                onClick={() => setViewingReport(ref)}
                                                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 font-bold hover:bg-green-200 inline-flex items-center"
                                                             >
                                                                 <CheckCircle2 className="w-3 h-3 mr-1"/> View Report
                                                             </button>
                                                         ) : (
                                                             <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200 font-medium inline-flex items-center">
                                                                 <Clock className="w-3 h-3 mr-1"/> Pending
                                                             </span>
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
                 </div>
             </div>
        )}

        {/* Report Viewer Modal */}
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
                                {/* Mock Data Simulation */}
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
                                <div className="flex justify-between">
                                    <span>Platelets</span>
                                    <span className="font-bold">2.5 Lakhs</span>
                                    <span className="text-slate-500">1.5 - 4.5</span>
                                </div>
                                <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-xs italic text-slate-500">
                                    Electronically generated report. No signature required.
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center">
                            <button onClick={() => setViewingReport(null)} className="bg-slate-100 text-slate-700 px-6 py-2 rounded font-bold hover:bg-slate-200">
                                Close Viewer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {view === 'ANALYTICS' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-2 text-indigo-600"/> Practice Analytics
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* CHART 1: Activity */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">Prescriptions (Last 7 Days)</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData.activityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" tick={{fontSize: 12}} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* CHART 2: Diagnoses */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">Top Diagnoses</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analyticsData.diagnosisData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {analyticsData.diagnosisData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                         <div className="flex items-center gap-3">
                             <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Users className="w-5 h-5"/></div>
                             <div>
                                 <p className="text-xs text-slate-500 font-bold uppercase">Avg Patients/Day</p>
                                 <p className="text-xl font-bold text-slate-800">
                                    {(myPatients.length / 30).toFixed(1)} <span className="text-xs font-normal text-slate-400">(Est.)</span>
                                 </p>
                             </div>
                         </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                         <div className="flex items-center gap-3">
                             <div className="p-3 bg-green-100 text-green-600 rounded-full"><Activity className="w-5 h-5"/></div>
                             <div>
                                 <p className="text-xs text-slate-500 font-bold uppercase">Completion Rate</p>
                                 <p className="text-xl font-bold text-slate-800">
                                    {myPrescriptions.length > 0 ? ((myPrescriptions.filter(p => p.status === 'DISPENSED').length / myPrescriptions.length) * 100).toFixed(0) : 0}%
                                 </p>
                             </div>
                         </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                         <div className="flex items-center gap-3">
                             <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><TrendingUp className="w-5 h-5"/></div>
                             <div>
                                 <p className="text-xs text-slate-500 font-bold uppercase">Growth (MoM)</p>
                                 <p className="text-xl font-bold text-slate-800">+12%</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {view === 'TOOLS' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                 <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Calculator className="w-6 h-6 mr-2 text-indigo-600"/> Clinical Tools & Calculators
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* BMI Calculator */}
                    <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
                        <div className="flex items-center mb-4 border-b border-slate-100 pb-2">
                            <Scale className="w-5 h-5 mr-2 text-teal-600"/>
                            <h3 className="font-bold text-slate-700">BMI Calculator</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Weight (kg)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded text-sm" 
                                        placeholder="e.g. 70"
                                        value={bmiData.weight}
                                        onChange={e => setBmiData({...bmiData, weight: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Height (cm)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded text-sm" 
                                        placeholder="e.g. 175"
                                        value={bmiData.height}
                                        onChange={e => setBmiData({...bmiData, height: e.target.value})}
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={calculateBMI}
                                className="w-full bg-teal-600 text-white py-2 rounded text-sm font-bold hover:bg-teal-700 transition-colors"
                            >
                                Calculate BMI
                            </button>
                            {bmiData.result && (
                                <div className="mt-2 p-3 bg-teal-50 rounded border border-teal-100 text-center">
                                    <p className="text-xs text-teal-600 uppercase font-bold">Result</p>
                                    <p className="text-xl font-bold text-teal-900">{bmiData.result}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pediatric Dose Calculator */}
                    <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
                        <div className="flex items-center mb-4 border-b border-slate-100 pb-2">
                            <Baby className="w-5 h-5 mr-2 text-indigo-600"/>
                            <h3 className="font-bold text-slate-700">Pediatric Dosage Calc</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Child Weight (kg)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded text-sm" 
                                        placeholder="e.g. 15"
                                        value={doseData.weight}
                                        onChange={e => setDoseData({...doseData, weight: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Dose (mg/kg/day)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded text-sm" 
                                        placeholder="e.g. 10 (Paracetamol)"
                                        value={doseData.dosePerKg}
                                        onChange={e => setDoseData({...doseData, dosePerKg: e.target.value})}
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={calculateDose}
                                className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-bold hover:bg-indigo-700 transition-colors"
                            >
                                Calculate Total Daily Dose
                            </button>
                            {doseData.result && (
                                <div className="mt-2 p-3 bg-indigo-50 rounded border border-indigo-100 text-center">
                                    <p className="text-xs text-indigo-600 uppercase font-bold">Total Dose Required</p>
                                    <p className="text-xl font-bold text-indigo-900">{doseData.result}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow border border-slate-200 p-6 mt-6">
                    <h3 className="font-bold text-slate-700 mb-2">Common Reference Ranges</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-600">
                        <div className="p-2 bg-slate-50 rounded">
                            <span className="font-bold block">Blood Pressure</span>
                            120/80 mmHg
                        </div>
                         <div className="p-2 bg-slate-50 rounded">
                            <span className="font-bold block">Fasting Sugar</span>
                            70-100 mg/dL
                        </div>
                         <div className="p-2 bg-slate-50 rounded">
                            <span className="font-bold block">HbA1c</span>
                            {'<'} 5.7% (Normal)
                        </div>
                         <div className="p-2 bg-slate-50 rounded">
                            <span className="font-bold block">BMI</span>
                            18.5 - 24.9
                        </div>
                    </div>
                </div>
             </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedRx && (
          <PrescriptionModal 
            prescription={selectedRx} 
            onClose={() => setSelectedRx(null)} 
          />
      )}
    </div>
  );
};
