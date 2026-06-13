# DCC Addon - Discord Chat Command for Meteor Client

A Meteor Client addon that adds a `.dcc` command to toggle between Minecraft chat and Discord chat, allowing all players with the mod to communicate seamlessly across both platforms.

## Features

- **`.dcc`** - Toggle between Minecraft and Discord chat modes
- **`.dcc status`** - Check current chat mode
- **`.dcc <message>`** - Send a message to Discord chat
- **Cross-platform communication** - All mod users can see and respond to messages
- **Player tracking** - Uses UUID to manage player connections

## Installation

1. Ensure you have **Meteor Client 0.5.9+** installed
2. Download the compiled JAR from releases
3. Place it in your `.minecraft/addons/` folder
4. Restart Minecraft
5. The addon will be loaded automatically

## Building from Source

### Prerequisites
- Java 17 or newer
- Gradle
- Minecraft 1.20.1

### Build Steps

```bash
git clone https://github.com/galaxios2cool/dcc-addon.git
cd dcc-addon
./gradlew build
```

The compiled addon will be in `build/libs/`

## Architecture

### Client-Side (Minecraft)
- **DCCAddon.java** - Main addon entry point
- **DCCCommand.java** - Command handler for `.dcc` commands
- **ChatManager.java** - Manages chat mode toggling and message routing
- **DiscordNetworkClient.java** - Handles HTTP communication with backend

### Backend Requirements

This addon communicates with a backend server (default: `http://localhost:8080`) via HTTP POST requests:

- `POST /api/connect` - Register player connection
- `POST /api/disconnect` - Unregister player
- `POST /api/message` - Send a message to Discord

**Backend Payload Format:**
```json
{
  "uuid": "player-uuid",
  "playerName": "PlayerName",
  "message": "Message content"
}
```

## Configuration

Edit `src/main/java/com/example/dcc/manager/ChatManager.java` to change the backend server URL:

```java
this.networkClient = new DiscordNetworkClient("http://your-backend-url:8080");
```

## Command Usage

```
.dcc                    // Toggle Discord chat mode
.dcc status             // Show current mode
.dcc Hello from Minecraft!  // Send message (if in Discord mode)
```

## License

MIT

## Contributing

Feel free to submit issues and pull requests!
