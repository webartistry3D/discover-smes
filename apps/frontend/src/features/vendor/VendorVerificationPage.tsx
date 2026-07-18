import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronLeft, CheckCircle, AlertCircle, Upload, FileText, Phone, Building2, Shield, Star, Clock, X } from 'lucide-react';
import { Button, Skeleton } from '../../components/ui/index';
import toast from 'react-hot-toast';
import { useVendorVerificationStatus, useVerificationRequests, useSubmitVerificationRequest, getVerificationLevelStatus } from '../../hooks/useVerification';
import type { VerificationLevel } from '../../lib/shared';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';

export default function VendorVerificationPage() {
  const { isDarkMode } = useUIStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: vendor, isLoading: vendorLoading } = useVendorVerificationStatus();
  const { data: requests } = useVerificationRequests();
  const submitVerification = useSubmitVerificationRequest();

  const currentLevel = vendor?.verificationLevel || 'NONE';

  const levels = [
    {
      key: 'PHONE_VERIFIED' as VerificationLevel,
      name: 'Phone Verified',
      icon: <Phone size={24} />,
      description: 'Your phone number has been verified',
      color: 'bg-blue-500',
    },
    {
      key: 'BUSINESS_VERIFIED' as VerificationLevel,
      name: 'Business Verified',
      icon: <Building2 size={24} />,
      description: 'Business documents verified',
      color: 'bg-purple-500',
    },
    {
      key: 'GOVERNMENT_ENDORSED' as VerificationLevel,
      name: 'Government Endorsed',
      icon: <Shield size={24} />,
      description: 'Official government endorsement',
      color: 'bg-amber-500',
    },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (level: VerificationLevel) => {
    // Phone verification is automatic, cannot be requested
    if (level === 'PHONE_VERIFIED') {
      toast.error('Phone verification is automatic and cannot be requested');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('documents', file));
      formData.append('requestedLevel', level);

      await submitVerification.mutateAsync(formData);
      setSelectedFiles([]);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  if (vendorLoading) {
    return (
      <div className={clsx('min-h-screen', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className="bg-gradient-to-r from-festac-green to-emerald-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-48 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('min-h-screen pb-20', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl">Get Verified</h1>
              {/*<p className="text-white/60 text-sm mt-1">Build customer trust with verified badges</p>*/}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  currentLevel === 'PHONE_VERIFIED' ? 'bg-blue-500/20' :
                  currentLevel === 'BUSINESS_VERIFIED' ? 'bg-purple-500/20' :
                  currentLevel === 'GOVERNMENT_ENDORSED' ? 'bg-amber-500/20' :
                  'bg-gray-500/20'
                }`}>
                  {currentLevel === 'PHONE_VERIFIED' ? (
                    <Phone size={20} className="text-blue-300" />
                  ) : currentLevel === 'BUSINESS_VERIFIED' ? (
                    <Building2 size={20} className="text-purple-300" />
                  ) : currentLevel === 'GOVERNMENT_ENDORSED' ? (
                    <Shield size={20} className="text-amber-300" />
                  ) : (
                    <AlertCircle size={20} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <p className="text-white/60 text-xs">Current Level</p>
                  <p className="text-white font-bold text-sm">
                    {currentLevel === 'PHONE_VERIFIED' ? 'Phone Verified' :
                     currentLevel === 'BUSINESS_VERIFIED' ? 'Business Verified' :
                     currentLevel === 'GOVERNMENT_ENDORSED' ? 'Government Endorsed' :
                     'Not Verified'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Star size={20} className="text-green-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Verification Levels</p>
                  <p className="text-white font-bold text-xl">3</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <CheckCircle size={20} className="text-purple-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Completed</p>
                  <p className="text-white font-bold text-xl">
                    {currentLevel === 'NONE' ? '0' :
                     currentLevel === 'PHONE_VERIFIED' ? '1' :
                     currentLevel === 'BUSINESS_VERIFIED' ? '2' : '3'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Current Status */}
        <div className={clsx('rounded-2xl p-6 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 mb-6', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
            <Star className={clsx('w-5 h-5 text-festac-green')} />
            Your Verification Status
          </h2>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${
              currentLevel === 'PHONE_VERIFIED' ? 'bg-blue-100' :
              currentLevel === 'BUSINESS_VERIFIED' ? 'bg-purple-100' :
              currentLevel === 'GOVERNMENT_ENDORSED' ? 'bg-amber-100' :
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {currentLevel === 'PHONE_VERIFIED' ? (
                <Phone className={clsx('w-8 h-8 text-blue-600')} />
              ) : currentLevel === 'BUSINESS_VERIFIED' ? (
                <Building2 className={clsx('w-8 h-8 text-purple-600')} />
              ) : currentLevel === 'GOVERNMENT_ENDORSED' ? (
                <Shield className={clsx('w-8 h-8 text-amber-600')} />
              ) : (
                <AlertCircle className={clsx('w-8 h-8', isDarkMode ? 'text-gray-400' : 'text-gray-400')} />
              )}
            </div>
            <div>
              <p className={clsx('font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
                {currentLevel === 'PHONE_VERIFIED' ? 'Phone Verified' :
                 currentLevel === 'BUSINESS_VERIFIED' ? 'Business Verified' :
                 currentLevel === 'GOVERNMENT_ENDORSED' ? 'Government Endorsed' :
                 'Not Verified'}
              </p>
              <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                {currentLevel === 'NONE' ? 'Complete business verification to continue' :
                 currentLevel === 'PHONE_VERIFIED' ? 'Your phone number is verified' :
                 currentLevel === 'BUSINESS_VERIFIED' ? 'Your business documents are verified' :
                 'You have government endorsement'}
              </p>
            </div>
            {currentLevel !== 'NONE' && (
              <CheckCircle className={clsx('w-6 h-6 text-green-500 ml-auto')} />
            )}
          </div>
        </div>

        {/* Verification Levels */}
        <h2 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Verification Levels</h2>
        <div className="space-y-4 mb-6">
          {levels.map((level, index) => {
            const status = getVerificationLevelStatus(
              currentLevel,
              level.key,
              requests?.find((r) => r.requestedLevel === level.key)?.status
            );
            const request = requests?.find((r) => r.requestedLevel === level.key);

            return (
              <motion.div
                key={level.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={clsx('rounded-2xl p-6 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 border-2', isDarkMode ? 'bg-gray-800' : 'bg-white',
                  status === 'completed' ? 'border-green-500' : 
                  status === 'in_review' ? 'border-amber-500' :
                  status === 'pending' ? 'border-purple-500' : 
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-4 ${level.color} rounded-xl text-white`}>{level.icon}</div>
                  <div className="flex-1">
                    <h3 className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>{level.name}</h3>
                    <p className={clsx('text-sm mb-3', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{level.description}</p>
                    
                    {status === 'completed' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                    
                    {status === 'in_review' && request && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-amber-600">
                          <Clock size={16} />
                          <span className="text-sm font-medium">
                            {request.status === 'PENDING' ? 'Under Review' : 'Pending Approval'}
                          </span>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <p className="text-xs text-amber-800">
                            Submitted on {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {status === 'pending' && (
                      <div className="space-y-3">
                        {level.key === 'PHONE_VERIFIED' ? (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-800">Phone verification is automatic and is completed during registration.</p>
                          </div>
                        ) : level.key === 'BUSINESS_VERIFIED' ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-purple-600">
                              <AlertCircle size={16} />
                              <span className="text-sm font-medium">Business Not Verified</span>
                            </div>
                            <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Business documents not verified</p>
                            {request?.rejectionReason && (
                              <div className="p-3 bg-red-50 rounded-lg">
                                <p className="text-xs text-red-800">{request.rejectionReason}</p>
                              </div>
                            )}
                            <div className="space-y-2">
                              <label className={clsx('block text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Upload Business Documents</label>
                              <div className={clsx('p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                                <p className={clsx('text-xs mb-2', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Accepted document types:</p>
                                <ul className={clsx('text-xs space-y-1 list-disc list-inside', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                                  <li>CAC Certificate</li>
                                  <li>Business License</li>
                                  <li>TIN Certificate</li>
                                  <li>Memorandum of Association</li>
                                  <li>Utility Bill (not older than 3 months)</li>
                                </ul>
                              </div>
                              <div className={clsx('border-2 border-dashed rounded-xl p-4 text-center', isDarkMode ? 'border-gray-600' : 'border-gray-300')}>
                                <Upload className={clsx('w-8 h-8 mx-auto mb-2', isDarkMode ? 'text-gray-400' : 'text-gray-400')} />
                                <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Drag and drop files or click to upload</p>
                                <p className={clsx('text-xs mt-1', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>Max 5 files, PDF or images (JPG, PNG, WEBP)</p>
                                <input
                                  type="file"
                                  multiple
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                  id={`file-upload-${level.key}`}
                                />
                                <label
                                  htmlFor={`file-upload-${level.key}`}
                                  className="inline-block mt-2 px-4 py-2 bg-festac-green text-white rounded-lg text-sm cursor-pointer hover:bg-green-600 transition-colors"
                                >
                                  Select Files
                                </label>
                              </div>
                              {selectedFiles.length > 0 && (
                                <div className="space-y-2">
                                  <p className={clsx('text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Selected Files:</p>
                                  {selectedFiles.map((file, i) => (
                                    <div key={i} className={clsx('flex items-center gap-2 p-2 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                                      <FileText size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
                                      <span className={clsx('text-sm flex-1 truncate', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>{file.name}</span>
                                      <button
                                        onClick={() => handleRemoveFile(i)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Button
                                onClick={() => handleSubmit(level.key)}
                                disabled={isSubmitting || selectedFiles.length === 0}
                                className="w-full"
                              >
                                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-amber-600">
                              <AlertCircle size={16} />
                              <span className="text-sm font-medium">Government Endorsed</span>
                            </div>
                            {request?.rejectionReason && (
                              <div className="p-3 bg-red-50 rounded-lg">
                                <p className="text-xs text-red-800">{request.rejectionReason}</p>
                              </div>
                            )}
                            <div className="space-y-2">
                              <label className={clsx('block text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Upload Government Endorsement Documents</label>
                              <div className={clsx('p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                                <p className={clsx('text-xs mb-2', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Accepted document types:</p>
                                <ul className={clsx('text-xs space-y-1 list-disc list-inside', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                                  <li>Government Approval Letter</li>
                                  <li>Ministry of Trade Certification</li>
                                  <li>Local Government Endorsement</li>
                                  <li>State Government Recognition</li>
                                  <li>Federal Agency Certification</li>
                                </ul>
                              </div>
                              <div className={clsx('border-2 border-dashed rounded-xl p-4 text-center', isDarkMode ? 'border-gray-600' : 'border-gray-300')}>
                                <Upload className={clsx('w-8 h-8 mx-auto mb-2', isDarkMode ? 'text-gray-400' : 'text-gray-400')} />
                                <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Drag and drop files or click to upload</p>
                                <p className={clsx('text-xs mt-1', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>Max 5 files, PDF or images (JPG, PNG, WEBP)</p>
                                <input
                                  type="file"
                                  multiple
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                  id={`file-upload-${level.key}`}
                                />
                                <label
                                  htmlFor={`file-upload-${level.key}`}
                                  className="inline-block mt-2 px-4 py-2 bg-festac-green text-white rounded-lg text-sm cursor-pointer hover:bg-green-600 transition-colors"
                                >
                                  Select Files
                                </label>
                              </div>
                              {selectedFiles.length > 0 && (
                                <div className="space-y-2">
                                  <p className={clsx('text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Selected Files:</p>
                                  {selectedFiles.map((file, i) => (
                                    <div key={i} className={clsx('flex items-center gap-2 p-2 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                                      <FileText size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
                                      <span className={clsx('text-sm flex-1 truncate', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>{file.name}</span>
                                      <button
                                        onClick={() => handleRemoveFile(i)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Button
                                onClick={() => handleSubmit(level.key)}
                                disabled={isSubmitting || selectedFiles.length === 0}
                                className="w-full"
                              >
                                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {status === 'locked' && (
                      <div className={clsx('flex items-center gap-2', isDarkMode ? 'text-gray-400' : 'text-gray-400')}>
                        <AlertCircle size={16} />
                        <span className="text-sm">
                          {level.key === 'GOVERNMENT_ENDORSED' 
                            ? 'Complete business verification first' 
                            : 'Complete previous verification first'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="bg-gradient-hero rounded-2xl p-6 text-white">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Benefits of Verification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Increased customer trust',
              'Higher search rankings',
              'Verified badge on profile',
              'Priority customer support',
              'Access to premium features',
              'Government endorsement opportunities',
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle size={16} />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
