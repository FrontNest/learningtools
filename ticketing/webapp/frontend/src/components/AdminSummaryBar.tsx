import { useEffect, useState } from "react";
import { fetchDashboardSummary } from "../lib/ticketApi";
import type { DashboardSummary } from "../types/ticket";
import type { TicketFilters } from "../lib/ticketApi";

interface Card {
  label: string;
  value: number;
  filters: TicketFilters;
}

export function AdminSummaryBar({
  currentUserId,
  onFilter,
}: {
  currentUserId: string;
  onFilter: (filters: TicketFilters) => void;
}) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetchDashboardSummary().then(setSummary).catch(() => undefined);
  }, []);

  if (!summary) return null;

  const cards: Card[] = [
    { label: "Total open", value: summary.totalOpen, filters: {} },
    { label: "Unassigned", value: summary.unassigned, filters: { unassigned: true } },
    { label: "High priority", value: summary.highPriority, filters: { priority: "HIGH" } },
    { label: "Critical priority", value: summary.criticalPriority, filters: { priority: "CRITICAL" } },
    { label: "Waiting for User", value: summary.waitingForUser, filters: { status: "WAITING_FOR_USER" } },
    {
      label: "Waiting for 3rd Party",
      value: summary.waitingForThirdParty,
      filters: { status: "WAITING_FOR_THIRD_PARTY" },
    },
    { label: "My assigned", value: summary.myAssigned, filters: { assignedUserId: currentUserId } },
  ];

  return (
    <div className="summary-bar">
      {cards.map((card) => (
        <button key={card.label} className="summary-card" onClick={() => onFilter(card.filters)}>
          <span className="summary-value">{card.value}</span>
          <span className="summary-label">{card.label}</span>
        </button>
      ))}
      {summary.teamCounts.map((t) => (
        <button
          key={t.teamId}
          className="summary-card"
          onClick={() => onFilter({ assignedTeamId: t.teamId })}
        >
          <span className="summary-value">{t.count}</span>
          <span className="summary-label">{t.teamName} queue</span>
        </button>
      ))}
    </div>
  );
}
