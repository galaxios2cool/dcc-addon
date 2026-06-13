package com.example.dcc.manager;

import com.example.dcc.network.DiscordNetworkClient;
import net.minecraft.client.MinecraftClient;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;

public class ChatManager {
    private static boolean discordModeEnabled = false;
    private DiscordNetworkClient networkClient;
    private String playerUUID;

    public ChatManager() {
        this.networkClient = new DiscordNetworkClient("https://galaxiostwocool.com/chatsyncro");
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player != null) {
            this.playerUUID = client.player.getUuidAsString();
        }
    }

    public boolean toggleDiscordMode() {
        discordModeEnabled = !discordModeEnabled;
        
        if (discordModeEnabled) {
            // Connect to backend when enabling
            networkClient.connect(playerUUID);
        } else {
            // Disconnect from backend when disabling
            networkClient.disconnect(playerUUID);
        }
        
        return discordModeEnabled;
    }

    public boolean isDiscordMode() {
        return discordModeEnabled;
    }

    public boolean sendMessage(String message) {
        if (!discordModeEnabled) {
            return false;
        }

        MinecraftClient client = MinecraftClient.getInstance();
        String playerName = client.player != null ? client.player.getName().getString() : "Unknown";

        // Send to backend which will relay to Discord
        return networkClient.sendMessage(playerUUID, playerName, message);
    }

    public void receiveDiscordMessage(String playerName, String message) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player != null) {
            Text chatMessage = Text.literal(
                Formatting.BLUE + "[Discord] " + 
                Formatting.GOLD + playerName + 
                Formatting.RESET + ": " + message
            );
            client.player.sendMessage(chatMessage, false);
        }
    }
}
