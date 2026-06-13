package com.example.dcc.network;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.example.dcc.manager.ChatManager;
import net.minecraft.client.MinecraftClient;

import javax.net.ssl.SSLContext;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletionStage;

public class WebSocketClient {
    private String wsUrl;
    private String playerUUID;
    private String playerName;
    private WebSocket webSocket;
    private HttpClient httpClient;

    public WebSocketClient(String wsUrl, String playerUUID, String playerName) {
        this.wsUrl = wsUrl;
        this.playerUUID = playerUUID;
        this.playerName = playerName;
        
        try {
            this.httpClient = HttpClient.newBuilder()
                    .sslContext(SSLContext.getDefault())
                    .build();
        } catch (Exception e) {
            System.err.println("[WS] Error creating HTTP client: " + e.getMessage());
        }
    }

    public void connect() {
        try {
            WebSocket.Listener listener = new WebSocket.Listener() {
                @Override
                public CompletionStage<?> onText(WebSocket webSocket, CharSequence message, boolean last) {
                    String msg = message.toString();
                    System.out.println("[WS] Received: " + msg);
                    
                    try {
                        JsonObject json = JsonParser.parseString(msg).getAsJsonObject();
                        String type = json.has("type") ? json.get("type").getAsString() : "";

                        if ("connected".equals(type)) {
                            System.out.println("[WS] Successfully connected to WebSocket");
                        } else if ("discord_message".equals(type)) {
                            // Message from Discord
                            String author = json.get("author").getAsString();
                            String content = json.get("content").getAsString();
                            ChatManager.receiveDiscordMessage(author, content);
                        } else if ("minecraft_message".equals(type)) {
                            // Message from another player
                            String author = json.get("author").getAsString();
                            String content = json.get("content").getAsString();
                            ChatManager.receiveMinecraftMessage(author, content);
                        }
                    } catch (Exception e) {
                        System.err.println("[WS] Error processing message: " + e.getMessage());
                    }

                    return null;
                }

                @Override
                public void onError(WebSocket webSocket, Throwable error) {
                    System.err.println("[WS] WebSocket error: " + error.getMessage());
                }

                @Override
                public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
                    System.out.println("[WS] WebSocket closed: " + reason);
                    return null;
                }
            };

            webSocket = httpClient.newWebSocketBuilder()
                    .buildAsync(URI.create(wsUrl), listener)
                    .join();

            // Send connect message
            JsonObject connectMsg = new JsonObject();
            connectMsg.addProperty("type", "connect");
            connectMsg.addProperty("uuid", playerUUID);
            connectMsg.addProperty("playerName", playerName);

            webSocket.sendText(connectMsg.toString(), true);
            System.out.println("[WS] Connected to " + wsUrl);

        } catch (Exception e) {
            System.err.println("[WS] Error connecting: " + e.getMessage());
        }
    }

    public void disconnect() {
        try {
            if (webSocket != null) {
                webSocket.sendClose(1000, "Disconnect");
            }
        } catch (Exception e) {
            System.err.println("[WS] Error disconnecting: " + e.getMessage());
        }
    }
}
