import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { useData } from '../contexts/DataContext';
import { JoinContent } from '../types';
import RichTextEditor from '../components/admin/RichTextEditor';
import { useToast } from '../contexts/ToastContext';

interface AdminJoinEditorPageProps {
  onLogout: () => void;
}

const AdminJoinEditorPage: React.FC<AdminJoinEditorPageProps> = ({ onLogout }) => {
  const { data, updateData, loading } = useData();
  const [joinContent, setJoinContent] = useState<JoinContent | null>(data?.join || null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (data) {
      setJoinContent(data.join);
    }
  }, [data]);

  const handleChange = (value: string) => {
    if (!joinContent) return;
    setJoinContent({ ...joinContent, description: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinContent) {
      setIsSaving(true);
      await updateData({ join: joinContent });
      setIsSaving(false);
      showToast('Join page content updated successfully!');
    }
  };

  if (loading || !joinContent) {
    return <AdminLayout onLogout={onLogout}><p>Loading content...</p></AdminLayout>;
  }

  return (
    <AdminLayout onLogout={onLogout}>
      <h1 className="text-3xl font-bold mb-6">Edit Join Page Content</h1>
      <form onSubmit={handleSubmit} className="max-w-4xl bg-card-bg p-8 rounded-lg border border-border-color">
        <RichTextEditor
            label="Registration Description (Step 1)"
            value={joinContent.description}
            onChange={handleChange}
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

export default AdminJoinEditorPage;