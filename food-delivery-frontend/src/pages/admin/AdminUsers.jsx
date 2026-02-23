import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [pageSize, setPageSize] = useState(10);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [headerClicked, setHeaderClicked] = useState(false);

  useEffect(() => {
    setLoading(true);
    loadUsers();
  }, [page, pageSize]);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers(page, pageSize);
      setUsers(response.data || response || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalRows(
        typeof response.pagination?.total_rows === 'number'
          ? response.pagination.total_rows
          : (response.data || response || []).length
      );
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

  const startEntry = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = totalRows === 0 ? 0 : Math.min(page * pageSize, totalRows);

  const pagesToShow = Array.from(
    new Set([page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages))
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/admin" className="text-sm font-semibold text-[#db2777] hover:underline">
          Home
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800"
            aria-label="Per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-none shadow-md overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={headerClicked ? 'bg-blue-100' : 'bg-blue-50'}>
            <tr>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-semibold uppercase cursor-pointer select-none ${headerClicked ? 'text-blue-900' : 'text-blue-700'}`}>ID</th>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-semibold uppercase cursor-pointer select-none ${headerClicked ? 'text-blue-900' : 'text-blue-700'}`}>Name</th>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-semibold uppercase cursor-pointer select-none ${headerClicked ? 'text-blue-900' : 'text-blue-700'}`}>Phone</th>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-semibold uppercase cursor-pointer select-none ${headerClicked ? 'text-blue-900' : 'text-blue-700'}`}>Role</th>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-semibold uppercase cursor-pointer select-none ${headerClicked ? 'text-blue-900' : 'text-blue-700'}`}>Status</th>
              <th onClick={() => setHeaderClicked(true)} className={`px-6 py-3 text-left text-xs font-semibold uppercase cursor-pointer select-none ${headerClicked ? 'text-blue-900' : 'text-blue-700'}`}>Actions</th>
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

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Showing <span className="font-semibold">{startEntry}</span> to{' '}
          <span className="font-semibold">{endEntry}</span> of{' '}
          <span className="font-semibold">{totalRows}</span> entries
        </p>

        <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {pagesToShow.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={
                p === page
                  ? 'min-w-10 px-4 py-2 text-sm font-semibold bg-[#db2777] text-white'
                  : 'min-w-10 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border-l border-gray-200'
              }
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-200"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;