import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  RefreshCw,
  Building2,
  TrendingUp,
  Mail,
  Phone,
  Users,
  ToggleLeft,
  ToggleRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import BMForm from '../components/BMForm';
import AdsManagerForm from '../components/AdsManagerForm';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BusinessManager = () => {
  const [bms, setBMs] = useState([]);
  const [selectedBM, setSelectedBM] = useState(null);
  const [adsManagers, setAdsManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adsManagersLoading, setAdsManagersLoading] = useState(false);
  const [showBMForm, setShowBMForm] = useState(false);
  const [showAdsManagerForm, setShowAdsManagerForm] = useState(false);
  const [editingBM, setEditingBM] = useState(null);
  const [editingAdsManager, setEditingAdsManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // Fetch BMs
  const fetchBMs = async (search = '', status = 'all') => {
    try {
      console.log('🔍 Frontend: fetchBMs called with:', { search, status });
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100' // Get all BMs for easy navigation
      });
      
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);

      const url = `/bm?${params}`;
      console.log('🔍 Frontend: API URL:', url);
      const response = await apiRequest.get(url);
      
      if (response.data.success) {
        setBMs(response.data.data || []);
        // If no BM is selected and we have BMs, select the first one
        if (!selectedBM && response.data.data.length > 0) {
          setSelectedBM(response.data.data[0]);
        }
      } else {
        toast.error('Failed to fetch Business Managers');
      }
    } catch (error) {
      console.error('Error fetching BMs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch BMs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Ads Managers for selected BM
  const fetchAdsManagers = async (bmId) => {
    if (!bmId) {
      setAdsManagers([]);
      return;
    }

    try {
      setAdsManagersLoading(true);
      const response = await apiRequest.get(`/ads-managers/bm/${bmId}`);
      
      if (response.data.success) {
        setAdsManagers(response.data.data || []);
      } else {
        toast.error('Failed to fetch Ads Managers');
      }
    } catch (error) {
      console.error('Error fetching Ads Managers:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch Ads Managers');
    } finally {
      setAdsManagersLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log('🔍 Frontend: useEffect triggered - searchTerm:', searchTerm, 'statusFilter:', statusFilter);
    fetchBMs(searchTerm, statusFilter);
  }, [searchTerm, statusFilter]);

  // Load ads managers when selectedBM changes
  useEffect(() => {
    if (selectedBM) {
      fetchAdsManagers(selectedBM.id);
    } else {
      setAdsManagers([]);
    }
  }, [selectedBM]);

  // Handle BM selection
  const handleSelectBM = (bm) => {
    setSelectedBM(bm);
  };

  // Handle BM creation/update success
  const handleBMSaved = () => {
    setShowBMForm(false);
    setEditingBM(null);
    fetchBMs(searchTerm, statusFilter);
    toast.success(editingBM ? 'BM updated successfully!' : 'BM created successfully!');
  };

  // Handle Ads Manager creation/update success
  const handleAdsManagerSaved = () => {
    setShowAdsManagerForm(false);
    setEditingAdsManager(null);
    if (selectedBM) {
      fetchAdsManagers(selectedBM.id);
    }
    toast.success(editingAdsManager ? 'Ads Manager updated successfully!' : 'Ads Manager created successfully!');
  };

  // Handle edit BM
  const handleEditBM = (bm) => {
    setEditingBM(bm);
    setShowBMForm(true);
  };

  // Handle edit Ads Manager
  const handleEditAdsManager = (adsManager) => {
    setEditingAdsManager(adsManager);
    setShowAdsManagerForm(true);
  };

  // Handle toggle BM status
  const handleToggleBMStatus = async (bmId) => {
    try {
      const response = await apiRequest.patch(`/bm/${bmId}/toggle-status`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchBMs(searchTerm, statusFilter);
        // Refresh ads managers if this BM is selected
        if (selectedBM && selectedBM.id === bmId) {
          fetchAdsManagers(bmId);
        }
      } else {
        toast.error('Failed to toggle BM status');
      }
    } catch (error) {
      console.error('Error toggling BM status:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  // Handle toggle Ads Manager status
  const handleToggleAdsManagerStatus = async (adsManagerId) => {
    try {
      const response = await apiRequest.patch(`/ads-managers/${adsManagerId}/toggle-status`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        if (selectedBM) {
          fetchAdsManagers(selectedBM.id);
        }
      } else {
        toast.error('Failed to toggle Ads Manager status');
      }
    } catch (error) {
      console.error('Error toggling Ads Manager status:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  // Handle delete BM
  const handleDeleteBM = async (bmId) => {
    if (!window.confirm('Are you sure you want to delete this Business Manager? This will also delete all associated Ads Managers.')) {
      return;
    }

    try {
      const response = await apiRequest.delete(`/bm/${bmId}`);
      
      if (response.data.success) {
        toast.success('BM deleted successfully!');
        fetchBMs(searchTerm, statusFilter);
        // Clear selection if deleted BM was selected
        if (selectedBM && selectedBM.id === bmId) {
          setSelectedBM(null);
        }
      } else {
        toast.error('Failed to delete BM');
      }
    } catch (error) {
      console.error('Error deleting BM:', error);
      toast.error(error.response?.data?.message || 'Failed to delete BM');
    }
  };

  // Handle delete Ads Manager
  const handleDeleteAdsManager = async (adsManagerId) => {
    if (!window.confirm('Are you sure you want to delete this Ads Manager?')) {
      return;
    }

    try {
      const response = await apiRequest.delete(`/ads-managers/${adsManagerId}`);
      
      if (response.data.success) {
        toast.success('Ads Manager deleted successfully!');
        if (selectedBM) {
          fetchAdsManagers(selectedBM.id);
        }
      } else {
        toast.error('Failed to delete Ads Manager');
      }
    } catch (error) {
      console.error('Error deleting Ads Manager:', error);
      toast.error(error.response?.data?.message || 'Failed to delete Ads Manager');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Status badge component
  const StatusBadge = ({ status, type = 'bm' }) => {
    const getStatusConfig = (status) => {
      switch (status) {
        case 'enabled':
          return {
            className: 'bg-green-100 text-green-800',
            icon: Power,
            label: 'Active'
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
            icon: AlertCircle,
            label: 'Unknown'
          };
      }
    };
    
    const config = getStatusConfig(status);
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Left Panel - Business Managers */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Building2 className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Business Managers</h2>
            </div>
            <button
              onClick={() => {
                setEditingBM(null);
                setShowBMForm(true);
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add BM
            </button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Business Managers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="enabled">Active</option>
              <option value="disabled">Disabled</option>
              <option value="suspended_temporarily">Suspended</option>
            </select>
          </div>
        </div>

        {/* BM List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Loading Business Managers...</p>
            </div>
          ) : bms.length === 0 ? (
            <div className="p-6 text-center">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No Business Managers found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first Business Manager to get started'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {bms.map((bm) => (
                <div
                  key={bm.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedBM?.id === bm.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => handleSelectBM(bm)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {bm.bm_name}
                        </h3>
                        <StatusBadge status={bm.status} />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="w-3 h-3 mr-1" />
                          <span className="truncate">{bm.email}</span>
                        </div>
                        {bm.phone_number && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Phone className="w-3 h-3 mr-1" />
                            <span>{bm.phone_number}</span>
                          </div>
                        )}
                        <div className="flex items-center text-xs text-gray-500">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{bm.ads_managers_count || 0} Ads Managers</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-2 flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBMStatus(bm.id);
                        }}
                        className={`p-1 rounded hover:bg-gray-200 ${
                          bm.status === 'enabled' ? 'text-red-600' : 'text-green-600'
                        }`}
                        title={`${bm.status === 'enabled' ? 'Disable' : 'Enable'} BM`}
                      >
                        {bm.status === 'enabled' ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditBM(bm);
                        }}
                        className="p-1 rounded hover:bg-gray-200 text-blue-600"
                        title="Edit BM"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBM(bm.id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 text-red-600"
                        title="Delete BM"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Ads Managers */}
      <div className="flex-1 bg-white flex flex-col">
        {selectedBM ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Ads Managers</h2>
                    <p className="text-sm text-gray-500">for {selectedBM.bm_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingAdsManager(null);
                    setShowAdsManagerForm(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Ads Manager
                </button>
              </div>

              {/* Selected BM Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={selectedBM.status} />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{selectedBM.bm_name}</div>
                      <div className="text-gray-500">{selectedBM.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {adsManagers.length} Ads Manager{adsManagers.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Ads Managers List */}
            <div className="flex-1 overflow-y-auto p-6">
              {adsManagersLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Loading Ads Managers...</p>
                </div>
              ) : adsManagers.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No Ads Managers found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Create the first Ads Manager for {selectedBM.bm_name}
                  </p>
                  <button
                    onClick={() => {
                      setEditingAdsManager(null);
                      setShowAdsManagerForm(true);
                    }}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Ads Manager
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {adsManagers.map((adsManager) => (
                    <div
                      key={adsManager.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <StatusBadge status={adsManager.status} type="ads" />
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleAdsManagerStatus(adsManager.id)}
                            className={`p-1 rounded hover:bg-gray-200 ${
                              adsManager.status === 'enabled' ? 'text-red-600' : 'text-green-600'
                            }`}
                            title={`${adsManager.status === 'enabled' ? 'Disable' : 'Enable'} Ads Manager`}
                          >
                            {adsManager.status === 'enabled' ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditAdsManager(adsManager)}
                            className="p-1 rounded hover:bg-gray-200 text-blue-600"
                            title="Edit Ads Manager"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAdsManager(adsManager.id)}
                            className="p-1 rounded hover:bg-gray-200 text-red-600"
                            title="Delete Ads Manager"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {adsManager.ads_manager_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Created {formatDate(adsManager.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* No BM Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Business Manager
              </h3>
              <p className="text-gray-500 mb-6">
                Choose a Business Manager from the left panel to view and manage its Ads Managers
              </p>
              {bms.length === 0 && (
                <button
                  onClick={() => {
                    setEditingBM(null);
                    setShowBMForm(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Business Manager
                </button>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* BM Form Modal */}
      {showBMForm && (
        <BMForm
          bm={editingBM}
          onClose={() => {
            setShowBMForm(false);
            setEditingBM(null);
          }}
          onSave={handleBMSaved}
        />
      )}

      {/* Ads Manager Form Modal */}
      {showAdsManagerForm && selectedBM && (
        <AdsManagerForm
          adsManager={editingAdsManager}
          selectedBM={selectedBM}
          onClose={() => {
            setShowAdsManagerForm(false);
            setEditingAdsManager(null);
          }}
          onSave={handleAdsManagerSaved}
        />
      )}
    </>
  );
};

export default BusinessManager;