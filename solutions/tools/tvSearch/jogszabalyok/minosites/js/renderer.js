import { formatDate } from "./parser.js";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function badgeHtml(badge) {
  return `<span class="badge ${badge.type}">${esc(badge.text)}</span>`;
}

export function renderSummary(container, summary) {
  container.innerHTML = `
    <h2>Összefoglaló</h2>
    <div class="summary-grid">
      <div class="kpi"><h3>Feldolgozott sor</h3><strong>${summary.rowCount}</strong></div>
      <div class="kpi"><h3>Átfedések</h3><strong>${summary.overlapCount}</strong></div>
      <div class="kpi"><h3>Lukak</h3><strong>${summary.gapCount}</strong></div>
      <div class="kpi"><h3>Minbér alatti sorok</h3><strong>${summary.minberUnderCount}</strong></div>
      <div class="kpi"><h3>Plafon feletti év</h3><strong>${summary.capOverCount}</strong></div>
      <div class="kpi"><h3>FNYSZ bontás kell</h3><strong>${summary.splitCount}</strong></div>
      <div class="kpi"><h3>Igazolás-javaslat</h3><strong>${summary.certCount}</strong></div>
    </div>
  `;
}

export function renderTable(table, rows) {
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  thead.innerHTML = `
    <tr>
      <th>#</th>
      <th>Tól</th>
      <th>Ig</th>
      <th>Munkáltató</th>
      <th>Jogcím</th>
      <th>Aktuális állapot</th>
      <th>Javasolt minősítés</th>
      <th>Napok</th>
      <th>Illesztett bér (Ft)</th>
      <th>Küszöb (Ft)</th>
      <th>Jelölések</th>
      <th>Megjegyzések</th>
    </tr>
  `;

  tbody.innerHTML = rows
    .map((row) => {
      const issues = row.issues.length
        ? `<ul class="issue-list">${row.issues.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
        : "";
      const badges = row.badges.map(badgeHtml).join(" ");

      return `
        <tr class="${row.overlap ? "overlap-row" : ""}">
          <td>${row.rowNumber}</td>
          <td>${formatDate(row.startDate)}</td>
          <td>${formatDate(row.endDate)}</td>
          <td>${esc(row.employer)}</td>
          <td>${esc(row.title)}</td>
          <td>${esc(row.rawStatus || "?")}</td>
          <td><strong>${esc(row.suggested)}</strong></td>
          <td>${row.dayCount}</td>
          <td>${Math.round(row.matchedWage || 0).toLocaleString("hu-HU")}</td>
          <td>${Math.round(row.minberThreshold || 0).toLocaleString("hu-HU")}</td>
          <td>${badges}</td>
          <td>${issues}</td>
        </tr>
      `;
    })
    .join("");
}

export function renderIssues(container, issues) {
  if (!issues.length) {
    container.innerHTML = "<h2>Riport</h2><p>Nincs kiemelt probléma.</p>";
    return;
  }

  const bySeverity = {
    high: [],
    medium: [],
    low: []
  };

  issues.forEach((item) => {
    bySeverity[item.severity]?.push(item);
  });

  const renderGroup = (title, key) => {
    const rows = bySeverity[key];
    if (!rows.length) return "";
    return `
      <h3>${title}</h3>
      <ul class="issue-list">
        ${rows.map((item) => `<li>${esc(item.message)}</li>`).join("")}
      </ul>
    `;
  };

  container.innerHTML = `
    <h2>Riport</h2>
    ${renderGroup("Kritikus", "high")}
    ${renderGroup("Figyelmeztetés", "medium")}
    ${renderGroup("Információ", "low")}
  `;
}
