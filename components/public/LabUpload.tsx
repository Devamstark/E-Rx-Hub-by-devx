
import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { LabReferral } from '../../types';
import { CheckCircle2, Upload, FileText, AlertCircle, Loader2, ShieldCheck, Download } from 'lucide-react';

interface LabUploadProps {
    referralId: string;
    prefillCode?: string;
}

export const LabUpload: React.FC<LabUploadProps> = ({ referralId, prefillCode }) => {
    const [loading, setLoading] = useState(true);
    const [referral, setReferral] = useState<LabReferral | null>(null);
    const [error, setError] = useState('');
    const [accessCode, setAccessCode] = useState(prefillCode || '');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchRef = async () => {
            try {
                const data = await dbService.getPublicLabReferral(referralId);
                if (data) {
                    setReferral(data);
                    // Auto-auth if code is present in URL matches
                    if (prefillCode && data.accessCode === prefillCode) {
                        setIsAuthenticated(true);
                    }
                } else {
                    setError("Referral Record Not Found.");
                }
            } catch (e) {
                setError("Unable to load referral details.");
            } finally {
                setLoading(false);
            }
        };
        fetchRef();
    }, [referralId, prefillCode]);

    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault();
        if (referral && referral.accessCode === accessCode) {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError("Invalid Access Code. Please check the link provided by the doctor.");
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !referral) return;

        setUploading(true);
        try {
            const url = await dbService.uploadFile(file);
            await dbService.submitLabReport(referral.id, url);
            setSuccess(true);
        } catch (err: any) {
            setError("Upload failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!referral) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3"/>
                    <h2 className="text-xl font-bold text-slate-800">Referral Not Found</h2>
                    <p className="text-slate-500 mt-2">The link may be invalid or expired.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 py-10 px-4">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-teal-600 p-6 text-white text-center">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-teal-100"/>
                    <h1 className="text-2xl font-bold">Lab Report Upload</h1>
                    <p className="text-teal-100 text-sm mt-1">DevXWorld Secure Health Portal</p>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10 text-green-600"/>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Upload Successful!</h2>
                            <p className="text-slate-600 mt-2">The report has been securely linked to the patient's record. The doctor has been notified.</p>
                            <p className="text-xs text-slate-400 mt-4">You can close this window.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Patient</p>
                                        <p className="font-medium text-slate-900">{referral.patientName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 font-bold uppercase">Referral ID</p>
                                        <p className="font-mono text-sm">{referral.id}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Requested Test</p>
                                    <p className="font-bold text-indigo-700 text-lg">{referral.testName}</p>
                                </div>
                                <div className="mt-2 text-xs bg-slate-50 p-2 rounded text-slate-600 italic">
                                    Notes: {referral.notes || 'None'}
                                </div>
                            </div>

                            {!isAuthenticated ? (
                                <form onSubmit={handleVerifyCode} className="space-y-4">
                                    <div className="bg-amber-50 p-3 rounded border border-amber-200 flex items-start text-sm text-amber-800">
                                        <ShieldCheck className="w-5 h-5 mr-2 shrink-0"/>
                                        This is a secure upload portal. Please enter the 4-digit access code provided by the doctor.
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Access PIN</label>
                                        <input 
                                            type="text" 
                                            maxLength={4}
                                            className="w-full text-center text-2xl tracking-widest font-bold p-2 border rounded focus:ring-2 focus:ring-teal-500"
                                            value={accessCode}
                                            onChange={(e) => setAccessCode(e.target.value)}
                                            placeholder="XXXX"
                                        />
                                    </div>
                                    {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}
                                    <button className="w-full bg-teal-600 text-white py-2 rounded font-bold hover:bg-teal-700">
                                        Verify & Continue
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleFileUpload} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Report File (PDF/Image)</label>
                                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                                            <input 
                                                type="file" 
                                                accept="application/pdf,image/*" 
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                className="hidden" 
                                                id="file-upload"
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                {file ? (
                                                    <div className="flex items-center justify-center text-green-600 font-medium">
                                                        <FileText className="w-6 h-6 mr-2"/>
                                                        {file.name}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-slate-400">
                                                        <Upload className="w-8 h-8 mb-2"/>
                                                        <span className="text-sm font-medium text-indigo-600">Click to Browse</span>
                                                        <span className="text-xs">Max 5MB</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                                    <button 
                                        type="submit" 
                                        disabled={!file || uploading}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Upload className="w-5 h-5 mr-2"/>}
                                        {uploading ? 'Uploading...' : 'Submit Report'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
