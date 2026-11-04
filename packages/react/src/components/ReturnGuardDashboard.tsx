import React, { useState } from 'react';
import { DashboardShell } from './DashboardShell';
import { OverviewPage } from './OverviewPage';
import { TransactionsPage } from './TransactionsPage';
import { CustomersPage } from './CustomersPage';

export interface ReturnGuardDashboardProps {
  initialTab?: string;
  brandTitle?: string;
}

export const ReturnGuardDashboard: React.FC<ReturnGuardDashboardProps> = ({
  initialTab = 'overview',
  brandTitle = 'ReturnGuard',
}) => {
  const [currentTab, setCurrentTab] = useState<string>(initialTab);

  return (
    <DashboardShell currentTab={currentTab} onTabChange={setCurrentTab} brandTitle={brandTitle}>
      {currentTab === 'overview' && <OverviewPage />}
      {currentTab === 'transactions' && <TransactionsPage />}
      {currentTab === 'customers' && <CustomersPage />}
    </DashboardShell>
  );
};
