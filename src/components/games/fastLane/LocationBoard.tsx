// src/components/games/fastLane/LocationBoard.tsx
// PROJ-72 (Recovery Games), Phase 4. Ported from the legacy LocationBoard.jsx
// — the weekly action menu (work/study/shop/apartment/financials/risky/
// self-care). Restyled onto Tailwind; "Attend 12-Step Meeting" renamed to
// "Attend a Support Meeting" per the Tradition 6 compliance scrub.
import { useState } from 'react';
import { UNIVERSITY_COURSES, SHOP_ITEMS, APARTMENT_TIERS, SUPPORT_MEETING_TIME_COST, SHADY_GIG_TIME_COST } from '../../../lib/games/fastLane/gameData';
import type { FastLaneParticipantState, FastLaneCourse, FastLaneShopItem, FastLaneApartmentTier } from '../../../lib/games/fastLane/types';

type Location = 'work' | 'university' | 'shop' | 'apartment' | 'financials' | 'risky' | 'selfCare';

interface LocationBoardProps {
  player: FastLaneParticipantState;
  onWork: () => void;
  onJobSearch: () => void;
  onStudy: (course: FastLaneCourse) => void;
  onPurchaseItem: (item: FastLaneShopItem) => void;
  onPurchaseApartment: (tier: FastLaneApartmentTier) => void;
  onRest: () => void;
  onAttendSupportMeeting: () => void;
  onShadyGig: () => void;
  onTakeLoan: (amount: number) => void;
  onRepayLoan: (amount: number) => void;
  onSellItem: (itemId: string) => void;
  onInvest: (amount: number) => void;
  onCashOut: (shares: number) => void;
  onEndTurn: () => void;
}

const actionButtonClass = 'text-left px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:shadow-sm w-full';

export default function LocationBoard({
  player,
  onWork,
  onJobSearch,
  onStudy,
  onPurchaseItem,
  onPurchaseApartment,
  onRest,
  onAttendSupportMeeting,
  onShadyGig,
  onTakeLoan,
  onRepayLoan,
  onSellItem,
  onInvest,
  onCashOut,
  onEndTurn,
}: LocationBoardProps) {
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [loanAmount, setLoanAmount] = useState(100);
  const [repayAmount, setRepayAmount] = useState(100);
  const [investAmount, setInvestAmount] = useState(100);
  const [cashOutShares, setCashOutShares] = useState(1);

  const { timeRemaining, inventory } = player;

  const go = (action: () => void) => {
    action();
    setActiveLocation(null);
  };

  if (player.inCrisis) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Weekly Planner</h3>
        <p className="text-sm text-slate-600 mb-4">
          This week is dedicated to stabilizing. Resting is the only action available — everything else can wait.
        </p>
        <button onClick={() => go(onRest)} className={actionButtonClass}>
          Rest / Recover ({player.livingSituation.timeCost} hrs)
        </button>
        <button onClick={onEndTurn} className="mt-3 w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-md active:scale-95 transition-transform">
          End Week
        </button>
      </div>
    );
  }

  const renderLocationContent = () => {
    if (activeLocation === 'work') {
      return (
        <div className="flex flex-col gap-2">
          <button onClick={() => go(onWork)} disabled={timeRemaining < player.currentJob.timeCost} className={actionButtonClass}>
            Work your job ({player.currentJob.timeCost} hrs)
          </button>
          <button onClick={() => go(onJobSearch)} disabled={timeRemaining < 2} className={actionButtonClass}>
            Search for a better job (2 hrs)
          </button>
        </div>
      );
    }

    if (activeLocation === 'university') {
      return (
        <div className="flex flex-col gap-2">
          {UNIVERSITY_COURSES.map((course) => (
            <button
              key={course.name}
              onClick={() => go(() => onStudy(course))}
              disabled={timeRemaining < course.time || player.money < course.cost}
              className={actionButtonClass}
            >
              {course.name} (${course.cost}, {course.time} hrs)
            </button>
          ))}
        </div>
      );
    }

    if (activeLocation === 'shop') {
      return (
        <div className="flex flex-col gap-2">
          {SHOP_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => go(() => onPurchaseItem(item))}
              disabled={timeRemaining < 1 || player.money < item.cost || player.inventory.includes(item.id)}
              className={actionButtonClass}
            >
              Buy {item.name} (${item.cost}, 1 hr)
            </button>
          ))}
        </div>
      );
    }

    if (activeLocation === 'apartment') {
      return (
        <div className="flex flex-col gap-2">
          {APARTMENT_TIERS.filter((tier) => tier.id > player.livingSituation.id).map((tier) => (
            <button
              key={tier.id}
              onClick={() => go(() => onPurchaseApartment(tier))}
              disabled={timeRemaining < 1 || player.money < tier.cost}
              className={actionButtonClass}
            >
              Secure {tier.name} (${tier.cost})
            </button>
          ))}
          {APARTMENT_TIERS.every((tier) => tier.id <= player.livingSituation.id) && (
            <p className="text-sm text-slate-400">You already have the most stable living situation.</p>
          )}
        </div>
      );
    }

    if (activeLocation === 'financials') {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(parseInt(e.target.value, 10) || 0)} className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
            <button onClick={() => go(() => onTakeLoan(loanAmount))} disabled={timeRemaining < 1} className={actionButtonClass}>
              Take high-risk loan (1 hr)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={repayAmount} onChange={(e) => setRepayAmount(parseInt(e.target.value, 10) || 0)} className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
            <button onClick={() => go(() => onRepayLoan(repayAmount))} disabled={timeRemaining < 1 || player.money < repayAmount || player.loanAmount <= 0} className={actionButtonClass}>
              Repay loan (1 hr)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={investAmount} onChange={(e) => setInvestAmount(parseInt(e.target.value, 10) || 0)} className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
            <button onClick={() => go(() => onInvest(investAmount))} disabled={timeRemaining < 1 || player.money < investAmount} className={actionButtonClass}>
              Invest (1 hr)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={cashOutShares} onChange={(e) => setCashOutShares(parseInt(e.target.value, 10) || 0)} className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
            <button onClick={() => go(() => onCashOut(cashOutShares))} disabled={timeRemaining < 1 || player.stockShares < cashOutShares} className={actionButtonClass}>
              Cash out shares (1 hr)
            </button>
          </div>
          {inventory.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={() => go(() => onSellItem(inventory[0]))} disabled={timeRemaining < 1} className={actionButtonClass}>
                Sell {SHOP_ITEMS.find((i) => i.id === inventory[0])?.name} (1 hr)
              </button>
            </div>
          )}
        </div>
      );
    }

    if (activeLocation === 'risky') {
      return (
        <button onClick={() => go(onShadyGig)} disabled={timeRemaining < SHADY_GIG_TIME_COST} className={actionButtonClass}>
          Take a risky side gig ({SHADY_GIG_TIME_COST} hrs) — quick cash, high stress cost
        </button>
      );
    }

    if (activeLocation === 'selfCare') {
      return (
        <div className="flex flex-col gap-2">
          <button onClick={() => go(onAttendSupportMeeting)} disabled={timeRemaining < SUPPORT_MEETING_TIME_COST} className={actionButtonClass}>
            Attend a support meeting ({SUPPORT_MEETING_TIME_COST} hrs)
          </button>
          <button onClick={() => go(onRest)} disabled={timeRemaining < player.livingSituation.timeCost} className={actionButtonClass}>
            Rest / Recharge ({player.livingSituation.timeCost} hrs)
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Weekly Planner</h3>
        <span className="text-xs text-slate-400">{timeRemaining} hrs left</span>
      </div>

      {activeLocation ? (
        <div>
          {renderLocationContent()}
          <button onClick={() => setActiveLocation(null)} className="mt-3 text-sm text-slate-500 hover:text-slate-700 font-semibold">
            &larr; Back to Planner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setActiveLocation('work')} className={actionButtonClass}>🏢 Work</button>
          <button onClick={() => setActiveLocation('university')} className={actionButtonClass}>🎓 School</button>
          <button onClick={() => setActiveLocation('shop')} className={actionButtonClass}>🛍️ Shopping</button>
          <button onClick={() => setActiveLocation('apartment')} className={actionButtonClass}>🏠 Living Situation</button>
          <button onClick={() => setActiveLocation('financials')} className={actionButtonClass}>💰 Financials</button>
          <button onClick={() => setActiveLocation('risky')} className={actionButtonClass}>🎲 Risky Area</button>
          <button onClick={() => setActiveLocation('selfCare')} className={`${actionButtonClass} col-span-2`}>❤️ Self-Care &amp; Support</button>
        </div>
      )}

      {!activeLocation && (
        <button
          onClick={onEndTurn}
          disabled={timeRemaining <= 0}
          className="mt-4 w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
        >
          End Week
        </button>
      )}
    </div>
  );
}
