import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  ArrowPathIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import borrowService from '../services/borrowService';
import inventoryService from '../services/inventoryService';
import { useBorrowStore } from '../store/borrowStore';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

const RETURN_CONDITIONS = ['Good', 'Damaged', 'Lost'];

export default function BorrowManagement() {
  const { user } = useAuthStore();
  const { 
    records, 
    loading, 
    pagination, 
    filters,
    overdueItems,
    upcomingReturns,
    setRecords, 
    setLoading, 
    setPagination, 
    setFilters,
    setOverdueItems,
    setUpcomingReturns
  } = useBorrowStore();

  const [activeTab, setActiveTab] = useState('all');
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [releaseForm, setReleaseForm] = useState({
    inventoryId: '',
    borrowerName: '',
    borrowerEmail: '',
    borrowerDepartment: '',
    borrowDate: format(new Date(), 'yyyy-MM-dd'),
    expectedReturnDate: '',
    purpose: '',
    notes: '',
  });

  const [returnForm, setReturnForm] = useState({
    returnCondition: 'Good',
    notes: '',
  });

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchRecords();
    fetchOverdueAndUpcoming();
  }, [pagination.page, filters, activeTab]);

  useEffect(() => {
    if (isReleaseModalOpen) {
      fetchAvailableItems();
    }
  }, [isReleaseModalOpen]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let response;
      
      if (activeTab === 'overdue') {
        response = await borrowService.getOverdueItems();
        if (response.success) {
          setRecords(response.data);
          setPagination({ page: 1, limit: 10, total: response.data.length, totalPages: 1 });
        }
      } else if (activeTab === 'upcoming') {
        response = await borrowService.getUpcomingReturns(7);
        if (response.success) {
          setRecords(response.data);
          setPagination({ page: 1, limit: 10, total: response.data.length, totalPages: 1 });
        }
      } else {
        response = await borrowService.getAll({
          page: pagination.page,
          limit: pagination.limit,
          status: filters.status,
          search: filters.search,
        });
        
        if (response.success) {
          setRecords(response.data.records);
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch borrow records');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueAndUpcoming = async () => {
    try {
      const [overdueRes, upcomingRes] = await Promise.all([
        borrowService.getOverdueItems(),
        borrowService.getUpcomingReturns(7)
      ]);
      
      if (overdueRes.success) setOverdueItems(overdueRes.data);
      if (upcomingRes.success) setUpcomingReturns(upcomingRes.data);
    } catch (error) {
      console.error('Failed to fetch overdue/upcoming items:', error);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      const response = await inventoryService.getAll({ 
        limit: 100, 
        isBorrowed: 'false' 
      });
      if (response.success) {
        setAvailableItems(response.data.inventory.filter(item => !item.isBorrowed));
      }
    } catch (error) {
      console.error('Failed to fetch available items:', error);
    }
  };

  const handleReleaseSubmit = async (e) => {
    e.preventDefault();
    
    if (!releaseForm.inventoryId || !releaseForm.borrowerName || !releaseForm.expectedReturnDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await borrowService.create(releaseForm);
      if (response.success) {
        toast.success('Equipment released successfully');
        setIsReleaseModalOpen(false);
        setReleaseForm({
          inventoryId: '',
          borrowerName: '',
          borrowerEmail: '',
          borrowerDepartment: '',
          borrowDate: format(new Date(), 'yyyy-MM-dd'),
          expectedReturnDate: '',
          purpose: '',
          notes: '',
        });
        fetchRecords();
        fetchOverdueAndUpcoming();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to release equipment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRecord) return;

    setSubmitting(true);
    try {
      const response = await borrowService.processReturn(selectedRecord.id, returnForm);
      if (response.success) {
        toast.success('Return processed successfully');
        setIsReturnModalOpen(false);
        setSelectedRecord(null);
        setReturnForm({ returnCondition: 'Good', notes: '' });
        fetchRecords();
        fetchOverdueAndUpcoming();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  const openReturnModal = (record) => {
    setSelectedRecord(record);
    setIsReturnModalOpen(true);
  };

  const getDaysRemaining = (expectedReturnDate) => {
    const days = differenceInDays(new Date(expectedReturnDate), new Date());
    if (days < 0) return <span className="text-red-600 font-medium">{Math.abs(days)} days overdue</span>;
    if (days === 0) return <span className="text-yellow-600 font-medium">Due today</span>;
    return <span className="text-green-600">{days} days left</span>;
  };

  const tabs = [
    { id: 'all', name: 'All Records', count: null },
    { id: 'overdue', name: 'Overdue', count: overdueItems.length, color: 'text-red-600' },
    { id: 'upcoming', name: 'Due This Week', count: upcomingReturns.length, color: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Borrow / Return Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track equipment borrows, returns, and schedules
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsReleaseModalOpen(true)}
            className="btn btn-primary mt-4 sm:mt-0"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Release Equipment
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-blue-100 rounded-full p-3">
            <ArrowPathIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Currently Borrowed</p>
            <p className="text-2xl font-bold text-gray-900">
              {records.filter(r => r.status === 'Borrowed' || r.status === 'Extended').length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-red-100 rounded-full p-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Overdue Items</p>
            <p className="text-2xl font-bold text-red-600">{overdueItems.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-yellow-100 rounded-full p-3">
            <ClockIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Due This Week</p>
            <p className="text-2xl font-bold text-yellow-600">{upcomingReturns.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count !== null && tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                  tab.color ? `bg-red-100 ${tab.color}` : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters (only for "all" tab) */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by borrower name..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ search: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="input pl-10"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ status: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="Borrowed">Borrowed</option>
              <option value="Returned">Returned</option>
              <option value="Overdue">Overdue</option>
              <option value="Extended">Extended</option>
            </select>
            <button
              onClick={() => {
                setFilters({ search: '', status: '' });
                setPagination({ ...pagination, page: 1 });
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <Loading text="Loading records..." />
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">
              {activeTab === 'overdue' 
                ? 'No overdue items! Great job!' 
                : activeTab === 'upcoming'
                  ? 'No items due this week'
                  : 'No borrow records found'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Borrower
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Borrow Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Return
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days
                    </th>
                    {canManage && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.inventory?.pcName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {record.inventory?.pcType}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.borrowerName}</div>
                        {record.borrowerEmail && (
                          <div className="text-xs text-gray-500">{record.borrowerEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.borrowerDepartment || record.inventory?.department || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(record.borrowDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(record.expectedReturnDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {record.status !== 'Returned' ? (
                          getDaysRemaining(record.expectedReturnDate)
                        ) : (
                          <span className="text-gray-500">
                            Returned {record.actualReturnDate && format(new Date(record.actualReturnDate), 'MMM dd')}
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {record.status !== 'Returned' && (
                            <button
                              onClick={() => openReturnModal(record)}
                              className="btn btn-success btn-sm text-xs"
                            >
                              Process Return
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {activeTab === 'all' && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(page) => setPagination({ ...pagination, page })}
              />
            )}
          </>
        )}
      </div>

      {/* Release Equipment Modal */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title="Release Equipment"
        size="lg"
      >
        <form onSubmit={handleReleaseSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Select Equipment *</label>
              <select
                value={releaseForm.inventoryId}
                onChange={(e) => setReleaseForm({ ...releaseForm, inventoryId: e.target.value })}
                className="input"
                required
              >
                <option value="">Choose an available item...</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.pcName} - {item.pcType} ({item.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Borrower Name *</label>
              <input
                type="text"
                value={releaseForm.borrowerName}
                onChange={(e) => setReleaseForm({ ...releaseForm, borrowerName: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Borrower Email</label>
              <input
                type="email"
                value={releaseForm.borrowerEmail}
                onChange={(e) => setReleaseForm({ ...releaseForm, borrowerEmail: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Borrower Department</label>
              <input
                type="text"
                value={releaseForm.borrowerDepartment}
                onChange={(e) => setReleaseForm({ ...releaseForm, borrowerDepartment: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Borrow Date</label>
              <input
                type="date"
                value={releaseForm.borrowDate}
                onChange={(e) => setReleaseForm({ ...releaseForm, borrowDate: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Expected Return Date *</label>
              <input
                type="date"
                value={releaseForm.expectedReturnDate}
                onChange={(e) => setReleaseForm({ ...releaseForm, expectedReturnDate: e.target.value })}
                className="input"
                required
                min={releaseForm.borrowDate}
              />
            </div>

            <div>
              <label className="label">Purpose</label>
              <input
                type="text"
                value={releaseForm.purpose}
                onChange={(e) => setReleaseForm({ ...releaseForm, purpose: e.target.value })}
                className="input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea
                value={releaseForm.notes}
                onChange={(e) => setReleaseForm({ ...releaseForm, notes: e.target.value })}
                rows={2}
                className="input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsReleaseModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Releasing...' : 'Release Equipment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Process Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedRecord(null);
        }}
        title="Process Return"
        size="md"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          {selectedRecord && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900">{selectedRecord.inventory?.pcName}</h4>
              <p className="text-sm text-gray-500">Borrowed by: {selectedRecord.borrowerName}</p>
              <p className="text-sm text-gray-500">
                Borrowed on: {format(new Date(selectedRecord.borrowDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}

          <div>
            <label className="label">Return Condition *</label>
            <select
              value={returnForm.returnCondition}
              onChange={(e) => setReturnForm({ ...returnForm, returnCondition: e.target.value })}
              className="input"
              required
            >
              {RETURN_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={returnForm.notes}
              onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
              rows={3}
              className="input"
              placeholder="Any additional notes about the return..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setIsReturnModalOpen(false);
                setSelectedRecord(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-success"
            >
              {submitting ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
