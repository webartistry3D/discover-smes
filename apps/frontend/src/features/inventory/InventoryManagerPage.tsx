import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Plus, Search, Filter, Package, AlertTriangle, TrendingUp, DollarSign, ArrowUp, ArrowDown, X, Edit, Trash2, MoreVertical, Clock, BarChart3, ChevronLeft } from 'lucide-react';
import { useInventoryItems, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem, useInventorySummary, useInventoryItem, useStockMovements, useCreateStockMovement, useStockAlerts, useResolveStockAlert, useInventoryValuation } from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import type { InventoryItem, MovementType, AlertSeverity } from '../../lib/shared';
import toast from 'react-hot-toast';

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
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: inventoryItems, isLoading } = useInventoryItems(
    categoryFilter !== 'all' ? { category: categoryFilter, lowStock: lowStockOnly ? 'true' : undefined } : { lowStock: lowStockOnly ? 'true' : undefined }
  );
  const { data: summary } = useInventorySummary();
  const { data: selectedItem } = useInventoryItem(selectedItemId || '');
  const { data: stockMovements } = useStockMovements(selectedItemId ? { inventoryId: selectedItemId } : undefined);
  const { data: stockAlerts } = useStockAlerts({ isResolved: 'false' });
  const { data: valuation } = useInventoryValuation();
  const createInventoryItem = useCreateInventoryItem();
  const updateInventoryItem = useUpdateInventoryItem();
  const deleteInventoryItem = useDeleteInventoryItem();
  const createStockMovement = useCreateStockMovement();
  const resolveStockAlert = useResolveStockAlert();

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
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
        category: '',
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
        category: '',
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
      category: item.category || '',
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

  const getStockStatus = (item: InventoryItem) => {
    const qty = Number(item.quantity);
    const min = Number(item.minStock);
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-500' };
    if (qty <= min) return { label: 'Low Stock', color: 'bg-yellow-500' };
    return { label: 'In Stock', color: 'bg-green-500' };
  };

  const filteredItems = inventoryItems?.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(inventoryItems?.map((item) => item.category).filter(Boolean))] as string[];

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
              <h1 className="font-display font-bold text-2xl">Inventory Manager</h1>
              <p className="text-white/60 text-sm mt-1">Track stock levels, movements, and alerts</p>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="primary">
              <Plus size={18} className="mr-2" />
              Add Item
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-festac-green/20 rounded-lg">
                  <Package size={20} className="text-festac-green/80" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Items</p>
                  <p className="text-white font-bold text-xl">{summary?.totalItems || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertTriangle size={20} className="text-yellow-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Low Stock</p>
                  <p className="text-white font-bold text-xl">{summary?.lowStockCount || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle size={20} className="text-red-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Out of Stock</p>
                  <p className="text-white font-bold text-xl">{summary?.outOfStockCount || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Valuation */}
      {valuation && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-festac-green" />
              Inventory Valuation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Value (Selling)</p>
                <p className="font-bold text-gray-900 text-xl">₦{valuation.totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Cost</p>
                <p className="font-bold text-gray-900 text-xl">₦{valuation.totalCost.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Potential Profit</p>
                <p className="font-bold text-green-600 text-xl">₦{(valuation.totalValue - valuation.totalCost).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {stockAlerts && stockAlerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h2 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Stock Alerts ({stockAlerts.length})
            </h2>
            <div className="space-y-2">
              {stockAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500">Quantity: {alert.quantity} / Threshold: {alert.threshold}</p>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-festac-green focus:ring-festac-green"
              />
              <span className="text-sm text-gray-700">Low Stock Only</span>
            </label>
          </div>
        </div>

        {/* Inventory List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 min-w-max sm:block xs:block">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedItemId(item.id)}
                  className="min-w-[320px] flex-shrink-0 sm:min-w-full bg-white rounded-xl p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>

                        {item.sku && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {item.sku}
                          </span>
                        )}

                        <Badge className={getStockStatus(item).color}>
                          {getStockStatus(item).label}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        {item.category && (
                          <div className="flex items-center gap-2">
                            <Package size={14} />
                            <span>{item.category}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span>
                            Qty: {Number(item.quantity)} {item.unit}
                          </span>
                          <span>Min: {Number(item.minStock)}</span>
                          <span>
                            ₦{Number(item.sellingPrice).toLocaleString()}/
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
                        className="p-2 text-gray-400 hover:text-festac-green hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
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
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No inventory items found</p>
          </div>
        )}
      </div>

      {/* Item Detail View */}
      {selectedItemId && selectedItem && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedItemId(null)}
              className="p-2 bg-white rounded-xl shadow-card hover:shadow-md transition-shadow"
            >
              <X size={20} />
            </button>
            <div className="flex-1">
              <h2 className="font-display font-bold text-2xl">{selectedItem.name}</h2>
              <p className="text-gray-500 text-sm">{selectedItem.sku || 'No SKU'}</p>
            </div>
            <Badge className={getStockStatus(selectedItem).color}>{getStockStatus(selectedItem).label}</Badge>
          </div>

          {/* Stock Movement Form */}
          <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-festac-green" />
              Record Stock Movement
            </h3>
            <form onSubmit={handleStockMovement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
                  <select
                    name="movementType"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green bg-white"
                  >
                    {MOVEMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    name="movementQuantity"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter quantity"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  name="movementReason"
                  type="text"
                  placeholder="Reason for movement"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Optional)</label>
                <input
                  name="movementReference"
                  type="text"
                  placeholder="Invoice number, PO number, etc."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                />
              </div>
              <Button type="submit" variant="primary">
                Record Movement
              </Button>
            </form>
          </div>

          {/* Stock Movement History */}
          <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-festac-green" />
              Stock Movement History
            </h3>
            {stockMovements && stockMovements.length > 0 ? (
              <div className="space-y-3">
                {stockMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${MOVEMENT_TYPES.find((t) => t.value === movement.type)?.color}`}>
                        {movement.type === 'IN' || movement.type === 'RETURN' ? (
                          <ArrowUp size={16} className="text-white" />
                        ) : (
                          <ArrowDown size={16} className="text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{movement.type}</p>
                        <p className="text-xs text-gray-500">{new Date(movement.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{movement.quantity}</p>
                      {movement.reference && <p className="text-xs text-gray-500">{movement.reference}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No stock movements recorded</p>
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
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>
              <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="pcs, kg, liters"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
                    <input
                      type="number"
                      value={formData.maxStock}
                      onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₦)</label>
                    <input
                      type="number"
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₦)</label>
                    <input
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                    <input
                      type="number"
                      value={formData.reorderPoint}
                      onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Qty</label>
                    <input
                      type="number"
                      value={formData.reorderQty}
                      onChange={(e) => setFormData({ ...formData, reorderQty: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
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

      {/* Add Button */}
      <button
        onClick={() => setIsAdding(true)}
        className="fixed bottom-6 right-6 bg-festac-green text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
