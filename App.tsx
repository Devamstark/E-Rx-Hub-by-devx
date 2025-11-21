
import React, { useState, useEffect } from 'react';
import { Layout } from './components/ui/Layout';
import { Login } from './components/auth/Login';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { PharmacyDashboard } from './components/pharmacy/PharmacyDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { User, UserRole, VerificationStatus, DoctorProfile, Prescription } from './types';
import { dbService } from './services/db';
import { Loader2 } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Application State
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // --- Initialization & Session Restore ---
  useEffect(() => {
      const init = async () => {
          const { users, rx } = await dbService.loadData();
          setRegisteredUsers(users);
          setPrescriptions(rx);

          // Restore Session
          try {
              const storedSessionId = localStorage.getItem('devx_active_session_id');
              if (storedSessionId) {
                  // Find the user in the fresh data to ensure they still exist and have correct role/status
                  const validUser = users.find(u => u.id === storedSessionId);
                  
                  if (validUser) {
                      // Optional: Security check (e.g. if they were terminated since last login)
                      if (validUser.verificationStatus === VerificationStatus.TERMINATED) {
                          localStorage.removeItem('devx_active_session_id');
                      } else {
                          setCurrentUser(validUser);
                      }
                  } else {
                      // User ID in storage no longer exists in DB
                      localStorage.removeItem('devx_active_session_id');
                  }
              }
          } catch (e) {
              console.error("Session restore error:", e);
          }

          setIsLoaded(true);
      };
      init();
  }, []);

  // --- Persistence Listeners ---
  // Only save when data changes AND after initial load (to prevent overwriting cloud with empty defaults)
  useEffect(() => {
      if (isLoaded) {
          dbService.saveUsers(registeredUsers);
      }
  }, [registeredUsers, isLoaded]);

  useEffect(() => {
      if (isLoaded) {
          dbService.savePrescriptions(prescriptions);
      }
  }, [prescriptions, isLoaded]);

  // Sync currentUser state with registeredUsers updates (e.g., if Admin changes current user's status)
  useEffect(() => {
      if (currentUser && isLoaded) {
          const freshUser = registeredUsers.find(u => u.id === currentUser.id);
          if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
              setCurrentUser(freshUser);
          }
      }
  }, [registeredUsers, currentUser, isLoaded]);


  // Filter Verified Pharmacies for Doctor View
  const verifiedPharmacies = registeredUsers.filter(
      u => u.role === UserRole.PHARMACY && u.verificationStatus === VerificationStatus.VERIFIED
  );

  // --- Actions ---

  const handleRegister = (newUser: User) => {
    setRegisteredUsers(prev => [...prev, newUser]);
    return true;
  };

  const handleUpdateUserStatus = (userId: string, newStatus: VerificationStatus) => {
    setRegisteredUsers(prev => 
      prev.map(u => u.id === userId ? { ...u, verificationStatus: newStatus } : u)
    );
  };

  const handleUpdateUser = (updatedUser: User) => {
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

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

  const handleDeleteUser = (userId: string) => {
    setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleResetPassword = (userId: string) => {
    const tempPassword = Math.random().toString(36).slice(-8); // Generate random 8-char password
    setRegisteredUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, password: tempPassword, forcePasswordChange: true } : u)
    );
    alert(`PASSWORD RESET SUCCESSFUL\n\nUser ID: ${userId}\nTemporary Password: ${tempPassword}\n\nPlease copy and share this password securely with the user.`);
  };

  const handleCreatePrescription = (rxData: Prescription) => {
    // Sequential ID Generation Logic
    const currentCount = prescriptions.length + 1;
    // Pad with zeros to 9 digits: 000000001
    const sequentialId = currentCount.toString().padStart(9, '0');

    const newRxWithId: Prescription = {
        ...rxData,
        id: sequentialId
    };
    
    setPrescriptions(prev => [newRxWithId, ...prev]);
  };

  const handleDispensePrescription = (rxId: string) => {
    setPrescriptions(prev => 
        prev.map(rx => rx.id === rxId ? { ...rx, status: 'DISPENSED' } : rx)
    );
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Persist session
    localStorage.setItem('devx_active_session_id', user.id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Clear session
    localStorage.removeItem('devx_active_session_id');
  };

  const handleDoctorVerificationComplete = (profile: DoctorProfile) => {
      // Merge the profile data into the User object
      if (!currentUser) return;

      const updatedUser: User = {
          ...currentUser,
          verificationStatus: VerificationStatus.PENDING, // Set back to pending for admin review
          // Map profile fields to User fields for persistence
          licenseNumber: profile.registrationNumber,
          state: profile.state,
          qualifications: profile.qualifications,
          nmrUid: profile.nmrUid,
          specialty: profile.specialty,
          clinicName: profile.clinicName,
          clinicAddress: profile.clinicAddress,
          city: profile.city,
          pincode: profile.pincode,
          phone: profile.phone,
          fax: profile.fax,
          stateCouncil: profile.stateCouncil,
          documents: profile.documents
      };
      
      handleUpdateUser(updatedUser);
      alert("Details submitted to Admin for re-verification.");
  };

  // --- Render ---

  if (!isLoaded) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4"/>
                  <p className="text-slate-500 font-medium">Connecting to DevXWorld Secure Cloud...</p>
              </div>
          </div>
      );
  }

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
                onUpdateUser={handleUpdateUser}
            />
          )}
          {currentUser.role === UserRole.ADMIN && (
            <AdminDashboard 
              users={registeredUsers}
              prescriptions={prescriptions}
              onUpdateStatus={handleUpdateUserStatus}
              onTerminateUser={handleTerminateUser}
              onDeleteUser={handleDeleteUser}
              onResetPassword={handleResetPassword}
              onEditUser={handleUpdateUser}
            />
          )}
        </div>
      )}
    </Layout>
  );
}

export default App;
