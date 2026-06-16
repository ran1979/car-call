# קריאות רכב

Israeli vehicle recall browser — Hebrew RTL static site hosted on GitHub Pages.

**Live:** https://ran1979.github.io/car-call

**Data source:** [data.gov.il](https://data.gov.il/dataset/recalls) — ~3,600 recall records, fetched fresh on every page load.

## Features

- Free-text search across 7 fields
- Filter by manufacturer, model (dependent), recall year, issue type
- Active filter chips with one-click clear
- Sortable columns (click header)
- Expandable rows — full detail panel with repair method, distributor, phone, website
- 50 rows per page with pagination

## Architecture

3 static files, no build step, no dependencies:

```
index.html   — shell, RTL (lang="he" dir="rtl")
style.css    — RTL layout, table, chips, filter panel
app.js       — state, pure functions, DOM renderers, event wiring
```

Deploy = `git push`. GitHub Pages serves from `main` branch root.

## App Flow

```mermaid
flowchart TD
    A([Page Load]) --> B[DOMContentLoaded]
    B --> C[Wire event listeners]
    C --> D[fetchData]
    D --> E{API OK?}
    E -- No --> F[showError + retry button]
    F -- click retry --> D
    E -- Yes --> G[state.records = records]
    G --> H[populateDropdowns]
    H --> I[render]

    subgraph render ["render()"]
        I --> J[sortRecords]
        J --> K[filterRecords]
        K --> L[clamp page]
        L --> M[renderChips]
        M --> N[renderTable]
        N --> O[renderPagination]
    end

    subgraph events ["User interactions → render()"]
        P[Search input] --> I
        Q[Dropdown change] --> I
        R[Column header click] --> I
        S[Chip × click] --> I
        T[Pagination click] --> I
        U[Row click] --> N
    end
```

## Pure Functions

| Function | Input | Output |
|---|---|---|
| `filterRecords(records, filters)` | full record array + filter state | filtered array |
| `sortRecords(records, col, dir)` | array + column + direction | sorted copy |
| `paginate(records, page, size)` | array + page number + page size | one page slice |
| `getDistinct(records, field)` | array + field name | sorted distinct values |

Tests: open `test.html` in browser — 24 assertions covering all 4 functions.
