import React, { useState } from 'react'
import { Shield, Users, BarChart3, Settings } from 'lucide-react'
import RoleManagementInterface from './RoleManagementInterface'
import UserRoleManagement from './UserRoleManagement'

const TabButton = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
      active
        ? 'bg-primary-500 text-white shadow-md'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`}
  >
    <Icon className="h-4 w-4 mr-2" />
    {children}
  </button>
)

const RolePermissionDashboard = () => {
  const [activeTab, setActiveTab] = useState('roles')

  const tabs = [
    { id: 'roles', label: 'Role Management', icon: Shield },
    { id: 'user-roles', label: 'User Roles', icon: Users }
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'roles':
        return <RoleManagementInterface />
      case 'user-roles':
        return <UserRoleManagement />
      default:
        return <RoleManagementInterface />
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Role & Permission Management</h1>
              <p className="text-sm text-gray-600">Manage roles, permissions, and user access</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mt-4">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {renderActiveTab()}
      </div>
    </div>
  )
}

export default RolePermissionDashboard
