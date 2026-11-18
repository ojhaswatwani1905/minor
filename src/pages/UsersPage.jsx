import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { UserSearchFilter } from '../components/Users/UserSearchFilter';
import { UserTable } from '../components/Users/UserTable';
import { UserFormModal } from '../components/Users/UserFormModal';
import { UserDetailModal } from '../components/Users/UserDetailModal';
import { Pagination } from '../components/Common/Pagination';
import { Loader } from '../components/Common/Loader';
import { Modal } from '../components/Common/Modal';
import { Users, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [batteryFilter, setBatteryFilter] = useState('All');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = async (isInitial = false) => {
    try {
      if (isInitial && users.length === 0) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const res = await userService.getUsers({
        search,
        status: statusFilter,
        battery: batteryFilter
      });
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
      }
    } catch (err) {
      if (isInitial) toast.error(err.message || 'Failed to fetch tourists list');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers(true);

    // Auto-poll quietly in background without flashing loaders
    const interval = setInterval(() => {
      fetchUsers(false);
    }, 6000);

    return () => clearInterval(interval);
  }, [search, statusFilter, batteryFilter]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingUser) {
        const res = await userService.updateUser(editingUser.id, formData);
        if (res.success) {
          toast.success('Tourist profile updated!');
          setIsFormOpen(false);
          setEditingUser(null);
          fetchUsers(false);
        }
      } else {
        const res = await userService.createUser(formData);
        if (res.success) {
          toast.success('New tourist registered!');
          setIsFormOpen(false);
          fetchUsers(false);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await userService.getUserById(id);
      if (res.success) {
        setSelectedUserDetail(res.user);
        setIsDetailOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load tourist details');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    const targetId = deletingId;
    // Optimistically remove from state immediately
    setUsers(prev => prev.filter(u => u.id !== targetId));
    setDeletingId(null);

    try {
      const res = await userService.deleteUser(targetId);
      if (res.success) {
        toast.success(res.message);
        fetchUsers(false);
      }
    } catch (err) {
      toast.error(err.message || 'Delete operation failed');
      fetchUsers(false);
    }
  };

  // Pagination logic
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#192E2A] flex items-center gap-2.5 font-sans">
            Tourist User Registry
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-pine/10 text-pine border border-pine/20 font-extrabold">
              {users.length} Active Profiles
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Search, filter, and monitor traveler telemetry, guardians, & safety checkposts
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <UserSearchFilter
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        batteryFilter={batteryFilter}
        setBatteryFilter={setBatteryFilter}
        onAddUser={() => {
          setEditingUser(null);
          setIsFormOpen(true);
        }}
        onRefresh={() => fetchUsers(false)}
      />

      {/* Table Data */}
      {loading ? (
        <Loader message="Fetching Tourist Directory..." />
      ) : (
        <>
          <UserTable
            users={currentUsers}
            onView={handleOpenDetail}
            onEdit={(user) => {
              setEditingUser(user);
              setIsFormOpen(true);
            }}
            onDelete={(id) => setDeletingId(id)}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </>
      )}

      {/* Form Modal (Add / Edit) */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingUser}
      />

      {/* Detail Modal */}
      <UserDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        userDetail={selectedUserDetail}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Confirm Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>Warning: This action will permanently remove the tourist from active safety monitoring.</p>
          </div>
          <p className="text-xs text-slate-300">Are you sure you want to delete this tourist record?</p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              onClick={() => setDeletingId(null)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
            >
              Delete Record
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
