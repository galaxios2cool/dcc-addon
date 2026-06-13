package com.example.dcc.network;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class DiscordNetworkClient {
    private String backendUrl;
    private Gson gson = new Gson();

    public DiscordNetworkClient(String backendUrl) {
        this.backendUrl = backendUrl;
    }

    public void connect(String playerUUID) {
        try {
            URL url = new URL(backendUrl + "/api/connect");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            JsonObject payload = new JsonObject();
            payload.addProperty("uuid", playerUUID);

            try (OutputStream os = connection.getOutputStream()) {
                os.write(gson.toJson(payload).getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int responseCode = connection.getResponseCode();
            System.out.println("[DCC] Connect response: " + responseCode);
            connection.disconnect();
        } catch (Exception e) {
            System.err.println("[DCC] Error connecting: " + e.getMessage());
        }
    }

    public void disconnect(String playerUUID) {
        try {
            URL url = new URL(backendUrl + "/api/disconnect");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            JsonObject payload = new JsonObject();
            payload.addProperty("uuid", playerUUID);

            try (OutputStream os = connection.getOutputStream()) {
                os.write(gson.toJson(payload).getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int responseCode = connection.getResponseCode();
            System.out.println("[DCC] Disconnect response: " + responseCode);
            connection.disconnect();
        } catch (Exception e) {
            System.err.println("[DCC] Error disconnecting: " + e.getMessage());
        }
    }

    public boolean sendMessage(String playerUUID, String playerName, String message) {
        try {
            URL url = new URL(backendUrl + "/api/message");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            JsonObject payload = new JsonObject();
            payload.addProperty("uuid", playerUUID);
            payload.addProperty("playerName", playerName);
            payload.addProperty("message", message);

            try (OutputStream os = connection.getOutputStream()) {
                os.write(gson.toJson(payload).getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int responseCode = connection.getResponseCode();
            boolean success = responseCode == 200;
            connection.disconnect();
            return success;
        } catch (Exception e) {
            System.err.println("[DCC] Error sending message: " + e.getMessage());
            return false;
        }
    }
}
