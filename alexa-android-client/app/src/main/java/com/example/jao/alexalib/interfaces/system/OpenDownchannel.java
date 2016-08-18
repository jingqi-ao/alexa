package com.example.jao.alexalib.interfaces.system;

import android.util.Log;

import com.example.jao.alexalib.callback.AsyncCallback;
import com.example.jao.alexalib.interfaces.AvsException;
import com.example.jao.alexalib.interfaces.AvsResponse;
import com.example.jao.alexalib.interfaces.SendEvent;

import org.jetbrains.annotations.NotNull;

import java.io.IOException;

/**
 * Open Down Channel Event to open a persistent connection with the Alexa server. Currently doesn't seem to work as expected.
 */
public class OpenDownchannel extends SendEvent {

    private static final String TAG = "OpenDownchannel";

    public OpenDownchannel(final String url, final String accessToken, final AsyncCallback<AvsResponse, Exception> callback) throws IOException {
        if(callback != null){
            callback.start();
        }
        Log.i(TAG, "Starting Open Downchannel procedure");
        long start = System.currentTimeMillis();

        //call the parent class's prepareConnection() in order to prepare our URL POST
        try {
            prepareConnection(url, accessToken);
            if(callback != null) {
                callback.success(completeGet());
                callback.complete();
            }else{
                completeGet();
            }
            Log.i(TAG, "Downchannel open");
            Log.i(TAG, "Open Downchannel process took: " + (System.currentTimeMillis() - start));
        } catch (IOException e) {
            onError(callback, e);
        } catch (AvsException e) {
            onError(callback, e);
        }

    }

    private void onError(final AsyncCallback<AvsResponse, Exception> callback, Exception e) {
        if(callback != null){
            callback.failure(e);
            callback.complete();
        }
    }

    @Override
    @NotNull
    protected String getEvent() {
        return "";
    }
}