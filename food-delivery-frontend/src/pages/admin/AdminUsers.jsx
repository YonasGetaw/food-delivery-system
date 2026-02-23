import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [headerClicked, setHeaderClicked] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers(page, 10);
      setUsers(response.data || response || []);
      setTotalPages(response.pagination?.total_pages || 1);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      toast.success('User status updated');
      loadUsers();
    } catch (error) {
      toast.error(error.error || 'Failed to update');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Management</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={headerClicked ? 'bg-blue-600' : 'bg-gray-50'}>
            <tr>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer select-none ${headerClicked ? 'text-white' : 'text-gray-500'}`}>ID</th>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer select-none ${headerClicked ? 'text-white' : 'text-gray-500'}`}>Name</th>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer select-none ${headerClicked ? 'text-white' : 'text-gray-500'}`}>Phone</th>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer select-none ${headerClicked ? 'text-white' : 'text-gray-500'}`}>Role</th>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer select-none ${headerClicked ? 'text-white' : 'text-gray-500'}`}>Status</th>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer select-none ${headerClicked ? 'text-white' : 'text-gray-500'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded bg-gray-100">{user.role}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={user.is_active ? 'text-green-600' : 'text-red-600'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleToggleStatus(user.id)}
                  >
                    {user.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </Button>
          <span className="px-4 py-2">Page {page} of {totalPages}</span>
          <Button variant="secondary" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;