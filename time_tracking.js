// --- kvdb.io Configuration ---
const KVDB_KEY = '5QAmdusS56oQyfoeEe9LVD';
const KVDB_BUCKET = 'global-activity-tracker'; // A unique name for the data
const KVDB_URL = `https://kvdb.io/${KVDB_KEY}/${KVDB_BUCKET}`;

let currentActivity = null;
let activityStartTime = null;
let timeHistory = {};
let myChart = null;

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

function updateSelectedButtonUI() {
    const activityButtons = document.querySelectorAll('.activity-button');
    activityButtons.forEach(button => {
        button.classList.toggle('selected', button.dataset.activity === currentActivity);
    });
}

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
    renderGraph();

    // Save the new state to the server
    // saveData();
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
        renderGraph()
    }
    document.getElementById('new-activity-input').value = '';
    // saveData();
}
function renderGraph(){
    if(myChart === null){
        const chart = document.getElementById("chart");
        myChart = new Chart(chart, {
            type: "bar",
            data: {
                labels: ['mylabel'],
                datasets: [
                    {
                        label: "Time spent",
                        data: [6],
                        borderWidth: 1,
                    },
                ],
            },
        });
    }
    myChart.data.labels = Object.keys(timeHistory);
    myChart.data.datasets[0].data = Object.keys(timeHistory).map((activityName) => timeHistory[activityName] / 1000);
    myChart.update();


}

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
        renderGraph()
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
}
function saveData() {
    const dataToSave = {currentActivity, activityStartTime, timeHistory};
    try {
        fetch(KVDB_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dataToSave),
            keepalive: true
        });
    } catch (error) {
        console.error('Failed to save data to KVDB:', error);
    }
}

// Run the app when the page is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('beforeunload', saveData);
