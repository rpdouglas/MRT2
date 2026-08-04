import type { Timestamp } from 'firebase/firestore';

interface ROSCDomainScore {
  score: number;
  selfReportedScore: number;
  evidenceCount: number;
}

export interface ROSCScore {
  health: ROSCDomainScore;
  home: ROSCDomainScore;
  purpose: ROSCDomainScore;
  community: ROSCDomainScore;
}

export type ROSCTrajectory = 'Improving' | 'Stable' | 'Declining' | 'Insufficient Data';

export interface ROSCAssessment {
  id?: string;
  uid: string;
  createdAt: Timestamp;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  scores: ROSCScore;
  totalScore: number;
  trajectory: ROSCTrajectory;
  journalEntriesAnalysed: number;
  encryptedAIContext: string;
}

export interface ROSCCheckInAnswers {
  health: number;
  home: number;
  purpose: number;
  community: number;
  resilience: number;
}
