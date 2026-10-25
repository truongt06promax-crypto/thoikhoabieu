const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Đọc dữ liệu từ file JSON
const dbPath = path.join(__dirname, 'data', 'db.json');
function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'dhhp-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, '../public')));

// Đăng nhập
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  const db = loadDB();
  const user = db.users.find(u => u.username === username.trim() && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    refId: user.refId
  };

  res.json({ success: true, message: 'Đăng nhập thành công', user: req.session.user });
});

// Đăng xuất
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Đã đăng xuất' });
  });
});

// Lấy thông tin user hiện tại
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }
  res.json({ success: true, user: req.session.user });
});

// Lấy danh sách học kỳ
app.get('/api/schedules/semesters', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
  }
  const db = loadDB();
  const semesters = [...new Set(db.schedules.map(s => s.semester))];
  res.json({ success: true, data: semesters });
});

// Lấy thời khóa biểu
app.get('/api/schedules', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
  }

  const user = req.session.user;
  const semester = req.query.semester || '2025-2026-1';
  const db = loadDB();

  let data = [];
  if (user.role === 'student') {
    data = db.schedules.filter(s =>
      s.semester === semester && s.studentIds.includes(user.refId)
    );
  } else if (user.role === 'lecturer') {
    data = db.schedules.filter(s =>
      s.semester === semester && s.lecturerId === user.refId
    );
  }

  // Sắp xếp theo thứ và giờ
  data.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });

  res.json({
    success: true,
    role: user.role,
    fullName: user.fullName,
    semester,
    data
  });
});

// Trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  Ung dung Thoi khoa bieu DHHP');
  console.log('  Dang chay tai: http://localhost:3000');
  console.log('========================================');
  console.log('Tai khoan mau (mat khau: 123456):');
  console.log('  Sinh vien : sv001, sv002, sv003');
  console.log('  Giang vien: gv001, gv002');
  console.log('========================================');
});
