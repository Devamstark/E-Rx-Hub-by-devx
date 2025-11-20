
import React, { useState } from 'react';
import { Users, ShieldAlert, LayoutDashboard, Shield, Lock, Edit2, Plus, CheckCircle2, XCircle, AlertTriangle, Trash2, FileText, Activity, RefreshCw } from 'lucide-react';
import { AdminRole, AdminPermission, AdminUser, User, UserRole, VerificationStatus, Prescription } from '../../types';

interface AdminDashboardProps {
    users: User[];
    prescriptions: Prescription[];
    onUpdateStatus: (userId: string, status: VerificationStatus) => void;
    onTerminateUser: (userId: string, reason: string) => void;
    onResetPassword: (userId: string) => void;
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
    onReset 
}: { 
    users: User[], 
    onAction: (id: string, status: VerificationStatus) => void,
    onTerminate: (id: string, reason: string) => void,
    onReset: (id: string) => void
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filtered.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900">{u.name}</div>
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
                                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                                                title="Terminate Account"
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </>
                                    )}
                                    {u.verificationStatus === VerificationStatus.TERMINATED && (
                                        <span className="text-slate-400 text-xs italic">Access Revoked</span>
                                    )}
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

const AdminStats = ({ users, onFilter }: { users: User[], onFilter: (s: VerificationStatus | 'ALL') => void }) => {
    const doctors = users.filter(u => u.role === UserRole.DOCTOR);
    const pharmacies = users.filter(u => u.role === UserRole.PHARMACY);
    
    const pending = users.filter(u => u.verificationStatus === VerificationStatus.PENDING && u.role !== UserRole.ADMIN);
    const active = users.filter(u => u.verificationStatus === VerificationStatus.VERIFIED && u.role !== UserRole.ADMIN);
    const terminated = users.filter(u => u.verificationStatus === VerificationStatus.TERMINATED);

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
             <div onClick={() => onFilter('ALL')} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors">
                <p className="text-xs text-slate-500 uppercase font-bold">Total Reg.</p>
                <p className="text-2xl font-bold text-slate-900">{users.length - 1}</p> {/* Exclude root admin */}
                <p className="text-xs text-slate-400 mt-1">{doctors.length} Doc / {pharmacies.length} Ph</p>
            </div>
            <div onClick={() => onFilter(VerificationStatus.PENDING)} className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                <p className="text-xs text-blue-600 uppercase font-bold">Pending Approval</p>
                <p className="text-2xl font-bold text-blue-900">{pending.length}</p>
                <p className="text-xs text-blue-600 mt-1">Action Required</p>
            </div>
            <div onClick={() => onFilter(VerificationStatus.VERIFIED)} className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                <p className="text-xs text-green-600 uppercase font-bold">Active Users</p>
                <p className="text-2xl font-bold text-green-900">{active.length}</p>
                <p className="text-xs text-green-600 mt-1">Verified Access</p>
            </div>
            <div onClick={() => onFilter(VerificationStatus.TERMINATED)} className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                <p className="text-xs text-red-600 uppercase font-bold">Terminated</p>
                <p className="text-2xl font-bold text-red-900">{terminated.length}</p>
                <p className="text-xs text-red-600 mt-1">Access Blocked</p>
            </div>
        </div>
    );
};

const ApprovalQueue = ({ users, onAction }: { users: User[], onAction: (id: string, status: VerificationStatus) => void }) => {
    const pendingUsers = users.filter(u => u.verificationStatus === VerificationStatus.PENDING && u.role !== UserRole.ADMIN);

    if (pendingUsers.length === 0) {
        return (
            <div className="bg-white p-12 rounded-lg border border-slate-200 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">All Caught Up!</h3>
                <p className="text-slate-500">No pending applications to review.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-blue-50 flex items-center">
                <ShieldAlert className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-bold text-blue-900">Pending Applications ({pendingUsers.length})</h3>
            </div>
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Applicant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">License Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Decision</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {pendingUsers.map(u => (
                        <tr key={u.id}>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-slate-900">{u.name}</div>
                                <div className="text-sm text-slate-500">{u.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === UserRole.DOCTOR ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'}`}>
                                    {u.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {u.licenseNumber} ({u.state})
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {new Date(u.registrationDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button onClick={() => onAction(u.id, VerificationStatus.VERIFIED)} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded border border-green-200 hover:bg-green-100">Approve</button>
                                <button onClick={() => onAction(u.id, VerificationStatus.REJECTED)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded border border-red-200 hover:bg-red-100">Reject</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    users, 
    prescriptions, 
    onUpdateStatus,
    onTerminateUser,
    onResetPassword 
}) => {
    const [activeView, setActiveView] = useState<'OVERVIEW' | 'REGISTRY' | 'ROLES' | 'ANALYTICS' | 'RX_LOGS'>('OVERVIEW');
    const [filterStatus, setFilterStatus] = useState<VerificationStatus | 'ALL'>('ALL');

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
                        <ApprovalQueue users={users} onAction={onUpdateStatus} />
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

                {activeView === 'REGISTRY' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">User Registry & Compliance</h2>
                        <UserRegistry 
                            users={displayedUsers} 
                            onAction={onUpdateStatus} 
                            onTerminate={onTerminateUser}
                            onReset={onResetPassword}
                        />
                    </div>
                )}

                {activeView === 'ROLES' && (
                     <RoleManagement />
                )}
            </div>
        </div>
    );
};
