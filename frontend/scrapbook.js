// scrapbook.js - Scrapbook page initialization and functionality

let scrapbookInitialized = false;

async function initScrapbook() {
    if (scrapbookInitialized) return;
    scrapbookInitialized = true;

    // Load scrapbook entries
    loadScrapbookCards();

    // Set up navigation buttons
    const scrollLeft = document.getElementById('scroll-left');
    const scrollRight = document.getElementById('scroll-right');
    const cardsContainer = document.getElementById('scrapbook-cards');

    scrollLeft.addEventListener('click', () => {
        cardsContainer.scrollBy({ left: -350, behavior: 'smooth' });
    });

    scrollRight.addEventListener('click', () => {
        cardsContainer.scrollBy({ left: 350, behavior: 'smooth' });
    });

    // Share button
    document.getElementById('share-btn').addEventListener('click', () => {
        showNotification('Share feature coming soon!');
    });
}

async function loadScrapbookCards() {
    try {
        const logs = await getAllLogs();
        const cardsContainer = document.getElementById('scrapbook-cards');

        if (!logs || logs.length === 0) {
            cardsContainer.innerHTML = '<p class="empty-state">No scrapbook entries yet. Create your first log!</p>';
            return;
        }

        // Sort logs by date (newest first)
        logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        cardsContainer.innerHTML = logs.map(log => createCardHTML(log)).join('');
    } catch (error) {
        console.error('Error loading scrapbook:', error);
        // Silently fail - don't show error on init
        document.getElementById('scrapbook-cards').innerHTML = '<p class="empty-state">No scrapbook entries yet. Create your first log!</p>';
    }
}

function createCardHTML(log) {
    const date = new Date(log.created_at);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const dateString = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Get content from the log
    let content = '';
    if (log.photo_url) {
        content = `<img src="${log.photo_url}" alt="Log photo">`;
    } else if (log.log_entries && log.log_entries.length > 0) {
        content = `<p class="card-text">${log.log_entries[0].substring(0, 150)}...</p>`;
    } else {
        content = '<p class="card-text">No content yet</p>';
    }

    return `
        <div class="scrapbook-card">
            <div class="card-date">
                <div class="card-date-day">${dayName}</div>
                <div class="card-date-full">${dateString}</div>
            </div>
            <div class="card-content">
                ${content}
            </div>
        </div>
    `;
}
