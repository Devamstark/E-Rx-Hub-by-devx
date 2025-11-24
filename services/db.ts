
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Prescription, UserRole, VerificationStatus, Patient, AuditLog, PrescriptionTemplate, Supplier, Customer, Sale, Expense, SalesReturn } from '../types';

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

const INITIAL_RX: Prescription[] = [
    {
        id: 'RX-2024-001',
        doctorId: 'DOC-1709823', // Generic or matches a future doc
        doctorName: 'Dr. Ridham Trivedi',
        doctorDetails: {
            name: 'Ridham Trivedi',
            qualifications: 'MBBS, MD (Medicine)',
            registrationNumber: 'MCI-12345',
            nmrUid: 'NMR-5566',
            stateCouncil: 'Maharashtra Medical Council',
            clinicName: 'Trivedi Hospital',
            clinicAddress: '123 Health St, Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            phone: '9876543210',
            email: 'dr.ridham@example.com',
            specialty: 'Cardiologist'
        },
        patientId: 'PAT-001',
        patientName: 'Amit Sharma',
        patientAge: 45,
        patientGender: 'Male',
        diagnosis: 'Hypertension',
        medicines: [
            { name: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: '30 days', instructions: 'After breakfast' }
        ],
        advice: 'Reduce salt intake. Regular morning walk for 30 mins.',
        date: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
        status: 'DISPENSED',
        pharmacyId: 'sup-1', 
        pharmacyName: 'Apollo Pharmacy',
        digitalSignatureToken: 'SIG-MOCK-1'
    },
    {
        id: 'RX-2024-002',
        doctorId: 'DOC-1709823',
        doctorName: 'Dr. Ridham Trivedi',
        doctorDetails: {
             name: 'Ridham Trivedi',
            qualifications: 'MBBS, MD (Medicine)',
            registrationNumber: 'MCI-12345',
            nmrUid: 'NMR-5566',
            stateCouncil: 'Maharashtra Medical Council',
            clinicName: 'Trivedi Hospital',
            clinicAddress: '123 Health St, Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            phone: '9876543210',
            email: 'dr.ridham@example.com',
            specialty: 'Cardiologist'
        },
        patientId: 'PAT-002',
        patientName: 'Suman Gupta',
        patientAge: 32,
        patientGender: 'Female',
        diagnosis: 'Viral Fever',
        medicines: [
             { name: 'Paracetamol', dosage: '650mg', frequency: 'TDS', duration: '5 days', instructions: 'After food' },
             { name: 'Azithromycin', dosage: '500mg', frequency: 'OD', duration: '3 days', instructions: 'Before food' }
        ],
        advice: 'Plenty of fluids. Rest.',
        date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        status: 'DISPENSED',
        pharmacyId: 'sup-1',
        pharmacyName: 'Apollo Pharmacy',
        digitalSignatureToken: 'SIG-MOCK-2'
    }
];

// Seed Data to ensure ERP isn't empty on first load
const INITIAL_SUPPLIERS: Supplier[] = [
    { id: 'sup-1', name: 'Apollo Wholesale', contact: '9876543210', balance: -500, address: 'Mumbai, MH' },
    { id: 'sup-2', name: 'MedPlus Distributors', contact: '9988776655', balance: 2500, address: 'Delhi, DL' }
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
        return s ? JSON.parse(s) : INITIAL_RX; // Default to seed data
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
    setAuditLogs: (logs: AuditLog[]) => localStorage.setItem('devx_audit_logs', JSON.stringify(logs)),
    // Templates
    getTemplates: (): PrescriptionTemplate[] => {
        const s = localStorage.getItem('devx_rx_templates');
        return s ? JSON.parse(s) : [];
    },
    setTemplates: (templates: PrescriptionTemplate[]) => localStorage.setItem('devx_rx_templates', JSON.stringify(templates)),
    
    // ERP Entities
    getSuppliers: (): Supplier[] => {
        const s = localStorage.getItem('devx_suppliers');
        return s ? JSON.parse(s) : INITIAL_SUPPLIERS;
    },
    setSuppliers: (data: Supplier[]) => localStorage.setItem('devx_suppliers', JSON.stringify(data)),
    
    getCustomers: (): Customer[] => {
        const s = localStorage.getItem('devx_customers');
        return s ? JSON.parse(s) : [];
    },
    setCustomers: (data: Customer[]) => localStorage.setItem('devx_customers', JSON.stringify(data)),
    
    getSales: (): Sale[] => {
        const s = localStorage.getItem('devx_sales');
        return s ? JSON.parse(s) : [];
    },
    setSales: (data: Sale[]) => localStorage.setItem('devx_sales', JSON.stringify(data)),

    getSalesReturns: (): SalesReturn[] => {
        const s = localStorage.getItem('devx_sales_returns');
        return s ? JSON.parse(s) : [];
    },
    setSalesReturns: (data: SalesReturn[]) => localStorage.setItem('devx_sales_returns', JSON.stringify(data)),

    getExpenses: (): Expense[] => {
        const s = localStorage.getItem('devx_expenses');
        return s ? JSON.parse(s) : [];
    },
    setExpenses: (data: Expense[]) => localStorage.setItem('devx_expenses', JSON.stringify(data))
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
                console.warn("SQL Logs Fetch Error (If 'relation does not exist', run SUPABASE_SETUP.sql):", logsError.message);
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
            const allLogs = [...sqlLogs, ...blobLogsData];
            const uniqueLogs = Array.from(new Map(allLogs.map(item => [item.id, item])).values());
            
            // Sort descending
            const auditLogs = uniqueLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            // Parse or Default
            const users = (userData && userData.data) ? userData.data : INITIAL_USERS;
            const rx = (rxData && rxData.data) ? rxData.data : INITIAL_RX; // Default to seed if cloud empty
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
        console.log("DB: Saving Prescriptions...", rx.length);
        if (!supabase) {
            local.setRx(rx);
            console.log("DB: Saved to Local Storage");
            return;
        }
        try {
            const { error } = await supabase.from('prescriptions').upsert({ id: 'global_prescriptions', data: rx });
            if (error) {
                console.error("DB: Supabase Save Error", error);
                throw error;
            } else {
                console.log("DB: Saved to Cloud Successfully");
            }
        } catch (e) {
             console.error("DB: Critical Save Failure", e);
             // Fallback to local to prevent data loss
             local.setRx(rx);
        }
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
        // Capture client-side timestamp immediately
        const clientTimestamp = new Date().toISOString();
        
        const log: AuditLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
            actorId,
            action,
            details,
            timestamp: clientTimestamp
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
                details: details,
                created_at: clientTimestamp 
            });
            
            if (error) {
                console.warn("SQL Insert failed. You likely need to run the SUPABASE_SETUP.sql script.", error.message);
                throw error;
            }

        } catch (e) {
            try {
                const { data: current } = await supabase
                    .from('system_logs')
                    .select('data')
                    .eq('id', 'global_audit_logs')
                    .single();
                
                const existingLogs = current?.data || [];
                const updatedLogs = [log, ...existingLogs].slice(0, 500); 
                
                await supabase.from('system_logs').upsert({
                    id: 'global_audit_logs',
                    data: updatedLogs
                });
            } catch (blobErr) {
                console.error("Security Log Fallback Failed:", blobErr);
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
    },

    // --- Template Management (Local storage for MVP) ---
    getTemplates: (doctorId: string): PrescriptionTemplate[] => {
        const allTemplates = local.getTemplates();
        return allTemplates.filter(t => t.doctorId === doctorId);
    },
    
    saveTemplate: (template: PrescriptionTemplate): void => {
        const allTemplates = local.getTemplates();
        local.setTemplates([...allTemplates, template]);
    },

    // --- ERP Helpers (Currently Local Storage for Speed) ---
    // In production, these should map to Supabase tables just like Users/Prescriptions
    
    getSuppliers: (): Supplier[] => local.getSuppliers(),
    saveSuppliers: (data: Supplier[]) => local.setSuppliers(data),
    
    getCustomers: (): Customer[] => local.getCustomers(),
    saveCustomers: (data: Customer[]) => local.setCustomers(data),
    
    getSales: (): Sale[] => local.getSales(),
    saveSales: (data: Sale[]) => local.setSales(data),

    getSalesReturns: (): SalesReturn[] => local.getSalesReturns(),
    saveSalesReturns: (data: SalesReturn[]) => local.setSalesReturns(data),

    getExpenses: (): Expense[] => local.getExpenses(),
    saveExpenses: (data: Expense[]) => local.setExpenses(data)
};