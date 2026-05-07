import argparse
import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd


SERVICE_ALIASES = {
    "from_date": ["datumtol", "datumtol_", "datumtol(", "datum(tol)", "datum_tol", "tol"],
    "to_date": ["datumig", "datum(ig)", "datum_ig", "ig"],
    "inclusive_days": ["inclusive_napok_szama", "inclusive_napok", "inclusive", "napok_szama", "napok"],
    "employer": ["munkaltato_neve", "munkaltato", "ceg", "munkaltato neve"],
    "title": ["jogcim", "jogcime"],
    "classification": ["minosites", "minosites_", "besorolas"],
}

WAGE_ALIASES = {
    "from_date": ["datumtol", "datum(tol)", "datum_tol", "tol"],
    "to_date": ["datumig", "datum(ig)", "datum_ig", "ig"],
    # inclusive_days is OPTIONAL for wage rows — computed from dates when absent
    "employer": ["munkaltato_neve", "munkaltato", "ceg", "munkaltato neve"],
    "title": ["jogcim", "jogcime"],
    "regular_base": ["rendszeres_jarulekalap", "rendszeres_jovedelem", "rendszeres", "jarulekalap"],
    "irregular_income": ["nem_rendszeres_juttatas", "nem_rendszeres_jovedelem", "nem_rendszeres", "juttatas"],
    "benefit_income": ["ellatas_1", "ellatas_osszegek", "gyes_gyed_tgyas_gyap_munkanelkuli_stb", "ellatas", "h"],
    "paid_contribution": ["befizetett_nyugdijjarulek", "befizetett_jarulek", "jarulek"],
}

# Columns omitted from WAGE_ALIASES that are optional (synthesised from dates if absent)
WAGE_OPTIONAL: set = {"inclusive_days"}


@dataclass
class Rule:
    rule_id: str
    priority: int
    countable: bool
    minber_check: bool
    title_patterns: List[str]
    classification_female: str
    classification_male: str
    classification_default: str

    def matches(self, title: str) -> bool:
        normalized_title = normalize_text(title)
        return any(re.search(pattern, normalized_title) for pattern in self.title_patterns)


def normalize_text(value: object) -> str:
    if pd.isna(value):
        return ""
    text = str(value).strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"\s+", " ", text)
    return text


def normalize_colname(col: str) -> str:
    normalized = normalize_text(col)
    normalized = normalized.replace("(", "").replace(")", "")
    normalized = normalized.replace("/", "_").replace("-", "_")
    normalized = normalized.replace(" ", "_")
    return normalized


def map_columns(
    df: pd.DataFrame,
    aliases: Dict[str, List[str]],
    table_name: str,
    optional_cols: Optional[set] = None,
) -> pd.DataFrame:
    optional_cols = optional_cols or set()
    reverse_map: Dict[str, str] = {}
    for canonical, candidates in aliases.items():
        reverse_map[canonical] = canonical
        for candidate in candidates:
            reverse_map[normalize_colname(candidate)] = canonical

    rename_map = {}
    for col in df.columns:
        normalized = normalize_colname(col)
        if normalized in reverse_map:
            rename_map[col] = reverse_map[normalized]

    mapped = df.rename(columns=rename_map).copy()

    # ellatas_2 is an optional extra benefit column — normalise name then fold into benefit_income
    for raw_col in list(mapped.columns):
        if normalize_colname(raw_col) == "ellatas_2" or raw_col == "ellatas_2":
            e2 = pd.to_numeric(mapped[raw_col], errors="coerce").fillna(0)
            if "benefit_income" in mapped.columns:
                bi = pd.to_numeric(mapped["benefit_income"], errors="coerce").fillna(0)
                mapped["benefit_income"] = bi + e2
            else:
                mapped["benefit_income"] = e2
            mapped.drop(columns=[raw_col], inplace=True)
            break

    # Synthesise inclusive_days from dates if column is optional and absent
    if "inclusive_days" in optional_cols and "inclusive_days" not in mapped.columns:
        mapped["inclusive_days"] = pd.NA  # will be filled after date parsing

    missing = [
        canonical
        for canonical in aliases.keys()
        if canonical not in mapped.columns and canonical not in optional_cols
    ]
    if missing:
        raise ValueError(
            f"{table_name} table is missing required columns after alias mapping: {missing}. "
            "Check sheet headers or extend alias dictionaries."
        )
    return mapped


def parse_date_columns(df: pd.DataFrame, table_name: str) -> pd.DataFrame:
    parsed = df.copy()

    def coerce_date_col(col: pd.Series) -> pd.Series:
        # If already datetime (openpyxl reads real date cells as datetime), keep as-is
        if pd.api.types.is_datetime64_any_dtype(col):
            return col
        # Try ISO / Excel date string formats common in Hungary: YYYY.MM.DD, DD.MM.YYYY, YYYY-MM-DD
        for fmt in ("%Y.%m.%d", "%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y"):
            try:
                result = pd.to_datetime(col, format=fmt, errors="raise")
                return result
            except (ValueError, TypeError):
                pass
        # Last resort: generic inference
        return pd.to_datetime(col, dayfirst=False, errors="coerce")

    parsed["from_date"] = coerce_date_col(parsed["from_date"])
    parsed["to_date"] = coerce_date_col(parsed["to_date"])

    invalid_dates = parsed[parsed["from_date"].isna() | parsed["to_date"].isna()]
    if not invalid_dates.empty:
        raise ValueError(
            f"{table_name} table has invalid date values in rows: "
            f"{list(invalid_dates.index)}"
        )

    if (parsed["to_date"] < parsed["from_date"]).any():
        raise ValueError(f"{table_name} table has rows where to_date < from_date.")

    return parsed


def validate_inclusive_days(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["inclusive_days_calc"] = (out["to_date"] - out["from_date"]).dt.days + 1
    out["inclusive_days"] = pd.to_numeric(out["inclusive_days"], errors="coerce")
    out["inclusive_days_ok"] = out["inclusive_days"] == out["inclusive_days_calc"]
    return out


def load_rules(path: Path) -> List[Rule]:
    data = json.loads(path.read_text(encoding="utf-8"))
    rules = []
    for entry in data.get("rules", []):
        rules.append(
            Rule(
                rule_id=entry["id"],
                priority=int(entry["priority"]),
                countable=bool(entry["countable"]),
                minber_check=bool(entry.get("minber_check", False)),
                title_patterns=entry.get("title_patterns", []),
                classification_female=entry.get("classification", {}).get("female", "N"),
                classification_male=entry.get("classification", {}).get("male", "N"),
                classification_default=entry.get("classification", {}).get("default", "N"),
            )
        )
    if not rules:
        raise ValueError("No rules loaded from rules.json.")
    return rules


def pick_classification(rule: Optional[Rule], sex: str, source_classification: str) -> str:
    if rule is None:
        return source_classification if source_classification else "--"
    if sex == "female":
        return rule.classification_female
    if sex == "male":
        return rule.classification_male
    return rule.classification_default


def fallback_priority(classification: str) -> int:
    normalized = normalize_text(classification).upper()
    mapping = {"J": 1, "N": 2, "G": 3, "--": 6}
    return mapping.get(normalized, 99)


def assign_rule(row: pd.Series, rules: List[Rule]) -> Tuple[Optional[Rule], int, bool, str]:
    title = str(row.get("title", ""))
    for rule in rules:
        if rule.matches(title):
            return rule, rule.priority, rule.countable, f"matched rule: {rule.rule_id}"

    source_cls = str(row.get("classification", "")).strip()
    return None, fallback_priority(source_cls), source_cls != "--", "no rule match, fallback to source classification"


def expand_service_daily(service_df: pd.DataFrame, rules: List[Rule], sex: str) -> pd.DataFrame:
    daily_rows = []
    for idx, row in service_df.iterrows():
        rule, priority, countable, rule_reason = assign_rule(row, rules)
        final_cls = pick_classification(rule, sex, str(row.get("classification", "")).strip())

        for day in pd.date_range(row["from_date"], row["to_date"], freq="D"):
            daily_rows.append(
                {
                    "date": day,
                    "row_index": idx,
                    "employer": row["employer"],
                    "title": row["title"],
                    "source_classification": row["classification"],
                    "rule_id": rule.rule_id if rule else "fallback",
                    "priority": priority,
                    "countable": countable,
                    "classification": final_cls,
                    "rule_reason": rule_reason,
                }
            )

    return pd.DataFrame(daily_rows)


def decide_daily_classification(service_daily: pd.DataFrame) -> pd.DataFrame:
    if service_daily.empty:
        return pd.DataFrame(columns=["date", "classification", "priority", "decision_reason", "winner_row_index"])

    chosen_rows = []
    for date_value, group in service_daily.groupby("date", sort=True):
        ranked = group.sort_values(by=["priority", "countable", "row_index"], ascending=[True, False, True]).reset_index(drop=True)
        winner = ranked.iloc[0]
        losers = ranked.iloc[1:]

        loser_notes = [
            f"row {int(row.row_index)} excluded: priority={int(row.priority)} countable={bool(row.countable)}"
            for _, row in losers.iterrows()
        ]
        decision_reason = (
            f"winner row {int(winner.row_index)} rule={winner.rule_id} priority={int(winner.priority)}; "
            + (" | ".join(loser_notes) if loser_notes else "no overlaps")
        )

        chosen_rows.append(
            {
                "date": date_value,
                "classification": winner.classification if winner.countable else "--",
                "priority": int(winner.priority),
                "winner_row_index": int(winner.row_index),
                "winner_employer": winner.employer,
                "winner_title": winner.title,
                "winner_rule_id": winner.rule_id,
                "winner_countable": bool(winner.countable),
                "decision_reason": decision_reason,
            }
        )

    return pd.DataFrame(chosen_rows).sort_values("date").reset_index(drop=True)


def merge_daily_to_periods(daily_final: pd.DataFrame) -> pd.DataFrame:
    if daily_final.empty:
        return pd.DataFrame(columns=["from_date", "to_date", "inclusive_days", "classification", "year"])

    rows = []
    current = daily_final.iloc[0]
    start_date = current.date
    prev_date = current.date

    for _, row in daily_final.iloc[1:].iterrows():
        contiguous = (row.date - prev_date).days == 1
        same_classification = row.classification == current.classification

        if contiguous and same_classification:
            prev_date = row.date
            continue

        rows.append(
            {
                "from_date": start_date,
                "to_date": prev_date,
                "inclusive_days": (prev_date - start_date).days + 1,
                "classification": current.classification,
                "year": start_date.year,
            }
        )

        start_date = row.date
        prev_date = row.date
        current = row

    rows.append(
        {
            "from_date": start_date,
            "to_date": prev_date,
            "inclusive_days": (prev_date - start_date).days + 1,
            "classification": current.classification,
            "year": start_date.year,
        }
    )

    periods = pd.DataFrame(rows)
    return split_periods_by_year(periods)


def split_periods_by_year(periods: pd.DataFrame) -> pd.DataFrame:
    split_rows = []
    for _, row in periods.iterrows():
        start = row["from_date"]
        end = row["to_date"]
        classification = row["classification"]

        year_cursor = start.year
        while year_cursor <= end.year:
            year_start = pd.Timestamp(year=year_cursor, month=1, day=1)
            year_end = pd.Timestamp(year=year_cursor, month=12, day=31)
            part_start = max(start, year_start)
            part_end = min(end, year_end)

            split_rows.append(
                {
                    "year": year_cursor,
                    "from_date": part_start,
                    "to_date": part_end,
                    "inclusive_days": (part_end - part_start).days + 1,
                    "classification": classification,
                }
            )
            year_cursor += 1

    return pd.DataFrame(split_rows)


def expand_wage_daily(wage_df: pd.DataFrame) -> pd.DataFrame:
    components = ["regular_base", "irregular_income", "benefit_income", "paid_contribution"]

    rows = []
    for idx, row in wage_df.iterrows():
        day_count = int(row["inclusive_days_calc"])
        if day_count <= 0:
            continue

        per_day = {}
        for comp in components:
            value = pd.to_numeric(pd.Series([row[comp]]), errors="coerce").fillna(0).iloc[0]
            per_day[comp] = float(value) / day_count

        for day in pd.date_range(row["from_date"], row["to_date"], freq="D"):
            rows.append(
                {
                    "date": day,
                    "wage_row_index": idx,
                    "employer": row["employer"],
                    "title": row["title"],
                    **per_day,
                }
            )

    return pd.DataFrame(rows)


def aggregate_wages_by_year(
    daily_final: pd.DataFrame,
    wage_daily: pd.DataFrame,
    annual_caps: Optional[Dict[str, float]] = None,
    excluded_wage_rows: Optional[set] = None,
) -> pd.DataFrame:
    if daily_final.empty:
        return pd.DataFrame(columns=["year", "accepted_regular", "accepted_irregular", "accepted_benefit", "accepted_total", "cap", "accepted_total_capped"])

    accepted_days = daily_final[daily_final["classification"] != "--"][["date"]].copy()
    eligible_wage_daily = wage_daily.copy()
    if excluded_wage_rows:
        eligible_wage_daily = eligible_wage_daily[~eligible_wage_daily["wage_row_index"].isin(excluded_wage_rows)]
    joined = accepted_days.merge(eligible_wage_daily, on="date", how="left")
    joined = joined.fillna(0)
    joined["year"] = joined["date"].dt.year

    grouped = joined.groupby("year", as_index=False).agg(
        accepted_regular=("regular_base", "sum"),
        accepted_irregular=("irregular_income", "sum"),
        accepted_benefit=("benefit_income", "sum"),
        accepted_contribution=("paid_contribution", "sum"),
    )
    grouped["accepted_total"] = grouped["accepted_regular"] + grouped["accepted_irregular"] + grouped["accepted_benefit"]

    if annual_caps is None:
        grouped["cap"] = pd.NA
        grouped["accepted_total_capped"] = grouped["accepted_total"]
        return grouped

    capped_totals = []
    caps = []
    for _, row in grouped.iterrows():
        year = str(int(row["year"]))
        cap = annual_caps.get(year)
        caps.append(cap if cap is not None else pd.NA)
        if cap is None:
            capped_totals.append(row["accepted_total"])
        else:
            capped_totals.append(min(float(cap), float(row["accepted_total"])))

    grouped["cap"] = caps
    grouped["accepted_total_capped"] = capped_totals
    return grouped


def apply_minber_check(
    wage_checked: pd.DataFrame,
    daily_final: pd.DataFrame,
    rules: List[Rule],
    minber_data: Dict[str, float],
) -> Tuple[pd.DataFrame, List[dict], set]:
    """TnyR 56.§: EV / társas tag / megbízásos jogviszonyoknál, ha az időszaki jövedelem
    (rendszeres + nem rendszeres) kisebb az időszakra arányos minimálbérnél, akkor az
    időszak nem számítható be — sem a szolgálati idő, sem a bér nem fogadható el.
    Returns: (updated daily_final, issues list, set of disqualified wage row indices)
    """
    result = daily_final.copy()
    issues: List[dict] = []
    disqualified_wage_rows: set = set()

    # Build a lookup: rule_id -> rule, for minber_check=True rules
    minber_rule_ids: set = {r.rule_id for r in rules if r.minber_check}
    if not minber_rule_ids:
        return result, issues, disqualified_wage_rows

    # For each wage row matching a minber_check rule, evaluate the threshold
    for idx, wrow in wage_checked.iterrows():
        title = str(wrow.get("title", ""))
        matched_rule: Optional[Rule] = None
        for rule in rules:
            if rule.minber_check and rule.matches(title):
                matched_rule = rule
                break
        if matched_rule is None:
            continue

        from_date: pd.Timestamp = wrow["from_date"]
        to_date: pd.Timestamp = wrow["to_date"]
        days = int(wrow["inclusive_days_calc"])
        if days <= 0:
            continue

        year = from_date.year
        monthly_minber = minber_data.get(str(year))
        # Proportional minimum wage for the period: (days / 30) * monthly_minber
        # Per TnyR the reference base is always 30 days/month regardless of actual month length
        proportional_minber = (days / 30.0) * monthly_minber

        period_income = (
            float(pd.to_numeric(pd.Series([wrow.get("regular_base", 0)]), errors="coerce").fillna(0).iloc[0])
            + float(pd.to_numeric(pd.Series([wrow.get("irregular_income", 0)]), errors="coerce").fillna(0).iloc[0])
        )

        if period_income >= proportional_minber:
            continue  # Passes — no action needed

        # Disqualify: mark all daily_final rows in this date range & rule as '--'
        date_mask = (
            (result["date"] >= from_date)
            & (result["date"] <= to_date)
            & (result["winner_rule_id"] == matched_rule.rule_id)
            & (result["classification"] != "--")
        )
        affected_count = date_mask.sum()
        for loc_idx in result.index[date_mask]:
            result.at[loc_idx, "classification"] = "--"
            result.at[loc_idx, "decision_reason"] = (
                result.at[loc_idx, "decision_reason"]
                + f" | TnyR56.§: jovedelem ({period_income:.0f} Ft) < aranyos minbér ({proportional_minber:.0f} Ft) → atsorolva --"
            )

        disqualified_wage_rows.add(int(idx))
        issues.append({
            "severity": "high",
            "issue_type": "minber_below_threshold",
            "row_index": int(idx),
            "details": (
                f"wage row {idx}: {from_date.date()} – {to_date.date()}, "
                f"jogcim='{title}', {days} nap, "
                f"jovedelem={period_income:.0f} Ft, "
                f"aranyos minber={proportional_minber:.0f} Ft ({monthly_minber:.0f}/ho x {days}/30), "
                f"{affected_count} nap atsorolva '--' [TnyR 56.§]"
            ),
        })

    return result, issues, disqualified_wage_rows


def apply_unpaid_leave_30day_cap(
    daily_final: pd.DataFrame,
) -> Tuple[pd.DataFrame, List[dict]]:
    """Tny. 42.§(1)b: evente legfeljebb 30 nap fizetés nélküli szabadság számítható be.
    A 31. naptól induló FNYSZ napok átsorolódnak '--'-ra (nem számítható be).
    Gyermekes FNYSZ jellemzően 'childcare' rule_id-vel szerepel, ezt nem érinti.
    """
    result = daily_final.copy()
    issues: List[dict] = []

    mask_fnysz = (result["winner_rule_id"] == "unpaid_leave") & (result["classification"] != "--")
    if not mask_fnysz.any():
        return result, issues

    # Az FNYSZ napokat dátum szerint rangsoroljuk éven belül (daily_final már dátum szerint rendezett)
    fnysz_indices = result.index[mask_fnysz].tolist()
    fnysz_sub = result.loc[fnysz_indices, ["date"]].copy()
    fnysz_sub["year"] = fnysz_sub["date"].dt.year
    fnysz_sub["rank_in_year"] = fnysz_sub.groupby("year", sort=False).cumcount() + 1

    over_cap_mask = fnysz_sub["rank_in_year"] > 30
    for loc_idx, row in fnysz_sub[over_cap_mask].iterrows():
        rank = int(row["rank_in_year"])
        result.at[loc_idx, "classification"] = "--"
        result.at[loc_idx, "decision_reason"] = (
            result.at[loc_idx, "decision_reason"]
            + f" | Tny.42§(1)b: FNYSZ ev={int(row['year'])} {rank}. nap > 30 napos ev/korlat → atsorolva --"
        )
        issues.append(
            {
                "severity": "medium",
                "issue_type": "unpaid_leave_over_30days",
                "row_index": int(result.at[loc_idx, "winner_row_index"]),
                "details": (
                    f"date {result.at[loc_idx, 'date'].date()}: FNYSZ ev={int(row['year'])}, "
                    f"ev beluli sorrend: {rank}. nap (korlat: 30) — nem szamithato be [Tny. 42.§(1)b]"
                ),
            }
        )

    return result, issues


def build_review_queue(
    service_checked: pd.DataFrame,
    wage_checked: pd.DataFrame,
    daily_final: pd.DataFrame,
    extra_issues: Optional[List[dict]] = None,
) -> pd.DataFrame:
    issues = []

    invalid_service = service_checked[~service_checked["inclusive_days_ok"]]
    for idx, row in invalid_service.iterrows():
        issues.append(
            {
                "severity": "high",
                "issue_type": "inclusive_days_mismatch_service",
                "row_index": int(idx),
                "details": f"service row {idx}: inclusive_days={row['inclusive_days']} calculated={row['inclusive_days_calc']}",
            }
        )

    invalid_wage = wage_checked[~wage_checked["inclusive_days_ok"]]
    for idx, row in invalid_wage.iterrows():
        issues.append(
            {
                "severity": "high",
                "issue_type": "inclusive_days_mismatch_wage",
                "row_index": int(idx),
                "details": f"wage row {idx}: inclusive_days={row['inclusive_days']} calculated={row['inclusive_days_calc']}",
            }
        )

    overlap_days = daily_final[daily_final["decision_reason"].str.contains("excluded", na=False)]
    for _, row in overlap_days.head(500).iterrows():
        issues.append(
            {
                "severity": "medium",
                "issue_type": "overlap_resolved",
                "row_index": int(row["winner_row_index"]),
                "details": f"date {row['date'].date()}: {row['decision_reason']}",
            }
        )

    if extra_issues:
        issues.extend(extra_issues)

    if not issues:
        issues.append(
            {
                "severity": "info",
                "issue_type": "no_issues",
                "row_index": -1,
                "details": "No validation or overlap issues detected by automated checks.",
            }
        )

    return pd.DataFrame(issues)


def read_annual_caps(path: Optional[Path]) -> Optional[Dict[str, float]]:
    if path is None:
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return {str(k): float(v) for k, v in data.items()}


def main() -> None:
    parser = argparse.ArgumentParser(description="Service-time and wage reconciliation from Excel input.")
    parser.add_argument("--input", required=True, help="Path to input Excel workbook.")
    parser.add_argument("--output", required=True, help="Output Excel path.")
    parser.add_argument("--sex", choices=["female", "male", "unknown"], default="female", help="Applicant sex for classification logic.")
    parser.add_argument("--service-sheet", default="szolgalati_ido", help="Service sheet name.")
    parser.add_argument("--wage-sheet", default="ber", help="Wage sheet name.")
    parser.add_argument("--rules", default="rules.json", help="Rules JSON path.")
    parser.add_argument("--annual-cap", default=None, help="Optional JSON with yearly caps.")
    parser.add_argument("--minber", default="minber.json", help="JSON with monthly minimum wages by year (default: minber.json).")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    rules_path = Path(args.rules)
    cap_path = Path(args.annual_cap) if args.annual_cap else None
    minber_path = Path(args.minber) if args.minber else None

    rules = load_rules(rules_path)
    annual_caps = read_annual_caps(cap_path)

    minber_data: Dict[str, float] = {}
    if minber_path and minber_path.exists():
        raw = json.loads(minber_path.read_text(encoding="utf-8"))
        minber_data = {str(k): float(v) for k, v in raw.items() if not str(k).startswith("_")}

    service_raw = pd.read_excel(input_path, sheet_name=args.service_sheet)
    wage_raw = pd.read_excel(input_path, sheet_name=args.wage_sheet)

    service_mapped = map_columns(service_raw, SERVICE_ALIASES, "service")
    wage_mapped = map_columns(wage_raw, WAGE_ALIASES, "wage", optional_cols=WAGE_OPTIONAL)

    service_parsed = parse_date_columns(service_mapped, "service")
    wage_parsed = parse_date_columns(wage_mapped, "wage")

    # Synthesise inclusive_days for wage if not present in source data
    if wage_parsed["inclusive_days"].isna().all():
        wage_parsed["inclusive_days"] = (wage_parsed["to_date"] - wage_parsed["from_date"]).dt.days + 1

    service_checked = validate_inclusive_days(service_parsed)
    wage_checked = validate_inclusive_days(wage_parsed)

    service_daily = expand_service_daily(service_checked, rules, args.sex)
    daily_final = decide_daily_classification(service_daily)
    daily_final, minber_issues, disqualified_wage_rows = apply_minber_check(wage_checked, daily_final, rules, minber_data)
    daily_final, fnysz_issues = apply_unpaid_leave_30day_cap(daily_final)
    periods_year_split = merge_daily_to_periods(daily_final)

    wage_daily = expand_wage_daily(wage_checked)
    yearly_wages = aggregate_wages_by_year(daily_final, wage_daily, annual_caps, excluded_wage_rows=disqualified_wage_rows)

    review_queue = build_review_queue(service_checked, wage_checked, daily_final, extra_issues=minber_issues + fnysz_issues)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        service_checked.to_excel(writer, sheet_name="service_validated", index=False)
        wage_checked.to_excel(writer, sheet_name="wage_validated", index=False)
        service_daily.to_excel(writer, sheet_name="service_daily_raw", index=False)
        daily_final.to_excel(writer, sheet_name="daily_final", index=False)
        periods_year_split.to_excel(writer, sheet_name="periods_by_year", index=False)
        yearly_wages.to_excel(writer, sheet_name="wage_yearly", index=False)
        review_queue.to_excel(writer, sheet_name="review_queue", index=False)

    print(f"Done. Output written to: {output_path}")


if __name__ == "__main__":
    main()
