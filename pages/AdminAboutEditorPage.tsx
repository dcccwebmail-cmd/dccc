import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { useData } from '../contexts/DataContext';
import { AboutData, AboutSection } from '../types';
import FormInput from '../components/admin/FormInput';
import { useToast } from '../contexts/ToastContext';

interface AdminAboutEditorPageProps {
  onLogout: () => void;
}

type AboutErrors = {
  main: Partial<Record<keyof Omit<AboutData, 'sections'>, string>>;
  sections: (Partial<Record<keyof AboutSection, string>> | null)[];
};

const AdminAboutEditorPage: React.FC<AdminAboutEditorPageProps> = ({ onLogout }) => {
  const { data, updateData, loading } = useData();
  const [aboutData, setAboutData] = useState<AboutData | null>(data?.about || null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<AboutErrors>({ main: {}, sections: [] });
  const { showToast } = useToast();

  useEffect(() => {
    if (data) {
      setAboutData(data.about);
    }
  }, [data]);

  const validate = (): boolean => {
    if (!aboutData) return false;
    const newErrors: AboutErrors = { main: {}, sections: [] };
    let isValid = true;

    if (!aboutData.preview_title?.trim()) { newErrors.main.preview_title = 'Preview title is required.'; isValid = false; }
    if (!aboutData.vision_tagline.trim()) { newErrors.main.vision_tagline = 'Vision tagline is required.'; isValid = false; }
    if (!aboutData.preview_image_url.trim()) { newErrors.main.preview_image_url = 'Preview image URL is required.'; isValid = false; }
    if (!aboutData.about_short.trim()) { newErrors.main.about_short = 'Short description is required.'; isValid = false; }
    if (aboutData.founded_year <= 1900) { newErrors.main.founded_year = 'Please enter a valid year.'; isValid = false; }

    aboutData.sections.forEach((section, index) => {
      const sectionErrors: Partial<Record<keyof AboutSection, string>> = {};
      if (!section.title.trim()) sectionErrors.title = 'Section title is required.';
      if (!section.description.trim()) sectionErrors.description = 'Section description is required.';
      if (!section.image_url.trim()) sectionErrors.image_url = 'Section image URL is required.';
      
      if (Object.keys(sectionErrors).length > 0) {
        newErrors.sections[index] = sectionErrors;
        isValid = false;
      } else {
        newErrors.sections[index] = null;
      }
    });

    setErrors(newErrors);
    return isValid;
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!aboutData) return;
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setAboutData({ ...aboutData, [name]: isNumber ? Number(value) : value });
  };

  const handleSectionChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!aboutData) return;
    const newSections = [...aboutData.sections];
    newSections[index] = { ...newSections[index], [e.target.name]: e.target.value };
    setAboutData({ ...aboutData, sections: newSections });
  };

  const addSection = () => {
    if (!aboutData) return;
    const newSection: AboutSection = { title: 'New Section', description: 'New description.', image_url: '' };
    setAboutData({ ...aboutData, sections: [...aboutData.sections, newSection] });
  };

  const removeSection = (index: number) => {
    if (!aboutData) return;
    if (window.confirm('Are you sure you want to delete this section?')) {
      const newSections = aboutData.sections.filter((_, i) => i !== index);
      setAboutData({ ...aboutData, sections: newSections });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSaving(true);
      await updateData({ about: aboutData! });
      setIsSaving(false);
      showToast('About page updated successfully!');
    }
  };

  if (loading || !aboutData) {
    return <AdminLayout onLogout={onLogout}><p>Loading about data...</p></AdminLayout>;
  }

  return (
    <AdminLayout onLogout={onLogout}>
      <h1 className="text-3xl font-bold mb-6">Edit About Page</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card-bg p-6 rounded-lg border border-border-color">
          <h2 className="text-xl font-semibold mb-4">Homepage Preview Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormInput label="Preview Title" name="preview_title" value={aboutData.preview_title || ''} onChange={handleChange} required error={errors.main.preview_title} />
            <FormInput label="Vision Tagline" name="vision_tagline" value={aboutData.vision_tagline} onChange={handleChange} required error={errors.main.vision_tagline} />
            <FormInput label="Preview Image URL" name="preview_image_url" value={aboutData.preview_image_url} onChange={handleChange} required error={errors.main.preview_image_url} />
            <div className="md:col-span-2">
              <FormInput label="About Short Description" name="about_short" value={aboutData.about_short} onChange={handleChange} type="textarea" required error={errors.main.about_short} />
            </div>
          </div>
        </div>

        <div className="bg-card-bg p-6 rounded-lg border border-border-color">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormInput label="Founded Year" name="founded_year" type="number" value={aboutData.founded_year} onChange={handleChange} required error={errors.main.founded_year} />
            <FormInput label="Prizes Won" name="prizes_won" type="number" value={aboutData.prizes_won} onChange={handleChange} />
            <FormInput label="Total Departments" name="total_departments" type="number" value={aboutData.total_departments} onChange={handleChange} />
          </div>
        </div>

        <div className="bg-card-bg p-6 rounded-lg border border-border-color">
          <h2 className="text-xl font-semibold mb-4">Detailed Sections (About Page)</h2>
          <div className="space-y-6">
            {aboutData.sections.map((section, index) => (
              <div key={index} className="border border-border-color p-4 rounded-md relative">
                <button type="button" onClick={() => removeSection(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold">✕</button>
                <FormInput label={`Section ${index + 1} Title`} name="title" value={section.title} onChange={(e) => handleSectionChange(index, e)} required error={errors.sections[index]?.title} />
                <FormInput label={`Section ${index + 1} Image URL`} name="image_url" value={section.image_url} onChange={(e) => handleSectionChange(index, e)} required error={errors.sections[index]?.image_url} />
                <FormInput label={`Section ${index + 1} Description`} name="description" value={section.description} onChange={(e) => handleSectionChange(index, e)} type="textarea" required error={errors.sections[index]?.description} />
              </div>
            ))}
          </div>
          <button type="button" onClick={addSection} className="mt-4 px-4 py-2 border border-dashed border-accent text-accent font-semibold rounded-md hover:bg-accent/10 transition-colors">
            + Add Section
          </button>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminAboutEditorPage;
