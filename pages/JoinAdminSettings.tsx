import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import RichTextEditor from '../components/admin/RichTextEditor';
import FormInput from '../components/admin/FormInput';
import ImageInput from '../components/admin/ImageInput';
import AdminEditModal from '../components/admin/AdminEditModal';
import { JoinContent, PaymentMethod, IdCardConfig } from '../types';
import { auth } from '../services/firebase';
import { Sliders, RefreshCw, Layers, Settings, FileText, CheckCircle, Trash2, X, Plus, Mail, Send, AlertTriangle } from 'lucide-react';

const ALL_AVAILABLE_FIELDS = ['name', 'name_bn', 'id', 'roll', 'section', 'session', 'phone', 'blood_group', 'photo'];

const FieldPreview: React.FC<{
    field: string;
    config: any;
    scale: number;
    isSelected: boolean;
    hasCustomFont: boolean;
    onMouseDown: (e: React.MouseEvent, field: string) => void;
    onTouchStart: (e: React.TouchEvent, field: string) => void;
}> = ({ field, config, scale, isSelected, hasCustomFont, onMouseDown, onTouchStart }) => {
    
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
            <div 
                style={style} 
                onMouseDown={(e) => onMouseDown(e, field)}
                onTouchStart={(e) => onTouchStart(e, field)}
            >
                PHOTO
                {isSelected && <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" style={{ transform: 'translate(50%, -50%)' }}></div>}
            </div>
        );
    }

    const textStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${config.x * scale}px`,
        top: `${config.y * scale}px`,
        fontSize: `${config.fontSize * scale * 0.3527}px`, // conversion point
        lineHeight: 1,
        color: config.color,
        fontWeight: config.fontWeight || 'normal',
        fontStyle: config.fontStyle || 'normal',
        textDecoration: config.textDecoration || 'none',
        fontFamily: hasCustomFont ? 'CustomFontPreview' : 'sans-serif',
        transform: config.align === 'center' ? 'translateX(-50%)' : config.align === 'right' ? 'translateX(-100%)' : 'none',
        cursor: 'move',
        border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
        whiteSpace: 'nowrap',
        zIndex: isSelected ? 10 : 1,
        userSelect: 'none',
    };

    const placeholders: any = {
        name: '[ [ FULL NAME (EN) ] ]',
        name_bn: '[ [ পূর্ণ নাম (বাংলা) ] ]',
        id: '[ [ MEMBER ID ] ]',
        roll: '[ [ CLASS ROLL ] ]',
        section: '[ [ SECTION / GROUP ] ]',
        session: '[ [ SESSION YEAR ] ]',
        phone: '[ [ PHONE NUMBER ] ]',
        blood_group: '[ [ BLOOD GROUP ] ]',
    };

    return (
        <div 
            style={textStyle} 
            onMouseDown={(e) => onMouseDown(e, field)}
            onTouchStart={(e) => onTouchStart(e, field)}
        >
            {placeholders[field] || field.toUpperCase()}
        </div>
    );
};

const JoinAdminSettings: React.FC = () => {
    const { data, updateData, loading: loadingData } = useData();
    const { showToast } = useToast();
    
    const [joinContent, setJoinContent] = useState<JoinContent | null>(null);
    const [isSavingContent, setIsSavingContent] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'general' | 'payments' | 'email' | 'id_card'>('general');

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);

    // Designer State
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [dragState, setDragState] = useState<{ field: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
    const [designerMobileTab, setDesignerMobileTab] = useState<'bg' | 'layers' | 'properties'>('bg');
    const [zoom, setZoom] = useState(3.5); 
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (data?.join) {
            setJoinContent(JSON.parse(JSON.stringify(data.join)));
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

    const updateJoinContent = (updates: Partial<JoinContent>) => {
        if (!joinContent) return;
        setJoinContent({ ...joinContent, ...updates });
    };

    // Test Email System State
    const [testRecipient, setTestRecipient] = useState('');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Default test recipient setup
    useEffect(() => {
        if (auth?.currentUser?.email) {
            setTestRecipient(auth.currentUser.email);
        } else {
            setTestRecipient('dccc.webmail@gmail.com');
        }
    }, [settingsTab]);

    const handleSendTestEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testRecipient.trim()) {
            showToast("Please enter a recipient email.", "error");
            return;
        }

        const apiKey = joinContent?.resendConfig?.apiKey;
        const senderEmail = joinContent?.resendConfig?.senderEmail;
        const senderName = joinContent?.resendConfig?.senderName;

        if (!senderEmail) {
            showToast("Please fill out the Sender Email first.", "error");
            return;
        }

        setIsSendingTest(true);
        setTestResult(null);

        try {
            const fromHeader = senderName ? `${senderName} <${senderEmail}>` : senderEmail;
            
            console.log("Sending test email to:", testRecipient, "from:", fromHeader);
            const payload = {
                to: testRecipient,
                from: fromHeader,
                subject: "DCCC Resend Email System Test Connection",
                html: `
                    <div style="font-family: sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="https://ik.imagekit.io/dccc/dccc-logo.png" alt="DCCC Logo" style="height: 60px; width: auto;" />
                        </div>
                        <h2 style="color: #3b82f6; margin-top: 0; text-align: center; font-size: 22px; font-weight: 800;">Connection Successful! 🎉</h2>
                        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Hello,</p>
                        <p style="font-size: 15px; line-height: 1.6; color: #475569;">This is a successful automated test email from your <strong>Dhaka College Cultural Club (DCCC)</strong> Admin Panel.</p>
                        <p style="font-size: 15px; line-height: 1.6; color: #475569;">If you are reading this message, it means your Resend API integration, sender address setup, and email routing are <strong>working perfectly!</strong></p>
                        
                        <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 13px; color: #334155; border: 1px solid #cbd5e1;">
                            <strong>Configuration Details:</strong><br/>
                            • Sender Address: ${fromHeader}<br/>
                            • Recipient: ${testRecipient}<br/>
                            • API Key Source: ${apiKey ? "Manually Entered / Form State" : "Vercel Environment Variable (Server)"}
                        </div>
                        
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">Dhaka College Cultural Club • Membership Control Center</p>
                    </div>
                `,
                resendApiKey: apiKey || undefined
            };

            let responseData: any = null;
            let sendSuccess = false;

            // 1. Try server proxy first
            try {
                const response = await fetch('/api/email/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                const rawText = await response.text().catch(() => '');
                try { responseData = JSON.parse(rawText); } catch {}

                if (response.ok && responseData && !responseData.error) {
                    sendSuccess = true;
                } else if (responseData && responseData.error) {
                    throw new Error(responseData.error);
                } else {
                    throw new Error(`Server endpoint returned status ${response.status}`);
                }
            } catch (proxyError: any) {
                console.warn("Server proxy test email failed, checking client fallback:", proxyError.message);

                // 2. Direct client Resend API call fallback if API key is provided
                const directKey = (apiKey || '').trim();
                if (directKey) {
                    console.log("Attempting direct client-side test email call to Resend...");
                    const resendDirectRes = await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${directKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            from: fromHeader,
                            to: [testRecipient],
                            subject: payload.subject,
                            html: payload.html
                        })
                    });

                    const directText = await resendDirectRes.text().catch(() => '');
                    try { responseData = JSON.parse(directText); } catch {}

                    if (resendDirectRes.ok) {
                        sendSuccess = true;
                    } else {
                        let errMsg = responseData?.message || responseData?.error?.message || directText || "Direct Resend API call failed";
                        if (errMsg.includes('testing email address') || errMsg.includes('sandbox')) {
                            errMsg = "Resend Sandbox Restriction: When using a sandbox key or onboarding@resend.dev, you must send test emails to your registered Resend account email address.";
                        } else if (errMsg.includes('not verified') || errMsg.includes('domain')) {
                            errMsg = `Resend Domain Error: The domain in sender address '${senderEmail}' is not verified in your Resend account. Verify the domain in Resend or use 'onboarding@resend.dev'.`;
                        }
                        throw new Error(errMsg);
                    }
                } else {
                    throw proxyError;
                }
            }

            if (sendSuccess) {
                setTestResult({
                    success: true,
                    message: `Test email sent successfully! Message ID: ${responseData?.id || 'N/A'}`
                });
                showToast("Test email sent successfully!", "success");
            }
        } catch (error: any) {
            console.error("Test email sending failed:", error);
            let userMsg = error.message || "Unknown error occurred while sending test email.";
            if (userMsg.includes('testing email address') || userMsg.includes('sandbox')) {
                userMsg = "Resend Sandbox Mode: When using a sandbox key or onboarding@resend.dev, you must send to your registered Resend account email address.";
            } else if (userMsg.includes('not verified') || userMsg.includes('domain')) {
                userMsg = `Resend Domain Error: The domain in sender address '${senderEmail}' is not verified in your Resend account. Verify domain in Resend or use 'onboarding@resend.dev' for testing.`;
            }
            setTestResult({
                success: false,
                message: userMsg
            });
            showToast(userMsg, "error");
        } finally {
            setIsSendingTest(false);
        }
    };

    const handleContentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (joinContent) {
            setIsSavingContent(true);
            try {
                // Sanitize content to remove deleted fields (e.g. photo) before saving
                const sanitizedContent = JSON.parse(JSON.stringify(joinContent));
                await updateData({ join: sanitizedContent });
                showToast('Settings saved successfully!', 'success');
            } catch (error) {
                console.error("Error saving settings:", error);
                showToast('Failed to save settings.', 'error');
            } finally {
                setIsSavingContent(false);
            }
        }
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

    // --- Designer Drag Handlers ---
    const handleCanvasMouseDown = (e: React.MouseEvent, field: string) => {
        e.stopPropagation();
        e.preventDefault();
        
        const currentConfig = joinContent?.idCardConfig;
        if (!currentConfig) return;
        
        let initialPos = { x: 0, y: 0 };
        const fieldData = (currentConfig.fields as any)[field];
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
        const updatedFields = { 
            ...currentConfig.fields, 
            [dragState.field]: { ...(currentConfig.fields as any)[dragState.field], x: newX, y: newY } 
        };
        
        setJoinContent({ ...joinContent, idCardConfig: { ...currentConfig, fields: updatedFields } as any });
    };

    const handleMouseUp = () => {
        setDragState(null);
    };

    const handleCanvasTouchStart = (e: React.TouchEvent, field: string) => {
        e.stopPropagation();
        const touch = e.touches[0];
        
        const currentConfig = joinContent?.idCardConfig;
        if (!currentConfig) return;
        
        let initialPos = { x: 0, y: 0 };
        const fieldData = (currentConfig.fields as any)[field];
        if (fieldData) {
            initialPos = { x: fieldData.x, y: fieldData.y };
        }

        setSelectedField(field);
        setDragState({
            field,
            startX: touch.clientX,
            startY: touch.clientY,
            initialX: initialPos.x,
            initialY: initialPos.y
        });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!dragState || !joinContent?.idCardConfig) return;
        
        const touch = e.touches[0];
        const dx = (touch.clientX - dragState.startX) / zoom;
        const dy = (touch.clientY - dragState.startY) / zoom;
        
        const newX = Math.round(dragState.initialX + dx);
        const newY = Math.round(dragState.initialY + dy);
        
        const currentConfig = joinContent.idCardConfig;
        const updatedFields = { 
            ...currentConfig.fields, 
            [dragState.field]: { ...(currentConfig.fields as any)[dragState.field], x: newX, y: newY } 
        };
        
        setJoinContent({ ...joinContent, idCardConfig: { ...currentConfig, fields: updatedFields } as any });
    };

    const handleTouchEnd = () => {
        setDragState(null);
    };

    const handleNudge = (axis: 'x' | 'y' | 'width' | 'height', delta: number) => {
        if (!selectedField || !joinContent?.idCardConfig) return;
        const currentConfig = joinContent.idCardConfig;
        const currentVal = ((currentConfig.fields as any)[selectedField])[axis] || 0;
        const newVal = Math.max(0, currentVal + delta);
        
        const updatedFields = { 
            ...currentConfig.fields, 
            [selectedField]: { ...(currentConfig.fields as any)[selectedField], [axis]: newVal } 
        };
        setJoinContent({ ...joinContent, idCardConfig: { ...currentConfig, fields: updatedFields } as any });
    };

    const handlePropChange = (key: string, value: any) => {
        if (!selectedField || !joinContent?.idCardConfig) return;
        const currentConfig = joinContent.idCardConfig;
        const updatedFields = { 
            ...currentConfig.fields, 
            [selectedField]: { ...(currentConfig.fields as any)[selectedField], [key]: value } 
        };
        setJoinContent({ ...joinContent, idCardConfig: { ...currentConfig, fields: updatedFields } as any });
    };

    const handleBackgroundChange = (url: string) => {
        if (!joinContent?.idCardConfig) return;
        
        const updatedConfig = {
            ...joinContent.idCardConfig,
            backgroundImageUrl: url
        };
        
        if (url) {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const aspect = img.height / img.width;
                const currentWidth = updatedConfig.width || 85;
                const newHeight = Math.round(currentWidth * aspect);
                updatedConfig.height = newHeight;
                setJoinContent({
                    ...joinContent,
                    idCardConfig: updatedConfig
                });
                showToast(`Background updated and auto-fitted to ${currentWidth}mm x ${newHeight}mm!`, 'success');
            };
            img.onerror = () => {
                showToast('Failed to load image for auto-fit. Check URL.', 'error');
            };
            img.src = url;
        } else {
            setJoinContent({
                ...joinContent,
                idCardConfig: updatedConfig
            });
        }
    };

    const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !joinContent?.idCardConfig) return;
        
        if (file.size > 2 * 1024 * 1024) { 
            showToast("Font file is too large (max 2MB).", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            updateJoinContent({ 
                idCardConfig: { 
                    ...joinContent.idCardConfig!, 
                    customFontData: base64,
                    customFontName: file.name
                }
            });
            showToast("Font file uploaded successfully!", 'success');
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
        showToast("Custom typography font removed.", 'success');
    };

    const addField = (field: string) => {
        if (!joinContent?.idCardConfig) return;
        const currentConfig = joinContent.idCardConfig;
        
        const newFieldConfig = field === 'photo' 
            ? { x: 10, y: 10, width: 20, height: 20 }
            : { x: 42, y: 30, fontSize: 12, color: "#000000", align: "center", fontWeight: 'normal' };

        const updatedFields = { ...currentConfig.fields, [field]: newFieldConfig };
        setJoinContent({ ...joinContent, idCardConfig: { ...currentConfig, fields: updatedFields } as any });
        setSelectedField(field); 
    };

    const deleteField = () => {
        if (!selectedField || !joinContent?.idCardConfig) return;
        if (!confirm(`Are you sure you want to remove ${selectedField}?`)) return;

        const currentConfig = joinContent.idCardConfig;
        const updatedFields = { ...currentConfig.fields };
        delete (updatedFields as any)[selectedField];
        
        setJoinContent({ ...joinContent, idCardConfig: { ...currentConfig, fields: updatedFields } as any });
        setSelectedField(null);
    };

    if (loadingData || !joinContent) {
        return (
            <div className="text-center py-24 bg-card-bg border border-border-color rounded-2xl">
                <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
                <span className="text-sm text-text-secondary">Loading system settings...</span>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-210px)]">
            <div className="flex flex-col md:flex-row h-full gap-4">
                {/* Settings Sidebar */}
                <div className="w-full md:w-64 bg-card-bg p-4 rounded-xl border border-border-color flex-shrink-0 overflow-y-auto">
                    <h3 className="font-extrabold text-xs text-text-secondary uppercase tracking-widest mb-4 px-2">Settings Menu</h3>
                    <ul className="space-y-1">
                        <li>
                            <button 
                                onClick={() => setSettingsTab('general')} 
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${settingsTab === 'general' ? 'bg-accent text-accent-text font-extrabold shadow-md' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                General Info
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setSettingsTab('payments')} 
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${settingsTab === 'payments' ? 'bg-accent text-accent-text font-extrabold shadow-md' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                Payments Gateways
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setSettingsTab('email')} 
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${settingsTab === 'email' ? 'bg-accent text-accent-text font-extrabold shadow-md' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                Email System (Resend)
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setSettingsTab('id_card')} 
                                className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${settingsTab === 'id_card' ? 'bg-accent text-accent-text font-extrabold shadow-md' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                ID Card Designer
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Sub-tab view container */}
                <div className="flex-grow bg-card-bg rounded-xl border border-border-color overflow-hidden flex flex-col">
                    {settingsTab === 'general' && (
                        <div className="p-6 md:p-8 overflow-y-auto h-full">
                            <form onSubmit={handleContentSubmit} className="space-y-6 max-w-3xl">
                                <div>
                                    <h2 className="text-xl font-extrabold text-accent">General Configuration</h2>
                                    <p className="text-xs text-text-secondary mt-1">Set current session details and custom onboarding text blocks.</p>
                                </div>
                                <FormInput label="Current Session Year (e.g. 26)" name="currentSessionYear" value={joinContent.currentSessionYear || ''} onChange={(e) => updateJoinContent({ currentSessionYear: e.target.value })} />
                                <FormInput label="Registration Fee Text (e.g. BDT 150)" name="regFee" value={joinContent.regFee || ''} onChange={(e) => updateJoinContent({ regFee: e.target.value })} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormInput label="Support WhatsApp Link" name="supportWhatsapp" value={joinContent.supportWhatsapp || ''} onChange={(e) => updateJoinContent({ supportWhatsapp: e.target.value })} />
                                    <FormInput label="Support Facebook Link" name="supportFacebook" value={joinContent.supportFacebook || ''} onChange={(e) => updateJoinContent({ supportFacebook: e.target.value })} />
                                </div>
                                <RichTextEditor label="Registration Instructions (Step 1)" value={joinContent.description} onChange={(val) => updateJoinContent({ description: val })} />
                                <div className="pt-4">
                                    <button type="submit" disabled={isSavingContent} className="px-6 py-3 bg-accent text-accent-text font-bold rounded-xl shadow-md hover:bg-accent-hover transition-colors">
                                        {isSavingContent ? 'Saving...' : 'Save General Settings'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {settingsTab === 'payments' && (
                        <div className="p-6 md:p-8 overflow-y-auto h-full">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-extrabold text-accent">Payment Gateways</h2>
                                    <p className="text-xs text-text-secondary mt-1">Configure BKash, Rocket, Nagad or other manual gateways.</p>
                                </div>
                                <button 
                                    onClick={handleAddPayment} 
                                    className="px-4 py-2 bg-accent text-accent-text font-bold rounded-xl hover:bg-accent-hover transition-colors text-xs flex items-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" /> Add Method
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {joinContent.paymentMethods?.map(method => (
                                    <div key={method.id} className="border border-border-color rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-background/50">
                                        <div>
                                            <h3 className="font-extrabold text-base text-text-primary flex items-center gap-2">
                                                {method.name} 
                                                <span className="text-xs font-normal text-text-secondary">({method.accountType})</span>
                                            </h3>
                                            <p className="text-xs font-mono font-bold text-accent mt-0.5">{method.number}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => handleTogglePayment(method.id)} 
                                                className={`px-3 py-1 text-xs font-bold rounded-full ${method.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                                            >
                                                {method.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                            <button onClick={() => handleEditPayment(method)} className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-200 text-xs font-bold">Edit</button>
                                            <button onClick={() => handleDeletePayment(method.id)} className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-200 text-xs font-bold">Delete</button>
                                        </div>
                                    </div>
                                ))}
                                {(!joinContent.paymentMethods || joinContent.paymentMethods.length === 0) && <p className="text-text-secondary text-center py-8">No payment methods added.</p>}
                            </div>
                            <div className="pt-6 mt-6 border-t border-border-color">
                                <button onClick={handleContentSubmit} disabled={isSavingContent} className="px-6 py-3 bg-accent text-accent-text font-bold rounded-xl shadow-md hover:bg-accent-hover transition-colors">{isSavingContent ? 'Saving...' : 'Save Configuration'}</button>
                            </div>
                        </div>
                    )}

                    {settingsTab === 'email' && (
                        <div className="p-6 md:p-8 overflow-y-auto h-full space-y-8">
                            <form onSubmit={handleContentSubmit} className="space-y-6 max-w-3xl">
                                <div>
                                    <h2 className="text-xl font-extrabold text-accent">Email System Configuration (Resend)</h2>
                                    <p className="text-xs text-text-secondary mt-1">Provide Resend API key and sender details to send automatic member welcome emails with attached ID Cards.</p>
                                </div>
                                <FormInput label="Resend API Key" name="apiKey" value={joinContent.resendConfig?.apiKey || ''} onChange={(e) => updateJoinContent({ resendConfig: { ...joinContent.resendConfig, apiKey: e.target.value } as any })} type="password" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormInput label="Sender Name" name="senderName" value={joinContent.resendConfig?.senderName || ''} onChange={(e) => updateJoinContent({ resendConfig: { ...joinContent.resendConfig, senderName: e.target.value } as any })} />
                                    <FormInput label="Sender Email" name="senderEmail" value={joinContent.resendConfig?.senderEmail || ''} onChange={(e) => updateJoinContent({ resendConfig: { ...joinContent.resendConfig, senderEmail: e.target.value } as any })} />
                                </div>
                                <div className="border-t border-border-color pt-6 mt-6">
                                    <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4">Email Template</h3>
                                    <FormInput label="Subject Line" name="subject" value={joinContent.emailConfig?.subject || ''} onChange={(e) => updateJoinContent({ emailConfig: { ...joinContent.emailConfig, subject: e.target.value } as any })} />
                                    <RichTextEditor 
                                        label="Email Body Content (Use placeholders: {{name}}, {{id}}, {{roll}})" 
                                        value={joinContent.emailConfig?.body || ''} 
                                        onChange={(val) => updateJoinContent({ emailConfig: { ...joinContent.emailConfig, body: val } as any })} 
                                    />
                                </div>
                                <div className="pt-4">
                                    <button type="submit" disabled={isSavingContent} className="px-6 py-3 bg-accent text-accent-text font-bold rounded-xl shadow-md hover:bg-accent-hover transition-colors">{isSavingContent ? 'Saving...' : 'Save Email Configuration'}</button>
                                </div>
                            </form>

                            {/* Connection Test Section */}
                            <div className="border-t border-border-color pt-8 max-w-3xl">
                                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-5 border border-border-color shadow-sm space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-base text-text-primary">Test Email Connection</h3>
                                            <p className="text-xs text-text-secondary">Verify your credentials and mail server by sending an instant test message.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row items-end gap-3">
                                        <div className="flex-grow w-full">
                                            <FormInput 
                                                label="Recipient Test Email" 
                                                name="testRecipient" 
                                                value={testRecipient} 
                                                onChange={(e) => setTestRecipient(e.target.value)} 
                                                placeholder="e.g. you@example.com"
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={isSendingTest}
                                            className="px-5 py-3 w-full sm:w-auto bg-accent text-accent-text font-bold rounded-xl hover:bg-accent-hover shadow-sm transition-all flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50"
                                        >
                                            {isSendingTest ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Send Test Email
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    {testResult && (
                                        <div className={`mt-4 p-4 rounded-xl border text-sm flex items-start gap-3 ${
                                            testResult.success 
                                                ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' 
                                                : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
                                        }`}>
                                            {testResult.success ? (
                                                <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500 mt-0.5" />
                                            ) : (
                                                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                                            )}
                                            <div className="space-y-1 overflow-hidden">
                                                <strong className="block font-bold">{testResult.success ? 'Success!' : 'Connection Failed'}</strong>
                                                <p className="font-mono text-xs break-all whitespace-pre-wrap leading-relaxed">{testResult.message}</p>
                                                {!testResult.success && (
                                                    <div className="mt-2 text-xs opacity-90 leading-relaxed border-t border-red-500/10 pt-2 space-y-1 text-left">
                                                        <span className="font-semibold block text-red-800 dark:text-red-300">Troubleshooting Steps:</span>
                                                        <ul className="list-disc list-inside space-y-0.5 pl-1">
                                                            <li>Verify that the <strong>Resend API Key</strong> is correct and active.</li>
                                                            <li>Ensure the <strong>Sender Email</strong> domain is verified in your Resend account.</li>
                                                            <li>Check if you are sending to a verified recipient if using a sandbox key.</li>
                                                            <li>If configuring via <strong>Vercel Env Variables</strong>, make sure to trigger a <strong>redeploy</strong> after setting them.</li>
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {settingsTab === 'id_card' && (
                        <div className="p-6 md:p-8 overflow-y-auto h-full flex flex-col items-center justify-center text-center">
                            <div className="max-w-md bg-card-bg border border-border-color p-8 rounded-2xl shadow-md space-y-6">
                                <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-extrabold tracking-tight">ID Card Designer Studio</h2>
                                    <p className="text-text-secondary text-xs leading-relaxed">
                                        Design an ultra-precise printable ID Card template. Adjust variables, dimensions, backgrounds, and custom font uploads in real-time.
                                    </p>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setIsDesignerOpen(true)}
                                        className="w-full py-3 bg-accent text-accent-text font-extrabold rounded-xl shadow-md hover:bg-accent-hover transition-all"
                                    >
                                        Open Designer Studio
                                    </button>
                                    <p className="text-[10px] text-text-secondary">
                                        Current dimensions: {joinContent.idCardConfig?.width || 85}mm x {joinContent.idCardConfig?.height || 55}mm
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
                        <ImageInput label="Logo URL (Optional)" name="imageUrl" value={editingPayment.imageUrl || ''} onChange={(e) => setEditingPayment({...editingPayment, imageUrl: e.target.value})} />
                        <FormInput label="Video Tutorial URL (Optional)" name="videoUrl" value={editingPayment.videoUrl || ''} onChange={(e) => setEditingPayment({...editingPayment, videoUrl: e.target.value})} />
                        <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="isActive" checked={editingPayment.isActive} onChange={(e) => setEditingPayment({...editingPayment, isActive: e.target.checked})} className="w-4 h-4 text-accent" />
                            <label htmlFor="isActive" className="text-xs font-semibold text-text-secondary">Active (Visible to users)</label>
                        </div>
                    </div>
                )}
            </AdminEditModal>

            {/* ID Card Designer Fullscreen Studio */}
            {isDesignerOpen && joinContent.idCardConfig && (
                <div 
                    className="fixed inset-0 z-50 bg-background flex flex-col text-text-primary overflow-hidden select-none font-sans"
                    onMouseMove={handleMouseMove} 
                    onMouseUp={handleMouseUp}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Header */}
                    <div className="px-6 py-4 bg-card-bg border-b border-border-color flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/10 rounded-lg text-accent hidden sm:block">
                                <Sliders className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h2 className="font-extrabold text-xl text-text-primary tracking-tight">DCCC ID Designer Studio</h2>
                                <p className="text-xs text-text-secondary">
                                    Canvas: <span className="font-semibold text-accent">{joinContent.idCardConfig.width || 85}mm × {joinContent.idCardConfig.height || 55}mm</span>
                                </p>
                            </div>
                        </div>

                        {/* Interactive Zoom Controls */}
                        <div className="flex items-center gap-3 bg-background border border-border-color px-3 py-1.5 rounded-xl text-xs">
                            <span className="text-xs font-bold text-text-secondary">Zoom:</span>
                            <button 
                                type="button" 
                                onClick={() => setZoom(z => Math.max(1, z - 0.5))} 
                                className="w-6 h-6 rounded-md hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center font-bold"
                            >
                                -
                            </button>
                            <span className="font-mono font-bold text-accent min-w-[3rem] text-center">
                                {Math.round(zoom * 100 / 3.5)}%
                            </span>
                            <button 
                                type="button" 
                                onClick={() => setZoom(z => Math.min(10, z + 0.5))} 
                                className="w-6 h-6 rounded-md hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center font-bold"
                            >
                                +
                            </button>
                        </div>

                        {/* Studio Actions */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button 
                                type="button"
                                onClick={() => {
                                    if (confirm("Discard unsaved changes and close studio?")) {
                                        setIsDesignerOpen(false);
                                        setSelectedField(null);
                                    }
                                }} 
                                className="flex-1 sm:flex-initial px-5 py-2 border border-border-color text-text-primary rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm"
                            >
                                Close Studio
                            </button>
                            <button 
                                type="button"
                                onClick={async () => {
                                    setIsSavingContent(true);
                                    try {
                                        // Sanitize content to remove deleted fields (e.g. photo) before saving
                                        const sanitizedContent = JSON.parse(JSON.stringify(joinContent));
                                        await updateData({ join: sanitizedContent });
                                        showToast('ID Card design saved and applied successfully!', 'success');
                                        setIsDesignerOpen(false);
                                        setSelectedField(null);
                                    } catch (e) {
                                        showToast('Failed to save ID Card design.', 'error');
                                    } finally {
                                        setIsSavingContent(false);
                                    }
                                }}
                                disabled={isSavingContent}
                                className="flex-1 sm:flex-initial px-6 py-2 bg-accent text-accent-text font-bold rounded-xl shadow-lg hover:bg-accent-hover transition-all text-sm disabled:opacity-50"
                            >
                                {isSavingContent ? 'Saving...' : 'Save & Apply'}
                            </button>
                        </div>
                    </div>

                    {/* Workspace & Controls */}
                    <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                        
                        {/* Interactive Design Area */}
                        <div 
                            className="flex-grow bg-slate-100 dark:bg-slate-950 overflow-auto flex items-center justify-center p-6 relative"
                            onClick={() => setSelectedField(null)}
                        >
                            <div className="relative border border-dashed border-border-color p-4 bg-background/20 rounded-xl max-w-full overflow-auto">
                                <div 
                                    ref={editorRef}
                                    className="bg-white shadow-2xl relative transition-all duration-200"
                                    style={{
                                        width: `${(joinContent.idCardConfig?.width || 85) * zoom}px`,
                                        height: `${(joinContent.idCardConfig?.height || 55) * zoom}px`,
                                        backgroundImage: `url(${joinContent.idCardConfig?.backgroundImageUrl})`,
                                        backgroundSize: '100% 100%',
                                        backgroundRepeat: 'no-repeat',
                                        borderRadius: '4px'
                                    }}
                                >
                                    {ALL_AVAILABLE_FIELDS.map(field => {
                                        const conf = (joinContent.idCardConfig?.fields as any)[field];
                                        if (!conf) return null;
                                        return (
                                            <FieldPreview 
                                                key={field} 
                                                field={field} 
                                                config={conf} 
                                                scale={zoom}
                                                isSelected={selectedField === field}
                                                onMouseDown={handleCanvasMouseDown}
                                                onTouchStart={handleCanvasTouchStart}
                                                hasCustomFont={!!joinContent.idCardConfig?.customFontData}
                                            />
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Mobile helper toast */}
                            <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none block md:hidden">
                                <span className="px-3 py-1.5 bg-black/80 text-white rounded-full text-xs font-semibold shadow-md">
                                    💡 Drag components or select and use nudge controls below!
                                </span>
                            </div>
                        </div>

                        {/* Interactive Sidebar / Tabs (Background, Layers, Properties) */}
                        <div className="w-full md:w-96 bg-card-bg border-t md:border-t-0 md:border-l border-border-color flex flex-col overflow-hidden max-h-[50vh] md:max-h-full">
                            {/* Tabs Header */}
                            <div className="flex border-b border-border-color bg-background/50">
                                <button 
                                    type="button"
                                    onClick={() => setDesignerMobileTab('bg')}
                                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${designerMobileTab === 'bg' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    🎨 Canvas & Bg
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setDesignerMobileTab('layers')}
                                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${designerMobileTab === 'layers' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    🏷️ Layers
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setDesignerMobileTab('properties')}
                                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${designerMobileTab === 'properties' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'} ${!selectedField ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    disabled={!selectedField}
                                >
                                    ⚙️ Properties
                                </button>
                            </div>

                            {/* Tab Contents */}
                            <div className="flex-grow overflow-y-auto p-6 space-y-6 text-left">
                                
                                {designerMobileTab === 'bg' && (
                                    <div className="space-y-4">
                                        <div className="space-y-1 text-left">
                                            <h4 className="font-bold text-sm text-text-primary">Card Aspect & Dimensions</h4>
                                            <p className="text-xs text-text-secondary">Set target printable dimensions in millimeters (mm).</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-text-secondary block mb-1">Width (mm)</label>
                                                <input 
                                                    type="number" 
                                                    value={joinContent.idCardConfig?.width || 85} 
                                                    onChange={(e) => updateJoinContent({ idCardConfig: { ...joinContent.idCardConfig, width: parseInt(e.target.value) || 85 } as any })} 
                                                    className="w-full px-3 py-2 text-sm bg-background border border-border-color rounded-xl font-bold focus:border-accent outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-text-secondary block mb-1">Height (mm)</label>
                                                <input 
                                                    type="number" 
                                                    value={joinContent.idCardConfig?.height || 55} 
                                                    onChange={(e) => updateJoinContent({ idCardConfig: { ...joinContent.idCardConfig, height: parseInt(e.target.value) || 55 } as any })} 
                                                    className="w-full px-3 py-2 text-sm bg-background border border-border-color rounded-xl font-bold focus:border-accent outline-none" 
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-border-color pt-4 space-y-3">
                                            <div className="space-y-1 text-left">
                                                <h4 className="font-bold text-sm text-text-primary">Background Asset</h4>
                                                <p className="text-xs text-text-secondary">Paste your background image URL or select from media library. Aspect ratio auto-fit is built-in!</p>
                                            </div>
                                            <ImageInput 
                                                label="Background Image URL"
                                                name="backgroundImageUrl"
                                                value={joinContent.idCardConfig?.backgroundImageUrl || ''}
                                                onChange={(e) => handleBackgroundChange(e.target.value)}
                                            />
                                        </div>

                                        {/* Custom Font Section */}
                                        <div className="border-t border-border-color pt-4 space-y-3">
                                            <div className="text-left">
                                                <h4 className="font-bold text-sm text-text-primary">Custom Typography (Font File)</h4>
                                                <p className="text-xs text-text-secondary">Upload a TTF or OTF font to render fields perfectly in high quality.</p>
                                            </div>
                                            <input 
                                                type="file" 
                                                accept=".ttf,.otf"
                                                onChange={handleFontUpload}
                                                className="w-full text-xs text-text-secondary file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
                                            />
                                            {joinContent.idCardConfig?.customFontName && (
                                                <div className="flex justify-between items-center mt-2 bg-green-50 dark:bg-green-900/20 p-2.5 rounded-xl border border-green-200 dark:border-green-900/40">
                                                    <span className="text-xs text-green-600 dark:text-green-400 truncate max-w-[150px]" title={joinContent.idCardConfig.customFontName}>
                                                        Active: {joinContent.idCardConfig.customFontName}
                                                    </span>
                                                    <button type="button" onClick={removeCustomFont} className="text-xs text-red-500 hover:text-red-700 font-bold">Remove</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {designerMobileTab === 'layers' && (
                                    <div className="space-y-4">
                                        <div className="space-y-1 text-left">
                                            <h4 className="font-bold text-sm text-text-primary">Available Card Fields</h4>
                                            <p className="text-xs text-text-secondary">Select active text variables or photo field to style and place on the card.</p>
                                        </div>

                                        <div className="space-y-2">
                                            {ALL_AVAILABLE_FIELDS.map(field => {
                                                const isActive = !joinContent.idCardConfig ? false : !!(joinContent.idCardConfig.fields as any)[field];
                                                const isCurrent = selectedField === field;
                                                return (
                                                    <div 
                                                        key={field} 
                                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                            isCurrent 
                                                                ? 'bg-accent/10 border-accent' 
                                                                : 'bg-background/50 border-border-color hover:bg-black/5 dark:hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-semibold capitalize">{field.replace('_', ' ')}</span>
                                                        <div className="flex items-center gap-2">
                                                            {isActive ? (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedField(field);
                                                                        setDesignerMobileTab('properties');
                                                                    }} 
                                                                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                                                                        isCurrent 
                                                                            ? 'bg-accent text-white' 
                                                                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/20 dark:text-green-400'
                                                                    }`}
                                                                >
                                                                    {isCurrent ? 'Selected' : 'Edit'}
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => addField(field)} 
                                                                    className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 rounded-lg hover:bg-blue-200 font-bold"
                                                                >
                                                                    + Add
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {designerMobileTab === 'properties' && selectedField && (
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center bg-accent/10 p-3 rounded-xl border border-accent/20">
                                            <span className="text-sm font-extrabold text-accent uppercase tracking-wide">{selectedField.replace('_', ' ')}</span>
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setSelectedField(null)} 
                                                    className="text-xs px-2.5 py-1.5 bg-background border rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 font-bold" 
                                                    title="Deselect"
                                                >
                                                    ✕
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={deleteField} 
                                                    className="text-xs px-2.5 py-1.5 bg-red-100 text-red-600 border border-red-200 rounded-lg hover:bg-red-200 font-bold" 
                                                    title="Delete Element"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </div>

                                        {/* Properties controls depending on text vs photo */}
                                        {selectedField !== 'photo' ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-text-secondary mb-1">Font Size (pt)</label>
                                                        <input 
                                                            type="number" 
                                                            value={(joinContent.idCardConfig?.fields as any)[selectedField].fontSize || 10} 
                                                            onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value) || 6)} 
                                                            className="w-full px-3 py-1.5 text-sm bg-background border border-border-color rounded-xl font-bold" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-text-secondary mb-1">Color</label>
                                                        <div className="flex gap-1.5">
                                                            <input 
                                                                type="color" 
                                                                value={(joinContent.idCardConfig?.fields as any)[selectedField].color || '#000000'} 
                                                                onChange={(e) => handlePropChange('color', e.target.value)} 
                                                                className="w-9 h-9 p-0 border-none bg-transparent cursor-pointer rounded-lg overflow-hidden" 
                                                            />
                                                            <input 
                                                                type="text" 
                                                                value={(joinContent.idCardConfig?.fields as any)[selectedField].color || '#000000'} 
                                                                onChange={(e) => handlePropChange('color', e.target.value)} 
                                                                className="w-full px-2 py-1.5 text-xs bg-background border border-border-color rounded-xl font-mono" 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-text-secondary mb-1">Font Formatting</label>
                                                    <div className="flex gap-2">
                                                        <select 
                                                            value={(joinContent.idCardConfig?.fields as any)[selectedField].fontWeight || 'normal'} 
                                                            onChange={(e) => handlePropChange('fontWeight', e.target.value)}
                                                            className="flex-grow px-3 py-1.5 text-sm bg-background border border-border-color rounded-xl font-bold"
                                                        >
                                                            <option value="normal">Normal</option>
                                                            <option value="bold">Bold</option>
                                                        </select>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handlePropChange('fontStyle', (joinContent.idCardConfig?.fields as any)[selectedField].fontStyle === 'italic' ? 'normal' : 'italic')}
                                                            className={`w-10 h-9 border rounded-xl flex items-center justify-center font-bold text-sm transition-all ${(joinContent.idCardConfig?.fields as any)[selectedField].fontStyle === 'italic' ? 'bg-accent text-white border-accent' : 'bg-background hover:bg-black/5 dark:hover:bg-white/5 border-border-color'}`}
                                                        >
                                                            <span className="italic font-serif">I</span>
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handlePropChange('textDecoration', (joinContent.idCardConfig?.fields as any)[selectedField].textDecoration === 'underline' ? 'none' : 'underline')}
                                                            className={`w-10 h-9 border rounded-xl flex items-center justify-center font-bold text-sm transition-all ${(joinContent.idCardConfig?.fields as any)[selectedField].textDecoration === 'underline' ? 'bg-accent text-white border-accent' : 'bg-background hover:bg-black/5 dark:hover:bg-white/5 border-border-color'}`}
                                                        >
                                                            <span className="underline">U</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-text-secondary mb-1">Alignment</label>
                                                    <div className="flex border border-border-color rounded-xl overflow-hidden bg-background">
                                                        {['left', 'center', 'right'].map(align => (
                                                            <button 
                                                                key={align} 
                                                                type="button"
                                                                onClick={() => handlePropChange('align', align)}
                                                                className={`flex-1 py-1.5 text-xs font-bold capitalize transition-colors ${
                                                                    (joinContent.idCardConfig?.fields as any)[selectedField].align === align 
                                                                        ? 'bg-accent text-white' 
                                                                        : 'bg-background hover:bg-black/5 dark:hover:bg-white/5'
                                                                }`}
                                                            >
                                                                {align}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-semibold text-text-secondary block mb-1">Width (mm)</label>
                                                        <input 
                                                            type="number" 
                                                            value={(joinContent.idCardConfig?.fields as any)[selectedField].width || 20} 
                                                            onChange={(e) => handlePropChange('width', parseInt(e.target.value) || 5)} 
                                                            className="w-full px-3 py-1.5 text-sm bg-background border border-border-color rounded-xl font-bold" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-text-secondary block mb-1">Height (mm)</label>
                                                        <input 
                                                            type="number" 
                                                            value={(joinContent.idCardConfig?.fields as any)[selectedField].height || 20} 
                                                            onChange={(e) => handlePropChange('height', parseInt(e.target.value) || 5)} 
                                                            className="w-full px-3 py-1.5 text-sm bg-background border border-border-color rounded-xl font-bold" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Coordinate precision details */}
                                        <div className="border-t border-border-color pt-4 space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-text-secondary block mb-1">X Coord (mm)</label>
                                                    <input 
                                                        type="number" 
                                                        value={(joinContent.idCardConfig?.fields as any)[selectedField].x || 0} 
                                                        onChange={(e) => handlePropChange('x', parseInt(e.target.value) || 0)} 
                                                        className="w-full px-3 py-1.5 text-sm bg-background border border-border-color rounded-xl font-bold" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-text-secondary block mb-1">Y Coord (mm)</label>
                                                    <input 
                                                        type="number" 
                                                        value={(joinContent.idCardConfig?.fields as any)[selectedField].y || 0} 
                                                        onChange={(e) => handlePropChange('y', parseInt(e.target.value) || 0)} 
                                                        className="w-full px-3 py-1.5 text-sm bg-background border border-border-color rounded-xl font-bold" 
                                                    />
                                                </div>
                                            </div>

                                            {/* JOYPAD / NUDGE */}
                                            <div className="bg-background/40 p-3.5 rounded-xl border border-border-color space-y-2">
                                                <label className="block text-xs font-bold text-text-secondary text-center uppercase tracking-wider">Position Joystick (±1mm)</label>
                                                <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                                                    <div></div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleNudge('y', -1)} 
                                                        className="h-10 w-10 bg-card-bg hover:bg-black/10 dark:hover:bg-white/10 rounded-xl border border-border-color flex items-center justify-center font-black active:scale-95 transition-all text-lg"
                                                        title="Nudge Up 1mm"
                                                    >
                                                        ↑
                                                    </button>
                                                    <div></div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleNudge('x', -1)} 
                                                        className="h-10 w-10 bg-card-bg hover:bg-black/10 dark:hover:bg-white/10 rounded-xl border border-border-color flex items-center justify-center font-black active:scale-95 transition-all text-lg"
                                                        title="Nudge Left 1mm"
                                                    >
                                                        ←
                                                    </button>
                                                    <div className="flex items-center justify-center text-[10px] font-extrabold text-accent bg-accent/5 rounded-xl text-center select-none truncate">
                                                        {selectedField.toUpperCase()}
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleNudge('x', 1)} 
                                                        className="h-10 w-10 bg-card-bg hover:bg-black/10 dark:hover:bg-white/10 rounded-xl border border-border-color flex items-center justify-center font-black active:scale-95 transition-all text-lg"
                                                        title="Nudge Right 1mm"
                                                    >
                                                        →
                                                    </button>
                                                    <div></div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleNudge('y', 1)} 
                                                        className="h-10 w-10 bg-card-bg hover:bg-black/10 dark:hover:bg-white/10 rounded-xl border border-border-color flex items-center justify-center font-black active:scale-95 transition-all text-lg"
                                                        title="Nudge Down 1mm"
                                                    >
                                                        ↓
                                                    </button>
                                                    <div></div>
                                                </div>
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
    );
};

export default JoinAdminSettings;
