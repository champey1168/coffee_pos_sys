import React from 'react';
import { useAuth } from '../context/useAuth';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Title/Greeting */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">
          Welcome back, <span className="text-slate-900">{user?.full_name || user?.username}</span>
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700 text-sm font-medium">
          <UserIcon size={16} className="text-slate-500" />
          <span>{user?.roles?.[0] || 'Staff'}</span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}