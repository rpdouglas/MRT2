import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  BookOpenIcon, 
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // <--- accessing 'user' object here

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Journal', href: '/journal', icon: BookOpenIcon },
    { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Workbooks', href: '/workbooks', icon: AcademicCapIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <div className="fixed inset-0 bg-gray-900/80" />
          <div className="fixed inset-0 flex">
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1 transform flex-col bg-blue-600 transition-all">
               <div className="flex h-16 shrink-0 items-center justify-between px-6">
                  <span className="text-white font-bold text-xl">My Recovery Toolkit</span>
                  <button onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5 text-blue-200 hover:text-white">
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
               </div>
               <nav className="flex flex-1 flex-col px-6 pb-4">
                 <ul role="list" className="flex flex-1 flex-col gap-y-7">
                   <li>
                     <ul role="list" className="-mx-2 space-y-1">
                       {navigation.map((item) => (
                         <li key={item.name}>
                           <Link
                             to={item.href}
                             className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                               location.pathname === item.href
                                 ? 'bg-blue-700 text-white'
                                 : 'text-blue-200 hover:text-white hover:bg-blue-700'
                             }`}
                           >
                             <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                             {item.name}
                           </Link>
                         </li>
                       ))}
                     </ul>
                   </li>
                   
                   {/* Mobile Bottom Section: User Info + Logout */}
                   <li className="mt-auto">
                     <div className="flex flex-col gap-2">
                        {user && (
                            <div className="flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-white bg-blue-700/50">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full bg-blue-700" />
                                ) : (
                                    <UserCircleIcon className="h-8 w-8 text-blue-200" />
                                )}
                                <span className="sr-only">Your profile</span>
                                <span aria-hidden="true">{user.displayName || user.email}</span>
                            </div>
                        )}
                        <button
                          onClick={handleLogout}
                          className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-blue-200 hover:bg-blue-700 hover:text-white w-full"
                        >
                          <ArrowLeftOnRectangleIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                          Log out
                        </button>
                     </div>
                   </li>
                 </ul>
               </nav>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-blue-600 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-white font-bold text-xl">My Recovery Toolkit</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                          location.pathname === item.href
                            ? 'bg-blue-700 text-white'
                            : 'text-blue-200 hover:text-white hover:bg-blue-700'
                        }`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* Desktop Bottom Section: User Info + Logout */}
              <li className="mt-auto">
                 <div className="flex flex-col gap-2 border-t border-blue-500 pt-4">
                    {user && (
                        <div className="flex items-center gap-x-3 rounded-md px-2 py-2 text-sm font-semibold leading-6 text-white">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full bg-blue-700" />
                            ) : (
                                <UserCircleIcon className="h-8 w-8 text-blue-200" />
                            )}
                            <span className="sr-only">Your profile</span>
                            <span className="truncate" aria-hidden="true">{user.displayName || user.email}</span>
                        </div>
                    )}
                    <button
                      onClick={handleLogout}
                      className="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-blue-200 hover:bg-blue-700 hover:text-white w-full"
                    >
                      <ArrowLeftOnRectangleIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      Log out
                    </button>
                 </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">Dashboard</div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}