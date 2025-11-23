
import React, { useState } from 'react';
import { DoctorProfile, DocumentType, UserDocument } from '../../types';
import { MEDICAL_DEGREES, SPECIALTIES, INDIAN_STATES, REG_NUMBER_REGEX, PHONE_REGEX, PINCODE_REGEX } from '../../constants';
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Loader2, Upload, FileText, Building2, UserSquare2 } from 'lucide-react';
import { dbService } from '../../services/db';

interface DoctorVerificationProps {
  onComplete: (profile: DoctorProfile) => void;
}

type Step = 1 | 2 | 3;

export const DoctorVerification: React.FC<DoctorVerificationProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Document Upload States
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null); 

  const [formData, setFormData] = useState<DoctorProfile>({
    devxId: '',
    medicalDegree: '',
    qualifications: '',
    registrationNumber: '',
    nmrUid: '',
    stateCouncil: '',
    specialty: '',
    clinicName: '',
    clinicAddress: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    fax: ''
  });

  const handleFileUpload = async (file: File, type: DocumentType) => {
      setUploading(type);
      try {
          const url = await dbService.uploadFile(file);
          const newDoc: UserDocument = {
              id: `doc-${Date.now()}`,
              type: type,
              name: file.name,
              url: url,
              uploadedAt: new Date().toISOString()
          };
          setDocuments(prev => [...prev.filter(d => d.type !== type), newDoc]);
      } catch (err: any) {
          console.error(err);
          alert("File upload failed: " + err.message);
      } finally {
          setUploading(null);
      }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.devxId) newErrors.devxId = "DevXWorld Member ID is required";
    if (!formData.medicalDegree) newErrors.medicalDegree = "Primary Degree is required";
    if (!formData.qualifications) newErrors.qualifications = "Full Qualifications are required";
    
    if (!formData.registrationNumber) {
        newErrors.registrationNumber = "Registration Number is required";
    } else if (!REG_NUMBER_REGEX.test(formData.registrationNumber)) {
        newErrors.registrationNumber = "Invalid format. Must be 5-15 alphanumeric chars.";
    }

    if (!formData.nmrUid) newErrors.nmrUid = "NMR UID is required (NMC)";
    if (!formData.stateCouncil) newErrors.stateCouncil = "State Council is required";
    
    // Doc Checks
    if (!documents.some(d => d.type === DocumentType.MEDICAL_DEGREE)) newErrors.docDegree = "Degree Certificate is required";
    if (!documents.some(d => d.type === DocumentType.NMC_REGISTRATION)) newErrors.docReg = "NMC/Council Certificate is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clinicName) newErrors.clinicName = "Clinic Name is required";
    if (!formData.clinicAddress) newErrors.clinicAddress = "Address is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    
    if (!formData.pincode) {
        newErrors.pincode = "Pincode is required";
    } else if (!PINCODE_REGEX.test(formData.pincode)) {
        newErrors.pincode = "Invalid Pincode. Must be 6 digits.";
    }

    if (!formData.phone) {
        newErrors.phone = "Phone is required";
    } else if (!PHONE_REGEX.test(formData.phone)) {
        newErrors.phone = "Invalid Phone. Must be 10 digits.";
    }
    
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
     const finalProfile = { ...formData, documents };
     setTimeout(() => {
         setLoading(false);
         onComplete(finalProfile);
     }, 1500);
  };

  const FileUploadField = ({ label, type, required = false }: { label: string, type: DocumentType, required?: boolean }) => {
      const doc = documents.find(d => d.type === type);
      const isBusy = uploading === type;
      
      return (
          <div className="mb-4 p-4 bg-slate-50 rounded-md border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                  {label} {required && <span className="text-red-500">*</span>}
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className={`flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Upload className="w-4 h-4 mr-2"/>}
                      {doc ? 'Replace File' : 'Upload Document'}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0], type)}
                      />
                  </label>
                  {doc ? (
                      <span className="flex items-center text-sm text-green-600 font-medium">
                          <CheckCircle2 className="w-4 h-4 mr-1"/> {doc.name}
                      </span>
                  ) : (
                      <span className="text-xs text-slate-500 italic">PDF, JPG, or PNG (Max 5MB)</span>
                  )}
              </div>
              {(type === DocumentType.MEDICAL_DEGREE && errors.docDegree) && <p className="text-xs text-red-500 mt-1 font-bold">{errors.docDegree}</p>}
              {(type === DocumentType.NMC_REGISTRATION && errors.docReg) && <p className="text-xs text-red-500 mt-1 font-bold">{errors.docReg}</p>}
          </div>
      );
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
        value={formData[name] as string}
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
        value={formData[name] as string}
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
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
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
                <div className="flex items-center mb-6 pb-2 border-b border-slate-100">
                    <UserSquare2 className="w-6 h-6 text-teal-600 mr-2"/>
                    <h3 className="text-xl font-medium text-slate-900">Professional Information</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-y-2">
                    <InputField label="DevXWorld Member ID" name="devxId" required placeholder="e.g. DVX-998877" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectField label="Primary Degree" name="medicalDegree" options={MEDICAL_DEGREES} required />
                        <InputField label="Specialty" name="specialty" placeholder="e.g. Cardiology, ENT" />
                    </div>

                    <InputField label="Full Qualifications (for Letterhead)" name="qualifications" required placeholder="e.g. MBBS, MD (General Medicine), DNB" />
                    
                    <FileUploadField label="Upload Medical Degree Certificate" type={DocumentType.MEDICAL_DEGREE} required />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="State Reg. Number" name="registrationNumber" required placeholder="e.g. MMC20151234" />
                        <InputField label="NMC UID (National Medical Register)" name="nmrUid" required placeholder="e.g. NMR-2345" />
                    </div>
                    
                    <SelectField label="State Medical Council" name="stateCouncil" options={INDIAN_STATES} required />
                    
                    <FileUploadField label="Upload NMC/State Registration" type={DocumentType.NMC_REGISTRATION} required />
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center mb-6 pb-2 border-b border-slate-100">
                    <Building2 className="w-6 h-6 text-teal-600 mr-2"/>
                    <h3 className="text-xl font-medium text-slate-900">Clinic & Contact Details</h3>
                </div>

                <InputField label="Clinic / Hospital Name" name="clinicName" required placeholder="e.g. City Care Clinic" />
                <FileUploadField label="Clinic Establishment License (Optional)" type={DocumentType.CLINIC_LICENSE} />
                
                <InputField label="Full Clinic Address" name="clinicAddress" required placeholder="Street address, Floor, Landmark" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField label="City" name="city" required />
                    <SelectField label="State" name="state" options={INDIAN_STATES} required />
                    <InputField label="Pincode" name="pincode" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Official Phone Number" name="phone" required placeholder="10-digit Mobile" />
                    <InputField label="Fax Number (Optional)" name="fax" placeholder="Optional" />
                </div>
            </div>
        )}

        {step === 3 && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center py-4">
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-teal-600" />
                 </div>
                 <h3 className="text-2xl font-semibold text-slate-900">Ready to Submit?</h3>
                 <p className="text-slate-600 mt-2 max-w-md mx-auto">
                    By submitting, you confirm that you are a Registered Medical Practitioner under the NMC Act and all provided details (including uploaded documents) are authentic.
                 </p>

                 <div className="mt-8 bg-slate-50 p-4 rounded-lg text-left max-w-md mx-auto text-sm space-y-2 border border-slate-200 shadow-sm">
                    <p className="border-b border-slate-200 pb-2 mb-2 font-bold text-slate-800">Review Details</p>
                    <p><span className="font-medium text-slate-500">Name:</span> Dr. {formData.devxId}</p>
                    <p><span className="font-medium text-slate-500">Qualification:</span> {formData.qualifications}</p>
                    <p><span className="font-medium text-slate-500">Reg No:</span> {formData.registrationNumber}</p>
                    <p><span className="font-medium text-slate-500">NMR UID:</span> {formData.nmrUid}</p>
                    <p><span className="font-medium text-slate-500">Clinic:</span> {formData.clinicName}</p>
                    <p><span className="font-medium text-slate-500">Address:</span> {formData.clinicAddress}, {formData.city}</p>
                    <p><span className="font-medium text-slate-500">Documents:</span> {documents.length} Attached</p>
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
