# ChatSyncro Backend Server

Node.js backend server for the DCC Addon - Discord Chat Command integration for Meteor Client.

## Setup

### 1. Prerequisites
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Discord Bot Token** (create at [Discord Developer Portal](https://discord.com/developers/applications))
- **Discord Channel ID** (where messages will be sent)

### 2. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name (e.g., "ChatSyncro")
3. Go to **"Bot"** section → Click **"Add Bot"**
4. Under **TOKEN**, click **"Copy"** to copy your bot token
5. Go to **"OAuth2" → "URL Generator"**
6. Select scopes: `bot`
7. Select permissions: `Send Messages`, `Read Messages/View Channels`, `Embed Links`
8. Copy the generated URL and open it in your browser to invite the bot to your server

### 3. Get Channel ID

1. In Discord, enable **Developer Mode**: User Settings → App Settings → Advanced → Developer Mode
2. Right-click on the channel where messages should appear
3. Select **"Copy Channel ID"**

### 4. Install Dependencies

```bash
npm install
```

### 5. Configure Environment

Create a `.env` file in the root directory:

```env
DISCORD_TOKEN=your_bot_token_here
CHANNEL_ID=your_channel_id_here
PORT=3000
NODE_ENV=production
```

**⚠️ IMPORTANT**: Never commit `.env` to Git. It's already in `.gitignore`.

### 6. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

You should see:
```
✅ Discord bot logged in as YourBot#1234
🚀 ChatSyncro backend running on port 3000
```

## API Endpoints

### POST `/api/connect`
Register a player connection

**Request:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connected to Discord chat"
}
```

---

### POST `/api/disconnect`
Unregister a player connection

**Request:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Disconnected from Discord chat"
}
```

---

### POST `/api/message`
Relay a message from Minecraft to Discord

**Request:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "playerName": "Steve",
  "message": "Hello from Minecraft!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "1234567890",
  "message": "Message sent to Discord"
}
```

---

### GET `/api/status`
Get server status and connected players count

**Response:**
```json
{
  "success": true,
  "status": "online",
  "connectedPlayers": 5,
  "botStatus": "YourBot#1234",
  "timestamp": "2024-06-13T15:45:00.000Z"
}
```

---

### GET `/api/players`
Get list of connected players (debug)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "players": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "connectedAt": "2024-06-13T15:40:00.000Z"
    }
  ]
}
```

## Deployment

### Option 1: Heroku

```bash
# Install Heroku CLI
# Login: heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set DISCORD_TOKEN=your_token
heroku config:set CHANNEL_ID=your_channel_id

# Deploy
git push heroku main
```

### Option 2: Self-hosted with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "chatsyncro"

# Save PM2 config
pm2 save

# Enable startup on reboot
pm2 startup
```

### Option 3: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t chatsyncro .
docker run -e DISCORD_TOKEN=token -e CHANNEL_ID=id -p 3000:3000 chatsyncro
```

## Troubleshooting

### Bot not connecting to Discord
- Check if `DISCORD_TOKEN` is correct
- Ensure bot has required permissions in the server
- Check Discord's status page for outages

### Messages not appearing in Discord
- Verify `CHANNEL_ID` is correct
- Ensure bot has "Send Messages" permission in the channel
- Check server logs for errors

### CORS errors
- The backend has CORS enabled for all origins
- If needed, restrict origins in `server.js`

## License

MIT
