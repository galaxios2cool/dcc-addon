package com.example.dcc.manager;

import com.example.dcc.network.DiscordNetworkClient;
import net.minecraft.client.MinecraftClient;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;

public class ChatManager {
    private static boolean discordModeEnabled = false;
    private static DiscordNetworkClient networkClient;
    private static String playerUUID;

    public ChatManager() {
        if (networkClient == null) {
            networkClient = new DiscordNetworkClient("https://galaxiostwocool.com/chatsyncro");
        }
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player != null) {
            playerUUID = client.player.getUuidAsString();
        }
    }

    public boolean toggleDiscordMode() {
        discordModeEnabled = !discordModeEnabled;
        
        if (discordModeEnabled) {
            // Connect to backend when enabling
            if (networkClient == null) {
                networkClient = new DiscordNetworkClient("https://galaxiostwocool.com/chatsyncro");
            }
            networkClient.connect(playerUUID);
        } else {
            // Disconnect from backend when disabling
            if (networkClient != null) {
                networkClient.disconnect(playerUUID);
            }
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

        // Send to backend which will relay to Discord and other players
        return networkClient.sendMessage(playerUUID, playerName, message);
    }

    public static void receiveDiscordMessage(String playerName, String message) {
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

    public static void receiveMinecraftMessage(String playerName, String message) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player != null) {
            Text chatMessage = Text.literal(
                Formatting.AQUA + "[Minecraft] " + 
                Formatting.GOLD + playerName + 
                Formatting.RESET + ": " + message
            );
            client.player.sendMessage(chatMessage, false);
        }
    }
}
