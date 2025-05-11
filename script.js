let currentPage = 1;
const DEFAULT_LIMIT = 25;

document.addEventListener('DOMContentLoaded', function() {
  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  gtag('event', 'timing_complete', {name: 'pageLoad', value: pageLoadTime, event_category: 'JS Dependencies'});

  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function() {
      gtag('event', 'link_click', {event_category: 'Outbound Link', event_label: this.href});
    });
  });

  const consentBanner = document.getElementById('consent-banner');
  const consentModal = document.getElementById('consent-modal');
  const consentGiven = localStorage.getItem('consentGiven');

  if (!consentGiven && consentBanner) {
    consentBanner.style.display = 'flex';
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'analytics_storage': 'denied',
      'functionality_storage': 'granted',
      'personalization_storage': 'denied',
      'security_storage': 'granted'
    });
  }

  if (document.getElementById('accept-consent')) {
    document.getElementById('accept-consent').addEventListener('click', () => {
      localStorage.setItem('consentGiven', 'all');
      gtag('consent', 'update', {'ad_storage': 'granted', 'analytics_storage': 'granted'});
      if (consentBanner) consentBanner.style.display = 'none';
    });
  }

  if (document.getElementById('reject-consent')) {
    document.getElementById('reject-consent').addEventListener('click', () => {
      localStorage.setItem('consentGiven', 'none');
      gtag('consent', 'update', {'ad_storage': 'denied', 'analytics_storage': 'denied'});
      if (consentBanner) consentBanner.style.display = 'none';
    });
  }

  if (document.getElementById('customize-consent')) {
    document.getElementById('customize-consent').addEventListener('click', () => {
      if (consentModal) consentModal.style.display = 'block';
    });
  }

  if (document.getElementById('cancel-consent')) {
    document.getElementById('cancel-consent').addEventListener('click', () => {
      if (consentModal) consentModal.style.display = 'none';
    });
  }

  if (document.getElementById('save-consent')) {
    document.getElementById('save-consent').addEventListener('click', () => {
      const analytics = document.getElementById('analytics-cookies')?.checked || false;
      const advertising = document.getElementById('advertising-cookies')?.checked || false;
      localStorage.setItem('consentGiven', 'custom');
      gtag('consent', 'update', {
        'analytics_storage': analytics ? 'granted' : 'denied',
        'ad_storage': advertising ? 'granted' : 'denied'
      });
      if (consentModal) consentModal.style.display = 'none';
      if (consentBanner) consentBanner.style.display = 'none';
    });
  }

  // Initialize the page
  setDefaultFilters();
  applyFilters(1);
});

function sendGAEvent(category, action, label = '', value = '') {
  if (typeof gtag === 'function') {
    gtag('event', action, {'event_category': category, 'event_label': label, 'value': value});
  }
}

function setDefaultFilters() {
  const typeSelect = document.getElementById('type');
  const sortSelect = document.getElementById('sort');
  const dateSelect = document.getElementById('date');
  const limitSelect = document.getElementById('limit');
  
  if (typeSelect) typeSelect.value = "5L.coms & 6L.coms";
  if (sortSelect) sortSelect.value = "marketplace";
  if (dateSelect) dateSelect.value = "last7days";
  if (limitSelect) limitSelect.value = DEFAULT_LIMIT;
  sendGAEvent('Page Interaction', 'Set Default Filters');
}

async function applyFilters(page = 1) {
  currentPage = page;
  const type = document.getElementById('type')?.value || "5L.coms & 6L.coms";
  const sort = document.getElementById('sort')?.value || "marketplace";
  const date = document.getElementById('date')?.value || "last7days";
  const limit = parseInt(document.getElementById('limit')?.value || DEFAULT_LIMIT);

  sendGAEvent('Filter Applied', 'Type', type);
  sendGAEvent('Filter Applied', 'Sort', sort);
  sendGAEvent('Filter Applied', 'Date', date);
  sendGAEvent('Filter Applied', 'Limit', limit);

  if (typeof gtag === 'function') {
    gtag('event', 'page_view', {
      'page_title': `Filtered Domains: type=${type}|sort=${sort}|date=${date}|limit=${limit}`,
      'page_path': `/?type=${type}|sort=${sort}|date=${date}|limit=${limit}`
    });
  }

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
    sendGAEvent('Page View', 'Domain List View', filename);
    const table = document.getElementById('domain-table');
    if (table) {
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
        sendGAEvent('Domain Interaction', 'Row Displayed', d.domain);
      });

      renderPagination(domains.length, limit, page);
    }
  } catch (error) {
    console.error('Error:', error);
    const errorContainer = document.getElementById('domain-table');
    if (errorContainer) {
      errorContainer.innerHTML = `<tr>
        <td colspan="8" class="p-4 text-center border border-gray-600">
          <div class="text-red-400 mb-2">Error loading domain data</div>
          <p class="text-gray-300 text-sm">We're unable to load the domain valuations right now.</p>
          <p class="text-gray-300 text-sm mt-2">Try refreshing the page or check back later.</p>
          <button onclick="applyFilters(${currentPage})" class="mt-3 bg-blue-600 text-white px-3 py-1 rounded text-sm">Retry</button>
        </td>
      </tr>`;
    }
    if (typeof gtag === 'function') {
      gtag('event', 'exception', {description: error.message, fatal: false});
    }
  }
}

function renderPagination(total, limit, current) {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;
  
  const pages = Math.ceil(total / limit);
  let html = '';

  if (pages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  // Previous button
  const prevDisabled = current === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 cursor-pointer';
  html += `<button id="prev-btn" class="mx-1 px-3 py-1 bg-gray-700 rounded ${prevDisabled}">&laquo; Prev</button>`;

  // Page numbers
  const visiblePages = getVisiblePages(current, pages);
  visiblePages.forEach((page, index) => {
    if (page === '...') {
      html += `<span class="mx-1">...</span>`;
    } else {
      const activeClass = page === current ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer';
      html += `<button class="page-btn mx-1 px-3 py-1 rounded ${activeClass}" data-page="${page}">${page}</button>`;
    }
  });

  // Next button
  const nextDisabled = current === pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 cursor-pointer';
  html += `<button id="next-btn" class="mx-1 px-3 py-1 bg-gray-700 rounded ${nextDisabled}">Next &raquo;</button>`;

  paginationContainer.innerHTML = html;

  // Add event listeners
  const prevBtn = document.getElementById('prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (current > 1) applyFilters(current - 1);
    });
  }

  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (current < pages) applyFilters(current + 1);
    });
  }

  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      applyFilters(page);
    });
  });
}

function getVisiblePages(current, total) {
  const visible = [];
  const range = 2;
  visible.push(1);
  for (let i = Math.max(2, current - range); i <= Math.min(total - 1, current + range); i++) {
    visible.push(i);
  }
  if (total > 1) visible.push(total);
  const simplified = [];
  let prev = 0;
  visible.forEach(page => {
    if (page - prev > 1) simplified.push('...');
    simplified.push(page);
    prev = page;
  });
  return simplified;
}
