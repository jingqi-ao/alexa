package com.example.jao.alexaandroidclient;

import android.media.AudioFormat;
import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;

import android.app.Activity;
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


public class MainActivity extends AppCompatActivity {

    private static final String LOG_TAG = "AlexaAndroidClient";

    // UI
    private RecordButton mRecordButton = null;
    private PlayButton   mPlayButton = null;

    // Audio recorder
    AudioRecorder mAudioRecorder;
    // Event audio is the audio from client (user speaks)
    private String mEventAudioFilePath = Environment.getExternalStorageDirectory().getAbsolutePath() + "/avsEventAudio.3pg";

    // Audio player
    AudioPlayer mAudioPlayer;
    private String mAVSResponseAudioFilePath = Environment.getExternalStorageDirectory().getAbsolutePath() + "/avsResponseAudio.wav";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);


        mAudioRecorder = new AudioRecorder(LOG_TAG, mEventAudioFilePath);
        mAudioPlayer = new AudioPlayer(LOG_TAG, mAVSResponseAudioFilePath);
        mAudioPlayer.setOnStoppoedListener(new AudioPlayer.OnStoppedListener() {
            @Override
            public void onStopped() {
                Log.d(LOG_TAG, "mAudioPlayer.onStopped");
            }
        });

        LinearLayout ll = new LinearLayout(this);
        mRecordButton = new RecordButton(this);
        ll.addView(mRecordButton,
                new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT,
                        0));
        mPlayButton = new PlayButton(this);
        ll.addView(mPlayButton,
                new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT,
                        0));
        setContentView(ll);
        //setContentView(R.layout.activity_main);

        Log.d(LOG_TAG, "MainActivity.onCreate() done");
        Log.d(LOG_TAG, "mEventAudioFilePath: " + mEventAudioFilePath);
        Log.d(LOG_TAG, "mAVSResponseAudioFilePath: " + mAVSResponseAudioFilePath);
    }

    private void onRecord(boolean start) {
        if (start) {
            startRecording();
        } else {
            stopRecording();
        }
    }

    private void onPlay(boolean start) {
        if (start) {
            mAudioPlayer.startPlaying();
        } else {
            mAudioPlayer.stopPlaying();
        }
    }

    private void startRecording() {
        mAudioRecorder.startRecord();
    }

    private void stopRecording() {

        mAudioRecorder.stopRecord();

        // Start sending audio file to companison site server
        HTTPRequestTask httpRequestTask = new HTTPRequestTask();

        //String urlString = "http://192.168.1.185:4000/";
        //String urlString = "http://192.168.1.185:4000/events";

        //String urlString = "https://192.168.1.185:8443/";
        String urlString = "https://192.168.1.185:8443/events";

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


    class RecordButton extends Button {
        boolean mStartRecording = true;

        OnClickListener clicker = new OnClickListener() {
            public void onClick(View v) {
                onRecord(mStartRecording);
                if (mStartRecording) {
                    setText("Stop recording");
                } else {
                    setText("Start recording");
                }
                mStartRecording = !mStartRecording;
            }
        };

        public RecordButton(Context ctx) {
            super(ctx);
            setText("Start recording");
            setOnClickListener(clicker);
        }
    }

    class PlayButton extends Button {
        boolean mStartPlaying = true;

        OnClickListener clicker = new OnClickListener() {
            public void onClick(View v) {
                onPlay(mStartPlaying);
                if (mStartPlaying) {
                    setText("Stop playing");
                } else {
                    setText("Start playing");
                }
                mStartPlaying = !mStartPlaying;
            }
        };

        public PlayButton(Context ctx) {
            super(ctx);
            setText("Start playing");
            setOnClickListener(clicker);
        }
    }

    /*
    public AudioRecordTest() {
        mFileName = Environment.getExternalStorageDirectory().getAbsolutePath();
        mFileName += "/audiorecordtest.3gp";
    }
    */

    private class HTTPRequest {

        private URL url;

        HTTPRequest(URL url) {
            this.url = url;
        }

        public URL getURL() {
            return this.url;
        }
    }

    private class HTTPRequestTask extends AsyncTask<HTTPRequest, Integer, Long> {

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

        @Override
        protected void onPostExecute(Long result) {
            mAudioPlayer.startPlaying();
        }

    }


}
