package com.example.jao.alexalib.interfaces.speechrecognizer;

import android.util.Log;

import com.example.jao.alexalib.callback.AsyncCallback;
import com.example.jao.alexalib.interfaces.AvsException;
import com.example.jao.alexalib.interfaces.AvsResponse;
import com.example.jao.alexalib.requestbody.DataRequestBody;

import org.jetbrains.annotations.NotNull;

import java.io.IOException;

import okhttp3.RequestBody;

/**
 * A subclass of {@link SpeechSendEvent} that sends a RequestBody to the AVS servers, this request body can either be a byte[]
 * straight write, or a threaded write loop based on incoming data (recorded audio).
 *
 * @author will on 4/17/2016.
 */
public class SpeechSendAudio extends SpeechSendEvent {

    private final static String TAG = "SpeechSendAudio";

    long start = 0;
    DataRequestBody requestBody;

    /**
     * Post an audio byte[] to the Alexa Speech Recognizer API
     * @param url the URL to which we're sending the AVS post
     * @param accessToken our user's access token for the server
     * @param requestBody our OkHttp RequestBody for our mulitpart send, this request body can either be a byte[]
     *                    straight write, or a threaded write loop based on incoming data (recorded audio).
     * @param callback our event callbacks
     * @throws IOException
     */
    public void sendAudio(final String url, final String accessToken, @NotNull DataRequestBody requestBody, final AsyncCallback<AvsResponse, Exception> callback) throws IOException {
        this.requestBody = requestBody;
        if(callback != null){
            callback.start();
        }
        Log.i(TAG, "Starting SpeechSendAudio procedure");
        start = System.currentTimeMillis();

        //call the parent class's prepareConnection() in order to prepare our URL POST
        try {
            prepareConnection(url, accessToken);
            if(callback != null) {
                callback.success(completePost());
                callback.complete();
            }else{
                completePost();
            }
            Log.i(TAG, "Audio sent");
            Log.i(TAG, "Audio sending process took: " + (System.currentTimeMillis() - start));
        } catch (IOException e) {
            onError(callback, e);
        } catch (AvsException e) {
            onError(callback, e);
        }

    }

    public void onError(final AsyncCallback<AvsResponse, Exception> callback, Exception e) {
        if(callback != null){
            callback.failure(e);
            callback.complete();
        }
    }

    @NotNull
    @Override
    protected RequestBody getRequestBody() {
        return requestBody;
    }
}
