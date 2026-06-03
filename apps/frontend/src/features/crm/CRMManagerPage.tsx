import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Plus, Search, Filter, Users, Mail, Phone, Building2, ChevronLeft, MoreVertical, Edit, Trash2, X, Clock, DollarSign, FileText, MessageSquare, Tag, StickyNote } from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, useCRMSummary, useCustomer, useCustomerNotes, useCustomerTags, useCommunications, useCustomerPurchaseHistory, useCreateCustomerNote, useCreateCustomerTag, useDeleteCustomerTag, useCreateCommunication } from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import type { Customer, CustomerStatus } from '../../lib/shared';
import toast from 'react-hot-toast';

const CUSTOMER_STATUS: { value: CustomerStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-500' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-500' },
  { value: 'VIP', label: 'VIP', color: 'bg-purple-500' },
  { value: 'LEAD', label: 'Lead', color: 'bg-blue-500' },
];

export default function CRMManagerPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customers, isLoading } = useCustomers(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );
  const { data: summary } = useCRMSummary();
  const { data: selectedCustomer } = useCustomer(selectedCustomerId || '');
  const { data: customerNotes } = useCustomerNotes(selectedCustomerId || '');
  const { data: customerTags } = useCustomerTags(selectedCustomerId || '');
  const { data: communications } = useCommunications(selectedCustomerId ? { customerId: selectedCustomerId } : undefined);
  const { data: purchaseHistory } = useCustomerPurchaseHistory(selectedCustomerId || '');
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const createCustomerNote = useCreateCustomerNote();
  const createCustomerTag = useCreateCustomerTag();
  const deleteCustomerTag = useDeleteCustomerTag();
  const createCommunication = useCreateCommunication();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    company: '',
    notes: '',
    status: 'ACTIVE' as CustomerStatus,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer.mutateAsync(formData);
      toast.success('Customer created');
      setIsAdding(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        company: '',
        notes: '',
        status: 'ACTIVE',
      });
    } catch {
      toast.error('Failed to create customer');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateCustomer.mutateAsync({ id: editingId, data: formData });
      toast.success('Customer updated');
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        company: '',
        notes: '',
        status: 'ACTIVE',
      });
    } catch {
      toast.error('Failed to update customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success('Customer deleted');
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      company: customer.company || '',
      notes: customer.notes || '',
      status: customer.status,
    });
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    const noteContent = (e.target as HTMLFormElement).noteContent.value;
    if (!noteContent.trim()) return;
    try {
      await createCustomerNote.mutateAsync({ customerId: selectedCustomerId, data: { content: noteContent, isPrivate: false } });
      toast.success('Note added');
      (e.target as HTMLFormElement).reset();
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    const form = e.target as HTMLFormElement;
    const tagName = form.elements.namedItem('newTagName') as HTMLInputElement;
    if (!tagName.value.trim()) return;
    try {
      await createCustomerTag.mutateAsync({ customerId: selectedCustomerId, data: { name: tagName.value, color: '#6366f1' } });
      toast.success('Tag added');
      form.reset();
    } catch {
      toast.error('Failed to add tag');
    }
  };

  const handleAddCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    const form = e.target as HTMLFormElement;
    const type = form.commType.value;
    const direction = form.commDirection.value;
    const content = form.commContent.value;
    if (!content.trim()) return;
    try {
      await createCommunication.mutateAsync({ customerId: selectedCustomerId, data: { type, direction, content, status: 'SENT' } });
      toast.success('Communication logged');
      form.reset();
    } catch {
      toast.error('Failed to log communication');
    }
  };

  const getStatusInfo = (status: CustomerStatus) => {
    return CUSTOMER_STATUS.find((s) => s.value === status) || CUSTOMER_STATUS[0];
  };

  const filteredCustomers = customers?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
              <h1 className="font-display font-bold text-2xl">CRM Manager</h1>
              <p className="text-white/60 text-sm mt-1">Manage your customer relationships</p>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="primary">
              <Plus size={18} className="mr-2" />
              Add Customer
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users size={20} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Customers</p>
                  <p className="text-white font-bold text-xl">{summary?.totalCustomers || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Users size={20} className="text-green-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Active Customers</p>
                  <p className="text-white font-bold text-xl">{summary?.statusBreakdown?.active || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Mail size={20} className="text-purple-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Recent Communications</p>
                  <p className="text-white font-bold text-xl">{summary?.recentCommunications || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green bg-white"
            >
              <option value="all">All Status</option>
              {CUSTOMER_STATUS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filteredCustomers && filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 min-w-max sm:block xs:block">
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className="min-w-[320px] flex-shrink-0 sm:min-w-full bg-white rounded-xl p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                        <Badge className={getStatusInfo(customer.status).color}>
                          {getStatusInfo(customer.status).label}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.company && (
                          <div className="flex items-center gap-2">
                            <Building2 size={14} />
                            <span>{customer.company}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>₦{Number(customer.totalSpent).toLocaleString()} spent</span>
                        <span>{customer._count?.invoices || 0} purchases</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(customer);
                        }}
                        className="p-2 text-gray-400 hover:text-festac-green hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(customer.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No customers found</p>
          </div>
        )}
      </div>

      {/* Customer Detail View */}
      {selectedCustomerId && selectedCustomer && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedCustomerId(null)}
              className="p-2 bg-white rounded-xl shadow-card hover:shadow-md transition-shadow"
            >
              <X size={20} />
            </button>
            <div className="flex-1">
              <h2 className="font-display font-bold text-2xl">{selectedCustomer.name}</h2>
              <p className="text-gray-500 text-sm">{selectedCustomer.company || 'Individual Customer'}</p>
            </div>
            <Badge className={getStatusInfo(selectedCustomer.status).color}>
              {getStatusInfo(selectedCustomer.status).label}
            </Badge>
          </div>

          {/* Purchase History */}
          {purchaseHistory && (
            <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-festac-green" />
                Purchase History
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Purchases</p>
                  <p className="font-bold text-gray-900">{purchaseHistory.totalPurchases}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                  <p className="font-bold text-gray-900">₦{purchaseHistory.totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Avg. Order Value</p>
                  <p className="font-bold text-gray-900">₦{purchaseHistory.averageOrderValue.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Last Purchase</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {purchaseHistory.lastPurchaseDate ? new Date(purchaseHistory.lastPurchaseDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              {purchaseHistory.invoices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Recent Invoices</h4>
                  {purchaseHistory.invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₦{invoice.total.toLocaleString()}</p>
                        <Badge className="text-xs">{invoice.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag size={18} className="text-festac-green" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {customerTags && customerTags.length > 0 ? (
                customerTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="px-3 py-1 rounded-full text-sm text-white flex items-center gap-2"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <button
                      onClick={() => deleteCustomerTag.mutateAsync({ customerId: selectedCustomerId, id: tag.id })}
                      className="hover:opacity-75"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No tags yet</p>
              )}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                name="newTagName"
                type="text"
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
              />
              <Button type="submit" variant="primary" size="sm">
                Add
              </Button>
            </form>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <StickyNote size={18} className="text-festac-green" />
              Notes
            </h3>
            <div className="space-y-3 mb-4">
              {customerNotes && customerNotes.length > 0 ? (
                customerNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(note.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No notes yet</p>
              )}
            </div>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                name="noteContent"
                type="text"
                placeholder="Add a note..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
              />
              <Button type="submit" variant="primary" size="sm">
                Add
              </Button>
            </form>
          </div>

          {/* Communications */}
          <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-festac-green" />
              Communications
            </h3>
            <div className="space-y-3 mb-4">
              {communications && communications.length > 0 ? (
                communications.map((comm) => (
                  <div key={comm.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500">{comm.type}</span>
                      <span className="text-xs text-gray-400">{new Date(comm.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comm.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No communications yet</p>
              )}
            </div>
            <form onSubmit={handleAddCommunication} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  name="commType"
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green bg-white"
                >
                  <option value="PHONE_CALL">Phone Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="IN_PERSON">In Person</option>
                </select>
                <select
                  name="commDirection"
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green bg-white"
                >
                  <option value="OUTBOUND">Outbound</option>
                  <option value="INBOUND">Inbound</option>
                </select>
              </div>
              <textarea
                name="commContent"
                placeholder="Log communication details..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
              />
              <Button type="submit" variant="primary" size="sm">
                Log Communication
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
              <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green bg-white"
                  >
                    {CUSTOMER_STATUS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        address: '',
                        city: '',
                        state: '',
                        company: '',
                        notes: '',
                        status: 'ACTIVE',
                      });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1">
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
