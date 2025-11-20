
import React, { useState } from 'react';
import { DoctorProfile, VerificationStatus, Prescription, User } from '../../types';
import { DoctorVerification } from './DoctorVerification';
import { CreatePrescription } from './CreatePrescription';
import { ClipboardList, User as UserIcon, History, Bell, Eye, X } from 'lucide-react';

interface DoctorDashboardProps {
  status: VerificationStatus;
  onVerificationComplete: (p: DoctorProfile) => void;
  prescriptions: Prescription[];
  onCreatePrescription: (rx: Prescription) => void;
  currentUser: User;
  verifiedPharmacies: User[];
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ 
    status, 
    onVerificationComplete,
    prescriptions,
    onCreatePrescription,
    currentUser,
    verifiedPharmacies
}) => {
  const [view, setView] = useState<'NEW_RX' | 'HISTORY'>('NEW_RX');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  // Filter prescriptions for this specific doctor
  const myPrescriptions = prescriptions.filter(p => p.doctorId === currentUser.id);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar / Menu */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
            <div className="flex items-center space-x-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-indigo-600"/>
                </div>
                <div>
                    <p className="font-bold text-slate-800">{currentUser.name}</p>
                    <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full inline-block border border-green-200">Verified RMP</p>
                </div>
            </div>
            <nav className="space-y-2">
                <button 
                    onClick={() => setView('NEW_RX')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${view === 'NEW_RX' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <ClipboardList className="w-5 h-5"/> <span>Create Prescription</span>
                </button>
                <button 
                     onClick={() => setView('HISTORY')}
                     className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${view === 'HISTORY' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <History className="w-5 h-5"/> <span>History / Logs</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-50">
                    <Bell className="w-5 h-5"/> <span>Notifications</span>
                </button>
            </nav>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="lg:col-span-9">
        {view === 'NEW_RX' ? (
            <CreatePrescription 
                doctorId={currentUser.id}
                doctorName={currentUser.name} 
                onPrescriptionSent={(rx) => { onCreatePrescription(rx); setView('HISTORY'); }}
                verifiedPharmacies={verifiedPharmacies}
            />
        ) : (
            <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
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
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rx.status === 'DISPENSED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {rx.status}
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
      </div>

      {/* Detailed View Modal */}
      {selectedRx && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center sticky top-0">
                      <h3 className="text-white font-bold text-lg flex items-center">
                          <ClipboardList className="mr-2"/> Prescription Details
                      </h3>
                      <button onClick={() => setSelectedRx(null)} className="text-white/80 hover:text-white">
                          <X className="w-6 h-6"/>
                      </button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                          <div>
                              <p className="text-xs text-slate-500 uppercase">Prescription ID</p>
                              <p className="font-mono text-slate-700">{selectedRx.id}</p>
                          </div>
                          <div>
                              <p className="text-xs text-slate-500 uppercase">Date Issued</p>
                              <p className="text-slate-700">{new Date(selectedRx.date).toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-xs text-slate-500 uppercase">Patient Name</p>
                              <p className="text-slate-900 font-medium">{selectedRx.patientName} ({selectedRx.patientAge}, {selectedRx.patientGender})</p>
                          </div>
                          <div>
                              <p className="text-xs text-slate-500 uppercase">Assigned Pharmacy</p>
                              <p className="text-slate-900 font-medium">{selectedRx.pharmacyName}</p>
                          </div>
                      </div>

                      <div>
                          <h4 className="font-bold text-slate-800 mb-2">Diagnosis</h4>
                          <p className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-700">{selectedRx.diagnosis}</p>
                      </div>

                      <div>
                          <h4 className="font-bold text-slate-800 mb-2">Medications</h4>
                          <div className="bg-white border border-slate-200 rounded overflow-hidden">
                              <table className="min-w-full text-sm">
                                  <thead className="bg-slate-50">
                                      <tr>
                                          <th className="px-4 py-2 text-left font-medium text-slate-500">Drug Name</th>
                                          <th className="px-4 py-2 text-left font-medium text-slate-500">Dosage</th>
                                          <th className="px-4 py-2 text-left font-medium text-slate-500">Freq.</th>
                                          <th className="px-4 py-2 text-left font-medium text-slate-500">Duration</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {selectedRx.medicines.map((m, i) => (
                                          <tr key={i}>
                                              <td className="px-4 py-2">{m.name}</td>
                                              <td className="px-4 py-2">{m.dosage}</td>
                                              <td className="px-4 py-2">{m.frequency}</td>
                                              <td className="px-4 py-2">{m.duration}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>

                      {selectedRx.advice && (
                          <div>
                              <h4 className="font-bold text-slate-800 mb-2">Advice / Instructions</h4>
                              <p className="text-slate-600 italic">{selectedRx.advice}</p>
                          </div>
                      )}

                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                          <p className="text-xs text-slate-400 font-mono">{selectedRx.digitalSignatureToken}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedRx.status === 'DISPENSED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                              Status: {selectedRx.status}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
