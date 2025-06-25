// Travel recommendation data - will be loaded from JSON file
let travelData = null;

// Function to fetch travel data from JSON file
async function fetchTravelData() {
  if (travelData) {
    return travelData; // Return cached data if already loaded
  }
  
  try {
    const response = await fetch('travel_recommendation_api.json');
    if (!response.ok) {
      throw new Error('Failed to fetch travel data');
    }
    travelData = await response.json();
    console.log('Travel data loaded successfully:', travelData);
    return travelData;
  } catch (error) {
    console.error('Error loading travel data:', error);
    // Fallback error message
    throw new Error('Could not load travel recommendations. Please check if travel_recommendation_api.json file exists.');
  }
}

// Function to normalize search keywords
function normalizeKeyword(keyword) {
  const normalized = keyword.toLowerCase().trim();
  
  // Handle keyword variations
  if (normalized.includes('beach') || normalized.includes('beaches')) {
    return 'beaches';
  } else if (normalized.includes('temple') || normalized.includes('temples')) {
    return 'temples';
  } else if (normalized.includes('country') || normalized.includes('countries')) {
    return 'countries';
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

// Function to get timezone for countries
function getCountryTimezone(countryName) {
  const timezones = {
    'australia': 'Australia/Sydney',
    'japan': 'Asia/Tokyo',
    'brazil': 'America/Sao_Paulo',
    'cambodia': 'Asia/Phnom_Penh',
    'india': 'Asia/Kolkata',
    'french polynesia': 'Pacific/Tahiti'
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
  }
}

// Function to display search results in sidebar
function displayResults(results, category) {
  const sidebar = createSidebar();
  const resultsContainer = document.getElementById('sidebarResults');
  
  if (!results || results.length === 0) {
    resultsContainer.innerHTML = `
      <div style="text-align: center; margin-top: 100px;">
        <h2 style="color: white; margin-bottom: 20px;">No Results Found</h2>
        <p style="color: #e0e0e0;">No recommendations found for your search.</p>
      </div>
    `;
    return;
  }
  
  let html = `<h2 style="color: white; text-align: center; margin-bottom: 30px; font-size: 24px; border-bottom: 2px solid rgba(255, 255, 255, 0.3); padding-bottom: 15px;">
    ${category.charAt(0).toUpperCase() + category.slice(1)} Recommendations
  </h2>`;
  
  results.forEach((item, index) => {
    // Handle different data structures
    if (category === 'countries') {
      // For countries, display cities
      item.cities.forEach((city, cityIndex) => {
        const timezone = getCountryTimezone(item.name);
        const currentTime = getCurrentTime(timezone);
        
        html += `
          <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.2); transition: transform 0.3s ease;" 
               onmouseover="this.style.transform='translateX(-5px)'; this.style.background='rgba(255, 255, 255, 0.15)'" 
               onmouseout="this.style.transform='translateX(0)'; this.style.background='rgba(255, 255, 255, 0.1)'">
            <img src="${city.imageUrl}" alt="${city.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">
            <h3 style="color: white; margin-bottom: 8px; font-size: 18px; font-weight: 600;">${city.name}</h3>
            <p style="color: #b0b0b0; font-size: 12px; margin-bottom: 8px;">${item.name}</p>
            <p style="color: #e0e0e0; line-height: 1.4; margin-bottom: 12px; font-size: 14px;">${city.description}</p>
            <div style="background: rgba(0, 150, 150, 0.3); padding: 8px; border-radius: 6px; border-left: 3px solid #00d1d1;">
              <p style="color: white; margin: 0; font-size: 12px; font-weight: 600;">Current Time:</p>
              <p style="color: #00d1d1; margin: 4px 0 0 0; font-size: 12px;">${currentTime}</p>
            </div>
          </div>
        `;
      });
    } else {
      // For temples and beaches
      html += `
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.2); transition: transform 0.3s ease;" 
             onmouseover="this.style.transform='translateX(-5px)'; this.style.background='rgba(255, 255, 255, 0.15)'" 
             onmouseout="this.style.transform='translateX(0)'; this.style.background='rgba(255, 255, 255, 0.1)'">
          <img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">
          <h3 style="color: white; margin-bottom: 8px; font-size: 18px; font-weight: 600;">${item.name}</h3>
          <p style="color: #e0e0e0; line-height: 1.4; font-size: 14px;">${item.description}</p>
        </div>
      `;
    }
  });
  
  resultsContainer.innerHTML = html;
}

// Function to perform search
async function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    alert('Please enter a search term');
    return;
  }
  
  try {
    const data = await fetchTravelData();
    const normalizedKeyword = normalizeKeyword(searchTerm);
    
    let results = [];
    let category = '';
    
    switch (normalizedKeyword) {
      case 'beaches':
        results = data.beaches;
        category = 'beaches';
        break;
      case 'temples':
        results = data.temples;
        category = 'temples';
        break;
      case 'countries':
        results = data.countries;
        category = 'countries';
        break;
      default:
        // Try to find partial matches
        const searchLower = searchTerm.toLowerCase();
        
        // Check if it matches any specific place names
        const allPlaces = [
          ...data.beaches,
          ...data.temples,
          ...data.countries.flatMap(country => 
            country.cities.map(city => ({...city, country: country.name}))
          )
        ];
        
        const matchingPlaces = allPlaces.filter(place => 
          place.name.toLowerCase().includes(searchLower)
        );
        
        if (matchingPlaces.length > 0) {
          results = matchingPlaces;
          category = 'destinations';
        }
        break;
    }
    
    displayResults(results, category);
    
  } catch (error) {
    console.error('Error fetching travel data:', error);
    const sidebar = createSidebar();
    const resultsContainer = document.getElementById('sidebarResults');
    resultsContainer.innerHTML = `
      <div style="text-align: center; margin-top: 100px;">
        <h2 style="color: white; margin-bottom: 20px;">Error</h2>
        <p style="color: #e0e0e0;">Error loading recommendations. Please try again.</p>
      </div>
    `;
  }
}

// Function to clear search results
function clearResults() {
  closeSidebar();
  document.getElementById('searchInput').value = '';
  
  // Remove the old results container if it exists
  const oldResults = document.getElementById('results');
  if (oldResults) {
    oldResults.innerHTML = '';
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Search button click event
  const searchButton = document.querySelector('.search-container button');
  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }
  
  // Clear button click event
  const clearButton = document.querySelector('.search-container button:last-child');
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
