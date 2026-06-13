package com.example.dcc;

import meteordevelopment.meteorclient.addons.MeteorAddon;
import meteordevelopment.meteorclient.systems.commands.CommandSystem;
import com.example.dcc.commands.DCCCommand;

public class DCCAddon extends MeteorAddon {

    @Override
    public void onInitialize() {
        CommandSystem.get().register(new DCCCommand());
    }

    @Override
    public String getPackage() {
        return "com.example.dcc";
    }

    @Override
    public String getDetails() {
        return "Discord Chat Chat integration addon for Meteor Client";
    }

    @Override
    public String getDisplayName() {
        return "DCC - Discord Chat Command";
    }
}
