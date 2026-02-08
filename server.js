require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const socketInit = require('./socket');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clubRoutes = require('./routes/clubs');
const eventRoutes = require('./routes/events');
const noticeRoutes = require('./routes/notices');
const messageRoutes = require('./routes/messages');
const projectRoutes = require('./routes/projects');
const lostFoundRoutes = require('./routes/lostfound');
const adminRoutes = require('./routes/admin');

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

// connect DB
connectDB(process.env.MONGO_URI);

// middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// rate limit
app.use(rateLimit({ windowMs: 60*1000, max: 200 }));

// static uploads folder
// const uploadDir = process.env.UPLOAD_DIR || 'uploads';
// app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', require('./routes/messages'));


// health
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// socket.io
const io = socketInit(server);
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
