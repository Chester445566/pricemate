package com.pricemate.accessibilityagent;

import android.content.Context;
import android.content.SharedPreferences;

public final class AgentStateStore {
    private static final String PREFS = "agent_state";
    private static final String KEY_LAST_RESULT = "last_result";

    private AgentStateStore() {}

    public static void writeResult(Context context, String message) {
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        preferences.edit().putString(KEY_LAST_RESULT, message).apply();
    }

    public static String readResult(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return preferences.getString(KEY_LAST_RESULT, "No commands have been run yet.");
    }
}
