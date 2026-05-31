'use client';

import { ReactNode } from 'react';

interface EmptyProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export default function Empty({
  icon,
  title = 'No data',
  message,
  action,
  className = '',
}: EmptyProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-muted-foreground mb-1">{title}</h3>
      {message && (
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">{message}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
