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
  
  // SECURITY FIX: Dynamic path resolution
  const basePath = window.location.hostname === 'localhost' ? '' : `/${window.location.pathname.split('/')[1] || ''}`;
  const filePath = `${basePath}/Lists/${filename}?v=${Date.now()}`;

  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error('Data not found');

    const { domains } = await response.json();

    const table = document.getElementById('domain-table');
    table.innerHTML = '';

    const startIndex = (page - 1) * limit;
    const paginated = domains.slice(startIndex, startIndex + limit);

    // ORIGINAL STYLING PRESERVED:
    paginated.forEach((d, i) => {
      const row = `<tr class="border-b border-gray-600">
        <td>${startIndex + i + 1}</td>
        <td>${d.domain}</td>
        <td>${d.domain_type}</td>
        <td>$${d.auction}</td>
        <td>$${d.marketplace}</td>
        <td>$${d.brokerage}</td>
        <td>$${d.average_value}</td>
        <td>${d.date}</td>
      </tr>`;
      table.insertAdjacentHTML('beforeend', row);
    });

    renderPagination(domains.length, limit, page);

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('domain-table').innerHTML = `
      <tr>
        <td colspan="8" class="text-red-400 p-4">
          Error loading data: ${error.message}
        </td>
      </tr>`;
  }
}

// ORIGINAL PAGINATION STYLING
function renderPagination(total, limit, current) {
  const pages = Math.ceil(total / limit);
  let html = '';

  if (current > 1) html += `<button onclick="applyFilters(${current - 1})" class="mx-1 px-2 py-1 bg-gray-700 rounded">Prev</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button onclick="applyFilters(${i})" class="mx-1 px-2 py-1 ${i === current ? 'bg-blue-600' : 'bg-gray-700'} rounded">${i}</button>`;
  }
  if (current < pages) html += `<button onclick="applyFilters(${current + 1})" class="mx-1 px-2 py-1 bg-gray-700 rounded">Next</button>`;

  document.getElementById('pagination').innerHTML = html;
}

window.onload = () => applyFilters();
