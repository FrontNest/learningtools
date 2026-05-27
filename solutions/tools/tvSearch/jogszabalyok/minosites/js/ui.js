import { parseDelimitedTable } from "./parser.js";
import { analyzeTables } from "./analyzer.js";
import { renderSummary, renderTable, renderIssues } from "./renderer.js";

const serviceInput = document.getElementById("serviceInput");
const wageInput = document.getElementById("wageInput");
const delimiterSelect = document.getElementById("delimiter");
const genderSelect = document.getElementById("gender");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const summary = document.getElementById("summary");
const issuesPanel = document.getElementById("issuesPanel");
const serviceTable = document.getElementById("serviceTable");

function showParseErrors(serviceParsed, wageParsed) {
  const allErrors = [...serviceParsed.errors, ...wageParsed.errors];
  if (!allErrors.length) return false;

  issuesPanel.innerHTML = `
    <h2>Hibák</h2>
    <ul class="issue-list">
      ${allErrors.map((err) => `<li>${err}</li>`).join("")}
    </ul>
  `;
  return true;
}

function clearOutputs() {
  summary.innerHTML = "";
  issuesPanel.innerHTML = "";
  serviceTable.querySelector("thead").innerHTML = "";
  serviceTable.querySelector("tbody").innerHTML = "";
}

analyzeBtn.addEventListener("click", () => {
  const delimiterMode = delimiterSelect.value;
  const gender = genderSelect.value;

  const serviceParsed = parseDelimitedTable(serviceInput.value, delimiterMode);
  const wageParsed = parseDelimitedTable(wageInput.value, delimiterMode);

  if (showParseErrors(serviceParsed, wageParsed)) {
    summary.innerHTML = "<p>Előbb javítsd a beolvasási hibákat.</p>";
    return;
  }

  const result = analyzeTables({
    serviceRows: serviceParsed.rows,
    wageRows: wageParsed.rows,
    gender
  });

  renderSummary(summary, result.summary);
  renderTable(serviceTable, result.rows);
  renderIssues(issuesPanel, result.issues);
});

clearBtn.addEventListener("click", () => {
  serviceInput.value = "";
  wageInput.value = "";
  clearOutputs();
});

clearOutputs();
