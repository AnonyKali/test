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

  const filename = `${typeMap[type]}_${dateMap[date]}_${sortMap[sort]}.json`;
  const cacheBuster = `?v=${Date.now()}`;

  try {
    const response = await fetch(`/Lists/${filename}${cacheBuster}`);
    if (!response.ok) throw new Error('Data not found');

    const { domains } = await response.json();

    const table = document.getElementById('domain-table');
    table.innerHTML = '';

    const startIndex = (page - 1) * limit;
    const paginated = domains.slice(startIndex, startIndex + limit);

    paginated.forEach((d, i) => {
      // Format date to show in one line
      const formattedDate = d.date ? d.date.replace(/\n/g, ' ') : 'N/A';
      const row = `<tr>
        <td class="p-2 border border-gray-600 text-center">${startIndex + i + 1}</td>
        <td class="p-2 border border-gray-600">${d.domain}</td>
        <td class="p-2 border border-gray-600 text-center">${d.domain_type}</td>
        <td class="p-2 border border-gray-600 text-center">$${d.auction}</td>
        <td class="p-2 border border-gray-600 text-center">$${d.marketplace}</td>
        <td class="p-2 border border-gray-600 text-center">$${d.brokerage}</td>
        <td class="p-2 border border-gray-600 text-center">$${d.average_value}</td>
        <td class="p-2 border border-gray-600 text-center">${formattedDate}</td>
      </tr>`;
      table.insertAdjacentHTML('beforeend', row);
    });

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

function renderPagination(total, limit, current) {
  const pages = Math.ceil(total / limit);
  let html = '';
  const maxVisiblePages = 5; // Adjust this number as needed

  // Previous button
  html += `<button onclick="applyFilters(${current - 1})" 
           class="mx-1 px-3 py-1 bg-gray-700 rounded ${current === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}">
           &laquo; Prev</button>`;

  // Always show first page
  if (current > 2) {
    html += `<button onclick="applyFilters(1)" 
             class="mx-1 px-3 py-1 ${1 === current ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} rounded">
             1</button>`;
  }

  // Show ellipsis if needed
  if (current > 3) {
    html += `<span class="mx-1">...</span>`;
  }

  // Show pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(pages - 1, current + 1);
  
  for (let i = start; i <= end; i++) {
    html += `<button onclick="applyFilters(${i})" 
             class="mx-1 px-3 py-1 ${i === current ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} rounded">
             ${i}</button>`;
  }

  // Show ellipsis if needed
  if (current < pages - 2) {
    html += `<span class="mx-1">...</span>`;
  }

  // Always show last page if not already shown
  if (pages > 1 && current < pages - 1) {
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

window.onload = () => applyFilters();
