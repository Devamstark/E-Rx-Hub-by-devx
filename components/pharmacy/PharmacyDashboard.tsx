
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle, Package, Search, Users, ShoppingCart, Plus, Save, Trash2, Stethoscope, BarChart3, ScanBarcode, X, Activity, Calculator, FileText, Phone, MapPin, Edit2, AlertOctagon, Receipt, Truck, BookOpen, BrainCircuit, CreditCard, Filter, Building2, Printer, RotateCcw, AlertTriangle, UserPlus, UserCheck, ArrowRight, User, Wallet, ArrowLeft, Keyboard } from 'lucide-react';
import { Prescription, User as UserType, InventoryItem, DoctorDirectoryEntry, Patient, Supplier, Customer, Sale, SaleItem, GRN, Expense, SalesReturn } from '../../types';
import { PrescriptionModal } from '../doctor/PrescriptionModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { dbService } from '../../services/db';
import { getPharmacyAIInsights } from '../../services/geminiService';
import { VirtualNumpad } from '../ui/VirtualNumpad';

interface PharmacyDashboardProps {
    prescriptions: Prescription[];
    onDispense: (id: string, patientId?: string) => void;
    onReject: (id: string, reason?: string) => void;
    currentUser: UserType;
    onUpdateUser: (user: UserType) => void;
    patients: Patient[];
    onAddPatient: (p: Patient) => void;
    onUpdatePatient: (p: Patient) => void;
    salesReturns?: SalesReturn[];
    onAddSalesReturn?: (ret: SalesReturn) => void;
}

// Simple Receipt Component for Print
const PrintableReceipt = ({ sale, user }: { sale: Sale, user: UserType }) => (
    <div id="pos-receipt" className="hidden print:block bg-white text-black font-sans text-xs w-full">
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                body * { visibility: hidden; height: 0; overflow: hidden; }
                #pos-receipt, #pos-receipt * { visibility: visible; height: auto; overflow: visible; }
                #pos-receipt { 
                    position: fixed; 
                    left: 0; 
                    top: 0; 
                    width: 80mm; /* Standard Thermal Width */
                    margin: 0 auto; 
                    padding: 4mm;
                    background: white; 
                }
                @page { size: 80mm auto; margin: 0; }
            }
        `}} />
        
        <div className="text-center border-b-2 border-black pb-2 mb-2">
            <h2 className="font-bold text-lg uppercase leading-tight">{user.clinicName || 'Pharmacy Store'}</h2>
            <p className="text-[10px] leading-tight mt-1">{user.clinicAddress}</p>
            <p className="text-[10px] leading-tight">{user.city}, {user.state} {user.pincode}</p>
            <p className="text-[10px] font-bold mt-1">Ph: {user.phone}</p>
            <div className="flex justify-center gap-2 mt-1 text-[10px]">
                {user.gstin && <span>GST: {user.gstin}</span>}
                {user.licenseNumber && <span>DL: {user.licenseNumber}</span>}
            </div>
        </div>
        
        <div className="flex justify-between text-[10px] mb-1">
            <span>Inv: <b>{sale.invoiceNumber}</b></span>
            <span>{new Date(sale.date).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-[10px] mb-2 border-b border-black pb-2">
            <span>To: {sale.customerName || 'Walk-in'}</span>
            <span>{new Date(sale.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        
        <table className="w-full text-[10px] mb-2 border-collapse">
            <thead>
                <tr className="border-b border-black border-dashed">
                    <th className="text-left py-1 w-5/12">Item</th>
                    <th className="text-center py-1 w-2/12">Batch</th>
                    <th className="text-center py-1 w-1/12">Qty</th>
                    <th className="text-right py-1 w-2/12">Rate</th>
                    <th className="text-right py-1 w-2/12">Amt</th>
                </tr>
            </thead>
            <tbody>
                {sale.items.map((item, i) => (
                    <tr key={i} className="align-top">
                        <td className="py-1 pr-1 break-words">
                            <span className="font-bold">{item.name}</span>
                        </td>
                        <td className="py-1 text-center">{item.batchNumber}</td>
                        <td className="py-1 text-center">{item.quantity}</td>
                        <td className="py-1 text-right">{item.mrp}</td>
                        <td className="py-1 text-right">{item.total.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        <div className="border-t border-black border-dashed pt-2 text-[10px] space-y-1">
            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{sale.subTotal.toFixed(2)}</span>
            </div>
             {sale.discountAmount > 0 && (
                <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{sale.discountAmount.toFixed(2)}</span>
                </div>
            )}
            <div className="flex justify-between text-slate-600">
                <span>GST (Inc.):</span>
                <span>{sale.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm mt-2 border-t border-black pt-2">
                <span>TOTAL:</span>
                <span>₹{sale.roundedTotal}</span>
            </div>
            {sale.amountPaid !== undefined && (
                <>
                    <div className="flex justify-between mt-1 pt-1 border-t border-dashed border-slate-300">
                        <span>Paid:</span>
                        <span>₹{sale.amountPaid}</span>
                    </div>
                    {sale.balanceDue && sale.balanceDue > 0 ? (
                        <div className="flex justify-between font-bold">
                            <span>Balance Due:</span>
                            <span>₹{sale.balanceDue}</span>
                        </div>
                    ) : (
                         <div className="flex justify-between">
                            <span>Change:</span>
                            <span>₹{((sale.amountPaid||0) - sale.roundedTotal > 0 ? (sale.amountPaid||0) - sale.roundedTotal : 0).toFixed(2)}</span>
                        </div>
                    )}
                </>
            )}
             <div className="flex justify-between mt-1 text-[10px] italic">
                <span>Payment Mode:</span>
                <span className="font-bold">{sale.paymentMode}</span>
            </div>
        </div>
        
        <div className="text-center mt-6 text-[9px] border-t border-black pt-2">
            <p>Terms: Goods once sold will not be taken back.</p>
            <p>Subject to local jurisdiction.</p>
            <p className="font-bold mt-2 text-[10px]">*** THANK YOU ***</p>
            <p className="mt-1 text-slate-400">Gen by DevXWorld e-Rx Hub</p>
        </div>
    </div>
);

export const PharmacyDashboard: React.FC<PharmacyDashboardProps> = ({ 
    prescriptions, 
    onDispense,
    onReject, 
    currentUser, 
    onUpdateUser,
    patients,
    onAddPatient,
    onUpdatePatient,
    salesReturns = [],
    onAddSalesReturn
}) => {
  const [view, setView] = useState<'DASHBOARD' | 'ERX' | 'POS' | 'INVENTORY' | 'LEDGER' | 'REPORTS' | 'AI' | 'PATIENTS'>('DASHBOARD');
  const [erxTab, setErxTab] = useState<'QUEUE' | 'HISTORY'>('QUEUE');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  
  // Rx Processing State
  const [processingRx, setProcessingRx] = useState<Prescription | null>(null);
  const [matchMode, setMatchMode] = useState<'SEARCH'|'CREATE'>('SEARCH');
  const [linkedPatient, setLinkedPatient] = useState<Patient | null>(null);
  const [newPatientForm, setNewPatientForm] = useState<Partial<Patient>>({});
  
  // ERP State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [localReturns, setLocalReturns] = useState<SalesReturn[]>(salesReturns);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Load ERP Data
  useEffect(() => {
      setSuppliers(dbService.getSuppliers());
      setCustomers(dbService.getCustomers());
      setSales(dbService.getSales());
      setLocalReturns(dbService.getSalesReturns());
      setExpenses(dbService.getExpenses());
  }, []);

  // Sync back to DB on change
  useEffect(() => { if(suppliers.length) dbService.saveSuppliers(suppliers); }, [suppliers]);
  useEffect(() => { if(customers.length) dbService.saveCustomers(customers); }, [customers]);
  useEffect(() => { if(sales.length) dbService.saveSales(sales); }, [sales]);
  useEffect(() => { if(localReturns.length) dbService.saveSalesReturns(localReturns); }, [localReturns]);
  useEffect(() => { if(expenses.length) dbService.saveExpenses(expenses); }, [expenses]);

  // Derived Data
  const myPrescriptions = prescriptions.filter(p => p.pharmacyId === currentUser.id);
  const queue = myPrescriptions.filter(p => p.status === 'SENT_TO_PHARMACY');
  const history = myPrescriptions.filter(p => p.status === 'DISPENSED' || p.status === 'REJECTED' || p.status === 'REJECTED_STOCK');
  const inventory = currentUser.inventory || [];
  const lowStockItems = inventory.filter(i => i.stock <= i.minStockLevel);
  const expiredItems = inventory.filter(i => i.expiryDate && new Date(i.expiryDate) < new Date());
  
  // Stats
  const totalSales = sales.reduce((acc, s) => acc + s.roundedTotal, 0);
  const totalReturns = localReturns.reduce((acc, r) => acc + r.refundAmount, 0);
  const netSales = totalSales - totalReturns;
  
  const totalInventoryValue = inventory.reduce((acc, i) => acc + (i.purchasePrice * i.stock), 0);
  const totalDueFromCustomers = customers.reduce((acc, c) => acc + c.balance, 0);
  const totalDueToSuppliers = suppliers.reduce((acc, s) => acc + s.balance, 0);

  // --- Rx Processing Logic ---
  const handleStartProcessing = (rx: Prescription) => {
      setProcessingRx(rx);
      setMatchMode('SEARCH');
      // Auto-match attempt
      const match = patients.find(p => p.phone === rx.patientId || p.fullName.toLowerCase() === rx.patientName.toLowerCase());
      if(match) setLinkedPatient(match);
      else setLinkedPatient(null);
      
      // Pre-fill new form
      setNewPatientForm({
          fullName: rx.patientName,
          gender: rx.patientGender,
          // Estimate DOB from age if not provided
          dateOfBirth: new Date(new Date().getFullYear() - rx.patientAge, 0, 1).toISOString().split('T')[0],
          phone: '',
          address: ''
      });
  };

  const confirmNewPatient = () => {
      if(!newPatientForm.fullName || !newPatientForm.phone) {
          alert("Name and Phone are required"); return;
      }
      const newP: Patient = {
          id: `PAT-${Date.now()}`,
          doctorId: 'PHARMACY-WALKIN', // Or keep original doctor ID
          fullName: newPatientForm.fullName,
          phone: newPatientForm.phone,
          dateOfBirth: newPatientForm.dateOfBirth || '',
          gender: newPatientForm.gender as any || 'Male',
          address: newPatientForm.address || '',
          allergies: [], chronicConditions: [], registeredAt: new Date().toISOString()
      } as Patient;
      onAddPatient(newP);
      setLinkedPatient(newP);
      setMatchMode('SEARCH');
  };

  const finalizeRx = (status: 'DISPENSED' | 'REJECTED' | 'REJECTED_STOCK') => {
      if(!processingRx) return;
      
      if(status === 'DISPENSED') {
          if(!linkedPatient) {
               if(!confirm("No patient profile linked. Continue anonymously?")) return;
          }
          onDispense(processingRx.id, linkedPatient?.id);
      } else {
          onReject(processingRx.id, status);
      }
      setProcessingRx(null);
  };


  // --- POS BILLING LOGIC ---
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [selectedPosCustomer, setSelectedPosCustomer] = useState<Customer | null>(null);
  const [paymentMode, setPaymentMode] = useState<Sale['paymentMode']>('CASH');
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null);
  const [amountPaidInput, setAmountPaidInput] = useState<string>('0');
  
  // Quick Add State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddItem, setQuickAddItem] = useState<Partial<InventoryItem>>({});
  const [numpadModal, setNumpadModal] = useState<{
      targetField: keyof InventoryItem,
      value: string,
      onConfirm: (val: string) => void
  } | null>(null);

  // Update amount paid default when cart total changes
  const cartTotal = useMemo(() => Math.round(cart.reduce((a,b)=>a+(b.mrp*b.quantity),0)), [cart]);
  
  useEffect(() => {
      // Default to full payment unless specifically set to 0 for credit
      if (paymentMode !== 'CREDIT') {
          setAmountPaidInput(cartTotal.toString());
      }
  }, [cartTotal, paymentMode]);

  const addToCart = (item: InventoryItem) => {
      if(item.stock <= 0) { alert("Out of Stock"); return; }
      const existing = cart.find(c => c.inventoryId === item.id);
      if(existing) {
          if(existing.quantity >= item.stock) { alert("Max stock reached"); return; }
          setCart(cart.map(c => c.inventoryId === item.id ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.mrp } : c));
      } else {
          setCart([...cart, {
              inventoryId: item.id,
              name: item.name,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              quantity: 1,
              mrp: item.mrp,
              costPrice: item.purchasePrice,
              gstPercentage: item.gstPercentage || 0,
              discount: 0,
              total: item.mrp
          }]);
      }
  };

  const handlePosCheckout = async () => {
      if(cart.length === 0) return;
      
      const subTotal = cart.reduce((acc, i) => acc + (i.mrp * i.quantity), 0);
      const discount = 0; 
      const gstAmount = cart.reduce((acc, i) => acc + ( (i.mrp * i.quantity) * (i.gstPercentage/100) ), 0);
      const roundedTotal = Math.round(subTotal);

      // Partial Payment Logic
      const amountPaidNum = parseFloat(amountPaidInput) || 0;
      const amountPaid = amountPaidNum < 0 ? 0 : amountPaidNum;
      const balanceDue = roundedTotal - amountPaid;

      // Validation
      if (balanceDue > 0 && !selectedPosCustomer) {
          alert("Credit Balance Detected: You must select a registered Customer to assign the due amount.");
          return;
      }

      // Determine Mode
      let finalMode: Sale['paymentMode'] = paymentMode;
      if (balanceDue > 0) {
          finalMode = amountPaid > 0 ? 'PARTIAL' : 'CREDIT';
      } else if (finalMode === 'CREDIT') {
          // If fully paid but mode was CREDIT, default to CASH implies instant settlement
          finalMode = 'CASH';
      }

      const newSale: Sale = {
          id: `INV-${Date.now()}`,
          invoiceNumber: `INV-${new Date().getFullYear()}-${sales.length + 1001}`,
          date: new Date().toISOString(),
          customerId: selectedPosCustomer?.id,
          customerName: selectedPosCustomer?.name || 'Walk-in',
          items: [...cart],
          subTotal,
          gstAmount,
          discountAmount: discount,
          roundedTotal,
          amountPaid: amountPaid,
          balanceDue: balanceDue > 0 ? balanceDue : 0,
          paymentMode: finalMode,
          pharmacyId: currentUser.id
      };

      // 1. Update Inventory
      const updatedInventory = inventory.map(invItem => {
          const cartItem = cart.find(c => c.inventoryId === invItem.id);
          if(cartItem) {
              return { ...invItem, stock: invItem.stock - cartItem.quantity };
          }
          return invItem;
      });
      onUpdateUser({ ...currentUser, inventory: updatedInventory });

      // 2. Update Customer Ledger if Credit / Partial
      if(balanceDue > 0 && selectedPosCustomer) {
          setCustomers(prev => prev.map(c => c.id === selectedPosCustomer.id ? { ...c, balance: c.balance + balanceDue } : c));
          // Audit Log
          await dbService.logSecurityAction(currentUser.id, 'LEDGER_DEBIT', `Customer ${selectedPosCustomer.name} debited ₹${balanceDue} (Inv: ${newSale.invoiceNumber})`);
      }

      // 3. Save Sale
      setSales([newSale, ...sales]);
      
      // Reset & Show Receipt
      setCart([]);
      setSelectedPosCustomer(null);
      setPosSearch('');
      setShowReceipt(newSale); // Trigger receipt modal
  };

  const openQuickAdd = () => {
      setQuickAddItem({ 
          name: posSearch || '', 
          gstPercentage: 0,
          purchasePrice: 0
      });
      setShowQuickAdd(true);
  };

  const handleQuickAddSubmit = async () => {
      if(!quickAddItem.name || !quickAddItem.batchNumber || !quickAddItem.mrp || !quickAddItem.stock) {
          alert("Please fill in Name, Batch, Stock, and MRP.");
          return;
      }

      const purchasePrice = quickAddItem.purchasePrice || (quickAddItem.mrp * 0.7); // Default estimate

      const newItem: InventoryItem = {
          id: `item-${Date.now()}`,
          name: quickAddItem.name,
          genericName: quickAddItem.genericName,
          manufacturer: quickAddItem.manufacturer || 'QuickAdd',
          batchNumber: quickAddItem.batchNumber,
          barcode: quickAddItem.barcode,
          expiryDate: quickAddItem.expiryDate || '', // Empty allowed
          stock: Number(quickAddItem.stock),
          minStockLevel: 5,
          purchasePrice: Number(purchasePrice),
          mrp: Number(quickAddItem.mrp),
          isNarcotic: false,
          gstPercentage: Number(quickAddItem.gstPercentage || 0),
          hsnCode: ''
      } as InventoryItem;

      const updatedInventory = [newItem, ...inventory];
      onUpdateUser({ ...currentUser, inventory: updatedInventory });
      
      setShowQuickAdd(false);
      setQuickAddItem({});
      setPosSearch(newItem.name); // Auto-search the new item
  };

  // --- RETURNS LOGIC ---
  const [returnSaleId, setReturnSaleId] = useState('');
  const [returnItems, setReturnItems] = useState<{item: SaleItem, returnQty: number}[]>([]);

  const initiateReturn = (sale: Sale) => {
      setReturnSaleId(sale.id);
      setReturnItems(sale.items.map(i => ({ item: i, returnQty: 0 })));
  };

  const processReturn = async (originalSale: Sale) => {
      const itemsToReturn = returnItems.filter(r => r.returnQty > 0);
      if(itemsToReturn.length === 0) return;

      const refundAmount = itemsToReturn.reduce((acc, r) => acc + (r.returnQty * r.item.mrp), 0);
      
      const newReturn: SalesReturn = {
          id: `RET-${Date.now()}`,
          originalInvoiceId: originalSale.id,
          invoiceNumber: originalSale.invoiceNumber,
          date: new Date().toISOString(),
          customerName: originalSale.customerName || 'Walk-in',
          items: itemsToReturn.map(r => ({...r.item, quantity: r.returnQty, total: r.returnQty * r.item.mrp})),
          refundAmount: refundAmount,
          reason: 'Customer Return'
      };

      // 1. Update Inventory (Add Stock Back)
      const updatedInventory = inventory.map(invItem => {
          const retItem = itemsToReturn.find(r => r.item.inventoryId === invItem.id);
          if(retItem) {
              return { ...invItem, stock: invItem.stock + retItem.returnQty };
          }
          return invItem;
      });
      onUpdateUser({ ...currentUser, inventory: updatedInventory });

      // 2. Update Customer Balance if Credit Return
      if(originalSale.customerId) {
           setCustomers(prev => prev.map(c => c.id === originalSale.customerId ? { ...c, balance: c.balance - refundAmount } : c));
           await dbService.logSecurityAction(currentUser.id, 'LEDGER_CREDIT', `Return Processed: Credited ₹${refundAmount} to ${originalSale.customerName}`);
      }

      // 3. Save Return
      setLocalReturns([newReturn, ...localReturns]);
      if(onAddSalesReturn) onAddSalesReturn(newReturn);

      setReturnSaleId('');
      setReturnItems([]);
      alert(`Return Processed. Refund Amount: ₹${refundAmount}`);
  };

  // --- LEDGER LOGIC ---
  const [transactionModal, setTransactionModal] = useState<{
      type: 'SUPPLIER'|'CUSTOMER', 
      id: string, 
      name: string, 
      currentBalance: number,
      amount: string,
      mode: 'PAYMENT_RECEIVED' | 'ADD_CHARGE' | 'PAYMENT_MADE'
  } | null>(null);

  const handleTransactionSubmit = async () => {
      if(!transactionModal) return;
      const amount = parseFloat(transactionModal.amount);
      if(isNaN(amount) || amount <= 0) {
          alert("Please enter a valid amount");
          return;
      }

      const isSupplier = transactionModal.type === 'SUPPLIER';
      let balanceChange = 0;
      let logAction = '';
      let logDetail = '';

      if (isSupplier) {
          // Supplier Logic
          if (transactionModal.mode === 'PAYMENT_MADE') {
              balanceChange = -amount; // Reduce debt
              logAction = 'SUPPLIER_PAYMENT';
              logDetail = `Paid ₹${amount} to supplier ${transactionModal.name}`;
          } else {
              balanceChange = amount; // Increase debt
              logAction = 'SUPPLIER_CREDIT';
              logDetail = `Added ₹${amount} credit from supplier ${transactionModal.name}`;
          }
          setSuppliers(prev => prev.map(s => s.id === transactionModal.id ? { ...s, balance: s.balance + balanceChange } : s));
      } else {
          // Customer Logic
          if (transactionModal.mode === 'PAYMENT_RECEIVED') {
              balanceChange = -amount; // Reduce debt
              logAction = 'CUSTOMER_PAYMENT';
              logDetail = `Received ₹${amount} from customer ${transactionModal.name}`;
          } else {
              balanceChange = amount; // Increase debt
              logAction = 'CUSTOMER_DEBIT';
              logDetail = `Manually debited ₹${amount} to customer ${transactionModal.name}`;
          }
          setCustomers(prev => prev.map(c => c.id === transactionModal.id ? { ...c, balance: c.balance + balanceChange } : c));
      }

      // Audit Log
      await dbService.logSecurityAction(currentUser.id, logAction, logDetail);

      setTransactionModal(null);
  };


  // --- INVENTORY & GRN LOGIC ---
  const [showGrnForm, setShowGrnForm] = useState(false);
  const [grnSupplier, setGrnSupplier] = useState('');
  const [grnItems, setGrnItems] = useState<InventoryItem[]>([]); 
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({});

  const handleAddGrnItem = () => {
      if(!newItem.name || !newItem.batchNumber || !newItem.mrp || !newItem.purchasePrice) {
          alert("Fill all item details"); return;
      }
      const item: InventoryItem = {
          id: `item-${Date.now()}`,
          name: newItem.name,
          manufacturer: newItem.manufacturer || '',
          batchNumber: newItem.batchNumber,
          expiryDate: newItem.expiryDate || new Date().toISOString(),
          stock: newItem.stock || 0,
          minStockLevel: newItem.minStockLevel || 10,
          purchasePrice: newItem.purchasePrice,
          mrp: newItem.mrp,
          unitPrice: newItem.mrp,
          isNarcotic: newItem.isNarcotic || false,
          gstPercentage: newItem.gstPercentage || 12,
          hsnCode: newItem.hsnCode
      } as InventoryItem;
      
      setGrnItems([...grnItems, item]);
      setNewItem({});
  };

  const handleSaveGRN = () => {
      if(!grnSupplier || grnItems.length === 0) return;
      
      const updatedInv = [...inventory, ...grnItems];
      onUpdateUser({ ...currentUser, inventory: updatedInv });

      const totalVal = grnItems.reduce((acc, i) => acc + (i.purchasePrice * i.stock), 0);
      setSuppliers(prev => prev.map(s => s.id === grnSupplier ? { ...s, balance: s.balance + totalVal } : s));

      alert("GRN Saved & Inventory Updated!");
      setGrnItems([]);
      setShowGrnForm(false);
  };

  // --- AI INSIGHTS ---
  const [aiInsights, setAiInsights] = useState<{reorderSuggestions: any[], pricingTips: any[], anomalies: any[]} | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchInsights = async () => {
      setLoadingAi(true);
      const insights = await getPharmacyAIInsights(inventory, sales);
      setAiInsights(insights);
      setLoadingAi(false);
  };

  // --- HELPER COMPONENTS ---
  const MetricCard = ({ label, value, icon: Icon, color, subtext }: any) => (
      <div className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all`}>
          <div>
              <p className="text-xs font-bold text-slate-500 uppercase">{label}</p>
              <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
              {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
          </div>
          <div className={`p-3 rounded-full bg-slate-50`}>
              <Icon className={`w-6 h-6 ${color}`} />
          </div>
      </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 min-h-screen pb-20">
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                <Building2 className="mr-2 text-indigo-600"/> {currentUser.clinicName || 'Pharmacy ERP'}
            </h1>
            <p className="text-slate-500 text-xs font-medium">License: {currentUser.licenseNumber}</p>
        </div>
        <div className="flex space-x-2">
            <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold flex items-center">
                <Activity className="w-3 h-3 mr-1"/> Online
            </span>
            <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full font-bold">
                {new Date().toDateString()}
            </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
          {[
              { id: 'DASHBOARD', label: 'Overview', icon: Activity },
              { id: 'ERX', label: 'e-Prescriptions', icon: FileText },
              { id: 'PATIENTS', label: 'Patients', icon: Users },
              { id: 'POS', label: 'Billing / POS', icon: Calculator },
              { id: 'INVENTORY', label: 'Stock & GRN', icon: Package },
              { id: 'LEDGER', label: 'Ledger', icon: BookOpen },
              { id: 'REPORTS', label: 'Reports', icon: BarChart3 },
              { id: 'AI', label: 'AI Assistant', icon: BrainCircuit },
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center whitespace-nowrap transition-all border ${
                    view === tab.id 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2"/> {tab.label}
              </button>
          ))}
      </div>

      {/* === DASHBOARD VIEW === */}
      {view === 'DASHBOARD' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <MetricCard label="Net Sales" value={`₹${netSales}`} icon={Receipt} color="text-green-600" />
                  <MetricCard label="Pending Rx" value={queue.length} icon={FileText} color="text-blue-600" subtext="In Queue" />
                  <MetricCard label="Low Stock Items" value={lowStockItems.length} icon={AlertOctagon} color="text-red-600" subtext="Reorder Needed" />
                  <MetricCard label="Credit Given" value={`₹${totalDueFromCustomers}`} icon={Users} color="text-orange-600" subtext="Customer Dues" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                       <h3 className="font-bold text-slate-800 mb-4">Stock Value Distribution</h3>
                       <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={[
                                   { name: 'Healthy Stock', value: totalInventoryValue - (lowStockItems.length * 100) }, // Approx
                                   { name: 'Expired/Dead', value: expiredItems.reduce((a,i)=>a+(i.purchasePrice*i.stock),0) }
                               ]}>
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis dataKey="name" />
                                   <YAxis />
                                   <Tooltip />
                                   <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} />
                               </BarChart>
                           </ResponsiveContainer>
                       </div>
                   </div>

                   <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                       <h3 className="font-bold text-slate-800 mb-4 flex justify-between">
                           Recent Invoices <button onClick={()=>setView('REPORTS')} className="text-xs text-indigo-600 hover:underline">View All</button>
                       </h3>
                       <div className="overflow-y-auto max-h-64 space-y-3">
                           {sales.slice(0, 5).map(sale => (
                               <div key={sale.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                   <div>
                                       <p className="font-bold text-sm text-slate-800">{sale.invoiceNumber}</p>
                                       <p className="text-xs text-slate-500">{sale.customerName} • {new Date(sale.date).toLocaleDateString()}</p>
                                   </div>
                                   <div className="text-right">
                                       <span className="font-bold text-green-700 block">₹{sale.roundedTotal}</span>
                                       {sale.balanceDue && sale.balanceDue > 0 ? (
                                           <span className="text-[10px] text-red-500 bg-red-50 px-1 rounded">Due: ₹{sale.balanceDue}</span>
                                       ) : null}
                                   </div>
                               </div>
                           ))}
                           {sales.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No sales recorded yet.</p>}
                       </div>
                   </div>
              </div>
          </div>
      )}

      {/* === POS / BILLING VIEW === */}
      {view === 'POS' && (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)] animate-in fade-in">
              {/* Item Selection (Left) */}
              <div className="col-span-8 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
                      <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                          <input 
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="Search Product, Generic or Barcode..."
                            value={posSearch}
                            onChange={e => setPosSearch(e.target.value)}
                            autoFocus
                          />
                      </div>
                      <button 
                        onClick={openQuickAdd}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-teal-700 flex items-center whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4 mr-1"/> Quick Add Item
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                      {inventory.filter(i => {
                          const s = posSearch.toLowerCase();
                          return (i.name.toLowerCase().includes(s) || (i.genericName || '').toLowerCase().includes(s) || (i.barcode || '').includes(s)) && i.stock > 0;
                      }).length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400">
                               <Package className="w-12 h-12 mb-3 text-slate-200"/>
                               <p>Product not found.</p>
                               <button onClick={openQuickAdd} className="text-indigo-600 font-bold mt-2 hover:underline">Quick Add "{posSearch}" to Inventory</button>
                          </div>
                      ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3">Item Name</th>
                                    <th className="px-4 py-3">Batch</th>
                                    <th className="px-4 py-3">Expiry</th>
                                    <th className="px-4 py-3 text-right">Stock</th>
                                    <th className="px-4 py-3 text-right">MRP</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inventory.filter(i => {
                                    const s = posSearch.toLowerCase();
                                    return (i.name.toLowerCase().includes(s) || (i.genericName || '').toLowerCase().includes(s) || (i.barcode || '').includes(s)) && i.stock > 0;
                                }).map(item => (
                                    <tr key={item.id} className="hover:bg-indigo-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{item.name}</div>
                                            {item.genericName && <div className="text-xs text-slate-500 italic">{item.genericName}</div>}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-600 text-xs">{item.batchNumber}</td>
                                        <td className={`px-4 py-3 text-xs font-bold ${item.expiryDate && new Date(item.expiryDate) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                                            {item.expiryDate || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-right">{item.stock}</td>
                                        <td className="px-4 py-3 text-right">₹{item.mrp}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => addToCart(item)}
                                                className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-indigo-700"
                                            >
                                                Add +
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      )}
                  </div>
              </div>

              {/* Cart / Checkout (Right) */}
              <div className="col-span-4 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full">
                  <div className="p-4 bg-indigo-900 text-white rounded-t-xl flex justify-between items-center shrink-0">
                      <h3 className="font-bold flex items-center"><ShoppingCart className="mr-2 w-5 h-5"/> Current Bill</h3>
                      <span className="bg-indigo-700 px-2 py-1 rounded text-xs">{cart.length} Items</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                      {cart.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
                              <div className="overflow-hidden">
                                  <p className="font-bold text-sm text-slate-800 truncate">{item.name}</p>
                                  <p className="text-xs text-slate-500">{item.quantity} x ₹{item.mrp}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-bold text-slate-900">₹{item.quantity * item.mrp}</span>
                                  <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                              </div>
                          </div>
                      ))}
                      {cart.length === 0 && <div className="text-center text-slate-400 py-10">Cart is Empty</div>}
                  </div>

                  <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                      <div className="mb-2">
                          <select 
                            className={`w-full border rounded p-2 text-sm ${((cartTotal - (parseFloat(amountPaidInput)||0)) > 0 && !selectedPosCustomer) ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}
                            onChange={(e) => {
                                const cust = customers.find(c => c.id === e.target.value);
                                setSelectedPosCustomer(cust || null);
                            }}
                            value={selectedPosCustomer?.id || ''}
                          >
                              <option value="">Walk-in Customer</option>
                              {customers.map(c => <option key={c.id} value={c.id}>{c.name} (Due: {c.balance})</option>)}
                          </select>
                      </div>

                      <div className="flex justify-between text-xl font-bold text-indigo-700 mb-2">
                          <span>Total</span>
                          <span>₹{cartTotal}</span>
                      </div>

                      {/* Payment Mode Selector */}
                      <div className="mb-3">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Payment Method</label>
                          <div className="grid grid-cols-4 gap-2">
                              {['CASH', 'UPI', 'CARD', 'CREDIT'].map(mode => (
                                  <button
                                      key={mode}
                                      onClick={() => {
                                          setPaymentMode(mode as any);
                                          if (mode === 'CREDIT') {
                                              setAmountPaidInput('0');
                                          } else if (parseFloat(amountPaidInput) === 0 || parseFloat(amountPaidInput) === cartTotal) {
                                              setAmountPaidInput(cartTotal.toString());
                                          }
                                      }}
                                      className={`py-2 px-1 text-xs font-bold rounded-md border transition-all ${
                                          paymentMode === mode 
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                      }`}
                                  >
                                      {mode}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Integrated Numpad & Payment Input */}
                      <div className="mb-2">
                          <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Amount Received</label>
                          <div className="flex">
                               <input 
                                  type="number"
                                  className="w-full text-lg font-bold border-2 border-slate-300 rounded p-2 text-right text-slate-900 focus:border-indigo-600 outline-none"
                                  value={amountPaidInput}
                                  onChange={(e) => setAmountPaidInput(e.target.value)}
                                  onFocus={(e) => e.target.select()}
                               />
                          </div>
                      </div>

                      {/* Embedded Numpad for Payment */}
                      <VirtualNumpad 
                        className="mb-3"
                        compact={true}
                        onInput={(k) => {
                            if (k === '.' && amountPaidInput.includes('.')) return;
                            setAmountPaidInput(prev => (prev === '0' && k !== '.') ? k : prev + k);
                        }}
                        onDelete={() => setAmountPaidInput(prev => prev.length > 1 ? prev.slice(0, -1) : '0')}
                      />
                      
                      <div className="flex justify-between text-sm font-medium mb-3">
                           <span className={`${(cartTotal - (parseFloat(amountPaidInput)||0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                               {(cartTotal - (parseFloat(amountPaidInput)||0)) > 0 ? 'Balance Due:' : 'Change:'}
                           </span>
                           <span className={`font-bold ${(cartTotal - (parseFloat(amountPaidInput)||0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                               ₹{Math.abs(cartTotal - (parseFloat(amountPaidInput)||0)).toFixed(2)}
                           </span>
                      </div>

                      <button 
                        onClick={handlePosCheckout}
                        disabled={cart.length === 0}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 flex justify-center items-center"
                      >
                          <Receipt className="w-5 h-5 mr-2"/> Checkout & Print
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* QUICK ADD MODAL */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-slate-900/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 bg-teal-600 text-white flex justify-between items-center rounded-t-xl sticky top-0 z-10">
                    <h3 className="font-bold flex items-center"><Plus className="w-5 h-5 mr-2"/> Quick Add Product</h3>
                    <button onClick={() => setShowQuickAdd(false)} className="hover:text-teal-200"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name *</label>
                        <input className="w-full border p-2 rounded" autoFocus value={quickAddItem.name || ''} onChange={e => setQuickAddItem({...quickAddItem, name: e.target.value})} />
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Generic Name</label>
                        <input className="w-full border p-2 rounded" value={quickAddItem.genericName || ''} onChange={e => setQuickAddItem({...quickAddItem, genericName: e.target.value})} />
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Barcode (Optional)</label>
                        <div className="flex">
                            <input className="w-full border p-2 rounded-l" value={quickAddItem.barcode || ''} onChange={e => setQuickAddItem({...quickAddItem, barcode: e.target.value})} />
                            <button className="bg-slate-100 border border-l-0 rounded-r px-3 text-slate-500"><ScanBarcode className="w-4 h-4"/></button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batch Number *</label>
                        <input className="w-full border p-2 rounded" value={quickAddItem.batchNumber || ''} onChange={e => setQuickAddItem({...quickAddItem, batchNumber: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                        <input type="date" className="w-full border p-2 rounded" value={quickAddItem.expiryDate || ''} onChange={e => setQuickAddItem({...quickAddItem, expiryDate: e.target.value})} />
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity *</label>
                        <div className="flex">
                            <input 
                                type="number" 
                                className="w-full border p-2 rounded-l" 
                                value={quickAddItem.stock || ''} 
                                onChange={e => setQuickAddItem({...quickAddItem, stock: parseInt(e.target.value)})}
                            />
                            <button 
                                onClick={() => setNumpadModal({ targetField: 'stock', value: '', onConfirm: (val) => setQuickAddItem(prev => ({...prev, stock: parseInt(val)})) })}
                                className="bg-slate-100 border border-l-0 rounded-r px-3 text-slate-600 hover:bg-slate-200"
                            >
                                <Keyboard className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GST %</label>
                        <select 
                            className="w-full border p-2 rounded" 
                            value={quickAddItem.gstPercentage || 0} 
                            onChange={e => setQuickAddItem({...quickAddItem, gstPercentage: parseFloat(e.target.value)})}
                        >
                            <option value="0">0% (Nil)</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sale Price (MRP) *</label>
                        <div className="flex">
                            <input 
                                type="number" 
                                className="w-full border p-2 rounded-l font-bold" 
                                value={quickAddItem.mrp || ''} 
                                onChange={e => setQuickAddItem({...quickAddItem, mrp: parseFloat(e.target.value)})}
                            />
                            <button 
                                onClick={() => setNumpadModal({ targetField: 'mrp', value: '', onConfirm: (val) => setQuickAddItem(prev => ({...prev, mrp: parseFloat(val)})) })}
                                className="bg-slate-100 border border-l-0 rounded-r px-3 text-slate-600 hover:bg-slate-200"
                            >
                                <Keyboard className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Price (PTR)</label>
                        <div className="flex">
                            <input 
                                type="number" 
                                className="w-full border p-2 rounded-l" 
                                placeholder="Auto-est if empty"
                                value={quickAddItem.purchasePrice || ''} 
                                onChange={e => setQuickAddItem({...quickAddItem, purchasePrice: parseFloat(e.target.value)})}
                            />
                            <button 
                                onClick={() => setNumpadModal({ targetField: 'purchasePrice', value: '', onConfirm: (val) => setQuickAddItem(prev => ({...prev, purchasePrice: parseFloat(val)})) })}
                                className="bg-slate-100 border border-l-0 rounded-r px-3 text-slate-600 hover:bg-slate-200"
                            >
                                <Keyboard className="w-4 h-4"/>
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Leave blank to estimate (MRP * 0.7)</p>
                    </div>

                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0">
                    <button onClick={() => setShowQuickAdd(false)} className="px-4 py-2 text-slate-600 font-bold text-sm">Cancel</button>
                    <button onClick={handleQuickAddSubmit} className="px-6 py-2 bg-teal-600 text-white rounded font-bold hover:bg-teal-700 shadow-sm">Save & Add to Inventory</button>
                </div>
            </div>
        </div>
      )}

      {/* KEYPAD MODAL FOR QUICK ADD FIELDS */}
      {numpadModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-xs animate-in zoom-in-95">
                 <h3 className="font-bold text-slate-700 mb-2 text-center uppercase text-xs">Enter Value</h3>
                 <div className="text-3xl font-bold text-center mb-4 text-slate-900 border-b border-slate-200 pb-2 min-h-[40px]">
                     {numpadModal.value || <span className="text-slate-300">0</span>}
                 </div>
                 <VirtualNumpad 
                    onInput={(k) => setNumpadModal(prev => prev ? ({...prev, value: prev.value + k}) : null)}
                    onDelete={() => setNumpadModal(prev => prev ? ({...prev, value: prev.value.slice(0, -1)}) : null)}
                    onConfirm={() => {
                        numpadModal.onConfirm(numpadModal.value);
                        setNumpadModal(null);
                    }}
                    onClose={() => setNumpadModal(null)}
                 />
             </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceipt && (
          <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
                  <div className="bg-green-600 p-4 text-center text-white">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2"/>
                      <h3 className="text-lg font-bold">Payment Successful</h3>
                      <p className="text-sm">Invoice #{showReceipt.invoiceNumber}</p>
                  </div>
                  <div className="p-6 text-center space-y-4">
                      <p className="text-sm text-slate-600">
                          Bill Total: <span className="font-bold text-slate-900 text-lg">₹{showReceipt.roundedTotal}</span>
                      </p>
                      {showReceipt.amountPaid !== undefined && (
                          <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-2 rounded">
                               <div>Paid: <span className="font-bold">₹{showReceipt.amountPaid}</span></div>
                               <div>Due: <span className="font-bold text-red-600">₹{showReceipt.balanceDue || 0}</span></div>
                          </div>
                      )}
                      
                      {/* Hidden printable receipt */}
                      <PrintableReceipt sale={showReceipt} user={currentUser} />

                      <div className="flex gap-3 justify-center">
                          <button 
                            onClick={() => window.print()}
                            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700"
                          >
                              <Printer className="w-4 h-4 mr-2"/> Print Receipt / Save PDF
                          </button>
                          <button 
                            onClick={() => setShowReceipt(null)}
                            className="flex items-center border border-slate-300 text-slate-700 px-4 py-2 rounded font-bold hover:bg-slate-50"
                          >
                              Close
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* === INVENTORY & GRN VIEW === */}
      {view === 'INVENTORY' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800">Inventory & Stock Entry</h3>
                  <div className="flex gap-2">
                       <button onClick={() => setShowGrnForm(!showGrnForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-teal-700">
                           <Plus className="w-4 h-4 mr-2"/> New GRN Entry
                       </button>
                  </div>
              </div>

              {showGrnForm && (
                  <div className="bg-white p-6 rounded-xl border border-teal-200 shadow-lg animate-in slide-in-from-top-4">
                      <h4 className="font-bold text-teal-800 mb-4 border-b border-teal-100 pb-2">Goods Received Note (GRN)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500">Supplier *</label>
                              <select className="w-full border p-2 rounded text-sm" onChange={e => setGrnSupplier(e.target.value)} value={grnSupplier}>
                                  <option value="">Select Supplier</option>
                                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                          </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                          <input placeholder="Item Name" className="border p-2 rounded text-sm col-span-2" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                          <input placeholder="Batch No" className="border p-2 rounded text-sm" value={newItem.batchNumber || ''} onChange={e => setNewItem({...newItem, batchNumber: e.target.value})} />
                          <input type="date" className="border p-2 rounded text-sm" value={newItem.expiryDate || ''} onChange={e => setNewItem({...newItem, expiryDate: e.target.value})} />
                          <input type="number" placeholder="Qty" className="border p-2 rounded text-sm" value={newItem.stock || ''} onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value)})} />
                          <input type="number" placeholder="Cost Price" className="border p-2 rounded text-sm" value={newItem.purchasePrice || ''} onChange={e => setNewItem({...newItem, purchasePrice: parseFloat(e.target.value)})} />
                          <input type="number" placeholder="MRP" className="border p-2 rounded text-sm" value={newItem.mrp || ''} onChange={e => setNewItem({...newItem, mrp: parseFloat(e.target.value)})} />
                          <button onClick={handleAddGrnItem} className="bg-indigo-600 text-white p-2 rounded font-bold text-xs col-span-full md:col-span-1">Add Line</button>
                      </div>

                      {grnItems.length > 0 && (
                          <div className="mb-4">
                              <table className="w-full text-sm">
                                  <thead className="bg-slate-100 text-xs text-slate-500 uppercase">
                                      <tr><th>Item</th><th>Batch</th><th>Qty</th><th>Cost</th><th>Total</th></tr>
                                  </thead>
                                  <tbody>
                                      {grnItems.map((i, idx) => (
                                          <tr key={idx} className="border-b">
                                              <td className="p-2">{i.name}</td>
                                              <td className="p-2">{i.batchNumber}</td>
                                              <td className="p-2">{i.stock}</td>
                                              <td className="p-2">{i.purchasePrice}</td>
                                              <td className="p-2">{i.stock * i.purchasePrice}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      )}

                      <div className="flex justify-end gap-3">
                          <button onClick={() => setShowGrnForm(false)} className="text-slate-500 font-bold text-sm">Cancel</button>
                          <button onClick={handleSaveGRN} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">Save GRN & Update Stock</button>
                      </div>
                  </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <table className="min-w-full divide-y divide-slate-200">
                       <thead className="bg-slate-50">
                           <tr>
                               <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Product</th>
                               <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Batch Info</th>
                               <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Stock</th>
                               <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Value</th>
                           </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-slate-200">
                           {inventory.map(item => (
                               <tr key={item.id} className="hover:bg-slate-50">
                                   <td className="px-6 py-4">
                                       <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                       {item.genericName && <p className="text-xs text-slate-500 italic">{item.genericName}</p>}
                                       <p className="text-xs text-slate-400 mt-0.5">{item.manufacturer}</p>
                                   </td>
                                   <td className="px-6 py-4">
                                       <p className="text-xs font-mono text-slate-600">{item.batchNumber}</p>
                                       <p className={`text-xs font-bold ${item.expiryDate && new Date(item.expiryDate) < new Date() ? 'text-red-500' : 'text-slate-500'}`}>Exp: {item.expiryDate || 'N/A'}</p>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                       <span className={`px-2 py-1 rounded text-xs font-bold ${item.stock <= item.minStockLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                           {item.stock} Units
                                       </span>
                                   </td>
                                   <td className="px-6 py-4 text-right text-sm font-bold text-slate-700">
                                       ₹{item.stock * item.purchasePrice}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
              </div>
          </div>
      )}

      {/* === LEDGER VIEW === */}
      {view === 'LEDGER' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
              {/* Suppliers */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center"><Truck className="mr-2 w-5 h-5"/> Supplier Ledger</h3>
                      <button className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded font-bold" onClick={() => {
                          const name = prompt("Supplier Name:");
                          if(name) setSuppliers([...suppliers, { id: `sup-${Date.now()}`, name, contact: '', balance: 0 }]);
                      }}>+ Add</button>
                  </div>
                  <div className="space-y-3">
                      {suppliers.map(s => (
                          <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                              <div>
                                  <p className="font-bold text-sm">{s.name}</p>
                                  <p className="text-xs text-slate-500">{s.contact || 'No Contact'}</p>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                  <div>
                                      <p className="text-xs text-slate-400 font-bold uppercase">Payable</p>
                                      <p className={`font-bold ${s.balance < 0 ? 'text-green-600' : 'text-red-600'}`}>₹{Math.abs(s.balance)}</p>
                                  </div>
                                  <button 
                                    onClick={() => setTransactionModal({
                                        type: 'SUPPLIER', id: s.id, name: s.name, currentBalance: s.balance, amount: '', mode: 'PAYMENT_MADE'
                                    })}
                                    className="p-1 hover:bg-slate-200 rounded text-xs border bg-white flex items-center"
                                  >
                                      <Wallet className="w-3 h-3 mr-1"/> Manage
                                  </button>
                              </div>
                          </div>
                      ))}
                      {suppliers.length === 0 && <p className="text-center text-slate-400 text-sm">No Suppliers</p>}
                  </div>
              </div>

              {/* Customers */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center"><Users className="mr-2 w-5 h-5"/> Customer Credit</h3>
                      <button className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded font-bold" onClick={() => {
                           const name = prompt("Customer Name:");
                           const phone = prompt("Phone:");
                           if(name && phone) setCustomers([...customers, { id: `cust-${Date.now()}`, name, phone, balance: 0 }]);
                      }}>+ Add</button>
                  </div>
                  <div className="space-y-3">
                      {customers.map(c => (
                          <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                              <div>
                                  <p className="font-bold text-sm">{c.name}</p>
                                  <p className="text-xs text-slate-500">{c.phone}</p>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                  <div>
                                      <p className="text-xs text-slate-400 font-bold uppercase">Receivable</p>
                                      <p className="font-bold text-red-600">₹{c.balance}</p>
                                  </div>
                                  <button 
                                    onClick={() => setTransactionModal({
                                        type: 'CUSTOMER', id: c.id, name: c.name, currentBalance: c.balance, amount: '', mode: 'PAYMENT_RECEIVED'
                                    })}
                                    className="p-1 hover:bg-slate-200 rounded text-xs border bg-white flex items-center"
                                  >
                                      <Wallet className="w-3 h-3 mr-1"/> Manage
                                  </button>
                              </div>
                          </div>
                      ))}
                       {customers.length === 0 && <p className="text-center text-slate-400 text-sm">No Customers</p>}
                  </div>
              </div>
          </div>
      )}

      {/* LEDGER TRANSACTION MODAL */}
      {transactionModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                  <h3 className="font-bold text-lg mb-2 text-slate-800">
                      {transactionModal.type === 'CUSTOMER' ? 'Customer Transaction' : 'Supplier Transaction'}
                  </h3>
                  <div className="bg-slate-50 p-3 rounded mb-4 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase">{transactionModal.name}</p>
                      <p className={`text-2xl font-bold ${transactionModal.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {transactionModal.type === 'CUSTOMER' ? (transactionModal.currentBalance > 0 ? 'Due: ₹' : 'Credit: ₹') : (transactionModal.currentBalance > 0 ? 'Payable: ₹' : 'Advance: ₹')}
                          {Math.abs(transactionModal.currentBalance)}
                      </p>
                  </div>

                  <div className="mb-4">
                      <div className="flex gap-2 mb-2">
                           <button 
                              onClick={() => setTransactionModal({...transactionModal, mode: transactionModal.type === 'CUSTOMER' ? 'PAYMENT_RECEIVED' : 'PAYMENT_MADE'})}
                              className={`flex-1 py-2 text-xs font-bold rounded border ${
                                  (transactionModal.mode === 'PAYMENT_RECEIVED' || transactionModal.mode === 'PAYMENT_MADE')
                                  ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-500'
                              }`}
                           >
                              {transactionModal.type === 'CUSTOMER' ? 'Receive Payment' : 'Make Payment'}
                           </button>
                           <button 
                              onClick={() => setTransactionModal({...transactionModal, mode: 'ADD_CHARGE'})}
                              className={`flex-1 py-2 text-xs font-bold rounded border ${
                                  transactionModal.mode === 'ADD_CHARGE'
                                  ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500'
                              }`}
                           >
                              {transactionModal.type === 'CUSTOMER' ? 'Add Debit/Charge' : 'Add Credit'}
                           </button>
                      </div>

                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Enter Amount</label>
                      <input 
                        type="number" 
                        className="w-full border p-2 rounded text-lg font-bold"
                        value={transactionModal.amount}
                        onChange={e => setTransactionModal({...transactionModal, amount: e.target.value})}
                        placeholder="0.00"
                        autoFocus
                      />
                  </div>
                  <div className="flex justify-end gap-3">
                      <button onClick={() => setTransactionModal(null)} className="text-slate-500 font-bold text-sm">Cancel</button>
                      <button onClick={handleTransactionSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700">Confirm Transaction</button>
                  </div>
              </div>
          </div>
      )}

      {/* === REPORTS VIEW === */}
      {view === 'REPORTS' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Sales Chart */}
                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                       <h3 className="font-bold text-slate-800 mb-4">Daily Sales Performance</h3>
                       <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={sales.slice(0,10)}>
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
                                   <YAxis />
                                   <Tooltip labelFormatter={(d) => new Date(d).toLocaleString()} />
                                   <Bar dataKey="roundedTotal" fill="#10b981" name="Sales (₹)" />
                               </BarChart>
                           </ResponsiveContainer>
                       </div>
                   </div>

                   {/* P&L & GST Estimates */}
                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4">Financial Overview</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between p-3 bg-slate-50 rounded">
                                <span>Total Revenue</span>
                                <span className="font-bold text-green-600">₹{totalSales}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-red-50 rounded border border-red-100">
                                <span>Returns & Refunds</span>
                                <span className="font-bold text-red-600">- ₹{totalReturns}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-indigo-50 border border-indigo-100 rounded">
                                <span className="font-bold text-indigo-900">Net Sales</span>
                                <span className="font-bold text-indigo-700">₹{netSales}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-white border border-slate-200 rounded">
                                <span className="font-bold text-slate-600">GST Collected (Est)</span>
                                <span className="font-bold text-slate-800">₹{(netSales * 0.12).toFixed(2)}</span>
                            </div>
                        </div>
                   </div>
              </div>

              {/* SALES HISTORY & RETURNS */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Sales History & Returns</h3>
                  
                  {returnSaleId ? (
                      /* RETURN INTERFACE */
                      <div className="bg-red-50 p-4 rounded border border-red-100">
                          <h4 className="font-bold text-red-800 mb-2 flex items-center"><RotateCcw className="w-4 h-4 mr-2"/> Process Return: {sales.find(s => s.id === returnSaleId)?.invoiceNumber}</h4>
                          <table className="w-full text-sm mb-4">
                              <thead>
                                  <tr>
                                      <th className="text-left">Item</th>
                                      <th className="text-right">Sold Qty</th>
                                      <th className="text-right">Price</th>
                                      <th className="text-right">Return Qty</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {returnItems.map((r, i) => (
                                      <tr key={i}>
                                          <td>{r.item.name}</td>
                                          <td className="text-right">{r.item.quantity}</td>
                                          <td className="text-right">{r.item.mrp}</td>
                                          <td className="text-right">
                                              <input 
                                                type="number"
                                                className="w-16 border rounded p-1 text-right"
                                                min={0}
                                                max={r.item.quantity}
                                                value={r.returnQty}
                                                onChange={(e) => {
                                                    const val = Math.min(parseInt(e.target.value)||0, r.item.quantity);
                                                    const newItems = [...returnItems];
                                                    newItems[i].returnQty = val;
                                                    setReturnItems(newItems);
                                                }}
                                              />
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          <div className="flex justify-end gap-3">
                              <button onClick={() => {setReturnSaleId(''); setReturnItems([]);}} className="text-slate-500 font-bold text-xs">Cancel</button>
                              <button 
                                onClick={() => processReturn(sales.find(s => s.id === returnSaleId)!)}
                                className="bg-red-600 text-white px-4 py-2 rounded font-bold text-xs hover:bg-red-700"
                              >
                                  Confirm Return & Refund
                              </button>
                          </div>
                      </div>
                  ) : (
                      /* SALES TABLE */
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-2 text-left">Invoice</th>
                                    <th className="p-2 text-left">Date</th>
                                    <th className="p-2 text-left">Customer</th>
                                    <th className="p-2 text-right">Total</th>
                                    <th className="p-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(s => (
                                    <tr key={s.id} className="border-b hover:bg-slate-50">
                                        <td className="p-2">{s.invoiceNumber}</td>
                                        <td className="p-2">{new Date(s.date).toLocaleDateString()}</td>
                                        <td className="p-2">{s.customerName}</td>
                                        <td className="p-2 text-right">₹{s.roundedTotal}</td>
                                        <td className="p-2 text-right">
                                            <button 
                                                onClick={() => initiateReturn(s)}
                                                className="text-xs text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded hover:bg-red-100"
                                            >
                                                Return
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* === AI INSIGHTS VIEW === */}
      {view === 'AI' && (
          <div className="animate-in fade-in">
              <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-8 rounded-xl shadow-lg text-white mb-6">
                  <div className="flex items-center mb-4">
                      <BrainCircuit className="w-8 h-8 mr-3 text-purple-300"/>
                      <h2 className="text-2xl font-bold">PharmaAI Intelligence</h2>
                  </div>
                  <p className="text-indigo-200 mb-6">Advanced analytics for inventory optimization and pricing strategy.</p>
                  <button 
                    onClick={fetchInsights}
                    disabled={loadingAi}
                    className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 disabled:opacity-70 flex items-center"
                  >
                      {loadingAi ? 'Analyzing Data...' : 'Generate New Insights'}
                  </button>
              </div>

              {aiInsights && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                          <h3 className="font-bold text-lg mb-4 text-slate-800">Reorder Suggestions</h3>
                          <ul className="space-y-3">
                              {aiInsights.reorderSuggestions.map((s, i) => (
                                  <li key={i} className="flex items-start">
                                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded mr-2 mt-0.5">BUY</span>
                                      <div>
                                          <p className="font-bold text-sm text-slate-800">{s.itemName}</p>
                                          <p className="text-xs text-slate-600">{s.reason}</p>
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                          <h3 className="font-bold text-lg mb-4 text-slate-800">Pricing Opportunities</h3>
                          <ul className="space-y-3">
                              {aiInsights.pricingTips.map((s, i) => (
                                  <li key={i} className="flex items-start">
                                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded mr-2 mt-0.5">TIP</span>
                                      <div>
                                          <p className="font-bold text-sm text-slate-800">{s.itemName}</p>
                                          <p className="text-xs text-slate-600">{s.tip}</p>
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* === PATIENTS VIEW === */}
      {view === 'PATIENTS' && (
          <div className="animate-in fade-in space-y-6">
              {viewingPatient ? (
                   // DETAILED PROFILE VIEW
                   <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right-4">
                      {/* Header with Back Button */}
                      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                              <button onClick={() => setViewingPatient(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                  <ArrowLeft className="w-5 h-5"/>
                              </button>
                              <div>
                                  <h2 className="text-2xl font-bold text-slate-900">{viewingPatient.fullName}</h2>
                                  <p className="text-sm text-slate-500 flex items-center gap-2">
                                      <span>{viewingPatient.gender}, {new Date().getFullYear() - new Date(viewingPatient.dateOfBirth).getFullYear()} Yrs</span>
                                      <span className="px-2 py-0.5 bg-slate-200 rounded text-xs font-mono">{viewingPatient.id}</span>
                                  </p>
                              </div>
                          </div>
                      </div>
                      
                      <div className="p-6 space-y-8">
                          {/* Patient Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Contact Info */}
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center"><Phone className="w-3 h-3 mr-2"/> Contact</h4>
                                   <p className="text-sm font-bold text-slate-900">{viewingPatient.phone}</p>
                                   <p className="text-sm text-slate-600 mt-1">{viewingPatient.address || 'No Address'}</p>
                              </div>
                              
                              {/* Clinical Info */}
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center"><AlertTriangle className="w-3 h-3 mr-2"/> Clinical Alerts</h4>
                                   <div className="space-y-2">
                                       <div>
                                           <span className="text-xs text-slate-400">Allergies:</span>
                                           <div className="flex flex-wrap gap-1 mt-1">
                                               {viewingPatient.allergies.length > 0 ? viewingPatient.allergies.map(a => (
                                                   <span key={a} className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 font-bold">{a}</span>
                                               )) : <span className="text-xs text-slate-500 italic">None</span>}
                                           </div>
                                       </div>
                                       <div>
                                            <span className="text-xs text-slate-400">Conditions:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {viewingPatient.chronicConditions.length > 0 ? viewingPatient.chronicConditions.map(c => (
                                                    <span key={c} className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-bold">{c}</span>
                                                )) : <span className="text-xs text-slate-500 italic">None</span>}
                                            </div>
                                       </div>
                                   </div>
                              </div>

                              {/* Documents */}
                               <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center"><FileText className="w-3 h-3 mr-2"/> Attachments</h4>
                                   {viewingPatient.documents && viewingPatient.documents.length > 0 ? (
                                       <ul className="space-y-1">
                                           {viewingPatient.documents.map((doc, idx) => (
                                               <li key={idx}>
                                                   <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center">
                                                       <FileText className="w-3 h-3 mr-1"/> {doc.name}
                                                   </a>
                                               </li>
                                           ))}
                                       </ul>
                                   ) : <span className="text-xs text-slate-500 italic">No documents attached.</span>}
                              </div>
                          </div>

                          {/* Prescription History */}
                          <div>
                              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                                  <h3 className="font-bold text-slate-800 flex items-center">
                                      <Stethoscope className="w-5 h-5 mr-2 text-indigo-600"/> Prescription History (Rx)
                                  </h3>
                              </div>
                              
                              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                  <table className="min-w-full divide-y divide-slate-200">
                                      <thead className="bg-slate-50">
                                          <tr>
                                              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Doctor / Diagnosis</th>
                                              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Medicines</th>
                                              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                          {prescriptions.filter(rx => rx.patientId === viewingPatient.id || rx.patientName?.toLowerCase() === viewingPatient.fullName.toLowerCase()).map(rx => (
                                              <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                      {new Date(rx.date).toLocaleDateString()}
                                                  </td>
                                                  <td className="px-6 py-4 text-sm text-slate-800">
                                                      <div className="font-bold">Dr. {rx.doctorName}</div>
                                                      <div className="text-xs text-slate-500">{rx.diagnosis}</div>
                                                  </td>
                                                  <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                                                      {rx.medicines.map(m => m.name).join(', ')}
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap">
                                                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                                          rx.status === 'DISPENSED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                          rx.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                          rx.status === 'REJECTED_STOCK' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                          'bg-blue-50 text-blue-700 border-blue-200'
                                                      }`}>
                                                          {rx.status.replace('_', ' ')}
                                                      </span>
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                                      <button onClick={() => setSelectedRx(rx)} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold border border-indigo-100 hover:bg-indigo-50 px-3 py-1.5 rounded">
                                                          View Details
                                                      </button>
                                                  </td>
                                              </tr>
                                          ))}
                                          {prescriptions.filter(rx => rx.patientId === viewingPatient.id || rx.patientName?.toLowerCase() === viewingPatient.fullName.toLowerCase()).length === 0 && (
                                              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No prescriptions found for this patient.</td></tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                   </div>
              ) : (
                  <>
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center"><Users className="mr-2 w-5 h-5 text-indigo-600"/> Patient Directory</h3>
                        <button 
                            onClick={() => {
                                setNewPatientForm({});
                                setLinkedPatient(null);
                                setMatchMode('CREATE');
                                setProcessingRx(null); // Just normal add mode
                            }}
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-teal-700"
                        >
                            <UserPlus className="w-4 h-4 mr-2"/> Add Patient
                        </button>
                    </div>

                    {matchMode === 'CREATE' && !processingRx && (
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-teal-200 animate-in slide-in-from-top-4">
                            <h4 className="font-bold text-teal-800 mb-4 border-b border-teal-100 pb-2">New Patient Registration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input className="border p-2 rounded" placeholder="Full Name *" value={newPatientForm.fullName || ''} onChange={e => setNewPatientForm({...newPatientForm, fullName: e.target.value})} />
                                <input className="border p-2 rounded" placeholder="Phone *" value={newPatientForm.phone || ''} onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})} />
                                <input type="date" className="border p-2 rounded" value={newPatientForm.dateOfBirth || ''} onChange={e => setNewPatientForm({...newPatientForm, dateOfBirth: e.target.value})} />
                                <select className="border p-2 rounded" value={newPatientForm.gender || 'Male'} onChange={e => setNewPatientForm({...newPatientForm, gender: e.target.value as any})}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <textarea className="md:col-span-2 border p-2 rounded" placeholder="Address" value={newPatientForm.address || ''} onChange={e => setNewPatientForm({...newPatientForm, address: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setMatchMode('SEARCH')} className="text-slate-500 font-bold text-sm">Cancel</button>
                                <button onClick={confirmNewPatient} className="bg-teal-600 text-white px-6 py-2 rounded font-bold hover:bg-teal-700">Save Patient</button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {patients.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-slate-500 italic">No patients registered.</div>
                        ) : (
                            patients.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => setViewingPatient(p)}
                                    className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{p.fullName}</h4>
                                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">{p.id}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 flex items-center"><Phone className="w-3 h-3 mr-1 text-slate-400"/> {p.phone}</p>
                                    <p className="text-xs text-slate-500 mt-1">{p.gender}, {new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()} Yrs</p>
                                    <p className="text-xs text-slate-400 mt-2 truncate">{p.address}</p>
                                </div>
                            ))
                        )}
                    </div>
                  </>
              )}
          </div>
      )}
      
      {/* === E-RX VIEW === */}
      {view === 'ERX' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex bg-slate-100 p-1 rounded-lg w-max border border-slate-200">
                  <button onClick={() => setErxTab('QUEUE')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${erxTab === 'QUEUE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      Pending Queue ({queue.length})
                  </button>
                  <button onClick={() => setErxTab('HISTORY')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${erxTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      History Log
                  </button>
              </div>

              {erxTab === 'QUEUE' && (
                  <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Patient Details</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Medicines (Rx)</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {queue.map((rx) => (
                                <tr key={rx.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(rx.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm font-bold text-slate-900">{rx.patientName}</p>
                                        <p className="text-xs text-slate-500">{rx.patientAge}Y / {rx.patientGender}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        <div className="font-medium">Dr. {rx.doctorName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                                        {rx.medicines.map(m => m.name).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleStartProcessing(rx)}
                                            className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded shadow-sm transition-colors flex items-center ml-auto"
                                        >
                                            Process Rx <ArrowRight className="w-4 h-4 ml-1"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {queue.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500 italic">No pending prescriptions.</td>
                                </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                  </div>
              )}
              
              {erxTab === 'HISTORY' && (
                  <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Rx ID</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date Processed</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Patient</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Items</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">View</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                              {history.map(rx => (
                                  <tr key={rx.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{rx.id}</td>
                                      <td className="px-6 py-4 text-sm text-slate-700">{new Date(rx.date).toLocaleDateString()}</td>
                                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{rx.patientName}</td>
                                      <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">{rx.medicines.map(m=>m.name).join(', ')}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                              rx.status === 'DISPENSED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                              rx.status === 'REJECTED_STOCK' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                              'bg-red-50 text-red-700 border-red-200'
                                          }`}>
                                              {rx.status.replace('_', ' ')}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => setSelectedRx(rx)} className="text-indigo-600 hover:underline text-xs font-bold">Details</button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      )}

      {/* RX PROCESSING MODAL */}
      {processingRx && (
          <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="text-white font-bold text-lg flex items-center"><FileText className="w-5 h-5 mr-2"/> Processing Prescription</h3>
                          <p className="text-indigo-300 text-xs font-mono">{processingRx.id}</p>
                      </div>
                      <button onClick={() => setProcessingRx(null)} className="text-white/70 hover:text-white"><X className="w-6 h-6"/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Rx Details */}
                      <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Doctor Details</h4>
                              <p className="font-bold text-slate-900">Dr. {processingRx.doctorName}</p>
                              <p className="text-xs text-slate-500">{processingRx.doctorDetails?.clinicName}</p>
                              
                              <h4 className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Incoming Patient Info</h4>
                              <div className="bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                                  <p><span className="font-bold">Name:</span> {processingRx.patientName}</p>
                                  <p><span className="font-bold">Age/Sex:</span> {processingRx.patientAge} / {processingRx.patientGender}</p>
                                  <p className="text-xs text-red-500 mt-1"><span className="font-bold">Rx Diagnosis:</span> {processingRx.diagnosis}</p>
                              </div>
                          </div>

                          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                               <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Prescribed Medicines</h4>
                               <div className="space-y-2">
                                   {processingRx.medicines.map((m, i) => (
                                       <div key={i} className="flex justify-between items-center p-2 bg-indigo-50/50 rounded border border-indigo-100">
                                           <div>
                                               <p className="font-bold text-sm text-indigo-900">{m.name}</p>
                                               <p className="text-xs text-slate-500">{m.dosage} • {m.frequency} • {m.duration}</p>
                                           </div>
                                           {inventory.find(inv => inv.name.toLowerCase() === m.name.toLowerCase() && inv.stock > 0) ? (
                                               <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold border border-green-200">In Stock</span>
                                           ) : (
                                               <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold border border-red-200">Check Stock</span>
                                           )}
                                       </div>
                                   ))}
                               </div>
                          </div>
                      </div>

                      {/* Right: Patient Link & Actions */}
                      <div className="space-y-4 flex flex-col">
                          {/* Step 1: Link Patient */}
                          <div className={`bg-white p-5 rounded-lg border-2 ${linkedPatient ? 'border-green-500' : 'border-indigo-200'} shadow-sm transition-colors`}>
                              <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-bold text-slate-800 flex items-center">
                                      {linkedPatient ? <UserCheck className="w-5 h-5 mr-2 text-green-600"/> : <UserPlus className="w-5 h-5 mr-2 text-indigo-600"/>}
                                      {linkedPatient ? 'Patient Linked' : 'Link Patient Profile'}
                                  </h4>
                                  {linkedPatient && (
                                      <button onClick={() => { setLinkedPatient(null); setMatchMode('SEARCH'); }} className="text-xs text-red-500 hover:underline">Change</button>
                                  )}
                              </div>
                              
                              {linkedPatient ? (
                                  <div className="bg-green-50 p-3 rounded border border-green-100">
                                      <p className="font-bold text-green-900">{linkedPatient.fullName}</p>
                                      <p className="text-xs text-green-700">{linkedPatient.phone} • {linkedPatient.id}</p>
                                  </div>
                              ) : (
                                  <>
                                      {matchMode === 'SEARCH' ? (
                                          <div className="space-y-3">
                                              <p className="text-xs text-slate-500">Search existing DB or create new profile from Rx data.</p>
                                              <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-50 p-2 rounded border border-slate-100 mb-2">
                                                  {patients.filter(p => p.fullName.toLowerCase().includes(processingRx.patientName.toLowerCase())).map(p => (
                                                      <button key={p.id} onClick={() => setLinkedPatient(p)} className="w-full text-left text-xs p-2 hover:bg-white rounded border border-transparent hover:border-slate-200 flex justify-between">
                                                          <span className="font-bold">{p.fullName}</span>
                                                          <span>{p.phone}</span>
                                                      </button>
                                                  ))}
                                                  {patients.filter(p => p.fullName.toLowerCase().includes(processingRx.patientName.toLowerCase())).length === 0 && (
                                                      <p className="text-xs text-slate-400 text-center py-2">No direct name matches found.</p>
                                                  )}
                                              </div>
                                              <button onClick={() => setMatchMode('CREATE')} className="w-full bg-indigo-100 text-indigo-700 py-2 rounded font-bold text-xs hover:bg-indigo-200">
                                                  Create New Profile (Auto-fill)
                                              </button>
                                          </div>
                                      ) : (
                                          <div className="space-y-2 animate-in fade-in">
                                              <input className="w-full border p-2 rounded text-sm" placeholder="Full Name" value={newPatientForm.fullName} onChange={e => setNewPatientForm({...newPatientForm, fullName: e.target.value})} />
                                              <input className="w-full border p-2 rounded text-sm" placeholder="Phone" value={newPatientForm.phone} onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})} />
                                              <div className="flex gap-2">
                                                  <button onClick={() => setMatchMode('SEARCH')} className="flex-1 bg-slate-100 text-slate-600 py-1.5 rounded text-xs font-bold">Back</button>
                                                  <button onClick={confirmNewPatient} className="flex-1 bg-teal-600 text-white py-1.5 rounded text-xs font-bold hover:bg-teal-700">Save & Link</button>
                                              </div>
                                          </div>
                                      )}
                                  </>
                              )}
                          </div>

                          {/* Step 2: Action */}
                          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm mt-auto">
                              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Final Action</h4>
                              <div className="grid grid-cols-1 gap-3">
                                  <button 
                                    onClick={() => finalizeRx('DISPENSED')}
                                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow hover:bg-green-700 flex items-center justify-center disabled:opacity-50"
                                  >
                                      <CheckCircle className="w-5 h-5 mr-2"/> Approve & Dispense
                                  </button>
                                  <div className="grid grid-cols-2 gap-3">
                                      <button onClick={() => finalizeRx('REJECTED_STOCK')} className="bg-orange-100 text-orange-800 py-2 rounded font-bold text-xs hover:bg-orange-200 border border-orange-200">
                                          Mark Out of Stock
                                      </button>
                                      <button onClick={() => finalizeRx('REJECTED')} className="bg-red-100 text-red-800 py-2 rounded font-bold text-xs hover:bg-red-200 border border-red-200">
                                          Reject Rx
                                      </button>
                                  </div>
                              </div>
                              <p className="text-[10px] text-slate-400 text-center mt-3">Status update will be sent to Dr. {processingRx.doctorName} immediately.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {selectedRx && (
          <PrescriptionModal 
            prescription={selectedRx} 
            onClose={() => setSelectedRx(null)} 
            onDispense={(id) => onDispense(id)}
            isPharmacy={true}
          />
      )}
    </div>
  );
};
