let currentPage = 1;

async function applyFilters(page = 1) {
  const type = document.getElementById('type').value;
  const sort = document.getElementById('sort').value;
  const date = document.getElementById('date').value;
  const limit = parseInt(document.getElementById('limit').value);

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

  // Construct the correct path to JSON files
  const basePath = window.location.hostname === 'localhost' ? '' : '/Talxa.com';
  const filename = `${typeMap[type]}_${dateMap[date]}_${sortMap[sort]}.json`;
  const filePath = `${basePath}/Lists/${filename}?v=${Date.now()}`;

  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      // Try alternative path if first attempt fails
      const altResponse = await fetch(`/Lists/${filename}?v=${Date.now()}`);
      if (!altResponse.ok) throw new Error('Data not found');
      return processData(await altResponse.json(), page, limit);
    }
    processData(await response.json(), page, limit);
  } catch (error) {
    showError(error);
  }
}

function processData(data, page, limit) {
  const table = document.getElementById('domain-table');
  table.innerHTML = '';

  const { domains } = data;
  const startIndex = (page - 1) * limit;
  const paginated = domains.slice(startIndex, startIndex + limit);

  if (domains.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="8" class="text-yellow-400 p-4">
          No domains found matching your criteria
        </td>
      </tr>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  paginated.forEach((d, i) => {
    const row = `<tr class="border-b border-gray-600">
      <td>${startIndex + i + 1}</td>
      <td class="font-mono">${d.domain}</td>
      <td>${d.domain_type}</td>
      <td>$${d.auction.toLocaleString()}</td>
      <td>$${d.marketplace.toLocaleString()}</td>
      <td>$${d.brokerage.toLocaleString()}</td>
      <td>$${d.average_value.toLocaleString()}</td>
      <td>${new Date(d.date).toLocaleDateString()}</td>
    </tr>`;
    table.insertAdjacentHTML('beforeend', row);
  });

  renderPagination(domains.length, limit, page);
}

function showError(error) {
  console.error('Error:', error);
  document.getElementById('domain-table').innerHTML = `
    <tr>
      <td colspan="8" class="text-red-400 p-4">
        Error loading data: ${error.message}<br>
        <small>Please check your filters and try again</small>
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
             Prev</button>`;
  }
  
  // Show first page, current range, and last page
  const maxVisible = 5;
  let startPage = Math.max(1, current - Math.floor(maxVisible/2));
  let endPage = Math.min(pages, startPage + maxVisible - 1);
  
  if (startPage > 1) {
    html += `<button onclick="applyFilters(1)" 
             class="mx-1 px-3 py-1 ${1 === current ? 'bg-blue-600' : 'bg-gray-700'} rounded">
             1</button>`;
    if (startPage > 2) html += `<span class="mx-1">...</span>`;
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `<button onclick="applyFilters(${i})" 
             class="mx-1 px-3 py-1 ${i === current ? 'bg-blue-600' : 'bg-gray-700'} rounded">
             ${i}</button>`;
  }
  
  if (endPage < pages) {
    if (endPage < pages - 1) html += `<span class="mx-1">...</span>`;
    html += `<button onclick="applyFilters(${pages})" 
             class="mx-1 px-3 py-1 ${pages === current ? 'bg-blue-600' : 'bg-gray-700'} rounded">
             ${pages}</button>`;
  }

  if (current < pages) {
    html += `<button onclick="applyFilters(${current + 1})" 
             class="mx-1 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">
             Next</button>`;
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
