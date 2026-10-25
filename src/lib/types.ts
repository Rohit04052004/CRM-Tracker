export type CrmRecord = {
  id: string;
  campaignId: string; // raw campaign/cohort identifier string, e.g. "10_Oct_0000_BFF_HMM_MCW_SF_FX_T2_MS_Y_2_A"
  date: string | null; // ISO yyyy-mm-dd when mapped from a real date column, otherwise a short "7-Oct" label parsed from the identifier (no year available), otherwise null
  slotTime: string | null; // "HH:MM" 24h release time, when derivable
  cohort: string; // audience cohort, e.g. HMM, HMW, Rest, VIPPM
  brand: string; // brand / category, e.g. MCW, WWW, Watc, SF, BPC, Jewe
  dispatched: number;
  received: number;
  blocked: number;
  capped: number;
  opens: number;
  sessions: number;
  revenue: number;
};
