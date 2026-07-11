package com.pricemate.accessibilityagent

import android.content.Intent

object AgentCommand {
    const val ACTION_AGENT_COMMAND = "com.pricemate.accessibilityagent.AGENT_COMMAND"
    const val ACTION_AGENT_RESULT = "com.pricemate.accessibilityagent.AGENT_RESULT"

    const val EXTRA_TYPE = "type"
    const val EXTRA_ARGUMENT = "argument"
    const val EXTRA_MESSAGE = "message"
    const val EXTRA_ENABLED = "enabled"

    const val TYPE_STATUS = "status"
    const val TYPE_READ_SCREEN = "read_screen"
    const val TYPE_TAP_TEXT = "tap_text"
    const val TYPE_TYPE_TEXT = "type_text"
    const val TYPE_SCROLL_FORWARD = "scroll_forward"
    const val TYPE_SCROLL_BACKWARD = "scroll_backward"
    const val TYPE_GLOBAL_BACK = "global_back"
    const val TYPE_GLOBAL_HOME = "global_home"
    const val TYPE_GLOBAL_RECENTS = "global_recents"
    const val TYPE_OPEN_APP = "open_app"

    fun intent(type: String, argument: String? = null): Intent =
        Intent(ACTION_AGENT_COMMAND).apply {
            `package` = BuildConfig.APPLICATION_ID
            putExtra(EXTRA_TYPE, type)
            if (!argument.isNullOrBlank()) {
                putExtra(EXTRA_ARGUMENT, argument)
            }
        }
}
