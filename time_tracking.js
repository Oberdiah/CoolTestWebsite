// --- kvdb.io Configuration ---
const KVDB_KEY = '5QAmdusS56oQyfoeEe9LVD';
const KVDB_BUCKET = 'global-activity-tracker'; // A unique name for the data
const KVDB_URL = `https://kvdb.io/${KVDB_KEY}/${KVDB_BUCKET}`;

let currentActivity = null;
let activityStartTime = null;
let timeHistory = {};

async function loadDataFromKVDB() {
    try {
        const response = await fetch(KVDB_URL);
        if (response.status === 404) {
            console.log('No data found in KVDB. Starting with defaults.');
            return null;
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to load data from KVDB:', error);
        document.getElementById('history-content').textContent = 'Error loading data.';
        return null;
    }
}

async function saveDataToKVDB() {
    const dataToSave = {currentActivity, activityStartTime, timeHistory};
    try {
        await fetch(KVDB_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dataToSave),
        });
    } catch (error) {
        console.error('Failed to save data to KVDB:', error);
    }
}

// --- UI Update Functions ---

/**
 * Re-renders all activity buttons based on the global 'activities' array
 */
function renderActivityButtons() {
    const activityOptions = document.getElementById('activity-options');
    activityOptions.innerHTML = ''; // Clear existing buttons
    Object.keys(timeHistory).forEach(activityName => {
        const newButton = document.createElement('div');
        newButton.className = 'activity-button';
        newButton.dataset.activity = activityName;
        newButton.textContent = activityName.charAt(0).toUpperCase() + activityName.slice(1);
        newButton.addEventListener('click', () => switchActivity(activityName));
        activityOptions.appendChild(newButton);
    });
}

/**
 * Updates the selected state of the activity buttons.
 */
function updateSelectedButtonUI() {
    const activityButtons = document.querySelectorAll('.activity-button');
    activityButtons.forEach(button => {
        button.classList.toggle('selected', button.dataset.activity === currentActivity);
    });
}

/**
 * Updates the time history display on the page.
 */
function updateTimeHistoryDisplay() {
    const historyContent = document.getElementById('history-content');
    let historyHTML = '';
    for (const activity in timeHistory) {
        const seconds = Math.round(timeHistory[activity] / 1000);
        const displayName = activity.charAt(0).toUpperCase() + activity.slice(1);
        historyHTML += `<div><strong>${displayName}:</strong> ${seconds} seconds</div>`;
    }
    historyContent.innerHTML = historyHTML;
}

// --- Core Logic Functions ---

/**
 * Handles switching from one activity to another.
 * @param {string} newActivity - The activity to switch to.
 */
async function switchActivity(newActivity) {
    // Record time for the previous activity
    if (currentActivity && activityStartTime) {
        const timeSpent = Date.now() - activityStartTime;
        timeHistory[currentActivity] = (timeHistory[currentActivity] || 0) + timeSpent;
    }

    // Set the new activity and start time
    currentActivity = newActivity;
    activityStartTime = Date.now();

    // Update UI
    updateSelectedButtonUI();
    updateTimeHistoryDisplay();

    // Save the new state to the server
    await saveDataToKVDB();
}

/**
 * Adds a new activity to the list.
 * @param {string} activityName - The name of the new activity.
 */
async function addNewActivity(activityName) {
    if (!activityName) return;
    const normalizedName = activityName.trim().toLowerCase();
    if (normalizedName) {
        timeHistory[normalizedName] = 0;
        renderActivityButtons(); // Re-render buttons to include the new one
        await saveDataToKVDB(); // Save the updated list of activities
    }
    // Reset and hide the input form
    document.getElementById('add-activity-container').classList.remove('visible');
    document.getElementById('new-activity-input').value = '';
}

/**
 * Prepares and triggers a download of the time history as a JSON file.
 */
function downloadTimeHistory() {
    const historyForDownload = JSON.parse(JSON.stringify(timeHistory));

    // Add the time for the currently running activity for an up-to-the-minute download
    if (currentActivity && activityStartTime) {
        const timeSpent = Date.now() - activityStartTime;
        historyForDownload[currentActivity] = (historyForDownload[currentActivity] || 0) + timeSpent;
    }

    for (const activity in historyForDownload) {
        historyForDownload[activity] = Math.round(historyForDownload[activity] / 1000);
    }

    const dataStr = JSON.stringify(historyForDownload, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileName = `time_history_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
}

// --- Initialization and Event Listeners ---
function renderGraph(){
    const chart = document.getElementById("chart");
    const values = Object.keys(timeHistory).map((activityName) => timeHistory[activityName] / 1000);

    new Chart(chart, {
        type: "bar",
        data: {
            labels: Object.keys(timeHistory),
            datasets: [
                {
                    label: "Time spent",
                    data: values,
                    borderWidth: 1,
                },
            ],
        },
    });

}

/**
 * Main function to initialize the application.
 */
async function initializeApp() {

    const savedData = await loadDataFromKVDB();

    if (savedData) {
        timeHistory = savedData.timeHistory || {};
        currentActivity = savedData.currentActivity || null;
        activityStartTime = savedData.activityStartTime || null;
    }

    // Render UI based on loaded or default state
    renderActivityButtons();
    updateTimeHistoryDisplay();
    updateSelectedButtonUI();
    renderGraph();

    // --- Set up event listeners after initial render ---
    document.getElementById('add-activity-btn').addEventListener('click', () => {
        document.getElementById('add-activity-container').classList.toggle('visible');
    });
    document.getElementById('delete-activity-bt').addEventListener('click', () => {
        delete timeHistory[currentActivity]
        currentActivity = null;
        renderActivityButtons();
    });

    document.getElementById('confirm-add-activity').addEventListener('click', () => {
        const activityName = document.getElementById('new-activity-input').value;
        addNewActivity(activityName);
    });

    document.getElementById('new-activity-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewActivity(e.target.value);
        }
    });

    document.getElementById('download-json-btn').addEventListener('click', downloadTimeHistory);
}

// Run the app when the page is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Save final data when the user closes the tab/browser
window.addEventListener('beforeunload', () => {
    if (currentActivity && activityStartTime) {
        const timeSpent = Date.now() - activityStartTime;
        timeHistory[currentActivity] = (timeHistory[currentActivity] || 0) + timeSpent;
        // Update start time to now to prevent double-counting on quick reloads
        activityStartTime = Date.now();
    }

    const dataToSave = {currentActivity, activityStartTime, timeHistory};
    const blob = new Blob([JSON.stringify(dataToSave)], {type: 'application/json'});

    // Use sendBeacon for reliable data saving on page exit
    navigator.sendBeacon(KVDB_URL, blob);
});