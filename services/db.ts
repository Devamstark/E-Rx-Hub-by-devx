
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Prescription, UserRole, VerificationStatus, Patient } from '../types';

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
    setPatients: (patients: Patient[]) => localStorage.setItem('devx_patients', JSON.stringify(patients))
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

    async loadData(): Promise<{ users: User[], rx: Prescription[], patients: Patient[] }> {
        if (!supabase) {
            return { users: local.getUsers(), rx: local.getRx(), patients: local.getPatients() };
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
            
            // Parse or Default
            const users = (userData && userData.data) ? userData.data : INITIAL_USERS;
            const rx = (rxData && rxData.data) ? rxData.data : [];
            const patients = (patientData && patientData.data) ? patientData.data : [];

            // If cloud is empty (first run), sync initial local defaults to cloud
            if (userError && users === INITIAL_USERS) {
                 await this.saveUsers(INITIAL_USERS);
            }

            return { users, rx, patients };
        } catch (e) {
            console.error("DB Load Error:", e);
            // Fallback to local on error to prevent app crash
            return { users: local.getUsers(), rx: local.getRx(), patients: local.getPatients() };
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
        // Try to save to patients table, handling if table doesn't exist gracefully (though UI wont help much there)
        try {
            await supabase.from('patients').upsert({ id: 'global_patients', data: patients });
        } catch (e) {
            console.warn("Could not save patients to cloud. Ensure 'patients' table exists.", e);
        }
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
