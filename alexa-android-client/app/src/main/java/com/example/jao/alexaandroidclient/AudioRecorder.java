package com.example.jao.alexaandroidclient;

import android.media.MediaRecorder;
import android.os.Environment;
import android.util.Log;

import java.io.IOException;

/**
 * Created by jao on 7/7/16.
 *
 * This is MediaRecorder based implementation. The advantage is it is out-of-box (ready to use immediately).
 * The disadvantage is it does not support recording in .wav format. Alexa Voice Service require the .wav format.
 */
public class AudioRecorder {

    private String LOG_TAG = null;
    private String mAudioFileFullPath = null;

    private MediaRecorder mMediaRecorder = null;

    // Primary constructor
    public AudioRecorder(String logTag, String audioFileFullPath) {
        LOG_TAG = logTag == null ? "AudioRecorder" : logTag;
        mAudioFileFullPath = audioFileFullPath == null ?
                Environment.getExternalStorageDirectory().getAbsolutePath() + "/audioFromAudioRecorder.3gp" : audioFileFullPath;
    }

    public AudioRecorder() {
        this(null, null);
    }

    public void startRecord(String audioFileFullPath) {

        mMediaRecorder = new MediaRecorder();

        mMediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);

        // Alexa Voice Service requirements: 16bit Linear PCM, 16kHz sample rate, Single channel, Little endian byte order
        // https://developer.amazon.com/public/solutions/alexa/alexa-voice-service/reference/speechrecognizer
        mMediaRecorder.setAudioEncodingBitRate(16);
        mMediaRecorder.setAudioSamplingRate(16000);
        mMediaRecorder.setAudioChannels(1);


        mMediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);

        String filePath = audioFileFullPath == null ? mAudioFileFullPath : audioFileFullPath;
        mMediaRecorder.setOutputFile(filePath);
        mMediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_WB);

        try {
            mMediaRecorder.prepare();
        } catch (IOException e) {
            Log.e(LOG_TAG, "AudioRecorder.startRecord: mMediaRecorder.prepare() failed");
        }

        mMediaRecorder.start();

    }

    public void startRecord() {
        this.startRecord(null);
    }

    public void stopRecord() {

        if(mMediaRecorder != null) {
            mMediaRecorder.stop();
            mMediaRecorder.release();
            mMediaRecorder = null;
        } else {
            Log.d(LOG_TAG, "AudioRecorder.stopRecord: mMediaRecorder == null");
        }

    }

/*
// Use AudioRecord to directly generate .wav file. Need extra time to look into wav file header
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

}
