// DOM: table container is #table-container (toggle .hidden here), table rows in #results-table > #table-body

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
  filters: { search: '', tozar: '', degem: '', shnat: '', takala: '' },
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
