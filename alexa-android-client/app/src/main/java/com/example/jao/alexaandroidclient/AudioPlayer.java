package com.example.jao.alexaandroidclient;

import android.media.MediaPlayer;
import android.os.Environment;
import android.util.Log;

import java.io.IOException;

/**
 * Created by jao on 7/7/16.
 */
public class AudioPlayer {

    private String LOG_TAG = null;
    private String mAudioFileFullPath = null;

    private MediaPlayer mMediaPlayer = null;

    // Set OnStoppedListener interface for "onStopped" callback
    public interface OnStoppedListener {
        public void onStopped();
    }

    private OnStoppedListener mOnStoppedListner = null;

    public void setOnStoppoedListener(OnStoppedListener eventListner) {
        mOnStoppedListner = eventListner;
    }

    // Primary constructor
    public AudioPlayer(String logTag, String audioFileFullPath) {
        LOG_TAG = logTag == null ? "AudioPlayer" : logTag;
        mAudioFileFullPath = audioFileFullPath == null ?
                Environment.getExternalStorageDirectory().getAbsolutePath() + "/audioForAudioPlayer.3gp" : audioFileFullPath;
    }

    public AudioPlayer() {
        this(null, null);
    }

    public void startPlaying(String audioFileFullPath) {
        mMediaPlayer = new MediaPlayer();

        mMediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {

            @Override
            public void onCompletion(MediaPlayer mp) {
                stopPlaying();
            }

        });

        try {
            String filePath = audioFileFullPath == null ? mAudioFileFullPath : audioFileFullPath;
            mMediaPlayer.setDataSource(filePath);
            mMediaPlayer.prepare();
            mMediaPlayer.start();

        } catch (IOException e) {
            Log.e(LOG_TAG, "prepare() failed");
        }
    }

    public void startPlaying() {
        startPlaying(null);
    }

    public void stopPlaying() {

        if(mMediaPlayer != null) {
            mMediaPlayer.release();
            mMediaPlayer = null;
        }

        mOnStoppedListner.onStopped();

    }



}
