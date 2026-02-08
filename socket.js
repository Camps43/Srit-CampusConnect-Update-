const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const User = require('./models/User');
const Project = require('./models/Project');

module.exports = function init(server) {
  const io = new Server(server, {
    cors: {
      origin: 'https://srit-campusconnect.netlify.app',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ==================================================
  // AUTH MIDDLEWARE
  // ==================================================
  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) return next();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name role');
      if (user) {
        socket.user = {
          _id: user._id.toString(),
          name: user.name,
          role: user.role,
        };
      }
    } catch (err) {
      console.log('❌ Socket auth failed');
    }
    next();
  });

  // ==================================================
  // CONNECTION
  // ==================================================
  io.on('connection', (socket) => {
    console.log(
      '🔌 Socket connected:',
      socket.id,
      socket.user?.name || 'anonymous'
    );

    // ==================================================
    // JOIN PROJECT ROOM (TEAM-ONLY)
    // ==================================================
    socket.on('join-room', async (room) => {
      try {
        // room format → project:PROJECT_ID
        if (!room.startsWith('project:')) return;

        if (!socket.user) return;

        const projectId = room.split(':')[1];

        const project = await Project.findById(projectId);
        if (!project) return;

        const userId = socket.user._id;

        const isFaculty =
          project.faculty.toString() === userId;

        const isStudentMember = project.members
          .map(id => id.toString())
          .includes(userId);

        if (!isFaculty && !isStudentMember) {
          console.log('🚫 Unauthorized room join blocked');
          return;
        }

        socket.join(room);
        console.log('✅ Joined project room:', room);
      } catch (err) {
        console.error('join-room error:', err);
      }
    });

    // ==================================================
    // LEAVE ROOM
    // ==================================================
    socket.on('leave-room', (room) => {
      socket.leave(room);
    });

    // ==================================================
    // MESSAGE EVENT (ROOM-SCOPED)
    // ==================================================
    socket.on('message', async ({ room, text, meta }) => {
      try {
        if (!socket.user) return;

        // 🚫 Prevent sending message without joining room
        if (!socket.rooms.has(room)) {
          console.log('🚫 Message blocked (not in room)');
          return;
        }

        const msg = await Message.create({
          room,
          text,
          meta,
          from: socket.user._id,
        });

        await msg.populate('from', 'name role');

        io.to(room).emit('message:new', {
          _id: msg._id,
          room: msg.room,
          text: msg.text,
          meta: msg.meta,
          from: {
            _id: msg.from._id.toString(),
            name: msg.from.name,
            role: msg.from.role,
          },
          createdAt: msg.createdAt,
        });
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    // ==================================================
    // DISCONNECT
    // ==================================================
    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });

  return io;
};
