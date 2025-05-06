let currentPage = 1;
const DEFAULT_LIMIT = 25;

async function applyFilters(page = 1) {
  currentPage = page;
  const type = document.getElementById('type').value || "5L.coms & 6L.coms";
  const sort = document.getElementById('sort').value || "marketplace";
  const date = document.getElementById('date').value || "last7days";
  const limit = parseInt(document.getElementById('limit').value || DEFAULT_LIMIT);

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

  // Try to load default view first
  let filename = 'default_view.json';
  let cacheBuster = `?v=${Date.now()}`;
  
  try {
    let response = await fetch(`/Lists/${filename}${cacheBuster}`);
    if (!response.ok) throw new Error('Default view not found');
    
    const { domains } = await response.json();
    renderTable(domains, page, limit);
    renderPagination(domains.length, limit, page);
    return;
    
  } catch (defaultError) {
    console.log('Using fallback filtering');
    filename = `${typeMap[type]}_${dateMap[date]}_${sortMap[sort]}.json`;
    
    try {
      response = await fetch(`/Lists/${filename}${cacheBuster}`);
      if (!response.ok) throw new Error('Data not found');
      
      const { domains } = await response.json();
      renderTable(domains, page, limit);
      renderPagination(domains.length, limit, page);
      
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
}

function renderTable(domains, page, limit) {
  const table = document.getElementById('domain-table');
  table.innerHTML = '';

  const startIndex = (page - 1) * limit;
  const paginated = domains.slice(startIndex, startIndex + limit);

  // Find longest date for column sizing
  let maxDateLength = '2025-05-04'.length;
  domains.forEach(d => {
    if (d.date && d.date.replace(/\n/g, '').length > maxDateLength) {
      maxDateLength = d.date.replace(/\n/g, '').length;
    }
  });

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

  if (pages <= 1) return;

  // Previous button
  html += `<button onclick="applyFilters(${current - 1})"
           class="mx-1 px-3 py-1 bg-gray-700 rounded ${current === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}">
           &laquo; Prev</button>`;

  // Always show first page
  if (current > 2) {
    html += `<button onclick="applyFilters(1)"
             class="mx-1 px-3 py-1 ${1 === current ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} rounded">
             1</button>`;
    if (current > 3) html += `<span class="mx-1">...</span>`;
  }

  // Show current page and neighbors
  const start = Math.max(1, current - 1);
  const end = Math.min(pages, current + 1);

  for (let i = start; i <= end; i++) {
    html += `<button onclick="applyFilters(${i})"
             class="mx-1 px-3 py-1 ${i === current ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} rounded">
             ${i}</button>`;
  }

  // Always show last page if different
  if (current < pages - 2) {
    html += `<span class="mx-1">...</span>`;
    html += `<button onclick="applyFilters(${pages})"
             class="mx-1 px-3 py-1 ${pages === current ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} rounded">
             ${pages}</button>`;
  }

  // Next button
  html += `<button onclick="applyFilters(${current + 1})"
           class="mx-1 px-3 py-1 bg-gray-700 rounded ${current === pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}">
           Next &raquo;</button>`;

  document.getElementById('pagination').innerHTML = html;
}

// Set default values on load
window.onload = () => {
  document.getElementById('type').value = "5L.coms & 6L.coms";
  document.getElementById('sort').value = "marketplace";
  document.getElementById('date').value = "last7days";
  document.getElementById('limit').value = DEFAULT_LIMIT;
  applyFilters(1);
};
