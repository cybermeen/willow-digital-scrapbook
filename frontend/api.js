/**
 * api.js - Centralized API layer
 * All backend communication happens through this file
 * Modify API_BASE_URL if your backend is on a different port
 */

const API_BASE_URL = 'http://localhost:5000/api';

// ===== HELPER: Show notifications =====
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

async function parseErrorResponse(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

// ========== TASKS / TO-DO API ==========

async function getTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/todo`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return await response.json();
    } catch (error) {
        console.error('getTasks error:', error);
        return [];
    }
}

async function createTask(taskData) {
    try {
        const response = await fetch(`${API_BASE_URL}/todo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to create task');
        showNotification('Task created!');
        return await response.json();
    } catch (error) {
        console.error('createTask error:', error);
        showNotification('Error creating task', 'error');
        return null;
    }
}

async function updateTask(taskId, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/todo/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update task');
        return await response.json();
    } catch (error) {
        console.error('updateTask error:', error);
        showNotification('Error updating task', 'error');
        return null;
    }
}

async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/todo/${taskId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to delete task');
        showNotification('Task deleted');
        return true;
    } catch (error) {
        console.error('deleteTask error:', error);
        showNotification('Error deleting task', 'error');
        return false;
    }
}

// ========== SCRAPBOOK API ==========

async function getOrCreateLog(date) {
    try {
        const response = await fetch(`${API_BASE_URL}/scrapbook/logs/${date}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch log');
        return await response.json();
    } catch (error) {
        console.error('getOrCreateLog error:', error);
        showNotification('Error loading scrapbook', 'error');
        return null;
    }
}

async function updateLog(logId, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/scrapbook/logs/${logId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update log');
        return await response.json();
    } catch (error) {
        console.error('updateLog error:', error);
        showNotification('Error updating log', 'error');
        return null;
    }
}

async function uploadPhoto(logId, file) {
    try {
        const formData = new FormData();
        formData.append('photo', file);
        
        const response = await fetch(`${API_BASE_URL}/scrapbook/photos/${logId}`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        if (!response.ok) {
            const errorBody = await parseErrorResponse(response);
            throw new Error(errorBody?.error || response.statusText || 'Failed to upload photo');
        }
        showNotification('Photo uploaded!');
        return await response.json();
    } catch (error) {
        console.error('uploadPhoto error:', error);
        showNotification(error.message || 'Error uploading photo', 'error');
        return null;
    }
}

async function deletePhoto(photoId) {
    try {
        const response = await fetch(`${API_BASE_URL}/scrapbook/photos/${photoId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to delete photo');
        showNotification('Photo deleted');
        return true;
    } catch (error) {
        console.error('deletePhoto error:', error);
        showNotification('Error deleting photo', 'error');
        return false;
    }
}

async function createNote(logId, noteText) {
    try {
        const response = await fetch(`${API_BASE_URL}/scrapbook/notes/${logId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content: noteText })
        });
        if (!response.ok) throw new Error('Failed to create note');
        showNotification('Note added!');
        return await response.json();
    } catch (error) {
        console.error('createNote error:', error);
        showNotification('Error adding note', 'error');
        return null;
    }
}

async function deleteNote(noteId) {
    try {
        const response = await fetch(`${API_BASE_URL}/scrapbook/notes/${noteId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to delete note');
        showNotification('Note deleted');
        return true;
    } catch (error) {
        console.error('deleteNote error:', error);
        showNotification('Error deleting note', 'error');
        return false;
    }
}

async function getDailyPrompt(promptType = '') {
    try {
        const query = promptType ? `?type=${encodeURIComponent(promptType)}` : '';
        const response = await fetch(`${API_BASE_URL}/scrapbook/prompts/daily${query}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch prompt');
        return await response.json();
    } catch (error) {
        console.error('getDailyPrompt error:', error);
        return null;
    }
}

async function savePromptAnswer(logId, promptId, answerText) {
    try {
        const response = await fetch(`${API_BASE_URL}/scrapbook/prompts/answer/${logId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt_id: promptId, answer_text: answerText })
        });
        if (!response.ok) {
            const errorBody = await parseErrorResponse(response);
            throw new Error(errorBody?.error || response.statusText || 'Failed to save answer');
        }
        showNotification('Answer saved!');
        return await response.json();
    } catch (error) {
        console.error('savePromptAnswer error:', error);
        showNotification(error.message || 'Error saving answer', 'error');
        return null;
    }
}

// ========== SCRAPBOOK: GET ALL LOGS ==========
async function getAllLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/scrapbook/logs`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch logs');
        return await response.json();
    } catch (error) {
        console.error('getAllLogs error:', error);
        return [];
    }
}
