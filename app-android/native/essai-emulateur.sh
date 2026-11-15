#!/usr/bin/env bash
# Essai de l'APK sur un téléphone Android virtuel : installe, ouvre, lit l'état de la page par le débogueur de la WebView.
set -x
APK=app-android/android/app/build/outputs/apk/debug/app-debug.apk
for i in $(seq 1 30); do adb shell ping -c 1 -W 2 sebastienchevrier.github.io >/dev/null 2>&1 && { echo "réseau prêt ($i)"; break; }; sleep 3; done
# Mise à jour : on installe d'abord la version publiée, puis la nouvelle par-dessus (comme sur le téléphone de Sébastien).
curl -sL -o ancienne.apk https://github.com/Talk-24-24-Lab/24-24-talk/releases/download/android/one-world.apk
adb install ancienne.apk >/dev/null 2>&1
OUT=$(adb install -r "$APK" 2>&1); echo "$OUT"
if echo "$OUT" | grep -q Success; then echo "MAJ OK : la nouvelle version s'installe par-dessus la version publiée" > essai-maj.txt
else echo "MAJ REFUSÉE : $(echo "$OUT" | tail -1)" > essai-maj.txt; adb uninstall com.oneworld2424.monde; adb install "$APK"; fi
cat essai-maj.txt
adb shell pm grant com.oneworld2424.monde android.permission.RECORD_AUDIO || true
adb shell pm grant com.oneworld2424.monde android.permission.CAMERA || true
adb shell pm grant com.oneworld2424.monde android.permission.POST_NOTIFICATIONS || true
adb shell am start -n com.oneworld2424.monde/com.oneworld2424.app.MainActivity
sleep 45
adb exec-out screencap -p > essai-ecran.png
PID=$(adb shell pidof com.oneworld2424.monde | tr -d '\r')
echo "pid=$PID"
adb forward tcp:9222 localabstract:webview_devtools_remote_$PID
node app-android/native/essai-cdp.mjs || true
# Écran éteint : service micro allumé, écran coupé 40 s, puis on regarde si l'appli vit encore.
node app-android/native/essai-veille.mjs avant || true
adb shell input keyevent KEYCODE_SLEEP
sleep 40
adb shell dumpsys power | grep -iE "mWakefulness=|Display Power" | head -3 > essai-ecran-etat.txt || true
adb shell dumpsys activity services com.oneworld2424.monde > essai-service.txt || true
node app-android/native/essai-veille.mjs apres || true
adb shell input keyevent KEYCODE_WAKEUP || true
adb logcat -d | grep -iE "OneWorld|Capacitor|chromium|AndroidRuntime" | tail -60 > essai-logcat.txt || true
