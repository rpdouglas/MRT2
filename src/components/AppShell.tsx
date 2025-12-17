import { useState } from 'react'; // Added useState
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  BookOpenIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon, // Hamburger Icon
  XMarkIcon  // Close Icon
} from '@heroicons/react/24/outline';

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for Mobile Menu (Open/Closed)
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            
            {/* LEFT: Logo & Desktop Nav */}
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  MRT
                </span>
              </div>
              
              {/* Desktop Links (Hidden on Mobile) */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-all ${
                        isActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <item.icon className={`mr-2 h-4 w-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: User & Logout (Desktop) */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
              <span className="text-sm text-gray-500">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-white p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>

            {/* MOBILE: Hamburger Button */}
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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

        {/* --- MOBILE MENU (Conditional Render) --- */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => {
                 const isActive = location.pathname.startsWith(item.href);
                 return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                    className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
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
            <div className="border-t border-gray-200 pb-3 pt-4">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-10 w-10 text-gray-300" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.displayName || 'User'}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}