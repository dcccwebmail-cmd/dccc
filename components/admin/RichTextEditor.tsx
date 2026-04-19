import React, { useEffect, useRef } from 'react';

declare global {
    interface Window { Quill: any; }
}

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    error?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, label, error }) => {
    const quillRef = useRef<any>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // Initialize Quill
    useEffect(() => {
        if (editorRef.current && !quillRef.current && window.Quill) {
            quillRef.current = new window.Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                    ]
                }
            });

            // Set initial value
            if (value) {
                quillRef.current.root.innerHTML = value;
            }

            // Listen for changes
            quillRef.current.on('text-change', (_delta: any, _oldDelta: any, source: string) => {
                if (source === 'user') {
                    // Only trigger change if initiated by user
                    onChange(quillRef.current.root.innerHTML);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount
    
    // Update Quill content if external value changes drastically (like a reset)
    // We avoid doing this on every render to prevent cursor jumping.
    useEffect(() => {
        if (quillRef.current) {
            const editorContent = quillRef.current.root.innerHTML;
            // Only update if the content is different (and not just slightly different due to Quill's normalization)
            // Or if value is explicitly empty (reset form)
            if (value === '' && editorContent !== '<p><br></p>') {
                 quillRef.current.root.innerHTML = '';
            } else if (value !== editorContent && !quillRef.current.hasFocus()) {
                 // Only update from props if the editor doesn't have focus, 
                 // otherwise we disrupt the user's typing.
                 quillRef.current.root.innerHTML = value;
            }
        }
    }, [value]);

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
            <div ref={editorRef} className="bg-background rounded-b-xl"></div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default RichTextEditor;