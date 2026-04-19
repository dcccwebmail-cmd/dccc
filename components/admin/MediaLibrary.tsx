import React, { useState, useEffect } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import { Trash2, Copy, Image as ImageIcon, Folder, Loader2, ChevronRight, Edit2, Check, X, FolderPlus } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';
const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '';

const authenticator = async () => {
    try {
        const response = await fetch('/api/imagekit/auth');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        const { signature, expire, token } = data;
        return { signature, expire, token };
    } catch (error: any) {
        throw new Error(`Authentication request failed: ${error.message}`);
    }
};

export interface MediaFile {
    fileId: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    folder: string;
    filePath: string;
    size: number;
    createdAt: string;
}

interface MediaBrowserProps {
    onSelect?: (url: string) => void;
    pickerMode?: boolean;
}

export const MediaBrowser: React.FC<MediaBrowserProps> = ({ onSelect, pickerMode = false }) => {
    const { showToast } = useToast();
    const [allFiles, setAllFiles] = useState<MediaFile[]>([]);
    const [folders, setFolders] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('/');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Rename state
    const [editingFileId, setEditingFileId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const isConfigured = Boolean(urlEndpoint && publicKey);

    const fetchAllData = async () => {
        if (!isConfigured) return;
        setLoading(true);
        try {
            // Fetch all files
            const resFiles = await fetch('/api/imagekit/files');
            // Fetch virtual folders
            const resFolders = await fetch('/api/imagekit/folders');
            
            if (resFiles.ok) {
                const data = await resFiles.json();
                setAllFiles(data);
            }
            if (resFolders.ok) {
                const folderData = await resFolders.json();
                setFolders(folderData);
            }
        } catch (error) {
            console.error('Failed to fetch media data', error);
            showToast('Failed to load media data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [isConfigured]);

    const onError = (err: any) => {
        console.error('Error during upload', err);
        setUploading(false);
        showToast(`Upload failed: ${err.message}`, 'error');
    };

    const onSuccess = (res: any) => {
        setUploading(false);
        showToast('Image uploaded successfully', 'success');
        fetchAllData();
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;
        
        try {
            const response = await fetch(`/api/imagekit/files/${fileId}`, { method: 'DELETE' });
            if (response.ok) {
                showToast('Image deleted successfully', 'success');
                fetchAllData();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to delete image', 'error');
        }
    };

    const handleRename = async (file: MediaFile) => {
        if (!editName.trim() || editName === file.name) {
            setEditingFileId(null);
            return;
        }
        try {
            const response = await fetch(`/api/imagekit/files/${file.fileId}/rename`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: file.filePath, newFileName: editName })
            });

            if (response.ok) {
                showToast('Renamed successfully', 'success');
                setEditingFileId(null);
                fetchAllData();
            } else {
                throw new Error('Rename failed');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to rename image', 'error');
        }
    };

    const startEdit = (file: MediaFile) => {
        setEditingFileId(file.fileId);
        setEditName(file.name);
    };

    const createFolder = async () => {
        const name = prompt("Enter new folder name:");
        if (!name) return;
        try {
            const response = await fetch(`/api/imagekit/folder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderName: name, parentFolderPath: currentPath })
            });
            if (response.ok) {
                showToast('Folder created', 'success');
                fetchAllData();
            } else {
                showToast('Failed to create folder', 'error');
            }
        } catch(err) {
            showToast('Failed to create folder', 'error');
        }
    };

    // Sub-folders directly under currentPath
    const currentSubfolders = folders.filter(f => {
        const startsCorrectly = f.startsWith(currentPath === '/' ? '/' : currentPath + '/');
        if (!startsCorrectly) return false;
        
        const relative = f.replace(currentPath === '/' ? '' : currentPath, '');
        // Exclude self and deep nested
        if (relative === '' || relative === '/') return false;
        const parts = relative.split('/').filter(Boolean);
        return parts.length === 1;
    });

    // Files exactly in current path
    const currentFiles = allFiles.filter(f => {
        const folder = f.folder || '/';
        return folder === currentPath;
    });

    const getBreadcrumbs = () => {
        if (currentPath === '/') return [{ name: 'Root', path: '/' }];
        const parts = currentPath.split('/').filter(Boolean);
        const crumbs = [{ name: 'Root', path: '/' }];
        let p = '';
        parts.forEach(part => {
            p += `/${part}`;
            crumbs.push({ name: part, path: p });
        });
        return crumbs;
    };

    if (!isConfigured) return (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md">
            <strong>ImageKit Not Configured!</strong>
            <p className="mt-1 text-sm">Please set VITE_IMAGEKIT_URL_ENDPOINT, VITE_IMAGEKIT_PUBLIC_KEY, and IMAGEKIT_PRIVATE_KEY in your environment variables.</p>
        </div>
    );

    return (
        <IKContext urlEndpoint={urlEndpoint} publicKey={publicKey} authenticator={authenticator}>
            {/* Upload Area */}
            <div className={`bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-border-color mb-6`}>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg text-text-primary">Upload Here</h3>
                        <p className="text-xs text-text-secondary">Uploading to: {currentPath}</p>
                    </div>
                    <div className="flex-1 mt-2 md:mt-0 max-w-sm ml-auto relative">
                        <IKUpload
                            fileName="customImage"
                            folder={currentPath}
                            onError={onError}
                            onSuccess={onSuccess}
                            onUploadStart={() => setUploading(true)}
                            className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent-hover cursor-pointer"
                        />
                    </div>
                </div>
                {uploading && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-accent">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                    </div>
                )}
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 mb-4 bg-background p-2 rounded border border-border-color text-sm overflow-x-auto">
                {getBreadcrumbs().map((crumb, idx, arr) => (
                    <React.Fragment key={crumb.path}>
                        <button 
                            onClick={() => setCurrentPath(crumb.path)}
                            className={`font-medium whitespace-nowrap hover:text-accent transition-colors ${idx === arr.length - 1 ? 'text-text-primary' : 'text-text-secondary'}`}
                        >
                            {crumb.name}
                        </button>
                        {idx < arr.length - 1 && <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />}
                    </React.Fragment>
                ))}
                
                <div className="flex-grow"></div>
                <button onClick={createFolder} className="flex items-center space-x-1 text-accent hover:text-accent-hover bg-accent/10 px-2 py-1 rounded transition-colors whitespace-nowrap">
                    <FolderPlus className="w-4 h-4" />
                    <span>New Folder</span>
                </button>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="py-12 flex justify-center items-center text-text-secondary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Folders */}
                    {currentSubfolders.length > 0 && (
                        <div>
                            <h4 className="text-secondary font-semibold text-sm mb-3 uppercase tracking-wider">Folders</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {currentSubfolders.map(f => {
                                    const folderName = f.split('/').filter(Boolean).pop();
                                    return (
                                        <button 
                                            key={f} 
                                            onClick={() => setCurrentPath(f)}
                                            className="flex items-center space-x-3 p-3 bg-card-bg hover:bg-accent/10 border border-border-color rounded-lg transition-colors group text-left"
                                        >
                                            <Folder className="w-5 h-5 text-accent group-hover:text-accent-hover shrink-0" />
                                            <span className="truncate font-medium text-text-primary text-sm">{folderName}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Files */}
                    <div>
                        <h4 className="text-secondary font-semibold text-sm mb-3 uppercase tracking-wider">Files</h4>
                        {currentFiles.length === 0 ? (
                            <div className="text-center py-8 text-text-secondary border-2 border-dashed border-border-color rounded-lg text-sm bg-slate-50 dark:bg-slate-800/30">
                                This folder is empty.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {currentFiles.map((file) => (
                                    <div key={file.fileId} className="group relative bg-card-bg rounded-lg overflow-hidden border border-border-color shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-accent">
                                        <div 
                                            className="aspect-square relative cursor-pointer"
                                            onClick={() => onSelect && onSelect(file.url)}
                                        >
                                            <img 
                                                src={file.thumbnailUrl || file.url} 
                                                alt={file.name}
                                                loading="lazy"
                                                className="w-full h-full object-cover bg-slate-200 dark:bg-slate-700"
                                                referrerPolicy="no-referrer"
                                            />
                                            {/* Overlays */}
                                            {!pickerMode && (
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(file.url); showToast('Copied', 'success'); }}
                                                        className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur" title="Copy URL"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); startEdit(file); }}
                                                        className="p-1.5 bg-blue-500/80 hover:bg-blue-500 text-white rounded-full backdrop-blur" title="Rename"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(file.fileId); }}
                                                        className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur" title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-2 text-xs border-t border-border-color bg-background">
                                            {editingFileId === file.fileId ? (
                                                <div className="flex items-center space-x-1">
                                                    <input 
                                                        autoFocus
                                                        type="text" 
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="flex-1 w-full p-1 bg-white dark:bg-slate-700 border border-border-color rounded text-text-primary"
                                                    />
                                                    <button onClick={() => handleRename(file)} className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900 rounded"><Check className="w-3 h-3" /></button>
                                                    <button onClick={() => setEditingFileId(null)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"><X className="w-3 h-3" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="truncate font-medium text-text-primary" title={file.name}>{file.name}</p>
                                                    <p className="text-text-secondary mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </IKContext>
    );
};

const MediaLibrary: React.FC = () => {
    return (
        <div className="bg-card-bg rounded-lg border border-border-color shadow-sm p-6 overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2 text-text-primary">
                <ImageIcon className="h-6 w-6 text-accent" />
                <span>Media Library</span>
            </h2>
            <MediaBrowser />
        </div>
    );
};

export default MediaLibrary;
