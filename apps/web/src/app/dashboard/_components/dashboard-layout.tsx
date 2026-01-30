'use client';

import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <div className="space-y-6">
      {(title || description) && (
        <div>
          {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
