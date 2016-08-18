package com.example.jao.alexalib.interfaces;

import android.util.Log;

import com.example.jao.alexalib.callback.AsyncCallback;

import org.jetbrains.annotations.NotNull;

import java.io.IOException;

/**
 * @author will on 5/21/2016.
 */
public class GenericSendEvent extends SendEvent{

    public static final String TAG = "GenericSendEvent";

    String event;

    public GenericSendEvent(String url, String accessToken, String event, final AsyncCallback<AvsResponse, Exception> callback){

        this.event = event;

        if(callback != null){
            callback.start();
        }
        try {
            prepareConnection(url, accessToken);
            if(callback != null) {
                callback.success(completePost());
                callback.complete();
            }else{
                completePost();
            }
            Log.i(TAG, "Event sent");
        } catch (IOException e) {
            onError(callback, e);
        } catch (AvsException e) {
            onError(callback, e);
        }

        if(callback != null){
            callback.complete();
        }
    }

    @NotNull
    @Override
    public String getEvent() {
        return event;
    }


    public void onError(final AsyncCallback<AvsResponse, Exception> callback, Exception e) {
        if(callback != null){
            callback.failure(e);
            callback.complete();
        }
    }
}
