import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { User, Phone, Mail, Shield, MapPin, FileText } from 'lucide-react';

export const UserFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Family',
    documentType: 'Aadhaar Card',
    documentNumber: '',
    locationName: '',
    lat: '',
    lng: '',
    batteryLevel: '',
    status: 'Online'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        emergencyContact: initialData.emergencyContact || '',
        guardianName: initialData.guardians?.[0]?.name || '',
        guardianPhone: initialData.guardians?.[0]?.phone || '',
        guardianRelation: initialData.guardians?.[0]?.relation || 'Family',
        documentType: initialData.documents?.[0]?.type || 'Aadhaar Card',
        documentNumber: initialData.documents?.[0]?.number || '',
        locationName: initialData.currentLocation?.name || '',
        lat: initialData.currentLocation?.lat != null ? String(initialData.currentLocation.lat) : '',
        lng: initialData.currentLocation?.lng != null ? String(initialData.currentLocation.lng) : '',
        batteryLevel: initialData.batteryLevel != null ? String(initialData.batteryLevel) : '',
        status: initialData.status || 'Online'
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        emergencyContact: '',
        guardianName: '',
        guardianPhone: '',
        guardianRelation: 'Family',
        documentType: 'Aadhaar Card',
        documentNumber: '',
        locationName: '',
        lat: '',
        lng: '',
        batteryLevel: '',
        status: 'Online'
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Tourist Profile" : "Register New Tourist"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
              Tourist Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Rohan Sharma"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-honey"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="rohan@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-honey"
              />
            </div>
          </div>
        </div>

        {/* Phone & Emergency Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
              Mobile Phone *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-honey"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
              Emergency Contact Phone
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="+91 98765 00001"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-honey"
              />
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-3">
          <p className="text-xs font-bold text-honey uppercase tracking-wider">Guardian Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Guardian Name</label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
                placeholder="Rajesh Sharma"
                className="w-full px-3 py-2 rounded-xl bg-[#25433E] border border-white/15 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Relation</label>
              <select
                name="guardianRelation"
                value={formData.guardianRelation}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-[#25433E] border border-white/15 text-xs text-white"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Guardian Phone</label>
              <input
                type="text"
                name="guardianPhone"
                value={formData.guardianPhone}
                onChange={handleChange}
                placeholder="+91 98765 00001"
                className="w-full px-3 py-2 rounded-xl bg-[#25433E] border border-white/15 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Identity Document & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
              Identity Document Type
            </label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-xs text-white"
            >
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
              Document Number
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
              <input
                type="text"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                placeholder="XXXX-XXXX-4921"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-xs text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
            Current Location Name (Optional)
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-honey" />
            <input
              type="text"
              name="locationName"
              value={formData.locationName}
              onChange={handleChange}
              placeholder="e.g. Guna Base Camp, MP (or leave empty for mobile GPS)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1E3732] border border-white/10 text-xs text-white"
            />
          </div>
        </div>

        {/* Real Coordinates & Battery */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
              Latitude (Real GNSS)
            </label>
            <input
              type="number"
              step="any"
              name="lat"
              value={formData.lat}
              onChange={handleChange}
              placeholder="e.g. 24.6467"
              className="w-full px-3 py-2 rounded-xl bg-[#1E3732] border border-white/10 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
              Longitude (Real GNSS)
            </label>
            <input
              type="number"
              step="any"
              name="lng"
              value={formData.lng}
              onChange={handleChange}
              placeholder="e.g. 77.3117"
              className="w-full px-3 py-2 rounded-xl bg-[#1E3732] border border-white/10 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
              Battery Level (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              name="batteryLevel"
              value={formData.batteryLevel}
              onChange={handleChange}
              placeholder="e.g. 85"
              className="w-full px-3 py-2 rounded-xl bg-[#1E3732] border border-white/10 text-xs text-white font-mono"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-honey hover:brightness-105 text-[#25433E] text-xs font-black shadow-lg transition-all active:scale-95"
          >
            {initialData ? "Save Profile Changes" : "Complete Registration"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
