// DOM: table container is #table-container (toggle .hidden here), table rows in #results-table > #table-body

function filterRecords(records, filters) {
  return records.filter(r => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const SEARCH_FIELDS = ['TOZAR_TEUR', 'DEGEM', 'SHNAT_RECALL', 'SUG_TAKALA', 'TEUR_TAKALA', 'OFEN_TIKUN', 'YEVUAN_TEUR'];
      if (!SEARCH_FIELDS.some(f => String(r[f] ?? '').toLowerCase().includes(q))) return false;
    }
    if (filters.tozar && r.TOZAR_TEUR !== filters.tozar) return false;
    if (filters.degem && r.DEGEM !== filters.degem) return false;
    if (filters.shnat && String(r.SHNAT_RECALL) !== filters.shnat) return false;
    if (filters.takala && r.SUG_TAKALA !== filters.takala) return false;
    if (filters.modelyear) {
      const y = parseInt(filters.modelyear, 10);
      const begin = parseInt(r.BUILD_BEGIN_A, 10) || 0;
      const end = parseInt(r.BUILD_END_A, 10) || 9999;
      if (y < begin || y > end) return false;
    }
    return true;
  });
}

function sortRecords(records, col, dir) {
  if (!col) return [...records];
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

// dataset is ~3k rows; 10000 is a safe ceiling
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
  filters: { search: '', tozar: '', degem: '', shnat: '', takala: '', modelyear: '' },
};

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('error').classList.add('hidden');
  document.getElementById('table-container').classList.add('hidden');
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
    if (!json.result?.records) throw new Error('API response missing result.records');
    state.records = json.result.records;
    state.filtered = [...state.records];
    populateDropdowns();
    render();
  } catch (e) {
    console.error('Fetch failed:', e);
    showError();
  }
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderTable(rows) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').classList.add('hidden');

  const container = document.getElementById('table-container');

  if (rows.length === 0) {
    container.classList.add('hidden');
    let empty = document.getElementById('empty-state');
    if (!empty) {
      empty = document.createElement('p');
      empty.id = 'empty-state';
      container.insertAdjacentElement('afterend', empty);
    }
    empty.textContent = 'לא נמצאו תוצאות';
    return;
  }

  const existingEmpty = document.getElementById('empty-state');
  if (existingEmpty) existingEmpty.remove();
  container.classList.remove('hidden');

  document.querySelectorAll('#results-table th[data-col]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.col === state.sortCol) {
      th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });

  document.getElementById('table-body').innerHTML = rows.map(r => {
    const isExpanded = state.expandedId === r._id;
    const dataRow = `<tr class="data-row${isExpanded ? ' expanded' : ''}" data-id="${escAttr(String(r._id))}">
      <td>${escHtml(r.TOZAR_TEUR)}</td>
      <td>${escHtml(r.DEGEM)}</td>
      <td>${escHtml(String(r.SHNAT_RECALL ?? ''))}</td>
    </tr>`;
    if (!isExpanded) return dataRow;
    const isSafeUrl = r.WEBSITE && /^https?:\/\//i.test(r.WEBSITE);
    const website = isSafeUrl
      ? `<a href="${escAttr(r.WEBSITE)}" target="_blank" rel="noopener noreferrer">${escHtml(r.WEBSITE)}</a>`
      : r.WEBSITE ? escHtml(r.WEBSITE) : '—';
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

function fillComboOptions(values) {
  document.getElementById('filter-tozar-list').innerHTML =
    values.map(v => `<li data-value="${escAttr(v)}">${escHtml(v)}</li>`).join('');
}

function filterComboList(query) {
  const q = query.toLowerCase();
  document.getElementById('filter-tozar-list').querySelectorAll('li').forEach(li => {
    li.style.display = li.dataset.value.toLowerCase().includes(q) ? '' : 'none';
  });
}

function populateDropdowns() {
  fillComboOptions(getDistinct(state.records, 'TOZAR_TEUR'));
  fillSelect('filter-shnat', getDistinct(state.records, 'SHNAT_RECALL').reverse(), 'כל שנות הקריאה');
  fillSelect('filter-takala', getDistinct(state.records, 'SUG_TAKALA'), 'כל סוגי התקלות');
  updateDegemDropdown();
}

const CHIP_LABELS = { tozar: 'יצרן', degem: 'דגם', shnat: 'שנת קריאה', takala: 'תקלה', modelyear: 'שנת ייצור' };

function renderChips() {
  const chips = Object.entries(CHIP_LABELS)
    .filter(([k]) => state.filters[k])
    .map(([k, label]) =>
      `<span class="chip">${escHtml(label)}: ${escHtml(state.filters[k])} <button data-filter="${k}" aria-label="${escAttr('הסר פילטר ' + label)}">×</button></span>`
    ).join('');
  document.getElementById('active-filters').innerHTML = chips;
}

function render() {
  const sorted = sortRecords(state.records, state.sortCol, state.sortDir);
  state.filtered = filterRecords(sorted, state.filters);
  const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  if (state.page > maxPage) state.page = 1;
  document.getElementById('loading').style.display = 'none';
  document.getElementById('results-count').textContent = `${state.filtered.length} תוצאות`;
  renderChips();
  renderTable(paginate(state.filtered, state.page, state.pageSize));
  renderPagination();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('retry').addEventListener('click', fetchData);

  document.getElementById('pagination').addEventListener('click', e => {
    const btn = e.target.closest('button.page-btn:not([disabled]):not(.active)');
    if (!btn) return;
    state.page = Number(btn.dataset.page);
    render();
  });

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

  document.getElementById('table-body').addEventListener('click', e => {
    const row = e.target.closest('tr.data-row');
    if (!row) return;
    const id = Number(row.dataset.id);
    state.expandedId = state.expandedId === id ? null : id;
    renderTable(paginate(state.filtered, state.page, state.pageSize));
  });

  document.getElementById('filter-toggle').addEventListener('click', () => {
    const panel = document.getElementById('filter-panel');
    const btn = document.getElementById('filter-toggle');
    panel.classList.toggle('hidden');
    btn.textContent = panel.classList.contains('hidden')
      ? '⚙ סינון מתקדם ▾'
      : '⚙ סינון מתקדם ▴';
  });

  const tozarInput = document.getElementById('filter-tozar-input');
  const tozarList = document.getElementById('filter-tozar-list');

  tozarInput.addEventListener('focus', () => tozarList.classList.remove('hidden'));

  tozarInput.addEventListener('input', () => {
    filterComboList(tozarInput.value);
    tozarList.classList.remove('hidden');
    if (!tozarInput.value) {
      state.filters.tozar = '';
      state.filters.degem = '';
      document.getElementById('filter-degem').value = '';
      updateDegemDropdown();
      state.page = 1;
      render();
    }
  });

  tozarList.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    tozarInput.value = li.dataset.value;
    state.filters.tozar = li.dataset.value;
    state.filters.degem = '';
    document.getElementById('filter-degem').value = '';
    updateDegemDropdown();
    tozarList.classList.add('hidden');
    state.page = 1;
    render();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#combo-tozar')) tozarList.classList.add('hidden');
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

  document.getElementById('filter-model-year').addEventListener('input', e => {
    state.filters.modelyear = e.target.value;
    state.page = 1;
    render();
  });

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
    const selectId = { tozar: 'filter-tozar', degem: 'filter-degem', shnat: 'filter-shnat', takala: 'filter-takala', modelyear: 'filter-model-year' }[key];
    if (selectId) document.getElementById(selectId).value = '';
    if (key === 'tozar') {
      document.getElementById('filter-tozar-input').value = '';
      state.filters.degem = '';
      document.getElementById('filter-degem').value = '';
      updateDegemDropdown();
    }
    state.page = 1;
    render();
  });

  fetchData();
});
