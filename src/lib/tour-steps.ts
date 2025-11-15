
import type { TourStepConfig } from '@/context/tour-context';

export const facultyTourSteps: TourStepConfig[] = [
  {
    id: 'tour-step-1',
    title: 'Your Credit Balance',
    content: 'This is your overall credit score. It’s the sum of all positive and negative credits you’ve received over time.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'tour-step-2',
    title: 'Yearly Performance',
    content: 'These cards show you the points you’ve gained from "Good Works" and lost from "Negative Remarks" in the current academic year.',
    side: 'bottom',
    align: 'center',
  },
  {
    id: 'tour-step-3',
    title: 'Performance Charts',
    content: 'Visualize your credit trends. Track your net credit change and compare positive versus negative points each month.',
    side: 'top',
    align: 'center',
  },
  {
    id: 'tour-step-4',
    title: 'Recent Activity',
    content: 'This table shows your most recent submissions and remarks, keeping you up-to-date with all your activities.',
    side: 'top',
    align: 'center',
  },
];
