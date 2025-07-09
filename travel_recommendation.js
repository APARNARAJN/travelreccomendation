
let travelData = null;
let cachedResults = new Map(); // Cache for API results

// API Configuration
const API_CONFIG = {
  geoDb: {
    baseUrl: 'https://wft-geo-db.p.rapidapi.com/v1/geo',
    headers: {
      'X-RapidAPI-Key': 'be91d7b10dmsh8d32d00b693eae0p1b83a6jsncaabb2bf3aab', 
      'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
    }
  },
  unsplash: {
    baseUrl: 'https://api.unsplash.com',
    accessKey: 'FFMXsOI6jmEZTQXl-ejLbXX0E7fo3h1MGKBRxMDJVtk' 
  }
};

// Function to fetch image from Unsplash
async function fetchUnsplashImage(query, width = 400, height = 300) {
  try {
    const cacheKey = `img_${query}`;
    if (cachedResults.has(cacheKey)) {
      return cachedResults.get(cacheKey);
    }

    const response = await fetch(
      `${API_CONFIG.unsplash.baseUrl}/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${API_CONFIG.unsplash.accessKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image from Unsplash');
    }

    const data = await response.json();
    const imageUrl = data.results[0]?.urls?.regular || 
                    `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=${width}&h=${height}&fit=crop`;
    
    cachedResults.set(cacheKey, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    // Return a fallback image
    return `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=${width}&h=${height}&fit=crop`;
  }
}

// Function to fetch city data from GeoDb
async function fetchCityData(cityName, countryCode = null) {
  try {
    const cacheKey = `city_${cityName}_${countryCode}`;
    if (cachedResults.has(cacheKey)) {
      return cachedResults.get(cacheKey);
    }

    let searchUrl = `${API_CONFIG.geoDb.baseUrl}/cities?namePrefix=${encodeURIComponent(cityName)}&limit=5&sort=population&types=CITY`;
    if (countryCode) {
      searchUrl += `&countryIds=${countryCode}`;
    }

    const response = await fetch(searchUrl, {
      headers: API_CONFIG.geoDb.headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch city data from GeoDb');
    }

    const data = await response.json();
    cachedResults.set(cacheKey, data.data);
    return data.data;
  } catch (error) {
    console.error('Error fetching city data:', error);
    return [];
  }
}

// Function to fetch country data from GeoDb
async function fetchCountryData(countryName = null) {
  try {
    const cacheKey = `country_${countryName}`;
    if (cachedResults.has(cacheKey)) {
      return cachedResults.get(cacheKey);
    }

    let searchUrl = `${API_CONFIG.geoDb.baseUrl}/countries?limit=10`;
    if (countryName) {
      searchUrl += `&namePrefix=${encodeURIComponent(countryName)}`;
    }

    const response = await fetch(searchUrl, {
      headers: API_CONFIG.geoDb.headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch country data from GeoDb');
    }

    const data = await response.json();
    cachedResults.set(cacheKey, data.data);
    return data.data;
  } catch (error) {
    console.error('Error fetching country data:', error);
    return [];
  }
}

// Function to search for places by category
async function searchPlacesByCategory(category, location = null) {
  try {
    let searchQuery = category;
    if (location) {
      searchQuery = `${category} in ${location}`;
    }

    // For beaches and temples, we'll use a combination of GeoDb cities and Unsplash images
    let places = [];

    if (category === 'beaches') {
      // Get coastal cities from GeoDb
      const cities = await fetchCityData('', null);
      const coastalCities = cities.filter(city => 
        city.name.toLowerCase().includes('beach') || 
        city.region?.toLowerCase().includes('coast') ||
        city.name.toLowerCase().includes('coast')
      ).slice(0, 6);

      for (const city of coastalCities) {
        const imageUrl = await fetchUnsplashImage(`${city.name} beach`);
        places.push({
          name: city.name,
          description: `Beautiful beach destination in ${city.region}, ${city.country}. Known for its stunning coastline and pristine waters.`,
          imageUrl: imageUrl,
          country: city.country,
          region: city.region
        });
      }

      // Add some popular beach destinations if not enough found
      const popularBeaches = [
        'Maldives', 'Bali', 'Santorini', 'Maui', 'Cancun', 'Phuket'
      ];

      for (const beach of popularBeaches.slice(0, 6 - places.length)) {
        const imageUrl = await fetchUnsplashImage(`${beach} beach`);
        places.push({
          name: beach,
          description: `Stunning beach destination known for its crystal-clear waters and pristine sands.`,
          imageUrl: imageUrl,
          country: 'Various',
          region: 'Tropical',
          population: 'N/A'
        });
      }
    } else if (category === 'temples') {
      // Popular temple destinations
      const templeDestinations = [
        'Angkor Wat', 'Borobudur', 'Taj Mahal', 'Kyoto Temples', 
        'Bagan Temples', 'Petra', 'Machu Picchu', 'Karnak Temple'
      ];

      for (const temple of templeDestinations) {
        const imageUrl = await fetchUnsplashImage(`${temple} temple`);
        places.push({
          name: temple,
          description: `Historic temple complex known for its architectural beauty and cultural significance.`,
          imageUrl: imageUrl,
          country: 'Various',
          region: 'Historic',
          population: 'N/A'
        });
      }
    }

    return places;
  } catch (error) {
    console.error('Error searching places by category:', error);
    return [];
  }
}

// Enhanced function to normalize search keywords
function normalizeKeyword(keyword) {
  const normalized = keyword.toLowerCase().trim();
  
  // Handle keyword variations
  if (normalized.includes('beach') || normalized.includes('beaches') || 
      normalized.includes('coast') || normalized.includes('ocean')) {
    return 'beaches';
  } else if (normalized.includes('temple') || normalized.includes('temples') || 
             normalized.includes('shrine') || normalized.includes('monastery')) {
    return 'temples';
  } else if (normalized.includes('country') || normalized.includes('countries') || 
             normalized.includes('nation')) {
    return 'countries';
  } else if (normalized.includes('city') || normalized.includes('cities') || 
             normalized.includes('town')) {
    return 'cities';
  }
  
  return normalized;
}

// Function to get current time for a specific timezone
function getCurrentTime(timezone) {
  const options = { 
    timeZone: timezone, 
    hour12: true, 
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return new Date().toLocaleString('en-US', options);
}

// Enhanced function to get timezone for countries
function getCountryTimezone(countryName) {
  const timezones = {
    'australia': 'Australia/Sydney',
    'japan': 'Asia/Tokyo',
    'brazil': 'America/Sao_Paulo',
    'cambodia': 'Asia/Phnom_Penh',
    'india': 'Asia/Kolkata',
    'french polynesia': 'Pacific/Tahiti',
    'united states': 'America/New_York',
    'canada': 'America/Toronto',
    'united kingdom': 'Europe/London',
    'germany': 'Europe/Berlin',
    'france': 'Europe/Paris',
    'italy': 'Europe/Rome',
    'spain': 'Europe/Madrid',
    'china': 'Asia/Shanghai',
    'thailand': 'Asia/Bangkok',
    'indonesia': 'Asia/Jakarta',
    'singapore': 'Asia/Singapore',
    'malaysia': 'Asia/Kuala_Lumpur',
    'philippines': 'Asia/Manila',
    'south korea': 'Asia/Seoul',
    'vietnam': 'Asia/Ho_Chi_Minh',
    'mexico': 'America/Mexico_City',
    'argentina': 'America/Argentina/Buenos_Aires',
    'chile': 'America/Santiago',
    'peru': 'America/Lima',
    'colombia': 'America/Bogota',
    'south africa': 'Africa/Johannesburg',
    'egypt': 'Africa/Cairo',
    'kenya': 'Africa/Nairobi',
    'morocco': 'Africa/Casablanca',
    'russia': 'Europe/Moscow',
    'turkey': 'Europe/Istanbul',
    'greece': 'Europe/Athens',
    'sweden': 'Europe/Stockholm',
    'norway': 'Europe/Oslo',
    'denmark': 'Europe/Copenhagen',
    'finland': 'Europe/Helsinki',
    'netherlands': 'Europe/Amsterdam',
    'belgium': 'Europe/Brussels',
    'switzerland': 'Europe/Zurich',
    'austria': 'Europe/Vienna',
    'portugal': 'Europe/Lisbon',
    'poland': 'Europe/Warsaw',
    'czech republic': 'Europe/Prague',
    'hungary': 'Europe/Budapest',
    'israel': 'Asia/Jerusalem',
    'uae': 'Asia/Dubai',
    'saudi arabia': 'Asia/Riyadh',
    'new zealand': 'Pacific/Auckland'
  };
  
  return timezones[countryName.toLowerCase()] || 'UTC';
}

// Function to create/show sidebar
function createSidebar() {
  let sidebar = document.getElementById('resultsSidebar');
  
  if (!sidebar) {
    // Create sidebar if it doesn't exist
    sidebar = document.createElement('div');
    sidebar.id = 'resultsSidebar';
    sidebar.style.cssText = `
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: linear-gradient(135deg, rgba(0, 64, 64, 0.95), rgba(0, 128, 128, 0.95));
      backdrop-filter: blur(20px);
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: -5px 0 20px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      overflow-y: auto;
      transition: right 0.3s ease-in-out;
      padding: 20px;
      color: white;
    `;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 24px;
      width: 35px;
      height: 35px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s ease;
    `;
    closeButton.addEventListener('click', closeSidebar);
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    
    sidebar.appendChild(closeButton);
    
    // Add results container
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'sidebarResults';
    resultsContainer.style.cssText = `
      margin-top: 60px;
      padding-bottom: 20px;
    `;
    sidebar.appendChild(resultsContainer);
    
    document.body.appendChild(sidebar);
  }
  
  // Show sidebar
  setTimeout(() => {
    sidebar.style.right = '0';
  }, 100);
  
  return sidebar;
}

// Function to close sidebar
function closeSidebar() {
  const sidebar = document.getElementById('resultsSidebar');
  if (sidebar) {
    sidebar.style.right = '-400px';
    
    setTimeout(() => {
      if (sidebar && sidebar.style.right === '-400px') {
        sidebar.remove();
      }
    }, 300);
  }
}

// Function to show loading state
function showLoading() {
  const sidebar = createSidebar();
  const resultsContainer = document.getElementById('sidebarResults');
  
  resultsContainer.innerHTML = `
    <div style="text-align: center; margin-top: 100px;">
      <div style="border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid white; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
      <h2 style="color: white; margin-bottom: 20px;">Searching...</h2>
      <p style="color: #e0e0e0;">Finding the best recommendations for you...</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
}

// Enhanced function to display search results in sidebar
function displayResults(results, category) {
  const sidebar = createSidebar();
  const resultsContainer = document.getElementById('sidebarResults');
  
  if (!results || results.length === 0) {
    resultsContainer.innerHTML = `
      <div style="text-align: center; margin-top: 100px;">
        <h2 style="color: white; margin-bottom: 20px;">No Results Found</h2>
        <p style="color: #e0e0e0;">No recommendations found for your search. Try searching for 'beaches', 'temples', 'countries', or specific city names.</p>
      </div>
    `;
    return;
  }
  
  let html = `<h2 style="color: white; text-align: center; margin-bottom: 30px; font-size: 24px; border-bottom: 2px solid rgba(255, 255, 255, 0.3); padding-bottom: 15px;">
    ${category.charAt(0).toUpperCase() + category.slice(1)} Recommendations
  </h2>`;
  
  results.forEach((item, index) => {
    if (category === 'countries') {
      // For countries from GeoDb
      const timezone = getCountryTimezone(item.name);
      const currentTime = getCurrentTime(timezone);
      
      html += `
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.2); transition: transform 0.3s ease;" 
             onmouseover="this.style.transform='translateX(-5px)'; this.style.background='rgba(255, 255, 255, 0.15)'" 
             onmouseout="this.style.transform='translateX(0)'; this.style.background='rgba(255, 255, 255, 0.1)'">
          <img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">
          <h3 style="color: white; margin-bottom: 8px; font-size: 18px; font-weight: 600;">${item.name}</h3>
          <p style="color: #b0b0b0; font-size: 12px; margin-bottom: 8px;">Country Code: ${item.code}</p>
          <p style="color: #e0e0e0; line-height: 1.4; margin-bottom: 12px; font-size: 14px;">${item.description || 'Explore this beautiful country and its rich culture.'}</p>
          <div style="background: rgba(0, 150, 150, 0.3); padding: 8px; border-radius: 6px; border-left: 3px solid #00d1d1;">
            <p style="color: white; margin: 0; font-size: 12px; font-weight: 600;">Current Time:</p>
            <p style="color: #00d1d1; margin: 4px 0 0 0; font-size: 12px;">${currentTime}</p>
          </div>
        </div>
      `;
    } else if (category === 'cities') {
      // For cities from GeoDb
      const timezone = getCountryTimezone(item.country);
      const currentTime = getCurrentTime(timezone);
      
      html += `
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.2); transition: transform 0.3s ease;" 
             onmouseover="this.style.transform='translateX(-5px)'; this.style.background='rgba(255, 255, 255, 0.15)'" 
             onmouseout="this.style.transform='translateX(0)'; this.style.background='rgba(255, 255, 255, 0.1)'">
          <img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">
          <h3 style="color: white; margin-bottom: 8px; font-size: 18px; font-weight: 600;">${item.name}</h3>
          <p style="color: #b0b0b0; font-size: 12px; margin-bottom: 8px;">${item.region}, ${item.country}</p>
          <p style="color: #e0e0e0; line-height: 1.4; margin-bottom: 12px; font-size: 14px;">${item.description}</p>
          <div style="background: rgba(0, 150, 150, 0.3); padding: 8px; border-radius: 6px; border-left: 3px solid #00d1d1;">
            <p style="color: white; margin: 0; font-size: 12px; font-weight: 600;">Current Time:</p>
            <p style="color: #00d1d1; margin: 4px 0 0 0; font-size: 12px;">${currentTime}</p>
          </div>
        </div>
      `;
    } else {
      // For beaches, temples, and other categories
      html += `
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.2); transition: transform 0.3s ease;" 
             onmouseover="this.style.transform='translateX(-5px)'; this.style.background='rgba(255, 255, 255, 0.15)'" 
             onmouseout="this.style.transform='translateX(0)'; this.style.background='rgba(255, 255, 255, 0.1)'">
          <img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">
          <h3 style="color: white; margin-bottom: 8px; font-size: 18px; font-weight: 600;">${item.name}</h3>
          <p style="color: #b0b0b0; font-size: 12px; margin-bottom: 8px;">${item.country}</p>
          <p style="color: #e0e0e0; line-height: 1.4; font-size: 14px;">${item.description}</p>
        </div>
      `;
    }
  });
  
  resultsContainer.innerHTML = html;
}

// Enhanced function to perform search
async function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    alert('Please enter a search term');
    return;
  }
  
  showLoading();
  
  try {
    const normalizedKeyword = normalizeKeyword(searchTerm);
    
    let results = [];
    let category = '';
    
    switch (normalizedKeyword) {
      case 'beaches':
        results = await searchPlacesByCategory('beaches');
        category = 'beaches';
        break;
      case 'temples':
        results = await searchPlacesByCategory('temples');
        category = 'temples';
        break;
      case 'countries':
        const countries = await fetchCountryData();
        results = [];
        for (const country of countries.slice(0, 8)) {
          const imageUrl = await fetchUnsplashImage(country.name);
          results.push({
            ...country,
            imageUrl: imageUrl,
            description: `Explore ${country.name} and discover its unique culture and attractions.`
          });
        }
        category = 'countries';
        break;
      case 'cities':
        const cities = await fetchCityData(searchTerm);
        results = [];
        for (const city of cities.slice(0, 8)) {
          const imageUrl = await fetchUnsplashImage(city.name);
          results.push({
            ...city,
            imageUrl: imageUrl,
            description: `${city.name} is a vibrant city in ${city.region}, ${city.country}. A great destination to explore!`
          });
        }
        category = 'cities';
        break;
      default:
        // Try to search for specific cities or places
        const cityResults = await fetchCityData(searchTerm);
        if (cityResults.length > 0) {
          results = [];
          for (const city of cityResults.slice(0, 6)) {
            const imageUrl = await fetchUnsplashImage(city.name);
            results.push({
              ...city,
              imageUrl: imageUrl,
              description: `${city.name} is located in ${city.region}, ${city.country}. Population: ${city.population?.toLocaleString() || 'N/A'}`
            });
          }
          category = 'cities';
        } else {
          // Try country search
          const countryResults = await fetchCountryData(searchTerm);
          if (countryResults.length > 0) {
            results = [];
            for (const country of countryResults.slice(0, 6)) {
              const imageUrl = await fetchUnsplashImage(country.name);
              results.push({
                ...country,
                imageUrl: imageUrl,
                description: `Discover the beauty and culture of ${country.name}.`
              });
            }
            category = 'countries';
          }
        }
        break;
    }
    
    displayResults(results, category);
    
  } catch (error) {
    console.error('Error performing search:', error);
    const sidebar = createSidebar();
    const resultsContainer = document.getElementById('sidebarResults');
    resultsContainer.innerHTML = `
      <div style="text-align: center; margin-top: 100px;">
        <h2 style="color: white; margin-bottom: 20px;">Error</h2>
        <p style="color: #e0e0e0;">Error loading recommendations. Please check your API keys and try again.</p>
        <p style="color: #b0b0b0; font-size: 12px; margin-top: 10px;">Make sure to replace YOUR_RAPIDAPI_KEY and YOUR_UNSPLASH_ACCESS_KEY with your actual API keys.</p>
      </div>
    `;
  }
}

// Function to clear search results
function clearResults() {
  closeSidebar();
  document.getElementById('searchInput').value = '';
  
  // Clear cache if needed
  cachedResults.clear();
  
  // Remove the old results container if it exists
  const oldResults = document.getElementById('results');
  if (oldResults) {
    oldResults.innerHTML = '';
  }
  
  // Ensure sidebar is completely removed
  setTimeout(() => {
    const sidebar = document.getElementById('resultsSidebar');
    if (sidebar) {
      sidebar.remove();
    }
  }, 300);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Search button click event
  const searchButton = document.getElementById('searchBtn');
  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }
  
  // Clear button click event
  const clearButton = document.getElementById('clearbtn');
  if (clearButton) {
    clearButton.addEventListener('click', clearResults);
  }
  
  // Enter key press event for search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        performSearch();
      }
    });
  }
  
  // Book Now button functionality (optional)
  const bookNowButton = document.querySelector('.btn');
  if (bookNowButton) {
    bookNowButton.addEventListener('click', function() {
      alert('Booking functionality would be implemented here!');
    });
  }
  
  // Close sidebar when clicking outside of it
  document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('resultsSidebar');
    const searchContainer = document.querySelector('.search-container');
    
    if (sidebar && 
        sidebar.style.right === '0px' && 
        !sidebar.contains(event.target) && 
        !searchContainer.contains(event.target)) {
      closeSidebar();
    }
  });
  
  // Close sidebar with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeSidebar();
    }
  });
});
