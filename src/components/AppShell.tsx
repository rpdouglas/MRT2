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
  AcademicCapIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SOSModal from './SOSModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
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

      {/* --- DESKTOP SOS BUTTON (Right-Justified Fixed) --- */}
      <div className="hidden lg:block fixed top-6 right-6 z-50">
         <button 
           onClick={() => setIsSOSOpen(true)}
           className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg border-2 border-white flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 animate-pulse"
           title="Emergency Support"
         >
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="font-bold">SOS</span>
         </button>
      </div>

      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <div className="fixed inset-0 bg-gray-900/80" />
          <div className="fixed inset-0 flex">
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1 transform flex-col bg-blue-600 transition-all">
               
               <div className="flex h-16 shrink-0 items-center justify-end px-6">
                  <button onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5 text-blue-200 hover:text-white">
                    <span className="sr-only">Close sidebar</span>
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
          <div className="flex h-16 shrink-0 items-center justify-center gap-2">
            <img src="/favicon-32x32.png" alt="" className="h-8 w-8" />
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
        {/* MOBILE TOP BAR */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-center border-b border-blue-700 bg-blue-600 px-4 shadow-sm lg:hidden">
          
          {/* Hamburger (Absolute Left) */}
          <button 
            type="button" 
            className="-m-2.5 p-2.5 text-blue-200 hover:text-white absolute left-4 z-50" 
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Centered Title with Flanking Logos */}
          <div className="flex items-center gap-2">
            <img src="/favicon-32x32.png" alt="" className="h-8 w-8" />
            <div className="text-lg font-bold leading-6 text-white whitespace-nowrap">My Recovery Toolkit</div>
            <img src="/favicon-32x32.png" alt="" className="h-8 w-8" />
          </div>

          {/* SOS Button (Absolute Right) */}
          <button 
            type="button"
            onClick={() => setIsSOSOpen(true)}
            className="absolute right-4 z-50 text-white bg-red-600 hover:bg-red-700 p-2 rounded-full shadow-sm animate-pulse"
            title="SOS"
          >
            <ExclamationTriangleIcon className="h-6 w-6" />
          </button>

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