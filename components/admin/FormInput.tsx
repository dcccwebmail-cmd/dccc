import React from 'react';

interface FormInputProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: 'text' | 'number' | 'textarea' | 'datetime-local' | 'select' | 'date' | 'email' | 'password';
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  placeholder?: string;
  children?: React.ReactNode; // For select options
}

const FormInput: React.FC<FormInputProps> = ({ label, name, value, onChange, type = 'text', required = false, disabled = false, error = null, placeholder, children }) => {
  const commonProps = {
    name,
    id: name,
    value,
    onChange,
    required,
    disabled,
    placeholder,
    className: `block w-full px-4 py-3 bg-background border rounded-xl shadow-sm focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border-color focus:border-accent focus:ring-accent'} ${disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed' : ''} transition-all duration-200`
  };

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-text-secondary mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea {...commonProps} rows={4} />
      ) : type === 'select' ? (
        <select {...commonProps}>{children}</select>
      ) : (
        <input {...commonProps} type={type} />
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FormInput;