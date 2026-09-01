import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [pageSize, setPageSize] = useState(10);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [headerClicked, setHeaderClicked] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [openActionMenuFor, setOpenActionMenuFor] = useState(null);

  useEffect(() => {
    setLoading(true);
    loadUsers();
  }, [page, pageSize, roleFilter, activeFilter]);

  useEffect(() => {
    if (!openActionMenuFor) return;

    const onDocClick = () => setOpenActionMenuFor(null);
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [openActionMenuFor]);
  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers({
        page,
        limit: pageSize,
        role: roleFilter || undefined,
        is_active: activeFilter || undefined,
      });
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

  const openUserDetails = async (userId) => {
    setSelectedUser({ id: userId });
    setDetailLoading(true);
    try {
      const response = await adminAPI.getUser(userId);
      setSelectedUser(response.data || response);
    } catch (error) {
      setSelectedUser(null);
      toast.error(error?.error || 'Failed to load user details');
    } finally {
      setDetailLoading(false);
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
        <Link to="/admin" className="text-sm font-semibold text-pink-600 dark:text-pink-300 hover:underline">
          Home
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Role</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setPage(1);
                setRoleFilter(e.target.value);
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800"
              aria-label="Role filter"
            >
              <option value="">All</option>
              <option value="student">Student</option>
              <option value="vendor">Vendor</option>
              <option value="rider">Rider</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Status</span>
            <select
              value={activeFilter}
              onChange={(e) => {
                setPage(1);
                setActiveFilter(e.target.value);
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800"
              aria-label="Active status filter"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

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
                  <div className="relative inline-flex">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionMenuFor((curr) => (curr === user.id ? null : user.id));
                      }}
                      aria-label="User actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>

                    {openActionMenuFor === user.id && (
                      <div
                        className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenuFor(null);
                            openUserDetails(user.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                        >
                          Show detail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenuFor(null);
                            handleToggleStatus(user.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                        >
                          {user.is_active ? 'Inactive' : 'Active'}
                        </button>
                      </div>
                    )}
                  </div>
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
                  ? 'min-w-10 px-4 py-2 text-sm font-semibold bg-pink-600 dark:bg-pink-500/80 text-white'
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

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                <p className="text-sm text-gray-600">ID: {selectedUser.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              {detailLoading ? (
                <div className="py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium text-gray-900">{selectedUser.role}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedUser.email || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedUser.phone || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={selectedUser.is_active ? 'font-medium text-green-700' : 'font-medium text-red-700'}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium text-gray-900">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;