import React, { useState } from 'react';
import { DoctorProfile } from '../../types';
import { MEDICAL_DEGREES, SPECIALTIES, INDIAN_STATES } from '../../constants';
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

interface DoctorVerificationProps {
  onComplete: (profile: DoctorProfile) => void;
}

type Step = 1 | 2 | 3;

export const DoctorVerification: React.FC<DoctorVerificationProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<DoctorProfile>({
    devxId: '',
    medicalDegree: '',
    registrationNumber: '',
    stateCouncil: '',
    specialty: '',
    clinicName: '',
    clinicAddress: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.devxId) newErrors.devxId = "DevXWorld Member ID is required";
    if (!formData.medicalDegree) newErrors.medicalDegree = "Medical Degree is required";
    if (!formData.registrationNumber) newErrors.registrationNumber = "Registration Number is required";
    if (!formData.stateCouncil) newErrors.stateCouncil = "State Council is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clinicName) newErrors.clinicName = "Clinic Name is required";
    if (!formData.clinicAddress) newErrors.clinicAddress = "Address is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.pincode) newErrors.pincode = "Pincode is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleSubmit = async () => {
     setLoading(true);
     // Simulate API call
     setTimeout(() => {
         setLoading(false);
         onComplete(formData);
     }, 1500);
  };

  const InputField = ({ 
    label, 
    name, 
    required = false, 
    type = "text", 
    placeholder = "" 
  }: { label: string; name: keyof DoctorProfile; required?: boolean; type?: string; placeholder?: string }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={formData[name]}
        onChange={(e) => {
            setFormData({...formData, [name]: e.target.value});
            if(errors[name]) setErrors({...errors, [name]: ''});
        }}
        placeholder={placeholder}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${errors[name] ? 'border-red-300' : 'border-slate-300'}`}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> {errors[name]}</p>}
    </div>
  );

  const SelectField = ({
    label,
    name,
    options,
    required = false
  }: { label: string; name: keyof DoctorProfile; options: string[]; required?: boolean }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={formData[name]}
        onChange={(e) => {
            setFormData({...formData, [name]: e.target.value});
            if(errors[name]) setErrors({...errors, [name]: ''});
        }}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${errors[name] ? 'border-red-300' : 'border-slate-300'}`}
      >
        <option value="">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {errors[name] && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> {errors[name]}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Doctor Onboarding (RMP)</h2>
            <span className="text-sm text-slate-500">Step {step} of 3</span>
        </div>
        <div className="mt-3 h-2 w-full bg-slate-200 rounded-full">
            <div 
                className="h-full bg-teal-600 rounded-full transition-all duration-300" 
                style={{ width: `${(step / 3) * 100}%` }}
            ></div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-medium text-slate-900 mb-6">Professional Information</h3>
                <div className="grid grid-cols-1 gap-y-2">
                    <InputField label="DevXWorld Member ID" name="devxId" required placeholder="e.g. DVX-998877" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectField label="Medical Degree" name="medicalDegree" options={MEDICAL_DEGREES} required />
                        <SelectField label="Specialty" name="specialty" options={SPECIALTIES} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Registration Number" name="registrationNumber" required placeholder="State Council Reg. No." />
                        <SelectField label="State Medical Council" name="stateCouncil" options={INDIAN_STATES} required />
                    </div>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-medium text-slate-900 mb-6">Clinic & Contact Details</h3>
                <InputField label="Clinic / Hospital Name" name="clinicName" required />
                <InputField label="Full Address" name="clinicAddress" required placeholder="Street address, Landmark" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField label="City" name="city" required />
                    <SelectField label="State" name="state" options={INDIAN_STATES} required />
                    <InputField label="Pincode" name="pincode" required />
                </div>
                <InputField label="Official Phone Number" name="phone" required placeholder="+91" />
            </div>
        )}

        {step === 3 && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center py-4">
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-teal-600" />
                 </div>
                 <h3 className="text-2xl font-semibold text-slate-900">Ready to Submit?</h3>
                 <p className="text-slate-600 mt-2 max-w-md mx-auto">
                    By submitting, you confirm that you are a Registered Medical Practitioner under the NMC Act and all provided details are accurate.
                 </p>

                 <div className="mt-8 bg-slate-50 p-4 rounded-lg text-left max-w-md mx-auto text-sm">
                    <p><span className="font-medium">Name:</span> Dr. {formData.devxId} (Placeholder)</p>
                    <p><span className="font-medium">Degree:</span> {formData.medicalDegree} - {formData.registrationNumber}</p>
                    <p><span className="font-medium">Clinic:</span> {formData.clinicName}, {formData.city}</p>
                 </div>
             </div>
        )}
      </div>

      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          {step > 1 ? (
             <button 
                onClick={handleBack}
                className="flex items-center text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-md"
            >
                 <ChevronLeft className="w-4 h-4 mr-1" /> Back
             </button>
          ) : <div></div>}

          {step < 3 ? (
             <button 
                onClick={handleNext}
                className="flex items-center bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 font-medium shadow-sm"
            >
                 Next <ChevronRight className="w-4 h-4 ml-1" />
             </button>
          ) : (
             <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center bg-indigo-600 text-white px-8 py-2 rounded-md hover:bg-indigo-700 font-medium shadow-sm disabled:opacity-70"
            >
                 {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                 Submit for Verification
             </button>
          )}
      </div>
    </div>
  );
};