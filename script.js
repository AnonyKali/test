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
  const row = `<tr class="border-b border-gray-600">
    <td class="px-2 py-1">${startIndex + i + 1}</td>
    <td class="px-4 py-1">${d.domain}</td>
    <td class="px-3 py-1 border-l border-r border-gray-600">${d.domain_type}</td>
    <td class="px-3 py-1 border-r border-gray-600">$${d.auction}</td>
    <td class="px-3 py-1 border-r border-gray-600">$${d.marketplace}</td>
    <td class="px-3 py-1 border-r border-gray-600">$${d.brokerage}</td>
    <td class="px-3 py-1 border-r border-gray-600">$${d.average_value}</td>
    <td class="px-3 py-1">${d.date}</td>
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
