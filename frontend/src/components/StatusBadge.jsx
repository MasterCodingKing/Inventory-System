export function getStatusBadgeClass(status) {
  const statusClasses = {
    'Active User': 'badge-success',
    'Available': 'badge-info',
    'Transfer': 'badge-warning',
    'For Upgrade': 'badge-warning',
    'Maintenance': 'badge-danger',
    'Retired': 'badge-secondary',
    'Borrowed': 'badge-warning',
    'Returned': 'badge-success',
    'Overdue': 'badge-danger',
    'Extended': 'badge-info',
  };
  
  return statusClasses[status] || 'badge-secondary';
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${getStatusBadgeClass(status)}`}>
      {status}
    </span>
  );
}
