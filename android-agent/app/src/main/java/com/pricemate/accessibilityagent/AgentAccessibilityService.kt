package com.pricemate.accessibilityagent

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.content.ContextCompat

class AgentAccessibilityService : AccessibilityService() {

    private val commandReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action != AgentCommand.ACTION_AGENT_COMMAND) return
            val type = intent.getStringExtra(AgentCommand.EXTRA_TYPE) ?: return
            val argument = intent.getStringExtra(AgentCommand.EXTRA_ARGUMENT)
            publishResult(handleCommand(type, argument))
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        serviceInfo = serviceInfo.apply {
            flags = flags or AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
        }
        ContextCompat.registerReceiver(
            this,
            commandReceiver,
            IntentFilter(AgentCommand.ACTION_AGENT_COMMAND),
            ContextCompat.RECEIVER_NOT_EXPORTED
        )
        publishResult("Accessibility service connected and ready.")
    }

    override fun onDestroy() {
        runCatching { unregisterReceiver(commandReceiver) }
        super.onDestroy()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) = Unit

    override fun onInterrupt() {
        publishResult("Accessibility service interrupted.")
    }

    private fun handleCommand(type: String, argument: String?): String {
        return when (type) {
            AgentCommand.TYPE_STATUS -> "Accessibility service is enabled and listening."
            AgentCommand.TYPE_READ_SCREEN -> readScreen()
            AgentCommand.TYPE_TAP_TEXT -> tapVisibleText(argument)
            AgentCommand.TYPE_TYPE_TEXT -> typeIntoFocusedField(argument)
            AgentCommand.TYPE_SCROLL_FORWARD -> performScroll(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD, "forward")
            AgentCommand.TYPE_SCROLL_BACKWARD -> performScroll(AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD, "backward")
            AgentCommand.TYPE_GLOBAL_BACK -> performGlobal("Back", GLOBAL_ACTION_BACK)
            AgentCommand.TYPE_GLOBAL_HOME -> performGlobal("Home", GLOBAL_ACTION_HOME)
            AgentCommand.TYPE_GLOBAL_RECENTS -> performGlobal("Recents", GLOBAL_ACTION_RECENTS)
            AgentCommand.TYPE_OPEN_APP -> openApp(argument)
            else -> "Unknown command: $type"
        }
    }

    private fun readScreen(): String {
        val root = rootInActiveWindow ?: return "No active window is available yet. Open another app and try again."
        val lines = mutableListOf<String>()
        collectNodeSummary(root, lines, 0)
        if (lines.isEmpty()) {
            return "The active window was found, but no readable nodes were collected."
        }
        return buildString {
            appendLine("Package: ${root.packageName ?: "unknown"}")
            appendLine("Class: ${root.className ?: "unknown"}")
            appendLine()
            lines.take(120).forEach { appendLine(it) }
        }.trim()
    }

    private fun collectNodeSummary(node: AccessibilityNodeInfo, lines: MutableList<String>, depth: Int) {
        val label = listOfNotNull(
            node.text?.toString()?.takeIf { it.isNotBlank() },
            node.contentDescription?.toString()?.takeIf { it.isNotBlank() },
            node.viewIdResourceName?.substringAfterLast('/')?.takeIf { it.isNotBlank() }
        ).firstOrNull()

        if (label != null) {
            val state = buildList {
                if (node.isClickable) add("clickable")
                if (node.isEditable) add("editable")
                if (node.isScrollable) add("scrollable")
                if (!node.isVisibleToUser) add("hidden")
            }.joinToString()
            val suffix = if (state.isBlank()) "" else " [$state]"
            lines += "${"  ".repeat(depth)}- ${node.className ?: "Node"}: $label$suffix"
        }

        for (index in 0 until node.childCount) {
            node.getChild(index)?.let { child ->
                collectNodeSummary(child, lines, depth + 1)
                child.recycle()
            }
        }
    }

    private fun tapVisibleText(argument: String?): String {
        val query = argument?.trim().orEmpty()
        if (query.isBlank()) return "Enter visible text before tapping."
        val root = rootInActiveWindow ?: return "No active window is available."
        val target = findNodeByText(root, query)
            ?: return "Could not find visible text matching \"$query\"."
        val clickable = findClickableAncestor(target)
        val success = clickable?.performAction(AccessibilityNodeInfo.ACTION_CLICK) == true
        target.recycle()
        return if (success) {
            "Tapped the first visible node matching \"$query\"."
        } else {
            "Found \"$query\" but could not click it."
        }
    }

    private fun typeIntoFocusedField(argument: String?): String {
        val text = argument.orEmpty()
        if (text.isBlank()) return "Enter text before using the type command."
        val root = rootInActiveWindow ?: return "No active window is available."
        val focused = findFocusedEditable(root)
            ?: return "No focused editable field was found. Tap into a text field first."

        val args = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        }
        val success = focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
        focused.recycle()
        return if (success) {
            "Typed text into the focused field."
        } else {
            "The focused field rejected the text input request."
        }
    }

    private fun performScroll(action: Int, direction: String): String {
        val root = rootInActiveWindow ?: return "No active window is available."
        val node = findScrollableNode(root)
            ?: return "No scrollable container was found on the current screen."
        val success = node.performAction(action)
        node.recycle()
        return if (success) {
            "Requested scroll $direction."
        } else {
            "Found a scrollable container, but the scroll $direction action failed."
        }
    }

    private fun performGlobal(label: String, action: Int): String {
        return if (performGlobalAction(action)) {
            "$label action sent."
        } else {
            "$label action is not available right now."
        }
    }

    private fun openApp(argument: String?): String {
        val packageName = argument?.trim().orEmpty()
        if (packageName.isBlank()) return "Enter an app package name before trying to open it."
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            ?: return "Could not find a launchable app for package \"$packageName\"."
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(launchIntent)
        return "Opened $packageName."
    }

    private fun findNodeByText(root: AccessibilityNodeInfo, query: String): AccessibilityNodeInfo? {
        val lowerQuery = query.lowercase()
        return depthFirstSearch(root) { node ->
            val candidates = listOf(
                node.text?.toString(),
                node.contentDescription?.toString(),
                node.viewIdResourceName?.substringAfterLast('/')
            )
            candidates.any { candidate -> candidate?.lowercase()?.contains(lowerQuery) == true }
        }
    }

    private fun findFocusedEditable(root: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        return depthFirstSearch(root) { node -> node.isEditable && (node.isFocused || node.isAccessibilityFocused) }
            ?: depthFirstSearch(root) { node -> node.isEditable }
    }

    private fun findScrollableNode(root: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        return depthFirstSearch(root) { node -> node.isScrollable }
    }

    private fun findClickableAncestor(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        var current = node
        while (current != null) {
            if (current.isClickable) return current
            current = current.parent
        }
        return null
    }

    private fun depthFirstSearch(root: AccessibilityNodeInfo, predicate: (AccessibilityNodeInfo) -> Boolean): AccessibilityNodeInfo? {
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(root)
        while (queue.isNotEmpty()) {
            val node = queue.removeFirst()
            if (predicate(node)) {
                return AccessibilityNodeInfo.obtain(node)
            }
            for (index in 0 until node.childCount) {
                node.getChild(index)?.let(queue::addLast)
            }
        }
        return null
    }

    private fun publishResult(message: String) {
        AgentStateStore.writeResult(this, message)
        sendBroadcast(Intent(AgentCommand.ACTION_AGENT_RESULT).apply {
            `package` = BuildConfig.APPLICATION_ID
            putExtra(AgentCommand.EXTRA_MESSAGE, message)
            putExtra(AgentCommand.EXTRA_ENABLED, true)
        })
    }
}
