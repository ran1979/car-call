# Car Recall Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Hebrew RTL GitHub Pages site that fetches Israeli vehicle recall data and displays it with search, filters, sorting, row expansion, and pagination.

**Architecture:** 3 static files (index.html, style.css, app.js) on GitHub Pages from main branch root. All records fetched once on load (`limit=10000`); all filtering, sorting, and pagination run client-side.

**Tech Stack:** Vanilla HTML/CSS/JS (ES2020) — no frameworks, no build step.

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | HTML shell, DOM structure, loads CSS + JS |
| `style.css` | RTL layout, table, chips, filter panel, pagination styles |
| `app.js` | State object, pure data functions, DOM renderers, event wiring, API fetch |
| `test.html` | Browser test runner for pure functions (dev-only) |

---

### Task 1: Scaffold — HTML + CSS + empty app.js

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `app.js`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>קריאות רכב</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>קריאות רכב</h1>
  </header>
  <main>
    <div id="search-bar">
      <input type="text" id="search-input" placeholder="🔍 חיפוש חופשי...">
      <button id="filter-toggle">⚙ סינון מתקדם ▾</button>
    </div>
    <div id="filter-panel" class="hidden">
      <select id="filter-tozar"><option value="">כל היצרנים</option></select>
      <select id="filter-degem"><option value="">כל הדגמים</option></select>
      <select id="filter-shnat"><option value="">כל השנים</option></select>
      <select id="filter-takala"><option value="">כל סוגי התקלות</option></select>
    </div>
    <div id="active-filters"></div>
    <div id="results-count"></div>
    <p id="loading">טוען נתונים...</p>
    <div id="error" class="hidden">
      <p>שגיאה בטעינת הנתונים. אנא נסה שוב.</p>
      <button id="retry">נסה שוב</button>
    </div>
    <table id="results-table" class="hidden">
      <thead>
        <tr>
          <th data-col="TOZAR_TEUR">יצרן</th>
          <th data-col="DEGEM">דגם</th>
          <th data-col="SHNAT_RECALL">שנת קריאה</th>
        </tr>
      </thead>
      <tbody id="table-body"></tbody>
    </table>
    <div id="pagination"></div>
  </main>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create style.css**

```css
*, *::before, *::after { box-sizing: border-box; }

body {
  direction: rtl;
  font-family: Arial, sans-serif;
  margin: 0;
  background: #f5f5f5;
  color: #222;
}

header { background: #1a56db; color: #fff; padding: 16px 24px; }
header h1 { margin: 0; font-size: 1.4rem; }

main { max-width: 1200px; margin: 0 auto; padding: 24px; }

.hidden { display: none !important; }

/* Search bar */
#search-bar { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; }

#search-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

#filter-toggle {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

/* Filter panel */
#filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

#filter-panel select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 160px;
}

/* Active filter chips */
#active-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }

.chip {
  background: #1a56db;
  color: #fff;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chip button {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  line-height: 1;
}

/* Results count */
#results-count { margin-bottom: 8px; color: #555; font-size: 0.9rem; }

/* Table */
#results-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}

#results-table th {
  background: #f0f0f0;
  padding: 12px 16px;
  text-align: right;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

#results-table th::after { content: ' ⇅'; opacity: 0.4; }
#results-table th.sort-asc::after { content: ' ↑'; opacity: 1; }
#results-table th.sort-desc::after { content: ' ↓'; opacity: 1; }

#results-table td {
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

tr.data-row { cursor: pointer; }
tr.data-row:hover { background: #f8f9ff; }
tr.data-row.expanded { background: #eef2ff; font-weight: 600; }

/* Row detail */
.detail-panel {
  padding: 16px;
  background: #f8f9ff;
  border-top: 2px solid #c7d7ff;
  line-height: 1.7;
}

.detail-panel p { margin: 4px 0; font-size: 0.9rem; }
.detail-panel a { color: #1a56db; }

/* Empty state */
#empty-state {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 1rem;
}

/* Pagination */
#pagination { display: flex; justify-content: center; gap: 4px; margin-top: 20px; }

.page-btn {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.page-btn.active { background: #1a56db; color: #fff; border-color: #1a56db; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:not(:disabled):not(.active):hover { background: #f0f4ff; }

/* Loading / error */
#loading { text-align: center; padding: 40px; color: #666; }
#error { text-align: center; padding: 40px; color: #c00; }

#error button {
  display: block;
  margin: 12px auto 0;
  padding: 8px 20px;
  background: #1a56db;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
```

- [ ] **Step 3: Create app.js (empty stub)**

```javascript
// implemented in subsequent tasks
```

- [ ] **Step 4: Open index.html in browser**

Expected: blue header "קריאות רכב", text "טוען נתונים...", no console errors.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css app.js
git commit -m "feat: scaffold HTML shell and CSS"
```

---

### Task 2: Pure functions + test.html

**Files:**
- Create: `test.html`
- Modify: `app.js` (replace stub)

- [ ] **Step 1: Create test.html with failing assertions**

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Tests</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    .pass { color: green; }
    .fail { color: red; font-weight: bold; }
  </style>
</head>
<body>
<h2>Test Results</h2>
<ul id="results"></ul>
<script src="app.js"></script>
<script>
const output = document.getElementById('results');
function assert(ok, msg) {
  const li = document.createElement('li');
  li.className = ok ? 'pass' : 'fail';
  li.textContent = (ok ? '✓ ' : '✗ ') + msg;
  output.appendChild(li);
}

const R = [
  { _id: 1, TOZAR_TEUR: 'Toyota',   DEGEM: 'Avensis', SHNAT_RECALL: 2011, SUG_TAKALA: 'דלק',   TEUR_TAKALA: 'תיאור א', OFEN_TIKUN: 'החלפה', YEVUAN_TEUR: 'טויוטה', TELEPHONE: '1-800', WEBSITE: 'http://a.com' },
  { _id: 2, TOZAR_TEUR: 'Toyota',   DEGEM: 'Corolla', SHNAT_RECALL: 2012, SUG_TAKALA: 'בלמים', TEUR_TAKALA: 'תיאור ב', OFEN_TIKUN: 'תיקון', YEVUAN_TEUR: 'טויוטה', TELEPHONE: '1-800', WEBSITE: '' },
  { _id: 3, TOZAR_TEUR: 'Mercedes', DEGEM: 'Vito',    SHNAT_RECALL: 2011, SUG_TAKALA: 'חשמל',  TEUR_TAKALA: 'תיאור ג', OFEN_TIKUN: 'החלפה', YEVUAN_TEUR: 'מרצדס',  TELEPHONE: '03-9', WEBSITE: 'http://b.com' },
];
const noFilter = { search: '', tozar: '', degem: '', shnat: '', takala: '' };

// filterRecords
assert(filterRecords(R, noFilter).length === 3,                                         'no filters → all 3');
assert(filterRecords(R, { ...noFilter, tozar: 'Toyota' }).length === 2,                 'filter tozar=Toyota → 2');
assert(filterRecords(R, { ...noFilter, tozar: 'Toyota', degem: 'Avensis' }).length === 1, 'filter tozar+degem → 1');
assert(filterRecords(R, { ...noFilter, shnat: '2011' }).length === 2,                   'filter shnat=2011 → 2');
assert(filterRecords(R, { ...noFilter, takala: 'דלק' }).length === 1,                   'filter takala → 1');
assert(filterRecords(R, { ...noFilter, search: 'vito' }).length === 1,                  'search case-insensitive → 1');
assert(filterRecords(R, { ...noFilter, search: 'תיאור' }).length === 3,                 'search Hebrew substring → 3');
assert(filterRecords(R, { ...noFilter, search: 'xyz' }).length === 0,                   'search no match → 0');

// sortRecords
const asc = sortRecords(R, 'TOZAR_TEUR', 'asc');
assert(asc[0].TOZAR_TEUR === 'Mercedes',  'sort asc: Mercedes first');
assert(asc[2].TOZAR_TEUR === 'Toyota',    'sort asc: Toyota last');
const desc = sortRecords(R, 'TOZAR_TEUR', 'desc');
assert(desc[0].TOZAR_TEUR === 'Toyota',   'sort desc: Toyota first');
const noSort = sortRecords(R, null, 'asc');
assert(noSort.length === 3,               'null col → all records');
assert(noSort[0]._id === 1,               'null col → original order');

// paginate
assert(paginate(R, 1, 2).length === 2,    'page 1 of 2 → 2 items');
assert(paginate(R, 1, 2)[0]._id === 1,    'page 1 starts at record 1');
assert(paginate(R, 2, 2).length === 1,    'page 2 → 1 item');
assert(paginate(R, 2, 2)[0]._id === 3,    'page 2 item is record 3');
assert(paginate(R, 1, 50).length === 3,   'pageSize > total → all');

// getDistinct
const tozars = getDistinct(R, 'TOZAR_TEUR');
assert(tozars.length === 2,               'distinct tozar → 2');
assert(tozars[0] === 'Mercedes',          'distinct sorted: Mercedes first');
const shnot = getDistinct(R, 'SHNAT_RECALL');
assert(shnot.length === 2,               'distinct shnat → 2');
assert(shnot.includes('2011'),           'distinct shnat includes 2011');
</script>
</body>
</html>
```

- [ ] **Step 2: Open test.html in browser — confirm all assertions FAIL with "filterRecords is not defined"**

- [ ] **Step 3: Replace app.js with pure functions**

```javascript
function filterRecords(records, filters) {
  return records.filter(r => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!Object.values(r).some(v => String(v).toLowerCase().includes(q))) return false;
    }
    if (filters.tozar && r.TOZAR_TEUR !== filters.tozar) return false;
    if (filters.degem && r.DEGEM !== filters.degem) return false;
    if (filters.shnat && String(r.SHNAT_RECALL) !== filters.shnat) return false;
    if (filters.takala && r.SUG_TAKALA !== filters.takala) return false;
    return true;
  });
}

function sortRecords(records, col, dir) {
  if (!col) return records;
  return [...records].sort((a, b) => {
    const cmp = String(a[col] ?? '').localeCompare(String(b[col] ?? ''), 'he');
    return dir === 'asc' ? cmp : -cmp;
  });
}

function paginate(records, page, size) {
  return records.slice((page - 1) * size, page * size);
}

function getDistinct(records, field) {
  const vals = new Set(records.map(r => String(r[field] ?? '')).filter(Boolean));
  return [...vals].sort((a, b) => a.localeCompare(b, 'he'));
}
```

- [ ] **Step 4: Reload test.html — all 20 assertions must show ✓**

Fix any failures before continuing.

- [ ] **Step 5: Commit**

```bash
git add app.js test.html
git commit -m "feat: pure filter/sort/paginate functions with passing tests"
```

---

### Task 3: Data fetch with loading + error states

**Files:**
- Modify: `app.js` (append after pure functions)

- [ ] **Step 1: Append state, showLoading, showError, fetchData to app.js**

```javascript
const API_URL = 'https://data.gov.il/api/3/action/datastore_search' +
  '?resource_id=2c33523f-87aa-44ec-a736-edbb0a82975e&limit=10000';

const state = {
  records: [],
  filtered: [],
  sortCol: null,
  sortDir: 'asc',
  page: 1,
  pageSize: 50,
  expandedId: null,
  filters: { search: '', tozar: '', degem: '', shnat: '', takala: '' },
};

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('error').classList.add('hidden');
  document.getElementById('results-table').classList.add('hidden');
  document.getElementById('pagination').innerHTML = '';
  document.getElementById('results-count').textContent = '';
  document.getElementById('active-filters').innerHTML = '';
}

function showError() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').classList.remove('hidden');
}

async function fetchData() {
  showLoading();
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error('API returned success=false');
    state.records = json.result.records;
    state.filtered = state.records;
    render();
  } catch (e) {
    console.error('Fetch failed:', e);
    showError();
  }
}

function render() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('results-count').textContent = `${state.filtered.length} תוצאות`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('retry').addEventListener('click', fetchData);
  fetchData();
});
```

- [ ] **Step 2: Open index.html in browser**

Expected:
- "טוען נתונים..." briefly visible
- "3603 תוצאות" (or similar) appears
- Network tab: one successful GET to data.gov.il

- [ ] **Step 3: Test error state**

In API_URL, change `resource_id=2c33523f` to `resource_id=invalid`. Reload.
Expected: שגיאה message + "נסה שוב" button.
Restore the correct resource_id before committing.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: fetch all records with loading and error states"
```

---

### Task 4: Table rendering + pagination

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add escHtml, escAttr, renderTable, renderPagination to app.js**

Append these before the existing `render()` function:

```javascript
function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderTable(rows) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').classList.add('hidden');

  const table = document.getElementById('results-table');

  if (rows.length === 0) {
    table.classList.add('hidden');
    let empty = document.getElementById('empty-state');
    if (!empty) {
      empty = document.createElement('p');
      empty.id = 'empty-state';
      table.insertAdjacentElement('afterend', empty);
    }
    empty.textContent = 'לא נמצאו תוצאות';
    return;
  }

  const existingEmpty = document.getElementById('empty-state');
  if (existingEmpty) existingEmpty.remove();
  table.classList.remove('hidden');

  document.querySelectorAll('#results-table th[data-col]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.col === state.sortCol) {
      th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });

  document.getElementById('table-body').innerHTML = rows.map(r => {
    const isExpanded = state.expandedId === r._id;
    const dataRow = `<tr class="data-row${isExpanded ? ' expanded' : ''}" data-id="${r._id}">
      <td>${escHtml(r.TOZAR_TEUR)}</td>
      <td>${escHtml(r.DEGEM)}</td>
      <td>${escHtml(String(r.SHNAT_RECALL ?? ''))}</td>
    </tr>`;
    if (!isExpanded) return dataRow;
    const website = r.WEBSITE
      ? `<a href="${escAttr(r.WEBSITE)}" target="_blank" rel="noopener noreferrer">${escHtml(r.WEBSITE)}</a>`
      : '—';
    return dataRow + `<tr class="detail-row"><td colspan="3"><div class="detail-panel">
      <p><strong>תיאור תקלה:</strong> ${escHtml(r.TEUR_TAKALA ?? '—')}</p>
      <p><strong>אופן תיקון:</strong> ${escHtml(r.OFEN_TIKUN ?? '—')}</p>
      <p><strong>יבואן:</strong> ${escHtml(r.YEVUAN_TEUR ?? '—')}</p>
      <p><strong>טלפון:</strong> ${escHtml(r.TELEPHONE ?? '—')}</p>
      <p><strong>אתר:</strong> ${website}</p>
    </div></td></tr>`;
  }).join('');
}

function renderPagination() {
  const total = Math.ceil(state.filtered.length / state.pageSize);
  const el = document.getElementById('pagination');
  if (total <= 1) { el.innerHTML = ''; return; }

  const p = state.page;
  const from = Math.max(1, p - 2);
  const to = Math.min(total, p + 2);

  const btn = (pg, label, disabled = false) =>
    `<button class="page-btn${pg === p ? ' active' : ''}" data-page="${pg}"${disabled ? ' disabled' : ''}>${label}</button>`;

  const nums = [];
  if (from > 1) { nums.push(btn(1, '1')); if (from > 2) nums.push('<span>…</span>'); }
  for (let i = from; i <= to; i++) nums.push(btn(i, String(i)));
  if (to < total) { if (to < total - 1) nums.push('<span>…</span>'); nums.push(btn(total, String(total))); }

  el.innerHTML = [
    btn(p - 1, 'הקודם', p === 1),
    ...nums,
    btn(p + 1, 'הבא', p === total),
  ].join('');
}
```

- [ ] **Step 2: Replace the stub render() with the full version**

```javascript
function render() {
  const sorted = sortRecords(state.records, state.sortCol, state.sortDir);
  state.filtered = filterRecords(sorted, state.filters);
  document.getElementById('loading').style.display = 'none';
  document.getElementById('results-count').textContent = `${state.filtered.length} תוצאות`;
  renderTable(paginate(state.filtered, state.page, state.pageSize));
  renderPagination();
}
```

- [ ] **Step 3: Add pagination click handler inside the DOMContentLoaded listener, before fetchData()**

```javascript
  document.getElementById('pagination').addEventListener('click', e => {
    const btn = e.target.closest('button.page-btn:not([disabled]):not(.active)');
    if (!btn) return;
    state.page = Number(btn.dataset.page);
    render();
  });
```

- [ ] **Step 4: Open index.html in browser**

Expected:
- Table with 3 columns (יצרן, דגם, שנת קריאה) and 50 rows loads
- "3603 תוצאות" shown
- Clicking page 2 shows next 50 rows

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: render table with pagination and empty state"
```

---

### Task 5: Column sorting

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add sort click handler inside DOMContentLoaded, before fetchData()**

```javascript
  document.querySelector('#results-table thead').addEventListener('click', e => {
    const th = e.target.closest('th[data-col]');
    if (!th) return;
    const col = th.dataset.col;
    if (state.sortCol === col) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortCol = col;
      state.sortDir = 'asc';
    }
    state.page = 1;
    render();
  });
```

- [ ] **Step 2: Open index.html in browser**

Expected:
- Click "יצרן" → rows sort A→Z, ↑ appears on column header
- Click "יצרן" again → sort Z→A, ↓ appears
- Click "שנת קריאה" → sort by year, indicator moves to that column

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: sort by column header click"
```

---

### Task 6: Row expansion

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add row click handler inside DOMContentLoaded, before fetchData()**

```javascript
  document.getElementById('table-body').addEventListener('click', e => {
    const row = e.target.closest('tr.data-row');
    if (!row) return;
    const id = Number(row.dataset.id);
    state.expandedId = state.expandedId === id ? null : id;
    renderTable(paginate(state.filtered, state.page, state.pageSize));
  });
```

- [ ] **Step 2: Open index.html in browser**

Expected:
- Click any row → detail panel appears inline below it showing תיאור תקלה, אופן תיקון, יבואן, טלפון, אתר
- Row with a WEBSITE value shows a clickable link; empty WEBSITE shows "—"
- Click same row → collapses
- Click a different row → first closes, new one opens

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: row click expands/collapses detail panel"
```

---

### Task 7: Filter panel + dropdowns + dependent model dropdown

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add fillSelect, updateDegemDropdown, populateDropdowns before render()**

```javascript
function fillSelect(id, values, placeholder) {
  const sel = document.getElementById(id);
  const current = sel.value;
  sel.innerHTML = `<option value="">${escHtml(placeholder)}</option>` +
    values.map(v => `<option value="${escAttr(v)}"${v === current ? ' selected' : ''}>${escHtml(v)}</option>`).join('');
}

function updateDegemDropdown() {
  const pool = state.filters.tozar
    ? state.records.filter(r => r.TOZAR_TEUR === state.filters.tozar)
    : state.records;
  fillSelect('filter-degem', getDistinct(pool, 'DEGEM'), 'כל הדגמים');
}

function populateDropdowns() {
  fillSelect('filter-tozar', getDistinct(state.records, 'TOZAR_TEUR'), 'כל היצרנים');
  fillSelect('filter-shnat', getDistinct(state.records, 'SHNAT_RECALL').reverse(), 'כל השנים');
  fillSelect('filter-takala', getDistinct(state.records, 'SUG_TAKALA'), 'כל סוגי התקלות');
  updateDegemDropdown();
}
```

- [ ] **Step 2: Call populateDropdowns() in fetchData, after state.filtered = state.records**

In `fetchData()`, make the success block look like:

```javascript
    state.records = json.result.records;
    state.filtered = state.records;
    populateDropdowns();
    render();
```

- [ ] **Step 3: Add filter panel toggle + dropdown handlers inside DOMContentLoaded, before fetchData()**

```javascript
  document.getElementById('filter-toggle').addEventListener('click', () => {
    document.getElementById('filter-panel').classList.toggle('hidden');
  });

  document.getElementById('filter-tozar').addEventListener('change', e => {
    state.filters.tozar = e.target.value;
    state.filters.degem = '';
    updateDegemDropdown();
    state.page = 1;
    render();
  });

  document.getElementById('filter-degem').addEventListener('change', e => {
    state.filters.degem = e.target.value;
    state.page = 1;
    render();
  });

  document.getElementById('filter-shnat').addEventListener('change', e => {
    state.filters.shnat = e.target.value;
    state.page = 1;
    render();
  });

  document.getElementById('filter-takala').addEventListener('change', e => {
    state.filters.takala = e.target.value;
    state.page = 1;
    render();
  });
```

- [ ] **Step 4: Open index.html in browser**

Expected:
- Click "⚙ סינון מתקדם ▾" → 4 populated dropdowns appear
- Click again → panel hides
- Select a manufacturer → table filters, count updates
- With manufacturer selected, דגם dropdown shows only that manufacturer's models
- Clear manufacturer → דגם resets to all models

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: collapsible filter panel with dependent model dropdown"
```

---

### Task 8: Free-text search + active filter chips

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add CHIP_LABELS constant and renderChips function before render()**

```javascript
const CHIP_LABELS = { tozar: 'יצרן', degem: 'דגם', shnat: 'שנה', takala: 'תקלה' };

function renderChips() {
  const chips = Object.entries(CHIP_LABELS)
    .filter(([k]) => state.filters[k])
    .map(([k, label]) =>
      `<span class="chip">${escHtml(label)}: ${escHtml(state.filters[k])} <button data-filter="${k}" aria-label="הסר פילטר">×</button></span>`
    ).join('');
  document.getElementById('active-filters').innerHTML = chips;
}
```

- [ ] **Step 2: Update render() to call renderChips()**

```javascript
function render() {
  const sorted = sortRecords(state.records, state.sortCol, state.sortDir);
  state.filtered = filterRecords(sorted, state.filters);
  document.getElementById('loading').style.display = 'none';
  document.getElementById('results-count').textContent = `${state.filtered.length} תוצאות`;
  renderChips();
  renderTable(paginate(state.filtered, state.page, state.pageSize));
  renderPagination();
}
```

- [ ] **Step 3: Add search input + chip click handlers inside DOMContentLoaded, before fetchData()**

```javascript
  document.getElementById('search-input').addEventListener('input', e => {
    state.filters.search = e.target.value;
    state.page = 1;
    render();
  });

  document.getElementById('active-filters').addEventListener('click', e => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    const key = btn.dataset.filter;
    state.filters[key] = '';
    const selectId = { tozar: 'filter-tozar', degem: 'filter-degem', shnat: 'filter-shnat', takala: 'filter-takala' }[key];
    if (selectId) document.getElementById(selectId).value = '';
    if (key === 'tozar') {
      state.filters.degem = '';
      document.getElementById('filter-degem').value = '';
      updateDegemDropdown();
    }
    state.page = 1;
    render();
  });
```

- [ ] **Step 4: Open index.html in browser**

Expected:
- Type "Toyota" → table filters live, count updates
- Select יצרן from dropdown → blue chip "יצרן: Toyota ×" appears
- Click × on chip → filter clears, dropdown resets, table shows all
- Multiple active filters show multiple chips
- Clearing יצרן chip also clears the dependent דגם filter

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: free-text search and active filter chips"
```

---

### Task 9: Deploy to GitHub Pages

- [ ] **Step 1: Push to GitHub**

```bash
git push -u origin main
```

- [ ] **Step 2: Enable GitHub Pages**

1. Open `https://github.com/ran1979/car-call/settings/pages`
2. Source: **Deploy from a branch**
3. Branch: **main** / **/ (root)**
4. Save

- [ ] **Step 3: Wait ~60 seconds then verify**

Open `https://ran1979.github.io/car-call`

Expected: site loads, data fetches, table renders with filters and sorting working.

- [ ] **Step 4: Verify no CORS error**

data.gov.il supports CORS. If the browser console shows a CORS error, verify the API URL in app.js is exactly:
`https://data.gov.il/api/3/action/datastore_search?resource_id=2c33523f-87aa-44ec-a736-edbb0a82975e&limit=10000`
