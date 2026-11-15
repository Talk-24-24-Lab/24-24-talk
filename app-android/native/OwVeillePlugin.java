package com.oneworld2424.app;

import android.content.Intent;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Allume / éteint le service micro au premier plan depuis le site (via polyfill.js).
@CapacitorPlugin(name = "OwVeille")
public class OwVeillePlugin extends Plugin {
  static volatile boolean actif = false;

  @PluginMethod
  public void start(PluginCall call) {
    try {
      ContextCompat.startForegroundService(getContext(), new Intent(getContext(), OwVeilleService.class));
      actif = true;
      call.resolve(etat());
    } catch (Exception e) {
      call.reject(String.valueOf(e.getMessage()));
    }
  }

  @PluginMethod
  public void stop(PluginCall call) {
    getContext().stopService(new Intent(getContext(), OwVeilleService.class));
    actif = false;
    call.resolve(etat());
  }

  @PluginMethod
  public void etat(PluginCall call) { call.resolve(etat()); }

  private JSObject etat() { JSObject o = new JSObject(); o.put("actif", actif); return o; }
}
