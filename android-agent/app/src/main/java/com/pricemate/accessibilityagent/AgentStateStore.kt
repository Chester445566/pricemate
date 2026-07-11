package com.pricemate.accessibilityagent

import android.content.Context

object AgentStateStore {
    private const val PREFS = "agent_state"
    private const val KEY_LAST_RESULT = "last_result"

    fun writeResult(context: Context, message: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_LAST_RESULT, message)
            .apply()
    }

    fun readResult(context: Context): String {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_LAST_RESULT, "No commands have been run yet.")
            ?: "No commands have been run yet."
    }
}
