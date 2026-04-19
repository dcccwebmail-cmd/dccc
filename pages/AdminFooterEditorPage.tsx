import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { useData } from '../contexts/DataContext';
import { FooterData } from '../types';
import FormInput from '../components/admin/FormInput';
import { useToast } from '../contexts/ToastContext';

interface AdminFooterEditorPageProps {
  onLogout: () => void;
}

const AdminFooterEditorPage: React.FC<AdminFooterEditorPageProps> = ({ onLogout }) => {
  const { data, updateData, loading } = useData();
  const [footerData, setFooterData] = useState<FooterData | null>(data?.footer || null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FooterData, string>>>({});
  const { showToast } = useToast();

  useEffect(() => {
    if (data) {
      setFooterData(data.footer);
    }
  }, [data]);

  const validate = (): boolean => {
    if (!footerData) return false;
    const newErrors: Partial<Record<keyof FooterData, string>> = {};
    if (!footerData.footer_about.trim()) newErrors.footer_about = 'Footer about text is required.';
    if (!footerData.contact_email.trim()) newErrors.contact_email = 'Contact email is required.';
    if (!footerData.contact_phone.trim()) newErrors.contact_phone = 'Contact phone is required.';
    if (!footerData.address.trim()) newErrors.address = 'Address is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!footerData) return;
    const { name, value } = e.target;
    setFooterData({ ...footerData, [name]: value });
    if (errors[name as keyof FooterData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSocialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!footerData) return;
    setFooterData({ ...footerData, socials: { ...footerData.socials, [e.target.name]: e.target.value } });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        setIsSaving(true);
        await updateData({ footer: footerData! });
        setIsSaving(false);
        showToast('Footer updated successfully!');
    }
  };

  if (loading || !footerData) {
    return <AdminLayout onLogout={onLogout}><p>Loading footer data...</p></AdminLayout>;
  }

  return (
    <AdminLayout onLogout={onLogout}>
      <h1 className="text-3xl font-bold mb-6">Edit Footer</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-card-bg p-8 rounded-lg border border-border-color space-y-4">
            <FormInput label="Footer About Text" name="footer_about" value={footerData.footer_about} onChange={handleChange} type="textarea" required error={errors.footer_about} />
            <FormInput label="Contact Email" name="contact_email" value={footerData.contact_email} onChange={handleChange} required error={errors.contact_email} />
            <FormInput label="Contact Phone" name="contact_phone" value={footerData.contact_phone} onChange={handleChange} required error={errors.contact_phone} />
            <FormInput label="Address" name="address" value={footerData.address} onChange={handleChange} required error={errors.address} />
        </div>
        <div className="bg-card-bg p-8 rounded-lg border border-border-color space-y-4">
            <h2 className="text-xl font-semibold">Social Media Links</h2>
            <FormInput label="Facebook URL" name="facebook" value={footerData.socials.facebook || ''} onChange={handleSocialsChange} />
            <FormInput label="Instagram URL" name="instagram" value={footerData.socials.instagram || ''} onChange={handleSocialsChange} />
            <FormInput label="LinkedIn URL" name="linkedin" value={footerData.socials.linkedin || ''} onChange={handleSocialsChange} />
            <FormInput label="YouTube URL" name="youtube" value={footerData.socials.youtube || ''} onChange={handleSocialsChange} />
            <FormInput label="Email Action (e.g., mailto:info@dccc.com)" name="email" value={footerData.socials.email || ''} onChange={handleSocialsChange} />
        </div>
        <div className="pt-4">
            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
            {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminFooterEditorPage;
