import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  BookOpenIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Journal', href: '/journal', icon: BookOpenIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* --- TOP NAVIGATION BAR (Unified Blue) --- */}
      <nav className="bg-blue-600 shadow-lg sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            
            {/* LEFT: Logo & Desktop Nav */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-xl font-bold text-white tracking-wide">
                  My Recovery Toolkit
                </span>
              </div>
              
              {/* Desktop Links */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {navigation.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-700 text-white shadow-sm'
                          : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                      }`}
                    >
                      <item.icon className={`mr-2 h-4 w-4 ${isActive ? 'text-white' : 'text-blue-200'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: User & Logout (Desktop) */}
            <div className="hidden sm:flex sm:items-center gap-4">
              <span className="text-sm text-blue-100 font-medium">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-blue-700 p-2 text-blue-100 hover:bg-blue-800 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>

            {/* MOBILE: Hamburger Button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-blue-100 hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- MOBILE MENU (Blue Theme) --- */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-blue-600 border-t border-blue-500 shadow-xl">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => {
                 const isActive = location.pathname.startsWith(item.href);
                 return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-md px-3 py-2 text-base font-medium ${
                      isActive
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile User Section */}
            <div className="border-t border-blue-500 pb-4 pt-4">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-10 w-10 text-blue-200" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user?.displayName || 'User'}</div>
                  <div className="text-sm font-medium text-blue-200">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-blue-100 hover:bg-blue-500 hover:text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}