import React, { useState } from 'react';
import { UserRole, User, VerificationStatus } from '../../types';
import { Lock, Shield, ArrowRight, Loader2, User as UserIcon, AlertCircle, CheckCircle2, Building2, Stethoscope } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  onRegister: (user: User) => boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin, users, onRegister }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.DOCTOR);
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Registration additional fields
  const [regName, setRegName] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regState, setRegState] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setOtp('');
    setRegName('');
    setRegLicense('');
    setRegState('');
    setError('');
    setStatusMessage('');
    setStep('CREDENTIALS');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Check if user exists
    if (users.some(u => u.email === email)) {
        setError("User with this email/username already exists.");
        setLoading(false);
        return;
    }

    const newUser: User = {
        id: `${selectedRole === UserRole.DOCTOR ? 'DOC' : 'PH'}-${Date.now()}`,
        name: regName,
        email: email,
        password: password,
        role: selectedRole,
        verificationStatus: VerificationStatus.PENDING,
        registrationDate: new Date().toISOString(),
        licenseNumber: regLicense,
        state: regState
    };

    setTimeout(() => {
        onRegister(newUser);
        setLoading(false);
        setMode('LOGIN');
        setStatusMessage("Registration Successful! Your account is pending Admin Approval.");
        resetForm();
    }, 1000);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatusMessage('');

    // Authenticate
    const user = users.find(u => u.email === email && u.password === password && u.role === selectedRole);

    if (user) {
        // Check Status
        if (user.verificationStatus === VerificationStatus.PENDING) {
            setLoading(false);
            setStatusMessage("Your account is currently Under Review by DevXWorld Admins. Please check back later.");
            return;
        }
        if (user.verificationStatus === VerificationStatus.REJECTED) {
            setLoading(false);
            setError("Your application was Rejected. Access Denied.");
            return;
        }
        if (user.verificationStatus === VerificationStatus.TERMINATED) {
            setLoading(false);
            setError("Your account has been Terminated due to compliance violations.");
            return;
        }

        // Proceed to OTP
        setTimeout(() => {
          setLoading(false);
          setStep('OTP');
        }, 800);
    } else {
        setLoading(false);
        setError("Invalid Credentials or Role selection.");
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Special OTP logic for Admin
    if (selectedRole === UserRole.ADMIN) {
        if (otp !== '000000') {
            setLoading(false);
            setError("Invalid OTP for Admin Access.");
            return;
        }
    }

    // For prototype, accept any 6 digits for others, but enforce check
    if (otp.length !== 6) {
        setLoading(false);
        setError("OTP must be 6 digits.");
        return;
    }

    const user = users.find(u => u.email === email);
    
    setTimeout(() => {
      setLoading(false);
      if (user) onLogin(user);
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
      <div className="bg-indigo-50 p-6 border-b border-indigo-100">
        <h2 className="text-2xl font-bold text-indigo-900 text-center">DevXWorld Secure Portal</h2>
        <p className="text-center text-indigo-600 text-sm mt-1">
            {mode === 'LOGIN' ? 'Secure Login & Verification' : 'New Member Registration'}
        </p>
      </div>

      {/* Mode Toggle */}
      {selectedRole !== UserRole.ADMIN && (
        <div className="flex text-sm border-b border-slate-200">
            <button 
                onClick={() => { setMode('LOGIN'); resetForm(); }}
                className={`flex-1 py-3 text-center font-medium ${mode === 'LOGIN' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-slate-500 bg-slate-50'}`}
            >
                Existing User Login
            </button>
            <button 
                onClick={() => { setMode('REGISTER'); resetForm(); }}
                className={`flex-1 py-3 text-center font-medium ${mode === 'REGISTER' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-slate-500 bg-slate-50'}`}
            >
                New Registration
            </button>
        </div>
      )}

      {/* Role Tabs */}
      <div className="flex border-b border-slate-200 mt-0">
        {[UserRole.DOCTOR, UserRole.PHARMACY, UserRole.ADMIN].map((role) => (
          <button
            key={role}
            onClick={() => { 
                // Admin cannot register via UI
                if (mode === 'REGISTER' && role === UserRole.ADMIN) {
                    alert("Admin accounts can only be created by Super Admins.");
                    return;
                }
                setSelectedRole(role); 
                resetForm();
            }}
            className={`flex-1 py-3 text-xs font-bold tracking-wider transition-colors ${
              selectedRole === role 
                ? 'bg-white text-indigo-700 border-b-2 border-indigo-600' 
                : 'bg-slate-50 text-slate-400 hover:text-slate-600'
            }`}
          >
            {role === UserRole.DOCTOR && <span className="flex items-center justify-center"><Stethoscope className="w-3 h-3 mr-1"/> DOCTOR</span>}
            {role === UserRole.PHARMACY && <span className="flex items-center justify-center"><Building2 className="w-3 h-3 mr-1"/> PHARMACY</span>}
            {role === UserRole.ADMIN && <span className="flex items-center justify-center"><Shield className="w-3 h-3 mr-1"/> ADMIN</span>}
          </button>
        ))}
      </div>

      <div className="p-8">
        {statusMessage && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded flex items-start border border-blue-200">
                <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                {statusMessage}
            </div>
        )}
        
        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded flex items-start border border-red-200">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                {error}
            </div>
        )}

        {mode === 'LOGIN' ? (
            step === 'CREDENTIALS' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username / Email</label>
                <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={selectedRole === UserRole.ADMIN ? 'admin' : 'email@example.com'}
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="••••••••"
                />
                </div>

                <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-70"
                >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
                    <>Proceed Securely <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
                </button>
                
                {selectedRole === UserRole.ADMIN && (
                    <p className="text-xs text-slate-400 text-center">Test Admin: admin / admin</p>
                )}
            </form>
            ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="text-center mb-4">
                <Shield className="h-12 w-12 text-indigo-600 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-slate-900">2FA Verification</h3>
                <p className="text-sm text-slate-500">
                    {selectedRole === UserRole.ADMIN 
                        ? "Enter secure Admin OTP (000000)" 
                        : "Enter OTP sent to your registered mobile"}
                </p>
                </div>

                <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full text-center tracking-[0.5em] text-2xl font-bold py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••"
                />

                <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-70"
                >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Verify & Login'}
                </button>
                <button type="button" onClick={() => setStep('CREDENTIALS')} className="w-full text-xs text-indigo-600 mt-2 hover:underline">Back</button>
            </form>
            )
        ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Full Name / Establishment Name</label>
                    <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md sm:text-sm"
                        placeholder={selectedRole === UserRole.DOCTOR ? "Dr. First Last" : "Apollo Pharmacy"}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">
                        {selectedRole === UserRole.DOCTOR ? 'Medical Registration No.' : 'Pharmacy License No.'}
                    </label>
                    <input
                        type="text"
                        required
                        value={regLicense}
                        onChange={(e) => setRegLicense(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md sm:text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">State</label>
                    <input
                        type="text"
                        required
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md sm:text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md sm:text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Create Password</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md sm:text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Submit Application'}
                </button>
                <p className="text-xs text-slate-500 text-center mt-2">Your account will require Admin approval before login.</p>
            </form>
        )}
      </div>
      <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
        Compliance: DPDP Act 2023 & Telemedicine Guidelines 2020.
      </div>
    </div>
  );
};