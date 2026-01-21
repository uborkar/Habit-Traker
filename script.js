// Habit Tracker Application Logic
class HabitTracker {
    constructor() {
        this.activities = this.loadActivities();
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('habitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addActivity();
        });

        // Clear data
        document.getElementById('clearData').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all activities for today?')) {
                this.clearActivities();
            }
        });

        // Export data
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });
    }

    addActivity() {
        const habitName = document.getElementById('habitName').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const category = document.getElementById('category').value;
        const notes = document.getElementById('notes').value;

        // Calculate duration
        const duration = this.calculateDuration(startTime, endTime);

        if (duration <= 0) {
            alert('End time must be after start time!');
            return;
        }

        const activity = {
            id: Date.now(),
            name: habitName,
            startTime,
            endTime,
            duration,
            category,
            notes,
            date: new Date().toISOString().split('T')[0]
        };

        this.activities.push(activity);
        this.saveActivities();
        this.updateUI();

        // Reset form
        document.getElementById('habitForm').reset();
        
        // Show success feedback
        this.showNotification('Activity added successfully!');
    }

    calculateDuration(startTime, endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        
        // Handle overnight activities
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60;
        }
        
        return totalMinutes;
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    deleteActivity(id) {
        this.activities = this.activities.filter(activity => activity.id !== id);
        this.saveActivities();
        this.updateUI();
        this.showNotification('Activity deleted');
    }

    getTodayActivities() {
        const today = new Date().toISOString().split('T')[0];
        return this.activities.filter(activity => activity.date === today);
    }

    updateUI() {
        this.updateStats();
        this.updateActivityList();
        this.updateCharts();
    }

    updateStats() {
        const todayActivities = this.getTodayActivities();
        
        // Total activities
        document.getElementById('totalActivities').textContent = todayActivities.length;

        // Total time tracked
        const totalMinutes = todayActivities.reduce((sum, activity) => sum + activity.duration, 0);
        document.getElementById('totalTime').textContent = this.formatDuration(totalMinutes);

        // Productive time
        const productiveCategories = ['productive', 'learning', 'work', 'health'];
        const productiveMinutes = todayActivities
            .filter(activity => productiveCategories.includes(activity.category))
            .reduce((sum, activity) => sum + activity.duration, 0);
        document.getElementById('productiveTime').textContent = this.formatDuration(productiveMinutes);

        // Success score (percentage of day tracked productively)
        const totalDayMinutes = 24 * 60;
        const successScore = Math.round((productiveMinutes / totalDayMinutes) * 100);
        document.getElementById('successScore').textContent = `${successScore}%`;
    }

    updateActivityList() {
        const activityList = document.getElementById('activityList');
        const todayActivities = this.getTodayActivities();

        if (todayActivities.length === 0) {
            activityList.innerHTML = '<p class="empty-state">No activities tracked yet. Start tracking your day!</p>';
            return;
        }

        // Sort by start time
        todayActivities.sort((a, b) => a.startTime.localeCompare(b.startTime));

        activityList.innerHTML = todayActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-info">
                    <div class="activity-name">${activity.name}</div>
                    <div class="activity-time">
                        ${activity.startTime} - ${activity.endTime}
                        <span class="activity-category category-${activity.category}">${activity.category}</span>
                    </div>
                    ${activity.notes ? `<div class="activity-notes" style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 5px;">${activity.notes}</div>` : ''}
                </div>
                <div class="activity-duration">${this.formatDuration(activity.duration)}</div>
                <button class="delete-btn" onclick="tracker.deleteActivity(${activity.id})">×</button>
            </div>
        `).join('');
    }

    initializeCharts() {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded. Charts will not be displayed.');
            this.displayChartPlaceholder();
            return;
        }

        try {
            // Category Chart
            const categoryCtx = document.getElementById('categoryChart').getContext('2d');
            this.charts.category = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#10b981', '#ef4444', '#3b82f6', '#f59e0b',
                            '#ec4899', '#6366f1', '#6b7280'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Progress Chart
            const progressCtx = document.getElementById('progressChart').getContext('2d');
            this.charts.progress = new Chart(progressCtx, {
                type: 'bar',
                data: {
                    labels: ['Productive', 'Non-Productive', 'Untracked'],
                    datasets: [{
                        label: 'Hours',
                        data: [0, 0, 24],
                        backgroundColor: ['#10b981', '#ef4444', '#e5e7eb']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 24
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing charts:', error);
            this.displayChartPlaceholder();
        }
    }

    displayChartPlaceholder() {
        const chartsSection = document.querySelector('.charts-grid');
        if (chartsSection) {
            chartsSection.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px;">
                    <p style="color: #64748b; font-size: 1rem;">📊 Charts are currently unavailable</p>
                    <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 10px;">Your data is being tracked and saved. Charts will display when available.</p>
                </div>
            `;
        }
    }

    updateCharts() {
        // Skip chart updates if Chart.js is not available
        if (typeof Chart === 'undefined' || !this.charts.category || !this.charts.progress) {
            return;
        }

        const todayActivities = this.getTodayActivities();

        // Update category chart
        const categoryData = {};
        todayActivities.forEach(activity => {
            if (!categoryData[activity.category]) {
                categoryData[activity.category] = 0;
            }
            categoryData[activity.category] += activity.duration;
        });

        this.charts.category.data.labels = Object.keys(categoryData);
        this.charts.category.data.datasets[0].data = Object.values(categoryData);
        this.charts.category.update();

        // Update progress chart
        const productiveCategories = ['productive', 'learning', 'work', 'health'];
        const productiveMinutes = todayActivities
            .filter(activity => productiveCategories.includes(activity.category))
            .reduce((sum, activity) => sum + activity.duration, 0);
        
        const totalMinutes = todayActivities.reduce((sum, activity) => sum + activity.duration, 0);
        const nonProductiveMinutes = totalMinutes - productiveMinutes;
        const untrackedMinutes = (24 * 60) - totalMinutes;

        this.charts.progress.data.datasets[0].data = [
            (productiveMinutes / 60).toFixed(1),
            (nonProductiveMinutes / 60).toFixed(1),
            (untrackedMinutes / 60).toFixed(1)
        ];
        this.charts.progress.update();
    }

    saveActivities() {
        localStorage.setItem('habitTrackerActivities', JSON.stringify(this.activities));
    }

    loadActivities() {
        const stored = localStorage.getItem('habitTrackerActivities');
        return stored ? JSON.parse(stored) : [];
    }

    clearActivities() {
        const today = new Date().toISOString().split('T')[0];
        this.activities = this.activities.filter(activity => activity.date !== today);
        this.saveActivities();
        this.updateUI();
        this.showNotification('Today\'s data cleared');
    }

    exportData() {
        const todayActivities = this.getTodayActivities();
        const dataStr = JSON.stringify(todayActivities, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `habit-tracker-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully!');
    }

    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the tracker
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new HabitTracker();
});
