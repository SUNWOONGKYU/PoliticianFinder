// StatusBadge Component - 정치인 신분 뱃지

import { PoliticianStatus } from '@/types';
import { STATUS_STYLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: PoliticianStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
        STATUS_STYLES[status],
        className
      )}
    >
      {status}
    </span>
  );
}
