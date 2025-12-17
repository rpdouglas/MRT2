import { useState, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom'; 
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  BookOpenIcon, // Added for Journal
  UserCircleIcon 
} from '@heroicons/react/24/outline';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Navigation Items
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Journal', href: '/journal', icon: BookOpenIcon }, // Added Journal Link
  ];

  const isCurrent = (path: string) => location.pathname === path;

  return (
    // "Unified Blue" Background
    <div className="flex flex-col min-h-screen bg-blue-50">
      
      {/* Top Navigation Bar - Blue-700 */}
      <nav className="bg-blue-700 shadow-lg shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Logo Section */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <span className="text-white font-bold text-lg tracking-tight">
                  My Recovery Toolkit
                </span>
              </Link>
              
              {/* Desktop Nav Links */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                        isCurrent(item.href)
                          ? 'bg-blue-800 text-white'
                          : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Profile Menu */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <span className="text-blue-100 mr-4 text-sm font-medium">
                  {user?.displayName}
                </span>
                
                <Link 
                  to="/profile"
                  className="rounded-full bg-blue-800 p-1 text-blue-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 mr-3"
                  title="Profile Settings"
                >
                   <UserCircleIcon className="h-6 w-6" />
                </Link>

                <button
                  onClick={logout}
                  className="rounded-md bg-blue-800 px-3 py-1 text-xs text-blue-100 hover:bg-blue-600 hover:text-white border border-blue-600"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md bg-blue-800 p-2 text-blue-200 hover:bg-blue-600 hover:text-white focus:outline-none"
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

        {/* Mobile Menu (Dropdown) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-blue-600 bg-blue-800">
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    isCurrent(item.href)
                      ? 'bg-blue-900 text-white'
                      : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              ))}
              
              <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-blue-100 hover:bg-blue-600 hover:text-white"
                >
                  <div className="flex items-center">
                    <UserCircleIcon className="h-5 w-5 mr-3" />
                    Profile Settings
                  </div>
              </Link>

              <div className="pt-2 border-t border-blue-600 mt-2">
                 <button
                    onClick={logout}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-red-200 hover:text-white hover:bg-red-600 rounded-md"
                  >
                    Sign Out
                 </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content - Renders the child (Dashboard OR Profile OR Journal) here */}
      <main className="flex-grow">
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}