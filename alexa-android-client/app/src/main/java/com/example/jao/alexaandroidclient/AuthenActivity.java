package com.example.jao.alexaandroidclient;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.net.http.SslError;
import android.os.AsyncTask;
import android.os.Build;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;

import com.amazon.identity.auth.device.authorization.api.AuthzConstants;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.UUID;

import okhttp3.Headers;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class AuthenActivity extends AppCompatActivity {

    private static final String LOG_TAG = "AlexaAndroidClient";

    String mCloudEndpoint= "https://192.168.0.24:8443";
    String ALEXA_CLOUD_ENDPOINT = "https://avs-alexa-na.amazon.com";
    String ALEXA_DIRECT_PATH = "/v20160207/directives";

    String mSessionId = null;
    String mAccessToken = null;

    private String PREFERENCE_SESSION = "preference_session";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_authen);

        //mWebview.setWebViewClient(new WebViewClient());
        //mWebview.setWebViewClient(new InsecureWebViewClient());
        //webviewAuthentication.loadUrl("http://www.google.com");

        Button btnLogin = (Button) findViewById(R.id.btnAuthenLogin);
        btnLogin.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                SharedPreferences session = getSharedPreferences(PREFERENCE_SESSION, 0);

                String uuid = UUID.randomUUID().toString();
                Log.d(LOG_TAG, "openSession: " + uuid);

                mSessionId = uuid;

                SharedPreferences.Editor editor = session.edit();
                editor.putString("sessionId", mSessionId);
                editor.putString("accessToken", null);

                // Commit the edits!
                editor.commit();

                //mWebview.loadUrl(mCloudEndpoint + "/auth/amazonauth" + "?sessionId=" + mSessionId);

                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(mCloudEndpoint + "/auth/amazonauth" + "?sessionId=" + mSessionId));
                startActivity(browserIntent);


            }
        });

        Button btnInit = (Button) findViewById(R.id.btnAuthenInit);
        btnInit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                String urlString = ALEXA_CLOUD_ENDPOINT + ALEXA_DIRECT_PATH;

                HTTPRequest httpRequest = null;
                try {
                    httpRequest = new HTTPRequest(new URL(urlString), mSessionId);
                } catch (MalformedURLException e) {
                    e.printStackTrace();
                }

                new OpenDownChannelTask().execute(httpRequest);

            }
        });

        Log.e(LOG_TAG, "AuthenActivity.onCreate()");

    }

    @Override
    protected void onResume() {
        super.onResume();

        // Restore sessionId
        SharedPreferences session = getSharedPreferences(PREFERENCE_SESSION, 0);

        mSessionId = session.getString("sessionId", null);
        if(mSessionId == null) {
            String uuid = UUID.randomUUID().toString();
            Log.d(LOG_TAG, "mSessionId is null");

            mSessionId = uuid;

            SharedPreferences.Editor editor = session.edit();
            editor.putString("sessionId", mSessionId);

            // Commit the edits!
            editor.commit();
        }


        mAccessToken = session.getString("accessToken", null);
        if(mAccessToken == null) {

            Log.d(LOG_TAG, "mAccessToken is null");

            String urlString = mCloudEndpoint + "/auth/amazontoken" + "?sessionId=" + mSessionId;

            HTTPRequest httpRequest = null;
            try {
                httpRequest = new HTTPRequest(new URL(urlString), mSessionId);
            } catch (MalformedURLException e) {
                e.printStackTrace();
            }

            if(httpRequest != null) {
                new GetAmazonTokenTask().execute(httpRequest);
            }

        }

        Log.e(LOG_TAG, "AuthenActivity.onResume()");
    }

    /*

    private class InsecureWebViewClient extends WebViewClient {

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            view.loadUrl(request.getUrl().toString());
            return true;
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            handler.proceed(); // Ignore SSL certificate errors
        }

    }*/

    private class HTTPRequest {

        private URL url;
        private String sessionId;

        HTTPRequest(URL url, String sessionId) {
            this.url = url;
            this.sessionId = sessionId;
        }

        public URL getURL() {
            return this.url;
        }

        public String getSessionId() {
            return this.sessionId;
        }
    }

    private class Tokens {
        public String accessToken;
        public String refreshToken;

    }

    private class GetAmazonTokenTask extends AsyncTask<HTTPRequest, String, Tokens> {

        //OkHttpClient client = new OkHttpClient();
        OkHttpClient client = InsecureOkHttpClient.getInsecureOkHttpClient();

        @Override
        protected Tokens doInBackground(HTTPRequest... httpRequests) {

            Tokens tokens = null;

            Request request = new Request.Builder()
                    .url(httpRequests[0].getURL())
                    .build();

            Response response = null;
            try {
                response = client.newCall(request).execute();
            } catch (IOException e) {
                e.printStackTrace();
            }

            if (response != null) {

                if (response.code() != 200) {
                    try {
                        Log.d(LOG_TAG, "Request failed: " + response.body().string());
                    } catch (IOException e) {
                        e.printStackTrace();
                    } finally {
                        return null;
                    }
                }


                try {


                    //updateUIBasedonStatus();
                    publishProgress(null);

                    JSONObject responseJObject = null;

                    try {
                        responseJObject = new JSONObject(response.body().string());
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                    String accessToken = null;
                    String refreshToken = null;

                    if (responseJObject != null) {
                        try {
                            accessToken = responseJObject.getString("access_token");
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                        try {
                            refreshToken = responseJObject.getString("refresh_token");
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                        Log.d(LOG_TAG, "accessToken: " + accessToken);
                        Log.d(LOG_TAG, "refreshToken:: " + refreshToken);

                        tokens = new Tokens();
                        tokens.accessToken = accessToken;
                        tokens.refreshToken = refreshToken;

                        publishProgress(accessToken, refreshToken);
                    }


                } catch (IOException e) {
                    e.printStackTrace();
                }
            }



            //Log.d(LOG_TAG, "URL is: " + httpRequests[0].getURL().toString());
            return tokens;
        }

        @Override
        protected void onPostExecute(Tokens tokens) {
            SharedPreferences session = getSharedPreferences(PREFERENCE_SESSION, 0);

            SharedPreferences.Editor editor = session.edit();
            editor.putString("accessToken", tokens.accessToken);
            editor.putString("refreshToken", tokens.refreshToken);

            Log.d(LOG_TAG, "onPostExecute ");

            // Commit the edits!
            editor.commit();

            mAccessToken = tokens.accessToken;

        }

    } // private class GetAmazonTokenTask extends AsyncTask<HTTPRequest, String, Tokens>

    private class OpenDownChannelTask extends AsyncTask<HTTPRequest, String, Tokens> {

        //OkHttpClient client = new OkHttpClient();
        OkHttpClient client = SecureOkHttpClient.getTLS12OkHttpClient();

        @Override
        protected Tokens doInBackground(HTTPRequest... httpRequests) {

            Request request = null;
            Response response = null;

            Log.i(LOG_TAG, "Starting Open Downchannel procedure");
            long start = System.currentTimeMillis();
            try {
                OkHttpClient client = SecureOkHttpClient.getTLS12OkHttpClient();

                Log.i(LOG_TAG, "Downchannel open: " + httpRequests[0].getURL());
                Log.i(LOG_TAG, "Downchannel open: " + mAccessToken);

                request = new Request.Builder()
                        .url(httpRequests[0].getURL())
                        .addHeader("Authorization", "Bearer " + mAccessToken)
                        .build();

                client.newCall(request).execute();

                Log.i(LOG_TAG, "Downchannel open");
                Log.i(LOG_TAG, "Open Downchannel process took: " + (System.currentTimeMillis() - start));
            } catch (IOException e) {
                Log.d(LOG_TAG, "OpenDownChannel error: " + e);
            }

            try {
                response = client.newCall(request).execute();
            } catch (IOException e) {
                e.printStackTrace();
            }

            if (response != null) {

                Log.d(LOG_TAG, "OpenDownChannel response: " + response.code());

            }

            return null;

        }

    } // private class OpenDownChannel extends AsyncTask<HTTPRequest, String, Tokens>

}
