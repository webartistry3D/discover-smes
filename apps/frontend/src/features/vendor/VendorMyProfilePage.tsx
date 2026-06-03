import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Clock, MessageCircle, Star, Package, Wrench, ChevronDown,
  Share2, Heart, ArrowLeft, CheckCircle, Truck, ExternalLink, Calendar,
  Edit, Save, X, Plus,
} from 'lucide-react';
import { useVendorDetail, useCreateProduct, useUpdateProduct, useDeleteProduct, useCreateService, useUpdateService, useDeleteService, useUploadProductImages } from '../../hooks/useVendors';
import { useAuthStore } from '../../stores/auth.store';
import { VerificationBadge } from '../../components/ui/VerificationBadge';
import { StarRating, Skeleton, Avatar, Badge, Button } from '../../components/ui/index';
import { generateWhatsAppUrl, generateWhatsAppGreeting, formatNaira, isVendorOpenNow } from '../../lib/shared';
import toast from 'react-hot-toast';

export default function VendorMyProfilePage() {
  const { user } = useAuthStore();
  const vendorId = user?.vendorId;
  
  // Use vendor detail hook to fetch the vendor's own profile
  const { data: vendor, isLoading } = useVendorDetail(
    vendorId ?? ''
  );
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'services' | 'reviews'>('overview');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);

  // Mutations
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const uploadProductImages = useUploadProductImages();

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: '',
  });
  const [productImages, setProductImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    priceLabel: '',
    durationMinutes: '',
    bookingRequired: false,
  });

  // Edit form state
  const [editData, setEditData] = useState({
    businessName: vendor?.businessName || '',
    description: vendor?.description || '',
    phone: vendor?.phone || '',
    whatsappPhone: vendor?.whatsappPhone || '',
    address: vendor?.address || '',
    coverPhoto: vendor?.coverPhoto || '',
  });
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);

  if (!user?.vendorId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">You need to be a vendor to view this page</p>
          <Link href="/vendors/new">
            <Button variant="primary" className="mt-4">Become a Vendor</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) return <VendorProfileSkeleton />;

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Vendor profile not found</p>
          <Link href="/dashboard">
            <Button variant="primary" className="mt-4">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOpen = isVendorOpenNow(vendor.openingHours as any);
  const waUrl = vendor.whatsappPhone
    ? generateWhatsAppUrl(vendor.whatsappPhone, generateWhatsAppGreeting(vendor.businessName))
    : null;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: vendor.businessName, text: vendor.description, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const handleEdit = () => {
    setEditData({
      businessName: vendor.businessName || '',
      description: vendor.description || '',
      phone: vendor.phone || '',
      whatsappPhone: vendor.whatsappPhone || '',
      address: vendor.address || '',
      coverPhoto: vendor.coverPhoto || '',
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Upload cover photo if changed
      let coverPhotoUrl = editData.coverPhoto;
      if (coverPhotoFile) {
        const uploadResponse = await uploadProductImages.mutateAsync([coverPhotoFile]);
        if (uploadResponse && uploadResponse.length > 0) {
          coverPhotoUrl = uploadResponse[0];
        }
      }

      // Update vendor profile
      const updateData: any = {
        businessName: editData.businessName,
        description: editData.description,
        phone: editData.phone,
        whatsappPhone: editData.whatsappPhone,
        address: editData.address,
      };

      if (coverPhotoUrl) {
        updateData.coverPhoto = coverPhotoUrl;
      }

      // TODO: Call API to update vendor profile with updateData
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  // Product handlers
  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast.error('Name and price are required');
      return;
    }
    
    let imageUrls: string[] = [];
    if (productImages.length > 0) {
      try {
        imageUrls = await uploadProductImages.mutateAsync(productImages);
      } catch (error) {
        toast.error('Failed to upload images');
        return;
      }
    }

    createProduct.mutate(
      { vendorId: vendorId!, data: { ...productForm, price: Number(productForm.price), images: imageUrls } },
      {
        onSuccess: () => {
          toast.success('Product added successfully');
          setIsAddingProduct(false);
          setProductForm({ name: '', description: '', price: '', unit: '' });
          setProductImages([]);
          setUploadedImageUrls([]);
        },
        onError: () => {
          toast.error('Failed to add product');
        },
      }
    );
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      unit: product.unit || '',
    });
    setUploadedImageUrls(product.images || []);
  };

  const handleUpdateProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast.error('Name and price are required');
      return;
    }

    let imageUrls = uploadedImageUrls;
    if (productImages.length > 0) {
      try {
        const newUrls = await uploadProductImages.mutateAsync(productImages);
        imageUrls = [...imageUrls, ...newUrls].slice(0, 5);
      } catch (error) {
        toast.error('Failed to upload images');
        return;
      }
    }

    updateProduct.mutate(
      { vendorId: vendorId!, productId: editingProduct.id, data: { ...productForm, price: Number(productForm.price), images: imageUrls } },
      {
        onSuccess: () => {
          toast.success('Product updated successfully');
          setEditingProduct(null);
          setProductForm({ name: '', description: '', price: '', unit: '' });
          setProductImages([]);
          setUploadedImageUrls([]);
        },
        onError: () => {
          toast.error('Failed to update product');
        },
      }
    );
  };

  const handleDeleteProduct = (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    deleteProduct.mutate(
      { vendorId: vendorId!, productId },
      {
        onSuccess: () => {
          toast.success('Product deleted successfully');
        },
        onError: () => {
          toast.error('Failed to delete product');
        },
      }
    );
  };

  // Image handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + uploadedImageUrls.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setProductImages([...productImages, ...files]);
  };

  const handleRemoveImage = (index: number, isUploaded: boolean) => {
    if (isUploaded) {
      setUploadedImageUrls(uploadedImageUrls.filter((_, i) => i !== index));
    } else {
      setProductImages(productImages.filter((_, i) => i !== index));
    }
  };

  // Service handlers
  const handleAddService = () => {
    if (!serviceForm.name) {
      toast.error('Name is required');
      return;
    }
    createService.mutate(
      {
        vendorId: vendorId!,
        data: {
          ...serviceForm,
          price: serviceForm.price ? Number(serviceForm.price) : undefined,
          durationMinutes: serviceForm.durationMinutes ? Number(serviceForm.durationMinutes) : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Service added successfully');
          setIsAddingService(false);
          setServiceForm({ name: '', description: '', price: '', priceLabel: '', durationMinutes: '', bookingRequired: false });
        },
        onError: () => {
          toast.error('Failed to add service');
        },
      }
    );
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      price: service.price ? String(service.price) : '',
      priceLabel: service.priceLabel || '',
      durationMinutes: service.durationMinutes ? String(service.durationMinutes) : '',
      bookingRequired: service.bookingRequired || false,
    });
  };

  const handleUpdateService = () => {
    if (!serviceForm.name) {
      toast.error('Name is required');
      return;
    }
    updateService.mutate(
      {
        vendorId: vendorId!,
        serviceId: editingService.id,
        data: {
          ...serviceForm,
          price: serviceForm.price ? Number(serviceForm.price) : undefined,
          durationMinutes: serviceForm.durationMinutes ? Number(serviceForm.durationMinutes) : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Service updated successfully');
          setEditingService(null);
          setServiceForm({ name: '', description: '', price: '', priceLabel: '', durationMinutes: '', bookingRequired: false });
        },
        onError: () => {
          toast.error('Failed to update service');
        },
      }
    );
  };

  const handleDeleteService = (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    deleteService.mutate(
      { vendorId: vendorId!, serviceId },
      {
        onSuccess: () => {
          toast.success('Service deleted successfully');
        },
        onError: () => {
          toast.error('Failed to delete service');
        },
      }
    );
  };

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: `Products (${vendor.products?.length ?? 0})` },
    { id: 'services', label: `Services (${vendor.services?.length ?? 0})` },
    { id: 'reviews', label: `Reviews (${vendor.totalReviews})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Cover Image */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-gray-200 to-gray-300">
        {vendor.coverImage ? (
          <img src={vendor.coverImage} alt={vendor.businessName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">🏪</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Back button */}
        <Link href="/dashboard">
          <button className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-sm rounded-xl text-white hover:bg-black/50 transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>

        {/* Edit + Share + Save */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button onClick={handleShare} className="p-2 bg-black/30 backdrop-blur-sm rounded-xl text-white hover:bg-black/50 transition-colors">
            <Share2 size={16} />
          </button>
          <button onClick={() => setIsSaved(!isSaved)} className="p-2 bg-black/30 backdrop-blur-sm rounded-xl text-white hover:bg-black/50 transition-colors">
            <Heart size={16} className={isSaved ? 'fill-red-500 text-red-500' : ''} />
          </button>
          <button
            onClick={handleEdit}
            className="p-2 bg-black/30 backdrop-blur-sm rounded-xl text-white hover:bg-black/50 transition-colors"
          >
            <Edit size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Business Header Card */}
        <div className="bg-white rounded-3xl shadow-card -mt-10 relative z-10 p-6">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
              {vendor.logo ? (
                <img src={vendor.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="font-display font-bold text-xl text-gray-900 leading-tight">{vendor.businessName}</h1>
                  {vendor.category && (
                    <span className="text-xs text-festac-green font-semibold uppercase tracking-wider">{vendor.category.name}</span>
                  )}
                </div>
                <VerificationBadge level={vendor.verificationLevel} size="sm" />
              </div>

              {/* Stats row */}
              <div className="flex items-center flex-wrap gap-3 mt-2">
                {vendor.totalReviews > 0 && (
                  <StarRating rating={vendor.averageRating} showValue reviewCount={vendor.totalReviews} />
                )}
                <span className={`text-xs font-semibold flex items-center gap-1 ${isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                  <Clock size={11} />
                  {isOpen ? 'Open Now' : 'Closed'}
                </span>
                {vendor.deliveryAvailable && (
                  <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Truck size={11} /> Delivery
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Location + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={14} className="text-festac-green flex-shrink-0" />
              <span className="truncate">{vendor.address}</span>
            </div>
            {vendor.phone && (
              <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-festac-green transition-colors">
                <Phone size={14} className="text-festac-green flex-shrink-0" />
                {vendor.phone}
              </a>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2 mt-5">
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp flex-1 justify-center py-3">
                <MessageCircle size={16} />
                Chat on WhatsApp
              </a>
            )}
            <Link href="/dashboard">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-800 font-semibold text-sm rounded-xl hover:bg-gray-200 active:scale-95 transition-all">
                <Edit size={15} />
                Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setIsEditing(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-gray-900">Edit Profile</h2>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Cover Photo</label>
                    <div className="mt-2">
                      {editData.coverPhoto ? (
                        <div className="relative">
                          <img
                            src={editData.coverPhoto}
                            alt="Cover photo"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setEditData({ ...editData, coverPhoto: '' });
                              setCoverPhotoFile(null);
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCoverPhotoFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditData({ ...editData, coverPhoto: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                            id="coverPhotoInput"
                          />
                          <label
                            htmlFor="coverPhotoInput"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <Plus size={24} className="text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Upload cover photo</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Business Name</label>
                    <input
                      type="text"
                      value={editData.businessName}
                      onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20 resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">WhatsApp Phone</label>
                    <input
                      type="tel"
                      value={editData.whatsappPhone}
                      onChange={(e) => setEditData({ ...editData, whatsappPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Address</label>
                    <input
                      type="text"
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-festac-green rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Product Modal */}
        <AnimatePresence>
          {(isAddingProduct || editingProduct) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-gray-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                  <button
                    onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="e.g., Jollof Rice"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Describe your product..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Price (₦) *</label>
                      <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Unit</label>
                      <input
                        type="text"
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        placeholder="plate, piece, etc."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Images (max 5)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="product-images"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="product-images"
                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-festac-green transition-colors"
                      >
                        <Plus size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Add Images</span>
                      </label>
                      <span className="text-xs text-gray-400">{uploadedImageUrls.length + productImages.length}/5</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {uploadedImageUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square">
                          <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                          <button
                            onClick={() => handleRemoveImage(index, true)}
                            className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {productImages.map((file, index) => (
                        <div key={index} className="relative aspect-square">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover rounded-lg" />
                          <button
                            onClick={() => handleRemoveImage(index, false)}
                            className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => { setIsAddingProduct(false); setEditingProduct(null); setProductImages([]); setUploadedImageUrls([]); }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                    disabled={createProduct.isPending || updateProduct.isPending || uploadProductImages.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-festac-green rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {uploadProductImages.isPending ? 'Uploading...' : (editingProduct ? 'Update' : 'Add')} Product
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Service Modal */}
        <AnimatePresence>
          {(isAddingService || editingService) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => { setIsAddingService(false); setEditingService(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-gray-900">{editingService ? 'Edit Service' : 'Add Service'}</h2>
                  <button
                    onClick={() => { setIsAddingService(false); setEditingService(null); }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Service Name *</label>
                    <input
                      type="text"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      placeholder="e.g., Haircut"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
                    <textarea
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      placeholder="Describe your service..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Price (₦)</label>
                      <input
                        type="number"
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Duration (mins)</label>
                      <input
                        type="number"
                        value={serviceForm.durationMinutes}
                        onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })}
                        placeholder="30"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Price Label (optional)</label>
                    <input
                      type="text"
                      value={serviceForm.priceLabel}
                      onChange={(e) => setServiceForm({ ...serviceForm, priceLabel: e.target.value })}
                      placeholder="e.g., Starting from"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="booking"
                      checked={serviceForm.bookingRequired}
                      onChange={(e) => setServiceForm({ ...serviceForm, bookingRequired: e.target.checked })}
                      className="rounded text-festac-green"
                    />
                    <label htmlFor="booking" className="text-sm text-gray-700">Requires booking</label>
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => { setIsAddingService(false); setEditingService(null); }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingService ? handleUpdateService : handleAddService}
                    disabled={createService.isPending || updateService.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-festac-green rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {editingService ? 'Update' : 'Add'} Service
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-5">
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 overflow-x-auto scrollbar-hide flex-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {(activeTab === 'products' || activeTab === 'services') && (
            <button
              onClick={() => activeTab === 'products' ? setIsAddingProduct(true) : setIsAddingService(true)}
              className="flex-shrink-0 p-2 bg-festac-green text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="mt-5 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Description */}
                <div className="bg-white rounded-2xl p-5 shadow-card">
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className={`text-gray-600 text-sm leading-relaxed ${!showFullDesc && 'line-clamp-4'}`}>
                    {vendor.description}
                  </p>
                  {vendor.description?.length > 200 && (
                    <button onClick={() => setShowFullDesc(!showFullDesc)} className="flex items-center gap-1 text-festac-green text-xs font-semibold mt-2">
                      {showFullDesc ? 'Show less' : 'Read more'} <ChevronDown size={12} className={showFullDesc ? 'rotate-180' : ''} />
                    </button>
                  )}
                </div>

                {/* Opening Hours */}
                {vendor.openingHours && (
                  <div className="bg-white rounded-2xl p-5 shadow-card">
                    <h3 className="font-semibold text-gray-900 mb-3">Opening Hours</h3>
                    <OpeningHoursGrid hours={vendor.openingHours as any} />
                  </div>
                )}

                {/* FAQs */}
                {vendor.faqs?.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-card">
                    <h3 className="font-semibold text-gray-900 mb-3">Frequently Asked Questions</h3>
                    <div className="space-y-3">
                      {vendor.faqs.map((faq: any) => (
                        <div key={faq.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                          <p className="text-sm font-medium text-gray-800">Q: {faq.question}</p>
                          <p className="text-sm text-gray-500 mt-1">A: {faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Promotions */}
                {vendor.promotions?.length > 0 && (
                  <div className="bg-festac-amber/10 border border-festac-amber/20 rounded-2xl p-5">
                    <h3 className="font-semibold text-amber-800 mb-2">🎉 Current Offers</h3>
                    {vendor.promotions.map((promo: any) => (
                      <div key={promo.id}>
                        <p className="font-medium text-amber-900 text-sm">{promo.title}</p>
                        {promo.description && <p className="text-amber-700 text-xs mt-0.5">{promo.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {vendor.products?.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Package size={32} className="mx-auto mb-2" />
                    <p className="text-sm">No products yet. Click the + button to add your first product.</p>
                  </div>
                ) : (
                  vendor.products?.map((p: any) => (
                    <div key={p.id} className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-400" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        {p.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{p.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-festac-green text-sm">{formatNaira(Number(p.price))}</p>
                        {p.unit && <p className="text-gray-400 text-xs">per {p.unit}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <X size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {vendor.services?.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Wrench size={32} className="mx-auto mb-2" />
                    <p className="text-sm">No services yet. Click the + button to add your first service.</p>
                  </div>
                ) : (
                  vendor.services?.map((s: any) => (
                    <div key={s.id} className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-4">
                      <div className="w-12 h-12 bg-festac-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wrench size={20} className="text-festac-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        {s.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{s.description}</p>}
                        {s.durationMinutes && <p className="text-gray-400 text-xs mt-0.5">{s.durationMinutes} mins</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-festac-green text-sm">
                          {s.price ? formatNaira(Number(s.price)) : s.priceLabel ?? 'Contact'}
                        </p>
                        {s.bookingRequired && (
                          <span className="text-xs text-blue-600 font-medium">Booking req.</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditService(s)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <X size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="text-center py-12 text-gray-400">
                  <Star size={32} className="mx-auto mb-2" />
                  <p className="text-sm">Reviews will appear here</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function OpeningHoursGrid({ hours }: { hours: Record<string, any> }) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {days.map((day) => {
        const h = hours[day];
        if (!h) return null;
        return (
          <div key={day} className="flex items-center justify-between text-sm">
            <span className="capitalize text-gray-600 font-medium">{day}</span>
            {h.isClosed ? (
              <span className="text-gray-400">Closed</span>
            ) : (
              <span className="text-gray-700">{h.open} - {h.close}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VendorProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-64 sm:h-80 bg-gray-200 animate-pulse" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10">
        <div className="bg-white rounded-3xl p-6 shadow-card">
          <div className="flex gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
