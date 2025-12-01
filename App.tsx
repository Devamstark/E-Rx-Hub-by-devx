
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/ui/Layout';
import { Login } from './components/auth/Login';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { PharmacyDashboard } from './components/pharmacy/PharmacyDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RxVerification } from './components/public/RxVerification';
import { LabUpload } from './components/public/LabUpload';
import { User, UserRole, VerificationStatus, DoctorProfile, Prescription, Patient, AuditLog, SalesReturn, LabReferral, Appointment, MedicalCertificate } from './types';
import { dbService } from './services/db';
import { Loader2, Clock, LogOut } from 'lucide-react';
import { DocumentationViewer } from './components/ui/DocumentationViewer';

// Session Timeout Constants
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutes
const WARNING_THRESHOLD_MS = 29.5 * 60 * 1000; // 29.5 Minutes (Warning 30s before)

function App() {
  // ROUTING LOGIC: Check for Public Verification Route
  // Checks for both /verify path AND mode=verify query param to support static host fallback
  const urlParams = new URLSearchParams(window.location.search);
  const verifyId = urlParams.get('rx_id');
  const refId = urlParams.get('ref_id');
  const prefillCode = urlParams.get('code');
  const mode = urlParams.get('mode');
  
  const isVerifyRoute = window.location.pathname === '/verify' || mode === 'verify';
  const isLabUploadRoute = mode === 'lab_upload';

  if (isVerifyRoute && verifyId) {
      return <RxVerification rxId={verifyId} />;
  }

  if (isLabUploadRoute && refId) {
      return <LabUpload referralId={refId} prefillCode={prefillCode || undefined} />;
  }

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  
  // Application State
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [labReferrals, setLabReferrals] = useState<LabReferral[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [certificates, setCertificates] = useState<MedicalCertificate[]>([]);

  // Session Management State
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  // --- Session Management Logic ---
  const handleLogout = useCallback(async () => {
    // CRITICAL: LOGOUT SECURITY LOGGING
    if (currentUser) {
        await dbService.logSecurityAction(currentUser.id, 'USER_LOGOUT', 'Session terminated/Logout');
    }
    setCurrentUser(null);
    localStorage.removeItem('devx_active_session_id');
    setShowSessionWarning(false);
    if (dbService.isCloudEnabled()) {
        await dbService.signOut();
    }
  }, [currentUser]);

  // Idle Check Loop
  useEffect(() => {
      if (!currentUser) return;

      const resetIdleTimer = () => {
          lastActivityRef.current = Date.now();
          if (showSessionWarning) setShowSessionWarning(false);
      };

      const events = ['mousemove', 'keydown', 'scroll', 'click'];
      events.forEach(event => window.addEventListener(event, resetIdleTimer));

      const intervalId = setInterval(() => {
          const now = Date.now();
          const timeSinceLastActivity = now - lastActivityRef.current;

          if (timeSinceLastActivity >= IDLE_TIMEOUT_MS) {
              handleLogout();
              // Do not use alert(), UI feedback is sufficient or specific logout page
              // Since alert blocks thread, we avoid it for auto-logout to allow clean cleanup
          } else if (timeSinceLastActivity >= WARNING_THRESHOLD_MS) {
              setShowSessionWarning(true);
          }
      }, 5000);

      return () => {
          events.forEach(event => window.removeEventListener(event, resetIdleTimer));
          clearInterval(intervalId);
      };
  }, [currentUser, handleLogout, showSessionWarning]);


  // --- Initialization & Session Restore ---
  useEffect(() => {
      const init = async () => {
          const { users, rx, patients: loadedPatients, auditLogs: loadedLogs, labReferrals: loadedLabs, appointments: loadedApts, certificates: loadedCerts } = await dbService.loadData();
          setRegisteredUsers(users);
          setPrescriptions(rx);
          setPatients(loadedPatients);
          setAuditLogs(loadedLogs);
          setLabReferrals(loadedLabs);
          setSalesReturns(dbService.getSalesReturns()); // Load returns
          setAppointments(loadedApts);
          setCertificates(loadedCerts);

          // Restore Session
          try {
              const storedSessionId = localStorage.getItem('devx_active_session_id');
              if (storedSessionId) {
                  const validUser = users.find(u => u.id === storedSessionId);
                  if (validUser) {
                      if (validUser.verificationStatus === VerificationStatus.TERMINATED) {
                          localStorage.removeItem('devx_active_session_id');
                      } else {
                          setCurrentUser(validUser);
                          // Update activity ref on restore to prevent immediate timeout
                          lastActivityRef.current = Date.now();
                      }
                  } else {
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

  useEffect(() => {
      if (isLoaded) {
          dbService.savePatients(patients);
      }
  }, [patients, isLoaded]);

  useEffect(() => {
      if (isLoaded) {
          dbService.saveSalesReturns(salesReturns);
      }
  }, [salesReturns, isLoaded]);
  
  useEffect(() => {
      if (isLoaded) {
          dbService.saveLabReferrals(labReferrals);
      }
  }, [labReferrals, isLoaded]);

  useEffect(() => {
      if (isLoaded) {
          dbService.saveAppointments(appointments);
      }
  }, [appointments, isLoaded]);

  useEffect(() => {
      if (isLoaded) {
          dbService.saveCertificates(certificates);
      }
  }, [certificates, isLoaded]);

  // Sync currentUser state with registeredUsers updates
  useEffect(() => {
      if (currentUser && isLoaded) {
          const freshUser = registeredUsers.find(u => u.id === currentUser.id);
          if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
              setCurrentUser(freshUser);
          }
      }
  }, [registeredUsers, currentUser, isLoaded]);


  // Filter Verified Pharmacies for Doctor View (Includes DIRECTORY listing)
  const verifiedPharmacies = registeredUsers.filter(
      u => u.role === UserRole.PHARMACY && (u.verificationStatus === VerificationStatus.VERIFIED || u.verificationStatus === VerificationStatus.DIRECTORY)
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
    const tempPassword = Math.random().toString(36).slice(-8); 
    setRegisteredUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, password: tempPassword, forcePasswordChange: true } : u)
    );
    alert(`PASSWORD RESET SUCCESSFUL\n\nUser ID: ${userId}\nTemporary Password: ${tempPassword}\n\nPlease copy and share this password securely with the user.`);
  };

  const handleCreatePrescription = (rxData: Prescription) => {
    console.log("App: Creating Prescription...", rxData);
    const currentCount = prescriptions.length + 1;
    const sequentialId = currentCount.toString().padStart(9, '0');
    
    // Check if patient info is missing and try to patch it (redundancy check)
    let finalPatientName = rxData.patientName;
    if (!finalPatientName && rxData.patientId) {
         const p = patients.find(pat => pat.id === rxData.patientId);
         if (p) finalPatientName = p.fullName;
    }
    if (!finalPatientName) finalPatientName = 'Unknown Patient';

    const newRxWithId: Prescription = {
        ...rxData,
        patientName: finalPatientName,
        id: sequentialId
    };
    
    // Ensure we are adding to state, which triggers useEffect -> savePrescriptions
    setPrescriptions(prev => [newRxWithId, ...prev]);

    // Log Security Action with Correct ID
    if (currentUser) {
        dbService.logSecurityAction(
            currentUser.id, 
            'RX_CREATED', 
            `Rx #${sequentialId} SENT_TO_PHARMACY (${newRxWithId.pharmacyName}) for ${newRxWithId.patientName}`
        );
    }
  };

  const handleDispensePrescription = (rxId: string, patientId?: string) => {
    setPrescriptions(prev => 
        prev.map(rx => rx.id === rxId ? { 
            ...rx, 
            status: 'DISPENSED',
            patientId: patientId || rx.patientId // Link patient if provided, otherwise keep existing
        } : rx)
    );
  };

  const handleRejectPrescription = (rxId: string, reason: string = 'REJECTED') => {
    setPrescriptions(prev => 
        prev.map(rx => rx.id === rxId ? { ...rx, status: reason as any } : rx)
    );
  };

  const handleAddPatient = (patient: Patient) => {
    setPatients(prev => [...prev, patient]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleAddLabReferral = (referral: LabReferral) => {
      setLabReferrals(prev => [referral, ...prev]);
      if (currentUser) {
        dbService.logSecurityAction(currentUser.id, 'LAB_REFERRAL', `Referral created for ${referral.patientName} (${referral.testName})`);
      }
  };

  // Appointment Handlers with Logging
  const handleAddAppointment = (apt: Appointment) => {
      setAppointments(prev => [...prev, apt]);
      if (currentUser) {
          dbService.logSecurityAction(currentUser.id, 'APPOINTMENT_SCHEDULED', `Patient: ${apt.patientName} on ${apt.date}`);
      }
  };

  const handleDeleteAppointment = (aptId: string) => {
      const apt = appointments.find(a => a.id === aptId);
      setAppointments(prev => prev.filter(a => a.id !== aptId));
      if (currentUser && apt) {
          dbService.logSecurityAction(currentUser.id, 'APPOINTMENT_DELETED', `Cancelled: ${apt.patientName} (${apt.date})`);
      }
  };

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('devx_active_session_id', user.id);
    lastActivityRef.current = Date.now(); // Reset timer on login
    
    // Reload logs to catch the new login event if needed
    const { auditLogs: freshLogs } = await dbService.loadData();
    setAuditLogs(freshLogs);
  };

  const handleDoctorVerificationComplete = (profile: DoctorProfile) => {
      if (!currentUser) return;

      const updatedUser: User = {
          ...currentUser,
          verificationStatus: VerificationStatus.PENDING,
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
    <>
        <Layout user={currentUser} onLogout={handleLogout} onOpenDocs={() => setShowDocs(true)}>
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
                    patients={patients}
                    onAddPatient={handleAddPatient}
                    onUpdatePatient={handleUpdatePatient}
                    labReferrals={labReferrals}
                    onAddLabReferral={handleAddLabReferral}
                    appointments={appointments}
                    onUpdateAppointment={(apt) => setAppointments(prev => prev.map(a => a.id === apt.id ? apt : a))}
                    onAddAppointment={handleAddAppointment}
                    onDeleteAppointment={handleDeleteAppointment}
                    certificates={certificates}
                    onAddCertificate={(cert) => setCertificates(prev => [cert, ...prev])}
                />
            )}
            {currentUser.role === UserRole.PHARMACY && (
                <PharmacyDashboard 
                    prescriptions={prescriptions}
                    onDispense={handleDispensePrescription}
                    onReject={handleRejectPrescription}
                    currentUser={currentUser}
                    onUpdateUser={handleUpdateUser}
                    patients={patients}
                    onAddPatient={handleAddPatient}
                    onUpdatePatient={handleUpdatePatient}
                    salesReturns={salesReturns}
                    onAddSalesReturn={(ret) => setSalesReturns(prev => [ret, ...prev])}
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
                auditLogs={auditLogs}
                />
            )}
            </div>
        )}
        </Layout>

        {/* Documentation Overlay */}
        {showDocs && (
            <DocumentationViewer onClose={() => setShowDocs(false)} />
        )}

        {/* Session Warning Modal */}
        {showSessionWarning && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in zoom-in-95">
                <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 text-center border-2 border-amber-400">
                    <Clock className="w-12 h-12 mx-auto text-amber-500 mb-3 animate-pulse"/>
                    <h3 className="text-lg font-bold text-slate-900">Session Expiring</h3>
                    <p className="text-slate-600 my-2">Your secure session will expire in less than 30 seconds due to inactivity.</p>
                    <p className="text-xs text-slate-500 mb-4">Move your mouse or click to stay logged in.</p>
                    <button 
                        onClick={() => handleLogout()}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold flex items-center justify-center"
                    >
                        <LogOut className="w-4 h-4 mr-2"/> Logout Now
                    </button>
                </div>
            </div>
        )}
    </>
  );
}

export default App;
