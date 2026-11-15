#!/usr/bin/env bash
# Essai de l'APK sur un téléphone Android virtuel : installe, ouvre, lit l'état de la page par le débogueur de la WebView.
set -x
APK=app-android/android/app/build/outputs/apk/debug/app-debug.apk
for i in $(seq 1 30); do adb shell ping -c 1 -W 2 sebastienchevrier.github.io >/dev/null 2>&1 && { echo "réseau prêt ($i)"; break; }; sleep 3; done
adb install -r "$APK"
adb shell pm grant com.oneworld2424.app android.permission.RECORD_AUDIO || true
adb shell pm grant com.oneworld2424.app android.permission.CAMERA || true
adb shell am start -n com.oneworld2424.app/.MainActivity
sleep 45
adb exec-out screencap -p > essai-ecran.png
PID=$(adb shell pidof com.oneworld2424.app | tr -d '\r')
echo "pid=$PID"
adb forward tcp:9222 localabstract:webview_devtools_remote_$PID
node app-android/native/essai-cdp.mjs || true
adb logcat -d | grep -iE "OneWorld|Capacitor|chromium|AndroidRuntime" | tail -60 > essai-logcat.txt || true
