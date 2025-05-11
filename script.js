let currentPage = 1;
const DEFAULT_LIMIT = 25;
let adViews = 0;
const MAX_FREE_VIEWS = 1;

function detectAdBlock() {
  return new Promise((resolve) => {
    const ad = document.createElement('div');
    ad.innerHTML = '&nbsp;';
    ad.className = 'adsbox';
    ad.style.position = 'absolute';
    ad.style.left = '-9999px';
    ad.style.height = '1px';
    ad.style.width = '1px';
    ad.style.overflow = 'hidden';
    document.body.appendChild(ad);
    
    setTimeout(() => {
      const isBlocked = ad.offsetHeight === 0;
      document.body.removeChild(ad);
      resolve(isBlocked);
    }, 100);
  });
}

function showAdWall() {
  return new Promise((resolve) => {
    const adWall = document.getElementById('ad-wall');
    adWall.style.display = 'flex';
    
    const adContainer = document.getElementById('rewarded-ad-container');
    const adScript = document.createElement('script');
    adScript.innerHTML = `(adsbygoogle = window.adsbygoogle || []).push({google_ad_client: "ca-pub-5000719233865730", enable_page_level_ads: true, overlays: {bottom: true}});`;
    adContainer.appendChild(adScript);
    
    document.getElementById('skip-ad').addEventListener('click', () => {
      adWall.style.display = 'none';
      resolve(false);
    });
    
    const observer = new MutationObserver(() => {
      if (!adContainer.querySelector('iframe')) {
        adWall.style.display = 'none';
        resolve(true);
        observer.disconnect();
      }
    });
    observer.observe(adContainer, {childList: true});
  });
}

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
  
  if (!consentGiven) {
    consentBanner.style.display = 'flex';
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'analytics_storage': 'denied',
      'functionality_storage': 'granted',
      'personalization_storage': 'denied',
      'security_storage': 'granted'
    });
  }
  
  document.getElementById('accept-consent').addEventListener('click', () => {
    localStorage.setItem('consentGiven', 'all');
    gtag('consent', 'update', {'ad_storage': 'granted', 'analytics_storage': 'granted'});
    consentBanner.style.display = 'none';
  });
  
  document.getElementById('reject-consent').addEventListener('click', () => {
    localStorage.setItem('consentGiven', 'none');
    gtag('consent', 'update', {'ad_storage': 'denied', 'analytics_storage': 'denied'});
    consentBanner.style.display = 'none';
  });
  
  document.getElementById('customize-consent').addEventListener('click', () => {
    consentModal.style.display = 'block';
  });
  
  document.getElementById('cancel-consent').addEventListener('click', () => {
    consentModal.style.display = 'none';
  });
  
  document.getElementById('save-consent').addEventListener('click', () => {
    const analytics = document.getElementById('analytics-cookies').checked;
    const advertising = document.getElementById('advertising-cookies').checked;
    localStorage.setItem('consentGiven', 'custom');
    gtag('consent', 'update', {
      'analytics_storage': analytics ? 'granted' : 'denied',
      'ad_storage': advertising ? 'granted' : 'denied'
    });
    consentModal.style.display = 'none';
    consentBanner.style.display = 'none';
  });

  window.addEventListener('popstate', () => { adViews++; });
  adViews++;
});

function sendGAEvent(category, action, label = '', value = '') {
  gtag('event', action, {'event_category': category, 'event_label': label, 'value': value});
}

function setDefaultFilters() {
  document.getElementById('type').value = "5L.coms & 6L.coms";
  document.getElementById('sort').value = "marketplace";
  document.getElementById('date').value = "last7days";
  document.getElementById('limit').value = DEFAULT_LIMIT;
  sendGAEvent('Page Interaction', 'Set Default Filters');
}

async function applyFilters(page = 1) {
  if (page > 1 && adViews >= MAX_FREE_VIEWS) {
    const adBlockDetected = await detectAdBlock();
    if (adBlockDetected) {
      const proceed = confirm("Please disable your ad blocker to continue using Talxa. Our service relies on ad revenue.");
      if (!proceed) return;
    }
    const watchedAd = await showAdWall();
    if (!watchedAd) {
      alert("Some features may be limited. Please consider supporting us by watching ads.");
      return;
    }
    adViews = 0;
  }

  currentPage = page;
  const type = document.getElementById('type').value;
  const sort = document.getElementById('sort').value;
  const date = document.getElementById('date').value;
  const limit = parseInt(document.getElementById('limit').value);

  sendGAEvent('Filter Applied', 'Type', type);
  sendGAEvent('Filter Applied', 'Sort', sort);
  sendGAEvent('Filter Applied', 'Date', date);
  sendGAEvent('Filter Applied', 'Limit', limit);

  gtag('event', 'page_view', {
    'page_title': `Filtered Domains: type=${type}|sort=${sort}|date=${date}|limit=${limit}`,
    'page_path': `/?type=${type}|sort=${sort}|date=${date}|limit=${limit}`
  });

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
  } catch (error) {
    console.error('Error:', error);
    const errorContainer = document.getElementById('domain-table');
    errorContainer.innerHTML = `<tr>
      <td colspan="8" class="p-4 text-center border border-gray-600">
        <div class="text-red-400 mb-2">Error loading domain data</div>
        <p class="text-gray-300 text-sm">We're unable to load the domain valuations right now.</p>
        <p class="text-gray-300 text-sm mt-2">Try refreshing the page or check back later.</p>
        <button onclick="applyFilters(${currentPage})" class="mt-3 bg-blue-600 text-white px-3 py-1 rounded text-sm">Retry</button>
      </td>
    </tr>`;
    gtag('event', 'exception', {description: error.message, fatal: false});
  }
}

function renderPagination(total, limit, current) {
  const pages = Math.ceil(total / limit);
  let html = '';

  if (pages <= 1) {
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  html += `<button onclick="applyFilters(${current - 1})" class="mx-1 px-3 py-1 bg-gray-700 rounded ${current === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}">&laquo; Prev</button>`;

  const visiblePages = getVisiblePages(current, pages);
  visiblePages.forEach((page, index) => {
    if (page === '...') {
      html += `<span class="mx-1">...</span>`;
    } else {
      html += `<button onclick="applyFilters(${page})" class="mx-1 px-3 py-1 ${page === current ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} rounded">${page}</button>`;
    }
  });

  html += `<button onclick="applyFilters(${current + 1})" class="mx-1 px-3 py-1 bg-gray-700 rounded ${current === pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}">Next &raquo;</button>`;
  document.getElementById('pagination').innerHTML = html;
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

window.onload = () => {
  setDefaultFilters();
  applyFilters(1);
  sendGAEvent('Page View', 'Home Page Load');
};
