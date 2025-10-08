import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  Eye, 
  Download,
  RefreshCw,
  MoreVertical,
  User,
  Phone,
  Mail,
  Image,
  ToggleLeft,
  ToggleRight,
  FileText,
  Link,
  Clock
} from 'lucide-react';
import FacebookPageForm from '../components/FacebookPageForm';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FacebookPages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [facebookAccounts, setFacebookAccounts] = useState([]);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('access_token');
  };

  // Axios instance with auth headers
  const apiRequest = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  });

  // Fetch Facebook accounts for dropdown filter
  const fetchFacebookAccounts = async () => {
    try {
      const response = await apiRequest.get('/facebook-accounts?limit=1000');
      if (response.data.success) {
        setFacebookAccounts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching Facebook accounts:', error);
    }
  };

  // Fetch pages from API
  const fetchPages = async (page = 1, search = '', status = 'all', account = 'all') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (account && account !== 'all') params.append('facebook_account_id', account);

      const response = await apiRequest.get(`/facebook-pages?${params}`);
      
      if (response.data.success) {
        setPages(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalCount(response.data.pagination?.total || 0);
        setCurrentPage(response.data.pagination?.page || 1);
      } else {
        toast.error('Failed to fetch Facebook pages');
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  // Load accounts and pages on component mount
  useEffect(() => {
    fetchFacebookAccounts();
    fetchPages(currentPage, searchTerm, statusFilter, accountFilter);
  }, [currentPage, searchTerm, statusFilter, accountFilter]);

  // Handle search with debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (currentPage === 1) {
        fetchPages(1, searchTerm, statusFilter, accountFilter);
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Handle account filter change
  const handleAccountFilterChange = (account) => {
    setAccountFilter(account);
    setCurrentPage(1);
  };

  // Handle page creation/update success
  const handlePageSaved = () => {
    setShowAddForm(false);
    setEditingPage(null);
    fetchPages(currentPage, searchTerm, statusFilter, accountFilter);
    toast.success(editingPage ? 'Page updated successfully!' : 'Page created successfully!');
  };

  // Handle edit page
  const handleEditPage = (page) => {
    setEditingPage(page);
    setShowAddForm(true);
  };

  // Handle toggle page status
  const handleToggleStatus = async (pageId) => {
    try {
      const response = await apiRequest.patch(`/facebook-pages/${pageId}/toggle-status`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchPages(currentPage, searchTerm, statusFilter, accountFilter);
      } else {
        toast.error('Failed to toggle page status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  // Handle delete page
  const handleDeletePage = async (pageId) => {
    try {
      const response = await apiRequest.delete(`/facebook-pages/${pageId}`);
      
      if (response.data.success) {
        toast.success('Page deleted successfully!');
        setShowDeleteConfirm(null);
        fetchPages(currentPage, searchTerm, statusFilter, accountFilter);
      } else {
        toast.error('Failed to delete page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error(error.response?.data?.message || 'Failed to delete page');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
      switch (status) {
        case 'enabled':
          return {
            className: 'bg-green-100 text-green-800',
            icon: Power,
            label: 'Enabled'
          };
        case 'disabled':
          return {
            className: 'bg-red-100 text-red-800',
            icon: PowerOff,
            label: 'Disabled'
          };
        case 'suspended_temporarily':
          return {
            className: 'bg-yellow-100 text-yellow-800',
            icon: Clock,
            label: 'Suspended'
          };
        default:
          return {
            className: 'bg-gray-100 text-gray-800',
            icon: PowerOff,
            label: 'Unknown'
          };
      }
    };
    
    const config = getStatusConfig(status);
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Pagination component
  const Pagination = () => (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, totalCount)}
            </span> of{' '}
            <span className="font-medium">{totalCount}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 3 || 
                page === currentPage + 3
              ) {
                return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Facebook Pages</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage Facebook pages linked to your accounts
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => {
                setEditingPage(null);
                setShowAddForm(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Facebook Page
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by page name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
              <option value="suspended_temporarily">Suspended Temporarily</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={accountFilter}
              onChange={(e) => handleAccountFilterChange(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Accounts</option>
              {facebookAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={() => fetchPages(currentPage, searchTerm, statusFilter, accountFilter)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading Facebook pages...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No Facebook pages found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || statusFilter !== 'all' || accountFilter !== 'all'
                ? 'Try adjusting your filters' 
                : 'Add your first Facebook page to get started'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facebook Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {page.page_name}
                            </div>
                            {page.page_description && (
                              <div className="text-xs text-gray-500 max-w-xs truncate">
                                {page.page_description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Link className="w-4 h-4 mr-1 text-gray-400" />
                            {page.facebook_account_email || `Account #${page.facebook_account_id}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={page.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatDate(page.created_at)}</div>
                        {page.created_by_name && (
                          <div className="text-xs text-gray-400">
                            by {page.created_by_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(page.id)}
                            className={`p-1 rounded ${
                              page.status === 'enabled'
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={`${page.status === 'enabled' ? 'Disable' : 'Enable'} page`}
                          >
                            {page.status === 'enabled' ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEditPage(page)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit page"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setShowDeleteConfirm(page.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && <Pagination />}
          </>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <FacebookPageForm
          page={editingPage}
          onClose={() => {
            setShowAddForm(false);
            setEditingPage(null);
          }}
          onSave={handlePageSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Facebook Page</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this Facebook page? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDeletePage(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete Page
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="mt-3 px-4 py-2 bg-white text-gray-500 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookPages;