import React, { useEffect, useState } from 'react';
import { Prescription } from '../../types';
import { dbService } from '../../services/db';
import { CheckCircle, ShieldCheck, Loader2, AlertCircle, FileText, User } from 'lucide-react';

interface Props {
    rxId: string;
}

export const RxVerification: React.FC<Props> = ({ rxId }) => {
    const [rx, setRx] = useState<Prescription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRx = async () => {
            try {
                const data = await dbService.getPublicPrescription(rxId);
                if (data) {
                    setRx(data);
                } else {
                    setError('Prescription not found or invalid ID.');
                }
            } catch (e) {
                setError('Unable to verify at this time. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchRx();
    }, [rxId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4"/>
                    <p className="text-slate-600 font-medium">Verifying Digital Signature...</p>
                </div>
            </div>
        );
    }

    if (error || !rx) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-red-500">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h1>
                    <p className="text-slate-600 mb-4">{error}</p>
                    <p className="text-xs text-slate-400">ID: {rxId}</p>
                </div>
            </div>
        );
    }

    // Determine Doctor Name safely
    const docName = rx.doctorDetails?.name || rx.doctorName;
    const docQual = rx.doctorDetails?.qualifications || 'RMP';

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="bg-green-600 text-white p-6 text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <ShieldCheck className="w-10 h-10 text-white"/>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Verified E-Prescription</h1>
                    <p className="text-green-100 text-sm mt-1">DevXWorld Secure Health Network</p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* Status Badge */}
                    <div className="flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider flex items-center ${
                            rx.status === 'DISPENSED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                            <CheckCircle className="w-4 h-4 mr-2"/>
                            {rx.status === 'DISPENSED' ? 'Dispensed' : 'Valid & Active'}
                        </span>
                    </div>

                    {/* Prescription Details */}
                    <div className="space-y-4 text-center">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Prescription ID</p>
                            <p className="font-mono text-lg font-bold text-slate-800 tracking-wide">{rx.id}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-left bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date Issued</p>
                                <p className="text-sm font-bold text-slate-900">{new Date(rx.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Signed By</p>
                                <p className="text-sm font-bold text-slate-900 truncate">Dr. {docName}</p>
                                <p className="text-[10px] text-slate-500 truncate">{docQual}</p>
                            </div>
                        </div>

                        {/* Limited Patient View for Privacy */}
                        <div className="flex items-center justify-center gap-2 text-slate-600 bg-white border border-slate-200 p-2 rounded-full mx-auto w-max px-6">
                            <User className="w-4 h-4"/>
                            <span className="text-sm font-medium">Patient: {rx.patientName} ({rx.patientAge}Y)</span>
                        </div>
                        
                        {/* Token Hash */}
                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 font-mono mb-1">Digital Signature Token</p>
                            <p className="text-xs text-slate-500 font-mono break-all bg-slate-50 p-2 rounded">{rx.digitalSignatureToken}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                        This is a digitally signed record compliant with IT Act 2000.
                        <br/>
                        Verification generated by DevXWorld e-Rx Hub.
                    </p>
                </div>
            </div>
        </div>
    );
};