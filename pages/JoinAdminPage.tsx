import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { getJoinRequests, updateJoinRequestStatus, deleteJoinRequest } from '../services/joinService';
import ThemeToggle from '../components/ThemeToggle';
import AdminLoginPage from './AdminLoginPage';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import RichTextEditor from '../components/admin/RichTextEditor';
import FormInput from '../components/admin/FormInput';
import AdminEditModal from '../components/admin/AdminEditModal';
import { JoinContent, PaymentMethod, IdCardConfig, JoinRequest, IdCardField } from '../types';

// Default ID Card Configuration
const DEFAULT_ID_CONFIG: IdCardConfig = {
    backgroundImageUrl: "",
    width: 85, 
    height: 55,
    fields: {
        name: { x: 42, y: 25, fontSize: 12, color: "#000000", align: "center", fontWeight: 'bold' },
        id: { x: 42, y: 35, fontSize: 10, color: "#000000", align: "center" },
        roll: { x: 42, y: 40, fontSize: 10, color: "#000000", align: "center" },
        phone: { x: 42, y: 45, fontSize: 8, color: "#000000", align: "center" },
        blood_group: { x: 42, y: 50, fontSize: 8, color: "#000000", align: "center" },
        photo: { x: 10, y: 10, width: 20, height: 20 }
    }
};

const ALL_AVAILABLE_FIELDS = ['name', 'id', 'roll', 'phone', 'blood_group', 'photo'];

const getEnv = (key: string) => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        // @ts-ignore
        return process.env[key];
    }
    return '';
};

// --- DRAGGABLE EDITOR COMPONENTS ---

const FieldPreview: React.FC<{
    field: string;
    config: any;
    scale: number;
    isSelected: boolean;
    hasCustomFont: boolean;
    onMouseDown: (e: React.MouseEvent, field: string) => void;
}> = ({ field, config, scale, isSelected, hasCustomFont, onMouseDown }) => {
    
    if (field === 'photo') {
        const style: React.CSSProperties = {
            position: 'absolute',
            left: `${config.x * scale}px`,
            top: `${config.y * scale}px`,
            width: `${config.width * scale}px`,
            height: `${config.height * scale}px`,
            border: isSelected ? '2px solid #3b82f6' : '1px dashed #666',
            backgroundColor: 'rgba(200, 200, 200, 0.3)',
            cursor: 'move',
            zIndex: isSelected ? 10 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px'
        };
        return (
            <div style={style} onMouseDown={(e) => onMouseDown(e, field)}>
                PHOTO
                {isSelected && <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" style={{ transform: 'translate(50%, -50%)' }}></div>}
            </div>
        );
    }

    const textStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${config.x * scale}px`,
        top: `${config.y * scale}px`,
        fontSize: `${config.fontSize * scale * 0.3527}px`, // conversion point (approx for PDF pt to screen px)
        color: config.color,
        fontWeight: config.fontWeight || 'normal',
        fontStyle: config.fontStyle || 'normal',
        textDecoration: config.textDecoration || 'none',
        fontFamily: hasCustomFont ? 'CustomFontPreview' : 'sans-serif', // Use custom font if available
        transform: config.align === 'center' ? 'translateX(-50%)' : config.align === 'right' ? 'translateX(-100%)' : 'none',
        cursor: 'move',
        border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
        whiteSpace: 'nowrap',
        zIndex: isSelected ? 10 : 1,
        userSelect: 'none',
    };

    const placeholders: any = {
        name: '[ [ NAME ] ]',
        id: '[ [ ID ] ]',
        roll: '[ [ ROLL ] ]',
        phone: '[ [ CONTACT ] ]',
        blood_group: '[ [ BLOOD ] ]',
    };

    return (
        <div style={textStyle} onMouseDown={(e) => onMouseDown(e, field)}>
            {placeholders[field] || field.toUpperCase()}
        </div>
    );
};

const JoinAdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    // Requests State
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
    
    // Settings/Content State
    const { data, updateData, loading: loadingData } = useData();
    const [joinContent, setJoinContent] = useState<JoinContent | null>(null);
    const [isSavingContent, setIsSavingContent] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'general' | 'payments' | 'email' | 'id_card'>('general');

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);

    // Editor State
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [dragState, setDragState] = useState<{ field: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    
    // Default zoom to fit roughly in the panel
    const [zoom, setZoom] = useState(3.5); 

    // UI State
    const [activeTab, setActiveTab] = useState<'requests' | 'settings'>('requests');
    const { showToast } = useToast();

    // Fetch Requests
    const fetchRequests = async () => {
        setLoadingRequests(true);
        const data = await getJoinRequests();
        setRequests(data);
        setLoadingRequests(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Sync Data for Settings
    useEffect(() => {
        if (data?.join) {
            const defaultBrevoConfig = {
                apiKey: getEnv('VITE_BREVO_API') || '',
                senderName: 'Dhaka College Cultural Club',
                senderEmail: 'admin@dhakacollegeculturalclub.com'
            };

            setJoinContent({
                ...data.join,
                idCardConfig: data.join.idCardConfig || DEFAULT_ID_CONFIG,
                brevoConfig: {
                    apiKey: data.join.brevoConfig?.apiKey || defaultBrevoConfig.apiKey,
                    senderName: data.join.brevoConfig?.senderName || defaultBrevoConfig.senderName,
                    senderEmail: data.join.brevoConfig?.senderEmail || defaultBrevoConfig.senderEmail,
                },
                currentSessionYear: data.join.currentSessionYear || new Date().getFullYear().toString().slice(-2)
            });
        }
    }, [data]);

    // Live Font Loading Effect
    useEffect(() => {
        if (joinContent?.idCardConfig?.customFontData) {
            try {
                const fontName = 'CustomFontPreview';
                const fontUrl = `data:font/ttf;base64,${joinContent.idCardConfig.customFontData}`;
                const fontFace = new FontFace(fontName, `url(${fontUrl})`);
                
                fontFace.load().then((loadedFace) => {
                    // @ts-ignore
                    document.fonts.add(loadedFace);
                    console.log("Custom font loaded for preview");
                }).catch(err => {
                    console.error("Font loading failed:", err);
                });
            } catch (e) {
                console.error("Error setting up font face:", e);
            }
        }
    }, [joinContent?.idCardConfig?.customFontData]);

    // Request Handlers
    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        if (!id) return;
        try {
            const reqData = requests.find(r => r.id === id);
            await updateJoinRequestStatus({
                id, status, userData: reqData, 
                emailConfig: joinContent?.emailConfig,
                brevoConfig: joinContent?.brevoConfig,
                idCardConfig: joinContent?.idCardConfig,
                sessionYear: joinContent?.currentSessionYear
            });
            showToast(`Request ${status} successfully!`);
            fetchRequests();
            if (selectedRequest?.id === id) setSelectedRequest(prev => prev ? { ...prev, status } : null);
        } catch (error: any) {
            console.error("Error updating status:", error);
            showToast(error.message || "Failed to update status.", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this request?')) return;
        await deleteJoinRequest(id);
        showToast('Request deleted.');
        fetchRequests();
        setSelectedRequest(null);
    };

    // Generic Change Handler for deeply nested objects
    const updateJoinContent = (updates: Partial<JoinContent>) => {
        if (!joinContent) return;
        setJoinContent({ ...joinContent, ...updates });
    };

    // --- Payment Handlers ---
    const handleAddPayment = () => {
        setEditingPayment({
            id: `method-${Date.now()}`,
            name: '',
            number: '',
            accountType: 'Personal',
            instructions: '',
            isActive: true
        });
        setIsPaymentModalOpen(true);
    };

    const handleEditPayment = (method: PaymentMethod) => {
        setEditingPayment({ ...method });
        setIsPaymentModalOpen(true);
    };

    const handleSavePayment = () => {
        if (!editingPayment || !joinContent) return;
        const newMethods = [...(joinContent.paymentMethods || [])];
        const index = newMethods.findIndex(m => m.id === editingPayment.id);
        
        if (index > -1) {
            newMethods[index] = editingPayment;
        } else {
            newMethods.push(editingPayment);
        }
        
        updateJoinContent({ paymentMethods: newMethods });
        setIsPaymentModalOpen(false);
        setEditingPayment(null);
    };

    const handleDeletePayment = (id: string) => {
        if (!joinContent || !confirm('Delete this payment method?')) return;
        const newMethods = joinContent.paymentMethods.filter(m => m.id !== id);
        updateJoinContent({ paymentMethods: newMethods });
    };

    const handleTogglePayment = (id: string) => {
        if (!joinContent) return;
        const newMethods = joinContent.paymentMethods.map(m => 
            m.id === id ? { ...m, isActive: !m.isActive } : m
        );
        updateJoinContent({ paymentMethods: newMethods });
    };

    // --- Editor Handlers ---
    
    const handleCanvasMouseDown = (e: React.MouseEvent, field: string) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Ensure field exists in config, otherwise init
        const currentConfig = joinContent?.idCardConfig;
        if (!currentConfig) return;
        
        let initialPos = { x: 0, y: 0 };
        // @ts-ignore
        const fieldData = currentConfig.fields[field];
        if (fieldData) {
            initialPos = { x: fieldData.x, y: fieldData.y };
        }

        setSelectedField(field);
        setDragState({
            field,
            startX: e.clientX,
            startY: e.clientY,
            initialX: initialPos.x,
            initialY: initialPos.y
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragState || !joinContent?.idCardConfig) return;
        
        const dx = (e.clientX - dragState.startX) / zoom;
        const dy = (e.clientY - dragState.startY) / zoom;
        
        const newX = Math.round(dragState.initialX + dx);
        const newY = Math.round(dragState.initialY + dy);
        
        const currentConfig = joinContent.idCardConfig;
        // @ts-ignore
        const updatedFields = { ...currentConfig.fields, [dragState.field]: { ...currentConfig.fields[dragState.field], x: newX, y: newY } };
        
        setJoinContent({ ...joinContent, idCardConfig: { ...currentConfig, fields: updatedFields } });
    };

    const handleMouseUp = () => {
        setDragState(null);
    };

    const handlePropChange = (key: string, value: any) => {
        if (!selectedField || !joinContent?.idCardConfig) return;
        const currentConfig = joinContent.idCardConfig;
        // @ts-ignore
        const updatedFields = { ...currentConfig.fields, [selectedField]: { ...currentConfig.fields[selectedField], [key]: value } };
        setJoinContent({ ...joinContent, idCardConfig: { ...currentConfig, fields: updatedFields } });
    };

    const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !joinContent?.idCardConfig) return;
        
        if (file.size > 2 * 1024 * 1024) { // 2MB limit for font
            showToast("Font file is too large (max 2MB).", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // result is "data:font/ttf;base64,AAEAAA..."
            const base64 = result.split(',')[1];
            updateJoinContent({ 
                idCardConfig: { 
                    ...joinContent.idCardConfig!, 
                    customFontData: base64,
                    customFontName: file.name
                }
            });
            showToast("Font uploaded successfully!");
        };
        reader.readAsDataURL(file);
    };

    const removeCustomFont = () => {
        if (!joinContent?.idCardConfig) return;
        updateJoinContent({ 
            idCardConfig: { 
                ...joinContent.idCardConfig, 
                customFontData: undefined,
                customFontName: undefined
            }
        });
    };

    const addField = (field: string) => {
        if (!joinContent?.idCardConfig) return;
        const currentConfig = joinContent.idCardConfig;
        
        // Default configs based on type
        const newFieldConfig = field === 'photo' 
            ? { x: 10, y: 10, width: 20, height: 20 }
            : { x: 42, y: 30, fontSize: 12, color: "#000000", align: "center", fontWeight: 'normal' };

        // @ts-ignore
        const updatedFields = { ...currentConfig.fields, [field]: newFieldConfig };
        setJoinContent({ ...joinContent, idCardConfig: { ...currentConfig, fields: updatedFields } });
        setSelectedField(field); // Auto-select new field
    };

    const deleteField = () => {
        if (!selectedField || !joinContent?.idCardConfig) return;
        if (!confirm(`Are you sure you want to remove ${selectedField}?`)) return;

        const currentConfig = joinContent.idCardConfig;
        // @ts-ignore
        const updatedFields = { ...currentConfig.fields };
        // @ts-ignore
        delete updatedFields[selectedField];
        
        setJoinContent({ ...joinContent, idCardConfig: { ...currentConfig, fields: updatedFields } });
        setSelectedField(null);
    };

    const handleAutoFitBackground = () => {
        const url = joinContent?.idCardConfig?.backgroundImageUrl;
        const currentWidth = joinContent?.idCardConfig?.width || 85;
        
        if (!url) {
            showToast("Please enter a background image URL first.", "error");
            return;
        }

        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.onload = () => {
            const aspect = img.height / img.width;
            // Calculate height to match aspect ratio based on fixed width
            const newHeight = Math.round(currentWidth * aspect);
            updateJoinContent({ 
                idCardConfig: { 
                    ...joinContent.idCardConfig, 
                    height: newHeight 
                } as any 
            });
            showToast(`Dimensions updated to ${currentWidth}mm x ${newHeight}mm`);
        };
        img.onerror = () => {
            showToast("Failed to load image for auto-fit. Check URL.", "error");
        };
        img.src = url;
    };

    // Common Settings Handlers
    const handleContentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (joinContent) {
            setIsSavingContent(true);
            await updateData({ join: joinContent });
            setIsSavingContent(false);
            showToast('Settings saved successfully!');
        }
    };

    // Render Helpers
    const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);
    const getRowClass = (status: string) => {
        switch(status) {
            case 'approved': return 'bg-green-100/50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30';
            case 'rejected': return 'bg-red-100/50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30';
            default: return 'hover:bg-black/5 dark:hover:bg-white/5';
        }
    };

    // Get payment method name helper
    const getPaymentMethodName = (id: string) => {
        const method = joinContent?.paymentMethods.find(m => m.id === id);
        return method ? method.name : id;
    };

    return (
        <div className="min-h-screen bg-background text-text-primary p-4 md:p-8" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-card-bg p-4 rounded-xl border border-border-color shadow-sm gap-4">
                <div><h1 className="text-2xl font-bold">Join Admin Panel</h1><p className="text-text-secondary text-sm">Membership & Settings</p></div>
                <div className="flex items-center gap-4"><ThemeToggle /><button onClick={onLogout} className="text-red-500 font-semibold hover:text-red-600">Logout</button></div>
            </header>

            <div className="mb-6 flex space-x-2 border-b border-border-color">
                <button onClick={() => setActiveTab('requests')} className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'requests' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Requests</button>
                <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'settings' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Settings & ID Card</button>
            </div>

            {activeTab === 'requests' && (
                <>
                    <div className="flex flex-wrap gap-4 mb-6">
                        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full capitalize transition-colors ${filter === f ? 'bg-accent text-accent-text font-bold' : 'bg-card-bg text-text-secondary hover:bg-accent/10'}`}>{f}</button>
                        ))}
                    </div>
                    {loadingRequests ? <div className="text-center py-12">Loading requests...</div> : (
                        <div className="bg-card-bg border border-border-color rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="bg-black/5 dark:bg-white/5 border-b border-border-color">
                                        <tr><th className="p-4 font-semibold">Name</th><th className="p-4 font-semibold">ID</th><th className="p-4 font-semibold">Type</th><th className="p-4 font-semibold">Roll</th><th className="p-4 font-semibold">Submitted</th><th className="p-4 font-semibold">Status</th><th className="p-4 font-semibold text-right">Action</th></tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-text-secondary">No requests found.</td></tr> : filteredRequests.map(req => (
                                            <tr key={req.id} className={`border-b border-border-color transition-colors cursor-pointer ${getRowClass(req.status)}`} onClick={() => setSelectedRequest(req)}>
                                                <td className="p-4 font-medium">{req.personal?.name_en || 'Unknown'}<br/><span className="text-xs text-text-secondary font-hind">{req.personal?.name_bn}</span></td>
                                                <td className="p-4 text-sm font-mono font-bold text-accent">{req.assignedId || (req.meta?.reg_type === 'offline' ? req.payment?.dccc_id : 'Pending')}</td>
                                                <td className="p-4 text-sm">
                                                    {req.meta?.reg_type === 'offline' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                            Offline
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                                                Online
                                                            </span>
                                                            <span className="text-xs text-text-secondary mt-1 font-semibold">
                                                                {req.payment?.method ? getPaymentMethodName(req.payment.method) : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-sm">{req.academic?.roll || 'N/A'}</td>
                                                <td className="p-4 text-sm text-text-secondary">{req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : 'N/A'}</td>
                                                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.status === 'approved' ? 'text-green-700 bg-green-100/50' : req.status === 'rejected' ? 'text-red-700 bg-red-100/50' : 'text-yellow-600 bg-yellow-100'}`}>{req.status}</span></td>
                                                <td className="p-4 text-right"><button className="text-accent hover:underline text-sm font-semibold">View</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-7xl mx-auto h-[calc(100vh-200px)]">
                    {loadingData || !joinContent ? <div className="text-center py-12">Loading content...</div> : (
                        <div className="flex flex-col md:flex-row h-full gap-4">
                            <div className="w-full md:w-64 bg-card-bg p-4 rounded-xl border border-border-color flex-shrink-0 overflow-y-auto">
                                <h3 className="font-bold text-lg mb-4 px-2">Settings Menu</h3>
                                <ul className="space-y-1">
                                    <li><button onClick={() => setSettingsTab('general')} className={`w-full text-left px-4 py-2 rounded-lg ${settingsTab === 'general' ? 'bg-accent text-accent-text' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>General</button></li>
                                    <li><button onClick={() => setSettingsTab('payments')} className={`w-full text-left px-4 py-2 rounded-lg ${settingsTab === 'payments' ? 'bg-accent text-accent-text' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>Payments</button></li>
                                    <li><button onClick={() => setSettingsTab('email')} className={`w-full text-left px-4 py-2 rounded-lg ${settingsTab === 'email' ? 'bg-accent text-accent-text' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>Email Configuration</button></li>
                                    <li><button onClick={() => setSettingsTab('id_card')} className={`w-full text-left px-4 py-2 rounded-lg ${settingsTab === 'id_card' ? 'bg-accent text-accent-text' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>ID Card Designer</button></li>
                                </ul>
                            </div>

                            <div className="flex-grow bg-card-bg rounded-xl border border-border-color overflow-hidden flex flex-col">
                                {settingsTab === 'general' && (
                                    <div className="p-8 overflow-y-auto h-full">
                                        <form onSubmit={handleContentSubmit} className="space-y-6 max-w-3xl">
                                            <h2 className="text-xl font-bold">General Configuration</h2>
                                            <FormInput label="Current Session Year (e.g. 25)" name="currentSessionYear" value={joinContent.currentSessionYear || ''} onChange={(e) => updateJoinContent({ currentSessionYear: e.target.value })} />
                                            <FormInput label="Registration Fee Text" name="regFee" value={joinContent.regFee || ''} onChange={(e) => updateJoinContent({ regFee: e.target.value })} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormInput label="Support WhatsApp Link" name="supportWhatsapp" value={joinContent.supportWhatsapp || ''} onChange={(e) => updateJoinContent({ supportWhatsapp: e.target.value })} />
                                                <FormInput label="Support Facebook Link" name="supportFacebook" value={joinContent.supportFacebook || ''} onChange={(e) => updateJoinContent({ supportFacebook: e.target.value })} />
                                            </div>
                                            <RichTextEditor label="Registration Instructions (Step 1)" value={joinContent.description} onChange={(val) => updateJoinContent({ description: val })} />
                                            <div className="pt-4"><button type="submit" disabled={isSavingContent} className="px-8 py-3 bg-accent text-accent-text font-bold rounded-xl shadow-lg hover:bg-accent-hover transition-colors">{isSavingContent ? 'Saving...' : 'Save General Settings'}</button></div>
                                        </form>
                                    </div>
                                )}

                                {settingsTab === 'payments' && (
                                    <div className="p-8 overflow-y-auto h-full">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-xl font-bold">Payment Methods</h2>
                                            <button onClick={handleAddPayment} className="px-4 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover">+ Add Method</button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {joinContent.paymentMethods?.map(method => (
                                                <div key={method.id} className="border border-border-color rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-background/50">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{method.name} <span className="text-sm font-normal text-text-secondary">({method.accountType})</span></h3>
                                                        <p className="text-sm font-mono text-text-secondary">{method.number}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => handleTogglePayment(method.id)} 
                                                            className={`px-3 py-1 text-xs font-bold rounded-full ${method.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                                        >
                                                            {method.isActive ? 'Active' : 'Inactive'}
                                                        </button>
                                                        <button onClick={() => handleEditPayment(method)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">Edit</button>
                                                        <button onClick={() => handleDeletePayment(method.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm">Delete</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!joinContent.paymentMethods || joinContent.paymentMethods.length === 0) && <p className="text-text-secondary text-center py-8">No payment methods added.</p>}
                                        </div>
                                        <div className="pt-6 mt-6 border-t border-border-color">
                                            <button onClick={handleContentSubmit} disabled={isSavingContent} className="px-8 py-3 bg-accent text-accent-text font-bold rounded-xl shadow-lg hover:bg-accent-hover transition-colors">{isSavingContent ? 'Saving...' : 'Save Changes'}</button>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'email' && (
                                    <div className="p-8 overflow-y-auto h-full">
                                        <form onSubmit={handleContentSubmit} className="space-y-6 max-w-3xl">
                                            <h2 className="text-xl font-bold">Email Configuration (Brevo)</h2>
                                            <FormInput label="Brevo API Key" name="apiKey" value={joinContent.brevoConfig?.apiKey || ''} onChange={(e) => updateJoinContent({ brevoConfig: { ...joinContent.brevoConfig, apiKey: e.target.value } as any })} type="password" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormInput label="Sender Name" name="senderName" value={joinContent.brevoConfig?.senderName || ''} onChange={(e) => updateJoinContent({ brevoConfig: { ...joinContent.brevoConfig, senderName: e.target.value } as any })} />
                                                <FormInput label="Sender Email" name="senderEmail" value={joinContent.brevoConfig?.senderEmail || ''} onChange={(e) => updateJoinContent({ brevoConfig: { ...joinContent.brevoConfig, senderEmail: e.target.value } as any })} />
                                            </div>
                                            <div className="border-t border-border-color pt-6 mt-6">
                                                <h3 className="font-bold text-lg mb-4">Email Template</h3>
                                                <FormInput label="Subject" name="subject" value={joinContent.emailConfig?.subject || ''} onChange={(e) => updateJoinContent({ emailConfig: { ...joinContent.emailConfig, subject: e.target.value } as any })} />
                                                <RichTextEditor 
                                                    label="Email Body (Use {{name}}, {{id}}, {{roll}} as placeholders)" 
                                                    value={joinContent.emailConfig?.body || ''} 
                                                    onChange={(val) => updateJoinContent({ emailConfig: { ...joinContent.emailConfig, body: val } as any })} 
                                                />
                                            </div>
                                            <div className="pt-4"><button type="submit" disabled={isSavingContent} className="px-8 py-3 bg-accent text-accent-text font-bold rounded-xl shadow-lg hover:bg-accent-hover transition-colors">{isSavingContent ? 'Saving...' : 'Save Email Settings'}</button></div>
                                        </form>
                                    </div>
                                )}

                                {settingsTab === 'id_card' && (
                                    <div className="flex flex-col h-full">
                                        {/* Editor Toolbar */}
                                        <div className="p-4 border-b border-border-color flex justify-between items-center bg-background/50 backdrop-blur-sm">
                                            <div className="flex items-center gap-4">
                                                <h2 className="font-bold text-lg">ID Card Designer</h2>
                                                <div className="flex items-center gap-2 text-sm bg-background border border-border-color rounded-md px-2 py-1">
                                                    <span>Zoom:</span>
                                                    <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="px-2 hover:bg-black/5">-</button>
                                                    <span>{Math.round(zoom * 100 / 3.5)}%</span>
                                                    <button onClick={() => setZoom(z => z + 0.5)} className="px-2 hover:bg-black/5">+</button>
                                                </div>
                                            </div>
                                            <button onClick={handleContentSubmit} disabled={isSavingContent} className="px-6 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover shadow-sm transition-colors">{isSavingContent ? 'Saving...' : 'Save Layout'}</button>
                                        </div>

                                        <div className="flex flex-grow overflow-hidden">
                                            {/* Canvas Area */}
                                            <div className="flex-grow bg-gray-100 dark:bg-black/40 overflow-auto flex items-center justify-center p-8 relative" onClick={() => setSelectedField(null)}>
                                                <div 
                                                    ref={editorRef}
                                                    className="bg-white shadow-2xl relative transition-all duration-200"
                                                    style={{
                                                        width: `${(joinContent.idCardConfig?.width || 85) * zoom}px`,
                                                        height: `${(joinContent.idCardConfig?.height || 55) * zoom}px`,
                                                        backgroundImage: `url(${joinContent.idCardConfig?.backgroundImageUrl})`,
                                                        backgroundSize: '100% 100%',
                                                        backgroundRepeat: 'no-repeat'
                                                    }}
                                                >
                                                    {ALL_AVAILABLE_FIELDS.map(field => {
                                                        // @ts-ignore
                                                        const conf = joinContent.idCardConfig?.fields[field];
                                                        if (!conf) return null;
                                                        return (
                                                            <FieldPreview 
                                                                key={field} 
                                                                field={field} 
                                                                config={conf} 
                                                                scale={zoom}
                                                                isSelected={selectedField === field}
                                                                onMouseDown={handleCanvasMouseDown}
                                                                hasCustomFont={!!joinContent.idCardConfig?.customFontData}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Properties Panel */}
                                            <div className="w-80 bg-background border-l border-border-color flex flex-col overflow-hidden">
                                                <div className="p-6 overflow-y-auto flex-grow">
                                                    <h3 className="font-bold text-lg mb-6 border-b border-border-color pb-2">Properties</h3>
                                                    
                                                    {selectedField ? (
                                                        <div className="space-y-4 animate-fade-in-up">
                                                            <div className="flex justify-between items-center bg-accent/10 p-2 rounded-lg">
                                                                <span className="text-sm font-bold text-accent uppercase">{selectedField.replace('_', ' ')}</span>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => setSelectedField(null)} className="text-xs px-2 py-1 bg-background border rounded hover:bg-gray-100 dark:hover:bg-white/10" title="Deselect">✕</button>
                                                                    <button onClick={deleteField} className="text-xs px-2 py-1 bg-red-100 text-red-600 border border-red-200 rounded hover:bg-red-200" title="Delete Element">🗑</button>
                                                                </div>
                                                            </div>
                                                            
                                                            {selectedField !== 'photo' && (
                                                                <>
                                                                    <div>
                                                                        <label className="block text-xs text-text-secondary mb-1">Typography</label>
                                                                        <div className="flex gap-2 mb-2">
                                                                            <select 
                                                                                value={(joinContent.idCardConfig?.fields as any)[selectedField].fontWeight || 'normal'} 
                                                                                onChange={(e) => handlePropChange('fontWeight', e.target.value)}
                                                                                className="w-full px-2 py-1 text-sm bg-card-bg border border-border-color rounded-md"
                                                                            >
                                                                                <option value="normal">Normal</option>
                                                                                <option value="bold">Bold</option>
                                                                            </select>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button 
                                                                                onClick={() => handlePropChange('fontStyle', (joinContent.idCardConfig?.fields as any)[selectedField].fontStyle === 'italic' ? 'normal' : 'italic')}
                                                                                className={`flex-1 py-1 border rounded text-sm ${(joinContent.idCardConfig?.fields as any)[selectedField].fontStyle === 'italic' ? 'bg-accent text-white' : 'bg-card-bg'}`}
                                                                            >
                                                                                <span className="italic">I</span>
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handlePropChange('textDecoration', (joinContent.idCardConfig?.fields as any)[selectedField].textDecoration === 'underline' ? 'none' : 'underline')}
                                                                                className={`flex-1 py-1 border rounded text-sm ${(joinContent.idCardConfig?.fields as any)[selectedField].textDecoration === 'underline' ? 'bg-accent text-white' : 'bg-card-bg'}`}
                                                                            >
                                                                                <span className="underline">U</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <label className="block text-xs text-text-secondary mb-1">Size (pt)</label>
                                                                            <input type="number" value={(joinContent.idCardConfig?.fields as any)[selectedField].fontSize} onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value))} className="w-full px-2 py-1 text-sm bg-card-bg border rounded-md" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-text-secondary mb-1">Color</label>
                                                                            <div className="flex gap-2">
                                                                                <input type="color" value={(joinContent.idCardConfig?.fields as any)[selectedField].color} onChange={(e) => handlePropChange('color', e.target.value)} className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer" />
                                                                                <input type="text" value={(joinContent.idCardConfig?.fields as any)[selectedField].color} onChange={(e) => handlePropChange('color', e.target.value)} className="w-full px-2 py-1 text-xs bg-card-bg border rounded-md" />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-xs text-text-secondary mb-1">Alignment</label>
                                                                        <div className="flex border border-border-color rounded-md overflow-hidden">
                                                                            {['left', 'center', 'right'].map(align => (
                                                                                <button 
                                                                                    key={align} 
                                                                                    onClick={() => handlePropChange('align', align)}
                                                                                    className={`flex-1 py-1 text-xs capitalize ${(joinContent.idCardConfig?.fields as any)[selectedField].align === align ? 'bg-accent text-white' : 'bg-card-bg hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                                                >
                                                                                    {align}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}

                                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-color">
                                                                <div>
                                                                    <label className="text-xs text-text-secondary">X (mm)</label>
                                                                    <input type="number" value={(joinContent.idCardConfig?.fields as any)[selectedField].x} onChange={(e) => handlePropChange('x', parseInt(e.target.value))} className="w-full px-2 py-1 text-sm bg-card-bg border rounded-md" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs text-text-secondary">Y (mm)</label>
                                                                    <input type="number" value={(joinContent.idCardConfig?.fields as any)[selectedField].y} onChange={(e) => handlePropChange('y', parseInt(e.target.value))} className="w-full px-2 py-1 text-sm bg-card-bg border rounded-md" />
                                                                </div>
                                                                {selectedField === 'photo' && (
                                                                    <>
                                                                        <div>
                                                                            <label className="text-xs text-text-secondary">W (mm)</label>
                                                                            <input type="number" value={(joinContent.idCardConfig?.fields as any)[selectedField].width} onChange={(e) => handlePropChange('width', parseInt(e.target.value))} className="w-full px-2 py-1 text-sm bg-card-bg border rounded-md" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs text-text-secondary">H (mm)</label>
                                                                            <input type="number" value={(joinContent.idCardConfig?.fields as any)[selectedField].height} onChange={(e) => handlePropChange('height', parseInt(e.target.value))} className="w-full px-2 py-1 text-sm bg-card-bg border rounded-md" />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            <div className="mb-6">
                                                                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Background Image</label>
                                                                <div className="flex gap-2 mb-2">
                                                                    <input 
                                                                        type="text" 
                                                                        value={joinContent.idCardConfig?.backgroundImageUrl || ''} 
                                                                        onChange={(e) => updateJoinContent({ idCardConfig: { ...joinContent.idCardConfig, backgroundImageUrl: e.target.value } as any })}
                                                                        className="flex-grow px-3 py-2 text-sm bg-card-bg border border-border-color rounded-md"
                                                                        placeholder="Image URL"
                                                                    />
                                                                    <button 
                                                                        onClick={handleAutoFitBackground}
                                                                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-xs font-bold hover:bg-blue-200"
                                                                        title="Auto-calculate height based on image aspect ratio"
                                                                    >
                                                                        Auto-Fit
                                                                    </button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="text-xs text-text-secondary">W (mm)</label>
                                                                        <input type="number" value={joinContent.idCardConfig?.width} onChange={(e) => updateJoinContent({ idCardConfig: { ...joinContent.idCardConfig, width: parseInt(e.target.value) } as any })} className="w-full px-2 py-1 text-sm bg-card-bg border rounded-md" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs text-text-secondary">H (mm)</label>
                                                                        <input type="number" value={joinContent.idCardConfig?.height} onChange={(e) => updateJoinContent({ idCardConfig: { ...joinContent.idCardConfig, height: parseInt(e.target.value) } as any })} className="w-full px-2 py-1 text-sm bg-card-bg border rounded-md" />
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Font Upload Section */}
                                                                <div className="mt-4 pt-4 border-t border-border-color">
                                                                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Custom Font (TTF)</label>
                                                                    <input 
                                                                        type="file" 
                                                                        accept=".ttf,.otf"
                                                                        onChange={handleFontUpload}
                                                                        className="w-full text-xs text-text-secondary file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                                                                    />
                                                                    {joinContent.idCardConfig?.customFontName && (
                                                                        <div className="flex justify-between items-center mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                                                            <span className="text-xs text-green-600 dark:text-green-400 truncate max-w-[150px]" title={joinContent.idCardConfig.customFontName}>
                                                                                Active: {joinContent.idCardConfig.customFontName}
                                                                            </span>
                                                                            <button onClick={removeCustomFont} className="text-xs text-red-500 hover:text-red-700 font-bold">Remove</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="border-t border-border-color pt-4">
                                                                <h4 className="font-bold text-sm mb-3">Layers</h4>
                                                                <div className="space-y-2">
                                                                    {ALL_AVAILABLE_FIELDS.map(field => {
                                                                        // @ts-ignore
                                                                        const isActive = !!joinContent.idCardConfig?.fields[field];
                                                                        return (
                                                                            <div key={field} className="flex items-center justify-between p-2 rounded-md bg-card-bg border border-border-color hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                                                <span className="text-sm capitalize">{field.replace('_', ' ')}</span>
                                                                                {isActive ? (
                                                                                    <button onClick={() => setSelectedField(field)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Select</button>
                                                                                ) : (
                                                                                    <button onClick={() => addField(field)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">+ Add</button>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Payment Method Modal */}
            <AdminEditModal 
                isOpen={isPaymentModalOpen} 
                onClose={() => setIsPaymentModalOpen(false)} 
                onSave={handleSavePayment}
                title={editingPayment?.id ? "Edit Payment Method" : "Add Payment Method"}
            >
                {editingPayment && (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                        <FormInput label="Name (e.g. bKash)" name="name" value={editingPayment.name} onChange={(e) => setEditingPayment({...editingPayment, name: e.target.value})} required />
                        <FormInput label="Number" name="number" value={editingPayment.number} onChange={(e) => setEditingPayment({...editingPayment, number: e.target.value})} required />
                        <FormInput label="Account Type" name="accountType" type="select" value={editingPayment.accountType} onChange={(e) => setEditingPayment({...editingPayment, accountType: e.target.value})} required>
                            <option value="Personal">Personal</option>
                            <option value="Merchant">Merchant</option>
                            <option value="Agent">Agent</option>
                        </FormInput>
                        <RichTextEditor label="Instructions" value={editingPayment.instructions} onChange={(val) => setEditingPayment({...editingPayment, instructions: val})} />
                        <FormInput label="Logo URL (Optional)" name="imageUrl" value={editingPayment.imageUrl || ''} onChange={(e) => setEditingPayment({...editingPayment, imageUrl: e.target.value})} />
                        <FormInput label="Video Tutorial URL (Optional)" name="videoUrl" value={editingPayment.videoUrl || ''} onChange={(e) => setEditingPayment({...editingPayment, videoUrl: e.target.value})} />
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isActive" checked={editingPayment.isActive} onChange={(e) => setEditingPayment({...editingPayment, isActive: e.target.checked})} className="w-4 h-4 text-accent" />
                            <label htmlFor="isActive" className="text-sm font-medium">Active (Visible to users)</label>
                        </div>
                    </div>
                )}
            </AdminEditModal>

            {/* Request Detail Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up" style={{animationDuration: '300ms'}} onClick={() => setSelectedRequest(null)}>
                    <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-6 relative border border-border-color" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedRequest(null)} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/10 rounded-full p-1">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <div className="flex justify-between items-start mb-6 pr-8">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedRequest.personal.name_en}</h2>
                                <p className="text-text-secondary font-hind">{selectedRequest.personal.name_bn}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
                                selectedRequest.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                selectedRequest.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {selectedRequest.status}
                            </span>
                        </div>

                        {/* Image */}
                        {selectedRequest.personal.image_url && (
                            <div className="mb-6 flex justify-center">
                                <img src={selectedRequest.personal.image_url} alt="Applicant" className="h-32 w-32 object-cover rounded-lg border-4 border-border-color shadow-sm" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            {/* Personal */}
                            <div className="space-y-2 bg-card-bg p-4 rounded-lg border border-border-color">
                                <h3 className="font-bold border-b border-border-color pb-1 mb-2 text-accent">Personal Info</h3>
                                <p><span className="text-text-secondary">Father:</span> {selectedRequest.personal.father_name}</p>
                                <p><span className="text-text-secondary">Mother:</span> {selectedRequest.personal.mother_name}</p>
                                <p><span className="text-text-secondary">DOB:</span> {selectedRequest.personal.dob}</p>
                                <p><span className="text-text-secondary">Gender:</span> {selectedRequest.personal.gender}</p>
                            </div>

                            {/* Contact */}
                            <div className="space-y-2 bg-card-bg p-4 rounded-lg border border-border-color">
                                <h3 className="font-bold border-b border-border-color pb-1 mb-2 text-accent">Contact Info</h3>
                                <p><span className="text-text-secondary">Email:</span> {selectedRequest.personal.email}</p>
                                <p><span className="text-text-secondary">Phone:</span> {selectedRequest.contact.phone}</p>
                                <p><span className="text-text-secondary">WhatsApp:</span> {selectedRequest.contact.whatsapp}</p>
                                <p><span className="text-text-secondary">Facebook:</span> <a href={selectedRequest.socials.facebook} target="_blank" rel="noreferrer" className="text-accent hover:underline">Link</a></p>
                            </div>

                            {/* Academic */}
                            <div className="space-y-2 bg-card-bg p-4 rounded-lg border border-border-color">
                                <h3 className="font-bold border-b border-border-color pb-1 mb-2 text-accent">Academic Info</h3>
                                <p><span className="text-text-secondary">Roll:</span> {selectedRequest.academic.roll}</p>
                                <p><span className="text-text-secondary">Section:</span> {selectedRequest.academic.section}</p>
                                <p><span className="text-text-secondary">Blood Group:</span> {selectedRequest.academic.blood_group}</p>
                                <p><span className="text-text-secondary">Prev Institute:</span> {selectedRequest.academic.prev_institute}</p>
                            </div>

                            {/* Preferences & Payment */}
                            <div className="space-y-2 bg-card-bg p-4 rounded-lg border border-border-color">
                                <h3 className="font-bold border-b border-border-color pb-1 mb-2 text-accent">Registration</h3>
                                <p><span className="text-text-secondary">Type:</span> {selectedRequest.meta?.reg_type === 'offline' ? 'Offline' : 'Online'}</p>
                                {selectedRequest.meta?.reg_type === 'offline' ? (
                                    <>
                                        <p><span className="text-text-secondary">DCCC ID:</span> <span className="font-mono font-semibold">{selectedRequest.payment?.dccc_id}</span></p>
                                        <p><span className="text-text-secondary">Booth:</span> {selectedRequest.personal.booth}</p>
                                    </>
                                ) : (
                                    <>
                                        <p><span className="text-text-secondary">Method:</span> {selectedRequest.payment?.method ? getPaymentMethodName(selectedRequest.payment.method) : selectedRequest.payment?.method}</p>
                                        <p><span className="text-text-secondary">Trx ID:</span> <span className="font-mono font-semibold">{selectedRequest.payment?.trx_id}</span></p>
                                    </>
                                )}
                                <p><span className="text-text-secondary">1st Choice:</span> {selectedRequest.preferences.first_choice}</p>
                                <p><span className="text-text-secondary">2nd Choice:</span> {selectedRequest.preferences.second_choice}</p>
                            </div>
                        </div>
                        
                        {(selectedRequest.preferences.reason || selectedRequest.skills.skills) && (
                            <div className="mt-6 bg-card-bg p-4 rounded-lg border border-border-color text-sm">
                                <h3 className="font-bold border-b border-border-color pb-1 mb-2 text-accent">Additional Info</h3>
                                {selectedRequest.preferences.reason && <p className="mb-2"><span className="text-text-secondary font-semibold block">Reason for joining:</span> {selectedRequest.preferences.reason}</p>}
                                {selectedRequest.skills.skills && <p><span className="text-text-secondary font-semibold block">Skills:</span> {selectedRequest.skills.skills}</p>}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-8 flex flex-wrap gap-4 justify-end border-t border-border-color pt-6">
                            {selectedRequest.status === 'pending' && (
                                <>
                                    <button onClick={() => handleStatusUpdate(selectedRequest.id!, 'approved')} className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-md">Approve</button>
                                    <button onClick={() => handleStatusUpdate(selectedRequest.id!, 'rejected')} className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors shadow-md">Reject</button>
                                </>
                            )}
                            <button onClick={() => handleDelete(selectedRequest.id!)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-text-primary font-bold rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors">Delete Request</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const JoinAdminPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((firebaseUser: any) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    if (auth) {
        auth.signOut().catch((error: any) => console.error("Logout failed:", error));
    }
  };
  
  if (loading) {
      return <div className="text-center p-12 min-h-screen flex items-center justify-center">Loading Join Admin...</div>;
  }

  if (!user) {
    return <AdminLoginPage />;
  }

  return <JoinAdminDashboard onLogout={handleLogout} />;
};

export default JoinAdminPage;