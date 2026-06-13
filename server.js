require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const PORT = process.env.PORT || 3000;

// Track connected players with WebSocket connections
const connectedPlayers = new Map();

// Discord bot ready event
client.on('ready', () => {
  console.log(`✅ Discord bot logged in as ${client.user.tag}`);
});

// Listen for messages from Discord
client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Only process messages in the configured channel
  if (message.channelId !== CHANNEL_ID) return;

  try {
    console.log(`[DISCORD] ${message.author.username}: ${message.content}`);
    
    // Send message to all connected Minecraft players
    const discordMessage = {
      type: 'discord_message',
      author: message.author.username,
      content: message.content,
      timestamp: new Date(),
    };

    broadcastToPlayers(discordMessage);
  } catch (error) {
    console.error('[DISCORD_MESSAGE_ERROR]', error);
  }
});

// Login to Discord
client.login(DISCORD_TOKEN);

// ==================== WEBSOCKET HANDLING ====================

wss.on('connection', (ws) => {
  console.log('[WS] New WebSocket connection');

  let playerUUID = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'connect') {
        playerUUID = message.uuid;
        connectedPlayers.set(playerUUID, {
          uuid: playerUUID,
          playerName: message.playerName,
          ws,
          connectedAt: new Date(),
        });
        console.log(`[WS_CONNECT] ${message.playerName} (${playerUUID})`);
        ws.send(JSON.stringify({ type: 'connected', success: true }));
      }
    } catch (error) {
      console.error('[WS_MESSAGE_ERROR]', error);
    }
  });

  ws.on('close', () => {
    if (playerUUID) {
      connectedPlayers.delete(playerUUID);
      console.log(`[WS_DISCONNECT] Player ${playerUUID} disconnected`);
    }
  });

  ws.on('error', (error) => {
    console.error('[WS_ERROR]', error);
  });
});

// Broadcast message to all connected players
function broadcastToPlayers(message) {
  let count = 0;
  connectedPlayers.forEach((player) => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
      count++;
    }
  });
  console.log(`[BROADCAST] Sent to ${count} players`);
}

// ==================== API ENDPOINTS ====================

/**
 * POST /api/connect
 * Register a player connection (HTTP fallback)
 */
app.post('/api/connect', (req, res) => {
  try {
    const { uuid, playerName } = req.body;

    if (!uuid || !playerName) {
      return res.status(400).json({ error: 'UUID and playerName are required' });
    }

    console.log(`[CONNECT] ${playerName} (${uuid})`);
    res.status(200).json({ 
      success: true, 
      message: 'Connected to Discord chat',
      wsUrl: `wss://${req.get('host')}/ws` // Send WebSocket URL to client
    });
  } catch (error) {
    console.error('[CONNECT] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/disconnect
 * Unregister a player connection (HTTP fallback)
 */
app.post('/api/disconnect', (req, res) => {
  try {
    const { uuid } = req.body;

    if (!uuid) {
      return res.status(400).json({ error: 'UUID is required' });
    }

    connectedPlayers.delete(uuid);
    console.log(`[DISCONNECT] Player ${uuid} disconnected`);
    res.status(200).json({ success: true, message: 'Disconnected from Discord chat' });
  } catch (error) {
    console.error('[DISCONNECT] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/message
 * Relay a message from Minecraft to Discord and other players
 */
app.post('/api/message', async (req, res) => {
  try {
    const { uuid, playerName, message } = req.body;

    // Validation
    if (!uuid || !playerName || !message) {
      return res.status(400).json({ error: 'UUID, playerName, and message are required' });
    }

    if (!CHANNEL_ID) {
      console.error('[MESSAGE] CHANNEL_ID not set in environment variables');
      return res.status(500).json({ error: 'Channel not configured' });
    }

    // Get the Discord channel
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (!channel) {
      console.error(`[MESSAGE] Channel ${CHANNEL_ID} not found`);
      return res.status(500).json({ error: 'Channel not found' });
    }

    // Validate it's a text channel
    if (channel.type !== ChannelType.GuildText) {
      console.error(`[MESSAGE] Channel ${CHANNEL_ID} is not a text channel`);
      return res.status(500).json({ error: 'Invalid channel type' });
    }

    // Send message to Discord
    const discordMessage = await channel.send({
      embeds: [
        {
          author: {
            name: playerName,
            icon_url: `https://crafatar.com/avatars/${uuid}?size=32&default=MHF_Steve`,
          },
          description: message,
          color: 0x00ff00,
          timestamp: new Date(),
          footer: {
            text: 'From Minecraft',
          },
        },
      ],
    });

    // Also broadcast to other connected Minecraft players
    const minecraftMessage = {
      type: 'minecraft_message',
      author: playerName,
      content: message,
      timestamp: new Date(),
    };
    broadcastToPlayers(minecraftMessage);

    console.log(`[MESSAGE] ${playerName}: ${message}`);
    res.status(200).json({ 
      success: true, 
      messageId: discordMessage.id,
      message: 'Message sent to Discord and other players' 
    });
  } catch (error) {
    console.error('[MESSAGE] Error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * GET /api/status
 * Get server status and connected players count
 */
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    connectedPlayers: connectedPlayers.size,
    botStatus: client.user ? client.user.tag : 'not connected',
    timestamp: new Date(),
  });
});

/**
 * GET /api/players
 * Get list of connected players (debug endpoint)
 */
app.get('/api/players', (req, res) => {
  const players = Array.from(connectedPlayers.values()).map(player => ({
    uuid: player.uuid,
    playerName: player.playerName,
    connectedAt: player.connectedAt,
  }));

  res.status(200).json({
    success: true,
    count: players.length,
    players,
  });
});

// ==================== ERROR HANDLERS ====================

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================

server.listen(PORT, () => {
  console.log(`🚀 ChatSyncro backend running on port ${PORT}`);
  console.log(`📍 HTTP endpoint: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`📋 Connected players: /api/players`);
  console.log(`✨ Status: /api/status`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  client.destroy();
  server.close();
  process.exit(0);
});
