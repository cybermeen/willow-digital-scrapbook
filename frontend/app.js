// app.js - Main SPA navigation and initialization

document.addEventListener('DOMContentLoaded', () => {
    const navTabs = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page');

    // Set up navigation click handlers
    navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = tab.getAttribute('data-page');
            showPage(pageName, tab);
        });
    });

    function showPage(pageName, clickedTab) {
        // Hide all pages
        pages.forEach(page => page.classList.remove('active'));

        // Remove active class from all tabs
        navTabs.forEach(tab => tab.classList.remove('active'));

        // Show the selected page
        const pageElement = document.getElementById(`${pageName}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
        }

        // Mark the tab as active
        if (clickedTab) {
            clickedTab.classList.add('active');
        }

        // Initialize the page-specific scripts
        if (pageName === 'dashboard') {
            initDashboard();
        } else if (pageName === 'daylog') {
            initDayLog();
        } else if (pageName === 'scrapbook') {
            initScrapbook();
        }
    }

    // Initialize the default dashboard page
    showPage('dashboard', document.querySelector('[data-page="dashboard"]'));
});

// Utility to show notifications
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden', 'error');
    
    if (isError) {
        notification.classList.add('error');
    }

    notification.style.display = 'block';

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}
