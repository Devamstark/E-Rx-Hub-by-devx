

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi"
];

export const MEDICAL_DEGREES = [
  "MBBS", "MD", "MS", "DNB", "BDS", "MDS", "BAMS", "BHMS"
];

export const SPECIALTIES = [
  "General Physician", "Cardiologist", "Dermatologist", "Pediatrician", 
  "Gynecologist", "Orthopedist", "Psychiatrist", "Neurologist"
];

export const COMMON_MEDICINES = [
  "Paracetamol 500mg", "Paracetamol 650mg", "Amoxicillin 500mg", "Azithromycin 500mg", 
  "Metformin 500mg", "Metformin 1000mg", "Atorvastatin 10mg", "Atorvastatin 20mg",
  "Pantoprazole 40mg", "Omeprazole 20mg", "Rabeprazole 20mg", "Cetirizine 10mg", 
  "Levocetirizine 5mg", "Ibuprofen 400mg", "Diclofenac 50mg", "Aspirin 75mg", 
  "Telmisartan 40mg", "Amlodipine 5mg", "Losartan 50mg", "Montelukast 10mg",
  "Vitamin C 500mg", "Vitamin D3 60000IU", "B-Complex", "Calcium Carbonate 500mg",
  "Dolo 650", "Augmentin 625", "Pan 40", "Allegra 120mg", "Combiflam"
];

export const RESTRICTED_DRUGS = [
  "Morphine", "Fentanyl", "Oxycodone", "Codeine", "Tramadol", "Alprazolam", "Diazepam", "Lorazepam"
];

// Security & Validation Regex Patterns
export const REG_NUMBER_REGEX = /^[a-zA-Z0-9]{5,15}$/; // 5-15 alphanumeric characters
export const PHONE_REGEX = /^\d{10}$/; // Exactly 10 digits
export const PINCODE_REGEX = /^\d{6}$/; // Exactly 6 digits
