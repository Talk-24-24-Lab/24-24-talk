package com.oneworld2424.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

// 24/24 ONE WORLD : service « micro » au premier plan. Tant qu'il tourne, Android garde l'appli
// (et la traduction vocale) en vie quand l'écran s'éteint. Une notification le signale.
public class OwVeilleService extends Service {
  private PowerManager.WakeLock lock;

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    String canal = "ow_veille";
    NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
    if (Build.VERSION.SDK_INT >= 26 && nm != null) {
      nm.createNotificationChannel(new NotificationChannel(canal, "Traduction en continu", NotificationManager.IMPORTANCE_LOW));
    }
    Intent ouvrir = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent pi = PendingIntent.getActivity(this, 0, ouvrir, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, canal) : new Notification.Builder(this);
    Notification n = b.setContentTitle("24/24 ONE WORLD")
        .setContentText("Traduction en cours, même écran éteint")
        .setSmallIcon(R.mipmap.ic_launcher)
        .setOngoing(true)
        .setContentIntent(pi)
        .build();
    if (Build.VERSION.SDK_INT >= 30) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
    else startForeground(1, n);
    if (lock == null) {
      PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
      lock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "oneworld:traduction");
      lock.acquire(3 * 60 * 60 * 1000L);
    }
    return START_NOT_STICKY;
  }

  @Override
  public void onDestroy() {
    if (lock != null && lock.isHeld()) lock.release();
    lock = null;
    super.onDestroy();
  }

  @Override
  public IBinder onBind(Intent intent) { return null; }
}
