import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { useData } from '../contexts/DataContext';
import { HeroData } from '../types';
import FormInput from '../components/admin/FormInput';
import { useToast } from '../contexts/ToastContext';

interface AdminHeroEditorPageProps {
  onLogout: () => void;
}

const AdminHeroEditorPage: React.FC<AdminHeroEditorPageProps> = ({ onLogout }) => {
  const { data, updateData, loading } = useData();
  const [heroData, setHeroData] = useState<HeroData | null>(data?.hero || null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof HeroData, string>>>({});
  const { showToast } = useToast();

  useEffect(() => {
    if (data) {
      setHeroData(data.hero);
    }
  }, [data]);

  const validate = (): boolean => {
    if (!heroData) return false;
    const newErrors: Partial<Record<keyof HeroData, string>> = {};
    if (!heroData.hero_title.trim()) newErrors.hero_title = "Title is required.";
    if (!heroData.hero_subtitle.trim()) newErrors.hero_subtitle = "Subtitle is required.";
    if (!heroData.cta_primary_text.trim()) newErrors.cta_primary_text = "Primary button text is required.";
    if (!heroData.cta_primary_link.trim()) newErrors.cta_primary_link = "Primary button link is required.";
    if (!heroData.cta_secondary_text.trim()) newErrors.cta_secondary_text = "Secondary button text is required.";
    if (!heroData.cta_secondary_link.trim()) newErrors.cta_secondary_link = "Secondary button link is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!heroData) return;
    const { name, value } = e.target;
    setHeroData({ ...heroData, [name]: value });
    if (errors[name as keyof HeroData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSaving(true);
      await updateData({ hero: heroData! });
      setIsSaving(false);
      showToast('Hero section updated successfully!');
    }
  };

  if (loading || !heroData) {
    return <AdminLayout onLogout={onLogout}><p>Loading hero data...</p></AdminLayout>;
  }

  return (
    <AdminLayout onLogout={onLogout}>
      <h1 className="text-3xl font-bold mb-6">Edit Hero Section</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-card-bg p-8 rounded-lg border border-border-color">
        <FormInput
          label="Title (use a new line for the second part)"
          name="hero_title"
          type="textarea"
          value={heroData.hero_title}
          onChange={handleChange}
          required
          error={errors.hero_title}
        />
        <FormInput
          label="Subtitle"
          name="hero_subtitle"
          type="textarea"
          value={heroData.hero_subtitle}
          onChange={handleChange}
          required
          error={errors.hero_subtitle}
        />
        <FormInput
          label="Primary Button Text"
          name="cta_primary_text"
          value={heroData.cta_primary_text}
          onChange={handleChange}
          required
          error={errors.cta_primary_text}
        />
        <FormInput
          label="Primary Button Link"
          name="cta_primary_link"
          value={heroData.cta_primary_link}
          onChange={handleChange}
          required
          error={errors.cta_primary_link}
        />
        <FormInput
          label="Secondary Button Text"
          name="cta_secondary_text"
          value={heroData.cta_secondary_text}
          onChange={handleChange}
          required
          error={errors.cta_secondary_text}
        />
        <FormInput
          label="Secondary Button Link"
          name="cta_secondary_link"
          value={heroData.cta_secondary_link}
          onChange={handleChange}
          required
          error={errors.cta_secondary_link}
        />
        <div className="pt-4">
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminHeroEditorPage;