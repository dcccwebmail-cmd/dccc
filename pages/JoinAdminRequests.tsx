import React, { useState, useEffect } from 'react';
import { getJoinRequests, updateJoinRequestStatus, deleteJoinRequest } from '../services/joinService';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import { generateIdCardPdf } from '../services/emailService';
import { JoinRequest } from '../types';
import { FileText, RefreshCw, CheckCircle, Clock, Search, Trash2, Download } from 'lucide-react';

const JoinAdminRequests: React.FC = () => {
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
    const [isGeneratingCard, setIsGeneratingCard] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { data } = useData();
    const { showToast } = useToast();
    const joinContent = data?.join;

    const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
            const result = await getJoinRequests();
            setRequests(result);
        } catch (error) {
            console.error("Error fetching requests:", error);
            showToast("Failed to load requests", "error");
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        if (!id) return;
        try {
            const reqData = requests.find(r => r.id === id);
            await updateJoinRequestStatus({
                id, 
                status, 
                userData: reqData, 
                emailConfig: joinContent?.emailConfig,
                resendConfig: joinContent?.resendConfig,
                idCardConfig: joinContent?.idCardConfig,
                sessionYear: joinContent?.currentSessionYear
            });
            showToast(`Request ${status} successfully!`, 'success');
            fetchRequests();
            if (selectedRequest?.id === id) {
                setSelectedRequest(prev => prev ? { ...prev, status } : null);
            }
        } catch (error: any) {
            console.error("Error updating status:", error);
            showToast(error.message || "Failed to update status.", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this request?')) return;
        try {
            await deleteJoinRequest(id);
            showToast('Request deleted.', 'success');
            fetchRequests();
            setSelectedRequest(null);
        } catch (error: any) {
            showToast(error.message || 'Failed to delete request.', 'error');
        }
    };

    const handleDownloadIdCard = async () => {
        if (!selectedRequest) return;
        if (!joinContent?.idCardConfig) {
            showToast('ID Card Configuration is not available. Please configure the ID card first.', 'error');
            return;
        }
        setIsGeneratingCard(true);
        try {
            await generateIdCardPdf(selectedRequest, joinContent.idCardConfig, true);
            showToast('ID Card generated and downloaded successfully!', 'success');
        } catch (e: any) {
            console.error("Failed to generate ID card PDF:", e);
            showToast('Failed to generate ID Card: ' + (e.message || 'Unknown error'), 'error');
        } finally {
            setIsGeneratingCard(false);
        }
    };

    const getPaymentMethodName = (id: string) => {
        const method = joinContent?.paymentMethods?.find(m => m.id === id);
        return method ? method.name : id;
    };

    const getRowClass = (status: string) => {
        switch(status) {
            case 'approved': return 'bg-green-100/30 hover:bg-green-100/50 dark:bg-green-950/10 dark:hover:bg-green-950/20';
            case 'rejected': return 'bg-red-100/30 hover:bg-red-100/50 dark:bg-red-950/10 dark:hover:bg-red-950/20';
            default: return 'hover:bg-black/5 dark:hover:bg-white/5';
        }
    };

    const filteredRequests = requests.filter(r => {
        const matchesTab = filter === 'all' || r.status === filter;
        const matchesSearch = !searchTerm.trim() || 
            r.personal?.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.personal?.name_bn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.assignedId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.academic?.roll?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleExportCSV = () => {
        if (filteredRequests.length === 0) {
            showToast("No records available to export with current filters", "error");
            return;
        }

        try {
            const escapeCSV = (val: any) => {
                if (val === null || val === undefined) return '';
                let str = String(val).trim();
                str = str.replace(/[\r\n]+/g, ' ');
                if (str.includes(',') || str.includes('"') || str.includes(';')) {
                    str = `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            const headers = [
                "DCCC ID",
                "Name (EN)",
                "Name (BN)",
                "Email",
                "Phone",
                "WhatsApp",
                "DOB",
                "Gender",
                "Father's Name",
                "Mother's Name",
                "Present Address",
                "Permanent Address",
                "Class Roll",
                "Section/Group",
                "Prev Institute",
                "Blood Group",
                "First Choice Dept",
                "Second Choice Dept",
                "Reason for Joining",
                "Experience",
                "Hobbies",
                "Skills",
                "Facebook",
                "LinkedIn",
                "Instagram",
                "Reg Type",
                "Payment Method",
                "Trx ID / Form ID",
                "Submitted At",
                "Status"
            ];

            const rows = filteredRequests.map(r => [
                r.assignedId || '',
                r.personal?.name_en || '',
                r.personal?.name_bn || '',
                r.personal?.email || '',
                r.contact?.phone || '',
                r.contact?.whatsapp || '',
                r.personal?.dob || '',
                r.personal?.gender || '',
                r.personal?.father_name || '',
                r.personal?.mother_name || '',
                r.contact?.present_address || '',
                r.contact?.permanent_address || '',
                r.academic?.roll || '',
                r.academic?.section || '',
                r.academic?.prev_institute || '',
                r.academic?.blood_group || '',
                r.preferences?.first_choice || '',
                r.preferences?.second_choice || '',
                r.preferences?.reason || '',
                r.skills?.experience || '',
                r.skills?.hobbies || '',
                r.skills?.skills || '',
                r.socials?.facebook || '',
                r.socials?.linkedin || '',
                r.socials?.instagram || '',
                r.meta?.reg_type === 'offline' ? 'Offline' : 'Online',
                r.meta?.reg_type === 'offline' ? 'Offline Cash' : (r.payment?.method ? getPaymentMethodName(r.payment.method) : ''),
                r.meta?.reg_type === 'offline' ? (r.payment?.dccc_id || '') : (r.payment?.trx_id || ''),
                r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '',
                r.status
            ]);

            const csvContent = [
                headers.map(escapeCSV).join(','),
                ...rows.map(row => row.map(escapeCSV).join(','))
            ].join('\n');

            const filename = `dccc_members_${filter}_${new Date().toISOString().split('T')[0]}.csv`;
            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast(`Exported ${filteredRequests.length} records successfully!`, 'success');
        } catch (error) {
            console.error("CSV Export failed:", error);
            showToast("Failed to export CSV file", "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f)} 
                            className={`px-4 py-2 rounded-xl text-sm capitalize transition-all ${filter === f ? 'bg-accent text-accent-text font-bold shadow-md' : 'bg-card-bg text-text-secondary hover:bg-accent/10'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-60">
                        <input 
                            type="text" 
                            placeholder="Search requests..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-card-bg border border-border-color rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <Search className="w-4 h-4 text-text-secondary absolute left-3 top-2.5" />
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={fetchRequests} 
                            className="p-2.5 bg-card-bg border border-border-color rounded-xl hover:bg-accent/10 transition-colors text-text-secondary"
                            title="Reload requests"
                        >
                            <RefreshCw className={`w-4 h-4 ${loadingRequests ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-text font-bold rounded-xl text-sm transition-all shadow-md whitespace-nowrap"
                            title="Export current list to CSV"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            {loadingRequests ? (
                <div className="text-center py-24 bg-card-bg border border-border-color rounded-2xl">
                    <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
                    <span className="text-text-secondary text-sm font-medium">Loading membership applications...</span>
                </div>
            ) : (
                <div className="bg-card-bg border border-border-color rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap text-sm">
                            <thead className="bg-black/5 dark:bg-white/5 border-b border-border-color text-text-secondary font-bold">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">DCCC ID / Form ID</th>
                                    <th className="p-4">Registration Type</th>
                                    <th className="p-4">Class Roll</th>
                                    <th className="p-4">Submitted At</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-text-secondary">
                                            No membership requests found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map(req => (
                                        <tr key={req.id} className={`transition-colors cursor-pointer ${getRowClass(req.status)}`} onClick={() => setSelectedRequest(req)}>
                                            <td className="p-4">
                                                <div className="font-bold text-text-primary">{req.personal?.name_en || 'Unknown'}</div>
                                                <div className="text-xs text-text-secondary font-hind">{req.personal?.name_bn}</div>
                                            </td>
                                            <td className="p-4 font-mono font-bold text-accent">
                                                {req.assignedId || (req.meta?.reg_type === 'offline' ? req.payment?.dccc_id : 'Pending')}
                                            </td>
                                            <td className="p-4 text-xs">
                                                {req.meta?.reg_type === 'offline' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                        Offline Form
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 w-fit">
                                                            Online Payment
                                                        </span>
                                                        <span className="text-[10px] text-text-secondary mt-1 font-semibold">
                                                            {req.payment?.method ? getPaymentMethodName(req.payment.method) : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs font-mono font-bold">{req.academic?.roll || 'N/A'}</td>
                                            <td className="p-4 text-xs text-text-secondary">
                                                {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                                    req.status === 'approved' ? 'text-green-700 bg-green-100/60 dark:text-green-400 dark:bg-green-900/20' : 
                                                    req.status === 'rejected' ? 'text-red-700 bg-red-100/60 dark:text-red-400 dark:bg-red-900/20' : 
                                                    'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-accent hover:text-accent-hover text-xs font-bold bg-accent/10 px-3 py-1.5 rounded-lg transition-all">
                                                    View details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Request Detail Modal */}
            {selectedRequest && (
                <div 
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" 
                    onClick={() => setSelectedRequest(null)}
                >
                    <div 
                        className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative border border-border-color" 
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedRequest(null)} 
                            className="absolute top-4 right-4 text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/10 rounded-full p-1.5 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6 pr-8">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary leading-tight">{selectedRequest.personal.name_en}</h2>
                                <p className="text-text-secondary text-sm font-hind">{selectedRequest.personal.name_bn}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    selectedRequest.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 
                                    selectedRequest.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 
                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                }`}>
                                    {selectedRequest.status}
                                </span>
                                {selectedRequest.status === 'approved' && selectedRequest.emailStatus && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                                        ['sent', 'delivered'].includes(selectedRequest.emailStatus) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                        selectedRequest.emailStatus === 'opened' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' :
                                        selectedRequest.emailStatus === 'sending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                    }`}>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                        {selectedRequest.emailStatus}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Image */}
                        {selectedRequest.personal.image_url && (
                            <div className="mb-6 flex justify-center">
                                <img 
                                    src={selectedRequest.personal.image_url} 
                                    alt="Applicant" 
                                    className="h-32 w-32 object-cover rounded-xl border-2 border-border-color shadow-md" 
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            {/* Personal */}
                            <div className="space-y-2 bg-card-bg p-4 rounded-xl border border-border-color">
                                <h3 className="font-bold border-b border-border-color pb-1.5 mb-2 text-accent uppercase tracking-wider">Personal Info</h3>
                                <p><span className="text-text-secondary">Father:</span> {selectedRequest.personal.father_name}</p>
                                <p><span className="text-text-secondary">Mother:</span> {selectedRequest.personal.mother_name}</p>
                                <p><span className="text-text-secondary">DOB:</span> {selectedRequest.personal.dob}</p>
                                <p><span className="text-text-secondary">Gender:</span> {selectedRequest.personal.gender}</p>
                            </div>

                            {/* Contact */}
                            <div className="space-y-2 bg-card-bg p-4 rounded-xl border border-border-color">
                                <h3 className="font-bold border-b border-border-color pb-1.5 mb-2 text-accent uppercase tracking-wider">Contact Info</h3>
                                <p><span className="text-text-secondary">Email:</span> {selectedRequest.personal.email}</p>
                                <p><span className="text-text-secondary">Phone:</span> {selectedRequest.contact.phone}</p>
                                <p><span className="text-text-secondary">WhatsApp:</span> {selectedRequest.contact.whatsapp}</p>
                                {selectedRequest.socials?.facebook && (
                                    <p>
                                        <span className="text-text-secondary">Facebook:</span>{' '}
                                        <a href={selectedRequest.socials.facebook} target="_blank" rel="noreferrer" className="text-accent hover:underline font-semibold">
                                            Link
                                        </a>
                                    </p>
                                )}
                            </div>

                            {/* Academic */}
                            <div className="space-y-2 bg-card-bg p-4 rounded-xl border border-border-color">
                                <h3 className="font-bold border-b border-border-color pb-1.5 mb-2 text-accent uppercase tracking-wider">Academic Info</h3>
                                <p><span className="text-text-secondary">Roll:</span> {selectedRequest.academic.roll}</p>
                                <p><span className="text-text-secondary">Section:</span> {selectedRequest.academic.section}</p>
                                <p><span className="text-text-secondary">Blood Group:</span> {selectedRequest.academic.blood_group}</p>
                                <p><span className="text-text-secondary">Prev Institute:</span> {selectedRequest.academic.prev_institute}</p>
                            </div>

                            {/* Preferences & Payment */}
                            <div className="space-y-2 bg-card-bg p-4 rounded-xl border border-border-color">
                                <h3 className="font-bold border-b border-border-color pb-1.5 mb-2 text-accent uppercase tracking-wider">Registration</h3>
                                <p><span className="text-text-secondary">Type:</span> {selectedRequest.meta?.reg_type === 'offline' ? 'Offline' : 'Online'}</p>
                                {selectedRequest.meta?.reg_type === 'offline' ? (
                                    <>
                                        <p><span className="text-text-secondary">DCCC ID:</span> <span className="font-mono font-bold">{selectedRequest.payment?.dccc_id}</span></p>
                                        <p><span className="text-text-secondary">Booth:</span> {selectedRequest.personal.booth}</p>
                                    </>
                                ) : (
                                    <>
                                        <p><span className="text-text-secondary">Method:</span> {selectedRequest.payment?.method ? getPaymentMethodName(selectedRequest.payment.method) : selectedRequest.payment?.method}</p>
                                        <p><span className="text-text-secondary">Trx ID:</span> <span className="font-mono font-semibold">{selectedRequest.payment?.trx_id}</span></p>
                                    </>
                                )}
                                <p><span className="text-text-secondary">1st Choice:</span> {selectedRequest.preferences.first_choice}</p>
                                <p><span className="text-text-secondary">2nd Choice:</span> {selectedRequest.preferences.second_choice}</p>
                            </div>
                        </div>
                        
                        {(selectedRequest.preferences.reason || selectedRequest.skills?.skills) && (
                            <div className="mt-4 bg-card-bg p-4 rounded-xl border border-border-color text-xs">
                                <h3 className="font-bold border-b border-border-color pb-1.5 mb-2 text-accent uppercase tracking-wider">Additional Info</h3>
                                {selectedRequest.preferences.reason && <p className="mb-2"><span className="text-text-secondary font-semibold block mb-0.5">Reason for joining:</span> {selectedRequest.preferences.reason}</p>}
                                {selectedRequest.skills?.skills && <p><span className="text-text-secondary font-semibold block mb-0.5">Skills:</span> {selectedRequest.skills.skills}</p>}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-6 flex flex-wrap gap-3 justify-end border-t border-border-color pt-4 text-xs">
                            {selectedRequest.status === 'approved' && (
                                <button 
                                    onClick={handleDownloadIdCard} 
                                    disabled={isGeneratingCard}
                                    className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-accent-text font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isGeneratingCard ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            Generating Card...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-3.5 h-3.5" />
                                            Download ID Card
                                        </>
                                    )}
                                </button>
                            )}
                            {selectedRequest.status === 'pending' && (
                                <>
                                    <button 
                                        onClick={() => handleStatusUpdate(selectedRequest.id!, 'approved')} 
                                        className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-md"
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleStatusUpdate(selectedRequest.id!, 'rejected')} 
                                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-md"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            <button 
                                onClick={() => handleDelete(selectedRequest.id!)} 
                                className="px-5 py-2.5 bg-red-500/10 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all"
                            >
                                Delete Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JoinAdminRequests;
