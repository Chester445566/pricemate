package com.pricemate.accessibilityagent;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private TextView statusText;
    private TextView resultText;
    private EditText targetTextInput;
    private EditText inputTextField;
    private EditText packageNameInput;

    private final BroadcastReceiver resultReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent == null || !AgentCommand.ACTION_AGENT_RESULT.equals(intent.getAction())) {
                return;
            }
            refreshStatus();
            String message = intent.getStringExtra(AgentCommand.EXTRA_MESSAGE);
            resultText.setText(message != null ? message : AgentStateStore.readResult(MainActivity.this));
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        statusText = findViewById(R.id.statusText);
        resultText = findViewById(R.id.resultText);
        targetTextInput = findViewById(R.id.targetTextInput);
        inputTextField = findViewById(R.id.inputTextField);
        packageNameInput = findViewById(R.id.packageNameInput);

        bindClick(R.id.openSettingsButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
            }
        });
        bindClick(R.id.refreshStatusButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                refreshStatus();
            }
        });
        bindClick(R.id.readScreenButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendCommand(AgentCommand.TYPE_READ_SCREEN, null);
            }
        });
        bindClick(R.id.tapTextButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendCommand(AgentCommand.TYPE_TAP_TEXT, targetTextInput.getText().toString());
            }
        });
        bindClick(R.id.typeTextButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendCommand(AgentCommand.TYPE_TYPE_TEXT, inputTextField.getText().toString());
            }
        });
        bindClick(R.id.scrollForwardButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendCommand(AgentCommand.TYPE_SCROLL_FORWARD, null);
            }
        });
        bindClick(R.id.scrollBackwardButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendCommand(AgentCommand.TYPE_SCROLL_BACKWARD, null);
            }
        });
        bindClick(R.id.backButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendCommand(AgentCommand.TYPE_GLOBAL_BACK, null);
            }
        });
        bindClick(R.id.homeButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendCommand(AgentCommand.TYPE_GLOBAL_HOME, null);
            }
        });
        bindClick(R.id.recentsButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendCommand(AgentCommand.TYPE_GLOBAL_RECENTS, null);
            }
        });
        bindClick(R.id.openAppButton, new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendCommand(AgentCommand.TYPE_OPEN_APP, packageNameInput.getText().toString());
            }
        });
    }

    @Override
    protected void onStart() {
        super.onStart();
        IntentFilter filter = new IntentFilter(AgentCommand.ACTION_AGENT_RESULT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(resultReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(resultReceiver, filter, AgentCommand.INTERNAL_BROADCAST_PERMISSION, null);
        }
        refreshStatus();
    }

    @Override
    protected void onStop() {
        try {
            unregisterReceiver(resultReceiver);
        } catch (IllegalArgumentException ignored) {
        }
        super.onStop();
    }

    private void bindClick(int viewId, View.OnClickListener listener) {
        Button button = findViewById(viewId);
        button.setOnClickListener(listener);
    }

    private void sendCommand(String type, String argument) {
        if (!isAccessibilityServiceEnabled()) {
            refreshStatus();
            Toast.makeText(this, "Enable the accessibility service first.", Toast.LENGTH_SHORT).show();
            return;
        }
        sendBroadcast(AgentCommand.intent(getPackageName(), type, argument), AgentCommand.INTERNAL_BROADCAST_PERMISSION);
        if (!AgentCommand.TYPE_READ_SCREEN.equals(type)) {
            resultText.setText("Command sent: " + type);
        }
    }

    private void refreshStatus() {
        statusText.setText(isAccessibilityServiceEnabled()
                ? getString(R.string.status_enabled)
                : getString(R.string.status_disabled));
        resultText.setText(AgentStateStore.readResult(this));
    }

    private boolean isAccessibilityServiceEnabled() {
        String expectedComponent = getPackageName() + "/" + AgentAccessibilityService.class.getName();
        String enabledServices = Settings.Secure.getString(getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (enabledServices == null || enabledServices.trim().isEmpty()) {
            return false;
        }
        TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
        splitter.setString(enabledServices);
        for (String service : splitter) {
            if (expectedComponent.equalsIgnoreCase(service)) {
                return true;
            }
        }
        return false;
    }
}
