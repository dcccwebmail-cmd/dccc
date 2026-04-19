import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { useData } from '../contexts/DataContext';
import { Moderator, Executive, SocialLinks } from '../types';
import AdminEditModal from '../components/admin/AdminEditModal';
import FormInput from '../components/admin/FormInput';
import Accordion from '../components/ui/Accordion';
import { useToast } from '../contexts/ToastContext';
import { MediaBrowser } from '../components/admin/MediaLibrary';

type EditableMember = Moderator | Executive;

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 5 - i);
const bloodGroups: (Executive['blood_group'])[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const religions: (Executive['religion'])[] = ['Islam', 'Hinduism', 'Buddhism', 'Christianity', 'Other'];
const panelTypes: (Executive['panel_type'])[] = ['Presidency', 'Secretariat', 'Executive'];
const presidencyPositions = ['President', 'Vice President', 'General Secretary'];
const secretariatPositions = ['Operating Secretary', 'Joint Secretary', 'IT Secretary', 'Financial Secretary'];
const moderatorRoles: (Moderator['role'])[] = ['Moderator', 'Convenor'];

interface AdminPanelsEditorPageProps {
  onLogout: () => void;
}

const AdminPanelsEditorPage: React.FC<AdminPanelsEditorPageProps> = ({ onLogout }) => {
  // Fix: Add restoreBackup and checkBackup to the useData destructuring
  const { data, updateData, loading, migrateExecutives, checkMigrationNeeded, restoreBackup, checkBackup } = useData();
  const [activeTab, setActiveTab] = useState('Teachers Panel');
  
  const [moderators, setModerators] = useState<Moderator[]>(data?.moderators || []);
  const [executives, setExecutives] = useState<Executive[]>(data?.executives || []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EditableMember | null>(null);
  const [memberType, setMemberType] = useState<'Moderator' | 'Executive' | null>(null);
  const [errors, setErrors] = useState<Partial<EditableMember>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [panelStatus, setPanelStatus] = useState<'loading'|'ok'|'migration_needed'|'backup_available'|'empty'>('loading');
  const { showToast } = useToast();

  useEffect(() => {
    if (data) {
      setModerators(data.moderators);
      setExecutives(data.executives);
    }
  }, [data]);

  useEffect(() => {
      const checkStatus = async () => {
          const migrationNeeded = await checkMigrationNeeded();
          if (migrationNeeded) {
              setPanelStatus('migration_needed');
              return;
          }
          const backupExists = await checkBackup();
          if (backupExists) {
              setPanelStatus('backup_available');
              return;
          }
          if (data?.executives && data.executives.length === 0) {
              setPanelStatus('empty');
          } else {
              setPanelStatus('ok');
          }
      };

      if (!loading) {
          checkStatus();
      }
  }, [checkMigrationNeeded, checkBackup, data?.executives, loading]);
  
  const handleSocialsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, currentSocials?: SocialLinks) => {
     if (!editingMember) return;
     const newSocials = { ...currentSocials, [e.target.name]: e.target.value };
     setEditingMember({ ...editingMember, socials: newSocials });
  };

  const openModal = (member: EditableMember | null, type: 'Moderator' | 'Executive') => {
    setErrors({});
    setMemberType(type);
    if (type === 'Moderator') {
        setEditingMember(member ? { ...member } : { id: `mod-${Date.now()}`, name: '', designation: '', image_url: '', quote: '', socials: {}, role: 'Moderator' });
    } else { // Executive
        setEditingMember(member ? { ...member } : { id: `exec-${Date.now()}`, name: '', dccc_id: 'DCCC-', phone: '', position: 'Executive', image_url: '', department: '', bio: '', year: new Date().getFullYear(), panel_type: 'Executive', socials: {} });
    }
    setIsModalOpen(true);
  };
  
  const validate = (): boolean => {
    if (!editingMember) return false;
    const newErrors: Partial<EditableMember> = {};
    if (!editingMember.name.trim()) newErrors.name = 'Name is required.';

    if (memberType === 'Moderator') {
      const mod = editingMember as Moderator;
      if (!mod.designation.trim()) (newErrors as Partial<Moderator>).designation = 'Designation is required.';
      if (!mod.quote.trim()) (newErrors as Partial<Moderator>).quote = 'Quote is required.';
    } else if (memberType === 'Executive') {
      const exec = editingMember as Executive;
      if (!exec.position.trim()) (newErrors as Partial<Executive>).position = 'Position is required.';
      if (exec.panel_type === 'Executive' && !exec.department.trim()) {
        (newErrors as Partial<Executive>).department = 'Department is required for Executive members.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModalSave = () => {
    if (!editingMember || !validate()) return;
    
    if (memberType === 'Moderator') {
      const newMods = moderators.some(m => m.id === editingMember.id)
        ? moderators.map(m => (m.id === (editingMember as Moderator).id ? (editingMember as Moderator) : m))
        : [...moderators, editingMember as Moderator];
      setModerators(newMods);
    } else if (memberType === 'Executive') {
      const newExecs = executives.some(e => e.id === editingMember.id)
        ? executives.map(e => (e.id === (editingMember as Executive).id ? (editingMember as Executive) : e))
        : [...executives, editingMember as Executive];
      setExecutives(newExecs);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, type: 'Moderator' | 'Executive') => {
    if (window.confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)) {
      if (type === 'Moderator') {
        setModerators(moderators.filter(m => m.id !== id));
      } else {
        setExecutives(executives.filter(e => e.id !== id));
      }
    }
  };

  const saveAllChanges = async () => {
    if (data) {
        setIsSaving(true);
        await updateData({ moderators, executives });
        setIsSaving(false);
        showToast('All panel data saved!');
    }
  };
  
  const executivesByYear = useMemo(() => {
    return executives.reduce((acc, exec) => {
        (acc[exec.year] = acc[exec.year] || []).push(exec);
        return acc;
    }, {} as Record<number, Executive[]>);
  }, [executives]);

  const sortedYears = Object.keys(executivesByYear).map(Number).sort((a, b) => b - a);
  
  const handleMigration = async () => {
    const confirmed = window.confirm("This will permanently move your old panel data from the `executives` collection to the new `panels` collection. This is a safe, one-time process. Do you want to continue?");
    if (!confirmed) {
        showToast('Migration cancelled.', 'error');
        return;
    }

    setIsMigrating(true);
    try {
        const stats = await migrateExecutives();
        showToast(`Migration successful! Migrated ${stats.migrated} members. Total is now ${stats.total}.`);
    } catch (error) {
        console.error("Migration failed:", error);
        showToast('Migration failed. Please check the console for details.', 'error');
    } finally {
        setIsMigrating(false);
    }
  };
  
  const handleRestore = async () => {
      const confirmed = window.confirm("This will merge data from the `executives_backup` collection into your current panels. Do you want to continue?");
      if (!confirmed) {
          showToast('Restore cancelled.', 'error');
          return;
      }
      setIsMigrating(true);
      try {
          const stats = await restoreBackup();
          showToast(`Restore successful! Restored ${stats.restored} members. Total is now ${stats.total}.`);
      } catch (error) {
          console.error("Restore failed:", error);
          showToast('Restore failed. Please check the console for details.', 'error');
      } finally {
          setIsMigrating(false);
      }
  };

  if (loading || !data) {
    return <AdminLayout onLogout={onLogout}><p>Loading panels data...</p></AdminLayout>;
  }

  const handleMemberFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingMember) return;
    const { name, value } = e.target;
    let updatedMember = { ...editingMember, [name]: value };

    if (name === 'panel_type' && 'position' in updatedMember) {
        if (value === 'Executive') {
            updatedMember.position = 'Executive';
            updatedMember.department = '';
        } else {
            updatedMember.position = '';
            updatedMember.department = '';
        }
    }
    setEditingMember(updatedMember as EditableMember);
  };

  const handleImageSelect = (url: string) => {
      if (!editingMember) return;
      setEditingMember({ ...editingMember, image_url: url } as EditableMember);
      setIsMediaBrowserOpen(false);
  };

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Panels</h1>
        <button onClick={saveAllChanges} disabled={isSaving} className="px-6 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover transition-colors disabled:bg-slate-400">
            {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="border-b border-border-color mb-6">
          <nav className="flex space-x-4">
              {['Teachers Panel', 'Executives'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-4 font-semibold ${activeTab === tab ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}>
                      {tab}
                  </button>
              ))}
          </nav>
      </div>

      {activeTab === 'Teachers Panel' && (
        <div>
          <button onClick={() => openModal(null, 'Moderator')} className="mb-4 px-4 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover transition-colors">+ Add Teacher/Moderator</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moderators.map(mod => (
              <div key={mod.id} className="border border-border-color p-4 rounded-md bg-card-bg">
                <div className="flex items-center space-x-4 mb-3">
                  {mod.image_url ? (
                      <img src={mod.image_url} alt={mod.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-xs">No img</div>
                  )}
                  <div>
                    <h3 className="font-bold">{mod.name}</h3>
                    <p className="text-sm text-accent font-semibold">{mod.role}</p>
                    <p className="text-sm text-text-secondary">{mod.designation}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button onClick={() => openModal(mod, 'Moderator')} className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md">Edit</button>
                  <button onClick={() => handleDelete(mod.id, 'Moderator')} className="text-sm bg-red-500 text-white px-3 py-1 rounded-md">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Executives' && (
        <div>
            {panelStatus === 'migration_needed' && (
               <div className="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 rounded-r-lg mb-6" role="alert">
                  <p className="font-bold">Data Migration Required</p>
                  <p className="text-sm">We've detected panel members in your old `executives` collection. Click the button below to automatically move them to the new, more organized `panels` collection. This is a safe, one-time process.</p>
                  <button onClick={handleMigration} disabled={isMigrating} className="mt-3 px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition-colors disabled:bg-slate-400">
                    {isMigrating ? 'Migrating...' : 'Migrate Old Panel Data'}
                  </button>
                </div>
            )}
            {panelStatus === 'backup_available' && (
                <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 rounded-r-lg mb-6" role="alert">
                    <p className="font-bold">Backup Found</p>
                    <p className="text-sm">We found a backup of your old executive data (`executives_backup`). You can restore it to merge the members with your current panel. This backup will be removed after a successful restore.</p>
                    <button onClick={handleRestore} disabled={isMigrating} className="mt-3 px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors disabled:bg-slate-400">
                        {isMigrating ? 'Restoring...' : 'Restore from Backup'}
                    </button>
                </div>
            )}
             {panelStatus === 'empty' && (
                <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 rounded-r-lg mb-6" role="alert">
                    <p className="font-bold">No Executive Members Found</p>
                    <p className="text-sm">The database is empty. Please start building your panels by clicking the "+ Add Executive" button below.</p>
                </div>
            )}
           <button onClick={() => openModal(null, 'Executive')} className="mb-4 px-4 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover transition-colors">+ Add Executive</button>
           <div className="space-y-4">
              {sortedYears.map(year => (
                  <Accordion key={year} title={`Panel of ${year} (${executivesByYear[year].length} members)`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {executivesByYear[year].map(exec => (
                              <div key={exec.id} className="border border-border-color p-4 rounded-md bg-card-bg flex flex-col justify-between">
                                <div className="flex items-center space-x-4 mb-3">
                                  {exec.image_url ? (
                                      <img src={exec.image_url} alt={exec.name} className="w-12 h-12 rounded-full object-cover" />
                                  ) : (
                                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-xs">No img</div>
                                  )}
                                  <div>
                                      <h3 className="font-bold leading-tight">{exec.name}</h3>
                                      <p className="text-sm text-text-secondary">{exec.position}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <button onClick={() => openModal(exec, 'Executive')} className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md">Edit</button>
                                    <button onClick={() => handleDelete(exec.id, 'Executive')} className="text-sm bg-red-500 text-white px-3 py-1 rounded-md">Delete</button>
                                </div>
                              </div>
                          ))}
                      </div>
                  </Accordion>
              ))}
           </div>
        </div>
      )}

       <AdminEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleModalSave} title={`Edit ${memberType}`}>
            {editingMember && (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                    <FormInput label="Name" name="name" value={editingMember.name} onChange={handleMemberFieldChange} required error={errors.name} />
                    
                    {memberType === 'Executive' && 'dccc_id' in editingMember &&
                      <FormInput label="DCCC ID (Optional)" name="dccc_id" value={editingMember.dccc_id || ''} onChange={handleMemberFieldChange} />
                    }
                    {memberType === 'Executive' && 'phone' in editingMember &&
                      <FormInput label="Phone (Optional)" name="phone" value={editingMember.phone || ''} onChange={handleMemberFieldChange} />
                    }

                    <div className="flex flex-col space-y-1">
                        <label className="block text-sm font-medium text-text-secondary">Image</label>
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            {editingMember.image_url ? (
                                <div className="relative group">
                                    <img src={editingMember.image_url} alt="Preview" className="w-20 h-20 object-cover rounded shadow-sm border border-border-color" />
                                    <button 
                                        type="button"
                                        onClick={() => handleMemberFieldChange({ target: { name: 'image_url', value: '' } } as any)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                        title="Remove Image"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded border border-dashed border-border-color flex items-center justify-center text-slate-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            )}
                            <button 
                                type="button" 
                                onClick={() => setIsMediaBrowserOpen(true)}
                                className="px-4 py-2 bg-accent text-white font-medium rounded-md hover:bg-accent-hover transition-colors whitespace-nowrap shadow-sm"
                            >
                                {editingMember.image_url ? 'Change Image' : 'Select or Upload Image'}
                            </button>
                        </div>
                    </div>
                    
                    {memberType === 'Moderator' && 'designation' in editingMember &&
                        <>
                            <FormInput label="Role" name="role" type="select" value={editingMember.role} onChange={handleMemberFieldChange} required>
                                {moderatorRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            </FormInput>
                            <FormInput label="Designation" name="designation" value={editingMember.designation} onChange={handleMemberFieldChange} required error={(errors as Partial<Moderator>).designation} />
                            <FormInput label="Quote" name="quote" value={editingMember.quote} onChange={handleMemberFieldChange} type="textarea" required error={(errors as Partial<Moderator>).quote} />
                        </>
                    }
                    
                    {memberType === 'Executive' && 'position' in editingMember &&
                        <>
                             <FormInput label="Panel Type" name="panel_type" type="select" value={editingMember.panel_type} onChange={handleMemberFieldChange} required>
                                {panelTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                            </FormInput>

                            {editingMember.panel_type === 'Executive' ? (
                                <div>
                                    <FormInput label="Position" name="position" value="Executive" onChange={() => {}} disabled />
                                    <FormInput label="Department" name="department" type="select" value={editingMember.department} onChange={handleMemberFieldChange} required error={(errors as Partial<Executive>).department}>
                                        <option value="">Select Department...</option>
                                        {data.departments.sort((a,b) => a.order - b.order).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                    </FormInput>
                                </div>
                            ) : (
                                <FormInput label="Position" name="position" type="select" value={editingMember.position} onChange={handleMemberFieldChange} required error={(errors as Partial<Executive>).position}>
                                    <option value="">Select Position...</option>
                                    {(editingMember.panel_type === 'Presidency' ? presidencyPositions : secretariatPositions).map(p => <option key={p} value={p}>{p}</option>)}
                                </FormInput>
                            )}

                            <FormInput label="Bio (Optional)" name="bio" value={editingMember.bio} onChange={handleMemberFieldChange} type="textarea" />
                             <FormInput label="Year" name="year" type="select" value={editingMember.year} onChange={e => handleMemberFieldChange(e)} required>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </FormInput>
                             <FormInput label="Blood Group" name="blood_group" type="select" value={editingMember.blood_group || ''} onChange={handleMemberFieldChange}>
                                <option value="">Select...</option>
                                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </FormInput>
                             <FormInput label="Religion" name="religion" type="select" value={editingMember.religion || ''} onChange={handleMemberFieldChange}>
                                 <option value="">Select...</option>
                                {religions.map(r => <option key={r} value={r}>{r}</option>)}
                            </FormInput>
                        </>
                    }

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Social Links</h4>
                      <FormInput label="Facebook URL" name="facebook" value={editingMember.socials?.facebook || ''} onChange={e => handleSocialsChange(e, editingMember.socials)} />
                      <FormInput label="Instagram URL" name="instagram" value={editingMember.socials?.instagram || ''} onChange={e => handleSocialsChange(e, editingMember.socials)} />
                      <FormInput label="LinkedIn URL" name="linkedin" value={editingMember.socials?.linkedin || ''} onChange={e => handleSocialsChange(e, editingMember.socials)} />
                      <FormInput label="Email Address" name="email" value={editingMember.socials?.email || ''} onChange={e => handleSocialsChange(e, editingMember.socials)} />
                    </div>
                </div>
            )}
       </AdminEditModal>

       {/* Media Browser Modal */}
       {isMediaBrowserOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
               <div className="bg-card-bg w-full max-w-5xl rounded-lg shadow-xl border border-border-color flex flex-col max-h-[90vh]">
                   <div className="flex items-center justify-between p-4 border-b border-border-color bg-background rounded-t-lg">
                       <h3 className="text-lg font-bold text-text-primary">Select Image</h3>
                       <button onClick={() => setIsMediaBrowserOpen(false)} className="text-text-secondary hover:text-red-500">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                   </div>
                   <div className="flex-1 overflow-auto p-4">
                       <MediaBrowser pickerMode onSelect={handleImageSelect} />
                   </div>
               </div>
           </div>
       )}
    </AdminLayout>
  );
};

export default AdminPanelsEditorPage;
