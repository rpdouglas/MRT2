import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  HomeIcon, 
  BookOpenIcon, 
  UserCircleIcon, 
  ArrowLeftOnRectangleIcon, 
  ClipboardDocumentListIcon, 
  AcademicCapIcon, 
  HeartIcon, 
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import SOSModal from './SOSModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, isSOSOpen, setIsSOSOpen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Journal', href: '/journal', icon: BookOpenIcon },
    { name: 'Vitality', href: '/vitality', icon: HeartIcon },
    { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Workbooks', href: '/workbooks', icon: AcademicCapIcon },
    { name: 'Insights', href: '/insights', icon: LightBulbIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  const handleLogout = async () => {
    try {
      setSidebarOpen(false); 
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* --- GLOBAL SOS MODAL --- */}
      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />

      {/* --- SLIDE-OVER SIDEBAR (Mobile & Desktop Drawer) --- */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setSidebarOpen}>
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1 flex-col bg-blue-600 transition-all shadow-2xl">
                
                <div className="flex h-16 shrink-0 items-center justify-between px-6 pt-6">
                   <div className="flex items-center gap-2 text-white font-bold text-lg">
                      <img src="/favicon-32x32.png" alt="" className="h-8 w-8" />
                      Recovery Toolkit
                   </div>
                   <button onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5 text-blue-200 hover:text-white">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <nav className="flex flex-1 flex-col px-6 pb-4 mt-8">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              onClick={() => setSidebarOpen(false)}
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
                    
                    <li className="mt-auto">
                      <div className="flex flex-col gap-2 pt-6 border-t border-blue-500">
                         {user && (
                             <div className="flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-white bg-blue-700/50">
                                 {user.photoURL ? (
                                     <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full bg-blue-700" />
                                 ) : (
                                     <UserCircleIcon className="h-8 w-8 text-blue-200" />
                                 )}
                                 <div className="flex flex-col truncate">
                                    <span className="sr-only">Your profile</span>
                                    <span aria-hidden="true">{user.displayName || 'User'}</span>
                                    <span className="text-xs text-blue-300 font-normal truncate">{user.email}</span>
                                 </div>
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
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Main Content Area - NO HEADER HERE, controlled by pages */}
      <main className="min-h-screen">
          {children}
      </main>
    </div>
  );
}