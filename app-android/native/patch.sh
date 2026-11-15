#!/usr/bin/env bash
# Après « npx cap add android » : voix native, autorisations, icône. Lancé depuis app-android/.
set -euo pipefail
A=android/app/src/main
mkdir -p $A/java/com/oneworld2424/app $A/assets
cp native/MainActivity.java native/OwVeilleService.java native/OwVeillePlugin.java $A/java/com/oneworld2424/app/
cp native/polyfill.js $A/assets/ow-polyfill.js
python3 - <<'PY'
p="android/app/src/main/AndroidManifest.xml"; s=open(p).read()
perms=["RECORD_AUDIO","MODIFY_AUDIO_SETTINGS","CAMERA","WAKE_LOCK","POST_NOTIFICATIONS","FOREGROUND_SERVICE","FOREGROUND_SERVICE_MICROPHONE"]
add="".join('    <uses-permission android:name="android.permission.%s" />\n'%x for x in perms if x not in s)
add+='    <queries>\n        <intent><action android:name="android.speech.RecognitionService" /></intent>\n        <intent><action android:name="android.intent.action.TTS_SERVICE" /></intent>\n    </queries>\n'
s=s.replace("</manifest>",add+"</manifest>")
s=s.replace("</application>",'        <service android:name=".OwVeilleService" android:exported="false" android:foregroundServiceType="microphone" />\n    </application>',1); open(p,"w").write(s)
g="android/app/build.gradle"; t=open(g).read()
import os, re
run=os.environ.get("GITHUB_RUN_NUMBER","1")
t=re.sub(r"versionCode \d+","versionCode "+run,t,1); t=re.sub(r'versionName "[^"]*"','versionName "1.0.'+run+'"',t,1)
t=t.replace("dependencies {","dependencies {\n    implementation \"androidx.webkit:webkit:1.11.0\"",1); open(g,"w").write(t)
PY
rm -rf android/app/src/main/res/mipmap-anydpi-v26
for d in android/app/src/main/res/mipmap-*; do
  for f in ic_launcher.png ic_launcher_round.png ic_launcher_foreground.png; do cp ../everywhere/icons/icon-512.png "$d/$f"; done
done
grep -c uses-permission $A/AndroidManifest.xml
