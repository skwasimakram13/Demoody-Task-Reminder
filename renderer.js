const form = document.getElementById('taskForm');
const list = document.getElementById('taskList');
const intervalSelect = document.getElementById('intervalSelect');

let editTaskId = null;

// ✅ Save or Edit Task
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const datetime = document.getElementById('datetime').value;

  if (!title || !description || !datetime) {
    alert("Please fill all fields");
    return;
  }

  const task = { title, description, datetime };

  if (editTaskId) {
    task.id = editTaskId;
    await window.electronAPI.updateTask(task);
    editTaskId = null;
  } else {
    await window.electronAPI.saveTask(task);
  }

  form.reset();
  loadTasks();
});

// ✅ Load Tasks
async function loadTasks() {
  const tasks = await window.electronAPI.getTasks();

  if (tasks.length === 0) {
    list.innerHTML = `<p style="text-align:center; color: #666; margin-top: 10px;">📝 No tasks found. Add your first one!</p>`;
    return;
  }

  list.innerHTML = tasks.map(t => `
    <div class="task-item">
      <div class="task-title">${t.title}</div>
      <div>${t.description}</div>
      <div class="task-datetime">${t.datetime}</div>
      <button onclick="editTask(${t.id}, '${t.title.replace(/'/g, "\\'")}', \`${t.description.replace(/`/g, '\\`')}\`, '${t.datetime}')">✏️ Edit</button>
      <button onclick="deleteTask(${t.id})">🗑️ Delete</button>
    </div>
  `).join('');
}

// ✅ Edit Task
window.editTask = (id, title, description, datetime) => {
  document.getElementById('title').value = title;
  document.getElementById('description').value = description;
  document.getElementById('datetime').value = datetime;
  editTaskId = id;
};

// ✅ Delete Task
window.deleteTask = async (id) => {
  await window.electronAPI.deleteTask(id);
  loadTasks();
};

// ✅ Play Sound on Reminder
window.electronAPI.onPlaySound(() => {
  const audio = new Audio('myalert.wav');
  audio.play();
});

// ✅ Update reminder interval on dropdown change
intervalSelect.addEventListener('change', (e) => {
  const value = parseInt(e.target.value);
  window.electronAPI.setReminderInterval(value);
});

// ✅ Receive initial interval value from main process
window.electronAPI.receiveInitInterval((minutes) => {
  intervalSelect.value = minutes.toString();
});

// ✅ Tab Navigation
const homeTab = document.getElementById('homeTab');
const settingsTab = document.getElementById('settingsTab');
const calendarTab = document.getElementById('calendarTab');
const currencyTab = document.getElementById('currencyTab');

const homeSection = document.getElementById('homeSection');
const settingsSection = document.getElementById('settingsSection');
const calendarSection = document.getElementById('calendarSection');
const currencySection = document.getElementById('currencySection');

function showSection(sectionToShow) {
  homeSection.style.display = 'none';
  settingsSection.style.display = 'none';
  calendarSection.style.display = 'none';
  currencySection.style.display = 'none';

  homeTab.classList.remove('active');
  settingsTab.classList.remove('active');
  calendarTab.classList.remove('active');
  currencyTab.classList.remove('active');

  sectionToShow.style.display = 'block';
}

homeTab.addEventListener('click', () => {
  showSection(homeSection);
  homeTab.classList.add('active');
});

settingsTab.addEventListener('click', () => {
  showSection(settingsSection);
  settingsTab.classList.add('active');
});

calendarTab.addEventListener('click', async () => {
  showSection(calendarSection);
  calendarTab.classList.add('active');
  renderCalendar();
});

currencyTab.addEventListener('click', () => {
  showSection(currencySection);
  currencyTab.classList.add('active');
});

// ✅ Render Monthly Calendar with Tasks
async function renderCalendar() {
  const calendar = document.getElementById('calendarGrid');
  calendar.innerHTML = '';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const tasks = await window.electronAPI.getTasks();

  for (let i = 0; i < firstDay; i++) {
    calendar.innerHTML += `<div></div>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasks.filter(task => task.datetime.startsWith(dayStr));
    const taskHtml = dayTasks.map(t => `<div style="font-size: 12px;">• ${t.title}</div>`).join('');

    calendar.innerHTML += `
      <div class="${dayTasks.length ? 'has-task' : ''}">
        <strong>${day}</strong>
        ${taskHtml}
      </div>`;
  }
}

// ✅ Currency Counter Logic
const currencyInputs = document.querySelectorAll('#counterForm input');
const totalValue = document.getElementById('totalValue');

function updateCurrencyTotal() {
  let total = 0;
  currencyInputs.forEach(input => {
    const count = parseInt(input.value) || 0;
    const value = parseInt(input.getAttribute('data-value'));
    total += count * value;
  });
  totalValue.textContent = total;
}

currencyInputs.forEach(input => {
  input.addEventListener('input', updateCurrencyTotal);
});

// ✅ Initial Load
loadTasks();
showSection(homeSection);
homeTab.classList.add('active');
