package com.example.jao.alexaandroidclient;

import android.os.AsyncTask;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

import okhttp3.Headers;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Created by jao on 8/14/16.
 */
public class AlexaInit {

    private static final String LOG_TAG = "AlexaAndroidClient";

    private static final String AVSOpenDownStreamURL = "https://avs-alexa-na.amazon.com/v20160207/directives";

    public void openDownstreamChannel(String accessToken) {

        AlexaInitRequest openDownstreamChannelRequest = new AlexaInitRequest();
        openDownstreamChannelRequest.accessToken = accessToken;


        CreateDownstreamTask createDownstreamTask = new CreateDownstreamTask();
        createDownstreamTask.execute(openDownstreamChannelRequest);

    }

    private class AlexaInitRequest {
        AlexaInitRequest() {
        }
        public String accessToken;
    }


    private class CreateDownstreamTask extends AsyncTask<AlexaInitRequest, Void, Long> {

        @Override
        protected Long doInBackground(AlexaInitRequest... httpRequests) {

            OkHttpClient client = InsecureOkHttpClient.getInsecureOkHttpClient();

            Request request = new Request.Builder()
                    .url(AVSOpenDownStreamURL)
                    .header("authorization", "Bearer " + httpRequests[0].accessToken)
                    .build();

            Response response = null;
            try {
                response = client.newCall(request).execute();
            } catch (IOException e) {
                e.printStackTrace();
            }

            if (response != null) {

                    publishProgress(null);

                    //Log.d(LOG_TAG, "Reponse is: " + response.body().string());
                    Log.d(LOG_TAG, "Reponse is here! ");

            }

            //Log.d(LOG_TAG, "URL is: " + httpRequests[0].getURL().toString());
            return null;
        }

    }

}
