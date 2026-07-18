import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Plus, Search, Filter, Users, Mail, Phone, Building2, ChevronLeft, MoreVertical, Edit, Trash2, X, Clock, DollarSign, FileText, MessageSquare, Tag, StickyNote } from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, useCRMSummary, useCustomer, useCustomerNotes, useCustomerTags, useCommunications, useCustomerPurchaseHistory, useCreateCustomerNote, useCreateCustomerTag, useDeleteCustomerTag, useCreateCommunication } from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { KPICard } from '../../components/ui/KPICard';
import { RecordListView, type ViewMode } from '../../components/ui/RecordListView';
import type { Customer, CustomerStatus } from '../../lib/shared';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';

const CUSTOMER_STATUS: { value: CustomerStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-500' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-500' },
  { value: 'VIP', label: 'VIP', color: 'bg-purple-500' },
  { value: 'LEAD', label: 'Lead', color: 'bg-blue-500' },
];

export default function CRMManagerPage() {
  const { isDarkMode } = useUIStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customers, isLoading } = useCustomers(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );
  const { data: summary, isLoading: crmSummaryLoading } = useCRMSummary();
  const { data: selectedCustomer } = useCustomer(selectedCustomerId || '');
  const { data: customerNotes } = useCustomerNotes(selectedCustomerId || '');
  const { data: customerTags } = useCustomerTags(selectedCustomerId || '');
  const { data: communications } = useCommunications(selectedCustomerId ? { customerId: selectedCustomerId } : undefined);
  const { data: purchaseHistory, isLoading: purchaseHistoryLoading } = useCustomerPurchaseHistory(selectedCustomerId || '');
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

  const renderCustomer = (customer: Customer, viewMode: ViewMode) => {
    const statusInfo = getStatusInfo(customer.status);
    if (viewMode === 'list') {
      return (
        <>
          <td className="px-4 py-3 min-w-[240px] max-w-[360px]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx('font-medium line-clamp-2', isDarkMode ? 'text-white' : 'text-gray-900')}>{customer.name}</span>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 min-w-[180px]">{customer.email || '-'}</td>
          <td className="px-4 py-3 min-w-[140px]">{customer.phone || '-'}</td>
          <td className="px-4 py-3 min-w-[160px]">{customer.company || '-'}</td>
          <td className="px-4 py-3 text-right font-mono font-semibold text-base min-w-[140px]">₦{Number(customer.totalSpent).toLocaleString()}</td>
          <td className="px-4 py-3 min-w-[100px]">{customer._count?.invoices || 0}</td>
        </>
      );
    }
    return (
      <motion.div
        key={customer.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setSelectedCustomerId(customer.id)}
        className={clsx('w-full rounded-xl p-4 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 hover:shadow-md transition-shadow cursor-pointer', isDarkMode ? 'bg-gray-800' : 'bg-white')}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>{customer.name}</h3>
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>

            <div className={clsx('space-y-1 text-sm', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
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

            <div className={clsx('mt-2 flex items-center gap-4 text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
              <span className="font-mono">₦{Number(customer.totalSpent).toLocaleString()}</span> spent
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
    );
  };

  const filteredCustomers = customers?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={clsx('min-h-screen pb-20', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className={clsx('shadow-sm', isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <button className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl">CRM Manager</h1>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="primary" className="p-2">
              <Plus size={20} />
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <KPICard
              icon={<Users size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />}
              iconContainerClassName={clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20')}
              label="Total Customers"
              value={summary?.totalCustomers || 0}
              isLoading={crmSummaryLoading}
            />
            <KPICard
              icon={<Users size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />}
              iconContainerClassName={clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20')}
              label="Active Customers"
              value={summary?.statusBreakdown?.active || 0}
              isLoading={crmSummaryLoading}
              delay={0.1}
            />
            <KPICard
              icon={<Mail size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />}
              iconContainerClassName={clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20')}
              label="Recent Feedback"
              value={summary?.recentCommunications || 0}
              isLoading={crmSummaryLoading}
              delay={0.2}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className={clsx('absolute left-3 top-1/2 -translate-y-1/2', isDarkMode ? 'text-gray-400' : 'text-gray-400')} size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx('w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-200')}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={clsx('px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-200 bg-white')}
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
        <RecordListView
          items={filteredCustomers || []}
          isLoading={isLoading}
          keyExtractor={(customer) => customer.id}
          renderItem={renderCustomer}
          listHeader={(
            <tr>
              <th className="px-4 py-2 font-medium min-w-[240px]">Customer</th>
              <th className="px-4 py-2 font-medium min-w-[180px]">Email</th>
              <th className="px-4 py-2 font-medium min-w-[140px]">Phone</th>
              <th className="px-4 py-2 font-medium min-w-[160px]">Company</th>
              <th className="px-4 py-2 font-medium text-right min-w-[140px]">Spent</th>
              <th className="px-4 py-2 font-medium min-w-[100px]">Purchases</th>
            </tr>
          )}
          emptyState={(
            <div className={clsx('rounded-xl p-8 text-center', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
              <Users size={48} className={clsx('mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
              <p className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No customers found</p>
            </div>
          )}
        />
      </div>

      {/* Customer Detail View */}
      {selectedCustomerId && selectedCustomer && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedCustomerId(null)}
              className={clsx('p-2 rounded-xl shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 hover:shadow-md transition-shadow', isDarkMode ? 'bg-gray-800' : 'bg-white')}
            >
              <X size={20} />
            </button>
            <div className="flex-1">
              <h2 className={clsx('font-display font-bold text-2xl', isDarkMode ? 'text-white' : 'text-gray-900')}>{selectedCustomer.name}</h2>
              <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{selectedCustomer.company || 'Individual Customer'}</p>
            </div>
            <Badge className={getStatusInfo(selectedCustomer.status).color}>
              {getStatusInfo(selectedCustomer.status).label}
            </Badge>
          </div>

          {/* Purchase History */}
          {selectedCustomerId && (
            <div className={clsx('rounded-2xl p-6 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 mb-6', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
              <h3 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
                <DollarSign size={18} className="text-festac-green" />
                Purchase History
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <KPICard
                  label="Total Purchases"
                  value={purchaseHistory?.totalPurchases ?? 0}
                  isLoading={purchaseHistoryLoading}
                  labelPosition="top-left"
                  labelClassName="text-xs mb-1"
                  valueClassName="text-base font-bold font-mono"
                  containerClassName="rounded-xl p-4 gap-0 bg-gray-50"
                />
                <KPICard
                  label="Total Spent"
                  value={purchaseHistory ? '₦' + purchaseHistory.totalSpent.toLocaleString() : '₦0'}
                  isLoading={purchaseHistoryLoading}
                  labelPosition="top-left"
                  labelClassName="text-xs mb-1"
                  valueClassName="text-base font-bold font-mono"
                  containerClassName="rounded-xl p-4 gap-0 bg-gray-50"
                  delay={0.1}
                />
                <KPICard
                  label="Avg. Order Value"
                  value={purchaseHistory ? '₦' + purchaseHistory.averageOrderValue.toLocaleString() : '₦0'}
                  isLoading={purchaseHistoryLoading}
                  labelPosition="top-left"
                  labelClassName="text-xs mb-1"
                  valueClassName="text-base font-bold font-mono"
                  containerClassName="rounded-xl p-4 gap-0 bg-gray-50"
                  delay={0.2}
                />
                <KPICard
                  label="Last Purchase"
                  value={purchaseHistory?.lastPurchaseDate ? new Date(purchaseHistory.lastPurchaseDate).toLocaleDateString() : 'N/A'}
                  isLoading={purchaseHistoryLoading}
                  labelPosition="top-left"
                  labelClassName="text-xs mb-1"
                  valueClassName="text-sm font-bold font-mono"
                  containerClassName="rounded-xl p-4 gap-0 bg-gray-50"
                  delay={0.3}
                />
              </div>
              {purchaseHistory?.invoices && purchaseHistory.invoices.length > 0 && (
                <div className="space-y-2">
                  <h4 className={clsx('text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Recent Invoices</h4>
                  {purchaseHistory.invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className={clsx('flex items-center justify-between p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                      <div>
                        <p className={clsx('text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{invoice.invoiceNumber}</p>
                        <p className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={clsx('font-semibold font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{invoice.total.toLocaleString()}</p>
                        <Badge className="text-xs">{invoice.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className={clsx('rounded-2xl p-6 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 mb-6', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <h3 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
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
                <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No tags yet</p>
              )}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                name="newTagName"
                type="text"
                placeholder="Add a tag..."
                className={clsx('flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
              />
              <Button type="submit" variant="primary" size="sm">
                Add
              </Button>
            </form>
          </div>

          {/* Notes */}
          <div className={clsx('rounded-2xl p-6 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 mb-6', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <h3 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
              <StickyNote size={18} className="text-festac-green" />
              Notes
            </h3>
            <div className="space-y-3 mb-4">
              {customerNotes && customerNotes.length > 0 ? (
                customerNotes.map((note) => (
                  <div key={note.id} className={clsx('p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                    <p className={clsx('text-sm', isDarkMode ? 'text-gray-200' : 'text-gray-700')}>{note.content}</p>
                    <p className={clsx('text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-400')}>{new Date(note.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No notes yet</p>
              )}
            </div>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                name="noteContent"
                type="text"
                placeholder="Add a note..."
                className={clsx('flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
              />
              <Button type="submit" variant="primary" size="sm">
                Add
              </Button>
            </form>
          </div>

          {/* Communications */}
          <div className={clsx('rounded-2xl p-6 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 mb-6', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <h3 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
              <MessageSquare size={18} className="text-festac-green" />
              Communications
            </h3>
            <div className="space-y-3 mb-4">
              {communications && communications.length > 0 ? (
                communications.map((comm) => (
                  <div key={comm.id} className={clsx('p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={clsx('text-xs font-medium', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{comm.type}</span>
                      <span className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-400')}>{new Date(comm.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className={clsx('text-sm', isDarkMode ? 'text-gray-200' : 'text-gray-700')}>{comm.content}</p>
                  </div>
                ))
              ) : (
                <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No communications yet</p>
              )}
            </div>
            <form onSubmit={handleAddCommunication} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  name="commType"
                  className={clsx('px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white')}
                >
                  <option value="PHONE_CALL">Phone Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="IN_PERSON">In Person</option>
                </select>
                <select
                  name="commDirection"
                  className={clsx('px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white')}
                >
                  <option value="OUTBOUND">Outbound</option>
                  <option value="INBOUND">Inbound</option>
                </select>
              </div>
              <textarea
                name="commContent"
                placeholder="Log communication details..."
                rows={2}
                className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
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
            className={clsx('rounded-2xl w-full max-w-lg max-h-[67.5vh] overflow-y-auto', isDarkMode ? 'bg-gray-800' : 'bg-white')}
          >
            <div className="p-6">
              <h2 className={clsx('text-xl font-bold mb-6', isDarkMode ? 'text-white' : 'text-gray-900')}>{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
              <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white')}
                  >
                    {CUSTOMER_STATUS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
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
