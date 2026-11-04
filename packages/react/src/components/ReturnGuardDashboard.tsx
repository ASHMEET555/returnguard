import React, { useState } from 'react';
import { DashboardShell } from './DashboardShell';
import { OverviewPage } from './OverviewPage';
import { TransactionsPage } from './TransactionsPage';
import { CustomersPage } from './CustomersPage';
import { RiskAnalyticsPage } from './RiskAnalyticsPage';
import { RulesPage } from './RulesPage';
import { ModelsPage } from './ModelsPage';
import { PaymentPipelinePage } from './PaymentPipelinePage';
import { ReviewsPage } from './ReviewsPage';
import { ReportsPage } from './ReportsPage';

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
      {currentTab === 'analytics' && <RiskAnalyticsPage />}
      {currentTab === 'rules' && <RulesPage />}
      {currentTab === 'models' && <ModelsPage />}
      {currentTab === 'pipeline' && <PaymentPipelinePage />}
      {currentTab === 'reviews' && <ReviewsPage />}
      {currentTab === 'reports' && <ReportsPage />}
    </DashboardShell>
  );
};
