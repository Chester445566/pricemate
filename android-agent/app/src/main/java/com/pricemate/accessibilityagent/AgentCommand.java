package com.pricemate.accessibilityagent;

import android.content.Intent;

public final class AgentCommand {
    public static final String INTERNAL_BROADCAST_PERMISSION = "com.pricemate.accessibilityagent.INTERNAL_BROADCAST";
    public static final String ACTION_AGENT_COMMAND = "com.pricemate.accessibilityagent.AGENT_COMMAND";
    public static final String ACTION_AGENT_RESULT = "com.pricemate.accessibilityagent.AGENT_RESULT";

    public static final String EXTRA_TYPE = "type";
    public static final String EXTRA_ARGUMENT = "argument";
    public static final String EXTRA_MESSAGE = "message";

    public static final String TYPE_STATUS = "status";
    public static final String TYPE_READ_SCREEN = "read_screen";
    public static final String TYPE_TAP_TEXT = "tap_text";
    public static final String TYPE_TYPE_TEXT = "type_text";
    public static final String TYPE_SCROLL_FORWARD = "scroll_forward";
    public static final String TYPE_SCROLL_BACKWARD = "scroll_backward";
    public static final String TYPE_GLOBAL_BACK = "global_back";
    public static final String TYPE_GLOBAL_HOME = "global_home";
    public static final String TYPE_GLOBAL_RECENTS = "global_recents";
    public static final String TYPE_OPEN_APP = "open_app";

    private AgentCommand() {}

    public static Intent intent(String packageName, String type, String argument) {
        Intent intent = new Intent(ACTION_AGENT_COMMAND);
        intent.setPackage(packageName);
        intent.putExtra(EXTRA_TYPE, type);
        if (argument != null && !argument.trim().isEmpty()) {
            intent.putExtra(EXTRA_ARGUMENT, argument);
        }
        return intent;
    }
}
