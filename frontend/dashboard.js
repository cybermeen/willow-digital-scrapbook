// dashboard.js - Dashboard page initialization and functionality

let dashboardInitialized = false;

async function initDashboard() {
    if (dashboardInitialized) return;
    dashboardInitialized = true;

    // Load and display tasks for today
    loadTasksForToday();

    // Set up event listeners
    document.getElementById('capture-challenge-btn').addEventListener('click', () => {
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            if (tab.getAttribute('data-page') === 'daylog') {
                tab.click();
            }
        });
    });

    document.getElementById('add-to-scrapbook-btn').addEventListener('click', addHighlightsToScrapbook);
}

async function loadTasksForToday() {
    try {
        const tasks = await getTasks();
        const tasksContainer = document.getElementById('tasks-for-today');
        
        if (tasks && tasks.length > 0) {
            tasksContainer.innerHTML = tasks.slice(0, 5).map(task => `
                <div class="task-item">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
                    <span>${task.title}</span>
                </div>
            `).join('');
            
            // Add event listeners for task checkboxes
            tasksContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', async (e) => {
                    const taskId = e.target.getAttribute('data-task-id');
                    await updateTask(taskId, { completed: e.target.checked });
                });
            });
        } else {
            tasksContainer.innerHTML = '<p class="empty-state">No tasks yet</p>';
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        // Silently fail - don't show error notification on init
        document.getElementById('tasks-for-today').innerHTML = '<p class="empty-state">No tasks yet</p>';
    }
}

async function addHighlightsToScrapbook() {
    try {
        const highlights = document.getElementById('highlights-input').value.trim();
        const theme = document.getElementById('theme-input').value.trim();

        if (!highlights && !theme) {
            showNotification('Please add highlights or a theme', true);
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const log = await getOrCreateLog(today);
        if (!log) {
            showNotification('Error creating log', true);
            return;
        }
        
        if (highlights) {
            await createNote(log.log.id, highlights);
        }
        if (theme) {
            await createNote(log.log.id, theme);
        }

        document.getElementById('highlights-input').value = '';
        document.getElementById('theme-input').value = '';

        showNotification('Added to scrapbook!');
    } catch (error) {
        console.error('Error adding to scrapbook:', error);
        showNotification('Error adding to scrapbook', true);
    }
}
