import React from 'react'
import { Shield } from 'lucide-react'
import RoleManagementInterface from './RoleManagementInterface'

const RolePermissionDashboard = () => {

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <RoleManagementInterface />
      </div>
    </div>
  )
}

export default RolePermissionDashboard
