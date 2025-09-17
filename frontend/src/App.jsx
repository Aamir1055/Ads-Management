import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PermissionProvider } from './contexts/PermissionContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import UserManagement from './modules/UserManagement'
import Dashboard from './modules/Dashboard'
import RolePermissionDashboard from './modules/RolePermissionDashboard'
import CampaignTypes from './pages/CampaignTypes'
import Campaigns from './pages/Campaigns'
import Brands from './pages/Brands'
import CampaignDetail from './pages/CampaignDetail'
import Cards from './components/Cards'
import CardUsers from './pages/CardUsers'
import Reports from './pages/Reports'
import ReportsTable from './pages/ReportsTable'
import ReportAnalyticsPage from './pages/ReportAnalyticsPage'

// Create a component to handle authentication redirect logic
const AuthenticatedRedirect = () => {
  const hasToken = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  return hasToken ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Login route - no layout, no permission provider */}
          <Route path="/login" element={<Login />} />
          
          {/* Root redirect */}
          <Route path="/" element={<AuthenticatedRedirect />} />
          
          {/* All protected routes with layout wrapper */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <Dashboard />
                </Layout>
              </PermissionProvider>
            </ProtectedRoute>
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
          <Route path="/reports-table" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <ReportsTable />
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
          <Route path="/report-analytics" element={
            <ProtectedRoute>
              <PermissionProvider>
                <Layout>
                  <ReportAnalyticsPage />
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
