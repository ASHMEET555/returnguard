import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ReturnGuardClient, type ClientOptions } from '@returnguard/sdk';

export interface MerchantDashboardConfig {
  brandTitle?: string;
  merchantName?: string;
  currency?: string;
  workspaces?: string[];
  layout?: 'tabs' | 'sidebar' | 'stacked';
  showAttribution?: boolean;
  onReviewAction?: (decisionId: string, action: 'APPROVE' | 'REJECT', notes?: string) => Promise<void> | void;
}

export interface ReturnGuardContextValue {
  client: ReturnGuardClient;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  currency: string;
  setCurrency: (currency: string) => void;
  dateRange: string;
  setDateRange: (range: string) => void;
  configuration?: MerchantDashboardConfig;
}

const ReturnGuardContext = createContext<ReturnGuardContextValue | null>(null);

export interface ReturnGuardProviderProps {
  client?: ReturnGuardClient;
  clientOptions?: ClientOptions;
  configuration?: MerchantDashboardConfig;
  defaultTheme?: 'dark' | 'light';
  defaultCurrency?: string;
  children: React.ReactNode;
}

export const ReturnGuardProvider: React.FC<ReturnGuardProviderProps> = ({
  client,
  clientOptions,
  configuration,
  defaultTheme = 'dark',
  defaultCurrency = 'USD',
  children,
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(defaultTheme);
  const [currency, setCurrency] = useState<string>(configuration?.currency || defaultCurrency);
  const [dateRange, setDateRange] = useState<string>('30d');

  const resolvedClient = useMemo(() => {
    if (client) return client;
    if (clientOptions) return new ReturnGuardClient(clientOptions);
    throw new Error('ReturnGuardProvider requires either a "client" or "clientOptions" prop.');
  }, [client, clientOptions]);

  useEffect(() => {
    document.documentElement.setAttribute('data-rg-theme', theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      client: resolvedClient,
      theme,
      setTheme,
      currency,
      setCurrency,
      dateRange,
      setDateRange,
      configuration,
    }),
    [resolvedClient, theme, currency, dateRange, configuration]
  );

  return (
    <ReturnGuardContext.Provider value={value}>
      <div className={`rg-root rg-theme-${theme}`}>{children}</div>
    </ReturnGuardContext.Provider>
  );
};

export function useReturnGuard(): ReturnGuardContextValue {
  const context = useContext(ReturnGuardContext);
  if (!context) {
    throw new Error('useReturnGuard must be used within a ReturnGuardProvider');
  }
  return context;
}
