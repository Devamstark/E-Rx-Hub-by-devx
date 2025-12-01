

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

export const RESTRICTED_DRUGS = [
  "Morphine", "Fentanyl", "Oxycodone", "Codeine", "Tramadol", "Alprazolam", "Diazepam", "Lorazepam"
];

export const LOW_RISK_GENERIC_LIST = [
    "Paracetamol 500 mg Tablet",
    "Paracetamol 325 mg Tablet",
    "Paracetamol 250 mg Suspension",
    "Paracetamol 650 mg Tablet",
    "Ibuprofen 400 mg Tablet",
    "Ibuprofen 200 mg Tablet",
    "Ibuprofen 100 mg Suspension",
    "Mefenamic Acid 500 mg Tablet",
    "Mefenamic Acid 100 mg Suspension",
    "Aceclofenac 100 mg Tablet",
    "Diclofenac Sodium 50 mg Tablet",
    "Diclofenac Diethylamine 1.16% Gel",
    "Naproxen Sodium 550 mg Tablet",
    "Amoxicillin 500 mg Capsule",
    "Amoxicillin 250 mg Capsule",
    "Amoxicillin 400 mg Dry Syrup",
    "Amoxicillin 250 mg Suspension",
    "Cefixime 200 mg Tablet",
    "Cefixime 400 mg Tablet",
    "Cefixime 100 mg Suspension",
    "Azithromycin 500 mg Tablet",
    "Azithromycin 250 mg Tablet",
    "Clarithromycin 250 mg Suspension",
    "Ofloxacin 200 mg Tablet",
    "Ciprofloxacin 250 mg Tablet",
    "Ciprofloxacin 500 mg Tablet",
    "Ciprofloxacin 0.3% Eye Drops",
    "Metformin Hydrochloride 500 mg Tablet",
    "Metformin Hydrochloride 1000 mg Tablet",
    "Glimepiride 1 mg Tablet",
    "Glimepiride 2 mg Tablet",
    "Glimepiride 0.5 mg Tablet",
    "Voglibose 0.2 mg Tablet",
    "Voglibose 0.3 mg Tablet",
    "Gliclazide 80 mg Tablet",
    "Amlodipine 5 mg Tablet",
    "Amlodipine 2.5 mg Tablet",
    "Amlodipine 10 mg Tablet",
    "Telmisartan 40 mg Tablet",
    "Telmisartan 80 mg Tablet",
    "Losartan Potassium 50 mg Tablet",
    "Ramipril 2.5 mg Tablet",
    "Ramipril 5 mg Tablet",
    "Cilnidipine 10 mg Tablet",
    "Metoprolol Succinate 23.75 mg Tablet",
    "Metoprolol Succinate 47.5 mg Tablet",
    "Bisoprolol Fumarate 2.5 mg Tablet",
    "Bisoprolol Fumarate 5 mg Tablet",
    "Propranolol Hydrochloride 40 mg Tablet",
    "Propranolol Hydrochloride 10 mg Tablet",
    "Nebivolol 5 mg Tablet",
    "Chlorthalidone 12.5 mg Tablet",
    "Chlorthalidone 6.25 mg Tablet",
    "Hydrochlorothiazide 12.5 mg Tablet",
    "Furosemide 40 mg Tablet",
    "Spironolactone 25 mg Tablet",
    "Spironolactone 50 mg Tablet",
    "Pantoprazole 40 mg Tablet",
    "Omeprazole 20 mg Capsule",
    "Domperidone 10 mg Tablet",
    "Esomeprazole 40 mg Capsule",
    "Levocetirizine 2.5 mg Suspension",
    "Levocetirizine 5 mg Tablet",
    "Cetirizine 10 mg Tablet",
    "Cetirizine 5 mg Suspension",
    "Montelukast 10 mg Tablet",
    "Montelukast 5 mg Chewable Tablet",
    "Fexofenadine 120 mg Tablet",
    "Chlorpheniramine Maleate 2 mg Tablet",
    "Phenylephrine Hydrochloride 10 mg Tablet",
    "Phenylephrine Hydrochloride 5 mg Syrup",
    "Dicyclomine Hydrochloride 20 mg Tablet",
    "Camylofin Dihydrochloride 50 mg Tablet",
    "Albendazole 400 mg Tablet",
    "Mebendazole 100 mg Tablet",
    "Ivermectin 6 mg Tablet",
    "Co-trimoxazole 400 mg/80 mg Tablet",
    "Ascorbic Acid 500 mg Tablet",
    "Folic Acid 5 mg Tablet",
    "Folic Acid 1.5 mg Tablet",
    "Methylcobalamin 1500 mcg Tablet",
    "Vitamin D3 60000 IU Tablet",
    "Calcium Carbonate 1250 mg Tablet",
    "Zinc 5 mg Chewable Tablet",
    "Iron 100 mg Tablet",
    "Menthol 1 mg Lozenge",
    "Benzoyl Peroxide 2.5% Gel",
    "Salicylic Acid 3% Ointment",
    "Silver Sulphadiazine 1% Cream",
    "Povidone Iodine 10% Solution",
    "Clotrimazole 1% Cream",
    "Mupirocin 2% Ointment",
    "Loperamide 2 mg Capsule",
    "Oral Rehydration Salts Sachet"
];

export const COMMON_MEDICINES = LOW_RISK_GENERIC_LIST;

// Security & Validation Regex Patterns
export const REG_NUMBER_REGEX = /^[a-zA-Z0-9]{5,15}$/; // 5-15 alphanumeric characters
export const PHONE_REGEX = /^\d{10}$/; // Exactly 10 digits
export const PINCODE_REGEX = /^\d{6}$/; // Exactly 6 digits
