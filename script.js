let currentPage = 1;
const DEFAULT_LIMIT = 25;

// Track page load time
document.addEventListener('DOMContentLoaded', function() {
  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  gtag('event', 'timing_complete', {
    'name': 'pageLoad',
    'value': pageLoadTime,
    'event_category': 'JS Dependencies'
  });

  // Track link clicks
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function() {
      gtag('event', 'link_click', {
        'event_category': 'Outbound Link',
        'event_label': this.href
      });
    });
  });
});

// Function to send custom events to Google Analytics
function sendGAEvent(category, action, label = '', value = '') {
  gtag('event', action, {
    'event_category': category,
    'event_label': label,
    'value': value
  });
}

// Set default values on page load
function setDefaultFilters() {
  document.getElementById('type').value = "5L.coms & 6L.coms";
  document.getElementById('sort').value = "marketplace";
  document.getElementById('date').value = "last7days";
  document.getElementById('limit').value = DEFAULT_LIMIT;
  sendGAEvent('Page Interaction', 'Set Default Filters');
}

async function applyFilters(page = 1) {
  currentPage = page;
  const type = document.getElementById('type').value;
  const sort = document.getElementById('sort').value;
  const date = document.getElementById('date').value;
  const limit = parseInt(document.getElementById('limit').value);

  // Track the applied filters
  sendGAEvent('Filter Applied', 'Type', type);
  sendGAEvent('Filter Applied', 'Sort', sort);
  sendGAEvent('Filter Applied', 'Date', date);
  sendGAEvent('Filter Applied', 'Limit', limit);

  // Track filter combinations as virtual pageviews
  const filterState = `type=${type}|sort=${sort}|date=${date}|limit=${limit}`;
  gtag('event', 'page_view', {
    'page_title': `Filtered Domains: ${filterState}`,
    'page_path': `/?${filterState}`
  });

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

    // Track page view based on domain list
    sendGAEvent('Page View', 'Domain List View', filename);

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

      // Track row usage
      sendGAEvent('Domain Interaction', 'Row Displayed', d.domain);
    });

    renderPagination(domains.length, limit, page);

  } catch (error) {
    handleSEOFriendlyError(error);
  }
}

function handleSEOFriendlyError(error) {
  console.error('Error:', error);
  const errorContainer = document.getElementById('domain-table');
  errorContainer.innerHTML = `
    <tr>
      <td colspan="8" class="p-4 text-center border border-gray-600">
        <div class="text-red-400 mb-2">Error loading domain data</div>
        <p class="text-gray-300 text-sm">We're unable to load the domain valuations right now.</p>
        <p class="text-gray-300 text-sm mt-2">Try refreshing the page or check back later.</p>
        <button onclick="applyFilters(${currentPage})" 
                class="mt-3 bg-blue-600 text-white px-3 py-1 rounded text-sm">
          Retry
        </button>
      </td>
    </tr>`;
  
  // Track the error for SEO diagnostics
  gtag('event', 'exception', {
    'description': error.message,
    'fatal': false
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
window.onload = () => {
  setDefaultFilters();
  applyFilters(1);

  // Track initial page load
  sendGAEvent('Page View', 'Home Page Load');
};
