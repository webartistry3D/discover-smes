import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Plus, Search, Filter, Package, AlertTriangle, TrendingUp, DollarSign, ArrowUp, ArrowDown, X, Edit, Trash2, MoreVertical, Clock, BarChart3, ChevronLeft } from 'lucide-react';
import { useInventoryItems, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem, useInventorySummary, useInventoryItem, useStockMovements, useCreateStockMovement, useStockAlerts, useResolveStockAlert, useInventoryValuation, useCategories, useCreateCategory } from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { RecordListView, type ViewMode } from '../../components/ui/RecordListView';
import type { InventoryItem, MovementType, AlertSeverity } from '../../lib/shared';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';

const MOVEMENT_TYPES: { value: MovementType; label: string; color: string }[] = [
  { value: 'IN', label: 'Stock In', color: 'bg-green-500' },
  { value: 'OUT', label: 'Stock Out', color: 'bg-red-500' },
  { value: 'ADJUSTMENT', label: 'Adjustment', color: 'bg-blue-500' },
  { value: 'TRANSFER', label: 'Transfer', color: 'bg-purple-500' },
  { value: 'RETURN', label: 'Return', color: 'bg-orange-500' },
  { value: 'DAMAGE', label: 'Damage', color: 'bg-red-600' },
  { value: 'LOSS', label: 'Loss', color: 'bg-gray-600' },
];

const ALERT_SEVERITY: { value: AlertSeverity; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-yellow-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-orange-500' },
  { value: 'HIGH', label: 'High', color: 'bg-red-500' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-700' },
];

export default function InventoryManagerPage() {
  const { isDarkMode } = useUIStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });

  const { data: inventoryItems, isLoading } = useInventoryItems(
    categoryFilter !== 'all' ? { categoryId: categoryFilter, lowStock: lowStockOnly ? 'true' : undefined } : { lowStock: lowStockOnly ? 'true' : undefined }
  );
  const { data: summary } = useInventorySummary();
  const { data: selectedItem } = useInventoryItem(selectedItemId || '');
  const { data: stockMovements } = useStockMovements(selectedItemId ? { inventoryId: selectedItemId } : undefined);
  const { data: stockAlerts } = useStockAlerts({ isResolved: 'false' });
  const { data: valuation } = useInventoryValuation();
  const { data: categoriesData } = useCategories();
  const createInventoryItem = useCreateInventoryItem();
  const updateInventoryItem = useUpdateInventoryItem();
  const deleteInventoryItem = useDeleteInventoryItem();
  const createStockMovement = useCreateStockMovement();
  const resolveStockAlert = useResolveStockAlert();
  const createCategory = useCreateCategory();

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    unit: '',
    quantity: 0,
    minStock: 0,
    maxStock: 0,
    unitCost: 0,
    sellingPrice: 0,
    location: '',
    supplier: '',
    reorderPoint: 0,
    reorderQty: 0,
    notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInventoryItem.mutateAsync(formData);
      toast.success('Inventory item created');
      setIsAdding(false);
      setFormData({
        sku: '',
        name: '',
        description: '',
        categoryId: '',
        unit: '',
        quantity: 0,
        minStock: 0,
        maxStock: 0,
        unitCost: 0,
        sellingPrice: 0,
        location: '',
        supplier: '',
        reorderPoint: 0,
        reorderQty: 0,
        notes: '',
      });
    } catch {
      toast.error('Failed to create inventory item');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateInventoryItem.mutateAsync({ id: editingId, data: formData });
      toast.success('Inventory item updated');
      setEditingId(null);
      setFormData({
        sku: '',
        name: '',
        description: '',
        categoryId: '',
        unit: '',
        quantity: 0,
        minStock: 0,
        maxStock: 0,
        unitCost: 0,
        sellingPrice: 0,
        location: '',
        supplier: '',
        reorderPoint: 0,
        reorderQty: 0,
        notes: '',
      });
    } catch {
      toast.error('Failed to update inventory item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      await deleteInventoryItem.mutateAsync(id);
      toast.success('Inventory item deleted');
    } catch {
      toast.error('Failed to delete inventory item');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData({
      sku: item.sku || '',
      name: item.name,
      description: item.description || '',
      categoryId: item.categoryId || '',
      unit: item.unit || '',
      quantity: Number(item.quantity),
      minStock: Number(item.minStock),
      maxStock: item.maxStock !== undefined ? Number(item.maxStock) : 0,
      unitCost: Number(item.unitCost),
      sellingPrice: Number(item.sellingPrice),
      location: item.location || '',
      supplier: item.supplier || '',
      reorderPoint: Number(item.reorderPoint),
      reorderQty: item.reorderQty !== undefined ? Number(item.reorderQty) : 0,
      notes: item.notes || '',
    });
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;
    const form = e.target as HTMLFormElement;
    const type = form.movementType.value;
    const quantity = form.movementQuantity.value;
    const reason = form.movementReason.value;
    const reference = form.movementReference.value;
    if (!quantity || Number(quantity) <= 0) return;
    try {
      await createStockMovement.mutateAsync({
        inventoryId: selectedItemId,
        data: { type, quantity: Number(quantity), reason, reference },
      });
      toast.success('Stock movement recorded');
      form.reset();
    } catch {
      toast.error('Failed to record stock movement');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      await createCategory.mutateAsync(categoryFormData);
      toast.success('Category created successfully');
      setIsAddingCategory(false);
      setCategoryFormData({ name: '', description: '' });
    } catch {
      toast.error('Failed to create category');
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    const qty = Number(item.quantity);
    const min = Number(item.minStock);
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-500' };
    if (qty <= min) return { label: 'Low Stock', color: 'bg-yellow-500' };
    return { label: 'In Stock', color: 'bg-green-500' };
  };

  const renderInventoryItem = (item: InventoryItem, viewMode: ViewMode) => {
    const status = getStockStatus(item);
    if (viewMode === 'list') {
      return (
        <>
          <td className="px-4 py-3 min-w-[240px] max-w-[360px]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx('font-medium line-clamp-2', isDarkMode ? 'text-white' : 'text-gray-900')}>{item.name}</span>
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              {item.sku && <span className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{item.sku}</span>}
            </div>
          </td>
          <td className="px-4 py-3 min-w-[120px]">{item.sku || '-'}</td>
          <td className="px-4 py-3 min-w-[140px]">{item.category || '-'}</td>
          <td className="px-4 py-3 min-w-[100px]"><span className="font-mono">{Number(item.quantity)}</span> {item.unit}</td>
          <td className="px-4 py-3 text-right font-mono font-semibold text-base min-w-[140px]">₦{Number(item.sellingPrice).toLocaleString()}</td>
        </>
      );
    }
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setSelectedItemId(item.id)}
        className={clsx('w-full rounded-xl p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer', isDarkMode ? 'bg-gray-800' : 'bg-white')}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>{item.name}</h3>

              {item.sku && (
                <span className={clsx('text-xs px-2 py-1 rounded', isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-100')}>
                  {item.sku}
                </span>
              )}

              <Badge className={status.color}>
                {status.label}
              </Badge>
            </div>

            <div className={clsx('space-y-1 text-sm', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
              {item.category && (
                <div className="flex items-center gap-2">
                  <Package size={14} />
                  <span>{item.category}</span>
                </div>
              )}

              <div className={clsx('flex flex-wrap items-center gap-4 text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                <span>
                  Qty: <span className="font-mono">{Number(item.quantity)}</span> {item.unit}
                </span>
                <span>Min: <span className="font-mono">{Number(item.minStock)}</span></span>
                <span>
                  <span className="font-mono">₦{Number(item.sellingPrice).toLocaleString()}/</span>
                  {item.unit || 'unit'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
              className={clsx('p-2 text-gray-400 hover:text-festac-green rounded-lg transition-colors', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-green-50')}
            >
              <Edit size={16} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
              className={clsx('p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const filteredItems = inventoryItems?.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = categoriesData ?? [];

  return (
    <div className={clsx('min-h-screen pb-20', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className={clsx('rounded-b-2xl shadow-sm', isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <button className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl">Inventory Manager</h1>
            </div>
          </div>
          <div className="flex justify-between mb-2 gap-2">
            <Button onClick={() => setIsAddingCategory(true)} variant="secondary">
              <Plus size={18} className="mr-2" />
              Category
            </Button>
            <Button onClick={() => setIsAdding(true)} variant="primary">
              <Plus size={18} className="mr-2" />
              Item
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-festac-green/20 rounded-lg">
                    <Package size={20} className={isDarkMode ? 'text-festac-green/80' : 'text-festac-green'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Items</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{summary?.totalItems || 0}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <AlertTriangle size={20} className={isDarkMode ? 'text-yellow-300' : 'text-yellow-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Low Stock</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{summary?.lowStockCount || 0}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle size={20} className={isDarkMode ? 'text-red-300' : 'text-red-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Out of Stock</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{summary?.outOfStockCount || 0}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Inventory Valuation */}
      {valuation && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className={clsx('rounded-2xl p-6 shadow-card', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <h2 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
              <DollarSign className="w-5 h-5 text-festac-green" />
              Inventory Valuation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={clsx('rounded-xl p-4', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                <p className={clsx('text-xs mb-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Total Value (Selling)</p>
                <p className={clsx('font-bold text-xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{valuation.totalValue.toLocaleString()}</p>
              </div>
              <div className={clsx('rounded-xl p-4', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                <p className={clsx('text-xs mb-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Total Cost</p>
                <p className={clsx('font-bold text-xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{valuation.totalCost.toLocaleString()}</p>
              </div>
              <div className={clsx('rounded-xl p-4', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                <p className={clsx('text-xs mb-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Potential Profit</p>
                <p className={clsx('font-bold text-xl font-mono', isDarkMode ? 'text-green-400' : 'text-green-600')}>₦{(valuation.totalValue - valuation.totalCost).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {stockAlerts && stockAlerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
          <div className={clsx('border rounded-2xl p-6', isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200')}>
            <h2 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-red-300' : 'text-red-900')}>
              <AlertTriangle className="w-5 h-5" />
              Active Stock Alerts ({stockAlerts.length})
            </h2>
            <div className="space-y-2">
              {stockAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={clsx('flex items-center justify-between rounded-lg p-3', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
                  <div>
                    <p className={clsx('text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{alert.message}</p>
                    <p className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Quantity: {alert.quantity} / Threshold: {alert.threshold}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => resolveStockAlert.mutateAsync(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className={clsx('absolute left-3 top-1/2 -translate-y-1/2', isDarkMode ? 'text-gray-400' : 'text-gray-400')} size={18} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx('w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-200')}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={clsx('px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-200 bg-white')}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <label className={clsx('flex items-center gap-2 px-4 py-2.5 border rounded-xl cursor-pointer', isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className={clsx('rounded text-festac-green focus:ring-festac-green', isDarkMode ? 'border-gray-600' : 'border-gray-300')}
              />
              <span className={clsx('text-sm', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Low Stock Only</span>
            </label>
          </div>
        </div>

        {/* Inventory List */}
        <RecordListView
          items={filteredItems || []}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          renderItem={renderInventoryItem}
          listHeader={(
            <tr>
              <th className="px-4 py-2 font-medium min-w-[240px]">Item</th>
              <th className="px-4 py-2 font-medium min-w-[120px]">SKU</th>
              <th className="px-4 py-2 font-medium min-w-[140px]">Category</th>
              <th className="px-4 py-2 font-medium min-w-[100px]">Stock</th>
              <th className="px-4 py-2 font-medium text-right min-w-[140px]">Price</th>
            </tr>
          )}
          emptyState={(
            <div className={clsx('rounded-xl p-8 text-center', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
              <Package size={48} className={clsx('mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
              <p className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No inventory items found</p>
            </div>
          )}
        />
      </div>

      {/* Item Detail View */}
      {selectedItemId && selectedItem && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedItemId(null)}
              className={clsx('p-2 rounded-xl shadow-card hover:shadow-md transition-shadow', isDarkMode ? 'bg-gray-800' : 'bg-white')}
            >
              <X size={20} />
            </button>
            <div className="flex-1">
              <h2 className={clsx('font-display font-bold text-2xl', isDarkMode ? 'text-white' : 'text-gray-900')}>{selectedItem.name}</h2>
              <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{selectedItem.sku || 'No SKU'}</p>
            </div>
            <Badge className={getStockStatus(selectedItem).color}>{getStockStatus(selectedItem).label}</Badge>
          </div>

          {/* Stock Movement Form */}
          <div className={clsx('rounded-2xl p-6 shadow-card mb-6', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <h3 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
              <BarChart3 className="w-5 h-5 text-festac-green" />
              Record Stock Movement
            </h3>
            <form onSubmit={handleStockMovement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Movement Type</label>
                  <select
                    name="movementType"
                    className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white')}
                  >
                    {MOVEMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Quantity</label>
                  <input
                    name="movementQuantity"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter quantity"
                    className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>
              </div>
              <div>
                <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Reason</label>
                <input
                  name="movementReason"
                  type="text"
                  placeholder="Reason for movement"
                  className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                />
              </div>
              <div>
                <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Reference (Optional)</label>
                <input
                  name="movementReference"
                  type="text"
                  placeholder="Invoice number, PO number, etc."
                  className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                />
              </div>
              <Button type="submit" variant="primary">
                Record Movement
              </Button>
            </form>
          </div>

          {/* Stock Movement History */}
          <div className={clsx('rounded-2xl p-6 shadow-card mb-6', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <h3 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
              <Clock className="w-5 h-5 text-festac-green" />
              Stock Movement History
            </h3>
            {stockMovements && stockMovements.length > 0 ? (
              <div className="space-y-3">
                {stockMovements.map((movement) => (
                  <div key={movement.id} className={clsx('flex items-center justify-between p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${MOVEMENT_TYPES.find((t) => t.value === movement.type)?.color}`}>
                        {movement.type === 'IN' || movement.type === 'RETURN' ? (
                          <ArrowUp size={16} className="text-white" />
                        ) : (
                          <ArrowDown size={16} className="text-white" />
                        )}
                      </div>
                      <div>
                        <p className={clsx('text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{movement.type}</p>
                        <p className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{new Date(movement.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={clsx('font-semibold font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{movement.quantity}</p>
                      {movement.reference && <p className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{movement.reference}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No stock movements recorded</p>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Inventory Item Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx('rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto', isDarkMode ? 'bg-gray-800' : 'bg-white')}
          >
            <div className="p-6">
              <h2 className={clsx('text-xl font-bold mb-6', isDarkMode ? 'text-white' : 'text-gray-900')}>{editingId ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>
              <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    required
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="pcs, kg, liters"
                      className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Min Stock</label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                      className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Max Stock</label>
                    <input
                      type="number"
                      value={formData.maxStock}
                      onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                      className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Unit Cost (₦)</label>
                    <input
                      type="number"
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                      className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Selling Price (₦)</label>
                    <input
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                      className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Reorder Point</label>
                    <input
                      type="number"
                      value={formData.reorderPoint}
                      onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
                      className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Reorder Qty</label>
                    <input
                      type="number"
                      value={formData.reorderQty}
                      onChange={(e) => setFormData({ ...formData, reorderQty: Number(e.target.value) })}
                      className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className={clsx('w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" className="flex-1">
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx('rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto', isDarkMode ? 'bg-gray-800' : 'bg-white')}
          >
            <div className="p-6">
              <h2 className={clsx('text-xl font-bold mb-6', isDarkMode ? 'text-white' : 'text-gray-900')}>Add Category</h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Category Name *</label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    required
                    placeholder="e.g., Electronics, Food, Clothing"
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Description</label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    rows={3}
                    className={clsx('w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    placeholder="Optional description for this category"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setCategoryFormData({ name: '', description: '' });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" disabled={createCategory.isPending}>
                    {createCategory.isPending ? 'Creating...' : 'Create'}
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
