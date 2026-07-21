import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calculateStressLevel,
  checkWinCondition,
  createNewGameState,
  resolveWeekEnd,
  runRivalTurn,
} from '../turnEngine';
import { JOB_DATA, APARTMENT_TIERS } from '../gameData';
import type { FastLaneParticipantState, FastLaneGoals } from '../types';

function baseParticipant(overrides: Partial<FastLaneParticipantState> = {}): FastLaneParticipantState {
  return {
    week: 1,
    timeRemaining: 40,
    money: 1000,
    wellbeing: 60,
    education: 0,
    currentJob: JOB_DATA[0],
    rentDueIn: 4,
    rentCost: APARTMENT_TIERS[0].rent,
    livingSituation: APARTMENT_TIERS[0],
    loanAmount: 0,
    interestRate: 0.005,
    inventory: [],
    stockShares: 0,
    stockValue: 10,
    stressLevel: 0,
    inCrisis: false,
    ...overrides,
  };
}

const goals: FastLaneGoals = { wealth: 250000, careerJobId: 6, education: 100, wellbeing: 100 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('🎮 calculateStressLevel', () => {
  it('combines wellbeing deficit, loan burden, and existing stress', () => {
    expect(calculateStressLevel({ wellbeing: 60, loanAmount: 500, stressLevel: 10 })).toBe(55);
  });

  it('clamps to 100', () => {
    expect(calculateStressLevel({ wellbeing: 0, loanAmount: 100000, stressLevel: 100 })).toBe(100);
  });

  it('clamps to 0', () => {
    expect(calculateStressLevel({ wellbeing: 100, loanAmount: 0, stressLevel: 0 })).toBe(0);
  });
});

describe('🎮 checkWinCondition', () => {
  it('wins only when wealth, wellbeing, education, and career job are all satisfied', () => {
    const winner = baseParticipant({ money: 300000, wellbeing: 100, education: 100, currentJob: JOB_DATA[5] });
    expect(checkWinCondition(winner, goals)).toBe(true);
  });

  it('fails if the career job requirement is not met (fixes the legacy unwinnable-by-title bug)', () => {
    const almostWinner = baseParticipant({ money: 300000, wellbeing: 100, education: 100, currentJob: JOB_DATA[4] });
    expect(checkWinCondition(almostWinner, goals)).toBe(false);
  });

  it('counts stock portfolio value toward wealth', () => {
    const withStocks = baseParticipant({
      money: 100000,
      stockShares: 1000,
      stockValue: 200,
      wellbeing: 100,
      education: 100,
      currentJob: JOB_DATA[5],
    });
    expect(checkWinCondition(withStocks, goals)).toBe(true);
  });
});

describe('🎮 createNewGameState', () => {
  it('gives the rival a head start proportional to difficulty', () => {
    const easy = createNewGameState('EASY');
    const hard = createNewGameState('HARD');
    expect(easy.rival.currentJob.id).toBe(JOB_DATA[0].id);
    expect(hard.rival.currentJob.id).toBeGreaterThan(easy.rival.currentJob.id);
  });

  it('applies starting debt only for HARD difficulty', () => {
    expect(createNewGameState('EASY').player.loanAmount).toBe(0);
    expect(createNewGameState('HARD').player.loanAmount).toBe(500);
  });
});

describe('🎮 resolveWeekEnd', () => {
  it('deducts rent when due and affordable, alongside cost of living', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75); // -> neutral, $0/0 random event
    const player = baseParticipant({ money: 1000, rentDueIn: 1 });
    const result = resolveWeekEnd(player, goals);

    // -100 cost of living, -100 rent
    expect(result.updatedPlayer.money).toBe(800);
    expect(result.updatedPlayer.rentDueIn).toBe(4);
  });

  it('penalizes wellbeing/stress instead of deducting rent when unaffordable', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    const player = baseParticipant({ money: 50, rentDueIn: 1 });
    const result = resolveWeekEnd(player, goals);

    expect(result.updatedPlayer.money).toBe(-50); // cost of living only, rent skipped
    expect(result.logMessages.some((m) => m.includes('unpaid rent'))).toBe(true);
  });

  it('accrues loan principal when interest cannot be covered by cash on hand', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    const player = baseParticipant({ money: 50, rentDueIn: 4, loanAmount: 500 });
    const result = resolveWeekEnd(player, goals);

    // cost of living -100 leaves -50; $3 interest can't be covered -> shortage
    // of 53 is added to the loan principal and money floors at 0 change.
    expect(result.updatedPlayer.money).toBe(0);
    expect(result.updatedPlayer.loanAmount).toBe(553);
  });

  it('triggers a crisis when combined stress reaches 100', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    const player = baseParticipant({ wellbeing: 0, loanAmount: 0, stressLevel: 0, rentDueIn: 4 });
    const result = resolveWeekEnd(player, goals);

    expect(result.logMessages.some((m) => m.includes('CRISIS ALERT'))).toBe(true);
    expect(result.updatedPlayer.inCrisis).toBe(true);
  });

  it('stabilizes and clears crisis on the week following a crisis trigger', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    const player = baseParticipant({ wellbeing: 20, inCrisis: true, timeRemaining: 5 });
    const result = resolveWeekEnd(player, goals);

    expect(result.logMessages.some((m) => m.includes('STABILIZING'))).toBe(true);
    expect(result.updatedPlayer.inCrisis).toBe(false);
    expect(result.updatedPlayer.timeRemaining).toBe(0);
    expect(result.updatedPlayer.stressLevel).toBe(0);
  });
});

describe('🎮 runRivalTurn', () => {
  it('prioritizes self-care over working when wellbeing is low', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    const rival = baseParticipant({ wellbeing: 30, timeRemaining: 40 });
    const result = runRivalTurn(rival, goals);

    expect(result.logMessages.some((m) => m.includes('self-care'))).toBe(true);
  });

  it('promotes the rival once education requirements for the next job are met', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    const rival = baseParticipant({
      wellbeing: 90,
      education: 100,
      inventory: ['fridge'],
      livingSituation: APARTMENT_TIERS[2],
      rentCost: APARTMENT_TIERS[2].rent,
      currentJob: JOB_DATA[3], // education req for JOB_DATA[4] (60) already satisfied
      timeRemaining: 40,
    });
    const result = runRivalTurn(rival, goals);

    // Education is already maxed, so the AI may clear more than one
    // promotion threshold within a single turn — assert forward progress
    // rather than an exact landing job.
    expect(result.updatedRival.currentJob.id).toBeGreaterThan(JOB_DATA[3].id);
    expect(result.logMessages.some((m) => m.includes('promotion'))).toBe(true);
  });

  it('enters crisis when the rival\'s combined stress reaches 100', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    const rival = baseParticipant({ wellbeing: 0, loanAmount: 0, stressLevel: 0 });
    const result = runRivalTurn(rival, goals);

    expect(result.logMessages.some((m) => m.includes('CRISIS'))).toBe(true);
    expect(result.updatedRival.timeRemaining).toBe(0);
  });
});
