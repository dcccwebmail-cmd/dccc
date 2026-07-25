import React, { useState } from 'react';
import { MediaBrowser } from './MediaLibrary';

interface ImageInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  required?: boolean;
  error?: string | null;
  placeholder?: string;
}

const ImageInput: React.FC<ImageInputProps> = ({ label, name, value, onChange, required = false, error = null, placeholder }) => {
  const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);

  const handleSelect = (url: string) => {
    onChange({ target: { name, value: url } });
    setIsMediaBrowserOpen(false);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {value && (
            <div className="relative group">
                <img src={value} alt="Preview" className="w-20 h-20 object-cover rounded shadow-sm border border-border-color" />
                <button 
                    type="button"
                    onClick={() => onChange({ target: { name, value: '' } })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    title="Remove Image"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        )}
        <div className="flex-1 w-full">
             <input
                type="text"
                name={name}
                id={name}
                value={value}
                onChange={(e) => onChange({ target: { name, value: e.target.value } })}
                placeholder={placeholder || "Enter image URL or select from media library"}
                className={`block w-full px-4 py-3 bg-background border rounded-xl shadow-sm focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border-color focus:border-accent focus:ring-accent'} transition-all duration-200 mb-2`}
             />
             <button 
                type="button" 
                onClick={() => setIsMediaBrowserOpen(true)}
                className="px-4 py-2 bg-accent text-white font-medium rounded-md hover:bg-accent-hover transition-colors whitespace-nowrap shadow-sm"
             >
                {value ? 'Change Image' : 'Select or Upload Image'}
             </button>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      
      {isMediaBrowserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
              <div className="bg-card-bg w-full max-w-5xl rounded-lg shadow-xl border border-border-color flex flex-col max-h-[90vh]">
                  <div className="flex items-center justify-between p-4 border-b border-border-color bg-background rounded-t-lg">
                      <h3 className="text-lg font-bold text-text-primary">Select Image</h3>
                      <button type="button" onClick={() => setIsMediaBrowserOpen(false)} className="text-text-secondary hover:text-red-500">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                      <MediaBrowser pickerMode onSelect={handleSelect} />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ImageInput;
