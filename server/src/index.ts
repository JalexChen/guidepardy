import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { GameManager } from './game/GameManager';

const app = express();
const httpServer = createServer(app);

// In production, restrict CORS to the app's own origin
// Railway sets RAILWAY_PUBLIC_DOMAIN automatically
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : '*';

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

const boardsDir = path.join(__dirname, '../boards');
const game = new GameManager(boardsDir);

const HOST_SECRET = process.env.HOST_SECRET || 'guidepardy-host';
const hostSockets = new Set<string>();

// Broadcast state to all clients whenever game state changes
game.setOnStateChange(() => {
  const publicState = game.getPublicState();
  const hostState = game.getHostState();

  // Send public state to all player sockets
  io.emit('game:state', publicState);

  // Send host state to host sockets
  for (const sid of hostSockets) {
    io.to(sid).emit('game:host_state', hostState);
  }
});

game.setOnTimerExpire(() => {
  // State change already triggers broadcast
});

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  // Host authentication
  socket.on('host:join', (data: { secret: string }) => {
    if (data.secret === HOST_SECRET) {
      hostSockets.add(socket.id);
      socket.emit('game:host_state', game.getHostState());
      socket.emit('host:authenticated', { success: true });
    } else {
      socket.emit('host:authenticated', { success: false, error: 'Invalid secret' });
    }
  });

  // Player join
  socket.on('player:join', (data: { name: string }) => {
    const result = game.addPlayer(data.name, socket.id);
    if (result.success) {
      socket.emit('player:joined', { success: true, name: data.name });
      socket.emit('game:state', game.getPublicState());
    } else {
      socket.emit('player:joined', { success: false, error: result.error });
    }
  });

  // Player buzz
  socket.on('player:buzz', () => {
    game.buzzIn(socket.id);
  });

  // Host: start game
  socket.on('host:start', (data?: { board?: string }) => {
    if (!hostSockets.has(socket.id)) return;
    const result = game.startGame(data?.board);
    if (!result.success) {
      socket.emit('error', { message: result.error });
    }
  });

  // Host: select tile
  socket.on('host:select_tile', (data: { col: number; row: number }) => {
    if (!hostSockets.has(socket.id)) return;
    const result = game.selectTile(data.col, data.row);
    if (!result.success) {
      socket.emit('error', { message: result.error });
    }
  });

  // Host: mark correct
  socket.on('host:correct', () => {
    if (!hostSockets.has(socket.id)) return;
    game.markCorrect();
  });

  // Host: mark wrong
  socket.on('host:wrong', () => {
    if (!hostSockets.has(socket.id)) return;
    game.markWrong();
  });

  // Host: skip tile
  socket.on('host:skip', () => {
    if (!hostSockets.has(socket.id)) return;
    game.skipTile();
  });

  // Host: add player manually
  socket.on('host:add_player', (data: { name: string }) => {
    if (!hostSockets.has(socket.id)) return;
    const result = game.addPlayerByHost(data.name);
    if (!result.success) {
      socket.emit('error', { message: result.error });
    }
  });

  // Host: remove player
  socket.on('host:remove_player', (data: { name: string }) => {
    if (!hostSockets.has(socket.id)) return;
    game.removePlayer(data.name);
  });

  // Host: adjust score
  socket.on('host:adjust_score', (data: { name: string; delta: number }) => {
    if (!hostSockets.has(socket.id)) return;
    game.adjustScore(data.name, data.delta);
  });

  // Host: reset game
  socket.on('host:reset', () => {
    if (!hostSockets.has(socket.id)) return;
    game.resetGame();
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    hostSockets.delete(socket.id);
    game.disconnectPlayer(socket.id);
  });
});

// Health check endpoint (Railway uses this to verify the app is running)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', players: game.getPublicState().players.length });
});

// Serve React build in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Required for Railway/Docker — must bind to all interfaces
httpServer.listen(parseInt(String(PORT), 10), HOST, () => {
  console.log(`Guidepardy server running on ${HOST}:${PORT}`);
  console.log(`Host secret: ${HOST_SECRET}`);
});
