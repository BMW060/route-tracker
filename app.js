// Route definitions
const ROUTES = {
    "1": {
        name: "72nd",
        checkpoints: [
            "72nd off-ramp",
            "72nd and Sorensen",
            "72nd and Military",
            "72nd and Dodge"
        ]
    },
    "2": {
        name: "72nd<->Sorensen",
        checkpoints: [
            "56th and Sorensen",
            "72nd and Sorensen",
            "72nd and Military",
            "72nd and Dodge"
        ]
    },
    "3": {
        name: "Dodge<->I680",
        checkpoints: [
            "72nd exit",
            "Irvington exit",
            "Dodge exit",
            "Rose Blumkin turn"
        ]
    },
    "4": {
        name: "Pacific<->I680",
        checkpoints: [
            "72nd exit",
            "Irvington exit",
            "Pacific exit",
            "72nd and Pacific"
        ]
    },
    "5": {
        name: "SMM drive",
        checkpoints: [
            "56th and Sorensen",
            "52nd and Ames",
            "52nd and Happy Hollow",
            "52nd and Dodge"
        ]
    }
};

// Global state
let currentRoute = null;
let driveStartTime = null;
let lastCheckpointTime = null;
let currentCheckpointIndex = 0;
let sectionTimes = [];
let routeStats = null;
let timerInterval = null;

// Initialize IndexedDB
let db;
const DB_NAME = 'RouteTrackerDB';
const DB_VERSION = 1;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('trips')) {
                const store = db.createObjectStore('trips', { keyPath: 'id', autoIncrement: true });
                store.createIndex('routeId', 'routeId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// Initialize app
initDB().then(() => {
    console.log('Database initialized');
}).catch(err => {
    console.error('Database initialization failed:', err);
});

// Authentication
function authenticate() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('auth-error');
    
    if (username.toUpperCase() === 'BRENNAN' && password.toUpperCase() === 'DRIVE') {
        showScreen('menu-screen');
        errorElement.textContent = '';
    } else {
        errorElement.textContent = username ? 'Incorrect password' : 'Username not recognized';
    }
}

// Screen navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showMenu() {
    showScreen('menu-screen');
}

function showRouteSelection() {
    const container = document.getElementById('route-buttons');
    container.innerHTML = '';
    
    Object.keys(ROUTES).forEach(routeId => {
        const route = ROUTES[routeId];
        const button = document.createElement('button');
        button.className = 'route-btn';
        button.innerHTML = `<strong>${routeId}:</strong> ${route.name}`;
        button.onclick = () => selectRoute(routeId);
        container.appendChild(button);
    });
    
    showScreen('route-selection-screen');
}

function showStatistics() {
    const container = document.getElementById('stats-route-buttons');
    container.innerHTML = '';
    
    Object.keys(ROUTES).forEach(routeId => {
        const route = ROUTES[routeId];
        const button = document.createElement('button');
        button.className = 'route-btn';
        button.innerHTML = `<strong>${routeId}:</strong> ${route.name}`;
        button.onclick = () => displayRouteStatistics(routeId);
        container.appendChild(button);
    });
    
    document.getElementById('statistics-display').innerHTML = '<p class="no-data">Select a route to view statistics</p>';
    showScreen('statistics-screen');
}

// Route selection
function selectRoute(routeId) {
    currentRoute = routeId;
    currentCheckpointIndex = 0;
    sectionTimes = [];
    
    // Load statistics for this route
    loadRouteStatistics(routeId).then(stats => {
        routeStats = stats;
        setupDriveScreen();
    });
}

function setupDriveScreen() {
    const route = ROUTES[currentRoute];
    document.getElementById('route-name').textContent = route.name;
    document.getElementById('drive-status').innerHTML = '<p class="status-text">Press START to begin your drive</p>';
    document.getElementById('checkpoint-info').innerHTML = '';
    document.getElementById('section-times').innerHTML = '';
    document.getElementById('start-drive-btn').style.display = 'block';
    document.getElementById('checkpoint-btn').style.display = 'none';
    
    showScreen('drive-screen');
}

// Drive functionality
function startDrive() {
    driveStartTime = Date.now();
    lastCheckpointTime = driveStartTime;
    currentCheckpointIndex = 0;
    sectionTimes = [];
    
    document.getElementById('start-drive-btn').style.display = 'none';
    
    // Reset checkpoint button to its normal function
    const checkpointBtn = document.getElementById('checkpoint-btn');
    checkpointBtn.style.display = 'block';
    checkpointBtn.textContent = 'CHECKPOINT';
    checkpointBtn.onclick = recordCheckpoint;
    
    showNextCheckpoint();
    startTimer();
}

function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - driveStartTime) / 1000;
        const statusHTML = `
            <p class="status-text">Drive in Progress</p>
            <div class="timer">${formatTime(elapsed)}</div>
        `;
        document.getElementById('drive-status').innerHTML = statusHTML;
    }, 100);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function showNextCheckpoint() {
    const route = ROUTES[currentRoute];
    const checkpointName = route.checkpoints[currentCheckpointIndex];
    
    let avgTime = null;
    if (routeStats && routeStats.sections[currentCheckpointIndex + 1]) {
        avgTime = routeStats.sections[currentCheckpointIndex + 1].mean;
    }
    
    const infoHTML = `
        <p class="checkpoint-number">Checkpoint ${currentCheckpointIndex + 1} of ${route.checkpoints.length}</p>
        <p class="checkpoint-name">${checkpointName}</p>
        ${avgTime ? `<p style="color: rgba(255,255,255,0.6); font-size: 14px;">Average: ${formatTime(avgTime)}</p>` : ''}
    `;
    
    document.getElementById('checkpoint-info').innerHTML = infoHTML;
}

function recordCheckpoint() {
    const currentTime = Date.now();
    const sectionTime = (currentTime - lastCheckpointTime) / 1000;
    sectionTimes.push(sectionTime);
    
    const route = ROUTES[currentRoute];
    const checkpointName = route.checkpoints[currentCheckpointIndex];
    
    // Show comparison
    let comparisonHTML = '';
    if (routeStats && routeStats.sections[currentCheckpointIndex + 1]) {
        const avgTime = routeStats.sections[currentCheckpointIndex + 1].mean;
        const diff = sectionTime - avgTime;
        const className = diff < 0 ? 'ahead' : 'behind';
        const arrow = diff < 0 ? '↓' : '↑';
        const label = diff < 0 ? 'AHEAD' : 'BEHIND';
        comparisonHTML = `
            <div class="comparison ${className}">
                ${arrow} ${formatTime(Math.abs(diff))} ${label} of average (${formatTime(avgTime)})
            </div>
        `;
    }
    
    // Add to section times display
    const sectionTimesContainer = document.getElementById('section-times');
    const sectionHTML = `
        <div class="section-time">
            <span class="section-label">Section ${currentCheckpointIndex + 1}: ${checkpointName}</span>
            <span class="section-value">${formatTime(sectionTime)}</span>
        </div>
        ${comparisonHTML}
    `;
    sectionTimesContainer.innerHTML += sectionHTML;
    
    // Update for next checkpoint
    lastCheckpointTime = currentTime;
    currentCheckpointIndex++;
    
    // Check if all checkpoints are done
    if (currentCheckpointIndex >= route.checkpoints.length) {
        // Show destination prompt instead of completing
        showDestinationPrompt();
    } else {
        showNextCheckpoint();
    }
}

function showDestinationPrompt() {
    const infoHTML = `
        <p class="checkpoint-number">All checkpoints complete!</p>
        <p class="checkpoint-name">DESTINATION REACHED</p>
        <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-top: 10px;">
            Tap when you arrive at your destination
        </p>
    `;
    
    document.getElementById('checkpoint-info').innerHTML = infoHTML;
    
    // Change button text and function
    document.getElementById('checkpoint-btn').textContent = 'ARRIVED AT DESTINATION';
    document.getElementById('checkpoint-btn').onclick = recordDestination;
}

function recordDestination() {
    const currentTime = Date.now();
    const finalSectionTime = (currentTime - lastCheckpointTime) / 1000;
    sectionTimes.push(finalSectionTime);
    
    const route = ROUTES[currentRoute];
    const sectionNumber = route.checkpoints.length + 1;
    
    // Show comparison for final section
    let comparisonHTML = '';
    if (routeStats && routeStats.sections[sectionNumber]) {
        const avgTime = routeStats.sections[sectionNumber].mean;
        const diff = finalSectionTime - avgTime;
        const className = diff < 0 ? 'ahead' : 'behind';
        const arrow = diff < 0 ? '↓' : '↑';
        const label = diff < 0 ? 'AHEAD' : 'BEHIND';
        comparisonHTML = `
            <div class="comparison ${className}">
                ${arrow} ${formatTime(Math.abs(diff))} ${label} of average (${formatTime(avgTime)})
            </div>
        `;
    }
    
    // Add final section to display
    const sectionTimesContainer = document.getElementById('section-times');
    const sectionHTML = `
        <div class="section-time">
            <span class="section-label">Final Section: To Destination</span>
            <span class="section-value">${formatTime(finalSectionTime)}</span>
        </div>
        ${comparisonHTML}
    `;
    sectionTimesContainer.innerHTML += sectionHTML;
    
    // Now complete the drive
    completeDrive();
}

function completeDrive() {
    stopTimer();
    const totalTime = (Date.now() - driveStartTime) / 1000;
    
    document.getElementById('checkpoint-btn').style.display = 'none';
    
    // Build results display
    const route = ROUTES[currentRoute];
    let resultsHTML = `
        <div class="result-total">
            <h3>Total Trip Time</h3>
            <div class="time">${formatTime(totalTime)}</div>
    `;
    
    // Add comparison to average
    if (routeStats) {
        const avgTotal = routeStats.total.mean;
        const diff = totalTime - avgTotal;
        const className = diff < 0 ? 'ahead' : 'behind';
        const arrow = diff < 0 ? '↓' : '↑';
        const label = diff < 0 ? 'FASTER' : 'SLOWER';
        resultsHTML += `
            <div class="comparison ${className}">
                ${arrow} ${formatTime(Math.abs(diff))} ${label} than average (${formatTime(avgTotal)})
            </div>
        `;
    }
    
    resultsHTML += '</div><div class="section-times"><h3>Section Breakdown</h3>';
    
    sectionTimes.forEach((time, index) => {
        let sectionLabel;
        if (index < route.checkpoints.length) {
            sectionLabel = `Section ${index + 1}: ${route.checkpoints[index]}`;
        } else {
            sectionLabel = `Final Section: To Destination`;
        }
        resultsHTML += `
            <div class="section-time">
                <span class="section-label">${sectionLabel}</span>
                <span class="section-value">${formatTime(time)}</span>
            </div>
        `;
    });
    
    resultsHTML += '</div>';
    
    document.getElementById('results-display').innerHTML = resultsHTML;
    showScreen('results-screen');
}

function cancelDrive() {
    stopTimer();
    showMenu();
}

// Save/Discard trip
function saveTrip() {
    const totalTime = (Date.now() - driveStartTime) / 1000;
    
    const trip = {
        routeId: currentRoute,
        timestamp: new Date().toISOString(),
        totalTime: totalTime,
        sectionTimes: sectionTimes
    };
    
    const transaction = db.transaction(['trips'], 'readwrite');
    const store = transaction.objectStore('trips');
    store.add(trip);
    
    transaction.oncomplete = () => {
        alert('✓ Trip saved successfully!');
        showMenu();
    };
    
    transaction.onerror = () => {
        alert('Error saving trip');
    };
}

function discardTrip() {
    if (confirm('Are you sure you want to discard this trip?')) {
        showMenu();
    }
}

// Statistics
function loadRouteStatistics(routeId) {
    return new Promise((resolve) => {
        const transaction = db.transaction(['trips'], 'readonly');
        const store = transaction.objectStore('trips');
        const index = store.index('routeId');
        const request = index.getAll(routeId);
        
        request.onsuccess = () => {
            const trips = request.result;
            if (trips.length === 0) {
                resolve(null);
                return;
            }
            
            const stats = calculateStatistics(trips);
            resolve(stats);
        };
        
        request.onerror = () => resolve(null);
    });
}

function calculateStatistics(trips) {
    const totalTimes = trips.map(t => t.totalTime);
    const numSections = trips[0].sectionTimes.length;
    
    const stats = {
        numTrips: trips.length,
        total: {
            mean: mean(totalTimes),
            stdev: stdev(totalTimes),
            min: Math.min(...totalTimes),
            max: Math.max(...totalTimes),
            range: Math.max(...totalTimes) - Math.min(...totalTimes)
        },
        sections: {}
    };
    
    for (let i = 0; i < numSections; i++) {
        const sectionTimes = trips.map(t => t.sectionTimes[i]);
        stats.sections[i + 1] = {
            mean: mean(sectionTimes),
            stdev: stdev(sectionTimes),
            min: Math.min(...sectionTimes),
            max: Math.max(...sectionTimes),
            range: Math.max(...sectionTimes) - Math.min(...sectionTimes)
        };
    }
    
    return stats;
}

function displayRouteStatistics(routeId) {
    loadRouteStatistics(routeId).then(stats => {
        const route = ROUTES[routeId];
        const container = document.getElementById('statistics-display');
        
        if (!stats) {
            container.innerHTML = '<p class="no-data">No trip data available for this route yet.</p>';
            return;
        }
        
        let html = `
            <div class="stat-section">
                <h3>Route: ${route.name}</h3>
                <p style="text-align: center; color: rgba(255,255,255,0.6); margin-bottom: 20px;">
                    Total trips recorded: ${stats.numTrips}
                </p>
            </div>
            
            <div class="stat-section">
                <h3>Total Trip Time</h3>
                <div class="stat-row">
                    <span class="stat-label">Mean</span>
                    <span class="stat-value">${formatTime(stats.total.mean)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Std Dev</span>
                    <span class="stat-value">${formatTime(stats.total.stdev)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Min</span>
                    <span class="stat-value">${formatTime(stats.total.min)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Max</span>
                    <span class="stat-value">${formatTime(stats.total.max)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Range</span>
                    <span class="stat-value">${formatTime(stats.total.range)}</span>
                </div>
            </div>
        `;
        
        Object.keys(stats.sections).forEach(sectionNum => {
            const sectionStats = stats.sections[sectionNum];
            let checkpointName;
            const sectionIndex = parseInt(sectionNum);
            
            // Handle final section (after all checkpoints)
            if (sectionIndex <= route.checkpoints.length) {
                checkpointName = route.checkpoints[sectionIndex - 1];
            } else {
                checkpointName = "To Destination";
            }
            
            html += `
                <div class="stat-section">
                    <h3>Section ${sectionNum}: ${checkpointName}</h3>
                    <div class="stat-row">
                        <span class="stat-label">Mean</span>
                        <span class="stat-value">${formatTime(sectionStats.mean)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Std Dev</span>
                        <span class="stat-value">${formatTime(sectionStats.stdev)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Min</span>
                        <span class="stat-value">${formatTime(sectionStats.min)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Max</span>
                        <span class="stat-value">${formatTime(sectionStats.max)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Range</span>
                        <span class="stat-value">${formatTime(sectionStats.range)}</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    });
}

// Utility functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins} min ${secs.toFixed(2)} sec`;
    }
    return `${secs.toFixed(2)} sec`;
}

function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdev(arr) {
    if (arr.length < 2) return 0;
    const avg = mean(arr);
    const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

// Allow Enter key to login
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            authenticate();
        }
    });
});
