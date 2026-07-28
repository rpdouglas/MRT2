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
    },
    // Fully-spelled classes (not built from template literals) so Tailwind's
    // content scanner picks them up — see TabBar.tsx consumers.
    tabBar: {
      border: 'border-indigo-200',
      hoverText: 'hover:text-indigo-600'
    }
  },
  tasks: {
    page: 'bg-cyan-200', // Electric mint
    header: {
      from: 'from-cyan-500',
      via: 'via-teal-500',
      to: 'to-emerald-500'
    },
    ring: '#34d399', // Emerald-400
    tabBar: {
      border: 'border-cyan-200',
      hoverText: 'hover:text-cyan-600'
    }
  },
  workbooks: {
    page: 'bg-emerald-200', // Deep herbal green
    header: {
      from: 'from-emerald-600',
      via: 'via-green-600',
      to: 'to-lime-600'
    },
    ring: '#a3e635', // Lime-400
    tabBar: {
      border: 'border-emerald-200',
      hoverText: 'hover:text-emerald-600'
    }
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
    ring: '#fbbf24', // Amber-400
    tabBar: {
      border: 'border-orange-200',
      hoverText: 'hover:text-orange-600'
    }
  },
  profile: {
    page: 'bg-zinc-300', // Deep metallic grey
    header: {
      from: 'from-slate-700',
      via: 'via-gray-800',
      to: 'to-zinc-900'
    },
    tabBar: {
      border: 'border-zinc-300',
      hoverText: 'hover:text-zinc-600'
    }
  },
  tools: {
    page: 'bg-blue-200', // Bright sky clarity — matches the Dashboard's Tools tile
    header: {
      from: 'from-blue-600',
      via: 'via-blue-500',
      to: 'to-sky-500'
    }
  },
  games: {
    page: 'bg-violet-200', // Sits between the header's indigo/purple stops; distinct from Journal's indigo-200
    header: {
      from: 'from-indigo-500',
      via: 'via-violet-500',
      to: 'to-purple-600' // Matches the Dashboard's My Games tile (from-indigo-500 to-purple-600)
    }
  }
} as const;