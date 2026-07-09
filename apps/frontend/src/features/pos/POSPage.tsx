import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ScanLine, Search, Plus, Minus, Trash2, ShoppingCart,
  Receipt, Printer, Share2, CheckCircle, XCircle, Package, User,
  CreditCard, Banknote, Smartphone, ChevronRight, RotateCcw, Tag, Camera
} from 'lucide-react';
import { BarcodeScanner } from '../../components/ui/BarcodeScanner';
import { clsx } from 'clsx';
import { useUIStore } from '../../stores/ui.store';
import { useInventoryItems, useCreateInvoice, useCreateStockMovement } from '../../hooks/useVendors';
import type { InventoryItem } from '../../lib/shared';
import { formatCurrencyCompact } from '../../lib/utils';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/index';

// ─── Types ───────────────────────────────────────────────────

interface CartItem {
  inventoryItem: InventoryItem;
  quantity: number;
  unitPrice: number;
}

type PaymentMethod = 'CASH' | 'TRANSFER' | 'POS_CARD';

type POSView = 'scan' | 'cart' | 'receipt';

interface Receipt {
  invoiceNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatNaira(amount: number) {
  const formatted = amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `₦${formatted}`;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'CASH', label: 'Cash', icon: <Banknote size={18} /> },
  { value: 'TRANSFER', label: 'Transfer', icon: <Smartphone size={18} /> },
  { value: 'POS_CARD', label: 'POS/Card', icon: <CreditCard size={18} /> },
];

// ─── Component ───────────────────────────────────────────────

export default function POSPage() {
  const { isDarkMode } = useUIStore();

  // ── Data ──
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventoryItems();
  const createInvoice = useCreateInvoice();
  const createMovement = useCreateStockMovement();

  // ── State ──
  const [view, setView] = useState<POSView>('scan');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Keep scan input focused
  useEffect(() => {
    if (view === 'scan' && !showItemSearch && !showCamera) {
      scanInputRef.current?.focus();
    }
  }, [view, showItemSearch, showCamera]);

  // ── Cart Calculations ──
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ── Lookup item by SKU / barcode ──
  const lookupItem = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return null;
      return inventoryItems.find(
        (item: InventoryItem) =>
          item.sku?.toLowerCase() === q ||
          item.name.toLowerCase() === q ||
          item.id === q
      ) ?? null;
    },
    [inventoryItems]
  );

  // ── Add item to cart ──
  const addToCart = useCallback(
    (item: InventoryItem, qty = 1) => {
      if (item.quantity <= 0) {
        toast.error(`${item.name} is out of stock`);
        return;
      }
      setCart((prev) => {
        const existing = prev.find((c) => c.inventoryItem.id === item.id);
        if (existing) {
          const newQty = existing.quantity + qty;
          if (newQty > item.quantity) {
            toast.error(`Only ${item.quantity} units available`);
            return prev;
          }
          return prev.map((c) =>
            c.inventoryItem.id === item.id ? { ...c, quantity: newQty } : c
          );
        }
        toast.success(`${item.name} added`);
        return [...prev, { inventoryItem: item, quantity: qty, unitPrice: item.sellingPrice }];
      });
    },
    []
  );

  // ── Handle barcode scan / enter ──
  // ── Handle camera scan result (declared after lookupItem and addToCart) ──
  const handleCameraDetect = useCallback(
    (barcode: string) => {
      const item = lookupItem(barcode);
      if (item) {
        addToCart(item);
      } else {
        setScanInput(barcode);
        toast.error(`No item found for barcode: "${barcode}"`);
      }
    },
    [lookupItem, addToCart]
  );

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = lookupItem(scanInput);
    if (item) {
      addToCart(item);
      setScanInput('');
    } else {
      toast.error(`No item found for: "${scanInput}"`);
      setScanInput('');
    }
  };

  // ── Update cart qty ──
  const updateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.inventoryItem.id !== itemId) return c;
          const newQty = c.quantity + delta;
          if (newQty > c.inventoryItem.quantity) {
            toast.error(`Only ${c.inventoryItem.quantity} available`);
            return c;
          }
          return { ...c, quantity: newQty };
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.inventoryItem.id !== itemId));
  };

  // ── Checkout ──
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setIsProcessing(true);
    try {
      // 1. Create invoice (receipt)
      const invoiceData = {
        customerName: customerName || 'Walk-in Customer',
        lineItems: cart.map((c) => ({
          description: c.inventoryItem.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
        discountAmount,
        status: 'PAID',
        paymentMethod,
        notes: `POS Sale — ${paymentMethod}`,
        paidDate: new Date().toISOString(),
      };

      const invoiceRes = await createInvoice.mutateAsync(invoiceData);
      const invoice = invoiceRes.data?.data;

      // 2. Deduct stock for each cart item
      await Promise.all(
        cart.map((c) =>
          createMovement.mutateAsync({
            inventoryId: c.inventoryItem.id,
            data: {
              type: 'OUT',
              quantity: c.quantity,
              reason: `POS Sale — Invoice ${invoice?.invoiceNumber ?? ''}`,
              unitCost: c.inventoryItem.unitCost,
            },
          })
        )
      );

      // 3. Build receipt
      const receiptData: Receipt = {
        invoiceNumber: invoice?.invoiceNumber ?? `POS-${Date.now()}`,
        items: cart,
        subtotal,
        discount: discountAmount,
        total,
        paymentMethod,
        customerName: customerName || 'Walk-in Customer',
        createdAt: new Date().toISOString(),
      };

      setReceipt(receiptData);
      setView('receipt');
      toast.success('Sale recorded!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── New Sale ──
  const handleNewSale = () => {
    setCart([]);
    setDiscountPercent(0);
    setCustomerName('');
    setPaymentMethod('CASH');
    setReceipt(null);
    setView('scan');
  };

  // ── Filtered search results ──
  const searchResults = inventoryItems.filter((item: InventoryItem) =>
    item.isActive &&
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ─── RECEIPT VIEW ───────────────────────────────────────────
  if (view === 'receipt' && receipt) {
    return (
      <div className={clsx('min-h-screen', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
        {/* Header */}
        <div className="bg-gradient-hero text-white px-4 py-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/30 rounded-full">
              <CheckCircle size={24} className="text-green-300" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">Sale Complete</h1>
              <p className="text-white/70 text-sm">{receipt.invoiceNumber}</p>
            </div>
          </div>
        </div>

        {/* Receipt Card */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className={clsx('rounded-2xl shadow-lg overflow-hidden', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            {/* Receipt Header */}
            <div className={clsx('px-6 py-4 border-b text-center', isDarkMode ? 'border-gray-700' : 'border-gray-100')}>
              <p className={clsx('font-display font-bold text-xl', isDarkMode ? 'text-white' : 'text-gray-900')}>Receipt</p>
              <p className={clsx('text-sm mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                {new Date(receipt.createdAt).toLocaleString('en-NG')}
              </p>
              <p className={clsx('text-xs mt-0.5 font-mono', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                {receipt.invoiceNumber}
              </p>
            </div>

            {/* Customer */}
            <div className={clsx('px-6 py-3 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-100')}>
              <div className="flex items-center gap-2">
                <User size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                <span className={clsx('text-sm', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                  {receipt.customerName}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className={clsx('px-6 py-4 border-b space-y-3', isDarkMode ? 'border-gray-700' : 'border-gray-100')}>
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <p className={clsx('text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>
                      {item.inventoryItem.name}
                    </p>
                    <p className={clsx('text-xs font-mono', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                      {formatNaira(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className={clsx('text-sm font-semibold font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>
                    {formatNaira(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between">
                <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Subtotal</span>
                <span className={clsx('text-sm font-mono', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>{formatNaira(receipt.subtotal)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-green-500">Discount</span>
                  <span className="text-sm font-mono text-green-500">-{formatNaira(receipt.discount)}</span>
                </div>
              )}
              <div className={clsx('flex justify-between pt-2 border-t', isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
                <span className={clsx('font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>Total</span>
                <span className={clsx('font-bold text-xl font-mono text-festac-green')}>{formatNaira(receipt.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Payment</span>
                <span className={clsx('text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                  {PAYMENT_METHODS.find(p => p.value === receipt.paymentMethod)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.print()}
            >
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const text = `Receipt: ${receipt.invoiceNumber}\nTotal: ${formatNaira(receipt.total)}\nDate: ${new Date(receipt.createdAt).toLocaleString('en-NG')}`;
                if (navigator.share) {
                  navigator.share({ title: 'Receipt', text });
                } else {
                  navigator.clipboard.writeText(text);
                  toast.success('Copied to clipboard');
                }
              }}
            >
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleNewSale}>
              <RotateCcw size={16} className="mr-2" />
              New Sale
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN POS VIEW ──────────────────────────────────────────
  return (
    <div className={clsx('min-h-screen flex flex-col', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>

      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/financial/invoices">
              <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="font-display font-bold text-xl">Point of Sale</h1>
              <p className="text-white/60 text-xs">Scan or search items to record a sale</p>
            </div>
          </div>
          <button
            onClick={() => setView(view === 'cart' ? 'scan' : 'cart')}
            className="relative p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-festac-green text-white text-xs rounded-full flex items-center justify-center font-bold font-mono">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-4 flex-1 flex flex-col lg:flex-row gap-4">

        {/* ── LEFT: SCAN + SEARCH ── */}
        <div className={clsx('flex-1 flex flex-col gap-4', view === 'cart' ? 'hidden lg:flex' : 'flex')}>

          {/* Barcode Scan Input */}
          <div className={clsx('rounded-2xl p-4 shadow-card', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <div className="flex items-center gap-2 mb-3">
              <ScanLine size={18} className="text-festac-green" />
              <h2 className={clsx('font-semibold text-sm', isDarkMode ? 'text-white' : 'text-gray-900')}>
                Scan Barcode / Enter SKU
              </h2>
            </div>
            <form onSubmit={handleScanSubmit} className="flex gap-2">
              <input
                ref={scanInputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan barcode or type SKU..."
                className={clsx(
                  'flex-1 px-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-festac-green/50',
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                )}
                autoComplete="off"
                autoFocus
              />
            </form>
            <div className="flex justify-center gap-3 mt-3">
              <button
                onClick={handleScanSubmit as any}
                className={clsx(
                  'p-3 rounded-xl border-2 transition-colors w-[60px] h-[60px] flex items-center justify-center',
                  isDarkMode
                    ? 'border-festac-green/40 text-festac-green hover:bg-festac-green/10'
                    : 'border-festac-green/40 text-festac-green hover:bg-festac-green/10'
                )}
              >
                <Plus size={32} strokeWidth={2.5} />
              </button>
              <Button type="button" variant="primary" className="p-3 rounded-xl w-[60px] h-[60px] flex items-center justify-center" onClick={() => setShowCamera(true)}>
                <Camera size={32} strokeWidth={2.5} />
              </Button>
            </div>
          </div>

          {/* Item Search */}
          <div className={clsx('rounded-2xl shadow-card overflow-hidden', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <div className={clsx('flex items-center gap-2 px-4 py-3 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-100')}>
              <Search size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowItemSearch(true);
                }}
                onFocus={() => setShowItemSearch(true)}
                placeholder="Search items by name..."
                className={clsx(
                  'flex-1 text-sm bg-transparent focus:outline-none',
                  isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                )}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowItemSearch(false); }}>
                  <XCircle size={16} className="text-gray-400" />
                </button>
              )}
            </div>

            {inventoryLoading ? (
              <div className="px-4 py-6 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-festac-green border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {(searchQuery ? searchResults : inventoryItems.filter((i: InventoryItem) => i.isActive))
                  .slice(0, 20)
                  .map((item: InventoryItem) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        addToCart(item);
                        setSearchQuery('');
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between px-4 py-3 transition-colors text-left',
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
                        item.quantity <= 0 && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={item.quantity <= 0}
                    >
                      <div className="flex items-center gap-3">
                        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
                          <Package size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                        </div>
                        <div>
                          <p className={clsx('text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>
                            {item.name}
                          </p>
                          <p className={clsx('text-xs font-mono', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                            {item.sku ? `SKU: ${item.sku} · ` : ''}{item.quantity} in stock
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono text-festac-green">
                          {formatNaira(item.sellingPrice)}
                        </p>
                        {item.quantity <= item.minStock && item.quantity > 0 && (
                          <p className="text-xs text-amber-500">Low stock</p>
                        )}
                        {item.quantity <= 0 && (
                          <p className="text-xs text-red-500">Out of stock</p>
                        )}
                      </div>
                    </button>
                  ))}
                {inventoryItems.filter((i: InventoryItem) => i.isActive).length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Package size={28} className="mx-auto mb-2 text-gray-300" />
                    <p className={clsx('text-sm', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                      No inventory items found.{' '}
                      <Link href="/inventory" className="text-festac-green">Add items</Link>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: CART & CHECKOUT ── */}
        <div className={clsx('w-full lg:w-96 flex flex-col gap-4', view === 'scan' ? 'hidden lg:flex' : 'flex')}>

          {/* Cart Items */}
          <div className={clsx('rounded-2xl shadow-card overflow-hidden flex-1', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <div className={clsx('flex items-center justify-between px-4 py-3 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-100')}>
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-festac-green" />
                <h2 className={clsx('font-semibold text-sm', isDarkMode ? 'text-white' : 'text-gray-900')}>
                  Cart
                </h2>
                {cartCount > 0 && (
                  <span className="text-xs bg-festac-green text-white px-1.5 py-0.5 rounded-full font-mono">
                    {cartCount}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <ShoppingCart size={28} className="mx-auto mb-2 text-gray-300" />
                <p className={clsx('text-sm', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                  Cart is empty — scan or search items
                </p>
              </div>
            ) : (
              <div className="max-h-72 lg:max-h-[340px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                <AnimatePresence>
                  {cart.map((c) => (
                    <motion.div
                      key={c.inventoryItem.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className={clsx('text-sm font-medium truncate', isDarkMode ? 'text-white' : 'text-gray-900')}>
                          {c.inventoryItem.name}
                        </p>
                        <p className={clsx('text-xs font-mono', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                          {formatNaira(c.unitPrice)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(c.inventoryItem.id, -1)}
                          className={clsx('w-6 h-6 rounded-lg flex items-center justify-center', isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                        >
                          <Minus size={12} />
                        </button>
                        <span className={clsx('w-8 text-center text-sm font-mono font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
                          {c.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(c.inventoryItem.id, 1)}
                          className={clsx('w-6 h-6 rounded-lg flex items-center justify-center', isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className={clsx('w-20 text-right text-sm font-bold font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>
                        {formatNaira(c.unitPrice * c.quantity)}
                      </p>
                      <button
                        onClick={() => removeFromCart(c.inventoryItem.id)}
                        className="text-red-400 hover:text-red-500 ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Checkout Panel */}
          <div className={clsx('rounded-2xl shadow-card p-4 space-y-4', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            {/* Customer Name (optional) */}
            <div>
              <label className={clsx('text-xs font-medium mb-1 block', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                Customer Name (optional)
              </label>
              <div className="relative">
                <User size={14} className={clsx('absolute left-3 top-1/2 -translate-y-1/2', isDarkMode ? 'text-gray-500' : 'text-gray-400')} />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className={clsx(
                    'w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/50',
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  )}
                />
              </div>
            </div>

            {/* Discount */}
            <div>
              <label className={clsx('text-xs font-medium mb-1 block', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                Discount %
              </label>
              <div className="relative">
                <Tag size={14} className={clsx('absolute left-3 top-1/2 -translate-y-1/2', isDarkMode ? 'text-gray-500' : 'text-gray-400')} />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                  placeholder="0"
                  className={clsx(
                    'w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-festac-green/50',
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  )}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className={clsx('text-xs font-medium mb-2 block', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={clsx(
                      'flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition-all',
                      paymentMethod === pm.value
                        ? 'border-festac-green bg-festac-green/10 text-festac-green'
                        : isDarkMode
                          ? 'border-gray-600 text-gray-400 hover:border-gray-500'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    )}
                  >
                    {pm.icon}
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className={clsx('rounded-xl p-3 space-y-1.5', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Subtotal</span>
                <span className={clsx('font-mono', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>{formatNaira(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-500">Discount ({discountPercent}%)</span>
                  <span className="text-green-500 font-mono">-{formatNaira(discountAmount)}</span>
                </div>
              )}
              <div className={clsx('flex justify-between pt-1.5 border-t', isDarkMode ? 'border-gray-600' : 'border-gray-200')}>
                <span className={clsx('font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>Total</span>
                <span className="font-bold text-lg font-mono text-festac-green">{formatNaira(total)}</span>
              </div>
            </div>

            {/* Charge Button */}
            <Button
              variant="primary"
              className="w-full py-3 text-base"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Receipt size={18} />
                  Charge {formatNaira(total)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Camera Barcode Scanner Overlay */}
      {showCamera && (
        <BarcodeScanner
          isDarkMode={isDarkMode}
          onDetected={(barcode) => {
            handleCameraDetect(barcode);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
