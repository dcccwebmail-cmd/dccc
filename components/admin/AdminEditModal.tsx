import React, { ReactNode } from 'react';

interface AdminEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  children: ReactNode;
}

const AdminEditModal: React.FC<AdminEditModalProps> = ({ isOpen, onClose, onSave, title, children }) => {
  if (!isOpen) return null;
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background/90 backdrop-blur-xl border border-border-color rounded-lg shadow-2xl max-w-2xl w-full m-4 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-border-color">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleFormSubmit}>
            <div className="p-6 overflow-y-auto">
              {children}
            </div>
            <div className="flex justify-end p-4 border-t border-border-color bg-black/5 dark:bg-black/20">
              <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-text-secondary rounded-md hover:bg-black/10 dark:hover:bg-white/10">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover">Save</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditModal;