
import React, { useState } from 'react';
import { CheckCircle, Eye, History, Package, Search, X, ClipboardList, FileText } from 'lucide-react';
import { Prescription, User } from '../../types';

interface PharmacyDashboardProps {
    prescriptions: Prescription[];
    onDispense: (id: string) => void;
    currentUser: User;
}

export const PharmacyDashboard: React.FC<PharmacyDashboardProps> = ({ prescriptions, onDispense, currentUser }) => {
  const [view, setView] = useState<'QUEUE' | 'HISTORY'>('QUEUE');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Secure filtering: Only show prescriptions specifically assigned to this pharmacy's ID
  const myPrescriptions = prescriptions.filter(p => p.pharmacyId === currentUser.id);
  
  const queue = myPrescriptions.filter(p => p.status === 'ISSUED');
  
  const history = myPrescriptions.filter(p => {
      if (!searchTerm) return true;
      const lowerTerm = searchTerm.toLowerCase();
      return (
        p.id.toLowerCase().includes(lowerTerm) ||
        p.patientName.toLowerCase().includes(lowerTerm) ||
        p.doctorName.toLowerCase().includes(lowerTerm)
      );
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Pharmacy Dashboard</h1>
            <p className="text-slate-500 text-sm">Logged in as: <span className="font-medium text-slate-700">{currentUser.name}</span></p>
        </div>
        <div className="flex gap-2 items-center">
            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full border border-teal-200 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1"/> Verified License
            </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit shadow-inner">
          <button 
            onClick={() => setView('QUEUE')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all ${
                view === 'QUEUE' 
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4 mr-2"/> Dispensing Queue
            {queue.length > 0 && <span className="ml-2 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{queue.length}</span>}
          </button>
          <button 
            onClick={() => setView('HISTORY')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all ${
                view === 'HISTORY' 
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4 mr-2"/> Audit History
          </button>
      </div>

      {view === 'QUEUE' ? (
          <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50 flex items-center justify-between">
                <h3 className="font-bold text-indigo-900">Active Prescriptions</h3>
                <span className="text-xs text-indigo-600 font-medium">Requires Immediate Action</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Token ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {queue.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-3">
                                    <Package className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-lg font-medium text-slate-600">No Pending Prescriptions</p>
                                <p className="text-sm mt-1">Prescriptions assigned to your pharmacy will appear here.</p>
                            </td>
                        </tr>
                    ) : (
                        queue.map((rx) => (
                        <tr key={rx.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600 font-medium cursor-pointer hover:underline" onClick={() => setSelectedRx(rx)}>
                                {rx.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{rx.doctorName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {rx.patientName}
                                <span className="block text-xs text-slate-400">{rx.patientGender}, {rx.patientAge} yrs</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {new Date(rx.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                <button 
                                    onClick={() => setSelectedRx(rx)}
                                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="View Details"
                                >
                                    <Eye className="w-5 h-5"/>
                                </button>
                                <button 
                                    onClick={() => onDispense(rx.id)}
                                    className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-bold shadow-sm inline-flex items-center transition-colors"
                                >
                                    <CheckCircle className="w-3 h-3 mr-1"/> Dispense
                                </button>
                            </td>
                        </tr>
                        ))
                    )}
                </tbody>
                </table>
            </div>
          </div>
      ) : (
          <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-slate-800">Prescription History & Logs</h3>
                    <p className="text-xs text-slate-500">Complete audit trail of all transactions</p>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Search Rx ID, Patient Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 shadow-sm"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rx ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {history.length === 0 ? (
                             <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    No records found matching your search.
                                </td>
                            </tr>
                        ) : (
                            history.map(rx => (
                                <tr key={rx.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(rx.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                                        {rx.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {rx.doctorName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {rx.patientName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
                                            rx.status === 'DISPENSED' 
                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                            {rx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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

      {/* Detailed Prescription Modal */}
      {selectedRx && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
                  <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                      <div className="text-white">
                          <h3 className="font-bold text-lg flex items-center">
                              <FileText className="mr-2 h-5 w-5 text-indigo-300"/> Digital Prescription
                          </h3>
                          <p className="text-xs text-indigo-300 font-mono mt-0.5">{selectedRx.id}</p>
                      </div>
                      <button onClick={() => setSelectedRx(null)} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors">
                          <X className="w-5 h-5"/>
                      </button>
                  </div>

                  <div className="p-6 sm:p-8 space-y-8">
                      {/* Doctor & Patient Header */}
                      <div className="flex flex-col sm:flex-row justify-between gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Prescribed By</p>
                              <p className="text-lg font-bold text-slate-800">{selectedRx.doctorName}</p>
                              <p className="text-sm text-slate-500">Registered Medical Practitioner</p>
                          </div>
                          <div className="sm:text-right">
                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Patient Details</p>
                              <p className="text-lg font-bold text-slate-800">{selectedRx.patientName}</p>
                              <p className="text-sm text-slate-500">{selectedRx.patientAge} Years, {selectedRx.patientGender}</p>
                          </div>
                      </div>

                      {/* Diagnosis */}
                      <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
                             Diagnosis / Clinical Notes
                          </h4>
                          <div className="p-3 bg-white border border-slate-200 rounded text-slate-700 text-sm">
                              {selectedRx.diagnosis}
                          </div>
                      </div>

                      {/* Medicines Table */}
                      <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                              <ClipboardList className="w-4 h-4 mr-2 text-indigo-600"/> Medication Details
                          </h4>
                          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                              <table className="min-w-full text-sm">
                                  <thead className="bg-slate-50 border-b border-slate-200">
                                      <tr>
                                          <th className="px-4 py-3 text-left font-bold text-slate-600">Medicine Name</th>
                                          <th className="px-4 py-3 text-left font-bold text-slate-600">Dosage</th>
                                          <th className="px-4 py-3 text-left font-bold text-slate-600">Frequency</th>
                                          <th className="px-4 py-3 text-left font-bold text-slate-600">Duration</th>
                                          <th className="px-4 py-3 text-left font-bold text-slate-600">Instructions</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {selectedRx.medicines.map((m, i) => (
                                          <tr key={i} className="hover:bg-slate-50">
                                              <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                                              <td className="px-4 py-3 text-slate-600">{m.dosage}</td>
                                              <td className="px-4 py-3 text-slate-600">{m.frequency}</td>
                                              <td className="px-4 py-3 text-slate-600">{m.duration}</td>
                                              <td className="px-4 py-3 text-slate-500 italic text-xs">{m.instructions || '-'}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                      
                      {/* Advice */}
                      {selectedRx.advice && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                             <h4 className="text-xs font-bold text-blue-800 uppercase mb-1">Additional Advice</h4>
                             <p className="text-sm text-blue-900">{selectedRx.advice}</p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-slate-100 gap-4">
                          <div className="text-center sm:text-left">
                              <p className="text-xs text-slate-400 mb-1">Digital Signature Token</p>
                              <code className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 font-mono block">{selectedRx.digitalSignatureToken}</code>
                          </div>
                          <div>
                              {selectedRx.status === 'ISSUED' ? (
                                  <button 
                                    onClick={() => { onDispense(selectedRx.id); setSelectedRx(null); }}
                                    className="bg-green-600 text-white px-6 py-2 rounded-md font-bold shadow hover:bg-green-700 transition-colors flex items-center"
                                  >
                                      <CheckCircle className="w-4 h-4 mr-2"/> Dispense Now
                                  </button>
                              ) : (
                                  <span className="inline-flex items-center px-4 py-2 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200 cursor-not-allowed">
                                      <CheckCircle className="w-4 h-4 mr-2 text-green-600"/> Already Dispensed
                                  </span>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
