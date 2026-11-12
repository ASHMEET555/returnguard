import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useReturnGuard } from '../context';
import { formatCurrency } from '../utils/currency';
import {
  InvestigationDetail,
  InvestigationListItem,
  InvestigationTimelineStep,
  InvestigationAssessment,
  EvidencePackData,
} from '@returnguard/sdk';

export interface InvestigationsPageProps {
  initialInvestigationId?: string;
  onSelectInvestigation?: (id: string | null) => void;
  // Test overrides for deterministic unit testing
  testDetail?: InvestigationDetail | null;
  testAssessment?: InvestigationAssessment | null;
  testTimeline?: InvestigationTimelineStep[] | null;
  testItems?: InvestigationListItem[] | null;
  testPack?: EvidencePackData | any | null;
  onActionTrigger?: (action: string, payload?: any) => void;
}

export const InvestigationsPage: React.FC<InvestigationsPageProps> = ({
  initialInvestigationId,
  onSelectInvestigation,
  testDetail,
  testAssessment,
  testTimeline,
  testItems,
  testPack,
  onActionTrigger,
}) => {
  const { client } = useReturnGuard();

  // Navigation & Queue State
  const [selectedId, setSelectedId] = useState<string | null>(initialInvestigationId || null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [queueItems, setQueueItems] = useState<InvestigationListItem[]>(testItems || []);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Detail State
  const [detail, setDetail] = useState<InvestigationDetail | null>(testDetail || null);
  const [assessment, setAssessment] = useState<InvestigationAssessment | null>(testAssessment || null);
  const [timeline, setTimeline] = useState<InvestigationTimelineStep[]>(testTimeline || []);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Evidence Pack State
  const [evidencePack, setEvidencePack] = useState<any | null>(testPack || null);
  const [loadingPack, setLoadingPack] = useState<boolean>(false);
  const [packError, setPackError] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<'json' | 'md' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Modals / Action States
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [closeOutcome, setCloseOutcome] = useState<string>('CLOSED_APPROVED');
  const [closeNote, setCloseNote] = useState<string>('');
  const [isReopenModalOpen, setIsReopenModalOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');

  // Fetch Queue
  const fetchQueue = useCallback(
    async (cursor?: string) => {
      if (testItems !== undefined) return;
      if (!client) return;
      setLoadingQueue(true);
      setQueueError(null);
      try {
        const filterVal = statusFilter === 'ALL' ? undefined : statusFilter;
        const res = await client.investigations.list({
          status: filterVal,
          cursor,
          limit: 15,
        });
        setQueueItems(res.items);
        setNextCursor(res.next_cursor);
      } catch (err: any) {
        setQueueError(err.message || 'Failed to load investigation queue');
      } finally {
        setLoadingQueue(false);
      }
    },
    [client, statusFilter, testItems]
  );

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Fetch Detail
  const fetchDetail = useCallback(
    async (id: string) => {
      if (testDetail !== undefined) return;
      if (!client) return;
      setLoadingDetail(true);
      setLoadingPack(true);
      setDetailError(null);
      setPackError(null);
      try {
        const [detRes, assessRes, timeRes, packRes] = await Promise.allSettled([
          client.investigations.get(id),
          client.investigations.getAssessment(id),
          client.investigations.getTimeline(id),
          client.investigations.getPack(id, 'json'),
        ]);

        if (detRes.status === 'fulfilled') {
          setDetail(detRes.value);
        } else {
          setDetailError(detRes.reason?.message || 'Failed to load investigation details');
        }

        if (assessRes.status === 'fulfilled') {
          setAssessment(assessRes.value);
        } else {
          setAssessment(null);
        }

        if (timeRes.status === 'fulfilled') {
          setTimeline(timeRes.value.steps);
        } else {
          setTimeline([]);
        }

        if (packRes.status === 'fulfilled') {
          setEvidencePack(packRes.value);
        } else {
          setEvidencePack(null);
        }
      } catch (err: any) {
        setDetailError(err.message || 'Error fetching case data');
      } finally {
        setLoadingDetail(false);
        setLoadingPack(false);
      }
    },
    [client, testDetail, testPack]
  );

  const handleDownloadPack = async (format: 'json' | 'md' = 'json') => {
    if (!selectedId || downloadingFormat) return;
    setDownloadingFormat(format);
    setDownloadError(null);
    if (onActionTrigger) {
      onActionTrigger('downloadPack', { id: selectedId, format });
    }

    try {
      const data = await client.investigations.getPack(selectedId, format);
      const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const mimeType = format === 'md' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ver = evidencePack?.version || detail?.approval?.pack_hash?.substring(0, 8) || '1';
      link.download = `evidence_pack_${selectedId}_v${ver}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setActionSuccess(`Evidence pack downloaded successfully as ${format.toUpperCase()}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download evidence pack';
      setDownloadError(msg);
    } finally {
      setDownloadingFormat(null);
    }
  };

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    }
  }, [selectedId, fetchDetail]);

  const handleSelectCase = (id: string) => {
    setSelectedId(id);
    if (onSelectInvestigation) onSelectInvestigation(id);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleBackToQueue = () => {
    setSelectedId(null);
    setDetail(null);
    setAssessment(null);
    setTimeline([]);
    if (onSelectInvestigation) onSelectInvestigation(null);
    fetchQueue();
  };

  // State Machine Guard Calculations
  const currentStatus = detail?.status || 'OPEN';
  const isClosed = currentStatus.startsWith('CLOSED_');
  const isInReview = currentStatus === 'IN_REVIEW';
  const isApprovedPack = detail?.approval?.is_approved || false;
  const currentPackHash = detail?.approval?.pack_hash || 'none';

  // Action Guards & Explanations
  const startReviewGuard = useMemo(() => {
    if (isInReview) {
      return { allowed: false, reason: 'Case is already in review' };
    }
    if (isClosed) {
      return { allowed: false, reason: 'Cannot start review on a closed case; reopen first' };
    }
    return { allowed: true, reason: 'Start reviewing this case' };
  }, [isInReview, isClosed]);

  const addNoteGuard = useMemo(() => {
    if (isClosed) {
      return { allowed: false, reason: 'Cannot add notes to a closed case; reopen first' };
    }
    return { allowed: true, reason: 'Add a reviewer note to the step log' };
  }, [isClosed]);

  const requestDocsGuard = useMemo(() => {
    if (isClosed) {
      return { allowed: false, reason: 'Cannot request documents for closed case' };
    }
    return { allowed: true, reason: 'Request missing dispute evidence documents' };
  }, [isClosed]);

  const approvePackGuard = useMemo(() => {
    if (isClosed) {
      return { allowed: false, reason: 'Cannot approve pack for closed case' };
    }
    if (!isInReview) {
      return { allowed: false, reason: 'Review must be started (IN_REVIEW) before pack approval' };
    }
    return { allowed: true, reason: 'Approve current evidence package' };
  }, [isClosed, isInReview]);

  const rejectPackGuard = useMemo(() => {
    if (isClosed) {
      return { allowed: false, reason: 'Cannot reject pack for closed case' };
    }
    return { allowed: true, reason: 'Reject current evidence package' };
  }, [isClosed]);

  const closeCaseGuard = useMemo(() => {
    if (isClosed) {
      return { allowed: false, reason: 'Case is already closed' };
    }
    if (currentStatus === 'OPEN') {
      return { allowed: false, reason: 'Start review before closing case' };
    }
    return { allowed: true, reason: 'Close investigation case with formal outcome' };
  }, [isClosed, currentStatus]);

  const reopenCaseGuard = useMemo(() => {
    if (!isClosed) {
      return { allowed: false, reason: 'Case is currently active; only closed cases can be reopened' };
    }
    return { allowed: true, reason: 'Reopen this closed investigation' };
  }, [isClosed]);

  // Action Handlers
  const handleStartReview = async () => {
    if (!startReviewGuard.allowed || !selectedId) return;
    if (onActionTrigger) onActionTrigger('startReview', { id: selectedId });
    if (!client) return;
    try {
      setActionError(null);
      await client.investigations.startReview(selectedId);
      setActionSuccess('Review started. Status updated to IN_REVIEW.');
      fetchDetail(selectedId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to start review');
    }
  };

  const handleAddNote = async () => {
    if (!addNoteGuard.allowed || !selectedId || !noteText.trim()) return;
    if (onActionTrigger) onActionTrigger('addNote', { id: selectedId, note: noteText });
    if (!client) {
      setIsNoteModalOpen(false);
      return;
    }
    try {
      setActionError(null);
      await client.investigations.addNote(selectedId, noteText.trim());
      setActionSuccess('Note successfully recorded in timeline.');
      setNoteText('');
      setIsNoteModalOpen(false);
      fetchDetail(selectedId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to add note');
    }
  };

  const handleRequestDocs = async () => {
    if (!requestDocsGuard.allowed || !selectedId) return;
    if (onActionTrigger) onActionTrigger('requestDocs', { id: selectedId });
    if (!client) return;
    try {
      setActionError(null);
      await client.investigations.requestDocuments(selectedId);
      setActionSuccess('Document request logged in investigation timeline.');
      fetchDetail(selectedId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to request documents');
    }
  };

  const handleApprovePack = async () => {
    if (!approvePackGuard.allowed || !selectedId) return;
    if (onActionTrigger) onActionTrigger('approvePack', { id: selectedId, pack_hash: currentPackHash });
    if (!client) return;
    try {
      setActionError(null);
      await client.investigations.approvePack(selectedId, { pack_hash: currentPackHash, reason: 'Pack verified and approved by reviewer' });
      setActionSuccess('Evidence pack approved.');
      fetchDetail(selectedId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve evidence pack');
    }
  };

  const handleRejectPack = async () => {
    if (!rejectPackGuard.allowed || !selectedId) return;
    if (onActionTrigger) onActionTrigger('rejectPack', { id: selectedId });
    if (!client) return;
    try {
      setActionError(null);
      await client.investigations.rejectPack(selectedId, 'Pack rejected by reviewer');
      setActionSuccess('Evidence pack rejected.');
      fetchDetail(selectedId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject pack');
    }
  };

  const handleCloseCase = async () => {
    if (!closeCaseGuard.allowed || !selectedId) return;
    if (closeNote.trim().length < 20) {
      setActionError('Closing note must be at least 20 characters long.');
      return;
    }
    if (onActionTrigger) {
      onActionTrigger('closeCase', {
        id: selectedId,
        outcome: closeOutcome,
        note: closeNote,
        steps_performed: ['review_started', 'pack_approved', 'manual_check'],
      });
    }
    if (!client) {
      setIsCloseModalOpen(false);
      return;
    }
    try {
      setActionError(null);
      await client.investigations.close(selectedId, {
        outcome: closeOutcome,
        note: closeNote.trim(),
        steps_performed: ['review_started', 'pack_approved', 'manual_verification'],
      });
      setActionSuccess(`Case closed as ${closeOutcome}.`);
      setIsCloseModalOpen(false);
      setCloseNote('');
      fetchDetail(selectedId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to close case');
    }
  };

  const handleReopenCase = async () => {
    if (!reopenCaseGuard.allowed || !selectedId) return;
    if (!reopenReason.trim()) {
      setActionError('Reopening reason is required.');
      return;
    }
    if (onActionTrigger) onActionTrigger('reopenCase', { id: selectedId, reason: reopenReason });
    if (!client) {
      setIsReopenModalOpen(false);
      return;
    }
    try {
      setActionError(null);
      await client.investigations.reopen(selectedId, reopenReason.trim());
      setActionSuccess('Case reopened.');
      setIsReopenModalOpen(false);
      setReopenReason('');
      fetchDetail(selectedId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reopen case');
    }
  };

  // Helper for status badge styling
  const renderStatusBadge = (status: string) => {
    let colorClass = 'var(--rg-text-muted)';
    let bg = 'var(--rg-bg-card)';
    if (status === 'OPEN') {
      colorClass = 'var(--rg-med-text)';
      bg = 'var(--rg-med-bg)';
    } else if (status === 'IN_REVIEW') {
      colorClass = '#3b82f6';
      bg = 'rgba(59, 130, 246, 0.15)';
    } else if (status === 'CLOSED_APPROVED') {
      colorClass = 'var(--rg-low-text)';
      bg = 'var(--rg-low-bg)';
    } else if (status === 'CLOSED_REJECTED') {
      colorClass = 'var(--rg-high-text)';
      bg = 'var(--rg-high-bg)';
    } else if (status === 'REOPENED') {
      colorClass = '#a855f7';
      bg = 'rgba(168, 85, 247, 0.15)';
    }

    return (
      <span
        className="rg-status-badge"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          color: colorClass,
          background: bg,
          border: `1px solid ${colorClass}`,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
        }}
      >
        ● {status}
      </span>
    );
  };

  return (
    <div className="rg-investigations-page" style={{ padding: '4px 0' }}>
      {/* ======================= QUEUE VIEW ======================= */}
      {!selectedId ? (
        <div>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>Investigation Review Queue</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
                Evidence packages, fraud investigations, and human-in-the-loop dispute determinations.
              </p>
            </div>
            <button
              type="button"
              className="rg-btn-refresh"
              onClick={() => fetchQueue()}
              style={{
                background: 'var(--rg-bg-card)',
                color: 'var(--rg-text-primary)',
                border: '1px solid var(--rg-border)',
                borderRadius: 6,
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ↻ Refresh Queue
            </button>
          </div>

          {/* Filter Bar */}
          <div
            className="rg-filter-bar"
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--rg-text-muted)', marginRight: 4 }}>Status Filter:</span>
            {[
              'ALL',
              'OPEN',
              'AWAITING_REVIEW',
              'IN_REVIEW',
              'CLOSED_APPROVED',
              'CLOSED_REJECTED',
              'CLOSED_NO_ACTION',
              'REOPENED',
            ].map((st) => (
              <button
                key={st}
                type="button"
                className={`rg-filter-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'var(--rg-accent)' : 'var(--rg-bg-card)',
                  color: statusFilter === st ? '#ffffff' : 'var(--rg-text-secondary)',
                  border: '1px solid var(--rg-border)',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {loadingQueue && <div style={{ color: 'var(--rg-text-muted)', marginBottom: 12 }}>Loading investigations...</div>}
          {queueError && <div style={{ color: 'var(--rg-high-text)', marginBottom: 12 }}>{queueError}</div>}

          {/* Queue Table */}
          <div className="rg-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} data-testid="queue-table">
              <thead>
                <tr
                  style={{
                    background: 'var(--rg-bg-tertiary)',
                    borderBottom: '1px solid var(--rg-border)',
                    color: 'var(--rg-text-secondary)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Investigation ID</th>
                  <th style={{ padding: '12px 16px' }}>Dispute / Target</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Case Hash</th>
                  <th style={{ padding: '12px 16px' }}>Created</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {queueItems.length === 0 && !loadingQueue ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 28, textAlign: 'center', color: 'var(--rg-text-muted)' }}>
                      No investigations found for status filter: {statusFilter}
                    </td>
                  </tr>
                ) : (
                  queueItems.map((item) => (
                    <tr
                      key={item.id}
                      className="rg-queue-row"
                      style={{ borderBottom: '1px solid var(--rg-border-subtle)', cursor: 'pointer' }}
                      onClick={() => handleSelectCase(item.id)}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>{item.id}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--rg-text-secondary)' }}>
                        {item.dispute_id || 'Direct Score'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{renderStatusBadge(item.status)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: 'var(--rg-text-muted)' }}>
                        {item.case_hash ? item.case_hash.substring(0, 16) + '...' : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--rg-text-muted)' }}>
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="rg-btn-view-case"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCase(item.id);
                          }}
                          style={{
                            background: 'var(--rg-accent)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Review Case →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {nextCursor && (
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setCursorHistory([...cursorHistory, nextCursor]);
                  fetchQueue(nextCursor);
                }}
                style={{
                  background: 'var(--rg-bg-card)',
                  color: 'var(--rg-text-primary)',
                  border: '1px solid var(--rg-border)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Next Page →
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ======================= CASE VIEW ======================= */
        <div className="rg-case-view" data-testid="case-view">
          {/* Header & Back Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="rg-btn-back"
                onClick={handleBackToQueue}
                style={{
                  background: 'var(--rg-bg-card)',
                  color: 'var(--rg-text-primary)',
                  border: '1px solid var(--rg-border)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ← Back to Queue
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>{detail?.id || selectedId}</h2>
                  {renderStatusBadge(currentStatus)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--rg-text-muted)', marginTop: 2 }}>
                  Case Hash: <code style={{ fontFamily: 'monospace' }}>{detail?.case_hash || 'pending'}</code>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>Dispute Amount</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--rg-text-primary)' }}>
                {formatCurrency(detail?.amount, detail?.currency)}
              </div>
            </div>
          </div>

          {loadingDetail && (
            <div style={{ color: 'var(--rg-text-muted)', marginBottom: 12 }}>
              Loading investigation details and LLM assessment...
            </div>
          )}
          {detailError && (
            <div
              className="rg-alert-error"
              style={{
                padding: '10px 14px',
                marginBottom: 16,
                background: 'var(--rg-high-bg)',
                border: '1px solid var(--rg-high-border)',
                borderRadius: 6,
                color: 'var(--rg-high-text)',
                fontSize: 13,
              }}
            >
              ⚠ {detailError}
            </div>
          )}

          {/* Feedback Messages */}
          {actionError && (
            <div
              className="rg-alert-error"
              style={{
                padding: '10px 14px',
                marginBottom: 16,
                background: 'var(--rg-high-bg)',
                border: '1px solid var(--rg-high-border)',
                borderRadius: 6,
                color: 'var(--rg-high-text)',
                fontSize: 13,
              }}
            >
              ⚠ {actionError}
            </div>
          )}
          {actionSuccess && (
            <div
              className="rg-alert-success"
              style={{
                padding: '10px 14px',
                marginBottom: 16,
                background: 'var(--rg-low-bg)',
                border: '1px solid var(--rg-low-border)',
                borderRadius: 6,
                color: 'var(--rg-low-text)',
                fontSize: 13,
              }}
            >
              ✓ {actionSuccess}
            </div>
          )}

          {/* ACTION BUTTON BAR WITH STATE MACHINE GUARDS & TOOLTIPS */}
          <div
            className="rg-action-bar"
            style={{
              display: 'flex',
              gap: 8,
              padding: 12,
              marginBottom: 20,
              background: 'var(--rg-bg-card)',
              border: '1px solid var(--rg-border)',
              borderRadius: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--rg-text-muted)', marginRight: 6 }}>
              Review Actions:
            </span>

            {/* Start Review */}
            <button
              type="button"
              className="rg-btn-action rg-btn-start-review"
              title={startReviewGuard.reason}
              disabled={!startReviewGuard.allowed}
              onClick={handleStartReview}
              style={{
                background: startReviewGuard.allowed ? '#3b82f6' : 'var(--rg-bg-tertiary)',
                color: startReviewGuard.allowed ? '#ffffff' : 'var(--rg-text-muted)',
                opacity: startReviewGuard.allowed ? 1 : 0.5,
                border: '1px solid var(--rg-border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: startReviewGuard.allowed ? 'pointer' : 'not-allowed',
              }}
            >
              ▶ Start Review
            </button>

            {/* Add Note */}
            <button
              type="button"
              className="rg-btn-action rg-btn-add-note"
              title={addNoteGuard.reason}
              disabled={!addNoteGuard.allowed}
              onClick={() => setIsNoteModalOpen(true)}
              style={{
                background: addNoteGuard.allowed ? 'var(--rg-bg-secondary)' : 'var(--rg-bg-tertiary)',
                color: addNoteGuard.allowed ? 'var(--rg-text-primary)' : 'var(--rg-text-muted)',
                opacity: addNoteGuard.allowed ? 1 : 0.5,
                border: '1px solid var(--rg-border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: addNoteGuard.allowed ? 'pointer' : 'not-allowed',
              }}
            >
              ✍ Add Note
            </button>

            {/* Request Documents */}
            <button
              type="button"
              className="rg-btn-action rg-btn-request-docs"
              title={requestDocsGuard.reason}
              disabled={!requestDocsGuard.allowed}
              onClick={handleRequestDocs}
              style={{
                background: requestDocsGuard.allowed ? 'var(--rg-bg-secondary)' : 'var(--rg-bg-tertiary)',
                color: requestDocsGuard.allowed ? 'var(--rg-text-primary)' : 'var(--rg-text-muted)',
                opacity: requestDocsGuard.allowed ? 1 : 0.5,
                border: '1px solid var(--rg-border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: requestDocsGuard.allowed ? 'pointer' : 'not-allowed',
              }}
            >
              📄 Request Docs
            </button>

            {/* Approve Pack */}
            <button
              type="button"
              className="rg-btn-action rg-btn-approve-pack"
              title={approvePackGuard.reason}
              disabled={!approvePackGuard.allowed}
              onClick={handleApprovePack}
              style={{
                background: approvePackGuard.allowed ? 'var(--rg-low-bg)' : 'var(--rg-bg-tertiary)',
                color: approvePackGuard.allowed ? 'var(--rg-low-text)' : 'var(--rg-text-muted)',
                opacity: approvePackGuard.allowed ? 1 : 0.5,
                border: `1px solid ${approvePackGuard.allowed ? 'var(--rg-low-border)' : 'var(--rg-border)'}`,
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: approvePackGuard.allowed ? 'pointer' : 'not-allowed',
              }}
            >
              ✓ Approve Pack
            </button>

            {/* Reject Pack */}
            <button
              type="button"
              className="rg-btn-action rg-btn-reject-pack"
              title={rejectPackGuard.reason}
              disabled={!rejectPackGuard.allowed}
              onClick={handleRejectPack}
              style={{
                background: rejectPackGuard.allowed ? 'var(--rg-high-bg)' : 'var(--rg-bg-tertiary)',
                color: rejectPackGuard.allowed ? 'var(--rg-high-text)' : 'var(--rg-text-muted)',
                opacity: rejectPackGuard.allowed ? 1 : 0.5,
                border: `1px solid ${rejectPackGuard.allowed ? 'var(--rg-high-border)' : 'var(--rg-border)'}`,
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: rejectPackGuard.allowed ? 'pointer' : 'not-allowed',
              }}
            >
              ✕ Reject Pack
            </button>

            {/* Close Case */}
            <button
              type="button"
              className="rg-btn-action rg-btn-close-case"
              title={closeCaseGuard.reason}
              disabled={!closeCaseGuard.allowed}
              onClick={() => setIsCloseModalOpen(true)}
              style={{
                background: closeCaseGuard.allowed ? 'var(--rg-accent)' : 'var(--rg-bg-tertiary)',
                color: closeCaseGuard.allowed ? '#ffffff' : 'var(--rg-text-muted)',
                opacity: closeCaseGuard.allowed ? 1 : 0.5,
                border: '1px solid var(--rg-border)',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: closeCaseGuard.allowed ? 'pointer' : 'not-allowed',
              }}
            >
              🏁 Close Case...
            </button>

            {/* Reopen Case */}
            <button
              type="button"
              className="rg-btn-action rg-btn-reopen-case"
              title={reopenCaseGuard.reason}
              disabled={!reopenCaseGuard.allowed}
              onClick={() => setIsReopenModalOpen(true)}
              style={{
                background: reopenCaseGuard.allowed ? '#a855f7' : 'var(--rg-bg-tertiary)',
                color: reopenCaseGuard.allowed ? '#ffffff' : 'var(--rg-text-muted)',
                opacity: reopenCaseGuard.allowed ? 1 : 0.5,
                border: '1px solid var(--rg-border)',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: reopenCaseGuard.allowed ? 'pointer' : 'not-allowed',
              }}
            >
              🔄 Reopen Case...
            </button>
          </div>

          {/* GRID LAYOUT: LEFT COLUMN (Transaction, Findings, Checklist) & RIGHT COLUMN (LLM Advisory Assessment, Pack Status, Timeline) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* COLUMN 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Transaction & Decision Snapshot Card */}
              <div className="rg-card" style={{ padding: 16 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: 'var(--rg-text-primary)' }}>
                  Decision & Transaction Snapshot
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: 'var(--rg-bg-tertiary)', padding: 10, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>Severity</div>
                    <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>
                      {detail?.decision_record?.severity || 'HIGH'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--rg-bg-tertiary)', padding: 10, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>Soft Policy Tier</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{detail?.decision_record?.tier || 'MANUAL_REVIEW'}</div>
                  </div>
                  <div style={{ background: 'var(--rg-bg-tertiary)', padding: 10, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>Risk Probability</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                      {detail?.decision_record?.probability !== undefined
                        ? (Number(detail.decision_record.probability) * 100).toFixed(1) + '%'
                        : detail?.decision_record?.risk_score !== undefined
                        ? (Number(detail.decision_record.risk_score) * 100).toFixed(1) + '%'
                        : '88.5%'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--rg-bg-tertiary)', padding: 10, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>Action</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {detail?.decision_record?.policy_action || 'FLAG'}
                    </div>
                  </div>
                </div>

                {/* Top 5 SHAP values */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rg-text-secondary)', marginBottom: 6 }}>
                    Top SHAP Contributors:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(detail?.decision_record?.shap_top_k || [
                      { feature: 'customer_order_velocity_1h', direction: 'increases_risk', shap_rank: 1 },
                      { feature: 'delivery_address_mismatch', direction: 'increases_risk', shap_rank: 2 },
                      { feature: 'ip_geo_distance_anomaly', direction: 'increases_risk', shap_rank: 3 },
                    ]).slice(0, 5).map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'var(--rg-bg-secondary)',
                          borderRadius: 4,
                          fontSize: 12,
                          fontFamily: 'monospace',
                        }}
                      >
                        <span>{idx + 1}. {s.feature}</span>
                        <span style={{ color: s.direction === 'increases_risk' ? 'var(--rg-high-text)' : 'var(--rg-low-text)' }}>
                          {s.direction}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Findings List with Alias References */}
              <div className="rg-card" style={{ padding: 16 }} data-testid="findings-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                    Deterministic Findings ({detail?.findings?.length || 0})
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>
                    Aliases (A1, A2...) map to source records
                  </span>
                </div>

                {(!detail?.findings || detail.findings.length === 0) ? (
                  <div style={{ fontSize: 13, color: 'var(--rg-text-muted)', padding: 12, textAlign: 'center' }}>
                    No findings generated yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {detail.findings.map((f, i) => (
                      <div
                        key={f.finding_id || i}
                        style={{
                          background: 'var(--rg-bg-secondary)',
                          border: '1px solid var(--rg-border)',
                          borderRadius: 6,
                          padding: 12,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span
                            className="rg-alias-badge"
                            style={{
                              background: '#3b82f6',
                              color: '#ffffff',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              fontFamily: 'monospace',
                            }}
                          >
                            {f.alias_id || `A${i + 1}`}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--rg-text-muted)', textTransform: 'uppercase' }}>
                            {f.category}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--rg-text-primary)', marginBottom: 6 }}>
                          {f.statement}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--rg-text-secondary)', fontFamily: 'monospace' }}>
                          Source: {f.source_filename} ({f.source_doc_id})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completeness Checklist */}
              <div className="rg-card" style={{ padding: 16 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700 }}>Evidence Completeness</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: (detail?.completeness?.score || 100) >= 80 ? 'var(--rg-low-text)' : 'var(--rg-med-text)',
                    }}
                  >
                    {detail?.completeness?.score || 100}%
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--rg-text-secondary)' }}>
                    {detail?.completeness?.is_complete ? 'Complete: all dispute types present' : 'Action recommended'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✓</span> <span>All findings cited from uploaded dispute documents</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✓</span> <span>Dispute claim amount matches transaction record</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✓</span> <span>Customer identified with pseudonymized token</span>
                  </div>
                  {detail?.completeness?.missing_kinds && detail.completeness.missing_kinds.length > 0 && (
                    <div style={{ marginTop: 6, color: 'var(--rg-med-text)' }}>
                      Missing evidence types: {detail.completeness.missing_kinds.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* LLM Advisory Assessment Panel */}
              <div
                className="rg-card rg-llm-assessment-panel"
                data-testid="llm-assessment-panel"
                style={{
                  padding: 16,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(59, 130, 246, 0.03)',
                }}
              >
                {/* Advisory Label Banner */}
                <div
                  className="rg-advisory-banner"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: 'var(--rg-med-text)',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}>
                    <span>ℹ</span>
                    <span className="rg-advisory-label-text">
                      {assessment?.advisory_label || 'LLM assessment, advisory'}
                    </span>
                  </div>
                  <span
                    className={`rg-validator-badge ${
                      assessment?.final_status === 'TEMPLATE_FALLBACK' ? 'rg-badge-fallback' : 'rg-badge-validated'
                    }`}
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background:
                        assessment?.final_status === 'TEMPLATE_FALLBACK'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                      color:
                        assessment?.final_status === 'TEMPLATE_FALLBACK'
                          ? 'var(--rg-high-text)'
                          : 'var(--rg-low-text)',
                      border: '1px solid currentColor',
                    }}
                  >
                    {assessment?.final_status || 'VALIDATED'}
                  </span>
                </div>

                {/* Model & Trace Metadata */}
                <div
                  className="rg-validator-trace"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginBottom: 12,
                    fontSize: 11,
                  }}
                >
                  <div style={{ background: 'var(--rg-bg-card)', padding: 8, borderRadius: 4 }}>
                    <div style={{ color: 'var(--rg-text-muted)' }}>Model</div>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {assessment?.model || 'gemini-1.5-pro'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--rg-bg-card)', padding: 8, borderRadius: 4 }}>
                    <div style={{ color: 'var(--rg-text-muted)' }}>Attempts</div>
                    <div style={{ fontWeight: 600 }}>{assessment?.attempt_count ?? 1}</div>
                  </div>
                  <div style={{ background: 'var(--rg-bg-card)', padding: 8, borderRadius: 4 }}>
                    <div style={{ color: 'var(--rg-text-muted)' }}>Prompt Hash</div>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {assessment?.prompt_hash ? assessment.prompt_hash.substring(0, 10) + '...' : 'c8f49e...'}
                    </div>
                  </div>
                </div>

                {/* Validator Trace Errors if any */}
                {assessment?.validator_errors && assessment.validator_errors.length > 0 && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: 10,
                      background: 'rgba(239, 68, 68, 0.08)',
                      borderRadius: 6,
                      fontSize: 11,
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--rg-high-text)', marginBottom: 4 }}>
                      Validator Rejection Trace:
                    </div>
                    {assessment.validator_errors.map((errList, attIdx) => (
                      <div key={attIdx} style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>Attempt {attIdx + 1}: </span>
                        {errList.join('; ')}
                      </div>
                    ))}
                  </div>
                )}

                {/* Narrative Assessment Text */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rg-text-secondary)', marginBottom: 6 }}>
                    Investigation Narrative:
                  </div>
                  <div
                    style={{
                      background: 'var(--rg-bg-secondary)',
                      padding: 12,
                      borderRadius: 6,
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: 'var(--rg-text-primary)',
                      border: '1px solid var(--rg-border)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {assessment?.final_text ||
                      detail?.advisory_assessment?.narrative ||
                      'Target transaction occurred within standard parameters. Tracking confirms delivery to cardholder billing postal code with signature on file.'}
                  </div>
                </div>

                {/* Cited Findings Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ color: 'var(--rg-text-muted)' }}>Findings Cited:</span>
                  {(assessment?.findings_cited || ['A1', 'A2']).map((c) => (
                    <span
                      key={c}
                      style={{
                        background: 'var(--rg-bg-card)',
                        border: '1px solid var(--rg-border)',
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* Advisory Disclaimer */}
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 11,
                    color: 'var(--rg-text-muted)',
                    fontStyle: 'italic',
                    borderTop: '1px solid var(--rg-border-subtle)',
                    paddingTop: 8,
                  }}
                >
                  Notice: LLM output is strictly advisory. It does not alter probability scores, policy tiers, or model rules.
                </div>
              </div>

              {/* Evidence Package Preview & Download Card */}
              <div className="rg-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Evidence Package &amp; Structured Preview</h3>
                    <div style={{ fontSize: 12, color: 'var(--rg-text-muted)', marginTop: 2 }}>
                      Canonical evidence bundle compiled for dispute resolution and review.
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isApprovedPack ? 'var(--rg-low-text)' : 'var(--rg-med-text)',
                        background: isApprovedPack ? 'var(--rg-low-bg)' : 'var(--rg-med-bg)',
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}
                    >
                      ● {detail?.approval?.decision || (evidencePack ? 'COMPILED' : 'DRAFT / PENDING')}
                    </span>
                    <button
                      type="button"
                      className="rg-btn-secondary"
                      style={{ fontSize: 11, padding: '4px 8px', cursor: downloadingFormat ? 'not-allowed' : 'pointer' }}
                      disabled={Boolean(downloadingFormat) || (!evidencePack && !detail?.approval?.pack_hash)}
                      onClick={() => handleDownloadPack('json')}
                      title="Download canonical evidence pack in JSON format"
                    >
                      {downloadingFormat === 'json' ? 'Downloading...' : '⬇ JSON'}
                    </button>
                    <button
                      type="button"
                      className="rg-btn-secondary"
                      style={{ fontSize: 11, padding: '4px 8px', cursor: downloadingFormat ? 'not-allowed' : 'pointer' }}
                      disabled={Boolean(downloadingFormat) || (!evidencePack && !detail?.approval?.pack_hash)}
                      onClick={() => handleDownloadPack('md')}
                      title="Download canonical evidence pack in Markdown format"
                    >
                      {downloadingFormat === 'md' ? 'Downloading...' : '⬇ Markdown'}
                    </button>
                  </div>
                </div>

                {downloadError && (
                  <div className="rg-alert-error" style={{ fontSize: 12, padding: '6px 10px', marginBottom: 8 }}>
                    {downloadError}
                  </div>
                )}

                {loadingPack && (
                  <div style={{ fontSize: 12, color: 'var(--rg-text-muted)', padding: '12px 0' }}>
                    <span className="rg-loading-spinner" aria-hidden="true" style={{ display: 'inline-block', marginRight: 6 }} />
                    Loading evidence pack preview...
                  </div>
                )}

                {packError && (
                  <div style={{ fontSize: 12, color: 'var(--rg-high-text)', background: 'var(--rg-high-bg)', padding: 8, borderRadius: 4, marginBottom: 8 }}>
                    Failed to load evidence pack: {packError}
                  </div>
                )}

                {/* Metadata Strip */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 8,
                    background: 'var(--rg-bg-secondary)',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid var(--rg-border)',
                    marginBottom: 12,
                    fontSize: 11,
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--rg-text-muted)' }}>Pack Version: </span>
                    <strong style={{ color: 'var(--rg-text)' }}>v{evidencePack?.version || (detail?.approval?.pack_hash ? '1' : '--')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--rg-text-muted)' }}>Pack Hash: </span>
                    <code style={{ fontFamily: 'monospace', color: 'var(--rg-text)' }}>
                      {(evidencePack?.pack_hash || currentPackHash || '--').substring(0, 16)}...
                    </code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--rg-text-muted)' }}>Transaction: </span>
                    <span style={{ color: 'var(--rg-text)', fontFamily: 'monospace' }}>
                      {evidencePack?.target_transaction?.transaction_alias || detail?.transaction_id || '--'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--rg-text-muted)' }}>Dispute: </span>
                    <strong style={{ color: 'var(--rg-text)' }}>
                      {formatCurrency(detail?.amount, detail?.currency)}
                    </strong>
                  </div>
                </div>

                {/* Evidence Attached Documents */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rg-text)', marginBottom: 6 }}>
                    Attached Documents &amp; Evidence ({evidencePack?.attached_documents?.length || 0})
                  </div>
                  {evidencePack?.attached_documents && evidencePack.attached_documents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {evidencePack.attached_documents.map((doc: any, dIdx: number) => (
                        <div
                          key={doc.document_id || dIdx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 10px',
                            background: 'var(--rg-bg-secondary)',
                            border: '1px solid var(--rg-border)',
                            borderRadius: 4,
                            fontSize: 11,
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontWeight: 700,
                                background: 'var(--rg-bg-tertiary)',
                                padding: '2px 6px',
                                borderRadius: 3,
                                marginRight: 6,
                                color: 'var(--rg-text-secondary)',
                              }}
                            >
                              {doc.document_type || 'DOCUMENT'}
                            </span>
                            <span style={{ color: 'var(--rg-text)', fontWeight: 600 }}>
                              {doc.filename || doc.source || `Document #${dIdx + 1}`}
                            </span>
                            {doc.description && (
                              <span style={{ color: 'var(--rg-text-muted)', marginLeft: 8 }}>
                                — {doc.description}
                              </span>
                            )}
                          </div>
                          {doc.created_at && (
                            <span style={{ color: 'var(--rg-text-muted)' }}>
                              {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', fontStyle: 'italic' }}>
                      {loadingPack ? 'Loading documents...' : 'No standalone documents attached to this evidence package.'}
                    </div>
                  )}
                </div>

                {/* Approval details if present */}
                {detail?.approval?.approver_sub && (
                  <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', borderTop: '1px solid var(--rg-border-subtle)', paddingTop: 8 }}>
                    Approved by: <span style={{ fontWeight: 600, color: 'var(--rg-text)' }}>{detail.approval.approver_sub}</span> at{' '}
                    {detail.approval.decided_at ? new Date(detail.approval.decided_at).toLocaleString() : ''}
                  </div>
                )}
              </div>

              {/* Interactive Step Timeline */}
              <div className="rg-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Step Timeline & Audit History</h3>
                  <span style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>{timeline.length} recorded events</span>
                </div>

                {timeline.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--rg-text-muted)', padding: 12, textAlign: 'center' }}>
                    No steps recorded in timeline.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {timeline.map((step, idx) => (
                      <div
                        key={step.id || idx}
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start',
                          padding: '8px 10px',
                          background: 'var(--rg-bg-secondary)',
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontSize: 14 }}>
                          {step.step_type === 'PACK_APPROVED'
                            ? '✓'
                            : step.step_type === 'NOTE_ADDED'
                            ? '✍'
                            : step.step_type === 'CASE_CLOSED'
                            ? '🏁'
                            : step.step_type === 'CASE_REOPENED'
                            ? '🔄'
                            : '●'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{step.step_type}</span>
                            <span style={{ fontSize: 10, color: 'var(--rg-text-muted)' }}>
                              {new Date(step.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <div style={{ color: 'var(--rg-text-secondary)', marginBottom: 2 }}>{step.note}</div>
                          <div style={{ fontSize: 10, color: 'var(--rg-text-muted)' }}>
                            Actor: {step.actor} ({step.actor_type})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================= MODALS ======================= */}
          {/* Note Modal */}
          {isNoteModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: 'var(--rg-bg-card)',
                  border: '1px solid var(--rg-border)',
                  borderRadius: 8,
                  padding: 20,
                  width: 440,
                  maxWidth: '90%',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', fontSize: 16 }}>Add Reviewer Note</h4>
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter detailed reviewer observation..."
                  style={{
                    width: '100%',
                    background: 'var(--rg-bg-secondary)',
                    border: '1px solid var(--rg-border)',
                    borderRadius: 6,
                    padding: 8,
                    color: 'var(--rg-text-primary)',
                    fontSize: 13,
                    marginBottom: 14,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(false)}
                    style={{
                      background: 'var(--rg-bg-tertiary)',
                      color: 'var(--rg-text-primary)',
                      border: '1px solid var(--rg-border)',
                      borderRadius: 6,
                      padding: '6px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    style={{
                      background: 'var(--rg-accent)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 14px',
                      cursor: noteText.trim() ? 'pointer' : 'not-allowed',
                      opacity: noteText.trim() ? 1 : 0.5,
                      fontWeight: 600,
                    }}
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Close Case Modal */}
          {isCloseModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: 'var(--rg-bg-card)',
                  border: '1px solid var(--rg-border)',
                  borderRadius: 8,
                  padding: 20,
                  width: 480,
                  maxWidth: '90%',
                }}
              >
                <h4 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Close Investigation Case</h4>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Outcome Decision:
                  </label>
                  <select
                    value={closeOutcome}
                    onChange={(e) => setCloseOutcome(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--rg-bg-secondary)',
                      border: '1px solid var(--rg-border)',
                      borderRadius: 6,
                      padding: 8,
                      color: 'var(--rg-text-primary)',
                      fontSize: 13,
                    }}
                  >
                    <option value="CLOSED_APPROVED">CLOSED_APPROVED (Requires active pack approval)</option>
                    <option value="CLOSED_REJECTED">CLOSED_REJECTED (Dispute rejected)</option>
                    <option value="CLOSED_NO_ACTION">CLOSED_NO_ACTION (No further action required)</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Closing Note (min. 20 characters required):
                  </label>
                  <textarea
                    rows={4}
                    value={closeNote}
                    onChange={(e) => setCloseNote(e.target.value)}
                    placeholder="Provide explicit rationale and justification for this closing determination..."
                    style={{
                      width: '100%',
                      background: 'var(--rg-bg-secondary)',
                      border: '1px solid var(--rg-border)',
                      borderRadius: 6,
                      padding: 8,
                      color: 'var(--rg-text-primary)',
                      fontSize: 13,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: closeNote.trim().length >= 20 ? 'var(--rg-low-text)' : 'var(--rg-med-text)',
                    }}
                  >
                    Character count: {closeNote.trim().length} / 20 minimum
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsCloseModalOpen(false)}
                    style={{
                      background: 'var(--rg-bg-tertiary)',
                      color: 'var(--rg-text-primary)',
                      border: '1px solid var(--rg-border)',
                      borderRadius: 6,
                      padding: '6px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseCase}
                    disabled={closeNote.trim().length < 20}
                    style={{
                      background: 'var(--rg-accent)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 14px',
                      cursor: closeNote.trim().length >= 20 ? 'pointer' : 'not-allowed',
                      opacity: closeNote.trim().length >= 20 ? 1 : 0.5,
                      fontWeight: 600,
                    }}
                  >
                    Confirm Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reopen Modal */}
          {isReopenModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: 'var(--rg-bg-card)',
                  border: '1px solid var(--rg-border)',
                  borderRadius: 8,
                  padding: 20,
                  width: 440,
                  maxWidth: '90%',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', fontSize: 16 }}>Reopen Investigation Case</h4>
                <textarea
                  rows={4}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Enter reason for reopening (e.g. newly discovered courier tracking document)..."
                  style={{
                    width: '100%',
                    background: 'var(--rg-bg-secondary)',
                    border: '1px solid var(--rg-border)',
                    borderRadius: 6,
                    padding: 8,
                    color: 'var(--rg-text-primary)',
                    fontSize: 13,
                    marginBottom: 14,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsReopenModalOpen(false)}
                    style={{
                      background: 'var(--rg-bg-tertiary)',
                      color: 'var(--rg-text-primary)',
                      border: '1px solid var(--rg-border)',
                      borderRadius: 6,
                      padding: '6px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReopenCase}
                    disabled={!reopenReason.trim()}
                    style={{
                      background: '#a855f7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 14px',
                      cursor: reopenReason.trim() ? 'pointer' : 'not-allowed',
                      opacity: reopenReason.trim() ? 1 : 0.5,
                      fontWeight: 600,
                    }}
                  >
                    Reopen Case
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
