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
