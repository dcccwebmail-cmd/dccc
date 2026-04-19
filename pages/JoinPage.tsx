
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../components/PageTitle';
import FormInput from '../components/admin/FormInput';
import { submitJoinRequest } from '../services/joinService';
import SectionWrapper from '../components/SectionWrapper';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';

const steps = [
    { id: 1, label: 'রেজিস্ট্রেশন\nRegistration' },
    { id: 2, label: 'ব্যক্তিগত তথ্য\nPersonal Info' },
    { id: 3, label: 'একাডেমিক তথ্য\nAcademic Info' },
    { id: 4, label: 'যোগাযোগের তথ্য\nContact Info' },
    { id: 5, label: 'কার্যক্রম ও দক্ষতা\nActivities & Skills' },
    { id: 6, label: 'পেমেন্ট ও জমা\n(Payment & Submit)' }, // Updated Bilingual Label
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['পুরুষ (Male)', 'মহিলা (Female)', 'অন্যান্য (Other)'];
const departmentsList = [
    'Wordspace', 'Musica', 'Artstation', 'Timbre', 
    'Film School & Photography', 'Human Resource Management', 
    'Department of IT', 'Finance & Marketing'
];
const sections = [
    'Science A', 'Science B', 'Science C', 'Science D', 'Science E', 'Science F',
    'Business Studies', 'Humanities'
];
const booths = ['Booth A', 'Booth B', 'Booth C', 'Booth D'];

// Cloudinary Configuration
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

const CLOUDINARY_CLOUD_NAME = getEnv('VITE_CLOUDINARY_CLOUD_NAME') || getEnv('REACT_APP_CLOUDINARY_CLOUD_NAME') || 'dccc_cloud'; 
const CLOUDINARY_UPLOAD_PRESET = getEnv('VITE_CLOUDINARY_UPLOAD_PRESET') || getEnv('REACT_APP_CLOUDINARY_UPLOAD_PRESET') || 'dccc_uploads';
const CLOUDINARY_API_KEY = '999432554534393';

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 800;
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.7);
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

const JoinPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { data } = useData();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [regType, setRegType] = useState<'new' | 'offline' | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name_bn: '',
        name_en: '',
        email: '',
        imageFile: null as File | null,
        imagePreview: '',
        dob: '',
        booth: '',
        father_name: '',
        mother_name: '',
        gender: '', // Fixed: Changed default from 'পুরুষ (Male)' to empty string to force selection
        section: '',
        roll: '',
        prev_institute: '',
        blood_group: '',
        phone: '',
        whatsapp: '',
        facebook: '',
        present_address: '',
        permanent_address: '',
        first_choice: '', 
        second_choice: '', 
        reason: '', 
        experience: '', 
        hobbies: '', 
        skills: '',
        dccc_id: 'DCCC-',
        trx_id: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Force Bangla input for name_bn
        if (name === 'name_bn') {
            const banglaRegex = /^[\u0980-\u09FF\s]*$/;
            if (!banglaRegex.test(value)) {
                // Ignore input if it's not Bangla or space
                return;
            }
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) { 
                 showToast('File size too large. Please upload under 10MB.', 'error');
                 return;
            }
            try {
                const previewUrl = URL.createObjectURL(file);
                setFormData(prev => ({ ...prev, imageFile: file, imagePreview: previewUrl }));
            } catch (err) {
                console.error("Error setting file", err);
            }
        }
    };

    // Calculate Max Date (Must be at least 15 years old)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 15);
    const maxDateString = maxDate.toISOString().split('T')[0];

    React.useEffect(() => {
        if (currentStep === 2) {
             if (regType === 'new') {
                 setFormData(prev => ({ ...prev, booth: 'O' }));
             } else if (!formData.booth) {
                 setFormData(prev => ({ ...prev, booth: '' })); 
             }
        }
    }, [currentStep, regType, formData.booth]);

    const validateStep = (step: number) => {
        const d = formData;
        switch(step) {
            case 1: 
                return !!regType;
            case 2: 
                const common2 = d.name_bn && d.name_en && d.email && d.dob && d.gender && d.imageFile;
                
                // Validate Age (15+)
                if (d.dob) {
                    const birthDate = new Date(d.dob);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    if (age < 15) {
                        showToast('You must be at least 15 years old to apply.', 'error');
                        return false;
                    }
                }

                if (regType === 'offline') return common2 && d.booth;
                return common2; 
            case 3: 
                const rollValid = /^\d{13}$/.test(d.roll);
                return d.section && rollValid && d.prev_institute && d.blood_group;
            case 4: 
                return d.phone && d.whatsapp && d.facebook;
            case 5: return d.first_choice && d.reason;
            default: return true;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 6));
            window.scrollTo(0, 0);
        } else {
            if (currentStep === 3 && formData.roll && !/^\d{13}$/.test(formData.roll)) {
                showToast('Roll number must be exactly 13 digits.', 'error');
            } else if (currentStep !== 2) { 
                // Don't show generic error if specific date error was shown in validateStep
                showToast('দয়া করে সকল (*) চিহ্নিত তথ্য পূরণ করুন (Please fill all required fields)', 'error');
            }
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo(0, 0);
    };

    const handleCopyNumber = (number: string) => {
        navigator.clipboard.writeText(number);
        showToast('Number copied to clipboard!');
    };

    // Helper to open date picker
    const openDatePicker = (e: React.MouseEvent<HTMLInputElement>) => {
        if ('showPicker' in HTMLInputElement.prototype) {
            try {
                (e.currentTarget as any).showPicker();
            } catch (error) {
                // Fallback or ignore
            }
        }
    };

    const handleSubmit = async () => {
        if (regType === 'new') {
            if (!selectedPaymentMethod) { showToast('Please select a payment method.', 'error'); return; }
            if (!formData.trx_id) { showToast('Please enter Transaction ID.', 'error'); return; }
        } else {
            const dcccRegex = /^DCCC-\d{2}-[A-Z]-\d{3}$/;
            if (!dcccRegex.test(formData.dccc_id)) {
                showToast('Invalid DCCC ID Format. Expected: DCCC-00-A-000', 'error');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            let imageUrl = '';
            if (formData.imageFile) {
                const compressedFile = await compressImage(formData.imageFile);
                const uploadData = new FormData();
                uploadData.append('file', compressedFile);
                uploadData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); 
                if (CLOUDINARY_API_KEY) {
                    uploadData.append('api_key', CLOUDINARY_API_KEY);
                }
                const safeName = formData.name_en.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const publicId = `${safeName}_${formData.roll}`;
                uploadData.append('public_id', publicId);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: uploadData,
                });

                if (!res.ok) {
                    // Fallback logic handled same as before...
                    const retryRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                        method: 'POST',
                        body: (()=>{ 
                            uploadData.delete('public_id'); 
                            return uploadData; 
                        })(),
                    });
                    if (!retryRes.ok) throw new Error('Image upload failed.');
                    const retryJson = await retryRes.json();
                    imageUrl = retryJson.secure_url;
                } else {
                    const json = await res.json();
                    imageUrl = json.secure_url;
                }
            }

            const servicePayload = {
                personal: { 
                    name_bn: formData.name_bn,
                    name_en: formData.name_en,
                    email: formData.email,
                    dob: formData.dob, 
                    gender: formData.gender, 
                    father_name: formData.father_name, 
                    mother_name: formData.mother_name,
                    image_url: imageUrl,
                    booth: formData.booth
                },
                academic: {
                    section: formData.section,
                    roll: formData.roll,
                    prev_institute: formData.prev_institute,
                    blood_group: formData.blood_group
                },
                contact: { 
                    phone: formData.phone, 
                    whatsapp: formData.whatsapp, 
                    present_address: formData.present_address, 
                    permanent_address: formData.permanent_address 
                },
                preferences: { 
                    first_choice: formData.first_choice, second_choice: formData.second_choice, reason: formData.reason 
                },
                skills: { 
                    experience: formData.experience, hobbies: formData.hobbies, skills: formData.skills 
                },
                socials: { 
                    facebook: formData.facebook, instagram: '', linkedin: '' 
                },
                payment: regType === 'new' ? {
                    method: selectedPaymentMethod!,
                    trx_id: formData.trx_id
                } : {
                    dccc_id: formData.dccc_id
                },
                meta: {
                    reg_type: regType
                }
            };

            await submitJoinRequest(servicePayload);
            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to submit.', 'error');
            setIsSubmitting(false);
        }
    };

    const renderPaymentStep = () => {
        if (regType === 'offline') {
            return (
                <div className="space-y-6">
                    <div className="bg-accent/10 p-4 rounded-xl border border-accent/20">
                        <h3 className="font-bold text-accent mb-2">Offline Registration Info</h3>
                        <p className="text-sm">Please enter your DCCC ID as provided on your offline form.</p>
                    </div>
                    <div>
                        <FormInput 
                            label="DCCC ID (From Form)" 
                            name="dccc_id" 
                            value={formData.dccc_id} 
                            onChange={handleChange} 
                            required 
                            placeholder="DCCC-00-A-000" 
                        />
                        <p className="text-xs text-text-secondary mt-1">Format: DCCC-Year-Group-Serial (e.g. DCCC-24-A-123)</p>
                    </div>
                </div>
            );
        }

        const methods = data?.join?.paymentMethods?.filter(m => m.isActive) || [];
        const activeMethod = methods.find(m => m.id === selectedPaymentMethod);

        return (
            <div className="space-y-8">
                <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Registration Fee: <span className="text-accent">{data?.join?.regFee || '100 BDT'}</span></h3>
                    <p className="text-text-secondary text-sm">Select a payment method below to proceed.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {methods.map(method => (
                        <button
                            key={method.id}
                            onClick={() => setSelectedPaymentMethod(method.id)}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedPaymentMethod === method.id ? 'border-accent bg-accent/10' : 'border-border-color hover:border-accent/50'}`}
                        >
                            {method.imageUrl ? (
                                <img src={method.imageUrl} alt={method.name} className="h-10 object-contain" />
                            ) : (
                                <span className="font-bold text-lg">{method.name}</span>
                            )}
                            <span className="text-xs font-medium uppercase tracking-wider">{method.accountType}</span>
                        </button>
                    ))}
                </div>

                {activeMethod && (
                    <div className="animate-fade-in-up bg-card-bg p-6 rounded-2xl border border-border-color space-y-4">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <h4 className="font-bold text-lg mb-2">Payment Details</h4>
                                <div className="mb-2 flex items-center flex-wrap gap-2">
                                    <strong className="text-text-primary">Number:</strong>
                                    <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-border-color group">
                                        <span className="font-mono text-lg select-all">{activeMethod.number}</span>
                                        <button onClick={() => handleCopyNumber(activeMethod.number)} className="text-text-secondary hover:text-accent p-1">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none mb-4" dangerouslySetInnerHTML={{ __html: activeMethod.instructions }} />
                            </div>
                            {activeMethod.videoUrl && (
                                <div className="flex-1 min-w-[250px]">
                                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                                        <iframe width="100%" height="100%" src={activeMethod.videoUrl} title="Payment Tutorial" frameBorder="0" allowFullScreen></iframe>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 border-t border-border-color">
                            <FormInput label="Transaction ID (TrxID)" name="trx_id" value={formData.trx_id} onChange={handleChange} required placeholder="e.g. 9H76..." />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderStepper = () => (
        <div className="flex flex-wrap justify-center items-start gap-2 md:gap-4 mb-10 px-2">
            {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                    <div key={step.id} className={`flex flex-col items-center ${step.id === 6 ? 'w-24 md:w-32' : 'w-16 md:w-28'}`}>
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-300 border-2 ${isActive || isCompleted ? 'bg-accent border-accent text-accent-text' : 'bg-card-bg border-border-color text-text-secondary'}`}>
                            {step.id}
                        </div>
                        <span className={`text-[10px] md:text-xs text-center mt-2 font-medium leading-tight whitespace-pre-wrap font-hind ${isActive ? 'text-accent' : 'text-text-secondary'}`}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    if (isSuccess) {
        return (
            <div className="pt-28 pb-16 min-h-screen font-hind relative overflow-hidden flex items-center justify-center">
                <PageTitle title="Submission Successful" />
                <SectionWrapper className="relative z-10 w-full">
                    <div className="max-w-2xl mx-auto bg-card-bg backdrop-blur-md border border-border-color p-8 md:p-12 rounded-3xl shadow-2xl text-center animate-fade-in-up">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Application Submitted!</h1>
                        <p className="text-lg text-text-secondary mb-8">When your application is <span className="font-bold text-accent">approved</span>, you will receive an email with your full details and ID card.</p>
                        <div className="space-y-4">
                            <p className="text-sm text-text-secondary uppercase tracking-wider font-semibold">Need Help?</p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                {data?.join?.supportWhatsapp && <a href={data.join.supportWhatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600">WhatsApp</a>}
                                {data?.join?.supportFacebook && <a href={data.join.supportFacebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700">Facebook</a>}
                            </div>
                        </div>
                        <div className="mt-10 pt-6 border-t border-border-color">
                            <button onClick={() => navigate('/')} className="text-text-secondary hover:text-accent font-semibold transition-colors">Back to Home</button>
                        </div>
                    </div>
                </SectionWrapper>
            </div>
        );
    }

    return (
        <div className="pt-28 pb-16 min-h-screen font-hind relative overflow-hidden">
            <PageTitle title="Join DCCC | Registration" />
            <SectionWrapper className="relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10 space-y-2">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-accent drop-shadow-sm font-poppins">Join Dhaka College Cultural Club</h1>
                    </div>
                    {renderStepper()}
                    <div className="bg-white dark:bg-slate-800 border border-border-color shadow-2xl rounded-b-3xl overflow-hidden rounded-t-3xl">
                        <div className="bg-accent p-4 md:p-5">
                            <h2 className="text-xl md:text-2xl font-bold text-accent-text text-center md:text-left whitespace-pre-line">{steps[currentStep - 1].label.replace('\n', ' ')}</h2>
                        </div>
                        <div className="p-6 md:p-10">
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in-up">
                                    <div className="bg-card-bg p-6 rounded-2xl border border-border-color text-text-secondary text-sm md:text-base leading-relaxed space-y-4">
                                        <div className="prose dark:prose-invert max-w-none font-hind" dangerouslySetInnerHTML={{ __html: data?.join?.description || '' }} />
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-4 justify-center my-8">
                                        <button onClick={() => setRegType('offline')} className={`px-6 py-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 ${regType === 'offline' ? 'border-accent bg-accent/10 text-accent' : 'border-border-color text-text-secondary'}`}><span className="text-xl">📝</span>অফলাইন ফর্ম সংগ্রহ করেছি<span className="text-xs font-normal opacity-70 font-poppins">(Already took form)</span></button>
                                        <button onClick={() => setRegType('new')} className={`px-6 py-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 ${regType === 'new' ? 'border-accent bg-accent/10 text-accent' : 'border-border-color text-text-secondary'}`}><span className="text-xl">✨</span>নতুন রেজিস্ট্রেশন<span className="text-xs font-normal opacity-70 font-poppins">(New Registration)</span></button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in-up">
                                    <div className="space-y-4">
                                        <FormInput label="নাম (বাংলা)" name="name_bn" value={formData.name_bn} onChange={handleChange} required placeholder="আপনার পূর্ণ নাম বাংলায় লিখুন" />
                                        <FormInput label="Name (English)" name="name_en" value={formData.name_en} onChange={handleChange} required placeholder="Your full name in English" />
                                    </div>
                                    <div className="border border-border-color rounded-xl p-4 bg-card-bg">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">ছবি * (সর্বোচ্চ ১০MB)</label>
                                        <div className="flex items-center gap-4">
                                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20" />
                                            {formData.imagePreview && <div className="w-16 h-16 rounded-xl overflow-hidden border border-border-color flex-shrink-0"><img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" /></div>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Date Input with UX Improvements */}
                                        <div className="mb-4 relative">
                                            <label className="block text-sm font-medium text-text-secondary mb-2">জন্ম তারিখ (Date of Birth) *</label>
                                            <input 
                                                type="date" 
                                                name="dob"
                                                id="dob"
                                                value={formData.dob} 
                                                onChange={handleChange}
                                                onClick={openDatePicker}
                                                max={maxDateString}
                                                required
                                                className="block w-full px-4 py-3 bg-background border border-border-color rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-accent focus:ring-accent transition-all duration-200 cursor-pointer"
                                            />
                                            <p className="text-xs text-text-secondary mt-1">Must be at least 15 years old.</p>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-text-secondary mb-1">Booth Name *</label>
                                            <select name="booth" value={formData.booth} onChange={handleChange} disabled={regType === 'new'} className="block w-full px-3 py-3 bg-background border border-border-color rounded-xl shadow-sm focus:outline-none focus:ring-accent focus:border-accent disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" required>
                                                {regType === 'new' ? <option value="O">O (Online)</option> : <><option value="">Select...</option>{booths.map(b => <option key={b} value={b}>{b}</option>)}</>}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput label="পিতার নাম (Father's Name)" name="father_name" value={formData.father_name} onChange={handleChange} required />
                                        <FormInput label="মাতার নাম (Mother's Name)" name="mother_name" value={formData.mother_name} onChange={handleChange} required />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput label="লিঙ্গ (Gender)" name="gender" type="select" value={formData.gender} onChange={handleChange} required>
                                            <option value="">Select Gender...</option>
                                            {genders.map(g => <option key={g} value={g}>{g}</option>)}
                                        </FormInput>
                                        <FormInput label="ইমেইল (Email)" name="email" type="email" value={formData.email} onChange={handleChange} required />
                                    </div>
                                </div>
                            )}
                            {/* ... Steps 3, 4, 5, 6 remain largely same content structure ... */}
                            {currentStep === 3 && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <FormInput label="সেকশন (Section)" name="section" type="select" value={formData.section} onChange={handleChange} required><option value="">আপনার সেকশন নির্বাচন করুন —</option>{sections.map(b => <option key={b} value={b}>{b}</option>)}</FormInput>
                                    <div><FormInput label="রোল নম্বর (Roll Number)" name="roll" value={formData.roll} onChange={handleChange} required placeholder="আপনার রোল নম্বর লিখুন" type="number"/><p className="text-xs text-text-secondary mt-1">Must be exactly 13 digits.</p></div>
                                    <FormInput label="পূর্ববর্তী শিক্ষাপ্রতিষ্ঠান (Previous Institute)" name="prev_institute" value={formData.prev_institute} onChange={handleChange} required placeholder="যেমন: XYZ High School"/>
                                    <FormInput label="ব্লাড গ্রুপ (Blood Group)" name="blood_group" type="select" value={formData.blood_group} onChange={handleChange} required><option value="">আপনার ব্লাড গ্রুপ নির্বাচন করুন —</option>{bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}</FormInput>
                                </div>
                            )}
                            {currentStep === 4 && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <FormInput label="মোবাইল নম্বর (Mobile Number)" name="phone" value={formData.phone} onChange={handleChange} required placeholder="01XXXXXXXXX" />
                                    <FormInput label="হোয়াটসঅ্যাপ নম্বর (WhatsApp Number)" name="whatsapp" value={formData.whatsapp} onChange={handleChange} required placeholder="01XXXXXXXXX" />
                                    <FormInput label="ফেসবুক প্রোফাইল লিংক (Facebook Profile Link)" name="facebook" value={formData.facebook} onChange={handleChange} required placeholder="https://facebook.com/yourprofile" />
                                </div>
                            )}
                            {currentStep === 5 && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput label="প্রথম পছন্দ (First Choice)" name="first_choice" type="select" value={formData.first_choice} onChange={handleChange} required><option value="">Select Department...</option>{departmentsList.map(d => <option key={d} value={d}>{d}</option>)}</FormInput>
                                        <FormInput label="দ্বিতীয় পছন্দ (Second Choice)" name="second_choice" type="select" value={formData.second_choice} onChange={handleChange}><option value="">Select Department...</option>{departmentsList.map(d => <option key={d} value={d}>{d}</option>)}</FormInput>
                                    </div>
                                    <FormInput label="কেন এই বিভাগে যুক্ত হতে চান? (Reason for Joining)" name="reason" type="textarea" value={formData.reason} onChange={handleChange} required />
                                    <FormInput label="বিশেষ দক্ষতা (Special Skills)" name="skills" type="textarea" value={formData.skills} onChange={handleChange} />
                                    <FormInput label="পূর্ব অভিজ্ঞতা (Past Experience)" name="experience" type="textarea" value={formData.experience} onChange={handleChange} />
                                    <FormInput label="শখ (Hobbies)" name="hobbies" value={formData.hobbies} onChange={handleChange} />
                                </div>
                            )}
                            {currentStep === 6 && (
                                <div className="animate-fade-in-up">
                                    {renderPaymentStep()}
                                    <div className="mt-8 p-4 bg-accent/10 rounded-xl border border-accent/20 text-center"><p className="text-sm">Please review all information before submitting.</p></div>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50/50 dark:bg-black/20 px-6 py-4 flex justify-between items-center border-t border-border-color backdrop-blur-sm">
                             <div className="text-text-secondary text-sm font-medium font-poppins">{currentStep}/6</div>
                            <div className="flex gap-4">
                                <button onClick={handleBack} disabled={currentStep === 1 || isSubmitting} className={`px-6 py-2 rounded-full font-semibold transition-all ${currentStep === 1 ? 'opacity-0 cursor-default' : 'bg-card-bg border border-border-color text-text-primary'}`}>পূর্ববর্তী (Back)</button>
                                {currentStep < 6 ? <button onClick={handleNext} disabled={currentStep === 1 && !regType} className="px-6 py-2 bg-accent text-accent-text font-bold rounded-full hover:bg-accent-hover shadow-md disabled:opacity-50">পরবর্তী (Next) &rarr;</button> : <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 shadow-md disabled:bg-slate-400">{isSubmitting ? 'Uploading & Submitting...' : 'জমা দিন (Submit)'}</button>}
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>
        </div>
    );
};

export default JoinPage;
