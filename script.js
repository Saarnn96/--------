// ניהול טאבים
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // הסרת מחלקת active מכל הכפתורים והתוכן
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // הוספת מחלקת active לכפתור ולתוכן הנבחר
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// הוספת פונקציות עריכה והיסטוריה
let taskHistory = {
    daily: [],
    weekly: {},
    deleted: []
};

function saveToHistory(task, type, action = 'update') {
    const historyEntry = {
        task,
        type,
        action,
        date: new Date().toISOString()
    };

    if (action === 'delete') {
        taskHistory.deleted.push(historyEntry);
    } else {
        if (type === 'daily') {
            taskHistory.daily.push(task);
        } else {
            taskHistory.weekly = task;
        }
    }

    localStorage.setItem('taskHistory', JSON.stringify(taskHistory));
    displayHistory();
}

function editTask(button) {
    const taskItem = button.closest('.task-item');
    const taskText = taskItem.querySelector('span');
    const currentText = taskText.textContent;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'edit-input';
    
    taskText.replaceWith(input);
    input.focus();
    
    input.addEventListener('blur', () => {
        const newText = input.value.trim();
        if (newText) {
            const newSpan = document.createElement('span');
            newSpan.textContent = newText;
            input.replaceWith(newSpan);
            saveTasks();
            saveToHistory({
                text: newText,
                completed: taskItem.classList.contains('completed'),
                day: taskItem.closest('.weekday-section') ? taskItem.closest('.weekday-section').dataset.day : null
            });
        } else {
            input.replaceWith(taskText);
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
}

function restoreFromHistory() {
    const history = JSON.parse(localStorage.getItem('taskHistory'));
    if (history) {
        taskHistory = history;
        loadTasks();
    }
}

// עדכון פונקציית הוספת משימה יומית
function addDailyTask() {
    const input = document.getElementById('daily-task');
    const taskText = input.value.trim();
    
    if (taskText) {
        const taskList = document.getElementById('daily-tasks');
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        
        taskItem.innerHTML = `
            <span>${taskText}</span>
            <div>
                <button onclick="toggleTask(this)">✓</button>
                <button onclick="editTask(this)">✎</button>
                <button class="delete-btn" onclick="deleteTask(this)">×</button>
            </div>
        `;
        
        taskList.appendChild(taskItem);
        input.value = '';
        saveTasks();
        saveToHistory({
            text: taskText,
            completed: false,
            day: null
        }, 'daily');
    }
}

// עדכון פונקציית הוספת משימה שבועית
function addWeeklyTask() {
    const input = document.getElementById('weekly-task');
    const weekdaySelect = document.getElementById('weekday');
    const taskText = input.value.trim();
    const weekday = weekdaySelect.value;
    
    if (taskText) {
        let weekdaySection = document.querySelector(`.weekday-section[data-day="${weekday}"]`);
        
        if (!weekdaySection) {
            const weeklyContainer = document.getElementById('weekly-tasks');
            weekdaySection = document.createElement('div');
            weekdaySection.className = 'weekday-section';
            weekdaySection.dataset.day = weekday;
            weekdaySection.innerHTML = `<h3>${weekdaySelect.options[weekdaySelect.selectedIndex].text}</h3>`;
            weeklyContainer.appendChild(weekdaySection);
        }
        
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.innerHTML = `
            <span>${taskText}</span>
            <div>
                <button onclick="toggleTask(this)">✓</button>
                <button onclick="editTask(this)">✎</button>
                <button class="delete-btn" onclick="deleteTask(this)">×</button>
            </div>
        `;
        
        weekdaySection.appendChild(taskItem);
        input.value = '';
        saveTasks();
        saveToHistory({
            text: taskText,
            completed: false,
            day: weekday
        }, 'weekly');
    }
}

// פונקציות עזר
function toggleTask(button) {
    const taskItem = button.closest('.task-item');
    taskItem.classList.toggle('completed');
    saveTasks();
    saveToHistory({
        text: taskItem.querySelector('span').textContent,
        completed: taskItem.classList.contains('completed'),
        day: taskItem.closest('.weekday-section') ? taskItem.closest('.weekday-section').dataset.day : null
    }, taskItem.closest('.weekday-section') ? 'weekly' : 'daily');
}

function deleteTask(button) {
    const taskItem = button.closest('.task-item');
    const taskText = taskItem.querySelector('span').textContent;
    const isWeekly = taskItem.closest('.weekday-section') !== null;
    const type = isWeekly ? 'weekly' : 'daily';
    
    saveToHistory({
        text: taskText,
        completed: taskItem.classList.contains('completed'),
        day: isWeekly ? taskItem.closest('.weekday-section').dataset.day : null
    }, type, 'delete');
    
    taskItem.remove();
    saveTasks();
}

// שמירת המשימות ב-localStorage
function saveTasks() {
    const dailyTasks = Array.from(document.querySelectorAll('#daily-tasks .task-item')).map(item => ({
        text: item.querySelector('span').textContent,
        completed: item.classList.contains('completed')
    }));
    
    const weeklyTasks = {};
    document.querySelectorAll('.weekday-section').forEach(section => {
        const day = section.dataset.day;
        weeklyTasks[day] = Array.from(section.querySelectorAll('.task-item')).map(item => ({
            text: item.querySelector('span').textContent,
            completed: item.classList.contains('completed')
        }));
    });
    
    localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks));
    localStorage.setItem('weeklyTasks', JSON.stringify(weeklyTasks));
}

// עדכון פונקציית טעינת משימות
function loadTasks() {
    const dailyTasks = JSON.parse(localStorage.getItem('dailyTasks')) || [];
    const weeklyTasks = JSON.parse(localStorage.getItem('weeklyTasks')) || {};
    
    // טעינת משימות יומיות
    const dailyList = document.getElementById('daily-tasks');
    dailyTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.innerHTML = `
            <span>${task.text}</span>
            <div>
                <button onclick="toggleTask(this)">✓</button>
                <button onclick="editTask(this)">✎</button>
                <button class="delete-btn" onclick="deleteTask(this)">×</button>
            </div>
        `;
        dailyList.appendChild(taskItem);
    });
    
    // טעינת משימות שבועיות
    const weeklyContainer = document.getElementById('weekly-tasks');
    Object.entries(weeklyTasks).forEach(([day, tasks]) => {
        const weekdaySection = document.createElement('div');
        weekdaySection.className = 'weekday-section';
        weekdaySection.dataset.day = day;
        
        const dayName = document.getElementById('weekday').options[Array.from(document.getElementById('weekday').options).findIndex(option => option.value === day)].text;
        weekdaySection.innerHTML = `<h3>${dayName}</h3>`;
        
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.innerHTML = `
                <span>${task.text}</span>
                <div>
                    <button onclick="toggleTask(this)">✓</button>
                    <button onclick="editTask(this)">✎</button>
                    <button class="delete-btn" onclick="deleteTask(this)">×</button>
                </div>
            `;
            weekdaySection.appendChild(taskItem);
        });
        
        weeklyContainer.appendChild(weekdaySection);
    });
}

function displayHistory() {
    const historyContainer = document.getElementById('history-tasks');
    const typeFilter = document.getElementById('history-type').value;
    const monthFilter = document.getElementById('history-month').value;
    const yearFilter = document.getElementById('history-year').value;
    
    historyContainer.innerHTML = '';
    
    taskHistory.deleted
        .filter(entry => {
            if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
            
            const entryDate = new Date(entry.date);
            const entryMonth = entryDate.getMonth() + 1;
            const entryYear = entryDate.getFullYear();
            
            if (monthFilter && entryMonth !== parseInt(monthFilter)) return false;
            if (yearFilter && entryYear !== parseInt(yearFilter)) return false;
            
            return true;
        })
        .forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(entry.date).toLocaleString('he-IL', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            historyItem.innerHTML = `
                <div class="history-item-header">
                    <span class="history-date">${date}</span>
                    <span class="history-task-type">${entry.type === 'daily' ? 'יומי' : 'שבועי'}</span>
                </div>
                <div class="history-task-content">
                    ${entry.task.text}
                    ${entry.task.day ? ` (${entry.task.day})` : ''}
                </div>
                <div class="history-actions">
                    <button class="restore-btn" onclick="restoreTask(${taskHistory.deleted.indexOf(entry)})">שחזר</button>
                </div>
            `;
            
            historyContainer.appendChild(historyItem);
        });
}

function restoreTask(index) {
    const entry = taskHistory.deleted[index];
    
    if (entry.type === 'daily') {
        const taskList = document.getElementById('daily-tasks');
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${entry.task.completed ? 'completed' : ''}`;
        taskItem.innerHTML = `
            <span>${entry.task.text}</span>
            <div>
                <button onclick="toggleTask(this)">✓</button>
                <button onclick="editTask(this)">✎</button>
                <button class="delete-btn" onclick="deleteTask(this)">×</button>
            </div>
        `;
        taskList.appendChild(taskItem);
    } else {
        let weekdaySection = document.querySelector(`.weekday-section[data-day="${entry.task.day}"]`);
        
        if (!weekdaySection) {
            const weeklyContainer = document.getElementById('weekly-tasks');
            weekdaySection = document.createElement('div');
            weekdaySection.className = 'weekday-section';
            weekdaySection.dataset.day = entry.task.day;
            const dayName = document.getElementById('weekday').options[Array.from(document.getElementById('weekday').options).findIndex(option => option.value === entry.task.day)].text;
            weekdaySection.innerHTML = `<h3>${dayName}</h3>`;
            weeklyContainer.appendChild(weekdaySection);
        }
        
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${entry.task.completed ? 'completed' : ''}`;
        taskItem.innerHTML = `
            <span>${entry.task.text}</span>
            <div>
                <button onclick="toggleTask(this)">✓</button>
                <button onclick="editTask(this)">✎</button>
                <button class="delete-btn" onclick="deleteTask(this)">×</button>
            </div>
        `;
        weekdaySection.appendChild(taskItem);
    }
    
    taskHistory.deleted.splice(index, 1);
    localStorage.setItem('taskHistory', JSON.stringify(taskHistory));
    displayHistory();
    saveTasks();
}

function filterHistory() {
    displayHistory();
}

// טעינת ההיסטוריה בעת טעינת הדף
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    const savedHistory = localStorage.getItem('taskHistory');
    if (savedHistory) {
        taskHistory = JSON.parse(savedHistory);
        
        // הוספת שנים אפשריות לבחירה
        const yearSelect = document.getElementById('history-year');
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= currentYear - 5; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
        
        displayHistory();
    }
});

// הוספת מאזינים לשדות הקלט
document.addEventListener('DOMContentLoaded', () => {
    const dailyInput = document.getElementById('daily-task');
    const weeklyInput = document.getElementById('weekly-task');

    // מאזין לשדה הקלט היומי
    dailyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addDailyTask();
        }
    });

    // מאזין לשדה הקלט השבועי
    weeklyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addWeeklyTask();
        }
    });
}); 