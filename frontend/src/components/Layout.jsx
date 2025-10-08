import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useUserAccess from '../hooks/useUserAccess'
import {
  Menu, 
  X, 
  Home, 
  Users, 
  Target, 
  BarChart3, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Tags,
  Database,
  CreditCard,
  UserCheck,
  LogOut,
  Key,
  UserCog,
  Facebook
} from 'lucide-react'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { userAccess, loading: permissionsLoading } = useUserAccess()
  
  // Get current user info from localStorage
  const currentUser = React.useMemo(() => {
    try {
      const userString = localStorage.getItem('user')
      return userString ? JSON.parse(userString) : null
    } catch {
      return null
    }
  }, [])

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    sessionStorage.clear()
    
    // Redirect to login page
    navigate('/login')
  }

  // Icon mapping for backend response
  const iconMap = {
    Home,
    Users,
    Key,
    Tags,
    Database,
    CreditCard,
    UserCheck,
    Target,
    BarChart3,
    FileText,
    Settings,
    Facebook
  }

  // Sort navigation items in the specified sidebar order
  const sortNavigationItems = (items) => {
    const sidebarOrder = [
      'Dashboard',
      'User Management', 
      'Role Management',
      'Brand Management',
      'Campaign Type',
      'Campaign',
      'Cards',
      'Cards Users',
      'Facebook Accounts',
      'Facebook Pages',
      'Report'
    ];
    
    // Map backend names to our expected names
    const nameMapping = {
      'Campaign Types': 'Campaign Type',
      'Campaigns': 'Campaign',
      'Card Users': 'Cards Users',
      'Reports': 'Report'
    };
    
    const getOrderIndex = (name) => {
      // Try direct match first
      let index = sidebarOrder.indexOf(name);
      if (index !== -1) return index;
      
      // Try mapped name
      const mappedName = nameMapping[name];
      if (mappedName) {
        index = sidebarOrder.indexOf(mappedName);
        if (index !== -1) return index;
      }
      
      return -1;
    };
    
    return items.sort((a, b) => {
      const aIndex = getOrderIndex(a.name);
      const bIndex = getOrderIndex(b.name);
      
      // If both items are in the order list, sort by their index
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one item is in the order list, it comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither is in the order list, sort alphabetically
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  // TEMP: Always include Facebook Accounts for debugging
  console.log('🔍 Debug - userAccess:', userAccess);
  console.log('🔍 Debug - userAccess navigation:', userAccess?.navigation);
  console.log('🔍 Debug - permissionsLoading:', permissionsLoading);

  // Use navigation from backend if available, otherwise show all (fallback)
  const backendNavigation = userAccess?.navigation?.map(item => ({
    ...item,
    icon: iconMap[item.icon] || Home // Map string to actual component
  })) || [];

  const fallbackNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'User Management', href: '/user-management', icon: Users },
    { name: 'Role Management', href: '/role-management', icon: Key },
    { name: 'Brand Management', href: '/brands', icon: Tags },
    { name: 'Campaign Type', href: '/campaign-types', icon: Tags },
    { name: 'Campaign', href: '/campaigns', icon: Target },
    { name: 'Cards', href: '/cards', icon: CreditCard },
    { name: 'Cards Users', href: '/card-users', icon: UserCheck },
    { name: 'Facebook Accounts', href: '/facebook-accounts', icon: Facebook },
    { name: 'Facebook Pages', href: '/facebook-pages', icon: FileText },
    { name: 'Report', href: '/reports-table', icon: FileText },
  ];

  // Always ensure Facebook Accounts and Facebook Pages are included
  const baseNavigation = backendNavigation.length > 0 ? [
    ...backendNavigation,
    // Force add Facebook Accounts if not already present
    ...(backendNavigation.find(item => item.name === 'Facebook Accounts') ? [] : 
        [{ name: 'Facebook Accounts', href: '/facebook-accounts', icon: Facebook }]),
    // Force add Facebook Pages if not already present
    ...(backendNavigation.find(item => item.name === 'Facebook Pages') ? [] : 
        [{ name: 'Facebook Pages', href: '/facebook-pages', icon: FileText }])
  ] : fallbackNavigation;
  
  const navigation = sortNavigationItems(baseNavigation)

  const isActive = (href) => location.pathname === href

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${
        sidebarOpen ? 'md:w-64' : 'md:w-16'
      }`}>
        <div className="flex flex-col w-full">
          <div className="flex flex-col flex-grow bg-sidebar-bg overflow-y-auto">
            {/* Logo and Toggle */}
            <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-gray-900">
              <div className={`flex items-center ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-primary-500" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white">Ads Reporter</h1>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1 flex flex-col">
              <div className="flex-1 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                      title={!sidebarOpen ? item.name : ''}
                    >
                      <Icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                      {sidebarOpen && (
                        <span className="text-sm font-medium">{item.name}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
              
              {/* Logout Button */}
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full sidebar-link text-red-300 hover:text-red-100 hover:bg-red-600/20 transition-colors"
                  title={!sidebarOpen ? 'Logout' : ''}
                >
                  <LogOut className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">Logout</span>
                  )}
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-sidebar-bg">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            {/* Mobile Logo */}
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
              <Target className="h-8 w-8 text-primary-500" />
              <h1 className="ml-3 text-xl font-bold text-white">Ads Reporter</h1>
            </div>
            
            {/* Mobile Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1 flex flex-col">
              <div className="flex-1 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
              
              {/* Mobile Logout Button */}
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full sidebar-link text-red-300 hover:text-red-100 hover:bg-red-600/20 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-3">
                  {currentUser?.username || 'User'}
                </span>
                <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {(currentUser?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
