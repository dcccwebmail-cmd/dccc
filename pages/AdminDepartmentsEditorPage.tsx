import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { useData } from '../contexts/DataContext';
import { Department } from '../types';
import AdminEditModal from '../components/admin/AdminEditModal';
import FormInput from '../components/admin/FormInput';
import * as Icons from '../components/icons/DepartmentIcons';
import { GripVerticalIcon } from '../components/icons/MiscIcons';
import { useToast } from '../contexts/ToastContext';

const iconNames = Object.keys(Icons).filter(key => key !== 'default');

interface AdminDepartmentsEditorPageProps {
  onLogout: () => void;
}

const AdminDepartmentsEditorPage: React.FC<AdminDepartmentsEditorPageProps> = ({ onLogout }) => {
  const { data, updateData, loading } = useData();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Department, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isOrderDirty, setIsOrderDirty] = useState(false);
  const { showToast } = useToast();
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (data?.departments) {
      setDepartments([...data.departments].sort((a, b) => a.order - b.order));
    }
  }, [data]);

  const openModal = (dept: Department | null) => {
    setErrors({});
    const newDeptOrder = departments.length > 0 ? Math.max(...departments.map(d => d.order)) + 1 : 1;
    setEditingDept(dept ? { ...dept } : { id: ``, name: '', short_description: '', icon_url: iconNames[0], full_description: '', key_points: [], order: newDeptOrder });
    setIsModalOpen(true);
  };

  const validate = (): boolean => {
    if (!editingDept) return false;
    const newErrors: Partial<Record<keyof Department, string>> = {};

    if (!editingDept.id.trim()) newErrors.id = 'ID is required.';
    else if (!/^[a-z0-9-]+$/.test(editingDept.id)) newErrors.id = 'ID must be lowercase with no spaces (hyphens allowed).';
    if (!editingDept.name.trim()) newErrors.name = 'Name is required.';
    if (!editingDept.short_description.trim()) newErrors.short_description = 'Short description is required.';
    if (!editingDept.full_description.trim()) newErrors.full_description = 'Full description is required.';
    if (editingDept.order === null || isNaN(editingDept.order)) newErrors.order = 'Order must be a number.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!editingDept || !validate()) return;

    const newDepartments = departments.some(d => d.id === editingDept.id)
      ? departments.map(d => (d.id === editingDept.id ? editingDept : d))
      : [...departments, editingDept];
    
    setIsSaving(true);
    await updateData({ departments: newDepartments.sort((a,b) => a.order - b.order) });
    setIsSaving(false);
    showToast('Department saved successfully!');

    setIsModalOpen(false);
    setEditingDept(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
        const newDepartments = departments.filter(d => d.id !== id);
        setIsSaving(true);
        await updateData({ departments: newDepartments });
        setIsSaving(false);
        showToast('Department deleted.');
    }
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newDepartmentsList = [...departments];
    const dragItemContent = newDepartmentsList[dragItem.current];
    newDepartmentsList.splice(dragItem.current, 1);
    newDepartmentsList.splice(dragOverItem.current, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    
    const reorderedDepartments = newDepartmentsList.map((dept, index) => ({ ...dept, order: index + 1 }));
    setDepartments(reorderedDepartments);
    setIsOrderDirty(true);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    await updateData({ departments });
    setIsSaving(false);
    setIsOrderDirty(false);
    showToast('Department order has been saved!');
  };
  
  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingDept) return;
    const { name, value, type } = e.target;
    
    // Check if the input is a number input
    const isNumberInput = type === 'number';
    
    setEditingDept({
      ...editingDept,
      [name]: isNumberInput ? parseInt(value, 10) : value
    });
  };

  const handleKeyPointsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
     if (!editingDept) return;
     const points = e.target.value.split(',').map(p => p.trim()).filter(Boolean);
     setEditingDept({...editingDept, key_points: points});
  }


  if (loading) {
    return <AdminLayout onLogout={onLogout}><p>Loading departments...</p></AdminLayout>;
  }

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Manage Departments</h1>
        <div>
          {isOrderDirty && (
            <button onClick={handleSaveOrder} disabled={isSaving} className="px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors mr-2 disabled:bg-slate-400">
              {isSaving ? 'Saving...' : 'Save Order'}
            </button>
          )}
          <button onClick={() => openModal(null)} className="px-4 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover transition-colors">
            + Add Department
          </button>
        </div>
      </div>

      <div className="bg-card-bg p-4 rounded-lg border border-border-color">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, index) => (
            <div 
              key={dept.id} 
              className="border border-border-color rounded-md p-4 flex items-start gap-2 cursor-grab active:cursor-grabbing bg-background"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <GripVerticalIcon className="w-6 h-6 text-text-secondary flex-shrink-0 mt-1" />
              <div className="flex-grow flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-lg">{dept.order}. {dept.name}</h3>
                    <p className="text-sm text-text-secondary">{dept.short_description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button onClick={() => openModal(dept)} className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600">Edit</button>
                    <button onClick={() => handleDelete(dept.id)} className="text-sm bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Delete</button>
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} title={editingDept?.name ? 'Edit Department' : 'Add Department'}>
        {editingDept && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <FormInput label="ID (unique, lowercase, no spaces)" name="id" value={editingDept.id} onChange={handleModalChange} required error={errors.id} />
            <FormInput label="Name" name="name" value={editingDept.name} onChange={handleModalChange} required error={errors.name} />
            <FormInput label="Short Description" name="short_description" value={editingDept.short_description} onChange={handleModalChange} type="textarea" required error={errors.short_description} />
            <FormInput label="Full Description" name="full_description" value={editingDept.full_description} onChange={handleModalChange} type="textarea" required error={errors.full_description} />
            <FormInput label="Key Points (comma-separated)" name="key_points" value={(editingDept.key_points || []).join(', ')} onChange={handleKeyPointsChange} type="textarea" />
            <FormInput label="Order" name="order" type="number" value={editingDept.order} onChange={handleModalChange} required error={errors.order} />
             <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Icon</label>
                <select name="icon_url" value={editingDept.icon_url} onChange={handleModalChange} className="block w-full px-3 py-2 bg-background border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent">
                    {iconNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
            </div>
          </div>
        )}
      </AdminEditModal>

    </AdminLayout>
  );
};

export default AdminDepartmentsEditorPage;