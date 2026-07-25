import React, { useState, useEffect } from 'react';
import { 
    getOfflineFormSettings, 
    getOfflineSoldForms, 
    sellOfflineForm, 
    saveOfflineFormSettings, 
    deleteOfflineSoldForm 
} from '../services/offlineFormService';
import { useToast } from '../contexts/ToastContext';
import { OfflineFormSettings, OfflineSoldForm } from '../types';
import { Plus, X, CheckCircle, Sliders, RefreshCw, FileText, Search, Clock, Trash2 } from 'lucide-react';

const JoinAdminOffline: React.FC = () => {
    const { showToast } = useToast();
    const [offlineSettings, setOfflineSettings] = useState<OfflineFormSettings>({
        year: '26',
        prefixFormat: 'DCCC-{year}-{booth}-',
        boothStartSerials: { A: 1, B: 1, C: 1, D: 1 }
    });
    const [offlineSoldForms, setOfflineSoldForms] = useState<OfflineSoldForm[]>([]);
    const [loadingOffline, setLoadingOffline] = useState(false);
    const [sellerPhone, setSellerPhone] = useState('');
    const [sellerBooth, setSellerBooth] = useState('A');
    const [isSavingOfflineSettings, setIsSavingOfflineSettings] = useState(false);
    const [offlineSearch, setOfflineSearch] = useState('');
    const [offlineBoothFilter, setOfflineBoothFilter] = useState('all');
    const [offlineStatusFilter, setOfflineStatusFilter] = useState('all');
    const [newlySoldForm, setNewlySoldForm] = useState<OfflineSoldForm | null>(null);

    const fetchOfflineData = async () => {
        setLoadingOffline(true);
        try {
            const settings = await getOfflineFormSettings();
            if (settings) {
                setOfflineSettings(settings);
            }
            const list = await getOfflineSoldForms();
            setOfflineSoldForms(list);
        } catch (e: any) {
            console.error(e);
            showToast('Failed to load offline form sales data.', 'error');
        } finally {
            setLoadingOffline(false);
        }
    };

    useEffect(() => {
        fetchOfflineData();
    }, []);

    const handleSellForm = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = sellerPhone.trim();
        if (!cleanPhone) {
            showToast('Please enter a valid mobile number.', 'error');
            return;
        }

        try {
            const result = await sellOfflineForm(cleanPhone, sellerBooth);
            setNewlySoldForm(result);
            setSellerPhone('');
            showToast(`Offline Form Sold successfully! Generated ID: ${result.dccc_id}`, 'success');
            // Refresh list
            const list = await getOfflineSoldForms();
            setOfflineSoldForms(list);
        } catch (error: any) {
            showToast(error.message || 'Failed to record form sale.', 'error');
        }
    };

    const handleSaveOfflineSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingOfflineSettings(true);
        try {
            await saveOfflineFormSettings(offlineSettings);
            showToast('Offline form central settings saved successfully.', 'success');
            const list = await getOfflineSoldForms();
            setOfflineSoldForms(list);
        } catch (error: any) {
            showToast(error.message || 'Failed to save settings.', 'error');
        } finally {
            setIsSavingOfflineSettings(false);
        }
    };

    const handleDeleteOfflineForm = async (id: string, dccc_id: string) => {
        if (!confirm(`Are you sure you want to delete sold form record ${dccc_id}?`)) {
            return;
        }
        try {
            await deleteOfflineSoldForm(id);
            showToast('Record deleted successfully.', 'success');
            const list = await getOfflineSoldForms();
            setOfflineSoldForms(list);
        } catch (error: any) {
            showToast(error.message || 'Failed to delete record.', 'error');
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Upper row: Form sale input & Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* New offline form sale section */}
                <div className="bg-card-bg border border-border-color p-6 rounded-2xl shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-extrabold flex items-center gap-2 text-accent">
                            <Plus className="w-5 h-5" />
                            New Offline Form Sale
                        </h2>
                        <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                            Volunteers must select the respective booth and input the applicant student's mobile number at the time of form selling.
                        </p>
                    </div>

                    <form onSubmit={handleSellForm} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-text-primary uppercase tracking-wider">Select Booth</label>
                                <select 
                                    value={sellerBooth} 
                                    onChange={(e) => setSellerBooth(e.target.value)} 
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                >
                                    <option value="A">Booth A</option>
                                    <option value="B">Booth B</option>
                                    <option value="C">Booth C</option>
                                    <option value="D">Booth D</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-text-primary uppercase tracking-wider">Mobile Number</label>
                                <input 
                                    type="tel" 
                                    value={sellerPhone}
                                    onChange={(e) => setSellerPhone(e.target.value)}
                                    placeholder="e.g. 01XXXXXXXXX"
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            className="w-full py-3 bg-accent hover:bg-accent-hover text-accent-text font-extrabold rounded-xl transition-all shadow-md text-sm"
                        >
                            Confirm and Record Sale
                        </button>
                    </form>

                    {/* Success message / feedback */}
                    {newlySoldForm && (
                        <div className="bg-green-500/10 border border-green-500/30 p-5 rounded-2xl text-sm relative">
                            <button 
                                onClick={() => setNewlySoldForm(null)}
                                className="absolute top-2 right-2 text-text-secondary hover:text-text-primary p-1 bg-black/5 dark:bg-white/5 rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <h4 className="font-extrabold text-green-600 dark:text-green-400">Form Sale Successfully Recorded!</h4>
                                    <div className="space-y-1 text-xs text-text-primary">
                                        <p><span className="font-semibold text-text-secondary">Assigned DCCC ID:</span> <span className="font-mono bg-green-500/20 px-2 py-0.5 rounded text-green-700 dark:text-green-300 font-bold text-sm text-center inline-block">{newlySoldForm.dccc_id}</span></p>
                                        <p><span className="font-semibold text-text-secondary">Mobile Number:</span> {newlySoldForm.phone}</p>
                                        <p><span className="font-semibold text-text-secondary">Booth Number:</span> Booth {newlySoldForm.booth}</p>
                                        <p><span className="font-semibold text-text-secondary">Serial Number:</span> {newlySoldForm.serial.toString().padStart(3, '0')}</p>
                                    </div>
                                    <p className="text-xs text-text-secondary italic border-t border-green-500/20 pt-2 mt-2 leading-relaxed">
                                        The student can now complete their registration on the main site using this Mobile Number and the assigned DCCC ID. The request will be automatically approved upon form submission.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Central Settings configuration section */}
                <div className="bg-card-bg border border-border-color p-6 rounded-2xl shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-extrabold flex items-center gap-2 text-accent">
                            <Sliders className="w-5 h-5" />
                            Central ID & Serial Configuration
                        </h2>
                        <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                            Configure the ID prefix format pattern and the custom starting serial counters for each booth.
                        </p>
                    </div>

                    <form onSubmit={handleSaveOfflineSettings} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-text-primary uppercase tracking-wider">Session Year Code</label>
                                <input 
                                    type="text" 
                                    value={offlineSettings.year}
                                    onChange={(e) => setOfflineSettings({...offlineSettings, year: e.target.value})}
                                    placeholder="e.g. 26"
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                    required
                                />
                                <p className="text-[10px] text-text-secondary mt-1">Replaces {"{year}"} placeholder in the generated ID pattern.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-text-primary uppercase tracking-wider">ID Format Pattern</label>
                                <input 
                                    type="text" 
                                    value={offlineSettings.prefixFormat}
                                    onChange={(e) => setOfflineSettings({...offlineSettings, prefixFormat: e.target.value})}
                                    placeholder="DCCC-{year}-{booth}-"
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-accent text-sm font-mono"
                                    required
                                />
                                <p className="text-[10px] text-text-secondary mt-1">Pattern: DCCC-{"{year}"}-{"{booth}"}-</p>
                            </div>
                        </div>

                        <div className="border-t border-border-color pt-4">
                            <h3 className="text-xs font-bold mb-3 text-text-primary uppercase tracking-wider">Booth-wise Starting Serial Counters</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {['A', 'B', 'C', 'D'].map(b => (
                                    <div key={b}>
                                        <label className="block text-xs font-bold mb-1.5 text-text-secondary uppercase">Booth {b}</label>
                                        <input 
                                            type="number" 
                                            value={offlineSettings.boothStartSerials?.[b] || 1}
                                            onChange={(e) => setOfflineSettings({
                                                ...offlineSettings,
                                                boothStartSerials: {
                                                    ...offlineSettings.boothStartSerials,
                                                    [b]: parseInt(e.target.value) || 1
                                                }
                                            })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                            min="1"
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-text-secondary mt-2">
                                If no forms have been sold from a booth yet, the next generated serial counter will start from this value.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSavingOfflineSettings}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md text-sm flex justify-center items-center gap-2"
                        >
                            {isSavingOfflineSettings ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Saving settings...
                                </>
                            ) : 'Save Settings'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Lower Area: Directory list */}
            <div className="bg-card-bg border border-border-color rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border-color space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-accent" />
                                Sold Offline Forms Directory
                            </h2>
                            <p className="text-text-secondary text-xs mt-1">
                                Record log of all offline forms sold and their registration tracking status.
                            </p>
                        </div>
                        <button 
                            onClick={fetchOfflineData} 
                            className="flex items-center gap-1.5 text-xs px-3 py-2 bg-accent/10 hover:bg-accent/20 rounded-xl text-accent transition-all font-bold"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingOffline ? 'animate-spin' : ''}`} />
                            Reload List
                        </button>
                    </div>

                    {/* Filters row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex-grow max-w-sm relative">
                            <input 
                                type="text" 
                                placeholder="Search by DCCC ID or Mobile number..." 
                                value={offlineSearch}
                                onChange={(e) => setOfflineSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-border-color rounded-xl focus:outline-none"
                            />
                            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3 pointer-events-none" />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">Booth:</span>
                            <select 
                                value={offlineBoothFilter}
                                onChange={(e) => setOfflineBoothFilter(e.target.value)}
                                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-border-color rounded-xl"
                            >
                                <option value="all">All Booths</option>
                                <option value="A">Booth A</option>
                                <option value="B">Booth B</option>
                                <option value="C">Booth C</option>
                                <option value="D">Booth D</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">Status:</span>
                            <select 
                                value={offlineStatusFilter}
                                onChange={(e) => setOfflineStatusFilter(e.target.value)}
                                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-border-color rounded-xl"
                            >
                                <option value="all">All Status</option>
                                <option value="registered">Registered (Approved Member)</option>
                                <option value="pending">Pending (Unregistered)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* List directory Table */}
                {loadingOffline ? (
                    <div className="text-center py-16">
                        <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-2" />
                        <span className="text-sm text-text-secondary">Loading offline sold forms...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border-color text-text-secondary font-bold text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">DCCC ID</th>
                                    <th className="px-6 py-4">Mobile Number</th>
                                    <th className="px-6 py-4">Booth</th>
                                    <th className="px-6 py-4">Serial No</th>
                                    <th className="px-6 py-4">Sold At</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color">
                                {offlineSoldForms
                                    .filter(item => {
                                        const searchLower = offlineSearch.toLowerCase();
                                        const matchesSearch = item.dccc_id.toLowerCase().includes(searchLower) || item.phone.includes(searchLower);
                                        const matchesBooth = offlineBoothFilter === 'all' || item.booth === offlineBoothFilter;
                                        const matchesStatus = offlineStatusFilter === 'all' || 
                                            (offlineStatusFilter === 'registered' && item.is_registered) ||
                                            (offlineStatusFilter === 'pending' && !item.is_registered);
                                        return matchesSearch && matchesBooth && matchesStatus;
                                    })
                                    .length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-text-secondary text-sm">
                                                No offline sales found matching criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        offlineSoldForms
                                            .filter(item => {
                                                const searchLower = offlineSearch.toLowerCase();
                                                const matchesSearch = item.dccc_id.toLowerCase().includes(searchLower) || item.phone.includes(searchLower);
                                                const matchesBooth = offlineBoothFilter === 'all' || item.booth === offlineBoothFilter;
                                                const matchesStatus = offlineStatusFilter === 'all' || 
                                                    (offlineStatusFilter === 'registered' && item.is_registered) ||
                                                    (offlineStatusFilter === 'pending' && !item.is_registered);
                                                return matchesSearch && matchesBooth && matchesStatus;
                                            })
                                            .map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                                    <td className="px-6 py-4 font-mono font-bold text-accent">{item.dccc_id}</td>
                                                    <td className="px-6 py-4 font-mono">{item.phone}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/10 text-accent">
                                                            Booth {item.booth}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono">{item.serial.toString().padStart(3, '0')}</td>
                                                    <td className="px-6 py-4 text-xs text-text-secondary">{new Date(item.sold_at).toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        {item.is_registered ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400">
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                Registered
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => handleDeleteOfflineForm(item.id!, item.dccc_id)}
                                                            className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Delete Form Record"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoinAdminOffline;
