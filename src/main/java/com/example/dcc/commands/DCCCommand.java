package com.example.dcc.commands;

import meteordevelopment.meteorclient.commands.Command;
import meteordevelopment.meteorclient.systems.chat.Chat;
import com.example.dcc.manager.ChatManager;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;

public class DCCCommand extends Command {
    private static ChatManager chatManager;

    public DCCCommand() {
        super("dcc", "Toggle between Minecraft chat and Discord chat");
        chatManager = new ChatManager();
    }

    @Override
    public void run(String[] args) {
        if (args.length == 0) {
            toggleChat();
        } else if (args[0].equalsIgnoreCase("status")) {
            showStatus();
        } else {
            sendMessage(String.join(" ", args));
        }
    }

    private void toggleChat() {
        boolean isEnabled = chatManager.toggleDiscordMode();
        String status = isEnabled ? "enabled" : "disabled";
        String color = isEnabled ? Formatting.GREEN : Formatting.RED;
        
        Chat.info(Text.literal(color + "Discord chat mode " + status));
    }

    private void showStatus() {
        boolean isDiscordMode = chatManager.isDiscordMode();
        String status = isDiscordMode ? "Discord Mode" : "Minecraft Mode";
        Chat.info(Text.literal(Formatting.GOLD + "Current mode: " + status));
    }

    private void sendMessage(String message) {
        boolean sent = chatManager.sendMessage(message);
        
        if (sent) {
            Chat.info(Text.literal(Formatting.GREEN + "Message sent!"));
        } else {
            Chat.info(Text.literal(Formatting.RED + "Failed to send message. Are you in Discord mode?"));
        }
    }
}
