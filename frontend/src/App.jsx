import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PermissionProvider } from './contexts/PermissionContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import SimpleProtectedRoute from './components/SimpleProtectedRoute'
import Login from './pages/Login'
import UserManagement from './modules/UserManagement'
import Dashboard from './modules/Dashboard'
import SimpleDashboard from './components/SimpleDashboard'
import AuthTest from './components/AuthTest'
import AuthDebug from './components/AuthDebug'
import RolePermissionDashboard from './modules/RolePermissionDashboard'
import CampaignTypes from './pages/CampaignTypes'
import Campaigns from './pages/Campaigns'
import Brands from './pages/Brands'
import CampaignDetail from './pages/CampaignDetail'
import Cards from './components/Cards'
import AccountCards from './pages/AccountCards'
import CardUsers from './pages/CardUsers'
import FacebookAccounts from './pages/FacebookAccounts'
import FacebookPages from './pages/FacebookPages'
import BusinessManager from './pages/BusinessManager'
import Reports from './pages/Reports'
import { initTotpFieldHiding } from './utils/hideTotpFields'
import './styles/hide-totp-fields.css'

// Create a component to handle authentication redirect logic
const AuthenticatedRedirect = () => {
  console.log('🚀 AuthenticatedRedirect: Component is rendering!');
  const { loading } = useAuth();
  
  // Direct localStorage check - most reliable
  const hasAccessToken = localStorage.getItem('access_token');
  const hasUser = localStorage.getItem('user');
  
  console.log('🔄 AuthenticatedRedirect:', {
    loading,
    hasAccessToken: !!hasAccessToken,
    hasUser: !!hasUser,
    pathname: window.location.pathname
  });
  
  // Show loading while auth is initializing
  if (loading) {
    console.log('⏳ AuthenticatedRedirect: Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Direct check: if we have access token and user data, go to dashboard
  if (hasAccessToken && hasUser) {
    console.log('✅ AuthenticatedRedirect: Has tokens, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log('🚪 AuthenticatedRedirect: No tokens, redirecting to login');
    return <Navigate to="/login" replace />;
  }
};

function App() {
  // Initialize TOTP field hiding when the app loads
  useEffect(() => {
    console.log('🔒 App: Initializing TOTP field hiding...');
    console.log('🌐 App: Current URL:', window.location.href);
    console.log('🌐 App: Current pathname:', window.location.pathname);
    initTotpFieldHiding();
  }, []);

  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Login route - no layout, no permission provider */}
          <Route path="/login" element={
            <>
              {console.log('🚨 Rendering Login route')}
              <Login />
            </>
          } />
          
          {/* Root redirect */}
          <Route path="/" element={
            <>
              {console.log('🏠 Rendering Root route')}
              <AuthenticatedRedirect />
            </>
          } />
          
          {/* All protected routes with layout wrapper */}
          <Route path="/dashboard" element={
            <SimpleProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </SimpleProtectedRoute>
          } />
          <Route path="/user-management" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <UserManagement />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/role-management" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <RolePermissionDashboard />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/brands" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <Brands />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/campaign-types" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <CampaignTypes />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/cards" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <Cards />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/cards/account/:accountId" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <AccountCards />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/card-users" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <CardUsers />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/campaigns" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <Campaigns />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/campaigns/:id" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <CampaignDetail />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/facebook-accounts" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <FacebookAccounts />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/facebook-pages" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <FacebookPages />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/business-manager" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <BusinessManager />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <Reports />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <div className="p-6">Analytics Module (Coming Soon)</div>
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <div className="p-6">Settings Module (Coming Soon)</div>
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
