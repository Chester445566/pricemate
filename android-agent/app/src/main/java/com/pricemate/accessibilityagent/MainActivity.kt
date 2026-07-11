package com.pricemate.accessibilityagent

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.text.TextUtils
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.pricemate.accessibilityagent.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private val resultReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action != AgentCommand.ACTION_AGENT_RESULT) return
            refreshStatus()
            binding.resultText.text = intent.getStringExtra(AgentCommand.EXTRA_MESSAGE)
                ?: AgentStateStore.readResult(this@MainActivity)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.openSettingsButton.setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }
        binding.refreshStatusButton.setOnClickListener { refreshStatus() }
        binding.readScreenButton.setOnClickListener { sendCommand(AgentCommand.TYPE_READ_SCREEN) }
        binding.tapTextButton.setOnClickListener {
            sendCommand(AgentCommand.TYPE_TAP_TEXT, binding.targetTextInput.text?.toString())
        }
        binding.typeTextButton.setOnClickListener {
            sendCommand(AgentCommand.TYPE_TYPE_TEXT, binding.inputTextField.text?.toString())
        }
        binding.scrollForwardButton.setOnClickListener { sendCommand(AgentCommand.TYPE_SCROLL_FORWARD) }
        binding.scrollBackwardButton.setOnClickListener { sendCommand(AgentCommand.TYPE_SCROLL_BACKWARD) }
        binding.backButton.setOnClickListener { sendCommand(AgentCommand.TYPE_GLOBAL_BACK) }
        binding.homeButton.setOnClickListener { sendCommand(AgentCommand.TYPE_GLOBAL_HOME) }
        binding.recentsButton.setOnClickListener { sendCommand(AgentCommand.TYPE_GLOBAL_RECENTS) }
        binding.openAppButton.setOnClickListener {
            sendCommand(AgentCommand.TYPE_OPEN_APP, binding.packageNameInput.text?.toString())
        }
    }

    override fun onStart() {
        super.onStart()
        ContextCompat.registerReceiver(
            this,
            resultReceiver,
            IntentFilter(AgentCommand.ACTION_AGENT_RESULT),
            ContextCompat.RECEIVER_NOT_EXPORTED
        )
        refreshStatus()
    }

    override fun onStop() {
        runCatching { unregisterReceiver(resultReceiver) }
        super.onStop()
    }

    private fun sendCommand(type: String, argument: String? = null) {
        if (!isAccessibilityServiceEnabled()) {
            refreshStatus()
            Toast.makeText(this, "Enable the accessibility service first.", Toast.LENGTH_SHORT).show()
            return
        }

        sendBroadcast(AgentCommand.intent(type, argument))
        if (type != AgentCommand.TYPE_READ_SCREEN) {
            binding.resultText.text = "Command sent: $type"
        }
    }

    private fun refreshStatus() {
        binding.statusText.text = if (isAccessibilityServiceEnabled()) {
            getString(R.string.status_enabled)
        } else {
            getString(R.string.status_disabled)
        }
        binding.resultText.text = AgentStateStore.readResult(this)
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val expectedComponent = "$packageName/${AgentAccessibilityService::class.java.name}"
        val enabledServices = Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        return !enabledServices.isNullOrBlank() && TextUtils.SimpleStringSplitter(':').run {
            setString(enabledServices)
            any { it.equals(expectedComponent, ignoreCase = true) }
        }
    }
}
