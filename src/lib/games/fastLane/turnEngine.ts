// src/lib/games/fastLane/turnEngine.ts
// PROJ-72 (Recovery Games), Phase 4. Pure functions extracted from the
// legacy `RecoverySimulatorGame`'s inline `setGameState` closures (same
// extraction pattern as Recovery Jeopardy's scoring.ts) — none of this logic
// was unit-testable in the original `.jsx` since it lived inside React state
// setters. No `any`, no mutation of inputs.
import { JOB_DATA, APARTMENT_TIERS, RANDOM_EVENTS, DIFFICULTY_LEVELS, UNIVERSITY_COURSES, SUPPORT_MEETING_TIME_COST, SUPPORT_MEETING_STRESS_REDUCTION, SUPPORT_MEETING_WELLBEING_BOOST, SHADY_GIG_TIME_COST, SHADY_GIG_MONEY, SHADY_GIG_STRESS_GAIN, SHADY_GIG_WELLBEING_LOSS } from './gameData';
import type {
  FastLaneParticipantState,
  FastLaneSaveState,
  FastLaneGoals,
  FastLaneDifficultyKey,
  FastLaneShopItem,
  FastLaneCourse,
  FastLaneApartmentTier,
  FastLaneWeekResult,
  FastLaneRivalTurnResult,
} from './types';

const BASE_COST_OF_LIVING = 100;
const BASE_WELLBEING_DRAIN = 2;

export function calculateStressLevel(state: Pick<FastLaneParticipantState, 'wellbeing' | 'loanAmount' | 'stressLevel'>): number {
  return Math.min(100, Math.max(0, 100 - state.wellbeing + state.loanAmount / 100 + state.stressLevel));
}

export function checkWinCondition(state: FastLaneParticipantState, goals: FastLaneGoals): boolean {
  const totalWealth = state.money + state.stockShares * state.stockValue;
  return (
    totalWealth >= goals.wealth &&
    state.wellbeing >= goals.wellbeing &&
    state.education >= goals.education &&
    state.currentJob.id >= goals.careerJobId
  );
}

function updateStockValue(currentValue: number): number {
  const change = Math.random() * 0.10 - 0.05;
  return Math.max(1.00, currentValue * (1 + change));
}

export function createNewGameState(difficultyKey: FastLaneDifficultyKey): FastLaneSaveState {
  const level = DIFFICULTY_LEVELS[difficultyKey];
  const startingJob = JOB_DATA[level.playerStartJob - 1];
  const startingApartment = APARTMENT_TIERS[0];

  const baseState: FastLaneParticipantState = {
    week: 1,
    timeRemaining: 40,
    money: level.playerStartMoney,
    wellbeing: 60,
    education: 0,
    currentJob: startingJob,
    rentDueIn: 4,
    rentCost: startingApartment.rent,
    livingSituation: startingApartment,
    loanAmount: level.playerStartDebt || 0,
    interestRate: 0.005,
    inventory: [],
    stockShares: 0,
    stockValue: 10.00,
    stressLevel: 0,
    inCrisis: false,
  };

  const rivalJobIndex = Math.min(JOB_DATA.length - 1, level.playerStartJob - 1 + level.rivalAdvantage);

  return {
    player: { ...baseState },
    rival: {
      ...baseState,
      money: baseState.money * 1.5,
      wellbeing: 65,
      currentJob: JOB_DATA[rivalJobIndex],
    },
    goals: {
      ...level.goals,
      education: 100,
      wellbeing: 100,
    },
    difficulty: difficultyKey,
    log: [`Welcome to ${level.name} mode! Your goals are set for a path to recovery.`],
  };
}

// --- END-OF-WEEK RESOLUTION (player) ---

export function resolveWeekEnd(player: FastLaneParticipantState, goals: FastLaneGoals): FastLaneWeekResult {
  const logMessages: string[] = [];
  let moneyChange = 0;
  let wellbeingChange = 0;
  let stressIncrease = 0;
  let loanPrincipalIncrease = 0;

  const currentStress = calculateStressLevel(player);
  let willEnterCrisis = false;
  if (currentStress >= 100 && !player.inCrisis) {
    logMessages.push('CRISIS ALERT! Your stress overwhelmed your stability.');
    wellbeingChange -= 30;
    moneyChange -= 200;
    willEnterCrisis = true;
  }

  const newStockValue = updateStockValue(player.stockValue);
  logMessages.push(`Investment Update: New price $${newStockValue.toFixed(2)}.`);

  const randomEvent = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  moneyChange += randomEvent.money;
  wellbeingChange += randomEvent.wellbeing;
  logMessages.push(`Weekly Event: ${randomEvent.description}`);
  if (randomEvent.wellbeing < 0) stressIncrease += 10;

  const costOfLiving = player.inventory.includes('fridge') ? 50 : BASE_COST_OF_LIVING;
  moneyChange -= costOfLiving;
  if (player.inventory.includes('computer')) moneyChange += 50;
  logMessages.push(`Weekly cost of living: -$${costOfLiving}.`);

  const nextRentDueIn = player.rentDueIn - 1;
  if (nextRentDueIn === 0 && player.livingSituation.rent > 0) {
    if (player.money + moneyChange >= player.rentCost) {
      moneyChange -= player.rentCost;
      logMessages.push(`Rent Paid: -$${player.rentCost}.`);
    } else {
      logMessages.push('ALERT! Financial stress due to unpaid rent. Wellbeing -5.');
      wellbeingChange -= 5;
      stressIncrease += 20;
    }
  }

  if (player.loanAmount > 0) {
    const interestPaid = Math.ceil(player.loanAmount * player.interestRate);
    moneyChange -= interestPaid;
    if (player.money + moneyChange < 0) {
      const shortage = (player.money + moneyChange) * -1;
      loanPrincipalIncrease = shortage;
      moneyChange += shortage;
    }
    logMessages.push(`Paid $${interestPaid} in high-risk interest.`);
  }

  wellbeingChange += player.livingSituation.wellbeingBonus;
  wellbeingChange -= BASE_WELLBEING_DRAIN;

  let newStressLevel = player.stressLevel + stressIncrease;
  let newTimeRemaining = 40;
  let newInCrisis = willEnterCrisis;

  if (player.inCrisis) {
    logMessages.push('STABILIZING: This week was dedicated to crisis management. Actions were limited.');
    wellbeingChange = Math.max(0, wellbeingChange + 15);
    newStressLevel = 0;
    newTimeRemaining = 0;
    newInCrisis = false;
  }

  const updatedPlayer: FastLaneParticipantState = {
    ...player,
    week: player.week + 1,
    timeRemaining: newTimeRemaining,
    money: player.money + moneyChange,
    wellbeing: Math.min(goals.wellbeing, Math.max(0, player.wellbeing + wellbeingChange)),
    loanAmount: player.loanAmount + loanPrincipalIncrease,
    rentDueIn: nextRentDueIn === 0 ? 4 : nextRentDueIn,
    stockValue: newStockValue,
    stressLevel: Math.min(100, newStressLevel),
    inCrisis: newInCrisis,
  };

  return {
    updatedPlayer,
    logMessages,
    playerWon: checkWinCondition(updatedPlayer, goals),
  };
}

// --- RIVAL (AI) TURN ---

export function runRivalTurn(rival: FastLaneParticipantState, goals: FastLaneGoals): FastLaneRivalTurnResult {
  const ai: FastLaneParticipantState = { ...rival, inventory: [...rival.inventory] };
  const logMessages: string[] = [`Casey's Turn (Week ${ai.week}):`];
  ai.timeRemaining = 40;
  let actionsTaken = 0;

  const getNextJob = (currentJobId: number) => JOB_DATA.find((j) => j.id === currentJobId + 1);

  const aiStress = calculateStressLevel(ai);
  let enteredCrisisThisTurn = false;
  if (aiStress >= 100) {
    logMessages.push('Casey entered a CRISIS! All plans are on hold for recovery.');
    ai.wellbeing = 20;
    ai.stressLevel = 0;
    enteredCrisisThisTurn = true;
  }

  if (enteredCrisisThisTurn || ai.inCrisis) {
    logMessages.push('Casey spent the week focused entirely on stabilization.');
    ai.wellbeing = Math.min(goals.wellbeing, ai.wellbeing + 15);
    ai.timeRemaining = 0;
  } else {
    while (ai.timeRemaining > 10 && actionsTaken < 5) {
      actionsTaken++;
      let actionTaken = false;

      const nextJob = getNextJob(ai.currentJob.id);
      const nextEducationReq = nextJob ? nextJob.educationReq : goals.education;
      const needsEducation = ai.education < nextEducationReq;

      if (!actionTaken && ai.wellbeing < 50 && ai.timeRemaining >= ai.livingSituation.timeCost) {
        ai.timeRemaining -= ai.livingSituation.timeCost;
        ai.wellbeing = Math.min(goals.wellbeing, ai.wellbeing + 8);
        logMessages.push('Casey took time for self-care due to low stability.');
        actionTaken = true;
      }

      if (!actionTaken && !ai.inventory.includes('fridge') && ai.money >= 300 && ai.timeRemaining >= 1) {
        ai.timeRemaining -= 1;
        ai.money -= 300;
        ai.inventory.push('fridge');
        logMessages.push('Casey invested in a Meal Prep Kit for efficiency.');
        actionTaken = true;
      }

      const nextAptTier = APARTMENT_TIERS.find((a) => a.id === ai.livingSituation.id + 1);
      if (!actionTaken && nextAptTier && ai.money >= nextAptTier.cost && ai.timeRemaining >= 1) {
        ai.timeRemaining -= 1;
        ai.money -= nextAptTier.cost;
        ai.livingSituation = nextAptTier;
        ai.rentCost = nextAptTier.rent;
        logMessages.push(`Casey upgraded to ${nextAptTier.name}.`);
        actionTaken = true;
      }

      if (!actionTaken && needsEducation && ai.education < goals.education) {
        const affordableCourses = COURSES_BY_GAIN_DESC.filter(
          (c) => ai.money >= c.cost && ai.timeRemaining >= c.time,
        );
        if (affordableCourses.length > 0) {
          const course = affordableCourses[0];
          ai.timeRemaining -= course.time;
          ai.money -= course.cost;
          ai.education = Math.min(100, ai.education + course.educationGain);
          logMessages.push(`Casey utilized ${course.name} for skill-building.`);
          actionTaken = true;
        }
      }

      if (!actionTaken && nextJob && ai.education >= nextJob.educationReq && ai.timeRemaining >= 2) {
        ai.timeRemaining -= 2;
        ai.currentJob = nextJob;
        logMessages.push(`Casey gained a promotion to ${nextJob.titleRecovery}.`);
        actionTaken = true;
      }

      if (!actionTaken) {
        const job = ai.currentJob;
        if (ai.timeRemaining >= job.timeCost) {
          const moneyEarned = job.wage * job.timeCost;
          ai.timeRemaining -= job.timeCost;
          ai.money += moneyEarned;
          logMessages.push(`Casey performed healthy engagement as a ${job.titleRecovery} and earned $${moneyEarned}.`);
        } else {
          break;
        }
      }
    }
  }

  let moneyChange = 0;
  let wellbeingChange = 0;
  let stressIncrease = 0;

  const foodCostReduction = ai.inventory.includes('fridge') ? 50 : 0;
  moneyChange -= BASE_COST_OF_LIVING - foodCostReduction;

  const nextRentDueIn = ai.rentDueIn - 1;
  if (nextRentDueIn === 0) {
    if (ai.money + moneyChange >= ai.rentCost) {
      moneyChange -= ai.rentCost;
    } else {
      wellbeingChange -= 5;
      stressIncrease += 20;
    }
  }

  wellbeingChange += ai.livingSituation.wellbeingBonus;

  const randomEvent = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  moneyChange += randomEvent.money;
  wellbeingChange += randomEvent.wellbeing;
  logMessages.push(`Casey's Unexpected Event: ${randomEvent.description}`);
  if (randomEvent.wellbeing < 0) stressIncrease += 10;

  const updatedRival: FastLaneParticipantState = {
    ...ai,
    money: ai.money + moneyChange,
    wellbeing: Math.min(goals.wellbeing, Math.max(0, ai.wellbeing + wellbeingChange - BASE_WELLBEING_DRAIN)),
    week: ai.week + 1,
    stressLevel: Math.min(100, ai.stressLevel + stressIncrease),
    rentDueIn: nextRentDueIn === 0 ? 4 : nextRentDueIn,
    inCrisis: false,
  };

  return {
    updatedRival,
    logMessages,
    rivalWon: checkWinCondition(updatedRival, goals),
  };
}

const COURSES_BY_GAIN_DESC: FastLaneCourse[] = [...UNIVERSITY_COURSES].sort((a, b) => b.educationGain - a.educationGain);

// --- PLAYER ACTIONS ---

export function applyWork(player: FastLaneParticipantState): FastLaneParticipantState {
  const job = player.currentJob;
  if (player.timeRemaining < job.timeCost) return player;
  const moneyEarned = job.wage * job.timeCost;
  return {
    ...player,
    timeRemaining: player.timeRemaining - job.timeCost,
    money: player.money + moneyEarned,
    wellbeing: Math.max(0, player.wellbeing - 1),
    stressLevel: Math.min(100, player.stressLevel + 5),
  };
}

export function applyJobSearch(player: FastLaneParticipantState): FastLaneParticipantState {
  const timeCost = 2;
  if (player.timeRemaining < timeCost || player.inCrisis) return player;

  const nextJob = JOB_DATA.find((j) => j.id === player.currentJob.id + 1);
  const updated: FastLaneParticipantState = {
    ...player,
    timeRemaining: player.timeRemaining - timeCost,
    stressLevel: Math.min(100, player.stressLevel + 5),
  };

  if (nextJob && player.education >= nextJob.educationReq) {
    updated.currentJob = nextJob;
  }

  return updated;
}

export function applyStudy(player: FastLaneParticipantState, course: FastLaneCourse, goals: FastLaneGoals): FastLaneParticipantState {
  if (player.timeRemaining < course.time || player.money < course.cost) return player;
  return {
    ...player,
    timeRemaining: player.timeRemaining - course.time,
    money: player.money - course.cost,
    education: Math.min(100, player.education + course.educationGain),
    wellbeing: Math.min(goals.wellbeing, player.wellbeing + 2),
  };
}

export function applyPurchaseItem(player: FastLaneParticipantState, item: FastLaneShopItem, goals: FastLaneGoals): FastLaneParticipantState {
  if (player.timeRemaining < 1 || player.money < item.cost || player.inventory.includes(item.id)) return player;
  return {
    ...player,
    timeRemaining: player.timeRemaining - 1,
    money: player.money - item.cost,
    inventory: [...player.inventory, item.id],
    wellbeing: Math.min(goals.wellbeing, player.wellbeing + item.wellbeing),
  };
}

export function applyPurchaseApartment(player: FastLaneParticipantState, tier: FastLaneApartmentTier, goals: FastLaneGoals): FastLaneParticipantState {
  if (player.timeRemaining < 1 || player.money < tier.cost) return player;
  const wellbeingGain = tier.wellbeingBonus - player.livingSituation.wellbeingBonus;
  return {
    ...player,
    timeRemaining: player.timeRemaining - 1,
    money: player.money - tier.cost,
    livingSituation: tier,
    rentCost: tier.rent,
    wellbeing: Math.min(goals.wellbeing, player.wellbeing + wellbeingGain * 2),
  };
}

export function applyRest(player: FastLaneParticipantState, goals: FastLaneGoals): FastLaneParticipantState {
  const timeCost = player.livingSituation.timeCost;
  if (player.timeRemaining < timeCost) return player;
  return {
    ...player,
    timeRemaining: player.timeRemaining - timeCost,
    wellbeing: Math.min(goals.wellbeing, player.wellbeing + 8),
    stressLevel: Math.max(0, player.stressLevel - 15),
  };
}

export function applyAttendSupportMeeting(player: FastLaneParticipantState, goals: FastLaneGoals): FastLaneParticipantState {
  if (player.timeRemaining < SUPPORT_MEETING_TIME_COST) return player;
  return {
    ...player,
    timeRemaining: player.timeRemaining - SUPPORT_MEETING_TIME_COST,
    wellbeing: Math.min(goals.wellbeing, player.wellbeing + SUPPORT_MEETING_WELLBEING_BOOST),
    stressLevel: Math.max(0, player.stressLevel - SUPPORT_MEETING_STRESS_REDUCTION),
  };
}

export function applyShadyGig(player: FastLaneParticipantState): FastLaneParticipantState {
  if (player.timeRemaining < SHADY_GIG_TIME_COST || player.inCrisis) return player;
  return {
    ...player,
    timeRemaining: player.timeRemaining - SHADY_GIG_TIME_COST,
    money: player.money + SHADY_GIG_MONEY,
    stressLevel: Math.min(100, player.stressLevel + SHADY_GIG_STRESS_GAIN),
    wellbeing: Math.max(0, player.wellbeing - SHADY_GIG_WELLBEING_LOSS),
  };
}

export function applyTakeLoan(player: FastLaneParticipantState, amount: number): FastLaneParticipantState {
  if (player.timeRemaining < 1 || amount <= 0) return player;
  return {
    ...player,
    timeRemaining: player.timeRemaining - 1,
    money: player.money + amount,
    loanAmount: player.loanAmount + amount,
    stressLevel: Math.min(100, player.stressLevel + 10),
  };
}

export function applyRepayLoan(player: FastLaneParticipantState, amount: number): FastLaneParticipantState {
  const repayable = Math.min(amount, player.loanAmount, player.money);
  if (player.timeRemaining < 1 || repayable <= 0) return player;
  return {
    ...player,
    timeRemaining: player.timeRemaining - 1,
    money: player.money - repayable,
    loanAmount: player.loanAmount - repayable,
    stressLevel: Math.max(0, player.stressLevel - 10),
  };
}

export function applySellItem(player: FastLaneParticipantState, itemId: string, shopItems: FastLaneShopItem[]): FastLaneParticipantState {
  const item = shopItems.find((i) => i.id === itemId);
  if (!item || !player.inventory.includes(itemId) || player.timeRemaining < 1) return player;
  const sellPrice = Math.floor(item.cost / 2);
  return {
    ...player,
    timeRemaining: player.timeRemaining - 1,
    money: player.money + sellPrice,
    inventory: player.inventory.filter((id) => id !== itemId),
    wellbeing: Math.max(0, player.wellbeing - item.wellbeing),
    stressLevel: Math.min(100, player.stressLevel + 15),
  };
}

export function applyInvest(player: FastLaneParticipantState, amount: number): FastLaneParticipantState {
  if (player.timeRemaining < 1 || player.money < amount) return player;
  const sharesBought = Math.floor(amount / player.stockValue);
  if (sharesBought === 0) return player;
  const cost = sharesBought * player.stockValue;
  return {
    ...player,
    timeRemaining: player.timeRemaining - 1,
    money: player.money - cost,
    stockShares: player.stockShares + sharesBought,
    stressLevel: Math.min(100, player.stressLevel + 10),
  };
}

export function applyCashOut(player: FastLaneParticipantState, sharesToSell: number): FastLaneParticipantState {
  if (player.timeRemaining < 1 || player.stockShares === 0 || sharesToSell > player.stockShares) return player;
  const revenue = sharesToSell * player.stockValue;
  return {
    ...player,
    timeRemaining: player.timeRemaining - 1,
    money: player.money + revenue,
    stockShares: player.stockShares - sharesToSell,
    stressLevel: Math.max(0, player.stressLevel - 5),
  };
}
