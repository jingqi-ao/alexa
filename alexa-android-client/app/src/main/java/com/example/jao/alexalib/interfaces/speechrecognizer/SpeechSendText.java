package com.example.jao.alexalib.interfaces.speechrecognizer;

// This seems to be text-to-speech-to-AVS. For now, not going to use. But keep it here.

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import com.example.jao.alexalib.VoiceHelper;
import com.example.jao.alexalib.callback.AsyncCallback;
import com.example.jao.alexalib.interfaces.AvsException;
import com.example.jao.alexalib.interfaces.AvsResponse;
import com.example.jao.alexalib.requestbody.DataRequestBody;

import org.jetbrains.annotations.NotNull;

import java.io.IOException;

import okhttp3.RequestBody;
import okio.BufferedSink;

/**
 * A subclass of {@link SpeechSendEvent} that allows an arbitrary text string to be sent to the AVS servers, translated through Google's text to speech engine
 * This speech is rendered using the VoiceHelper utility class, and is done on whatever thread this call is running
 */
public class SpeechSendText extends SpeechSendEvent {

    private final static String TAG = "SpeechSendText";

    long start = 0;

    /**
     * Use VoiceHelper utility to create an audio file from arbitrary text using Text-To-Speech to be passed to the AVS servers
     * @param context local/application context
     * @param url the URL to which we're sending the AVS post
     * @param accessToken our user's access token for the server
     * @param text the text we want to translate into speech
     * @param callback our event callbacks
     * @throws IOException
     */
    public void sendText(final Context context, final String url, final String accessToken, String text, final AsyncCallback<AvsResponse, Exception> callback) throws IOException {

        if(callback != null){
            callback.start();
        }

        Log.i(TAG, "Starting SpeechSendText procedure");
        start = System.currentTimeMillis();

        //add a pause to the end to be better understood
        if(!TextUtils.isEmpty(text)){
            text = text + ".....";
        }

        final String input = text;


        //call the parent class's prepareConnection() in order to prepare our URL POST
        prepareConnection(url, accessToken);

        //get our VoiceHelper and use an async callback to get the data and send it off to the AVS server via completePost()
        VoiceHelper voiceHelper = VoiceHelper.getInstance(context);
        voiceHelper.getSpeechFromText(input, new VoiceHelper.SpeechFromTextCallback() {
            @Override
            public void onSuccess(final byte[] data){

                Log.i(TAG, "We have audio");

                try {
                    mOutputStream.write(data);

                    Log.i(TAG, "Audio sent");
                    Log.i(TAG, "Audio creation process took: " + (System.currentTimeMillis() - start));
                    if(callback != null) {
                        callback.success(completePost());
                        callback.complete();
                    }

                } catch (IOException e) {
                    onError(e);
                } catch (AvsException e) {
                    onError(e);
                }
            }


            @Override
            public void onError(Exception e) {
                if(callback != null){
                    callback.failure(e);
                    callback.complete();
                }
            }
        });

    }


    @NotNull
    @Override
    protected RequestBody getRequestBody() {
        return new DataRequestBody() {
            @Override
            public void writeTo(BufferedSink sink) throws IOException {
                sink.write(mOutputStream.toByteArray());
            }
        };
    }
}