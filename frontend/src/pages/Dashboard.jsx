import { useEffect, useState } from 'react';
import {
  ComputerDesktopIcon,
  DeviceTabletIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import reportService from '../services/reportService';
import Loading from '../components/Loading';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await reportService.getDashboard();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  const stats = [
    { 
      name: 'Total Assets', 
      value: data?.inventory?.total || 0, 
      icon: ComputerDesktopIcon,
      color: 'bg-blue-500',
      description: 'All inventory items'
    },
    { 
      name: 'Active Users', 
      value: data?.inventory?.active || 0, 
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      description: 'Currently in use'
    },
    { 
      name: 'Available', 
      value: data?.inventory?.available || 0, 
      icon: DeviceTabletIcon,
      color: 'bg-indigo-500',
      description: 'Ready for assignment'
    },
    { 
      name: 'Borrowed', 
      value: data?.borrows?.active || 0, 
      icon: ArrowTrendingUpIcon,
      color: 'bg-yellow-500',
      description: 'Currently borrowed'
    },
    { 
      name: 'Overdue', 
      value: data?.borrows?.overdue || 0, 
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      description: 'Past return date'
    },
    { 
      name: 'Due This Week', 
      value: data?.borrows?.upcomingReturns || 0, 
      icon: ClockIcon,
      color: 'bg-purple-500',
      description: 'Returns in 7 days'
    },
  ];

  const pcTypeData = [
    { name: 'Laptops', value: data?.pcTypes?.laptops || 0 },
    { name: 'Desktops', value: data?.pcTypes?.desktops || 0 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your IT inventory as of {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6 hover:shadow-md transition-shadow"
          >
            <dt>
              <div className={`absolute rounded-md ${stat.color} p-3`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </dd>
            <p className="mt-1 ml-16 text-xs text-gray-400">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PC Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">PC Type Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pcTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pcTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">Laptops: {data?.pcTypes?.laptops || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600">Desktops: {data?.pcTypes?.desktops || 0}</span>
            </div>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Summary</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Active', value: data?.inventory?.active || 0 },
                  { name: 'Available', value: data?.inventory?.available || 0 },
                  { name: 'Maintenance', value: data?.inventory?.maintenance || 0 },
                  { name: 'Transfer', value: data?.inventory?.transfer || 0 },
                  { name: 'Borrowed', value: data?.inventory?.borrowed || 0 },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Borrow Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Borrower
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.recentActivity?.length > 0 ? (
                data.recentActivity.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.inventory?.pcName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.borrowerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        record.status === 'Borrowed' ? 'badge-warning' :
                        record.status === 'Returned' ? 'badge-success' :
                        record.status === 'Overdue' ? 'badge-danger' : 'badge-info'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.borrowDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No recent activity
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
