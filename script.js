let currentPage = 1;
const DEFAULT_LIMIT = 25;

// Default filter configuration
const DEFAULT_FILTERS = {
  type: "5L.coms & 6L.coms",
  sort: "marketplace", 
  date: "last7days",
  limit: DEFAULT_LIMIT
};

async function applyFilters(page = 1, filters = {}) {
  // Merge with default filters
  const activeFilters = { ...DEFAULT_FILTERS, ...filters };
  currentPage = page;
  
  const { type, sort, date, limit } = activeFilters;

  // Map UI selections to JSON filenames
  const typeMap = {
    "5L.coms & 6L.coms": "all",
    "5L.coms": "5L",
    "6L.coms": "6L"
  };

  const dateMap = {
    "today": "today",
    "yesterday": "yesterday", 
    "last7days": "last7days",
    "last30days": "last30days"
  };

  const sortMap = {
    "marketplace": "marketplace",
    "auction": "auction",
    "brokerage": "brokerage",
    "average": "average_value"
  };

  const filename = `${typeMap[type]}_${dateMap[date]}_${sortMap[sort]}.json`;
  const cacheBuster = `?v=${Date.now()}`;

  try {
    const response = await fetch(`/Lists/${filename}${cacheBuster}`);
    if (!response.ok) throw new Error('Data not found');

    const { domains } = await response.json();
    renderTable(domains, page, limit);
    renderPagination(domains.length, limit, page);

    // Update UI controls
    document.getElementById('type').value = type;
    document.getElementById('sort').value = sort;
    document.getElementById('date').value = date;
    document.getElementById('limit').value = limit;

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('domain-table').innerHTML = `
      <tr>
        <td colspan="8" class="p-4 text-red-400 text-center border border-gray-600">
          Error loading data: ${error.message}
        </td>
      </tr>`;
  }
}

function renderTable(domains, page, limit) {
  const table = document.getElementById('domain-table');
  table.innerHTML = '';

  const startIndex = (page - 1) * limit;
  const paginated = domains.slice(startIndex, startIndex + limit);

  paginated.forEach((d, i) => {
    const formattedDate = d.date ? d.date.replace(/\n/g, ' ') : 'N/A';
    const row = `<tr>
      <td class="p-2 border border-gray-600 text-center">${startIndex + i + 1}</td>
      <td class="p-2 border border-gray-600 whitespace-nowrap">${d.domain}</td>
      <td class="p-2 border border-gray-600 text-center">${d.domain_type}</td>
      <td class="p-2 border border-gray-600 text-center">$${d.auction}</td>
      <td class="p-2 border border-gray-600 text-center">$${d.marketplace}</td>
      <td class="p-2 border border-gray-600 text-center">$${d.brokerage}</td>
      <td class="p-2 border border-gray-600 text-center">$${d.average_value}</td>
      <td class="p-2 border border-gray-600 text-center whitespace-nowrap">${formattedDate}</td>
    </tr>`;
    table.insertAdjacentHTML('beforeend', row);
  });
}

function renderPagination(total, limit, current) {
  const pages = Math.ceil(total / limit);
  let html = '';

  if (pages <= 1) {
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  // Previous button
  html += `<button onclick="applyFilters(${current - 1})"
           class="mx-1 px-3 py-1 bg-gray-700 rounded ${current === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}">
           &laquo; Prev</button>`;

  // Page numbers
  const visiblePages = getVisiblePages(current, pages);
  
  visiblePages.forEach((page, index) => {
    if (page === '...') {
      html += `<span class="mx-1">...</span>`;
    } else {
      html += `<button onclick="applyFilters(${page})"
               class="mx-1 px-3 py-1 ${page === current ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} rounded">
               ${page}</button>`;
    }
  });

  // Next button
  html += `<button onclick="applyFilters(${current + 1})"
           class="mx-1 px-3 py-1 bg-gray-700 rounded ${current === pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}">
           Next &raquo;</button>`;

  document.getElementById('pagination').innerHTML = html;
}

function getVisiblePages(current, total) {
  const visible = [];
  const range = 2; // Number of pages to show around current
  
  // Always show first page
  visible.push(1);
  
  // Show pages around current
  for (let i = Math.max(2, current - range); i <= Math.min(total - 1, current + range); i++) {
    visible.push(i);
  }
  
  // Always show last page if different
  if (total > 1) {
    visible.push(total);
  }
  
  // Add ellipsis if gaps exist
  const simplified = [];
  let prev = 0;
  
  visible.forEach(page => {
    if (page - prev > 1) {
      simplified.push('...');
    }
    simplified.push(page);
    prev = page;
  });
  
  return simplified;
}

// Initialize with default filters
window.onload = () => applyFilters(1);
