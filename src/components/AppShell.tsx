import { useState, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom'; 
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  UserCircleIcon 
} from '@heroicons/react/24/outline';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // 1. STRIPPED NAVIGATION: Only Dashboard remains
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
  ];

  const isCurrent = (path: string) => location.pathname === path;

  return (
    // FORCE VERTICAL LAYOUT: This ensures Nav is always on top
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* Top Navigation Bar */}
      <nav className="bg-serene-teal shadow-lg shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-white font-bold text-lg tracking-tight">
                  MRT
                </span>
              </div>
              
              {/* Desktop Nav Links */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center ${
                        isCurrent(item.href)
                          ? 'bg-teal-800 text-white'
                          : 'text-teal-100 hover:bg-teal-700 hover:text-white'
                      }`}
                    >
                      {/* 2. TINY ICONS: Reduced to h-4 w-4 */}
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* User Profile (Desktop) */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <span className="text-teal-100 mr-4 text-xs font-medium">
                  {user?.displayName}
                </span>
                
                {/* Profile Link */}
                <Link 
                  to="/profile"
                  className="rounded-full bg-teal-800 p-1 text-teal-200 hover:text-white focus:outline-none mr-2"
                  title="Profile Settings"
                >
                   {/* TINY ICON */}
                   <UserCircleIcon className="h-5 w-5" />
                </Link>

                <button
                  onClick={logout}
                  className="ml-2 rounded-md bg-teal-800 px-3 py-1 text-xs text-teal-100 hover:bg-teal-700 hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md bg-teal-800 p-2 text-teal-200 hover:bg-teal-700 hover:text-white focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-5 w-5" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu (Dropdown) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-teal-700">
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium ${
                    isCurrent(item.href)
                      ? 'bg-teal-900 text-white'
                      : 'text-teal-100 hover:bg-teal-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </div>
                </Link>
              ))}
              
              <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-700 hover:text-white"
                >
                  <div className="flex items-center">
                    <UserCircleIcon className="h-4 w-4 mr-3" />
                    Profile
                  </div>
              </Link>

              <div className="pt-2 border-t border-teal-800 mt-2">
                 <button
                    onClick={logout}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-red-300 hover:text-white"
                  >
                    Sign Out
                 </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area - Forces child content to sit BELOW nav */}
      <main className="flex-grow">
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}