export const THEME = {
  dashboard: {
    page: 'bg-slate-200', // High contrast cool grey
    header: {
      from: 'from-sky-500',
      via: 'via-blue-600',
      to: 'to-indigo-600'
    }
  },
  journal: {
    page: 'bg-indigo-200', // Rich lavender
    header: {
      from: 'from-indigo-600',
      via: 'via-purple-600',
      to: 'to-violet-600'
    }
  },
  tasks: {
    page: 'bg-cyan-200', // Electric mint
    header: {
      from: 'from-cyan-500',
      via: 'via-teal-500',
      to: 'to-emerald-500'
    },
    ring: '#34d399' // Emerald-400
  },
  workbooks: {
    page: 'bg-emerald-200', // Deep herbal green
    header: {
      from: 'from-emerald-600',
      via: 'via-green-600',
      to: 'to-lime-600'
    },
    ring: '#a3e635' // Lime-400
  },
  insights: {
    page: 'bg-fuchsia-200', // Bold pink mist
    header: {
      from: 'from-fuchsia-600',
      via: 'via-pink-600',
      to: 'to-rose-500'
    }
  },
  vitality: {
    page: 'bg-orange-200', // Warm apricot
    header: {
      from: 'from-rose-500',
      via: 'via-orange-500',
      to: 'to-amber-500'
    },
    ring: '#fbbf24' // Amber-400
  },
  profile: {
    page: 'bg-zinc-300', // Deep metallic grey
    header: {
      from: 'from-slate-700',
      via: 'via-gray-800',
      to: 'to-zinc-900'
    }
  }
} as const;