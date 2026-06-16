# Car Recall Site — Design Spec

**Date:** 2026-06-16
**Status:** Approved

## Overview

Static Hebrew RTL GitHub Pages site displaying Israeli vehicle recall data from `data.gov.il`. Target users: car owners checking whether their vehicle has an open recall.

**Data source:** `https://data.gov.il/api/3/action/datastore_search?resource_id=2c33523f-87aa-44ec-a736-edbb0a82975e`
**Total records:** ~3,603

## Architecture

3 static files, no build step, no dependencies:

```
index.html   — shell, RTL (dir="rtl", lang="he"), loads CSS + JS
style.css    — RTL layout, table styles, filter chips, responsive
app.js       — data fetch, filter logic, sort, render, pagination
```

GitHub Pages serves from `main` branch root. Deploy = `git push`.

## Data Layer

- On page load: single `fetch` with `limit=3603&offset=0` — gets all records in one request
- Store in memory array; never re-fetch
- All filtering and sorting are client-side (instant, no further API calls)
- On fetch failure: show Hebrew error message + retry button

**Key fields used:**

| Field | Hebrew label | Use |
|---|---|---|
| TOZAR_TEUR | יצרן | Filter dropdown, table column |
| DEGEM | דגם | Filter dropdown (dependent), table column |
| SHNAT_RECALL | שנת קריאה | Filter dropdown, table column |
| SUG_TAKALA | סוג תקלה | Filter dropdown |
| TEUR_TAKALA | תיאור תקלה | Expanded row |
| OFEN_TIKUN | אופן תיקון | Expanded row |
| YEVUAN_TEUR | יבואן | Expanded row |
| TELEPHONE | טלפון | Expanded row |
| WEBSITE | אתר | Expanded row (link) |

## UI & Interactions

### Layout (Option C — search + collapsible filters)

```
[ 🔍 חיפוש חופשי... ]          [ ⚙ סינון מתקדם ▼ ]

▼ collapsible filter panel:
  [ יצרן ▼ ]  [ דגם ▼ ]  [ שנת קריאה ▼ ]  [ סוג תקלה ▼ ]

[ Toyota × ]  [ 2011 × ]        ← active filter chips, × to remove

X תוצאות

┌──────────────┬──────────┬───────────────┐
│ יצרן ↕       │ דגם ↕    │ שנת קריאה ↕   │
├──────────────┼──────────┼───────────────┤
│ Toyota       │ Avensis  │ 2011          │
│  ▼ expanded detail row:                 │
│  תיאור תקלה | אופן תיקון | יבואן | טלפון | 🔗 אתר
└──────────────┴──────────┴───────────────┘

[ < 1  2  3  … > ]   50 rows per page
```

### Filter behavior

- **Free-text search** — queries across all text fields
- **יצרן dropdown** — distinct values from data, sorted alphabetically
- **דגם dropdown** — dependent: updates to show only models for selected יצרן (or all models if no יצרן selected)
- **שנת קריאה dropdown** — distinct years, sorted descending
- **סוג תקלה dropdown** — distinct values from SUG_TAKALA
- All active filters shown as removable chips below the search bar
- Result count updates live

### Sorting

Click any column header to sort ascending; click again for descending. Visual indicator (↑/↓) on active sort column.

### Row expansion

Click a row to expand an inline detail panel showing: תיאור תקלה, אופן תיקון, יבואן, טלפון, and website as a clickable link. Click again to collapse.

### Pagination

50 rows per page. Page controls at bottom: previous / page numbers / next.

## Error Handling

- API unreachable → Hebrew error + retry button
- Empty results after filtering → Hebrew "לא נמצאו תוצאות" message

## Deployment

```
Repo:   github.com/<user>/car-call
Branch: main
Pages:  Settings → Pages → source: main / (root)
URL:    https://<user>.github.io/car-call
```

Add `.superpowers/` to `.gitignore`.
