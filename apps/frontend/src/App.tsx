import { Suspense, lazy, useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { clsx } from 'clsx';
import { Navbar } from './components/ui/Navbar';
import NotFoundPage from './features/errors/NotFoundPage';
import { MobileBottomNav } from './components/ui/MobileBottomNav';
import { AdminMobileBottomNav } from './components/ui/AdminMobileBottomNav';
import PWAInstallPrompt from './components/ui/PWAInstallPrompt';
import { AuthModal } from './components/ui/AuthModal';
import { Spinner } from './components/ui/index';
import { useAuthStore } from './stores/auth.store';
import { useUIStore } from './stores/ui.store';
import { usePendingVendor } from './hooks/usePendingVendor';

// Lazy-loaded pages — code splitting for performance
const HomePage = lazy(() => import('./features/marketplace/HomePage'));
const DiscoverPage = lazy(() => import('./features/marketplace/DiscoverPage'));
const VendorProfilePage = lazy(() => import('./features/vendor/VendorProfilePage'));
const VendorMyProfilePage = lazy(() => import('./features/vendor/VendorMyProfilePage'));
const VendorDashboardPage = lazy(() => import('./features/vendor/VendorDashboardPage'));
const VendorOnboardingPage = lazy(() => import('./features/vendor/VendorOnboardingPage'));
const VendorAnalyticsPage = lazy(() => import('./features/vendor/VendorAnalyticsPage'));
const VendorVerificationPage = lazy(() => import('./features/vendor/VendorVerificationPage'));
const VendorPromotePage = lazy(() => import('./features/vendor/VendorPromotePage'));
const BookingPage = lazy(() => import('./features/booking/BookingPage'));
const BookingsPage = lazy(() => import('./features/booking/BookingsPage'));
const MapPage = lazy(() => import('./features/maps/MapPage'));
const AdminPanelPage = lazy(() => import('./features/admin/AdminPanelPage'));
const IncomeManagerPage = lazy(() => import('./features/financial/IncomeManagerPage'));
const ExpenseManagerPage = lazy(() => import('./features/financial/ExpenseManagerPage'));
const InvoiceManagerPage = lazy(() => import('./features/financial/InvoiceManagerPage'));
const CRMManagerPage = lazy(() => import('./features/crm/CRMManagerPage'));
const InventoryManagerPage = lazy(() => import('./features/inventory/InventoryManagerPage'));
const TaxManagerPage = lazy(() => import('./features/tax/TaxManagerPage'));
const FinancialReportsPage = lazy(() => import('./features/financial/FinancialReportsPage'));
const AIEnginePage = lazy(() => import('./features/ai/AIEnginePage'));
const MarketingManagerPage = lazy(() => import('./features/marketing/MarketingManagerPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));
const FAQManagerPage = lazy(() => import('./features/chatbot/FAQManager'));
const ChatMonitorPage = lazy(() => import('./features/chatbot/ChatMonitor'));
const CostMonitorPage = lazy(() => import('./features/chatbot/CostMonitor'));
const OperatorDashboard = lazy(() => import('./features/chatbot/OperatorDashboard'));
const POSPage = lazy(() => import('./features/pos/POSPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function PendingApprovalMessage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏳</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Pending Approval</h2>
        <p className="text-gray-600 mb-6">
          Your vendor application has been submitted and is currently under review. You'll be notified once it's approved.
        </p>
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
          <p>This usually takes up to 24 hours. Thank you for your patience.</p>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const isVendorPage = roles?.includes('VENDOR') ?? false;
  const { data: pendingVendor, isLoading: checkingPending } = usePendingVendor(
    isVendorPage && !!user && user.role !== 'VENDOR'
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Please sign in to access this page</p>
        <button onClick={() => openAuthModal()} className="btn-primary">Sign In</button>
      </div>
    );
  }

  if (roles && user && !roles.includes(user.role)) {
    if (checkingPending) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    }

    if (pendingVendor?.status === 'PENDING') {
      return <PendingApprovalMessage />;
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">You don't have permission to view this page</p>
      </div>
    );
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useUIStore();
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const isLandingPage = location === '/';
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const handle = () => setIsOffline(!navigator.onLine);
    handle();
    window.addEventListener('online', handle);
    window.addEventListener('offline', handle);
    return () => {
      window.removeEventListener('online', handle);
      window.removeEventListener('offline', handle);
    };
  }, []);

  return (
    <div className={clsx('min-h-screen flex flex-col', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      <Navbar />
      <main className={clsx('flex-1', isAuthenticated ? 'pb-20' : '')}>
        {isOffline ? <NotFoundPage /> : children}
      </main>
      {isAuthenticated && (
  <>
    {user?.role === 'SUPER_ADMIN' ? <AdminMobileBottomNav /> : <MobileBottomNav />}
  </>
)}
      <PWAInstallPrompt />
      <footer className={clsx('text-white hidden', isDarkMode ? 'bg-gray-800' : 'bg-gray-900')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          {/*<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-festac rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-sm">DF</span>
                </div>
                <span className="font-display font-bold text-lg">Discover SMEs</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                The digital operating system for hyperlocal commerce in Festac Town, Lagos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Discover</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/discover" className="hover:text-white transition-colors">All Businesses</a></li>
                <li><a href="/discover?category=food-restaurants" className="hover:text-white transition-colors">Food & Dining</a></li>
                <li><a href="/map" className="hover:text-white transition-colors">Map View</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Business</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/vendors/new" className="hover:text-white transition-colors">List Your Business</a></li>
                <li><a href="/dashboard" className="hover:text-white transition-colors">Vendor Dashboard</a></li>
                <li><a href="/dashboard/verification" className="hover:text-white transition-colors">Get Verified</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Centre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>*/}
          <div className={clsx('mt-10 pt-6 text-center text-xs', isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-800 text-gray-500')}>
            © {new Date().getFullYear()} Discover SMEs. Built for Lagos, designed for Africa.
          </div>
        </div>
      </footer>
      <AuthModal />
    </div>
  );
}

export default function App() {
  const { isDarkMode } = useUIStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/discover" component={DiscoverPage} />
            <Route path="/map" component={MapPage} />
            <Route path="/profile">
              {() => (
                <ProtectedRoute>
                  <VendorMyProfilePage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/bookings">
              {() => (
                <ProtectedRoute>
                  <BookingsPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/vendors/new" component={VendorOnboardingPage} />
            <Route path="/vendors/:slug" component={VendorProfilePage} />
            <Route path="/book/:vendorId" component={BookingPage} />
            <Route path="/dashboard">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <VendorDashboardPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/dashboard/analytics">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <VendorAnalyticsPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/dashboard/verification">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <VendorVerificationPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/dashboard/promote">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <VendorPromotePage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/pos">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <POSPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/financial/income">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <IncomeManagerPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/financial/expense">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <ExpenseManagerPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/financial/invoices">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <InvoiceManagerPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/financial/reports">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <FinancialReportsPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/crm">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <CRMManagerPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/inventory">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <InventoryManagerPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/tax">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <TaxManagerPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/ai-engine">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <AIEnginePage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/marketing">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <MarketingManagerPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/settings">
              {() => (
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/chatbot/faq">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <FAQManagerPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/chatbot/monitor">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <ChatMonitorPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/chatbot/cost">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <CostMonitorPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/chatbot/operator">
              {() => (
                <ProtectedRoute roles={['VENDOR', 'SUPER_ADMIN']}>
                  <OperatorDashboard />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin">
              {() => (
                <ProtectedRoute roles={['SUPER_ADMIN', 'MODERATOR']}>
                  <AdminPanelPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/404" component={NotFoundPage} />
            <Route component={NotFoundPage} />
          </Switch>
        </Suspense>
      </AppLayout>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '14px',
            background: '#1a1a1a',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
