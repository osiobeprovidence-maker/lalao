export type DatingGoalId =
  | 'long_term'
  | 'marriage'
  | 'casual'
  | 'short_term'
  | 'friendship_first'
  | 'open';

export interface DatingGoalOption {
  id: DatingGoalId;
  label: string;
  badgeLabel: string;
  description: string;
}

export const DATING_GOAL_OPTIONS: DatingGoalOption[] = [
  {
    id: 'long_term',
    label: 'Long-term relationship',
    badgeLabel: 'Long-term',
    description: 'Looking for a committed relationship with a future in mind.',
  },
  {
    id: 'marriage',
    label: 'Marriage',
    badgeLabel: 'Marriage',
    description: 'Looking for a partner with the intention of marriage.',
  },
  {
    id: 'casual',
    label: 'Casual dating',
    badgeLabel: 'Casual dating',
    description: 'Interested in dating without an immediate commitment.',
  },
  {
    id: 'short_term',
    label: 'Short-term relationship',
    badgeLabel: 'Short-term',
    description: 'Looking for a relationship that is not necessarily intended to be permanent.',
  },
  {
    id: 'friendship_first',
    label: 'Friendship first',
    badgeLabel: 'Friendship first',
    description: 'Prefer to build a friendship before considering a romantic relationship.',
  },
  {
    id: 'open',
    label: 'Open to exploring',
    badgeLabel: 'Open to exploring',
    description: 'Still figuring out what kind of connection feels right.',
  },
];

export const getDatingGoalOption = (id?: string | null): DatingGoalOption => {
  const found = DATING_GOAL_OPTIONS.find((opt) => opt.id === id);
  return (
    found || {
      id: 'long_term',
      label: 'Long-term relationship',
      badgeLabel: 'Long-term',
      description: 'Looking for a committed relationship with a future in mind.',
    }
  );
};
