import React, { useState, useEffect } from 'react';
import { tripService } from '../services/tripService';
import { userService } from '../services/userService';
import { TripSearchFilter } from '../components/Trips/TripSearchFilter';
import { TripTable } from '../components/Trips/TripTable';
import { TripFormModal } from '../components/Trips/TripFormModal';
import { TripDetailModal } from '../components/Trips/TripDetailModal';
import { Pagination } from '../components/Common/Pagination';
import { Loader } from '../components/Common/Loader';
import { Modal } from '../components/Common/Modal';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

export const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [tourists, setTourists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [geofenceFilter, setGeofenceFilter] = useState('All');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [selectedTripDetail, setSelectedTripDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchTripsData = async (isInitial = false) => {
    try {
      if (isInitial && trips.length === 0) {
        setLoading(true);
      }
      const [tripsRes, usersRes] = await Promise.all([
        tripService.getTrips({
          search,
          status: statusFilter,
          geofence: geofenceFilter
        }),
        userService.getUsers()
      ]);

      if (tripsRes.success && Array.isArray(tripsRes.trips)) setTrips(tripsRes.trips);
      if (usersRes.success && Array.isArray(usersRes.users)) setTourists(usersRes.users);
    } catch (err) {
      if (isInitial) toast.error(err.message || 'Failed to fetch expedition list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsData(true);
    const interval = setInterval(() => fetchTripsData(false), 6000);
    return () => clearInterval(interval);
  }, [search, statusFilter, geofenceFilter]);


  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingTrip) {
        const res = await tripService.updateTrip(editingTrip.id, formData);
        if (res.success) {
          toast.success('Trip settings updated!');
          setIsFormOpen(false);
          setEditingTrip(null);
          fetchTripsData();
        }
      } else {
        const res = await tripService.createTrip(formData);
        if (res.success) {
          toast.success('Expedition trip configured!');
          setIsFormOpen(false);
          fetchTripsData();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await tripService.getTripById(id);
      if (res.success) {
        setSelectedTripDetail(res.trip);
        setIsDetailOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load trip timeline details');
    }
  };

  const handleAddCheckpoint = async (id, checkpointData) => {
    try {
      const res = await tripService.addCheckpoint(id, checkpointData);
      if (res.success) {
        toast.success('Checkpoint added to timeline!');
        handleOpenDetail(id); // Reload modal detail
        fetchTripsData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add checkpoint');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    const targetId = deletingId;
    setTrips(prev => prev.filter(t => t.id !== targetId));
    setDeletingId(null);
    try {
      const res = await tripService.deleteTrip(targetId);
      if (res.success) {
        toast.success(res.message);
        fetchTripsData(false);
      }
    } catch (err) {
      toast.error(err.message || 'Delete operation failed');
      fetchTripsData(false);
    }
  };

  // Pagination logic
  const totalItems = trips.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentTrips = trips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#192E2A] flex items-center gap-2.5 font-sans">
            Tourist Expedition & Route Command
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-pine/10 text-pine border border-pine/20 font-extrabold">
              {trips.length} Registered Trips
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Configure expedition routes, boundary safety radius, checkpoints, and monitor arrival schedules
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <TripSearchFilter
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        geofenceFilter={geofenceFilter}
        setGeofenceFilter={setGeofenceFilter}
        onCreateTrip={() => {
          setEditingTrip(null);
          setIsFormOpen(true);
        }}
        onRefresh={() => fetchTripsData(false)}
      />

      {/* Table Data */}
      {loading ? (
        <Loader message="Fetching Expedition Routes & Checkpoints..." />
      ) : (
        <>
          <TripTable
            trips={currentTrips}
            onView={handleOpenDetail}
            onEdit={(trip) => {
              setEditingTrip(trip);
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

      {/* Form Modal (Create / Edit) */}
      <TripFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTrip(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingTrip}
        tourists={tourists}
      />

      {/* Detail Modal */}
      <TripDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        tripDetail={selectedTripDetail}
        onAddCheckpoint={handleAddCheckpoint}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Confirm Trip Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>Warning: This action will permanently remove the expedition safety route.</p>
          </div>
          <p className="text-xs text-slate-300">Are you sure you want to delete this trip record?</p>

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
              Delete Trip
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
