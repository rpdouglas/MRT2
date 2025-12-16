import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  BookOpenIcon, 
  SparklesIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '#', icon: HomeIcon, current: true },
    { name: 'Big Book', href: '#', icon: BookOpenIcon, current: false },
    { name: 'Step Work', href: '#', icon: SparklesIcon, current: false },
    { name: 'Meetings', href: '#', icon: ChatBubbleLeftRightIcon, current: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-serene-teal shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-white font-bold text-xl tracking-tight">
                  My Recovery Toolkit
                </span>
              </div>
              {/* Desktop Nav Links */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                        item.current
                          ? 'bg-teal-800 text-white'
                          : 'text-teal-100 hover:bg-teal-700 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* User Profile (Desktop) */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <span className="text-teal-100 mr-4 text-sm font-medium">
                  {user?.displayName}
                </span>
                <button
                  onClick={logout}
                  className="rounded-full bg-teal-800 p-1 text-teal-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  title="Sign Out"
                >
                  <span className="sr-only">Sign out</span>
                  <div className="h-8 w-8 flex items-center justify-center rounded-full border-2 border-teal-200">
                    <span className="text-xs font-bold">
                        {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </span>
                  </div>
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
          <div className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    item.current
                      ? 'bg-teal-900 text-white'
                      : 'text-teal-100 hover:bg-teal-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                </a>
              ))}
              <div className="border-t border-teal-700 pt-4 pb-3">
                  <div className="flex items-center px-5">
                      <div className="ml-3">
                          <div className="text-base font-medium leading-none text-white">{user?.displayName}</div>
                          <div className="text-sm font-medium leading-none text-teal-400">{user?.email}</div>
                      </div>
                      <button
                        onClick={logout}
                        className="ml-auto flex-shrink-0 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                      >
                          Sign Out
                      </button>
                  </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}