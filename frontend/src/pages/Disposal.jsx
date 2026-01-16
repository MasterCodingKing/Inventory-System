import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import disposalService from '../services/disposalService';
import { useDisposalStore } from '../store/disposalStore';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

const DISPOSAL_METHODS = ['Sold', 'Donated', 'Recycled', 'Scrapped', 'Trade-In', 'Other'];
const DISPOSAL_STATUSES = ['Pending', 'Approved', 'Completed', 'Cancelled'];
const DISPOSAL_REASONS = [
  'End of life',
  'Damaged beyond repair',
  'Obsolete technology',
  'Replaced with new equipment',
  'Security concerns',
  'Cost of maintenance too high',
  'Other'
];

const initialFormData = {
  inventoryId: '',
  disposalDate: new Date().toISOString().split('T')[0],
  disposalMethod: 'Scrapped',
  reason: '',
  salePrice: '',
  recipientName: '',
  recipientContact: '',
  certificateNumber: '',
  notes: '',
};

export default function Disposal() {
  const { user } = useAuthStore();
  const {
    disposals,
    loading,
    pagination,
    filters,
    setDisposals,
    setLoading,
    setPagination,
    setFilters
  } = useDisposalStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [searchingItems, setSearchingItems] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewingDisposal, setViewingDisposal] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: '', disposal: null });

  const isAdmin = user?.role === 'admin';
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const fetchDisposals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await disposalService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        status: filters.status,
        disposalMethod: filters.disposalMethod,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      if (response.success) {
        setDisposals(response.data.disposals);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to fetch disposals');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, setDisposals, setLoading, setPagination]);

  useEffect(() => {
    fetchDisposals();
  }, [fetchDisposals]);

  const searchAvailableItems = async (search = '') => {
    setSearchingItems(true);
    try {
      const response = await disposalService.getAvailableItems(search);
      if (response.success) {
        setAvailableItems(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch available items:', error);
    } finally {
      setSearchingItems(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && !isEditing) {
      searchAvailableItems(itemSearch);
    }
  }, [isModalOpen, isEditing, itemSearch]);

  const handleSearch = (e) => {
    setFilters({ search: e.target.value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleOpenModal = (disposal = null) => {
    if (disposal) {
      setIsEditing(true);
      setFormData({
        ...initialFormData,
        inventoryId: disposal.inventoryId,
        disposalDate: disposal.disposalDate || '',
        disposalMethod: disposal.disposalMethod || 'Scrapped',
        reason: disposal.reason || '',
        salePrice: disposal.salePrice || '',
        recipientName: disposal.recipientName || '',
        recipientContact: disposal.recipientContact || '',
        certificateNumber: disposal.certificateNumber || '',
        notes: disposal.notes || '',
        id: disposal.id,
      });
      setSelectedItem(disposal.inventory);
    } else {
      setIsEditing(false);
      setFormData(initialFormData);
      setSelectedItem(null);
      setItemSearch('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
    setSelectedItem(null);
    setItemSearch('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setFormData((prev) => ({ ...prev, inventoryId: item.id }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.inventoryId || !formData.disposalDate || !formData.disposalMethod || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await disposalService.update(formData.id, formData);
        toast.success('Disposal request updated successfully');
      } else {
        await disposalService.create(formData);
        toast.success('Disposal request created successfully');
      }

      handleCloseModal();
      fetchDisposals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (disposal) => {
    try {
      await disposalService.approve(disposal.id);
      toast.success('Disposal approved successfully');
      fetchDisposals();
      setActionModal({ open: false, type: '', disposal: null });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve disposal');
    }
  };

  const handleComplete = async (disposal, additionalData = {}) => {
    try {
      await disposalService.complete(disposal.id, additionalData);
      toast.success('Disposal completed successfully');
      fetchDisposals();
      setActionModal({ open: false, type: '', disposal: null });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete disposal');
    }
  };

  const handleCancel = async (disposal, notes = '') => {
    try {
      await disposalService.cancel(disposal.id, { notes });
      toast.success('Disposal cancelled successfully');
      fetchDisposals();
      setActionModal({ open: false, type: '', disposal: null });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel disposal');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this disposal record?')) return;

    try {
      await disposalService.delete(id);
      toast.success('Disposal record deleted successfully');
      fetchDisposals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'Approved':
        return <DocumentCheckIcon className="h-5 w-5 text-blue-500" />;
      case 'Completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'Pending': 'badge-warning',
      'Approved': 'badge-info',
      'Completed': 'badge-success',
      'Cancelled': 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disposal Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage equipment disposal requests and tracking
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary mt-4 sm:mt-0"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Disposal Request
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
              placeholder="Search by item name, serial..."
              value={filters.search}
              onChange={handleSearch}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input"
          >
            <option value="">All Statuses</option>
            {DISPOSAL_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Method Filter */}
          <select
            value={filters.disposalMethod}
            onChange={(e) => handleFilterChange('disposalMethod', e.target.value)}
            className="input"
          >
            <option value="">All Methods</option>
            {DISPOSAL_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="input"
            placeholder="From Date"
          />

          {/* Clear Filters */}
          <button
            onClick={() => {
              setFilters({ search: '', status: '', disposalMethod: '', startDate: '', endDate: '' });
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
          <Loading text="Loading disposal records..." />
        ) : disposals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No disposal records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disposal Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    {canManage && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {disposals.map((disposal) => (
                    <tr key={disposal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {disposal.inventory?.fullName || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {disposal.inventory?.pcName || '-'} ({disposal.inventory?.pcType})
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {disposal.inventory?.serialNumber || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="badge badge-info">{disposal.disposalMethod}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {disposal.disposalDate ? new Date(disposal.disposalDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(disposal.status)}
                          <span className={`badge ${getStatusBadgeClass(disposal.status)}`}>
                            {disposal.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {disposal.reason || '-'}
                      </td>
                      {canManage && (
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {/* Approve button - Admin only, Pending status */}
                            {isAdmin && disposal.status === 'Pending' && (
                              <button
                                onClick={() => setActionModal({ open: true, type: 'approve', disposal })}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                            )}
                            
                            {/* Complete button - Manager+, Approved status */}
                            {disposal.status === 'Approved' && (
                              <button
                                onClick={() => setActionModal({ open: true, type: 'complete', disposal })}
                                className="text-blue-600 hover:text-blue-900"
                                title="Complete"
                              >
                                <DocumentCheckIcon className="h-5 w-5" />
                              </button>
                            )}

                            {/* Edit button - Pending only */}
                            {disposal.status === 'Pending' && (
                              <button
                                onClick={() => handleOpenModal(disposal)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                            )}

                            {/* Cancel button - Admin only, not completed */}
                            {isAdmin && (disposal.status === 'Pending' || disposal.status === 'Approved') && (
                              <button
                                onClick={() => setActionModal({ open: true, type: 'cancel', disposal })}
                                className="text-orange-600 hover:text-orange-900"
                                title="Cancel"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            )}

                            {/* Delete button - Admin only, Pending or Cancelled */}
                            {isAdmin && (disposal.status === 'Pending' || disposal.status === 'Cancelled') && (
                              <button
                                onClick={() => handleDelete(disposal.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
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
        title={isEditing ? 'Edit Disposal Request' : 'New Disposal Request'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Selection */}
          {!isEditing && (
            <div>
              <label className="label">Search & Select Item *</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, serial number, department..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
              {searchingItems ? (
                <div className="mt-2 text-sm text-gray-500">Searching...</div>
              ) : (
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                  {availableItems.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No available items found</div>
                  ) : (
                    availableItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                          selectedItem?.id === item.id ? 'bg-primary-50 border-primary-200' : ''
                        }`}
                      >
                        <div className="font-medium text-sm">{item.fullName}</div>
                        <div className="text-xs text-gray-500">
                          {item.pcName} | {item.serialNumber || 'No Serial'} | {item.department} | {item.pcType}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected Item Display */}
          {selectedItem && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm font-medium">Selected Item:</div>
              <div className="text-sm text-gray-600">
                {selectedItem.fullName} - {selectedItem.pcName} ({selectedItem.serialNumber || 'No Serial'})
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Disposal Date */}
            <div>
              <label className="label">Disposal Date *</label>
              <input
                type="date"
                name="disposalDate"
                value={formData.disposalDate}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            {/* Disposal Method */}
            <div>
              <label className="label">Disposal Method *</label>
              <select
                name="disposalMethod"
                value={formData.disposalMethod}
                onChange={handleInputChange}
                className="input"
                required
              >
                {DISPOSAL_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div className="sm:col-span-2">
              <label className="label">Reason for Disposal *</label>
              <select
                name="reason"
                value={DISPOSAL_REASONS.includes(formData.reason) ? formData.reason : 'Other'}
                onChange={(e) => {
                  if (e.target.value !== 'Other') {
                    setFormData(prev => ({ ...prev, reason: e.target.value }));
                  } else {
                    setFormData(prev => ({ ...prev, reason: '' }));
                  }
                }}
                className="input mb-2"
              >
                <option value="">Select a reason...</option>
                {DISPOSAL_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              {(!DISPOSAL_REASONS.includes(formData.reason) || formData.reason === '' || formData.reason === 'Other') && (
                <input
                  type="text"
                  name="reason"
                  value={formData.reason === 'Other' ? '' : formData.reason}
                  onChange={handleInputChange}
                  placeholder="Enter custom reason..."
                  className="input"
                />
              )}
            </div>

            {/* Sale Price (conditional) */}
            {(formData.disposalMethod === 'Sold' || formData.disposalMethod === 'Trade-In') && (
              <div>
                <label className="label">Sale/Trade-In Price</label>
                <input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleInputChange}
                  className="input"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Recipient Name (conditional) */}
            {(formData.disposalMethod === 'Sold' || formData.disposalMethod === 'Donated') && (
              <>
                <div>
                  <label className="label">Recipient Name</label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Buyer or recipient organization"
                  />
                </div>
                <div>
                  <label className="label">Recipient Contact</label>
                  <input
                    type="text"
                    name="recipientContact"
                    value={formData.recipientContact}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Phone or email"
                  />
                </div>
              </>
            )}

            {/* Certificate Number */}
            <div>
              <label className="label">Certificate/Reference Number</label>
              <input
                type="text"
                name="certificateNumber"
                value={formData.certificateNumber}
                onChange={handleInputChange}
                className="input"
                placeholder="Disposal or recycling certificate"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="label">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="input"
                rows="3"
                placeholder="Any additional information..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !formData.inventoryId}
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Request' : 'Create Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Action Modal (Approve/Complete/Cancel) */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, type: '', disposal: null })}
        title={
          actionModal.type === 'approve' ? 'Approve Disposal' :
          actionModal.type === 'complete' ? 'Complete Disposal' :
          'Cancel Disposal'
        }
        size="md"
      >
        {actionModal.disposal && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-600">
                <strong>Item:</strong> {actionModal.disposal.inventory?.fullName} - {actionModal.disposal.inventory?.pcName}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Method:</strong> {actionModal.disposal.disposalMethod}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Reason:</strong> {actionModal.disposal.reason}
              </div>
            </div>

            {actionModal.type === 'approve' && (
              <div>
                <p className="text-gray-700">Are you sure you want to approve this disposal request?</p>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setActionModal({ open: false, type: '', disposal: null })}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApprove(actionModal.disposal)}
                    className="btn btn-primary"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}

            {actionModal.type === 'complete' && (
              <CompleteDisposalForm
                disposal={actionModal.disposal}
                onComplete={handleComplete}
                onCancel={() => setActionModal({ open: false, type: '', disposal: null })}
              />
            )}

            {actionModal.type === 'cancel' && (
              <CancelDisposalForm
                disposal={actionModal.disposal}
                onConfirm={handleCancel}
                onCancel={() => setActionModal({ open: false, type: '', disposal: null })}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// Helper Component: Complete Disposal Form
function CompleteDisposalForm({ disposal, onComplete, onCancel }) {
  const [certificateNumber, setCertificateNumber] = useState(disposal.certificateNumber || '');
  const [notes, setNotes] = useState(disposal.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(disposal, { certificateNumber, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-gray-700">Complete this disposal and mark the item as Retired.</p>
      
      <div>
        <label className="label">Certificate/Reference Number</label>
        <input
          type="text"
          value={certificateNumber}
          onChange={(e) => setCertificateNumber(e.target.value)}
          className="input"
          placeholder="Disposal certificate number"
        />
      </div>

      <div>
        <label className="label">Completion Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows="2"
          placeholder="Any notes about the completion..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Complete Disposal
        </button>
      </div>
    </form>
  );
}

// Helper Component: Cancel Disposal Form
function CancelDisposalForm({ disposal, onConfirm, onCancel }) {
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(disposal, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-gray-700">Are you sure you want to cancel this disposal request?</p>
      
      <div>
        <label className="label">Cancellation Reason</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows="2"
          placeholder="Reason for cancellation..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Go Back
        </button>
        <button type="submit" className="btn btn-danger">
          Cancel Disposal
        </button>
      </div>
    </form>
  );
}
