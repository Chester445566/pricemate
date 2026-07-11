package com.pricemate.accessibilityagent;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class AgentAccessibilityService extends AccessibilityService {
    private final BroadcastReceiver commandReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent == null || !AgentCommand.ACTION_AGENT_COMMAND.equals(intent.getAction())) {
                return;
            }
            String type = intent.getStringExtra(AgentCommand.EXTRA_TYPE);
            if (type == null) {
                return;
            }
            String argument = intent.getStringExtra(AgentCommand.EXTRA_ARGUMENT);
            publishResult(handleCommand(type, argument));
        }
    };

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        AccessibilityServiceInfo info = getServiceInfo();
        if (info != null) {
            info.flags |= AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
                    | AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
                    | AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS;
            setServiceInfo(info);
        }

        IntentFilter filter = new IntentFilter(AgentCommand.ACTION_AGENT_COMMAND);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(commandReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(commandReceiver, filter, AgentCommand.INTERNAL_BROADCAST_PERMISSION, null);
        }
        publishResult("Accessibility service connected and ready.");
    }

    @Override
    public void onDestroy() {
        try {
            unregisterReceiver(commandReceiver);
        } catch (IllegalArgumentException ignored) {
        }
        super.onDestroy();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
    }

    @Override
    public void onInterrupt() {
        publishResult("Accessibility service interrupted.");
    }

    private String handleCommand(String type, String argument) {
        switch (type) {
            case AgentCommand.TYPE_STATUS:
                return "Accessibility service is enabled and listening.";
            case AgentCommand.TYPE_READ_SCREEN:
                return readScreen();
            case AgentCommand.TYPE_TAP_TEXT:
                return tapVisibleText(argument);
            case AgentCommand.TYPE_TYPE_TEXT:
                return typeIntoFocusedField(argument);
            case AgentCommand.TYPE_SCROLL_FORWARD:
                return performScroll(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD, "forward");
            case AgentCommand.TYPE_SCROLL_BACKWARD:
                return performScroll(AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD, "backward");
            case AgentCommand.TYPE_GLOBAL_BACK:
                return performGlobal("Back", GLOBAL_ACTION_BACK);
            case AgentCommand.TYPE_GLOBAL_HOME:
                return performGlobal("Home", GLOBAL_ACTION_HOME);
            case AgentCommand.TYPE_GLOBAL_RECENTS:
                return performGlobal("Recents", GLOBAL_ACTION_RECENTS);
            case AgentCommand.TYPE_OPEN_APP:
                return openApp(argument);
            default:
                return "Unknown command: " + type;
        }
    }

    private String readScreen() {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) {
            return "No active window is available yet. Open another app and try again.";
        }
        List<String> lines = new ArrayList<>();
        collectNodeSummary(root, lines, 0);
        StringBuilder builder = new StringBuilder();
        builder.append("Package: ")
                .append(root.getPackageName() != null ? root.getPackageName() : "unknown")
                .append('\n')
                .append("Class: ")
                .append(root.getClassName() != null ? root.getClassName() : "unknown")
                .append("\n\n");

        int limit = Math.min(lines.size(), 120);
        for (int i = 0; i < limit; i++) {
            builder.append(lines.get(i)).append('\n');
        }
        root.recycle();
        return builder.toString().trim();
    }

    private void collectNodeSummary(AccessibilityNodeInfo node, List<String> lines, int depth) {
        String label = firstNonBlank(
                safeText(node.getText()),
                safeText(node.getContentDescription()),
                lastSegment(node.getViewIdResourceName())
        );
        if (label != null) {
            StringBuilder state = new StringBuilder();
            if (node.isClickable()) state.append("clickable,");
            if (node.isEditable()) state.append("editable,");
            if (node.isScrollable()) state.append("scrollable,");
            if (!node.isVisibleToUser()) state.append("hidden,");
            String flags = state.length() > 0
                    ? " [" + state.substring(0, state.length() - 1) + "]"
                    : "";
            lines.add(indent(depth) + "- " + safeText(node.getClassName()) + ": " + label + flags);
        }
        for (int index = 0; index < node.getChildCount(); index++) {
            AccessibilityNodeInfo child = node.getChild(index);
            if (child != null) {
                collectNodeSummary(child, lines, depth + 1);
                child.recycle();
            }
        }
    }

    private String tapVisibleText(String argument) {
        String query = argument == null ? "" : argument.trim();
        if (query.isEmpty()) {
            return "Enter visible text before tapping.";
        }
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) {
            return "No active window is available.";
        }
        AccessibilityNodeInfo target = findNodeByText(root, query);
        root.recycle();
        if (target == null) {
            return "Could not find visible text matching \"" + query + "\".";
        }
        AccessibilityNodeInfo clickable = findClickableAncestor(target);
        boolean success = clickable != null && clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        recycleNode(clickable);
        recycleNode(target);
        if (success) {
            return "Tapped the first visible node matching \"" + query + "\".";
        }
        return "Found \"" + query + "\" but could not click it.";
    }

    private String typeIntoFocusedField(String argument) {
        String text = argument == null ? "" : argument;
        if (text.trim().isEmpty()) {
            return "Enter text before using the type command.";
        }
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) {
            return "No active window is available.";
        }
        AccessibilityNodeInfo focused = findFocusedEditable(root);
        root.recycle();
        if (focused == null) {
            return "No focused editable field was found. Tap into a text field first.";
        }
        Bundle args = new Bundle();
        args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
        boolean success = focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
        focused.recycle();
        if (success) {
            return "Typed text into the focused field.";
        }
        return "The focused field rejected the text input request.";
    }

    private String performScroll(int action, String direction) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) {
            return "No active window is available.";
        }
        AccessibilityNodeInfo scrollable = findScrollableNode(root);
        root.recycle();
        if (scrollable == null) {
            return "No scrollable container was found on the current screen.";
        }
        boolean success = scrollable.performAction(action);
        scrollable.recycle();
        if (success) {
            return "Requested scroll " + direction + ".";
        }
        return "Found a scrollable container, but the scroll " + direction + " action failed.";
    }

    private String performGlobal(String label, int action) {
        if (performGlobalAction(action)) {
            return label + " action sent.";
        }
        return label + " action is not available right now.";
    }

    private String openApp(String argument) {
        String packageName = argument == null ? "" : argument.trim();
        if (packageName.isEmpty()) {
            return "Enter an app package name before trying to open it.";
        }
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(packageName);
        if (launchIntent == null) {
            return "Could not find a launchable app for package \"" + packageName + "\".";
        }
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(launchIntent);
        return "Opened " + packageName + ".";
    }

    private AccessibilityNodeInfo findNodeByText(AccessibilityNodeInfo root, String query) {
        final String loweredQuery = query.toLowerCase(Locale.ROOT);
        return depthFirstSearch(root, new NodeMatcher() {
            @Override
            public boolean matches(AccessibilityNodeInfo node) {
                String[] candidates = new String[] {
                        safeText(node.getText()),
                        safeText(node.getContentDescription()),
                        lastSegment(node.getViewIdResourceName())
                };
                for (String candidate : candidates) {
                    if (candidate != null && candidate.toLowerCase(Locale.ROOT).contains(loweredQuery)) {
                        return true;
                    }
                }
                return false;
            }
        });
    }

    private AccessibilityNodeInfo findFocusedEditable(AccessibilityNodeInfo root) {
        AccessibilityNodeInfo focused = depthFirstSearch(root, new NodeMatcher() {
            @Override
            public boolean matches(AccessibilityNodeInfo node) {
                return node.isEditable() && (node.isFocused() || node.isAccessibilityFocused());
            }
        });
        if (focused != null) {
            return focused;
        }
        return depthFirstSearch(root, new NodeMatcher() {
            @Override
            public boolean matches(AccessibilityNodeInfo node) {
                return node.isEditable();
            }
        });
    }

    private AccessibilityNodeInfo findScrollableNode(AccessibilityNodeInfo root) {
        return depthFirstSearch(root, new NodeMatcher() {
            @Override
            public boolean matches(AccessibilityNodeInfo node) {
                return node.isScrollable();
            }
        });
    }

    private AccessibilityNodeInfo findClickableAncestor(AccessibilityNodeInfo node) {
        AccessibilityNodeInfo current = AccessibilityNodeInfo.obtain(node);
        while (current != null) {
            if (current.isClickable()) {
                AccessibilityNodeInfo clickable = AccessibilityNodeInfo.obtain(current);
                current.recycle();
                return clickable;
            }
            AccessibilityNodeInfo parent = current.getParent();
            current.recycle();
            current = parent;
        }
        return null;
    }

    private AccessibilityNodeInfo depthFirstSearch(AccessibilityNodeInfo root, NodeMatcher matcher) {
        ArrayDeque<AccessibilityNodeInfo> queue = new ArrayDeque<>();
        queue.add(AccessibilityNodeInfo.obtain(root));
        while (!queue.isEmpty()) {
            AccessibilityNodeInfo node = queue.removeFirst();
            if (matcher.matches(node)) {
                AccessibilityNodeInfo match = AccessibilityNodeInfo.obtain(node);
                recycleNode(node);
                while (!queue.isEmpty()) {
                    recycleNode(queue.removeFirst());
                }
                return match;
            }
            for (int index = 0; index < node.getChildCount(); index++) {
                AccessibilityNodeInfo child = node.getChild(index);
                if (child != null) {
                    queue.addLast(child);
                }
            }
            node.recycle();
        }
        return null;
    }

    private void publishResult(String message) {
        AgentStateStore.writeResult(this, message);
        Intent intent = new Intent(AgentCommand.ACTION_AGENT_RESULT);
        intent.setPackage(getPackageName());
        intent.putExtra(AgentCommand.EXTRA_MESSAGE, message);
        sendBroadcast(intent, AgentCommand.INTERNAL_BROADCAST_PERMISSION);
    }

    private interface NodeMatcher {
        boolean matches(AccessibilityNodeInfo node);
    }

    private static String safeText(CharSequence text) {
        if (text == null) {
            return null;
        }
        String value = text.toString().trim();
        return value.isEmpty() ? null : value;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                return value;
            }
        }
        return null;
    }

    private static String lastSegment(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        int slash = value.lastIndexOf('/');
        return slash >= 0 ? value.substring(slash + 1) : value;
    }

    private static String indent(int depth) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < depth; i++) {
            builder.append("  ");
        }
        return builder.toString();
    }

    private static void recycleNode(AccessibilityNodeInfo node) {
        if (node != null) {
            node.recycle();
        }
    }
}
