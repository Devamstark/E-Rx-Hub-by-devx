
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Prescription, UserRole, VerificationStatus, Patient, AuditLog } from '../types';

// --- Default Initial State (Used if DB is empty) ---
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

// --- Credentials ---
const FALLBACK_URL = 'https://xqhvjabpsiimxjpbhbih.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaHZqYWJwc2lpbXhqcGJoYmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzM3MTcsImV4cCI6MjA3OTIwOTcxN30._IUN318q5XbhV-VU8RAPTSuWh2NLqK2GK0P_Qzg9GuQ';

const getEnv = (key: string) => {
    try {
        const meta = import.meta as any;
        if (meta && meta.env && meta.env[key]) return meta.env[key];
    } catch (e) {}
    try {
        if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    } catch (e) {}
    return undefined;
};

const getStoredConfig = () => {
    const url = localStorage.getItem('devx_db_url');
    const key = localStorage.getItem('devx_db_key');
    if (url && key) return { url, key };
    return null;
};

const stored = getStoredConfig();
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || stored?.url || FALLBACK_URL;
const SUPABASE_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || stored?.key || FALLBACK_KEY;

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("DevXWorld: Connected to Cloud Database", SUPABASE_URL);
    } catch (e) {
        console.warn("DevXWorld: Failed to initialize Supabase client", e);
    }
} else {
    console.log("DevXWorld: Running in Local Storage Mode");
}

// --- Helper: Local Storage ---
const local = {
    getUsers: (): User[] => {
        const s = localStorage.getItem('devx_users');
        return s ? JSON.parse(s) : INITIAL_USERS;
    },
    setUsers: (users: User[]) => localStorage.setItem('devx_users', JSON.stringify(users)),
    getRx: (): Prescription[] => {
        const s = localStorage.getItem('devx_prescriptions');
        return s ? JSON.parse(s) : [];
    },
    setRx: (rx: Prescription[]) => localStorage.setItem('devx_prescriptions', JSON.stringify(rx)),
    getPatients: (): Patient[] => {
        const s = localStorage.getItem('devx_patients');
        return s ? JSON.parse(s) : [];
    },
    setPatients: (patients: Patient[]) => localStorage.setItem('devx_patients', JSON.stringify(patients)),
    getAuditLogs: (): AuditLog[] => {
        const s = localStorage.getItem('devx_audit_logs');
        return s ? JSON.parse(s) : [];
    },
    setAuditLogs: (logs: AuditLog[]) => localStorage.setItem('devx_audit_logs', JSON.stringify(logs))
};

// --- DB Service API ---
export const dbService = {
    isCloudEnabled: () => !!supabase,
    
    configureCloud: (url: string, key: string) => {
        localStorage.setItem('devx_db_url', url);
        localStorage.setItem('devx_db_key', key);
        window.location.reload();
    },

    disconnectCloud: () => {
        localStorage.removeItem('devx_db_url');
        localStorage.removeItem('devx_db_key');
        window.location.reload();
    },

    signOut: async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
    },

    async loadData(): Promise<{ users: User[], rx: Prescription[], patients: Patient[], auditLogs: AuditLog[] }> {
        if (!supabase) {
            return { 
                users: local.getUsers(), 
                rx: local.getRx(), 
                patients: local.getPatients(),
                auditLogs: local.getAuditLogs() 
            };
        }

        try {
            // Load Users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('data')
                .eq('id', 'global_users')
                .single();

            // Load Prescriptions
            const { data: rxData } = await supabase
                .from('prescriptions')
                .select('data')
                .eq('id', 'global_prescriptions')
                .single();
            
            // Load Patients
            const { data: patientData } = await supabase
                .from('patients')
                .select('data')
                .eq('id', 'global_patients')
                .single();

            // Load Audit Logs with Merging Strategy (SQL + Blob)
            let sqlLogs: AuditLog[] = [];
            let blobLogsData: AuditLog[] = [];
            
            // 1. Try SQL Table
            const { data: logsData, error: logsError } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (logsError) {
                console.warn("SQL Logs Fetch Error (Check if 'audit_logs' table exists):", logsError.message);
            }

            if (!logsError && logsData) {
                sqlLogs = logsData.map((l: any) => ({
                    id: l.id,
                    actorId: l.actor_id,
                    action: l.action,
                    details: l.details,
                    timestamp: l.created_at
                }));
            }

            // 2. Fetch JSON blob storage (Always fetch to merge logs that failed SQL insert)
            const { data: blobLogs } = await supabase
                .from('system_logs')
                .select('data')
                .eq('id', 'global_audit_logs')
                .single();
            
            if (blobLogs && blobLogs.data) {
                blobLogsData = blobLogs.data;
            }

            // 3. Merge and Deduplicate
            // Prefer SQL logs if ID collision, though IDs should be unique
            const allLogs = [...sqlLogs, ...blobLogsData];
            const uniqueLogs = Array.from(new Map(allLogs.map(item => [item.id, item])).values());
            
            // Sort descending
            const auditLogs = uniqueLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            // Parse or Default
            const users = (userData && userData.data) ? userData.data : INITIAL_USERS;
            const rx = (rxData && rxData.data) ? rxData.data : [];
            const patients = (patientData && patientData.data) ? patientData.data : [];

            // If cloud is empty (first run), sync initial local defaults to cloud
            if (userError && users === INITIAL_USERS) {
                 await this.saveUsers(INITIAL_USERS);
            }

            return { users, rx, patients, auditLogs };
        } catch (e) {
            console.error("DB Load Error:", e);
            return { 
                users: local.getUsers(), 
                rx: local.getRx(), 
                patients: local.getPatients(),
                auditLogs: local.getAuditLogs()
            };
        }
    },

    async saveUsers(users: User[]): Promise<void> {
        if (!supabase) {
            local.setUsers(users);
            return;
        }
        await supabase.from('users').upsert({ id: 'global_users', data: users });
    },

    async savePrescriptions(rx: Prescription[]): Promise<void> {
        if (!supabase) {
            local.setRx(rx);
            return;
        }
        await supabase.from('prescriptions').upsert({ id: 'global_prescriptions', data: rx });
    },

    async savePatients(patients: Patient[]): Promise<void> {
        if (!supabase) {
            local.setPatients(patients);
            return;
        }
        try {
            await supabase.from('patients').upsert({ id: 'global_patients', data: patients });
        } catch (e) {
            console.warn("Could not save patients to cloud.", e);
        }
    },

    async logSecurityAction(actorId: string, action: string, details: string = ''): Promise<AuditLog> {
        const log: AuditLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
            actorId,
            action,
            details,
            timestamp: new Date().toISOString()
        };

        if (!supabase) {
            const logs = local.getAuditLogs();
            local.setAuditLogs([log, ...logs]);
            return log;
        }

        try {
            // Try inserting into real table first
            const { error } = await supabase.from('audit_logs').insert({
                actor_id: actorId,
                action: action,
                details: details
            });
            
            if (error) {
                console.warn("SQL Insert failed (Table missing?):", error.message);
                throw error;
            }

        } catch (e) {
            // Fallback: If SQL insert fails (e.g., RLS policy), save to blob storage
            try {
                const { data: current } = await supabase
                    .from('system_logs')
                    .select('data')
                    .eq('id', 'global_audit_logs')
                    .single();
                
                const existingLogs = current?.data || [];
                const updatedLogs = [log, ...existingLogs].slice(0, 500); // Keep last 500 logs
                
                await supabase.from('system_logs').upsert({
                    id: 'global_audit_logs',
                    data: updatedLogs
                });
            } catch (blobErr) {
                console.error("Security Log Fallback Failed:", blobErr);
                // Local storage backup
                const logs = local.getAuditLogs();
                local.setAuditLogs([log, ...logs]);
            }
        }
        return log;
    },

    async uploadFile(file: File): Promise<string> {
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("File size exceeds 5MB limit.");
        }
        if (supabase) {
            try {
                const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
                const { data, error } = await supabase.storage
                    .from('documents')
                    .upload(fileName, file);

                if (error) {
                    console.warn("Cloud upload failed", error);
                } else if (data) {
                    const { data: publicUrl } = supabase.storage
                        .from('documents')
                        .getPublicUrl(data.path);
                    return publicUrl.publicUrl;
                }
            } catch (e) {
                console.warn("Supabase storage exception", e);
            }
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }
};
