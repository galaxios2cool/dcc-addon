require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const PORT = process.env.PORT || 3000;

// Track connected players
const connectedPlayers = new Map();

// Discord bot ready event
client.on('ready', () => {
  console.log(`✅ Discord bot logged in as ${client.user.tag}`);
});

// Login to Discord
client.login(DISCORD_TOKEN);

// ==================== API ENDPOINTS ====================

/**
 * POST /api/connect
 * Register a player connection
 */
app.post('/api/connect', (req, res) => {
  try {
    const { uuid } = req.body;

    if (!uuid) {
      return res.status(400).json({ error: 'UUID is required' });
    }

    // Track the player
    connectedPlayers.set(uuid, {
      uuid,
      connectedAt: new Date(),
    });

    console.log(`[CONNECT] Player connected: ${uuid}`);
    res.status(200).json({ success: true, message: 'Connected to Discord chat' });
  } catch (error) {
    console.error('[CONNECT] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/disconnect
 * Unregister a player connection
 */
app.post('/api/disconnect', (req, res) => {
  try {
    const { uuid } = req.body;

    if (!uuid) {
      return res.status(400).json({ error: 'UUID is required' });
    }

    // Remove the player from tracking
    connectedPlayers.delete(uuid);

    console.log(`[DISCONNECT] Player disconnected: ${uuid}`);
    res.status(200).json({ success: true, message: 'Disconnected from Discord chat' });
  } catch (error) {
    console.error('[DISCONNECT] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/message
 * Relay a message from Minecraft to Discord
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

    console.log(`[MESSAGE] ${playerName}: ${message}`);
    res.status(200).json({ 
      success: true, 
      messageId: discordMessage.id,
      message: 'Message sent to Discord' 
    });
  } catch (error) {
    console.error('[MESSAGE] Error:', error);
    res.status(500).json({ error: 'Failed to send message to Discord' });
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

app.listen(PORT, () => {
  console.log(`🚀 ChatSyncro backend running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}`);
  console.log(`📋 Connected players: /api/players`);
  console.log(`✨ Status: /api/status`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  client.destroy();
  process.exit(0);
});
