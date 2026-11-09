import React from 'react';

export interface IconProps {
  size?: 14 | 16 | 18 | 20 | number;
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
}

function resolveAccessibility(props: IconProps) {
  const hasLabel = Boolean(props['aria-label']);
  return {
    role: hasLabel ? 'img' : undefined,
    'aria-hidden': hasLabel ? undefined : (props['aria-hidden'] ?? true),
  };
}

/**
 * 1. OverviewIcon (Layout Dashboard)
 * Used in sidebar navigation for OverviewPage.
 */
export const OverviewIcon: React.FC<IconProps> = ({
  size = 18,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

/**
 * 2. TransactionsIcon (Credit Card / Payment Record)
 * Used in sidebar navigation and transaction tables.
 */
export const TransactionsIcon: React.FC<IconProps> = ({
  size = 18,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="15" x2="10" y2="15" />
  </svg>
);

/**
 * 3. CustomersIcon (Users)
 * Used in sidebar navigation for CustomersPage.
 */
export const CustomersIcon: React.FC<IconProps> = ({
  size = 18,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/**
 * 4. AnalyticsIcon (Trending Chart)
 * Used in sidebar navigation for RiskAnalyticsPage.
 */
export const AnalyticsIcon: React.FC<IconProps> = ({
  size = 18,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

/**
 * 5. RulesIcon (Shield Check)
 * Used in sidebar navigation for RulesPage.
 */
export const RulesIcon: React.FC<IconProps> = ({
  size = 18,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/**
 * 6. ModelsIcon (CPU / Machine Learning Engine)
 * Used in sidebar navigation for ModelsPage.
 */
export const ModelsIcon: React.FC<IconProps> = ({
  size = 18,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 1v3" />
    <path d="M15 1v3" />
    <path d="M9 20v3" />
    <path d="M15 20v3" />
    <path d="M20 9h3" />
    <path d="M20 14h3" />
    <path d="M1 9h3" />
    <path d="M1 14h3" />
  </svg>
);

/**
 * 7. PipelineIcon (Git Fork / Payment Gateway Flow)
 * Used in sidebar navigation for PaymentPipelinePage.
 */
export const PipelineIcon: React.FC<IconProps> = ({
  size = 18,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <circle cx="12" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" />
    <path d="M12 12v3" />
  </svg>
);

/**
 * 8. ReviewsIcon (Bell / Queue Alerts)
 * Used in sidebar navigation for ReviewsPage.
 */
export const ReviewsIcon: React.FC<IconProps> = ({
  size = 18,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

/**
 * 9. ReportsIcon (File Text / Compliance Reports)
 * Used in sidebar navigation for ReportsPage.
 */
export const ReportsIcon: React.FC<IconProps> = ({
  size = 18,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

/**
 * 10. ShieldIcon (Brand Logo)
 * Used in DashboardShell header brand identity.
 */
export const ShieldIcon: React.FC<IconProps> = ({
  size = 20,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/**
 * 11. SunIcon
 * Used in theme toggler for light mode.
 */
export const SunIcon: React.FC<IconProps> = ({
  size = 16,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

/**
 * 12. MoonIcon
 * Used in theme toggler for dark mode.
 */
export const MoonIcon: React.FC<IconProps> = ({
  size = 16,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

/**
 * 13. SearchIcon
 * Used in TransactionsPage search toolbar.
 */
export const SearchIcon: React.FC<IconProps> = ({
  size = 16,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/**
 * 14. RefreshIcon
 * Used for refresh queue and reload actions.
 */
export const RefreshIcon: React.FC<IconProps> = ({
  size = 16,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <path d="M21.5 2v6h-6" />
    <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

/**
 * 15. CloseIcon
 * Used in DetailDrawer and modal close buttons.
 */
export const CloseIcon: React.FC<IconProps> = ({
  size = 16,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * 16. InfoIcon
 * Used in fixed notice tooltips and informational badges.
 */
export const InfoIcon: React.FC<IconProps> = ({
  size = 14,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/**
 * 17. DownloadIcon
 * Used in ReportsPage for CSV dataset downloads.
 */
export const DownloadIcon: React.FC<IconProps> = ({
  size = 16,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/**
 * 18. AlertTriangleIcon
 * Used in Overview KPI cards, risk warnings, and flagged transaction indicators.
 */
export const AlertTriangleIcon: React.FC<IconProps> = ({
  size = 16,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/**
 * 19. LockIcon
 * Used in Rules security and immutability notice.
 */
export const LockIcon: React.FC<IconProps> = ({
  size = 14,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/**
 * 20. ChevronRightIcon
 * Used in pagination and sequential navigation buttons.
 */
export const ChevronRightIcon: React.FC<IconProps> = ({
  size = 14,
  className = '',
  style,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`rg-icon rg-icon-${size} ${className}`}
    style={style}
    {...resolveAccessibility(props)}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

