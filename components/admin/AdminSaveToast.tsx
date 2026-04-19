import React from 'react';
import { useToast } from '../../contexts/ToastContext';

const AdminSaveToast: React.FC = () => {
  const { toastMessage, isToastVisible, toastType } = useToast();

  const isSuccess = toastType === 'success';

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out ${
        isToastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className={`flex items-center gap-3 text-white font-semibold py-3 px-6 rounded-full shadow-lg ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}>
        {isSuccess ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )}
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};

export default AdminSaveToast;