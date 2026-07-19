import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Store, ShieldCheck, BarChart3, CheckCircle, XCircle, Clock, AlertTriangle, Download, FileText, ExternalLink, X } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { Badge, Button, Skeleton } from '../../components/ui/index';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'verification'>('overview');
  const [vendorStatusFilter, setVendorStatusFilter] = useState('PENDING');
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const qc = useQueryClient();
  const { isDarkMode } = useUIStore();

  // Fetch PDF as blob to avoid CORS issues
  useEffect(() => {
    const fetchPdfAsBlob = async () => {
      if (viewingDocument && /\.pdf(?:[?#]|$)/i.test(viewingDocument)) {
        try {
          const response = await fetch(viewingDocument);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(blobUrl);
          setDocumentError(false);
        } catch (error) {
          console.error('Failed to fetch PDF:', error);
          setDocumentError(true);
        }
      } else {
        setPdfBlobUrl(null);
      }
    };

    fetchPdfAsBlob();

    // Cleanup blob URL when modal closes or document changes
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [viewingDocument]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => adminApi.analytics().then((r) => r.data.data),
  });

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['admin', 'vendors', vendorStatusFilter],
    queryFn: () => adminApi.vendors({ status: vendorStatusFilter }).then((r) => r.data.data),
    enabled: activeTab === 'vendors',
  });

  const { data: verificationReqs, isLoading: vReqLoading } = useQuery({
    queryKey: ['admin', 'verification'],
    queryFn: () => adminApi.verificationRequests().then((r) => r.data.data),
    enabled: activeTab === 'verification',
  });

  const updateVendorStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateVendorStatus(id, status),
    onSuccess: () => {
      toast.success('Vendor status updated');
      qc.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      qc.invalidateQueries({ queryKey: ['admin', 'verification'] });
      qc.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });

  const reviewVerification = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.reviewVerification(id, data),
    onSuccess: () => {
      toast.success('Verification request updated');
      qc.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      qc.invalidateQueries({ queryKey: ['admin', 'verification'] });
      qc.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });

  return (
    <div className={clsx('min-h-screen', isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className="bg-festac-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-festac-green rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">Admin Control Panel</h1>
              <p className="text-white/50 text-sm">Discover SMEs — Platform Management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className={clsx('flex gap-1 rounded-2xl p-1 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 w-fit', isDarkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-800')}>
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
            { id: 'vendors', label: 'Vendors', icon: <Store size={14} /> },
            { id: 'verification', label: 'Verification', icon: <ShieldCheck size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-festac-dark text-white shadow-sm'
                  : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300'
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Vendors', value: analytics?.totalVendors, icon: <Store size={18} />, bgClass: 'bg-green-50', textClass: 'text-green-600' },
                { label: 'Active Vendors', value: analytics?.activeVendors, icon: <CheckCircle size={18} />, bgClass: 'bg-blue-50', textClass: 'text-blue-600' },
                { label: 'Total Users', value: analytics?.totalUsers, icon: <Users size={18} />, bgClass: 'bg-purple-50', textClass: 'text-purple-600' },
                { label: 'Inactive Vendors', value: (analytics?.totalVendors ?? 0) - (analytics?.activeVendors ?? 0), icon: <Clock size={18} />, bgClass: 'bg-amber-50', textClass: 'text-amber-600' },
              ].map((stat) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200">
                  {analyticsLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <>
                      <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center mb-2', stat.bgClass, stat.textClass)}>
                        {stat.icon}
                      </div>
                      <p className="text-2xl font-display font-black text-gray-900 dark:text-white">{(stat.value ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">{stat.label}</p>
                    </>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Category Distribution */}
            {analytics?.categoryDistribution && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Category Distribution</h2>
                <div className="space-y-3">
                  {analytics.categoryDistribution.slice(0, 8).map((cat: any) => (
                    <div key={cat.categoryId} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-gray-600 dark:text-gray-300 truncate">{cat.categoryId}</div>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-festac-green h-2 rounded-full"
                          style={{ width: `${Math.min(100, (cat._count._all / analytics.activeVendors) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{cat._count._all}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── VENDORS TAB ──────────────────────────────────── */}
        {activeTab === 'vendors' && (
          <div className="space-y-4">
            {/* Status filter */}
            <div className="flex gap-2">
              {['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setVendorStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    vendorStatusFilter === s ? 'bg-festac-dark text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 overflow-hidden">
              {vendorsLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {(vendors as any)?.data?.map((vendor: any) => (
                    <div key={vendor.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                        🏪
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{vendor.businessName}</p>
                        <p className="text-xs text-gray-400">{vendor.owner?.firstName} {vendor.owner?.lastName} · {vendor.owner?.phone}</p>
                        <p className="text-xs text-gray-400">{vendor.category?.name} · {vendor.lga}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {vendor.status === 'PENDING' && (
                          <span className="text-xs text-gray-400">Review in Verification tab</span>
                        )}
                        {vendor.status === 'ACTIVE' && (
                          <button
                            onClick={() => updateVendorStatus.mutate({ id: vendor.id, status: 'SUSPENDED' })}
                            className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                            title="Suspend"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        )}
                        {vendor.status === 'SUSPENDED' && (
                          <button
                            onClick={() => updateVendorStatus.mutate({ id: vendor.id, status: 'ACTIVE' })}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="Reinstate"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <StatusBadge status={vendor.status} />
                      </div>
                    </div>
                  ))}
                  {(vendors as any)?.data?.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-sm">No {vendorStatusFilter.toLowerCase()} vendors</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── VERIFICATION TAB ─────────────────────────────── */}
        {activeTab === 'verification' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-300">Review and approve business verification requests</p>
            {vReqLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
              </div>
            ) : (verificationReqs as any[])?.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 text-center text-gray-400">
                <ShieldCheck size={32} className="mx-auto mb-2" />
                <p className="text-sm">No pending verification requests</p>
              </div>
            ) : (
              (verificationReqs as any[])?.map((req: any) => (
                <div key={req.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{req.vendor?.businessName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-300 mt-0.5">{req.vendor?.lga}</p>
                      {req.vendor?.owner && (
                        <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                          {req.vendor.owner.firstName} {req.vendor.owner.lastName} · {req.vendor.owner.phone}
                        </p>
                      )}
                      <Badge variant="blue" className="mt-2">{req.requestedLevel.replace(/_/g, ' ')}</Badge>
                      <p className="text-xs text-gray-400 mt-2">
                        Submitted {new Date(req.createdAt).toLocaleDateString('en-NG')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => reviewVerification.mutate({ id: req.id, data: { status: 'APPROVED' } })}
                          loading={reviewVerification.isPending}
                          icon={<CheckCircle size={13} />}
                        >
                          Approve
                        </Button>
                        {rejectingId === req.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                reviewVerification.mutate({ id: req.id, data: { status: 'REJECTED', rejectionReason } });
                                setRejectingId(null);
                                setRejectionReason('');
                              }}
                              loading={reviewVerification.isPending}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => { setRejectingId(req.id); setRejectionReason(''); }}
                            icon={<XCircle size={13} />}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                      {rejectingId === req.id && (
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Rejection reason (optional)"
                          className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-festac-green outline-none resize-none"
                          rows={2}
                        />
                      )}
                    </div>
                  </div>

                  {/* Documents Section */}
                  {req.documents && req.documents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <FileText size={14} />
                        Uploaded Documents ({req.documents.length})
                      </p>
                      <div className="space-y-2">
                        {req.documents.map((docUrl: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <FileText size={16} className="text-gray-500 dark:text-gray-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  Document {idx + 1}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{docUrl}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setViewingDocument(docUrl);
                                setDocumentError(false);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                            >
                              <ExternalLink size={12} />
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {req.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Vendor Notes</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{req.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Document Modal */}
      <AnimatePresence>
        {viewingDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setViewingDocument(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText size={20} className="text-gray-500 dark:text-gray-300" />
                  Document Preview
                </h3>
                <button
                  onClick={() => setViewingDocument(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-300" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {documentError ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                    <AlertTriangle size={48} className="text-amber-500 mb-4" />
                    <p className="text-gray-900 dark:text-white font-semibold mb-2">Unable to preview document</p>
                    <p className="text-gray-500 dark:text-gray-300 text-sm mb-4">The document may not be supported for preview</p>
                    <a
                      href={viewingDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-festac-dark text-white rounded-lg hover:bg-festac-dark/90 transition-colors text-sm font-medium"
                    >
                      <ExternalLink size={16} />
                      Open in new tab
                    </a>
                  </div>
                ) : (
                  <>
                    {viewingDocument?.match(/\.(png|jpg|jpeg|gif|webp)(?:[?#]|$)/i) ? (
                      <img
                        src={viewingDocument}
                        alt="Document preview"
                        className="max-w-full h-auto mx-auto rounded-lg"
                        onError={() => setDocumentError(true)}
                        onLoad={() => setDocumentError(false)}
                      />
                    ) : viewingDocument?.match(/\.pdf(?:[?#]|$)/i) ? (
                      <div className="flex flex-col h-full">
                        {pdfBlobUrl ? (
                          <iframe
                            src={pdfBlobUrl}
                            className="flex-1 w-full min-h-[600px] border-0 rounded-lg"
                            title="Document Preview"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full min-h-[400px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-festac-green"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                        <FileText size={48} className="text-gray-400 mb-4" />
                        <p className="text-gray-900 dark:text-white font-semibold mb-2">Document preview not available</p>
                        <p className="text-gray-500 dark:text-gray-300 text-sm mb-4">This file type cannot be previewed</p>
                        <a
                          href={viewingDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-festac-dark text-white rounded-lg hover:bg-festac-dark/90 transition-colors text-sm font-medium"
                        >
                          <Download size={16} />
                          Download file
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href={viewingDocument}
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  <Download size={16} />
                  Download
                </a>
                <Button
                  onClick={() => setViewingDocument(null)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, any> = {
    ACTIVE: 'green', PENDING: 'amber', SUSPENDED: 'red', REJECTED: 'gray',
  };
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>;
}
