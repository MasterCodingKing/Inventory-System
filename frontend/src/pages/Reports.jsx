import { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon, 
  ChartBarIcon,
  ComputerDesktopIcon,
  BuildingOfficeIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';
import reportService from '../services/reportService';
import Loading from '../components/Loading';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function Reports() {
  const [activeReport, setActiveReport] = useState('inventory');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const fetchReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      let response;
      
      switch (activeReport) {
        case 'inventory':
          response = await reportService.getInventoryReport(filters);
          break;
        case 'borrow':
          response = await reportService.getBorrowReport(filters);
          break;
        case 'department':
          response = await reportService.getDepartmentReport();
          break;
        case 'activity':
          response = await reportService.getActivityReport(30);
          break;
        default:
          response = await reportService.getInventoryReport(filters);
      }
      
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      let response;
      let filename;
      
      if (activeReport === 'inventory') {
        response = await reportService.exportInventoryCSV(filters);
        filename = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (activeReport === 'borrow') {
        response = await reportService.exportBorrowCSV(filters);
        filename = `borrow-report-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        toast.error('Export not available for this report type');
        return;
      }

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const reports = [
    { id: 'inventory', name: 'Inventory Report', icon: ComputerDesktopIcon },
    { id: 'borrow', name: 'Borrow Report', icon: ArrowsRightLeftIcon },
    { id: 'department', name: 'Department Report', icon: BuildingOfficeIcon },
    { id: 'activity', name: 'Activity Report', icon: ChartBarIcon },
  ];

  const renderInventoryReport = () => {
    if (!reportData || !reportData.summary) return null;

    const statusData = Object.entries(reportData.summary.byStatus || {}).map(([name, value]) => ({
      name,
      value
    }));

    const pcTypeData = Object.entries(reportData.summary.byPcType || {}).map(([name, value]) => ({
      name,
      value
    }));

    const deptData = Object.entries(reportData.summary.byDepartment || {}).map(([name, value]) => ({
      name,
      value
    }));

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">Total Items</p>
            <p className="text-3xl font-bold text-blue-900">{reportData.summary.totalItems}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600">By Status</p>
            <p className="text-3xl font-bold text-green-900">{Object.keys(reportData.summary.byStatus || {}).length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-600">PC Types</p>
            <p className="text-3xl font-bold text-purple-900">{Object.keys(reportData.summary.byPcType || {}).length}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-600">Departments</p>
            <p className="text-3xl font-bold text-orange-900">{Object.keys(reportData.summary.byDepartment || {}).length}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Department */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Items by Department</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PC Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">PC Type Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pcTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Inventory Items</h3>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PC Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PC Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.items?.slice(0, 50).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.pcName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.pcType}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        item.status === 'Active User' ? 'badge-success' :
                        item.status === 'Available' ? 'badge-info' :
                        item.status === 'Maintenance' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderBorrowReport = () => {
    if (!reportData || !reportData.summary) return null;

    const statusData = Object.entries(reportData.summary.byStatus || {}).map(([name, value]) => ({
      name,
      value
    }));

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">Total Records</p>
            <p className="text-3xl font-bold text-blue-900">{reportData.summary.totalRecords}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-600">Currently Borrowed</p>
            <p className="text-3xl font-bold text-yellow-900">{reportData.summary.totalBorrowed}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600">Returned</p>
            <p className="text-3xl font-bold text-green-900">{reportData.summary.totalReturned}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm font-medium text-red-600">Overdue</p>
            <p className="text-3xl font-bold text-red-900">{reportData.summary.totalOverdue}</p>
          </div>
        </div>

        {/* Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Borrow Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Borrow Records</h3>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Borrower</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Borrow Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.records?.slice(0, 50).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{record.borrowerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{record.inventory?.pcName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(record.borrowDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {record.actualReturnDate 
                        ? new Date(record.actualReturnDate).toLocaleDateString()
                        : new Date(record.expectedReturnDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        record.status === 'Returned' ? 'badge-success' :
                        record.status === 'Overdue' ? 'badge-danger' :
                        record.status === 'Borrowed' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDepartmentReport = () => {
    if (!reportData || !reportData.departments) return null;

    return (
      <div className="space-y-6">
        {/* Department Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Items by Department</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.departments} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalItems" name="Total" fill="#3B82F6" />
                <Bar dataKey="laptops" name="Laptops" fill="#10B981" />
                <Bar dataKey="desktops" name="Desktops" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Department Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Laptops</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desktops</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Borrowed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.departments?.map((dept, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{dept.totalItems}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{dept.activeItems}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{dept.availableItems}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{dept.laptops}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{dept.desktops}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{dept.borrowed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderActivityReport = () => {
    if (!reportData || (!reportData.recentAdditions && !reportData.recentBorrows && !reportData.recentReturns)) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">New Items Added</p>
            <p className="text-3xl font-bold text-blue-900">{reportData.recentAdditions?.count || 0}</p>
            <p className="text-xs text-blue-500 mt-1">{reportData.period}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-600">Borrows</p>
            <p className="text-3xl font-bold text-yellow-900">{reportData.recentBorrows?.count || 0}</p>
            <p className="text-xs text-yellow-500 mt-1">{reportData.period}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600">Returns</p>
            <p className="text-3xl font-bold text-green-900">{reportData.recentReturns?.count || 0}</p>
            <p className="text-xs text-green-500 mt-1">{reportData.period}</p>
          </div>
        </div>

        {/* Recent Additions */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Inventory Additions</h3>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PC Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.recentAdditions?.items?.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.pcType}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Borrows */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Borrows</h3>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Borrower</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.recentBorrows?.items?.slice(0, 10).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{record.inventory?.pcName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{record.borrowerName}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${record.status === 'Borrowed' ? 'badge-warning' : 'badge-success'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(record.borrowDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    switch (activeReport) {
      case 'inventory':
        return renderInventoryReport();
      case 'borrow':
        return renderBorrowReport();
      case 'department':
        return renderDepartmentReport();
      case 'activity':
        return renderActivityReport();
      default:
        return renderInventoryReport();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and export inventory reports
          </p>
        </div>
        {(activeReport === 'inventory' || activeReport === 'borrow') && (
          <button onClick={handleExport} className="btn btn-primary mt-4 sm:mt-0">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export CSV
          </button>
        )}
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                  activeReport === report.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <report.icon className="h-5 w-5 mr-2" />
                {report.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Report Content */}
        <div className="p-6">
          {loading ? (
            <Loading text="Generating report..." />
          ) : (
            renderReportContent()
          )}
        </div>
      </div>
    </div>
  );
}
