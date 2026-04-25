// daylog.js - Day Log page initialization and functionality

let daylogInitialized = false;
let currentLogDate = null;
let currentPromptId = null;

async function initDayLog() {
    if (daylogInitialized) return;
    daylogInitialized = true;

    // Initialize date display
    updatePreviewDate();

    // Load daily prompt
    await loadDailyPrompt();

    // Set up event listeners
    document.getElementById('prompt-type-select').addEventListener('change', loadDailyPrompt);
    document.getElementById('prompt-answer').addEventListener('input', updatePreview);
    
    document.getElementById('add-image-btn').addEventListener('click', () => {
        document.getElementById('image-input').click();
    });

    document.getElementById('image-input').addEventListener('change', handleImageUpload);

    document.getElementById('reset-log-btn').addEventListener('click', resetForm);
    document.getElementById('save-log-btn').addEventListener('click', saveLog);
    document.getElementById('open-magic-library-btn').addEventListener('click', () => {
        showNotification('Magic Library coming soon!');
    });
}

async function loadDailyPrompt() {
    try {
        const promptType = document.getElementById('prompt-type-select').value;
        const prompt = await getDailyPrompt(promptType);
        currentPromptId = prompt?.id || null;
        document.getElementById('prompt-text').textContent = prompt?.prompt_text || 'No prompt for today';
        updatePreview();
    } catch (error) {
        console.error('Error loading prompt:', error);
        // Silently fail - don't show error on init
        currentPromptId = null;
        document.getElementById('prompt-text').textContent = 'No prompt for today';
    }
}

function updatePreviewDate() {
    const today = new Date();
    currentLogDate = today.toISOString().split('T')[0];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[today.getDay()];
    const dateString = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    document.getElementById('preview-day-name').textContent = dayName;
    document.getElementById('preview-date').textContent = dateString;
}

function getCurrentLogDate() {
    if (currentLogDate) return currentLogDate;
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function updatePreview() {
    const answer = document.getElementById('prompt-answer').value;
    const previewContent = document.getElementById('preview-content');

    if (answer.trim()) {
        previewContent.innerHTML = `<p class="card-text">${answer}</p>`;
    } else {
        previewContent.innerHTML = '<p class="empty-state">Preview will appear here</p>';
    }
}

async function handleImageUpload(e) {
    try {
        const file = e.target.files[0];
        if (!file) return;

        const logDate = getCurrentLogDate();
        const log = await getOrCreateLog(logDate);
        if (!log) {
            showNotification('Error creating log', true);
            return;
        }

        const photo = await uploadPhoto(log.log.id, file);
        
        if (photo) {
            const previewContent = document.getElementById('preview-content');
            const img = document.createElement('img');
            img.src = photo.file_path.startsWith('http') ? photo.file_path : `/${photo.file_path}`;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '300px';
            img.style.borderRadius = '8px';
            previewContent.innerHTML = '';
            previewContent.appendChild(img);
            showNotification('Image uploaded!');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Error uploading image', true);
    }
}

function resetForm() {
    document.getElementById('prompt-answer').value = '';
    document.getElementById('image-input').value = '';
    document.getElementById('preview-content').innerHTML = '<p class="empty-state">Preview will appear here</p>';
    showNotification('Form reset');
}

async function saveLog() {
    try {
        const answer = document.getElementById('prompt-answer').value.trim();
        
        if (!answer) {
            showNotification('Please write something in your log', true);
            return;
        }

        const logDate = getCurrentLogDate();
        const log = await getOrCreateLog(logDate);
        if (!log) {
            showNotification('Error creating log', true);
            return;
        }

        if (!currentPromptId) {
            showNotification('No prompt selected', true);
            return;
        }
        
        await savePromptAnswer(log.log.id, currentPromptId, answer);

        showNotification('Log saved!');
        resetForm();
    } catch (error) {
        console.error('Error saving log:', error);
        showNotification('Error saving log', true);
    }
}
