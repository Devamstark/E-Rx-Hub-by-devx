
import React, { useEffect, useState } from 'react';
import { LabReferral } from '../../types';
import { dbService } from '../../services/db';
import { Loader2, AlertCircle, FileText, Upload, CheckCircle2, User, Microscope, Lock, ArrowRight } from 'lucide-react';

interface Props {
    refId: string;
}

export const LabReportUpload: React.FC<Props> = ({ refId }) => {
    const [referral, setReferral] = useState<LabReferral | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [success, setSuccess] = useState(false);
    
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const fetchRef = async () => {
            try {
                // SANITIZATION: Clean the refId. 
                // Sometimes WhatsApp/SMS appends text to the link (e.g. "REF-123 *Access Code*")
                // We take the first part before any space or special char that isn't part of the ID.
                const cleanRefId = refId ? refId.split(' ')[0].trim() : '';

                const data = await dbService.getPublicLabReferral(cleanRefId);
                if (data) {
                    setReferral(data);
                } else {
                    setError('Referral not found or invalid ID.');
                }
            } catch (e) {
                setError('Unable to fetch referral details. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchRef();
    }, [refId]);

    const handleUpload = async () => {
        if (!file || !referral) return;
        setUploading(true);
        try {
            const url = await dbService.uploadFile(file);
            const updatedRef: LabReferral = {
                ...referral,
                status: 'COMPLETED',
                reportUrl: url
            };
            await dbService.updateLabReferral(updatedRef);
            setSuccess(true);
        } catch (err: any) {
            alert("Upload Failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (accessCode === '0000') {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Invalid Access Code');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4"/>
                    <p className="text-slate-600 font-medium">Loading Lab Referral...</p>
                </div>
            </div>
        );
    }

    if (error || !referral) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-red-500">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
                    <p className="text-slate-600 mb-4">{error}</p>
                </div>
            </div>
        );
    }

    // AUTH SCREEN
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
                    <div className="bg-slate-800 text-white p-6 text-center">
                        <Lock className="w-12 h-12 mx-auto mb-3 text-slate-300"/>
                        <h1 className="text-xl font-bold">Secure Lab Portal</h1>
                        <p className="text-slate-400 text-xs mt-1">Enter Code to Upload Report</p>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleAuth} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Access Code</label>
                                <input 
                                    type="password" 
                                    maxLength={4}
                                    className="w-full text-center text-2xl tracking-widest font-mono border-2 border-slate-300 rounded-lg p-2 focus:border-indigo-500 focus:ring-0 outline-none"
                                    placeholder="0000"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            {authError && <p className="text-xs text-red-500 text-center font-bold">{authError}</p>}
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center">
                                Verify Access <ArrowRight className="w-4 h-4 ml-2"/>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-green-500 animate-in fade-in">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Upload Successful</h1>
                    <p className="text-slate-600 mb-4">The report has been securely attached to the patient's record and the doctor has been notified.</p>
                    <p className="text-xs text-slate-400">Ref ID: {referral.id}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4">
                <div className="bg-teal-600 text-white p-6 text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Microscope className="w-10 h-10 text-white"/>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Lab Report Upload</h1>
                    <p className="text-teal-100 text-sm mt-1">DevXWorld Secure Health Network</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-left">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Patient Details</p>
                            <p className="font-bold text-slate-900 text-lg flex items-center"><User className="w-4 h-4 mr-2"/> {referral.patientName}</p>
                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Requested Test</p>
                                <p className="font-medium text-slate-800">{referral.testName}</p>
                            </div>
                            <div className="mt-2">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Prescribing Doctor</p>
                                <p className="font-medium text-slate-800">Dr. {referral.doctorName}</p>
                            </div>
                        </div>

                        {referral.status === 'COMPLETED' ? (
                            <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-green-800 font-bold flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 mr-2"/> Report Already Uploaded
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:bg-slate-50 transition-colors">
                                <input 
                                    type="file" 
                                    id="report-upload" 
                                    className="hidden" 
                                    accept=".pdf,image/*"
                                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                />
                                <label htmlFor="report-upload" className="cursor-pointer flex flex-col items-center">
                                    <Upload className={`w-12 h-12 mb-2 ${file ? 'text-teal-600' : 'text-slate-400'}`}/>
                                    <span className="font-medium text-slate-600">
                                        {file ? file.name : "Click to Select Report File"}
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1">PDF, JPG or PNG (Max 5MB)</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {file && referral.status !== 'COMPLETED' && (
                        <button 
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 shadow-md transition-colors flex items-center justify-center"
                        >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Upload className="w-5 h-5 mr-2"/>}
                            Confirm Upload
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
