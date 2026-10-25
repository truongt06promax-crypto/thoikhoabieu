async function checkAuth(expectedRole) {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.success) {
      window.location.href = '/login.html';
      return null;
    }
    if (expectedRole && data.user.role !== expectedRole) {
      window.location.href = data.user.role === 'student' ? '/student.html' : '/lecturer.html';
      return null;
    }
    return data.user;
  } catch {
    window.location.href = '/login.html';
    return null;
  }
}

async function loadSemesters() {
  const res = await fetch('/api/schedules/semesters');
  const data = await res.json();
  const select = document.getElementById('semesterSelect');
  select.innerHTML = '';
  if (data.success && data.data.length) {
    data.data.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      select.appendChild(opt);
    });
  } else {
    const opt = document.createElement('option');
    opt.value = '2025-2026-1';
    opt.textContent = '2025-2026-1';
    select.appendChild(opt);
  }
}

async function loadSchedules() {
  const semester = document.getElementById('semesterSelect').value;
  const tbody = document.getElementById('scheduleBody');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Đang tải...</td></tr>';

  try {
    const res = await fetch('/api/schedules?semester=' + encodeURIComponent(semester));
    const data = await res.json();

    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${data.message || 'Lỗi tải dữ liệu'}</td></tr>`;
      return;
    }

    if (!data.data || data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Không có lịch học trong học kỳ này.</td></tr>';
      return;
    }

    tbody.innerHTML = data.data.map(item => `
      <tr>
        <td><span class="badge badge-day">${item.dayName}</span></td>
        <td><span class="badge badge-time">${item.startTime} – ${item.endTime}</span></td>
        <td>${item.subjectCode}</td>
        <td>${item.subjectName}</td>
        <td>${item.sectionCode}</td>
        <td>${item.roomCode}</td>
        <td>${item.lecturerName}</td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Không kết nối được máy chủ.</td></tr>';
  }
}

function setupLogout() {
  document.getElementById('btnLogout').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}

async function initPage(expectedRole) {
  const user = await checkAuth(expectedRole);
  if (!user) return;

  document.getElementById('userName').textContent = user.fullName + ' (' + user.username + ')';
  setupLogout();
  await loadSemesters();
  await loadSchedules();

  document.getElementById('btnLoad').addEventListener('click', loadSchedules);
  document.getElementById('semesterSelect').addEventListener('change', loadSchedules);
}
