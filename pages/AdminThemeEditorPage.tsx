import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { useData } from '../contexts/DataContext';
import { ThemeColors, ThemeColorSet } from '../types';
import { palettes } from '../services/themePalettes';
import { useToast } from '../contexts/ToastContext';

interface AdminThemeEditorPageProps {
  onLogout: () => void;
}

const ColorInput: React.FC<{ label: string; name: keyof ThemeColorSet; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, name, value, onChange }) => (
  <div className="flex items-center justify-between">
    <label htmlFor={name} className="text-sm font-medium text-text-secondary">{label}</label>
    <div className="flex items-center gap-2 border border-border-color rounded-md px-2">
       <input
        type="text"
        name={name}
        id={`${name}-text`}
        value={value}
        onChange={onChange}
        className="w-40 py-1 bg-transparent focus:outline-none"
      />
      <input
        type="color"
        name={name}
        id={name}
        value={value.startsWith('rgba') ? '#ffffff' : value} // Color input doesn't support rgba well
        onChange={onChange}
        className="w-8 h-8 p-0 border-none bg-transparent"
      />
    </div>
  </div>
);

const AdminThemeEditorPage: React.FC<AdminThemeEditorPageProps> = ({ onLogout }) => {
  const { data, updateData, loading } = useData();
  const [themeColors, setThemeColors] = useState<ThemeColors | null>(data?.themeColors || null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'light' | 'dark'>('light');
  const { showToast } = useToast();

  useEffect(() => {
    if (data) {
      setThemeColors(data.themeColors);
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!themeColors) return;
    const { name, value } = e.target;
    setThemeColors({
      ...themeColors,
      [activeTab]: {
        ...themeColors[activeTab],
        [name]: value,
      },
    });
  };

  const handlePaletteApply = (palette: ThemeColorSet) => {
    if (!themeColors) return;
    setThemeColors({
      ...themeColors,
      [activeTab]: {
        ...palette,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (themeColors) {
      setIsSaving(true);
      await updateData({ themeColors: themeColors });
      setIsSaving(false);
      showToast('Theme colors updated successfully!');
    }
  };

  if (loading || !themeColors) {
    return <AdminLayout onLogout={onLogout}><p>Loading theme data...</p></AdminLayout>;
  }

  const currentThemeSet = themeColors[activeTab];

  return (
    <AdminLayout onLogout={onLogout}>
      <h1 className="text-3xl font-bold mb-6">Edit Website Theme</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="border-b border-border-color mb-6">
          <nav className="flex space-x-4">
            <button type="button" onClick={() => setActiveTab('light')} className={`py-2 px-4 font-semibold ${activeTab === 'light' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}>
              Light Theme
            </button>
            <button type="button" onClick={() => setActiveTab('dark')} className={`py-2 px-4 font-semibold ${activeTab === 'dark' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}>
              Dark Theme
            </button>
          </nav>
        </div>
        
        <div className="bg-card-bg p-6 rounded-lg border border-border-color mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Palettes</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {palettes.map((palette) => (
                    <button
                        key={palette.name}
                        type="button"
                        onClick={() => handlePaletteApply(palette[activeTab])}
                        className="p-3 border border-border-color rounded-lg text-left hover:border-accent transition-colors"
                    >
                        <p className="font-semibold text-sm mb-2">{palette.name}</p>
                        <div className="flex gap-1">
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: palette[activeTab].background, border: `1px solid ${palette[activeTab].border_color}` }}></div>
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: palette[activeTab].text_primary }}></div>
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: palette[activeTab].accent }}></div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-card-bg p-6 rounded-lg border border-border-color space-y-4">
            <h2 className="text-xl font-semibold mb-4">Manual Colors</h2>
            <ColorInput label="Background" name="background" value={currentThemeSet.background} onChange={handleChange} />
            <ColorInput label="Primary Text" name="text_primary" value={currentThemeSet.text_primary} onChange={handleChange} />
            <ColorInput label="Secondary Text" name="text_secondary" value={currentThemeSet.text_secondary} onChange={handleChange} />
            <ColorInput label="Accent" name="accent" value={currentThemeSet.accent} onChange={handleChange} />
            <ColorInput label="Accent Hover" name="accent_hover" value={currentThemeSet.accent_hover} onChange={handleChange} />
            <ColorInput label="Accent Text" name="accent_text" value={currentThemeSet.accent_text} onChange={handleChange} />
            <ColorInput label="Card Background" name="card_bg" value={currentThemeSet.card_bg} onChange={handleChange} />
            <ColorInput label="Border Color" name="border_color" value={currentThemeSet.border_color} onChange={handleChange} />
        </div>

        <div className="pt-6">
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
            {isSaving ? 'Saving...' : 'Save Theme Colors'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminThemeEditorPage;