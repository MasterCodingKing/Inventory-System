import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import inventoryService from '../services/inventoryService';
import { useInventoryStore } from '../store/inventoryStore';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

const PC_TYPES = ['LAPTOP', 'DESKTOP', 'LAPTOP DESKTOP'];
const WINDOWS_VERSIONS = ['Windows 10', 'Windows 11', 'Windows Server'];
const OFFICE_VERSIONS = ['Office 365', 'Office LTSC', 'Office 2021', 'Office 2019', 'None'];
const STATUSES = ['Active User', 'Transfer', 'For Upgrade', 'Available', 'Maintenance', 'Retired'];
const USER_STATUSES = ['Active User', 'Inactive', 'On Leave'];

const initialFormData = {
  fullName: '',
  department: '',
  pcName: '',
  windowsVersion: '',
  microsoftOffice: '',
  applicationsSystem: 'MS Office, Viber, Messenger, Gmail',
  pcType: 'DESKTOP',
  status: 'Active User',
  userStatus: 'Active User',
  remarks: '',
  serialNumber: '',
  brand: '',
  model: '',
  purchaseDate: '',
  warrantyExpiry: '',
};

export default function Inventory() {
  const { user } = useAuthStore();
  const { 
    inventory, 
    loading, 
    pagination, 
    filters, 
    setInventory, 
    setLoading, 
    setPagination, 
    setFilters 
  } = useInventoryStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchInventory();
    fetchDepartments();
  }, [pagination.page, filters]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        department: filters.department,
        status: filters.status,
        pcType: filters.pcType,
      });
      
      if (response.success) {
        setInventory(response.data.inventory);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await inventoryService.getDepartments();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleSearch = (e) => {
    setFilters({ search: e.target.value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setIsEditing(true);
      setFormData({
        ...initialFormData,
        ...item,
        purchaseDate: item.purchaseDate || '',
        warrantyExpiry: item.warrantyExpiry || '',
      });
    } else {
      setIsEditing(false);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.department || !formData.pcType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      let response;
      if (isEditing) {
        response = await inventoryService.update(formData.id, formData);
        toast.success('Inventory item updated successfully');
      } else {
        response = await inventoryService.create(formData);
        toast.success('Inventory item created successfully');
      }
      
      handleCloseModal();
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await inventoryService.delete(id);
      toast.success('Item deleted successfully');
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your IT equipment inventory
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary mt-4 sm:mt-0"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Item
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, PC, department..."
              value={filters.search}
              onChange={handleSearch}
              className="input pl-10"
            />
          </div>

          {/* Department Filter */}
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="input"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* PC Type Filter */}
          <select
            value={filters.pcType}
            onChange={(e) => handleFilterChange('pcType', e.target.value)}
            className="input"
          >
            <option value="">All PC Types</option>
            {PC_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setFilters({ search: '', department: '', status: '', pcType: '' });
              setPagination({ ...pagination, page: 1 });
            }}
            className="btn btn-secondary"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <Loading text="Loading inventory..." />
        ) : inventory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No inventory items found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PC Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Windows
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MS Office
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PC Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    {canEdit && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.fullName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.department}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.pcName || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.windowsVersion || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.microsoftOffice || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className="badge badge-info">{item.pcType}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={item.userStatus} />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {item.remarks || '-'}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(page) => setPagination({ ...pagination, page })}
            />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="label">Department *</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="input"
                required
                list="departments"
              />
              <datalist id="departments">
                {departments.map((dept) => (
                  <option key={dept} value={dept} />
                ))}
              </datalist>
            </div>

            {/* PC Name */}
            <div>
              <label className="label">PC Name</label>
              <input
                type="text"
                name="pcName"
                value={formData.pcName}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            {/* PC Type */}
            <div>
              <label className="label">PC Type *</label>
              <select
                name="pcType"
                value={formData.pcType}
                onChange={handleInputChange}
                className="input"
                required
              >
                {PC_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Windows Version */}
            <div>
              <label className="label">Windows Version</label>
              <select
                name="windowsVersion"
                value={formData.windowsVersion}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Select...</option>
                {WINDOWS_VERSIONS.map((version) => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
            </div>

            {/* Microsoft Office */}
            <div>
              <label className="label">Microsoft Office</label>
              <select
                name="microsoftOffice"
                value={formData.microsoftOffice}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Select...</option>
                {OFFICE_VERSIONS.map((version) => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
            </div>

            {/* Applications System */}
            <div className="sm:col-span-2">
              <label className="label">Applications System</label>
              <input
                type="text"
                name="applicationsSystem"
                value={formData.applicationsSystem}
                onChange={handleInputChange}
                className="input"
                placeholder="MS Office, Viber, Messenger, Gmail"
              />
            </div>

            {/* Status */}
            <div>
              <label className="label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="input"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* User Status */}
            <div>
              <label className="label">User Status</label>
              <select
                name="userStatus"
                value={formData.userStatus}
                onChange={handleInputChange}
                className="input"
              >
                {USER_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Serial Number */}
            <div>
              <label className="label">Serial Number</label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="label">Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            {/* Model */}
            <div>
              <label className="label">Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="label">Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            {/* Remarks */}
            <div className="sm:col-span-2">
              <label className="label">Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={2}
                className="input"
                placeholder="Working, PC-from-Name, etc."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
