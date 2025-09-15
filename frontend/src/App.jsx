import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import UserManagement from './modules/UserManagement'
import Dashboard from './modules/Dashboard'
import RolePermissionDashboard from './modules/RolePermissionDashboard'
import CampaignTypes from './pages/CampaignTypes'
import CampaignData from './pages/CampaignData'
import Campaigns from './pages/Campaigns'
import Cards from './components/Cards'
import CardUsers from './pages/CardUsers'
import Reports from './pages/Reports'
import ReportsTable from './pages/ReportsTable'
import ReportAnalyticsPage from './pages/ReportAnalyticsPage'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Login route - no layout */}
        <Route path="/login" element={<Login />} />
        
        {/* Redirect root to dashboard if authenticated, otherwise to login */}
        <Route path="/" element={
          (localStorage.getItem('access_token') || localStorage.getItem('authToken')) ? 
          <Navigate to="/dashboard" replace /> : 
          <Navigate to="/login" replace />
        } />
        
        {/* Protected routes - with layout */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/role-management" element={<RolePermissionDashboard />} />
                <Route path="/campaign-types" element={<CampaignTypes />} />
                <Route path="/campaign-data" element={<CampaignData />} />
                <Route path="/cards" element={<Cards />} />
                <Route path="/card-users" element={<CardUsers />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/analytics" element={<div className="p-6">Analytics Module (Coming Soon)</div>} />
                <Route path="/reports-table" element={<ReportsTable />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/report-analytics" element={<ReportAnalyticsPage />} />
                <Route path="/settings" element={<div className="p-6">Settings Module (Coming Soon)</div>} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App
