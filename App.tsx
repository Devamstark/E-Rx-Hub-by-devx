
import React, { useState, useEffect } from 'react';
import { Layout } from './components/ui/Layout';
import { Login } from './components/auth/Login';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { PharmacyDashboard } from './components/pharmacy/PharmacyDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { User, UserRole, VerificationStatus, DoctorProfile, Prescription } from './types';

// Initial System State - ONLY Super Admin exists
const INITIAL_USERS: User[] = [
  {
    id: 'adm-root',
    name: 'DevX Super Admin',
    email: 'admin',
    password: 'admin',
    role: UserRole.ADMIN,
    verificationStatus: VerificationStatus.VERIFIED,
    registrationDate: new Date().toISOString()
  }
];

// Persistence Helper
const loadFromStorage = <T,>(key: string, fallback: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
        console.error("Storage Load Error", e);
        return fallback;
    }
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Load state from local storage or use initial defaults
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => 
      loadFromStorage('devx_users', INITIAL_USERS)
  );
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => 
      loadFromStorage('devx_prescriptions', [])
  );

  // Persist state changes
  useEffect(() => {
      localStorage.setItem('devx_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
      localStorage.setItem('devx_prescriptions', JSON.stringify(prescriptions));
  }, [prescriptions]);

  // Filter Verified Pharmacies for Doctor View
  const verifiedPharmacies = registeredUsers.filter(
      u => u.role === UserRole.PHARMACY && u.verificationStatus === VerificationStatus.VERIFIED
  );

  // Handle new registrations from Login screen
  const handleRegister = (newUser: User) => {
    setRegisteredUsers(prev => [...prev, newUser]);
    return true;
  };

  // Handle Status Updates from Admin Dashboard
  const handleUpdateUserStatus = (userId: string, newStatus: VerificationStatus) => {
    setRegisteredUsers(prev => 
      prev.map(u => u.id === userId ? { ...u, verificationStatus: newStatus } : u)
    );
  };

  // Handle User Termination with Reason
  const handleTerminateUser = (userId: string, reason: string) => {
    setRegisteredUsers(prev => 
        prev.map(u => u.id === userId ? { 
            ...u, 
            verificationStatus: VerificationStatus.TERMINATED,
            terminatedAt: new Date().toISOString(),
            terminatedBy: currentUser?.id || 'SYSTEM',
            terminationReason: reason
        } : u)
    );
  };

  // Handle Password Reset
  const handleResetPassword = (userId: string) => {
    setRegisteredUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, forcePasswordChange: true } : u)
    );
    alert(`Temporary password sent to user ${userId}.`);
  };

  // Handle Prescription Creation
  const handleCreatePrescription = (newRx: Prescription) => {
    setPrescriptions(prev => [newRx, ...prev]);
  };

  // Handle Dispense
  const handleDispensePrescription = (rxId: string) => {
    setPrescriptions(prev => 
        prev.map(rx => rx.id === rxId ? { ...rx, status: 'DISPENSED' } : rx)
    );
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleDoctorVerificationComplete = (profile: DoctorProfile) => {
      console.log("Verification Submitted:", profile);
      // In a real app, this would update the user's detailed profile
      // For prototype, assume it triggers a re-review
      alert("Details submitted to Admin for re-verification.");
  };

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      {!currentUser ? (
        <Login 
          onLogin={handleLogin} 
          users={registeredUsers} 
          onRegister={handleRegister}
        />
      ) : (
        <div className="animate-in fade-in duration-500">
          {currentUser.role === UserRole.DOCTOR && (
            <DoctorDashboard 
                status={currentUser.verificationStatus} 
                onVerificationComplete={handleDoctorVerificationComplete}
                prescriptions={prescriptions}
                onCreatePrescription={handleCreatePrescription}
                currentUser={currentUser}
                verifiedPharmacies={verifiedPharmacies}
            />
          )}
          {currentUser.role === UserRole.PHARMACY && (
            <PharmacyDashboard 
                prescriptions={prescriptions}
                onDispense={handleDispensePrescription}
                currentUser={currentUser}
            />
          )}
          {currentUser.role === UserRole.ADMIN && (
            <AdminDashboard 
              users={registeredUsers}
              prescriptions={prescriptions}
              onUpdateStatus={handleUpdateUserStatus}
              onTerminateUser={handleTerminateUser}
              onResetPassword={handleResetPassword}
            />
          )}
        </div>
      )}
    </Layout>
  );
}

export default App;
