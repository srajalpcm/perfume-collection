package com.srajalpcm.perfumecollection;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://srajalpcm.github.io/perfume-collection/";
    private static final int FILE_CHOOSER = 1001;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private TextView errorView;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(247,243,237));
        webView = new WebView(this);
        errorView = new TextView(this);
        errorView.setText("Couldn’t connect to your perfume shelf.\n\nTap here to try again.");
        errorView.setTextColor(Color.rgb(33,29,25));
        errorView.setTextSize(17);
        errorView.setGravity(17);
        errorView.setVisibility(View.GONE);
        errorView.setOnClickListener(v -> loadApp());
        root.addView(webView, new FrameLayout.LayoutParams(-1,-1));
        root.addView(errorView, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        configureWebView();
        if (state == null) loadApp(); else webView.restoreState(state);
    }

    private void configureWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (u.getScheme().equals("http") || u.getScheme().equals("https")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException ignored) {}
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) { errorView.setVisibility(View.GONE); webView.setVisibility(View.VISIBLE); }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) { webView.setVisibility(View.GONE); errorView.setVisibility(View.VISIBLE); }
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                try {
                    Intent i = params.createIntent();
                    startActivityForResult(i, FILE_CHOOSER);
                    return true;
                } catch (ActivityNotFoundException e) { fileCallback = null; return false; }
            }
        });
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (ActivityNotFoundException ignored) {}
        });
    }

    private void loadApp() {
        errorView.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        webView.loadUrl(APP_URL + "?app=android");
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER && fileCallback != null) {
            Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            fileCallback.onReceiveValue(result);
            fileCallback = null;
        }
    }

    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }

    @Override protected void onSaveInstanceState(Bundle out) { webView.saveState(out); super.onSaveInstanceState(out); }
}
