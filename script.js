let currentPage = 1;
const DEFAULT_LIMIT = 25;
let adViews = 0;
const MAX_FREE_VIEWS = 1;

// AdBlock detection
function detectAdBlock() {
  return new Promise((resolve) => {
    const ad = document.createElement('div');
    ad.innerHTML = '&nbsp;';
    ad.className = 'adsbox';
    document.body.appendChild(ad);
    
    setTimeout(() => {
      const isBlocked = ad.offsetHeight === 0;
      document.body.removeChild(ad);
      resolve(isBlocked);
    }, 100);
  });
}

// Show rewarded ad
function showAdWall() {
  return new Promise((resolve) => {
    const adWall = document.getElementById('ad-wall');
    adWall.style.display = 'flex';
    
    const adScript = document.createElement('script');
    adScript.innerHTML = `(adsbygoogle = window.adsbygoogle || []).push({google_ad_client: "ca-pub-5000719233865730", enable_page_level_ads: true});`;
    document.getElementById('rewarded-ad-container').appendChild(adScript);
    
    document.getElementById('skip-ad').onclick = () => {
      adWall.style.display = 'none';
      resolve(false);
    };
    
    const observer = new MutationObserver(() => {
      if (!document.getElementById('rewarded-ad-container').querySelector('iframe')) {
        adWall.style.display = 'none';
        resolve(true);
      }
    });
    observer.observe(document.getElementById('rewarded-ad-container'), {childList: true});
  });
}

// Consent management
document.addEventListener('DOMContentLoaded', () => {
  const consentBanner = document.getElementById('consent-banner');
  if (!localStorage.getItem('consentGiven')) {
    consentBanner.style.display = 'block';
  }
  
  document.getElementById('accept-consent').onclick = () => {
    localStorage.setItem('consentGiven', 'true');
    consentBanner.style.display = 'none';
    gtag('consent', 'update', {
      'ad_storage': 'granted',
      'analytics_storage': 'granted'
    });
  };
  
  document.getElementById('reject-consent').onclick = () => {
    localStorage.setItem('consentGiven', 'false');
    consentBanner.style.display = 'none';
  };

  // Track page views for ads
  window.addEventListener('popstate', () => { adViews++; });
  adViews++;
});

// Main filter function
async function applyFilters(page = 1) {
  if (page > 1 && adViews >= MAX_FREE_VIEWS) {
    const adBlockDetected = await detectAdBlock();
    if (adBlockDetected) {
      const proceed = confirm("Please disable ad blocker to continue");
      if (!proceed) return;
    }
    const watchedAd = await showAdWall();
    if (!watchedAd) return;
    adViews = 0;
  }

  currentPage = page;
  const type = document.getElementById('type').value;
  const sort = document.getElementById('sort').value;
  const date = document.getElementById('date').value;
  const limit = parseInt(document.getElementById('limit').value);

  const typeMap = {
    "5L.coms & 6L.coms": "all",
    "5L.coms": "5L",
    "6L.coms": "6L"
  };

  const dateMap = {
    "today": "today",
    "yesterday": "yesterday", 
    "last7days": "last7days"
  };

  const sortMap = {
    "marketplace": "marketplace",
    "auction": "auction",
    "brokerage": "brokerage",
    "average": "average_value"
  };

  const filename = `${typeMap[type]}_${dateMap[date]}_${sortMap[sort]}.json`;
  
  try {
    const response = await fetch(`/Lists/${filename}?v=${Date.now()}`);
    if (!response.ok) throw new Error('Data not found');
    const { domains } = await response.json();
    
    const table = document.getElementById('domain-table');
    table.innerHTML = '';
    const startIndex = (page - 1) * limit;
    const paginated = domains.slice(startIndex, startIndex + limit);

    paginated.forEach((d, i) => {
      const row = `<tr>
        <td class="p-2 border border-gray-600 text-center">${startIndex + i + 1}</td>
        <td class="p-2 border border-gray-600">${d.domain}</td>
        <td class="p-2 border border-gray-600 text-center">${d.domain_type}</td>
        <td class="p-2 border border-gray-600 text-center">$${d.auction}</td>
        <td class="p-2 border border-gray-600 text-center">$${d.marketplace}</td>
        <td class="p-2 border border-gray-600 text-center">$${d.brokerage}</td>
        <td class="p-2 border border-gray-600 text-center">$${d.average_value}</td>
        <td class="p-2 border border-gray-600 text-center">${d.date.replace(/\n/g, ' ')}</td>
      </tr>`;
      table.insertAdjacentHTML('beforeend', row);
    });

    renderPagination(domains.length, limit, page);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('domain-table').innerHTML = `
      <tr>
        <td colspan="8" class="p-4 text-center border border-gray-600">
          Error loading data. <button onclick="applyFilters(${currentPage})" class="text-blue-400">Try again</button>
        </td>
      </tr>`;
  }
}

function renderPagination(total, limit, current) {
  const pages = Math.ceil(total / limit);
  let html = '';

  if (pages <= 1) return;

  if (current > 1) {
    html += `<button onclick="applyFilters(${current - 1})" class="mx-1 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Prev</button>`;
  }

  for (let i = 1; i <= pages; i++) {
    html += `<button onclick="applyFilters(${i})" class="mx-1 px-3 py-1 ${i === current ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} rounded">${i}</button>`;
  }

  if (current < pages) {
    html += `<button onclick="applyFilters(${current + 1})" class="mx-1 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Next</button>`;
  }

  document.getElementById('pagination').innerHTML = html;
}

// Initialize
window.onload = () => {
  document.getElementById('type').value = "5L.coms & 6L.coms";
  document.getElementById('sort').value = "marketplace";
  document.getElementById('date').value = "last7days";
  document.getElementById('limit').value = DEFAULT_LIMIT;
  applyFilters(1);
};
