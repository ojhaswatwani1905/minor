import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Radio, 
  AlertTriangle, 
  Bell, 
  FileText, 
  BarChart3, 
  Settings, 
  User, 
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  QrCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'App QR Code', path: '/app-qr', icon: QrCode },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Trips', path: '/trips', icon: MapPin },
  { name: 'Live Monitoring', path: '/monitoring', icon: Radio },
  { name: 'Emergency Alerts', path: '/emergency', icon: AlertTriangle, badge: 'SOS' },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Profile', path: '/profile', icon: User },
];

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-30 h-screen transition-all duration-300 ease-out border-r border-slate-200 dark:border-[#38383A] apple-glass flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Brand */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-[#38383A]/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#32ADE6] flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  STSMS
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold -mt-0.5">
                  Safety Command
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-medium text-xs transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-[#007AFF] text-white font-bold shadow-md shadow-blue-500/25'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-[#007AFF]'
                    }`} />
                    
                    {!collapsed && <span className="truncate">{item.name}</span>}

                    {/* SOS Alert Badge */}
                    {item.badge && !collapsed && (
                      <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed Tooltip */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50 whitespace-nowrap border border-slate-700">
                        {item.name}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Logout Button */}
      <div className="p-3 border-t border-slate-200/80 dark:border-[#38383A]/80">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-medium text-xs text-red-500 hover:bg-red-500/10 transition-colors group relative"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
          {!collapsed && <span>Logout Session</span>}

          {collapsed && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50 whitespace-nowrap">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
