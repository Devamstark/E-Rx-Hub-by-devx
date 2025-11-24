
import React, { useState, useMemo } from 'react';
import { ShieldAlert, Plus, CheckCircle2, AlertTriangle, Trash2, FileText, Activity, RefreshCw, Ban, File, X, Stethoscope, Building2, Eye, Mail, Phone as PhoneIcon, MapPin, Calendar, Edit2, Save as SaveIcon, Lock, Search } from 'lucide-react';
import { AdminRole, AdminPermission, AdminUser, User, UserRole, VerificationStatus, Prescription, UserDocument, AuditLog } from '../../types';

interface AdminDashboardProps {
    users: User[];
    prescriptions: Prescription[];
    onUpdateStatus: (userId: string, status: VerificationStatus) => void;
    onTerminateUser: (userId: string, reason: string) => void;
    onDeleteUser: (userId: string) => void;
    onResetPassword: (userId: string) => void;
    onEditUser: (user: User) => void;
    auditLogs?: AuditLog[];
}

// --- Mock Data for Internal Admin Management ---
const INITIAL_ADMIN_USERS: AdminUser[] = [
    { 
        id: 'adm-root', 
        name: 'DevX Super Admin', 
        email: 'admin', 
        role: AdminRole.SUPER_ADMIN, 
        permissions: Object.values(AdminPermission) as AdminPermission[],
        status: 'ACTIVE'
    }
];

const getPermissionsForRole = (role: AdminRole): AdminPermission[] => {
    switch (role) {
        case AdminRole.SUPER_ADMIN:
            return Object.values(AdminPermission) as AdminPermission[];
        case AdminRole.COMPLIANCE_ADMIN:
            return [
                AdminPermission.VIEW_DOCTOR_LIST,
                AdminPermission.VIEW_PHARMACY_LIST,
                AdminPermission.APPROVE_REJECT_DOCTOR,
                AdminPermission.APPROVE_REJECT_PHARMACY,
                AdminPermission.ACCESS_LOGS_AUDITS
            ];
        case AdminRole.REVIEWER:
            return [
                AdminPermission.VIEW_DOCTOR_LIST,
                AdminPermission.VIEW_PHARMACY_LIST,
                AdminPermission.ACCESS_LOGS_AUDITS
            ];
        default:
            return [];
    }
};

const UserProfileModal = ({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (u: User) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);

  const handleChange = (key: keyof User, value: any) => {
      setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
      onSave(formData);
      setIsEditing(false);
  };

  const EditInput = ({ label, valueKey, placeholder }: { label: string, valueKey: keyof User, placeholder?: string }) => (
    <div className="mb-3">
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
        <input 
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData[valueKey] as string || ''}
            onChange={e => handleChange(valueKey, e.target.value)}
            placeholder={placeholder}
        />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${user.role === 'DOCTOR' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                        {user.role === 'DOCTOR' ? <Stethoscope className="w-6 h-6"/> : <Building2 className="w-6 h-6"/>}
                    </div>
                    <div>
                        {isEditing ? (
                             <input 
                                className="text-xl font-bold text-slate-900 bg-transparent border-b border-slate-300 focus:border-indigo-500 focus:outline-none w-full"
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                             />
                        ) : (
                             <h3 className="text-xl font-bold text-slate-900 leading-none">{user.name}</h3>
                        )}
                        <span className="text-xs text-slate-500 font-mono">ID: {user.id}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ml-2 ${
                        user.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                        user.verificationStatus === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                        {user.verificationStatus}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing ? (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors text-sm font-medium"
                        >
                            <Edit2 className="w-4 h-4" /> Edit
                        </button>
                    ) : (
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                        >
                            <SaveIcon className="w-4 h-4" /> Save
                        </button>
                    )}
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                        <div className="flex items-center text-xs font-bold text-slate-500 uppercase mb-1">
                            <Mail className="w-3 h-3 mr-1"/> Email
                        </div>
                        {isEditing ? (
                             <input 
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value)}
                             />
                        ) : (
                            <p className="text-sm font-medium text-slate-900 truncate" title={user.email}>{user.email}</p>
                        )}
                    </div>
                    <div>
                         <div className="flex items-center text-xs font-bold text-slate-500 uppercase mb-1">
                            <PhoneIcon className="w-3 h-3 mr-1"/> Phone
                        </div>
                        {isEditing ? (
                             <input 
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                                value={formData.phone || ''}
                                onChange={e => handleChange('phone', e.target.value)}
                             />
                        ) : (
                             <p className="text-sm font-medium text-slate-900">{user.phone || 'N/A'}</p>
                        )}
                    </div>
                    <div>
                         <div className="flex items-center text-xs font-bold text-slate-500 uppercase mb-1">
                            <Calendar className="w-3 h-3 mr-1"/> Registered On
                        </div>
                        <p className="text-sm font-medium text-slate-900">{new Date(user.registrationDate).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* DOCTOR SPECIFIC DETAILS */}
                {user.role === 'DOCTOR' && (
                    <>
                        <div>
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center border-b border-slate-100 pb-2">
                                <Stethoscope className="w-4 h-4 mr-2 text-indigo-600"/> Professional Credentials
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {isEditing ? (
                                    <>
                                        <EditInput label="Qualifications" valueKey="qualifications" />
                                        <EditInput label="Specialty" valueKey="specialty" />
                                        <EditInput label="State Medical Council" valueKey="stateCouncil" />
                                        <EditInput label="State Reg. Number" valueKey="licenseNumber" />
                                        <EditInput label="NMC UID" valueKey="nmrUid" />
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block">Qualifications</label>
                                            <p className="text-sm font-medium text-slate-900">{user.qualifications || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block">Specialty</label>
                                            <p className="text-sm font-medium text-slate-900">{user.specialty || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block">State Medical Council</label>
                                            <p className="text-sm font-medium text-slate-900">{user.stateCouncil || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block">State Reg. Number</label>
                                            <p className="text-sm font-medium text-slate-900 font-mono bg-slate-100 inline-block px-1 rounded">{user.licenseNumber || user['registrationNumber'] || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block">NMC UID</label>
                                            <p className="text-sm font-medium text-slate-900 font-mono bg-slate-100 inline-block px-1 rounded">{user.nmrUid || '-'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-slate-800 mt-6 mb-3 flex items-center border-b border-slate-100 pb-2">
                                <Building2 className="w-4 h-4 mr-2 text-indigo-600"/> Clinic & Contact
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {isEditing ? (
                                    <>
                                        <div className="col-span-2">
                                            <EditInput label="Clinic / Hospital Name" valueKey="clinicName" />
                                        </div>
                                        <div className="col-span-2">
                                            <EditInput label="Address" valueKey="clinicAddress" />
                                        </div>
                                        <EditInput label="City" valueKey="city" />
                                        <EditInput label="State" valueKey="state" />
                                        <EditInput label="Pincode" valueKey="pincode" />
                                        <EditInput label="Fax" valueKey="fax" />
                                    </>
                                ) : (
                                    <>
                                         <div className="col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase block">Clinic / Hospital Name</label>
                                            <p className="text-sm font-medium text-slate-900">{user.clinicName || '-'}</p>
                                        </div>
                                         <div className="col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase block flex items-center"><MapPin className="w-3 h-3 mr-1"/> Address</label>
                                            <p className="text-sm font-medium text-slate-900">
                                                {user.clinicAddress || '-'}
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                {user.city}, {user.state} {user.pincode && `- ${user.pincode}`}
                                            </p>
                                        </div>
                                        {user.fax && (
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase block">Fax</label>
                                                <p className="text-sm font-medium text-slate-900">{user.fax}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* PHARMACY SPECIFIC DETAILS */}
                {user.role === 'PHARMACY' && (
                    <>
                        <div>
                             <h4 className="font-bold text-slate-800 mb-3 flex items-center border-b border-slate-100 pb-2">
                                <Building2 className="w-4 h-4 mr-2 text-purple-600"/> Establishment Details
                            </h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {isEditing ? (
                                    <>
                                        <EditInput label="License Number (Form 20/21)" valueKey="licenseNumber" />
                                        <EditInput label="State" valueKey="state" />
                                        <div className="col-span-2">
                                            <EditInput label="Address" valueKey="clinicAddress" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block">License Number (Form 20/21)</label>
                                            <p className="text-sm font-medium text-slate-900 font-mono bg-slate-100 inline-block px-1 rounded">{user.licenseNumber || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block">State</label>
                                            <p className="text-sm font-medium text-slate-900">{user.state || '-'}</p>
                                        </div>
                                         <div className="col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase block flex items-center"><MapPin className="w-3 h-3 mr-1"/> Address</label>
                                            <p className="text-sm font-medium text-slate-900">{user.clinicAddress || '-'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* DOCUMENTS SECTION */}
                <div>
                    <h4 className="font-bold text-slate-800 mt-6 mb-3 flex items-center border-b border-slate-100 pb-2">
                        <FileText className="w-4 h-4 mr-2 text-slate-600"/> Submitted Documents
                    </h4>
                    {user.documents && user.documents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {user.documents.map((doc, i) => (
                                <div key={i} className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group">
                                    <div className="h-10 w-10 rounded bg-red-50 flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors">
                                         <FileText className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-sm font-medium text-slate-700 truncate" title={doc.name}>{doc.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">{doc.type.replace('_', ' ')}</p>
                                    </div>
                                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs bg-white border border-slate-300 text-slate-600 px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                        View
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-slate-100 rounded p-4 text-center">
                            <p className="text-sm text-slate-500 italic">No documents uploaded.</p>
                        </div>
                    )}
                </div>

            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-right rounded-b-xl">
                <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-md shadow-sm hover:bg-slate-50 text-sm font-medium transition-colors">
                    Close Profile
                </button>
            </div>
        </div>
    </div>
  );
}

const SecurityLogView = ({ logs, users }: { logs: AuditLog[], users: User[] }) => {
    const [activeTab, setActiveTab] = useState<'ALL' | 'DOCTOR' | 'PHARMACY' | 'ADMIN'>('ALL');

    // Create a robust user map to look up names/roles from actorId
    const userMap = useMemo(() => {
        const map = new Map<string, { name: string, role: string }>();
        // Add all registered users
        users.forEach(u => {
            map.set(u.id, { name: u.name, role: u.role });
        });
        // Add known system/admin accounts
        map.set('adm-root', { name: 'System Admin', role: 'SUPER_ADMIN' });
        return map;
    }, [users]);

    const getUserInfo = (actorId: string) => {
        return userMap.get(actorId) || { name: actorId, role: 'UNKNOWN' };
    };

    // Filter logs based on active tab and derived role
    const filteredLogs = logs.filter(log => {
        const userInfo = getUserInfo(log.actorId);
        
        if (activeTab === 'ALL') return true;
        
        if (activeTab === 'DOCTOR') {
            return userInfo.role === 'DOCTOR';
        }
        if (activeTab === 'PHARMACY') {
            return userInfo.role === 'PHARMACY';
        }
        if (activeTab === 'ADMIN') {
            return userInfo.role === 'ADMIN' || userInfo.role === 'SUPER_ADMIN' || userInfo.role.includes('ADMIN');
        }
        
        return false;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        <Lock className="w-4 h-4 mr-2 text-indigo-600"/> Security Log
                    </h3>
                    <span className="text-xs text-slate-500">Forensic Audit Trail</span>
                </div>
                
                {/* Role-Based Filters */}
                <div className="flex space-x-2">
                    {[
                        { id: 'ALL', label: 'All Events' },
                        { id: 'DOCTOR', label: 'Doctor Logs' },
                        { id: 'PHARMACY', label: 'Pharmacy Logs' },
                        { id: 'ADMIN', label: 'Admin Logs' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Timestamp (IST)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No matching security logs found.</td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => {
                                const info = getUserInfo(log.actorId);
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {/* FORCE IST (Indian Standard Time) for Audit Accuracy */}
                                            {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                            {info.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                            {info.role}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase 
                                                ${log.action.includes('LOGIN') ? 'bg-green-100 text-green-800' : 
                                                  log.action.includes('LOGOUT') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {log.details}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AnalyticsView = ({ users, prescriptions }: { users: User[], prescriptions: Prescription[] }) => {
    const doctors = users.filter(u => u.role === UserRole.DOCTOR);
    const pharmacies = users.filter(u => u.role === UserRole.PHARMACY);
    const dispensedRx = prescriptions.filter(p => p.status === 'DISPENSED');
    
    // Calculate top doctors
    const doctorRxCount: Record<string, number> = {};
    prescriptions.forEach(p => { doctorRxCount[p.doctorName] = (doctorRxCount[p.doctorName] || 0) + 1; });
    const topDoctors = Object.entries(doctorRxCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Calculate top pharmacies
    const pharmacyRxCount: Record<string, number> = {};
    prescriptions.forEach(p => { 
        if(p.pharmacyName) pharmacyRxCount[p.pharmacyName] = (pharmacyRxCount[p.pharmacyName] || 0) + 1; 
    });
    const topPharmacies = Object.entries(pharmacyRxCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Prescriptions</p>
                            <p className="text-3xl font-bold text-slate-900">{prescriptions.length}</p>
                        </div>
                        <FileText className="w-8 h-8 text-indigo-200"/>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Successfully Dispensed</p>
                            <p className="text-3xl font-bold text-green-600">{dispensedRx.length}</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-200"/>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Doctors</p>
                            <p className="text-3xl font-bold text-slate-900">{doctors.filter(d => d.verificationStatus === 'VERIFIED').length}</p>
                        </div>
                        <Activity className="w-8 h-8 text-blue-200"/>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Pharmacies</p>
                            <p className="text-3xl font-bold text-slate-900">{pharmacies.filter(p => p.verificationStatus === 'VERIFIED').length}</p>
                        </div>
                        <Activity className="w-8 h-8 text-purple-200"/>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Top Prescribing Doctors</h3>
                    {topDoctors.length > 0 ? (
                        <ul className="space-y-3">
                            {topDoctors.map(([name, count], idx) => (
                                <li key={name} className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">{idx + 1}. {name}</span>
                                    <span className="text-sm font-bold text-indigo-600">{count} Rx</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-slate-400">No data yet.</p>}
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Top Dispensing Pharmacies</h3>
                    {topPharmacies.length > 0 ? (
                        <ul className="space-y-3">
                            {topPharmacies.map(([name, count], idx) => (
                                <li key={name} className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">{idx + 1}. {name}</span>
                                    <span className="text-sm font-bold text-green-600">{count} Rx</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-slate-400">No data yet.</p>}
                </div>
            </div>
        </div>
    );
};

const PrescriptionLog = ({ prescriptions }: { prescriptions: Prescription[] }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Central Prescription Log</h3>
                <span className="text-xs text-slate-500">Audit Trail</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rx ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pharmacy</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {prescriptions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">No prescriptions recorded yet.</td>
                            </tr>
                        ) : (
                            prescriptions.map((rx) => (
                                <tr key={rx.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(rx.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-400">
                                        {rx.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {rx.doctorName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {rx.patientName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {rx.pharmacyName || 'Unassigned'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${rx.status === 'DISPENSED' ? 'bg-green-100 text-green-800' : 
                                              rx.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {rx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const UserRegistry = ({ 
    users, 
    onAction, 
    onTerminate,
    onDelete,
    onReset,
    onViewDocs,
    onViewProfile
}: { 
    users: User[], 
    onAction: (id: string, status: VerificationStatus) => void,
    onTerminate: (id: string, reason: string) => void,
    onDelete: (id: string) => void,
    onReset: (id: string) => void,
    onViewDocs: (docs: UserDocument[]) => void,
    onViewProfile: (user: User) => void
}) => {
    const [terminateModalUser, setTerminateModalUser] = useState<string | null>(null);
    const [terminationReason, setTerminationReason] = useState("");

    const confirmTermination = () => {
        if(terminateModalUser && terminationReason) {
            onTerminate(terminateModalUser, terminationReason);
            setTerminateModalUser(null);
            setTerminationReason("");
        }
    };

    const handleDeleteClick = (userId: string) => {
        if (window.confirm("Are you sure you want to PERMANENTLY DELETE this user? This action cannot be undone.")) {
            onDelete(userId);
        }
    };

    const filtered = users.filter(u => u.role !== UserRole.ADMIN);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Master User Registry</h3>
                <span className="text-xs text-slate-500">All registered entities</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Docs</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filtered.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div 
                                        onClick={() => onViewProfile(u)}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        {u.name}
                                    </div>
                                    <div className="text-xs text-slate-500">ID: {u.id}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-slate-700">{u.role}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${u.verificationStatus === VerificationStatus.VERIFIED ? 'bg-green-100 text-green-800' : 
                                          u.verificationStatus === VerificationStatus.PENDING ? 'bg-blue-100 text-blue-800' : 
                                          u.verificationStatus === VerificationStatus.TERMINATED ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}>
                                        {u.verificationStatus}
                                    </span>
                                    {u.verificationStatus === VerificationStatus.TERMINATED && (
                                        <div className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={u.terminationReason || ''}>
                                            Reason: {u.terminationReason}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {u.documents && u.documents.length > 0 ? (
                                        <button onClick={() => onViewDocs(u.documents!)} className="text-indigo-600 hover:underline flex items-center text-xs">
                                            <FileText className="w-4 h-4 mr-1"/> {u.documents.length} Files
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-400">None</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    {u.verificationStatus === VerificationStatus.VERIFIED && (
                                        <>
                                            <button 
                                                onClick={() => onReset(u.id)}
                                                className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                                title="Reset Password"
                                            >
                                                <RefreshCw className="w-4 h-4"/>
                                            </button>
                                            <button 
                                                onClick={() => setTerminateModalUser(u.id)}
                                                className="text-amber-600 hover:text-amber-900 inline-flex items-center"
                                                title="Terminate Account (Block)"
                                            >
                                                <Ban className="w-4 h-4"/>
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        onClick={() => handleDeleteClick(u.id)}
                                        className="text-red-600 hover:text-red-900 inline-flex items-center ml-2"
                                        title="Permanently Delete"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Termination Modal */}
            {terminateModalUser && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center text-red-600 mb-4">
                            <AlertTriangle className="w-6 h-6 mr-2"/>
                            <h3 className="text-lg font-bold">Confirm Termination</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            This action will strictly block access for the user. This cannot be easily undone without DB admin intervention.
                        </p>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Termination (Required)</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded p-2 text-sm mb-4" 
                            rows={3}
                            placeholder="e.g. Violation of Telemedicine Act 2020 section 4..."
                            value={terminationReason}
                            onChange={(e) => setTerminationReason(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => { setTerminateModalUser(null); setTerminationReason(""); }}
                                className="px-4 py-2 text-sm text-slate-600"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmTermination}
                                disabled={!terminationReason.trim()}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                                Confirm Terminate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RoleManagement = () => {
    const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ADMIN_USERS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAdmin, setNewAdmin] = useState<Partial<AdminUser>>({
        role: AdminRole.REVIEWER,
        permissions: getPermissionsForRole(AdminRole.REVIEWER)
    });

    const handleRoleChange = (role: AdminRole) => {
        setNewAdmin(prev => ({
            ...prev,
            role,
            permissions: getPermissionsForRole(role)
        }));
    };

    const handleSave = () => {
        if(!newAdmin.name || !newAdmin.email) return;
        const admin: AdminUser = {
            id: `adm-${Date.now()}`,
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role as AdminRole,
            permissions: newAdmin.permissions || [],
            status: 'ACTIVE'
        };
        setAdmins([...admins, admin]);
        setIsModalOpen(false);
        setNewAdmin({ role: AdminRole.REVIEWER, permissions: getPermissionsForRole(AdminRole.REVIEWER) });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Internal Admin Team</h2>
                    <p className="text-slate-500 text-sm">Manage staff access and RBAC policies.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center">
                    <Plus className="w-4 h-4 mr-2"/> Create Admin Account
                </button>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Admin User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Effective Permissions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {admins.map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{u.name}</div>
                                    <div className="text-xs text-slate-500">{u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${u.role === AdminRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {u.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {u.permissions.map(p => (
                                            <span key={p} className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                                                {p.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Add New Admin User</h3>
                        <div className="space-y-4">
                            <input 
                                className="w-full border p-2 rounded" 
                                placeholder="Full Name" 
                                onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                            />
                            <input 
                                className="w-full border p-2 rounded" 
                                placeholder="Email" 
                                onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                            />
                            <div>
                                <label className="block text-sm font-medium mb-2">Assign Role (Auto-sets Permissions)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[AdminRole.SUPER_ADMIN, AdminRole.COMPLIANCE_ADMIN, AdminRole.REVIEWER].map(role => (
                                        <button 
                                            key={role}
                                            onClick={() => handleRoleChange(role)}
                                            className={`text-xs p-2 border rounded ${newAdmin.role === role ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-50'}`}
                                        >
                                            {role.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded border border-slate-200 h-32 overflow-y-auto">
                                <p className="text-xs font-bold text-slate-500 mb-2">Permissions granted by this role:</p>
                                <ul className="text-xs text-slate-600 space-y-1">
                                    {newAdmin.permissions?.map(p => <li key={p} className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-1 text-green-500"/> {p}</li>)}
                                </ul>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                                <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Account</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminStats = ({ users, onFilter }: { users: User[], onFilter: (status: VerificationStatus | 'ALL') => void }) => {
    const pending = users.filter(u => u.verificationStatus === VerificationStatus.PENDING).length;
    const verified = users.filter(u => u.verificationStatus === VerificationStatus.VERIFIED).length;
    const terminated = users.filter(u => u.verificationStatus === VerificationStatus.TERMINATED).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <button onClick={() => onFilter('ALL')} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-left hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="text-slate-500 text-xs font-bold uppercase">Total Users</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{users.length}</div>
            </button>
            <button onClick={() => onFilter(VerificationStatus.PENDING)} className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 text-left hover:border-blue-400 hover:shadow-md transition-all relative overflow-hidden">
                <div className="text-blue-700 text-xs font-bold uppercase relative z-10">Pending Review</div>
                <div className="text-2xl font-bold text-blue-900 mt-1 relative z-10">{pending}</div>
                <Activity className="absolute right-2 bottom-2 w-12 h-12 text-blue-100 -z-0" />
            </button>
            <button onClick={() => onFilter(VerificationStatus.VERIFIED)} className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200 text-left hover:border-green-400 hover:shadow-md transition-all">
                <div className="text-green-700 text-xs font-bold uppercase">Verified Active</div>
                <div className="text-2xl font-bold text-green-900 mt-1">{verified}</div>
            </button>
            <button onClick={() => onFilter(VerificationStatus.TERMINATED)} className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200 text-left hover:border-red-400 hover:shadow-md transition-all">
                <div className="text-red-700 text-xs font-bold uppercase">Terminated</div>
                <div className="text-2xl font-bold text-red-900 mt-1">{terminated}</div>
            </button>
        </div>
    );
};

const ApprovalQueue = ({ 
    users, 
    onAction, 
    onViewDocs 
}: { 
    users: User[], 
    onAction: (id: string, status: VerificationStatus) => void,
    onViewDocs: (docs: UserDocument[]) => void 
}) => {
    const pendingUsers = users.filter(u => u.verificationStatus === VerificationStatus.PENDING);

    if (pendingUsers.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-dashed border-slate-300 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-100 mx-auto mb-3" />
                <h3 className="text-slate-900 font-medium">All caught up!</h3>
                <p className="text-slate-500 text-sm">No pending verifications in the queue.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50 flex justify-between items-center">
                <h3 className="font-bold text-indigo-900 flex items-center">
                    <ShieldAlert className="w-5 h-5 mr-2" /> Verification Queue
                </h3>
                <span className="bg-indigo-200 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full">{pendingUsers.length} Pending</span>
            </div>
            <div className="divide-y divide-slate-100">
                {pendingUsers.map(user => (
                    <div key={user.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${user.role === 'DOCTOR' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                    {user.role}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">ID: {user.id}</span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900">{user.name}</h4>
                            
                            {/* Expanded Verification Details */}
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600 bg-slate-50/50 p-3 rounded border border-slate-100">
                                <p className="flex items-center"><span className="font-bold w-20 text-slate-500">License:</span> <span className="font-mono bg-white px-1 border border-slate-200 rounded">{user.licenseNumber || 'N/A'}</span></p>
                                <p className="flex items-center"><span className="font-bold w-20 text-slate-500">Phone:</span> {user.phone}</p>
                                <p className="flex items-center sm:col-span-2"><span className="font-bold w-20 text-slate-500">Address:</span> {user.clinicAddress}, {user.city}</p>
                                
                                {user.role === 'DOCTOR' && (
                                    <>
                                        <p className="flex items-center sm:col-span-2"><span className="font-bold w-20 text-slate-500">Quals:</span> {user.qualifications}</p>
                                        <p className="flex items-center"><span className="font-bold w-20 text-slate-500">Specialty:</span> {user.specialty || '-'}</p>
                                        <p className="flex items-center"><span className="font-bold w-20 text-slate-500">NMC UID:</span> {user.nmrUid}</p>
                                    </>
                                )}
                            </div>
                            
                            <div className="mt-3 flex items-center gap-3">
                                {user.documents && user.documents.length > 0 ? (
                                    <button 
                                        onClick={() => onViewDocs(user.documents!)}
                                        className="text-xs flex items-center text-indigo-600 font-medium hover:underline bg-indigo-50 px-2 py-1 rounded border border-indigo-100"
                                    >
                                        <FileText className="w-3 h-3 mr-1"/> Review {user.documents.length} Documents
                                    </button>
                                ) : (
                                    <span className="text-xs text-red-500 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> No Docs Uploaded</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => onAction(user.id, VerificationStatus.REJECTED)}
                                className="px-4 py-2 border border-red-200 text-red-700 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                            >
                                Reject
                            </button>
                            <button 
                                onClick={() => onAction(user.id, VerificationStatus.VERIFIED)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 shadow-sm transition-colors flex items-center"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2"/> Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    users, 
    prescriptions, 
    onUpdateStatus,
    onTerminateUser,
    onDeleteUser,
    onResetPassword,
    onEditUser,
    auditLogs = []
}) => {
    const [activeView, setActiveView] = useState<'OVERVIEW' | 'REGISTRY' | 'ROLES' | 'ANALYTICS' | 'RX_LOGS' | 'SECURITY_LOG'>('OVERVIEW');
    const [filterStatus, setFilterStatus] = useState<VerificationStatus | 'ALL'>('ALL');
    const [viewDocs, setViewDocs] = useState<UserDocument[] | null>(null);
    const [profileUser, setProfileUser] = useState<User | null>(null);

    const displayedUsers = filterStatus === 'ALL' 
        ? users 
        : users.filter(u => u.verificationStatus === filterStatus);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Sidebar */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                    <div className="p-4 bg-indigo-900 text-white">
                         <span className="font-bold tracking-wide block">Admin Panel</span>
                         <span className="text-xs text-indigo-300">DevXWorld Secure</span>
                    </div>
                    <nav className="p-2 space-y-1">
                        <button onClick={() => setActiveView('OVERVIEW')} className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${activeView === 'OVERVIEW' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                            Dashboard & Queue
                        </button>
                        <button onClick={() => setActiveView('ANALYTICS')} className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${activeView === 'ANALYTICS' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                            Analytics
                        </button>
                        <button onClick={() => setActiveView('RX_LOGS')} className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${activeView === 'RX_LOGS' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                            Prescription Logs
                        </button>
                         <button onClick={() => setActiveView('SECURITY_LOG')} className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${activeView === 'SECURITY_LOG' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                            Security Logs
                        </button>
                        <button onClick={() => setActiveView('REGISTRY')} className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${activeView === 'REGISTRY' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                            Master Registry
                        </button>
                        <button onClick={() => setActiveView('ROLES')} className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${activeView === 'ROLES' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                            Access Control (RBAC)
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-10 min-h-[600px]">
                {activeView === 'OVERVIEW' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">System Overview</h2>
                        <AdminStats users={users} onFilter={(s) => { setFilterStatus(s); setActiveView('REGISTRY'); }} />
                        <ApprovalQueue users={users} onAction={onUpdateStatus} onViewDocs={setViewDocs} />
                    </div>
                )}

                {activeView === 'ANALYTICS' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Analytics Dashboard</h2>
                        <AnalyticsView users={users} prescriptions={prescriptions} />
                    </div>
                )}

                {activeView === 'RX_LOGS' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">E-Prescription Logs</h2>
                        <PrescriptionLog prescriptions={prescriptions} />
                    </div>
                )}

                {activeView === 'SECURITY_LOG' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Security Audit Logs</h2>
                        <SecurityLogView logs={auditLogs} users={users} />
                    </div>
                )}

                {activeView === 'REGISTRY' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">User Registry & Compliance</h2>
                        <UserRegistry 
                            users={displayedUsers} 
                            onAction={onUpdateStatus} 
                            onTerminate={onTerminateUser}
                            onDelete={onDeleteUser}
                            onReset={onResetPassword}
                            onViewDocs={setViewDocs}
                            onViewProfile={setProfileUser}
                        />
                    </div>
                )}

                {activeView === 'ROLES' && (
                     <RoleManagement />
                )}
            </div>

            {/* Document Viewer Modal */}
            {viewDocs && (
                <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center"><FileText className="w-5 h-5 mr-2 text-indigo-600"/> Verified Documents</h3>
                            <button onClick={() => setViewDocs(null)} className="text-slate-500 hover:text-slate-700 font-bold text-xl">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {viewDocs.map((doc, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded shadow border border-slate-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{doc.type.replace('_', ' ')}</span>
                                            <span className="text-xs text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="aspect-[4/3] bg-slate-100 rounded overflow-hidden border border-slate-200 flex items-center justify-center group relative">
                                            {doc.name.toLowerCase().endsWith('.pdf') ? (
                                                <div className="text-center p-4">
                                                    <FileText className="w-16 h-16 text-red-500 mx-auto mb-2"/>
                                                    <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{doc.name}</p>
                                                    <a href={doc.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-indigo-600 hover:underline">Download / View PDF</a>
                                                </div>
                                            ) : (
                                                <a href={doc.url} target="_blank" rel="noreferrer">
                                                    <img src={doc.url} alt={doc.type} className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"/>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-white text-right">
                            <button onClick={() => setViewDocs(null)} className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 text-sm font-medium">Close Viewer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile Modal */}
            {profileUser && (
                <UserProfileModal 
                    user={profileUser} 
                    onClose={() => setProfileUser(null)} 
                    onSave={(updatedUser) => {
                        onEditUser(updatedUser);
                        setProfileUser(updatedUser); // Update the view immediately
                    }}
                />
            )}
        </div>
    );
};
