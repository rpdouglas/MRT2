import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateUserProfile, type UserProfile } from '../lib/db';
import { Link } from 'react-router-dom'; // Now we are actually using this!

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        try {
          const data = await getOrCreateUserProfile(user);
          setProfile(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [user]);
  
  // Calculate Days
  let displayDays = 0;
  let hasDate = false;

  if (profile?.sobrietyDate) {
    hasDate = true;
    const sobrietyDate = profile.sobrietyDate.toDate();
    const today = new Date();
    // Reset hours to ensure fair day calculation
    sobrietyDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    if (today >= sobrietyDate) {
      const diffTime = Math.abs(today.getTime() - sobrietyDate.getTime());
      displayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Stats Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-deep-charcoal">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Friend'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            One day at a time.
          </p>
          
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            
            {/* Days Sober Card */}
            <div className="bg-teal-50 overflow-hidden rounded-lg border border-teal-100 p-4 relative shadow-sm">
              <dt className="truncate text-sm font-medium text-teal-600">Days Sober</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-teal-900">
                {loading ? '...' : (hasDate ? displayDays : '0')}
              </dd>
              {!hasDate && !loading && (
                 <p className="text-xs text-red-500 mt-1">
                   {/* FIXED: Changed <a> to <Link> for instant navigation */}
                   <Link to="/profile" className="underline hover:text-red-700">
                     Set Date
                   </Link>
                 </p>
              )}
            </div>

            {/* Step Card */}
            <div className="bg-orange-50 overflow-hidden rounded-lg border border-orange-100 p-4 shadow-sm">
              <dt className="truncate text-sm font-medium text-orange-600">Current Step</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-orange-900">Step 1</dd>
            </div>
            
            {/* Next Meeting Card */}
             <div className="bg-purple-50 overflow-hidden rounded-lg border border-purple-100 p-4 shadow-sm">
              <dt className="truncate text-sm font-medium text-purple-600">Next Meeting</dt>
              <dd className="mt-1 text-lg font-semibold tracking-tight text-purple-900">Tuesday 7:00 PM</dd>
              <dd className="text-xs text-purple-500">Learn to Live (Big Book)</dd>
            </div>
          </div>
        </div>
      </div>
      
      {/* Daily Reflection Placeholder */}
      <div className="bg-white shadow sm:rounded-lg border-t-4 border-healing-green">
         <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Daily Reflection</h3>
            <div className="mt-4 bg-gray-50 p-4 rounded-md italic text-gray-600 border-l-4 border-gray-300">
             "We admitted we were powerless over our addiction - that our lives had become unmanageable."
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Acceptance is the first step towards freedom. Today, I will look at my life honestly...
            </p>
            <div className="mt-5">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-healing-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition"
              >
                Read Full Entry
              </button>
            </div>
         </div>
      </div>
    </div>
  );
}