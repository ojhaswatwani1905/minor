import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Compass, MapPin, Calendar, Shield, User } from 'lucide-react';

export const TripFormModal = ({ isOpen, onClose, onSubmit, initialData, tourists }) => {
  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    destination: '',
    route: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedArrival: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
    boundaryRadiusKm: '5.0',
    status: 'Active'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        userId: initialData.userId || '',
        userName: initialData.userName || '',
        destination: initialData.destination || '',
        route: initialData.route || '',
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        expectedArrival: initialData.expectedArrival ? initialData.expectedArrival.split('T')[0] : '',
        boundaryRadiusKm: initialData.boundaryRadiusKm || '5.0',
        status: initialData.status || 'Active'
      });
    } else {
      setFormData({
        userId: tourists?.[0]?.id || '',
        userName: tourists?.[0]?.fullName || '',
        destination: '',
        route: '',
        startDate: new Date().toISOString().split('T')[0],
        expectedArrival: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
        boundaryRadiusKm: '5.0',
        status: 'Active'
      });
    }
  }, [initialData, isOpen, tourists]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTouristChange = (e) => {
    const selected = tourists?.find(t => t.id === e.target.value);
    if (selected) {
      setFormData({
        ...formData,
        userId: selected.id,
        userName: selected.fullName
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Expedition Settings" : "Configure New Tourist Expedition"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Tourist Selection */}
        <div>
          <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
            Assign Tourist *
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
            <select
              name="userId"
              value={formData.userId}
              onChange={handleTouristChange}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-honey"
              required
            >
              {tourists?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.phone}) — {t.currentLocation?.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination & Route */}
        <div>
          <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
            Expedition Destination Name *
          </label>
          <div className="relative">
            <Compass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g. Rohtang High Expedition, Valley of Flowers"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-honey"
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
            Planned Expedition Route / Checkpoint Trail *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
            <input
              type="text"
              name="route"
              value={formData.route}
              onChange={handleChange}
              placeholder="e.g. Manali Base -> Solang -> Rohtang Pass -> Keylong"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-honey"
              required
            />
          </div>
        </div>

        {/* Start Date & Expected Arrival */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
              Expected Arrival Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
              <input
                type="date"
                name="expectedArrival"
                value={formData.expectedArrival}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Boundary Radius (Geofence) & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
              Safety Boundary Radius (Geofence Km)
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
              <select
                name="boundaryRadiusKm"
                value={formData.boundaryRadiusKm}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-white font-bold"
              >
                <option value="1.0">1.0 km Buffer</option>
                <option value="2.5">2.5 km Buffer</option>
                <option value="5.0">5.0 km Standard Buffer</option>
                <option value="10.0">10.0 km Wide Forest Buffer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
              Expedition Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-white font-bold"
            >
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Emergency">Emergency</option>
              <option value="Warning (Offline)">Warning (Offline)</option>
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-honey hover:brightness-105 text-[#25433E] font-black shadow-lg transition-all active:scale-95"
          >
            {initialData ? "Save Trip Changes" : "Initialize Expedition"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
