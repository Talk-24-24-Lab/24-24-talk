package com.oneworld2424.app;

import android.os.Bundle;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;
import java.io.InputStream;
import java.util.Collections;

// 24/24 ONE WORLD : injecte la voix native (polyfill.js) avant les scripts du site.
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(OwVeillePlugin.class);
    super.onCreate(savedInstanceState);
    try {
      if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
        InputStream in = getAssets().open("ow-polyfill.js");
        byte[] b = new byte[in.available()];
        int n = in.read(b);
        in.close();
        String js = new String(b, 0, Math.max(n, 0), "UTF-8");
        WebViewCompat.addDocumentStartJavaScript(getBridge().getWebView(), js, Collections.singleton("*"));
        getBridge().getWebView().reload();
      }
    } catch (Exception e) {
      android.util.Log.e("OneWorld", "polyfill", e);
    }
  }

  // Écran éteint pendant une traduction : la page continue de tourner.
  private void garderPage() {
    if (OwVeillePlugin.actif && getBridge() != null) {
      getBridge().getWebView().onResume();
      getBridge().getWebView().resumeTimers();
    }
  }

  @Override
  public void onPause() { super.onPause(); garderPage(); }

  @Override
  public void onStop() { super.onStop(); garderPage(); }
}
