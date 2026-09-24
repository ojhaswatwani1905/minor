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

  const fetchUsers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await userService.getUsers({
        search,
        status: statusFilter,
        battery: batteryFilter
      });
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      if (showLoading) toast.error(err.message || 'Failed to fetch tourists list');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(true);

    // Auto-poll every 4s to catch new mobile registrations live
    const interval = setInterval(() => {
      fetchUsers(false);
    }, 4000);

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
          fetchUsers();
        }
      } else {
        const res = await userService.createUser(formData);
        if (res.success) {
          toast.success('New tourist registered!');
          setIsFormOpen(false);
          fetchUsers();
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
    try {
      const res = await userService.deleteUser(deletingId);
      if (res.success) {
        toast.success(res.message);
        setDeletingId(null);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Delete operation failed');
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
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Tourist User Registry
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {users.length} Active Profiles
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
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
        onRefresh={fetchUsers}
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

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setDeletingId(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg"
            >
              Delete Record
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
