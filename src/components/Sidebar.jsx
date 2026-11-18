import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home,
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
  ChevronLeft,
  ChevronRight,
  QrCode,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigationItems = [
  { name: 'DASHBOARD', path: '/dashboard', icon: Home },
  { name: 'EMERGENCY SOS', path: '/emergency', icon: AlertTriangle, badge: 'SOS' },
  { name: 'SAFE TRAVEL ZONES', path: '/safe-zones', icon: Compass },
  { name: 'LIVE MONITORING', path: '/monitoring', icon: Radio },
  { name: 'USERS & SAFETY', path: '/users', icon: Users },
  { name: 'MOBILE APP QR', path: '/app-qr', icon: QrCode },
  { name: 'SETTINGS', path: '/settings', icon: Settings },
];

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-30 h-screen transition-all duration-300 ease-out bg-[#25433E] text-white flex flex-col justify-between shadow-2xl select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Top Profile Card (Reference Signature Style) */}
        <div className="pt-7 pb-5 px-5 flex flex-col items-center text-center border-b border-white/10 relative">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-4 right-3 p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Golden Ring Avatar */}
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-honey via-[#E5A93C] to-[#F3C878] shadow-lg">
              <img
                src={admin?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-2 border-[#25433E]"
              />
            </div>
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#25433E]" />
          </div>

          {!collapsed && (
            <div className="space-y-0.5">
              <h2 className="text-sm font-extrabold tracking-wide text-white uppercase font-sans">
                {admin?.name || "ALEX JOHNSON"}
              </h2>
              <p className="text-[11px] text-white/60 font-sans truncate max-w-[200px]">
                {admin?.email || "alex.johnson@gmail.com"}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Items (White Pill Active State with Gold Icon) */}
        <nav className="p-3.5 space-y-1.5 overflow-y-auto max-h-[calc(100vh-340px)]">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-bold tracking-wider transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-white text-[#25433E] shadow-xl font-extrabold'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isActive ? 'text-[#E5A93C]' : 'text-honey/80 group-hover:text-honey'
                    }`} />

                    {!collapsed && <span className="truncate">{item.name}</span>}

                    {/* SOS Alert Badge */}
                    {item.badge && !collapsed && (
                      <span className={`ml-auto text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-[#E5A93C] text-white' : 'bg-red-500 text-white animate-pulse'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {collapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1E3732] text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl z-50 whitespace-nowrap border border-white/15">
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

      {/* Bottom Active Users & Route Network Graphic */}
      <div className="p-4 border-t border-white/10 space-y-3 bg-[#1F3934]/60">
        {!collapsed && (
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-honey/90 uppercase block mb-2 font-sans">
              ACTIVE USERS
            </span>

            {/* Overlapping Avatar Stack with +70 Honey Badge */}
            <div className="flex items-center -space-x-2 pt-0.5">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
                alt="User"
                className="w-8 h-8 rounded-full border-2 border-[#25433E] object-cover shrink-0"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
                alt="User"
                className="w-8 h-8 rounded-full border-2 border-[#25433E] object-cover shrink-0"
              />
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"
                alt="User"
                className="w-8 h-8 rounded-full border-2 border-[#25433E] object-cover shrink-0"
              />
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                alt="User"
                className="w-8 h-8 rounded-full border-2 border-[#25433E] object-cover shrink-0"
              />
              <div 
                style={{ backgroundColor: '#E5A93C' }}
                className="w-8 h-8 rounded-full text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-[#25433E] shadow-sm shrink-0 z-10"
              >
                +70
              </div>
            </div>

            {/* Route Network Dotted Map & Golden Arc Paths SVG */}
            <div className="mt-3 w-full h-12 relative flex items-center justify-center opacity-85">
              <svg viewBox="0 0 160 50" className="w-full h-full text-white/30">
                <g fill="currentColor" opacity="0.35">
                  <circle cx="20" cy="15" r="1.5" />
                  <circle cx="30" cy="18" r="1.5" />
                  <circle cx="45" cy="12" r="1.5" />
                  <circle cx="60" cy="22" r="1.5" />
                  <circle cx="75" cy="16" r="1.5" />
                  <circle cx="90" cy="28" r="1.5" />
                  <circle cx="105" cy="18" r="1.5" />
                  <circle cx="120" cy="24" r="1.5" />
                  <circle cx="135" cy="20" r="1.5" />
                  <circle cx="35" cy="30" r="1.5" />
                  <circle cx="50" cy="35" r="1.5" />
                  <circle cx="70" cy="38" r="1.5" />
                  <circle cx="85" cy="40" r="1.5" />
                  <circle cx="100" cy="34" r="1.5" />
                  <circle cx="115" cy="38" r="1.5" />
                  <circle cx="130" cy="32" r="1.5" />
                </g>
                <path d="M 25 25 Q 55 5, 85 28" fill="none" stroke="#E5A93C" strokeWidth="1.5" strokeDasharray="3, 3" />
                <path d="M 85 28 Q 115 10, 135 25" fill="none" stroke="#E5A93C" strokeWidth="1.5" />
                <path d="M 45 35 Q 75 48, 115 35" fill="none" stroke="#E5A93C" strokeWidth="1.2" strokeDasharray="2, 2" />
                <circle cx="25" cy="25" r="2.5" fill="#E5A93C" />
                <circle cx="85" cy="28" r="3" fill="#E5A93C" />
                <circle cx="135" cy="25" r="2.5" fill="#E5A93C" />
              </svg>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          {!collapsed && <span>LOGOUT</span>}
        </button>
      </div>
    </aside>
  );
};
