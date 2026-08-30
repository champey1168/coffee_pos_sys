import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Coffee,
  FolderTree,
  History,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function Sidebar() {
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  // 1. បញ្ជី Menu ទាំងអស់ជាមួយនឹង Role ដែលអនុញ្ញាត
  const allMenuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Manager', 'Cashier'],
    },
    {
      path: '/pos',
      label: 'POS Terminal',
      icon: ShoppingCart,
      roles: ['Admin', 'Manager', 'Cashier'],
    },
    {
      path: '/orders',
      label: 'Order History',
      icon: History,
      roles: ['Admin', 'Manager', 'Cashier'],
    },
    {
      path: '/products',
      label: 'Products',
      icon: Coffee,
      roles: ['Admin', 'Manager'],
    },
    {
      path: '/categories',
      label: 'Categories',
      icon: FolderTree,
      roles: ['Admin', 'Manager'],
    },
    {
      path: '/users',
      label: 'Users',
      icon: Users,
      roles: ['Admin'],
    },
  ];

  // 2. Filter យកតែ Menu ណាដែលត្រូវនឹង Role របស់ User ដែលកំពុង Login
  const filteredMenu = allMenuItems.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between shrink-0">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
          <div className="p-2 bg-amber-600 rounded-xl text-white">
            <Coffee size={24} />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">POS System</span>
        </div>

        {/* Dynamic Nav Links តាម Role */}
        <nav className="space-y-1.5">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                    isActive
                      ? 'bg-amber-600 text-white font-semibold shadow-md'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
        <p className="text-xs text-slate-400">Logged in as</p>
        <p className="text-sm font-semibold text-white truncate">
          {user?.full_name || user?.username || 'User'}
        </p>
        <p className="text-xs text-amber-500 font-medium">
          Role: {userRoles.join(', ')}
        </p>
      </div>
    </aside>
  );
}