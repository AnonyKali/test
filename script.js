let currentPage = 1;

async function applyFilters(page = 1) {
  const type = document.getElementById('type').value;
  const sort = document.getElementById('sort').value;
  const date = document.getElementById('date').value;
  const limit = parseInt(document.getElementById('limit').value);

  // Show loading state
  const table = document.getElementById('domain-table');
  table.innerHTML = '<tr><td colspan="8" class="p-4 text-center">Loading domains...</td></tr>';

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

  // Dynamic path resolution
  const filename = `${typeMap[type]}_${dateMap[date]}_${sortMap[sort]}.json`;
  const repoName = window.location.pathname.split('/')[1] || ''; // Gets "test" from /test/
  const basePath = repoName ? `/${repoName}` : '';
  const filePath = `${basePath}/Lists/${filename}?v=${Date.now()}`;

  try {
    const response = await fetch(filePath);
    
    if (!response.ok) {
      // Try without repo name if in root
      const altResponse = await fetch(`/Lists/${filename}?v=${Date.now()}`);
      if (!altResponse.ok) throw new Error(`Data file not found: ${filename}`);
      return processData(await altResponse.json(), page, limit);
    }
    
    processData(await response.json(), page, limit);
  } catch (error) {
    showError(error, filename);
  }
}

function processData(data, page, limit) {
  const table = document.getElementById('domain-table');
  
  if (!data.domains || data.domains.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="8" class="text-yellow-400 p-4">
          No domains found for the selected filters
        </td>
      </tr>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  table.innerHTML = '';
  const startIndex = (page - 1) * limit;
  const paginated = data.domains.slice(startIndex, startIndex + limit);

  paginated.forEach((d, i) => {
    const row = `<tr class="border-b border-gray-600 hover:bg-gray-700">
      <td class="py-2">${startIndex + i + 1}</td>
      <td class="font-mono py-2">${d.domain}</td>
      <td class="py-2">${d.domain_type}</td>
      <td class="py-2">$${d.auction?.toLocaleString() || '0'}</td>
      <td class="py-2">$${d.marketplace?.toLocaleString() || '0'}</td>
      <td class="py-2">$${d.brokerage?.toLocaleString() || '0'}</td>
      <td class="py-2">$${d.average_value?.toLocaleString() || '0'}</td>
      <td class="py-2">${d.date || 'N/A'}</td>
    </tr>`;
    table.insertAdjacentHTML('beforeend', row);
  });

  renderPagination(data.domains.length, limit, page);
}

function showError(error, filename) {
  console.error('Error:', error);
  document.getElementById('domain-table').innerHTML = `
    <tr>
      <td colspan="8" class="text-red-400 p-4">
        Error loading ${filename}: ${error.message}<br>
        <button onclick="applyFilters(${currentPage})" 
                class="mt-2 px-4 py-1 bg-blue-600 rounded">
          Retry
        </button>
      </td>
    </tr>`;
  document.getElementById('pagination').innerHTML = '';
}

function renderPagination(total, limit, current) {
  const pages = Math.ceil(total / limit);
  let html = '';

  if (current > 1) {
    html += `<button onclick="applyFilters(${current - 1})" 
             class="mx-1 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">
             &laquo; Prev</button>`;
  }
  
  // Always show first page
  if (current > 3) {
    html += `<button onclick="applyFilters(1)" 
             class="mx-1 px-3 py-1 ${1 === current ? 'bg-blue-600' : 'bg-gray-700'} rounded">
             1</button>`;
    if (current > 4) html += `<span class="mx-1">...</span>`;
  }
  
  // Show pages around current
  const start = Math.max(1, current - 2);
  const end = Math.min(pages, current + 2);
  
  for (let i = start; i <= end; i++) {
    html += `<button onclick="applyFilters(${i})" 
             class="mx-1 px-3 py-1 ${i === current ? 'bg-blue-600' : 'bg-gray-700'} rounded">
             ${i}</button>`;
  }
  
  // Always show last page
  if (current < pages - 2) {
    if (current < pages - 3) html += `<span class="mx-1">...</span>`;
    html += `<button onclick="applyFilters(${pages})" 
             class="mx-1 px-3 py-1 ${pages === current ? 'bg-blue-600' : 'bg-gray-700'} rounded">
             ${pages}</button>`;
  }

  if (current < pages) {
    html += `<button onclick="applyFilters(${current + 1})" 
             class="mx-1 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">
             Next &raquo;</button>`;
  }

  document.getElementById('pagination').innerHTML = html;
}

// Initialize with default filters
window.onload = () => {
  // Set default selections
  document.getElementById('type').value = '5L.coms & 6L.coms';
  document.getElementById('sort').value = 'average';
  document.getElementById('date').value = 'last7days';
  document.getElementById('limit').value = '25';
  
  applyFilters(1);
};
