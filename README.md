<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DdpSyFCum5VR0vKGl69-3qApNuaCcsHb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Android accessibility agent

- Installable APK: `android-agent/pricemate-agent-debug.apk`
- Source: `android-agent/app/src/main`
- The Android app is a consent-based accessibility helper. After installing it, you must manually enable **PriceMate Accessibility Agent** in Android Accessibility settings.

### What it can do

- read the current screen hierarchy
- tap the first visible node matching text you enter
- type into the currently focused editable field
- scroll forward and backward
- send Back, Home, and Recents global actions
- launch another app by package name

### Important limits

- it cannot enable Accessibility permissions by itself
- it cannot bypass the lock screen or protected system prompts
- it only acts after you explicitly enable the service

### Rebuild the APK in this environment

Use the Android SDK tools already available in the environment:

```bash
ROOT=/home/runner/work/pricemate/pricemate/android-agent
APP=$ROOT/app/src/main
OUT=$ROOT/build/manual
BT=/usr/local/lib/android/sdk/build-tools/37.0.0
ANDROID_JAR=/usr/local/lib/android/sdk/platforms/android-35/android.jar

rm -rf "$OUT"
mkdir -p "$OUT/compiled" "$OUT/classes" "$OUT/dex"
"$BT/aapt2" compile --dir "$APP/res" -o "$OUT/compiled"
mapfile -t FLATS < <(find "$OUT/compiled" -name '*.flat' | sort)
"$BT/aapt2" link -I "$ANDROID_JAR" --manifest "$APP/AndroidManifest.xml" --java "$OUT/gen" --auto-add-overlay --min-sdk-version 28 --target-sdk-version 35 --version-code 1 --version-name 1.0.0 -o "$OUT/base.apk" $(printf ' -R %q' "${FLATS[@]}")
mapfile -t JAVA_SOURCES < <(find "$APP/java" "$OUT/gen" -name '*.java' | sort)
javac -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -d "$OUT/classes" "${JAVA_SOURCES[@]}"
mapfile -t CLASS_FILES < <(find "$OUT/classes" -name '*.class' | sort)
"$BT/d8" --lib "$ANDROID_JAR" --output "$OUT/dex" "${CLASS_FILES[@]}"
cp "$OUT/base.apk" "$OUT/unaligned.apk"
(cd "$OUT/dex" && zip -q -u "$OUT/unaligned.apk" classes.dex)
"$BT/zipalign" -f 4 "$OUT/unaligned.apk" "$OUT/aligned.apk"
keytool -genkeypair -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storetype PKCS12 -keystore "$OUT/debug.keystore" -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"
"$BT/apksigner" sign --ks "$OUT/debug.keystore" --ks-pass pass:android --key-pass pass:android --ks-key-alias androiddebugkey --out "$OUT/pricemate-agent-debug.apk" "$OUT/aligned.apk"
```
