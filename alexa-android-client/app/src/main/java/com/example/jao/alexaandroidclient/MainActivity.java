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

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;



public class MainActivity extends AppCompatActivity {

    private static final String LOG_TAG = "AudioRecordTest";
    private static String mFileName = null;

    private RecordButton mRecordButton = null;
    private MediaRecorder mRecorder = null;

    private PlayButton   mPlayButton = null;
    private MediaPlayer   mPlayer = null;

    private int AUDIO_SOURCE = MediaRecorder.AudioSource.MIC;
    // Alexa Voice Service requirements: 16bit Linear PCM, 16kHz sample rate, Single channel, Little endian byte order
    // https://developer.amazon.com/public/solutions/alexa/alexa-voice-service/reference/speechrecognizer
    private int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;
    private int AUDIO_SAMPLE_RATE_IN_HZ = 16000;
    private int AUDIO_CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;

    private int bufferSizeInBytes = AudioRecord.getMinBufferSize(AUDIO_SAMPLE_RATE_IN_HZ, AUDIO_CHANNEL_CONFIG, AUDIO_FORMAT);

    private AudioRecord mAudioRecord = null;

    byte mAudioRecordBuffer[] = new byte[bufferSizeInBytes];

    private boolean mIsRecording = false;

    private Thread mRecordingThread = null;

    OkHttpClient okHttpClient = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);


        /*
        mAudioRecord = new AudioRecord(AUDIO_SOURCE,
                AUDIO_SAMPLE_RATE_IN_HZ,
                AUDIO_CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSizeInBytes);
        */

        // /storage/emulated/0/FILENAME --> /mnt/shell/emulated/0
        mFileName = Environment.getExternalStorageDirectory().getAbsolutePath();
        mFileName += "/audiorecordtest.3gp";
        //mFileName += "/audiorecordtest.wav";

        Log.e(LOG_TAG, "mFileName: " + mFileName);

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
            startPlaying();
        } else {
            stopPlaying();
        }
    }

    private void startPlaying() {
        mPlayer = new MediaPlayer();
        try {
            mPlayer.setDataSource(mFileName);
            mPlayer.prepare();
            mPlayer.start();
        } catch (IOException e) {
            Log.e(LOG_TAG, "prepare() failed");
        }
    }

    private void stopPlaying() {
        mPlayer.release();
        mPlayer = null;
    }


    private void startRecording() {
        mRecorder = new MediaRecorder();

        mRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);

        // Alexa Voice Service requirements: 16bit Linear PCM, 16kHz sample rate, Single channel, Little endian byte order
        // https://developer.amazon.com/public/solutions/alexa/alexa-voice-service/reference/speechrecognizer
        mRecorder.setAudioEncodingBitRate(16);
        mRecorder.setAudioSamplingRate(16000);
        mRecorder.setAudioChannels(1);


        mRecorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);
        mRecorder.setOutputFile(mFileName);
        mRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_WB);

        try {
            mRecorder.prepare();
        } catch (IOException e) {
            Log.e(LOG_TAG, "prepare() failed");
        }

        mRecorder.start();
    }

    private void stopRecording() {
        mRecorder.stop();
        mRecorder.release();
        mRecorder = null;

        // Start sending audio file to companison site server
        HTTPRequestTask httpRequestTask = new HTTPRequestTask();

        //String urlString = "http://192.168.1.185:4000/";
        String urlString = "https://192.168.1.185:8443/";
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



/*
    private void startRecording() {

        //mAudioRecord.startRecording();
        //mIsRecording = true;

        // Use a new thread to perform record
        mRecordingThread = new Thread(new Runnable() {
            @Override
            public void run() {

                FileOutputStream fileOutputStream = null;
                try {
                    fileOutputStream = new FileOutputStream(mFileName);
                } catch (FileNotFoundException e) {
                    e.printStackTrace();
                }

                short[] mBuffer = new short[bufferSizeInBytes/2];

                mAudioRecord.startRecording();
                mIsRecording = true;

                while(mIsRecording) {
                    int numOfShorts = mAudioRecord.read(mBuffer, 0, mBuffer.length);

                    if(numOfShorts < 0) {
                        Log.e(LOG_TAG, "mAudioRecord.read failed");
                    }

                    try {
                        fileOutputStream.write(mAudioRecordBuffer, 0, bufferSizeInBytes);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }

                }

                try {
                    fileOutputStream.flush();
                    fileOutputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }

            }
        });

        // Start the new thread
        mRecordingThread.start();

    }

    private void stopRecording() {

        mIsRecording = false;

        mAudioRecord.stop();
        mAudioRecord.release();
        mAudioRecord = null;

        mRecordingThread = null;
    }
*/
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

            Request request = new Request.Builder()
                    .url(httpRequests[0].getURL())
                    .build();

            Response response = null;
            try {
                response = client.newCall(request).execute();
            } catch (IOException e) {
                e.printStackTrace();
            }

            if(response != null) {
                try {
                    Log.d(LOG_TAG, "Reponse is: " + response.body().string());
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            //Log.d(LOG_TAG, "URL is: " + httpRequests[0].getURL().toString());
            return null;
        }
    }


}
