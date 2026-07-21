// src/lib/games/fastLane/gameData.ts
// PROJ-72 (Recovery Games), Phase 4. Ported from the legacy
// `RecoverySimulatorGame` ("Fast Lane")'s JOB_DATA/UNIVERSITY_COURSES/
// SHOP_ITEMS/RANDOM_EVENTS/APARTMENT_TIERS/DIFFICULTY_LEVELS constants.
//
// Compliance scrub (Tradition 6, same requirement Recovery Jeopardy's
// jeopardyData.ts went through): the legacy self-care action literally read
// "Attend 12-Step Meeting" — renamed to "Attend a Support Meeting" below, the
// only fellowship-specific reference found anywhere in the source data. See
// __tests__/gameData.test.ts for the CI-enforced denylist guard.
import type {
  FastLaneJob,
  FastLaneCourse,
  FastLaneShopItem,
  FastLaneRandomEvent,
  FastLaneApartmentTier,
  FastLaneDifficultyKey,
  FastLaneDifficulty,
} from './types';

export const JOB_DATA: FastLaneJob[] = [
  { id: 1, title: 'Janitor', titleRecovery: 'Janitorial Role', wage: 10, timeCost: 6, educationReq: 0, nextJobId: 2 },
  { id: 2, title: 'Fast Food Cook', titleRecovery: 'Service Position', wage: 15, timeCost: 6, educationReq: 5, nextJobId: 3 },
  { id: 3, title: 'Butcher', titleRecovery: 'Skilled Work', wage: 30, timeCost: 8, educationReq: 20, nextJobId: 4 },
  { id: 4, title: 'Machinist Assistant', titleRecovery: 'Technical Assistant', wage: 45, timeCost: 8, educationReq: 35, nextJobId: 5 },
  { id: 5, title: 'Engineer', titleRecovery: 'Professional Specialist', wage: 80, timeCost: 7, educationReq: 60, nextJobId: 6 },
  { id: 6, title: 'General Manager', titleRecovery: 'Program Coordinator', wage: 120, timeCost: 6, educationReq: 85, nextJobId: null },
];

export const UNIVERSITY_COURSES: FastLaneCourse[] = [
  { name: 'Foundational Skills', cost: 200, time: 10, educationGain: 20, level: 1 },
  { name: 'Communication/Coping', cost: 500, time: 15, educationGain: 30, level: 2 },
  { name: 'Self-Efficacy Training', cost: 1000, time: 20, educationGain: 50, level: 3 },
  { name: 'Advanced Career Readiness', cost: 2500, time: 25, educationGain: 70, level: 4 },
  { name: 'Personal Mastery', cost: 5000, time: 30, educationGain: 100, level: 5 },
];

export const SHOP_ITEMS: FastLaneShopItem[] = [
  { id: 'fridge', name: 'Meal Prep Kit', cost: 300, wellbeing: 10, type: 'food_saver', descRecovery: 'Allows for healthy, cost-effective eating.' },
  { id: 'computer', name: 'Creative Outlet', cost: 800, wellbeing: 15, type: 'passive_income', descRecovery: 'Provides passive income through positive side-hustles.' },
  { id: 'hottub', name: 'Premium Self-Care Item', cost: 1500, wellbeing: 30, type: 'luxury', descRecovery: 'Significant boost to comfort and relaxation.' },
  { id: 'car', name: 'Reliable Transport', cost: 5000, wellbeing: 50, type: 'luxury_travel', descRecovery: 'Facilitates easy attendance at appointments/work.' },
];

export const RANDOM_EVENTS: FastLaneRandomEvent[] = [
  { type: 'positive', description: 'A positive connection reinforced your sobriety.', money: 200, wellbeing: 10 },
  { type: 'positive', description: 'Received unexpected support for your recovery efforts.', money: 500, wellbeing: 0 },
  { type: 'positive', description: 'You successfully practiced a difficult coping skill!', money: 0, wellbeing: 15 },
  { type: 'positive', description: 'Stock dividend payout!', money: 100, wellbeing: 0 },
  { type: 'negative', description: 'You experienced unexpected stress and had to call a sponsor.', money: -150, wellbeing: -5 },
  { type: 'negative', description: 'An old habit flared up, costing you time and energy.', money: -50, wellbeing: 0 },
  { type: 'negative', description: 'An emergency bill arrived, stressing finances.', money: -250, wellbeing: -10 },
  { type: 'negative', description: 'Negative thought patterns disrupted your day.', money: -200, wellbeing: -5 },
  { type: 'neutral', description: 'A quiet, uneventful week of routine maintenance.', money: 0, wellbeing: 0 },
  { type: 'neutral', description: 'Spent the weekend on simple, healthy leisure.', money: 0, wellbeing: 1 },
  { type: 'neutral', description: 'You kept your commitments and upheld structure.', money: 0, wellbeing: 0 },
];

export const APARTMENT_TIERS: FastLaneApartmentTier[] = [
  { id: 1, name: 'Temporary Living', cost: 0, rent: 100, wellbeingBonus: 0, timeCost: 5, details: 'Basic shared living. High rent risk.' },
  { id: 2, name: 'Stable Rental', cost: 5000, rent: 75, wellbeingBonus: 5, timeCost: 4, details: 'Your own space. Reduced rent risk.' },
  { id: 3, name: 'Permanent Residence', cost: 25000, rent: 0, wellbeingBonus: 10, timeCost: 3, details: 'Owned home. Zero rent and maximum stability.' },
];

// "Technical Role" -> Engineer (job id 5); "Leadership Role" -> General
// Manager (job id 6) — see FastLaneGoals.careerJobId doc comment in types.ts.
export const DIFFICULTY_LEVELS: Record<FastLaneDifficultyKey, FastLaneDifficulty> = {
  EASY: {
    name: 'Stabilization',
    playerStartMoney: 1500,
    playerStartJob: 1,
    goals: { wealth: 150000, careerJobId: 5 },
    rivalAdvantage: 0,
  },
  NORMAL: {
    name: 'Maintenance',
    playerStartMoney: 500,
    playerStartJob: 1,
    goals: { wealth: 250000, careerJobId: 6 },
    rivalAdvantage: 1,
  },
  HARD: {
    name: 'Thriving',
    playerStartMoney: 100,
    playerStartJob: 1,
    playerStartDebt: 500,
    goals: { wealth: 500000, careerJobId: 6 },
    rivalAdvantage: 2,
  },
};

export const RIVAL_NAME = 'Casey';

export const SUPPORT_MEETING_TIME_COST = 3;
export const SUPPORT_MEETING_STRESS_REDUCTION = 20;
export const SUPPORT_MEETING_WELLBEING_BOOST = 5;

export const SHADY_GIG_TIME_COST = 15;
export const SHADY_GIG_MONEY = 1500;
export const SHADY_GIG_STRESS_GAIN = 30;
export const SHADY_GIG_WELLBEING_LOSS = 10;
