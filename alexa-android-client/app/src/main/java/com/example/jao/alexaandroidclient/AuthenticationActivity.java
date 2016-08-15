package com.example.jao.alexaandroidclient;

import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;

import com.amazon.identity.auth.device.AuthError;
import com.amazon.identity.auth.device.authorization.api.AmazonAuthorizationManager;
import com.amazon.identity.auth.device.authorization.api.AuthorizationListener;
import com.amazon.identity.auth.device.authorization.api.AuthzConstants;
import com.amazon.identity.auth.device.shared.APIListener;

// Code challenge
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

import okhttp3.FormBody;
import okhttp3.Headers;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class AuthenticationActivity extends AppCompatActivity {

    private static final String LOG_TAG = "AlexaAndroidClient";

    private AmazonAuthorizationManager mAuthManager;

    private static final String[] APP_SCOPES= {"alexa:all"};

    private String PRODUCT_ID = "alexa_android_client_debug";
    private String PRODUCT_DSN = "IamproductDSN";

    private String CODE_VERIFIER="123456789012345678901234567890123456789012345678901234567890";
    private String CODE_CHALLENGE = "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkw";

    private static final String SHA_256 = "S256";
    private static final String ALORITHM_SHA_256 = "SHA-256";

    private static final String AMAZON_OAUTH_TOKEN_URL = "https://api.amazon.com/auth/O2/token";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_authentication);

        WebView webviewAuthentication = (WebView) findViewById(R.id.webviewAuthentication);
        webviewAuthentication.setWebViewClient(new WebViewClient());
        //webviewAuthentication.loadUrl("http://www.google.com");

        mAuthManager = new AmazonAuthorizationManager(this, Bundle.EMPTY);

        Button btnLogin = (Button) findViewById(R.id.btnLogin);
        btnLogin.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                Bundle options = new Bundle();
                String scope_data = "{\"alexa:all\":{\"productID\":\"" + PRODUCT_ID +
                        "\", \"productInstanceAttributes\":{\"deviceSerialNumber\":\"" +
                        PRODUCT_DSN + "\"}}}";
                options.putString(AuthzConstants.BUNDLE_KEY.SCOPE_DATA.val, scope_data);

                // Request the authorization code instead of an access token
                options.putBoolean(AuthzConstants.BUNDLE_KEY.GET_AUTH_CODE.val, true);
                options.putString(AuthzConstants.BUNDLE_KEY.CODE_CHALLENGE.val, CODE_CHALLENGE);
                // Set code challenge method
                options.putString(AuthzConstants.BUNDLE_KEY.CODE_CHALLENGE_METHOD.val, "S256");

                Log.d(LOG_TAG, "Here ");

                mAuthManager.authorize(APP_SCOPES, options, new AuthorizeListener());

                //String[] APP_SCOPES= {"profile"};
                //mAuthManager.authorize(APP_SCOPES, Bundle.EMPTY, new AuthorizeListener());

            }
        });

    }

    private class AuthorizeListener implements AuthorizationListener {

        /* Authorization was completed successfully. */
        @Override
        public void onSuccess(Bundle response) {

            String authorizationCode = response.getString(AuthzConstants.BUNDLE_KEY.AUTHORIZATION_CODE.val);
            Log.d(LOG_TAG, "authorizationCode: " + authorizationCode);

            String clientId = null;
            try {
                clientId = mAuthManager.getClientId();
            } catch (AuthError authError) {
                authError.printStackTrace();
            }

            String redirectURI = null;
            try {
                redirectURI = mAuthManager.getRedirectUri();
            } catch (AuthError authError) {
                authError.printStackTrace();
            }

            Log.d(LOG_TAG, "clientId: " + clientId);
            Log.d(LOG_TAG, "redirectURI: " + redirectURI);


            mAuthManager.getToken(new String []{"alexa:all"}, new TokenListener());

            /*
            String urlString = AMAZON_OAUTH_TOKEN_URL + "/api/v1/events";

            TokenRequest tokenRequest = null;
            try {
                tokenRequest = new TokenRequest(new URL(AMAZON_OAUTH_TOKEN_URL),
                        "authorization_code",
                        authorizationCode,
                        redirectURI,
                        clientId,
                        CODE_VERIFIER);
            } catch (MalformedURLException e) {
                e.printStackTrace();
            }

            ObtainNewTokenTask obtainNewTokenTask = new ObtainNewTokenTask();

            if(tokenRequest != null) {
                obtainNewTokenTask.execute(tokenRequest);
            }
            */


        }
        /* There was an error during the attempt to authorize the application. */
        @Override
        public void onError(AuthError ae) {
            Log.d(LOG_TAG, "AuthError" + ae);
        }
        /* Authorization was cancelled before it could be completed. */
        @Override
        public void onCancel(Bundle cause) {
            Log.d(LOG_TAG, "onCancel");
        }
    }

    public class TokenListener implements APIListener {
        /* getToken completed successfully. */
        @Override
        public void onSuccess(Bundle response) {
            String accessToken = response.getString(AuthzConstants.BUNDLE_KEY.TOKEN.val);
            Log.d(LOG_TAG, "TokenListener onSuccess: " + accessToken);
        }
        /* There was an error during the attempt to get the token. */
        @Override
        public void onError(AuthError ae) {
        }
    }


    /*
    private class TokenRequest {

        private URL url;
        private String grantType;
        private String code;
        private String redirectURI;
        private String clientId;
        private String codeVerifier;



        TokenRequest(URL url, String grantType, String code, String redirectURI, String clientId, String codeVerifier) {
            this.url = url;
            this.grantType = grantType;
            this.code = code;
            this.redirectURI = redirectURI;
            //this.clientId = clientId;
            this.clientId = "amzn1.application-oa2-client.3650c2500a864f31a764c06a4e469a7f";
            this.codeVerifier = codeVerifier;

        }

        public URL getURL() {
            return this.url;
        }

        public String getGrantType() {
            return this.grantType;
        }

        public String getCode() {
            return this.code;
        }

        public String getRedirectURI() {
            return this.redirectURI;
        }

        public String getClientId() {
            return this.clientId;
        }

        public String getCodeVerifier() {
            return this.codeVerifier;
        }
    }

    private class ObtainNewTokenTask extends AsyncTask<TokenRequest, String, Long> {

        //OkHttpClient client = new OkHttpClient();
        OkHttpClient client = InsecureOkHttpClient.getInsecureOkHttpClient();

        @Override
        protected Long doInBackground(TokenRequest... httpRequests) {

            RequestBody formBody = new FormBody.Builder()
                    .add("grant_type", httpRequests[0].getGrantType())
                    .add("code", httpRequests[0].getCode())
                    .add("redirect_uri", httpRequests[0].getRedirectURI())
                    .add("client_id", httpRequests[0].getClientId())
                    .add("code_verifier", httpRequests[0].getCodeVerifier())
                    .add("client_secret", "2683dd040f643362e7eeb96279daac053259ae900577c84aa7f90a396e1e0180")
                    .build();

            Request request = new Request.Builder()
                    .url(httpRequests[0].getURL())
                    .post(formBody)
                    .build();

            Response response = null;
            try {
                response = client.newCall(request).execute();
            } catch (IOException e) {
                e.printStackTrace();
            }

            try {
                String json = response.body().string();
                Log.d(LOG_TAG, "json: " + json);
            } catch (IOException e) {
                e.printStackTrace();
            }

            //Log.d(LOG_TAG, "URL is: " + httpRequests[0].getURL().toString());
            return null;
        }
    }*/


    /*
    private String generateCodeChallenge(String codeVerifier, String codeChallengeMethod)
            throws NoSuchAlgorithmException {
        String codeChallenge =
                base64UrlEncode(MessageDigest.getInstance(ALORITHM_SHA_256).digest(codeVerifier.getBytes()));
        return codeChallenge;
    }

    private String generateCodeVerifier() {
        byte[] randomOctetSequence = generateRandomOctetSequence();
        String codeVerifier = base64UrlEncode(randomOctetSequence);
        return codeVerifier;
    }

    private byte[] generateRandomOctetSequence() {
        SecureRandom random = new SecureRandom();
        byte[] octetSequence = new byte[32];
        random.nextBytes(octetSequence);

        return octetSequence;
    }

    private String base64UrlEncode(byte[] arg) {
        return org.apache.commons.codec.binary.Base64.encodeBase64URLSafeString(arg);
    }
    */

}
