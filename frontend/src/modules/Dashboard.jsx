import React from 'react'
import { Users, Target, BarChart3, FileText } from 'lucide-react'

const Dashboard = () => {
  const stats = [
    {
      id: 1,
      name: 'Total Users',
      value: '12',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      id: 2,
      name: 'Active Campaigns',
      value: '8',
      icon: Target,
      color: 'bg-green-500',
    },
    {
      id: 3,
      name: 'Reports Generated',
      value: '24',
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      id: 4,
      name: 'Analytics Views',
      value: '156',
      icon: BarChart3,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Ads Reporting Software</h1>
        <p className="mt-2 text-gray-600">Monitor your advertising campaigns and manage your reporting system.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.id} className="card">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${item.color} rounded-md p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd className="text-3xl font-bold text-gray-900">{item.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New user registration</span>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Campaign report generated</span>
              <span className="text-sm text-gray-400">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Analytics data updated</span>
              <span className="text-sm text-gray-400">1 day ago</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full btn-primary text-left">
              Create New Campaign
            </button>
            <button className="w-full btn-secondary text-left">
              Generate Report
            </button>
            <button className="w-full btn-secondary text-left">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
