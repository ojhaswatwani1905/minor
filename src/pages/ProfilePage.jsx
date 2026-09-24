import React, { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Clock, CheckCircle2 } from 'lucide-react';
import { Loader } from '../components/Common/Loader';
import { toast } from 'react-toastify';

export const ProfilePage = () => {
  const { admin, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile state
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await profileService.getProfile();
      if (res.success) {
        setProfile(res.admin);
        setName(res.admin.name || '');
        setDepartment(res.admin.department || '');
        setActivityLogs(res.activityLogs || []);
      }
    } catch (err) {
      toast.error('Failed to load admin profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      const res = await profileService.updateProfile({ name, department });
      if (res.success) {
        toast.success('Admin profile updated!');
        fetchProfileData();
      }
    } catch (err) {
      toast.error(err.message || 'Profile update failed');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    try {
      setChangingPass(true);
      const res = await profileService.changePassword({ currentPassword, newPassword });
      if (res.success) {
        toast.success(res.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.message || 'Password change failed');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return <Loader message="Loading Admin Profile & Security Logs..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Admin Profile & Security
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your administrator account credentials, department assignment, and access audit history
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Avatar Header Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-5 shadow-xl">
            <img
              src={profile?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
              alt="Admin Avatar"
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-cyan-500/30"
            />
            <div>
              <h3 className="text-xl font-extrabold text-white">{profile?.name}</h3>
              <p className="text-xs text-cyan-400 font-bold mt-0.5">{profile?.role}</p>
              <p className="text-xs text-slate-400 mt-1">{profile?.department} • {profile?.email}</p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold mt-2">
                <CheckCircle2 className="w-3 h-3" />
                Active Authenticated Session
              </span>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Edit Account Information
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Official Email (Read Only)
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20"
                >
                  {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Security & Password Updates
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg"
                >
                  {changingPass ? 'Updating Password...' : 'Update Security Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Activity Logs Audit Trail */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Admin Audit Activity Trail
            </h3>

            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs space-y-1">
                  <p className="font-semibold text-slate-200">{log.action}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>IP: {log.ip}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
