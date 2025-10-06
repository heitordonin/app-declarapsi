import { FrequencyType } from "@/types/database";

export const FREQUENCY_CONFIG = {
  weekly: { label: 'Semanal', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' },
  monthly: { label: 'Mensal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' },
  annual: { label: 'Anual', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' }
} as const;

export const getFrequencyLabel = (freq: FrequencyType) => 
  FREQUENCY_CONFIG[freq].label;

export const getFrequencyColor = (freq: FrequencyType) => 
  FREQUENCY_CONFIG[freq].color;
