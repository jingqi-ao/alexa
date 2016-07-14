package com.example.jao.alexaandroidclient;

import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioFormat;
import android.net.Uri;
import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;

import android.app.Activity;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.os.Bundle;
import android.os.Environment;
import android.view.ViewGroup;
import android.widget.Button;
import android.view.View;
import android.view.View.OnClickListener;
import android.content.Context;
import android.util.Log;
import android.media.MediaRecorder;
import android.media.MediaPlayer;
import android.media.AudioRecord;
import android.widget.TextView;

import java.io.BufferedInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;

// OKHttp (prepared for future HTTP2)
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;
import java.security.cert.CertificateException;

import okhttp3.Headers;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import java.io.File;
import java.util.UUID;


public class MainActivity extends AppCompatActivity {

    private static final String LOG_TAG = "AlexaAndroidClient";

    // UI
    private TextView mTVStatus = null;
    private TextView mTVHints = null;

    // Audio recorder
    AudioRecorder mAudioRecorder;
    // Event audio is the audio from client (user speaks)
    private String mEventAudioFilePath = Environment.getExternalStorageDirectory().getAbsolutePath() + "/avsEventAudio.3pg";

    // Audio player
    AudioPlayer mAudioPlayer;
    private String mAVSResponseAudioFilePath = Environment.getExternalStorageDirectory().getAbsolutePath() + "/avsResponseAudio.wav";

    // Client Session
    private String mSessionId = null;
    private String PREFERENCE_SESSION = "preference_session";

    // Status
    private static final String STATUS_READY = "status_ready";
    private static final String STATUS_RECORDING = "status_recording";
    private static final String STATUS_SEND_DATA_TO_CLOUD = "status_send_data_to_cloud";
    private static final String STATUS_RECEIVE_DATA_FROM_CLOUD = "status_receive_data_from_cloud";
    private static final String STATUS_PLAYING = "status_playing";

    String mStatus = STATUS_READY;

    // Cloud server
    private String mCloudEndpoint = "https://192.168.1.185:8443";

    //private String mCloudEndpoint = "http://192.168.1.185:4000/";


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);


        mAudioRecorder = new AudioRecorder(LOG_TAG, mEventAudioFilePath);
        mAudioPlayer = new AudioPlayer(LOG_TAG, mAVSResponseAudioFilePath);
        mAudioPlayer.setOnStoppoedListener(new AudioPlayer.OnStoppedListener() {
            @Override
            public void onStopped() {
                mStatus = STATUS_READY;
                updateUIBasedonStatus();
                Log.d(LOG_TAG, "mAudioPlayer.onStopped");
            }
        });

        setContentView(R.layout.activity_main);

        ImageButton imgBtnRecord = (ImageButton) findViewById(R.id.imgBtnRecord);

        imgBtnRecord.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View view) {
                if(mStatus == STATUS_READY) {
                    // Start recording
                    mStatus = STATUS_RECORDING;
                    updateUIBasedonStatus();
                    startRecording();
                } else {
                    // Stop recording
                    stopRecording();
                }
            }
        });

        mTVStatus = (TextView) findViewById(R.id.tvStatus);

        mTVHints = (TextView) findViewById(R.id.tvHints);

        updateUIBasedonStatus();

        Log.d(LOG_TAG, "MainActivity.onCreate() done");
        Log.d(LOG_TAG, "mEventAudioFilePath: " + mEventAudioFilePath);
        Log.d(LOG_TAG, "mAVSResponseAudioFilePath: " + mAVSResponseAudioFilePath);
    }

    @Override
    protected void onResume() {
        super.onResume();

        // Restore sessionId
        SharedPreferences session = getSharedPreferences(PREFERENCE_SESSION, 0);
        mSessionId = session.getString("sessionId", null);

        if(mSessionId != null) {
            Log.d(LOG_TAG, "onResume: sessionId" + mSessionId);
        } else {
            Log.d(LOG_TAG, "onResume: no sessionId");
        }
    }

    // Handle menu
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.nav_menu, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle item selection
        switch (item.getItemId()) {
            case R.id.navmenu_amazonauth:
                openSession();
                return true;
            default:
                return super.onOptionsItemSelected(item);
        }
    }

    // Handle Amazon Authorization
    private void openSession() {
        String uuid = UUID.randomUUID().toString();
        Log.d(LOG_TAG, "openSession: " + uuid);

        mSessionId = uuid;

        SharedPreferences session = getSharedPreferences(PREFERENCE_SESSION, 0);
        SharedPreferences.Editor editor = session.edit();
        editor.putString("sessionId", mSessionId);

        // Commit the edits!
        editor.commit();

        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(mCloudEndpoint + "/auth/amazonauthorize" + "?sessionId=" + mSessionId));
        startActivity(browserIntent);
    }

    private void updateUIBasedonStatus() {

        switch(mStatus) {
            case STATUS_RECORDING:
                mTVStatus.setText("Recording...");
                mTVHints.setText("Press the microphone button to finish recording.");
                break;
            case STATUS_SEND_DATA_TO_CLOUD:
                mTVStatus.setText("Sending data to cloud...");
                mTVHints.setText("Data is sent to cloud. It is transcoded to .wav format for Alexa Voice Service.");
                break;
            case STATUS_RECEIVE_DATA_FROM_CLOUD:
                mTVStatus.setText("Receiving data from cloud...");
                mTVHints.setText("The Alexa response will be automatically played after the data download is completed.");
                break;
            case STATUS_PLAYING:
                mTVStatus.setText("Playing...");
                mTVHints.setText("Do you like the answer? :)");
                break;
            default: // STATUS_READY
                mTVStatus.setText("Ready for your voice.");
                mTVHints.setText("Use Alexa to initiate the command. For example, Alexas, what's the weather in San Francsico? or Alexa, wikipedia San Francisco. Press the microphone button to start.");
                break;
        }

    }

    private void startRecording() {
        mAudioRecorder.startRecord();
    }

    private void stopRecording() {

        mAudioRecorder.stopRecord();

        HTTPRequestTask httpRequestTask = new HTTPRequestTask();

        mStatus = STATUS_SEND_DATA_TO_CLOUD;
        updateUIBasedonStatus();

        // Start sending audio file to companison site server

        String urlString = mCloudEndpoint + "/events";

        HTTPRequest httpRequest = null;
        try {
            httpRequest = new HTTPRequest(new URL(urlString));
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }

        if(httpRequest != null) {
            httpRequestTask.execute(httpRequest);
        }

    }

    private class HTTPRequest {

        private URL url;

        HTTPRequest(URL url) {
            this.url = url;
        }

        public URL getURL() {
            return this.url;
        }
    }

    private class HTTPRequestTask extends AsyncTask<HTTPRequest, String, Long> {

        //OkHttpClient client = new OkHttpClient();
        OkHttpClient client = InsecureOkHttpClient.getInsecureOkHttpClient();

        @Override
        protected Long doInBackground(HTTPRequest... httpRequests) {

            Headers audioPartHeader = new Headers.Builder()
                    .add("Content-Disposition", "form-data;name=\"audio\"")
                    .add("Content-Type", "application/octet-stream")
                    .build();


            RequestBody requestBody = new MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart("metadata", "Metadata")
                    .addFormDataPart("audio", "testaudio.3pg",
                            RequestBody.create(MediaType.parse("audo"), new File(mEventAudioFilePath)))
                    .build();

            Request request = new Request.Builder()
                    .url(httpRequests[0].getURL())
                    .post(requestBody)
                    .build();

            Response response = null;
            try {
                response = client.newCall(request).execute();
            } catch (IOException e) {
                e.printStackTrace();
            }

            if(response != null) {
                try {

                    mStatus = STATUS_RECEIVE_DATA_FROM_CLOUD;
                    //updateUIBasedonStatus();
                    publishProgress(null);

                    //Log.d(LOG_TAG, "Reponse is: " + response.body().string());
                    Log.d(LOG_TAG, "Reponse is here! ");
                    InputStream responseInputStream = response.body().byteStream();

                    FileOutputStream fileOutputStream = new FileOutputStream(mAVSResponseAudioFilePath);

                    byte[] buf = new byte[512];
                    int num = 0;
                    while ((num = responseInputStream.read(buf)) != -1) {
                        fileOutputStream.write(buf, 0, num);
                    }

                    Log.d(LOG_TAG, "File Writing is done! ");

                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            //Log.d(LOG_TAG, "URL is: " + httpRequests[0].getURL().toString());
            return null;
        }


        protected void onProgressUpdate(String... status) {
            updateUIBasedonStatus();
        }

        @Override
        protected void onPostExecute(Long result) {

            mStatus = STATUS_PLAYING;
            updateUIBasedonStatus();

            mAudioPlayer.startPlaying();
        }

    }


}
