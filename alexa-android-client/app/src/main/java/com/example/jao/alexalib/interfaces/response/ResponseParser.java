package com.example.jao.alexalib.interfaces.response;

import android.util.Log;

import com.example.jao.alexalib.data.Directive;
import com.example.jao.alexalib.interfaces.AvsException;
import com.example.jao.alexalib.interfaces.AvsItem;
import com.example.jao.alexalib.interfaces.AvsResponse;
import com.example.jao.alexalib.interfaces.alerts.AvsSetAlertItem;
import com.example.jao.alexalib.interfaces.audioplayer.AvsPlayAudioItem;
import com.example.jao.alexalib.interfaces.audioplayer.AvsPlayRemoteItem;
import com.example.jao.alexalib.interfaces.errors.AvsResponseException;
import com.example.jao.alexalib.interfaces.playbackcontrol.AvsMediaNextCommandItem;
import com.example.jao.alexalib.interfaces.playbackcontrol.AvsMediaPauseCommandItem;
import com.example.jao.alexalib.interfaces.playbackcontrol.AvsMediaPlayCommandItem;
import com.example.jao.alexalib.interfaces.playbackcontrol.AvsMediaPreviousCommandItem;
import com.example.jao.alexalib.interfaces.playbackcontrol.AvsReplaceAllItem;
import com.example.jao.alexalib.interfaces.playbackcontrol.AvsReplaceEnqueuedItem;
import com.example.jao.alexalib.interfaces.speaker.AvsAdjustVolumeItem;
import com.example.jao.alexalib.interfaces.speaker.AvsSetMuteItem;
import com.example.jao.alexalib.interfaces.speaker.AvsSetVolumeItem;
import com.example.jao.alexalib.interfaces.speechrecognizer.AvsExpectSpeechItem;
import com.example.jao.alexalib.interfaces.speechsynthesizer.AvsSpeakItem;
import com.google.gson.Gson;
import com.google.gson.JsonParseException;

//import org.apache.commons.fileupload.MultipartStream;
import org.apache.commons.fileupload.MultipartStream;
import org.apache.commons.io.IOUtils;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static okhttp3.internal.Util.UTF_8;

/**
 * Static helper class to parse incoming responses from the Alexa server and generate a corresponding
 * {@link AvsResponse} item with all the directives matched to their audio streams.
 *
 * @author will on 5/21/2016.
 */
public class ResponseParser {

    public static final String TAG = "ResponseParser";

    /**
     * Get the AvsItem associated with a Alexa API post/get, this will contain a list of {@link AvsItem} directives,
     * if applicable.
     * @param stream the input stream as a result of our  OkHttp post/get calls
     * @param boundary the boundary we're using to separate the multiparts
     * @return the parsed AvsResponse
     * @throws IOException
     */

    public static AvsResponse parseResponse(InputStream stream, String boundary) throws IOException, IllegalStateException, AvsException {
        long start = System.currentTimeMillis();

        List<Directive> directives = new ArrayList<>();
        HashMap<String, ByteArrayInputStream> audio = new HashMap<>();

        byte[] bytes = IOUtils.toByteArray(stream);
        String responseString = string(bytes);

        MultipartStream mpStream = new MultipartStream(new ByteArrayInputStream(bytes), boundary.getBytes(), 100000, null);

        Pattern pattern = Pattern.compile("<(.*?)>");

        //have to do this otherwise mpStream throws an exception
        if(mpStream.skipPreamble()){
            Log.i(TAG, "Found initial boundary: true");

            //we have to use the count hack here because otherwise readBoundary() throws an exception
            // jao-note: count < 1 handling only one encapsulation in body
            int count = 0;
            while (count < 1 || mpStream.readBoundary()) {
                String headers = mpStream.readHeaders();
                ByteArrayOutputStream data = new ByteArrayOutputStream();
                mpStream.readBodyData(data);
                if (!isJson(headers)) {
                    // get the audio data
                    //convert our multipart into byte data
                    String contentId = getCID(headers);
                    if(contentId != null) {
                        Matcher matcher = pattern.matcher(contentId);
                        if (matcher.find()) {
                            String currentId = "cid:" + matcher.group(1);
                            audio.put(currentId, new ByteArrayInputStream(data.toByteArray()));
                        }
                    }
                } else {
                    // get the json directive
                    String directive = data.toString(Charset.defaultCharset().displayName());
                    directives.add(getDirective(directive));
                }
                count++;
            }

        }else {

            Log.i(TAG, "Response Body: \n" + string(bytes));
            try {
                directives.add(getDirective(responseString));
            }catch (JsonParseException e) {
                e.printStackTrace();
                throw new AvsException("Response from Alexa server malformed. ");
            }
        }

        AvsResponse response = new AvsResponse();

        for(Directive directive: directives){

            Log.i(TAG, "Parsing directive type: "+directive.getHeader().getNamespace()+":"+directive.getHeader().getName());

            if(directive.isPlayBehaviorReplaceAll()){
                response.add(0, new AvsReplaceAllItem(directive.getPayload().getToken()));
            }
            if(directive.isPlayBehaviorReplaceEnqueued()){
                response.add(new AvsReplaceEnqueuedItem(directive.getPayload().getToken()));
            }

            AvsItem item = null;

            if(directive.isTypeSpeak()){
                String cid = directive.getPayload().getUrl();
                ByteArrayInputStream sound = audio.get(cid);
                item = new AvsSpeakItem(directive.getPayload().getToken(), cid, sound);
            }else if(directive.isTypePlay()){
                String url = directive.getPayload().getAudioItem().getStream().getUrl();
                if(url.contains("cid:")){
                    ByteArrayInputStream sound = audio.get(url);
                    item = new AvsPlayAudioItem(directive.getPayload().getToken(), url, sound);
                }else{
                    item = new AvsPlayRemoteItem(directive.getPayload().getToken(), url, directive.getPayload().getAudioItem().getStream().getOffsetInMilliseconds());
                }
            }else if(directive.isTypeSetAlert()){
                item = new AvsSetAlertItem(directive.getPayload().getToken(), directive.getPayload().getType(), directive.getPayload().getScheduledTime());
                response.add(item);
            }else if(directive.isTypeSetMute()){
                item = new AvsSetMuteItem(directive.getPayload().getToken(), directive.getPayload().isMute());
            }else if(directive.isTypeSetVolume()){
                item = new AvsSetVolumeItem(directive.getPayload().getToken(), directive.getPayload().getVolume());
            }else if(directive.isTypeAdjustVolume()){
                item = new AvsAdjustVolumeItem(directive.getPayload().getToken(), directive.getPayload().getVolume());
            }else if(directive.isTypeExpectSpeech()){
                item = new AvsExpectSpeechItem(directive.getPayload().getToken(), directive.getPayload().getTimeoutInMilliseconds());
            }else if(directive.isTypeMediaPlay()){
                item = new AvsMediaPlayCommandItem(directive.getPayload().getToken());
            }else if(directive.isTypeMediaPause()){
                item = new AvsMediaPauseCommandItem(directive.getPayload().getToken());
            }else if(directive.isTypeMediaNext()){
                item = new AvsMediaNextCommandItem(directive.getPayload().getToken());
            }else if(directive.isTypeMediaPrevious()){
                item = new AvsMediaPreviousCommandItem(directive.getPayload().getToken());
            }else if(directive.isTypeException()){
                item = new AvsResponseException(directive);
            }

            if(item != null){
                response.add(item);
            }
        }

        Log.i(TAG, "Parsing response took: " + (System.currentTimeMillis() - start));

        return response;
    }


    private static final String string(byte[] bytes) throws IOException {
        return new String(bytes, UTF_8);
    }

    /**
     * Parse our directive using Gson into an object
     * @param directive the string representation of our JSON object
     * @return the reflected directive
     */
    private static Directive getDirective(String directive){
        Gson gson = new Gson();
        Directive.DirectiveWrapper wrapper = gson.fromJson(directive, Directive.DirectiveWrapper.class);
        if(wrapper.getDirective() == null){
            return gson.fromJson(directive, Directive.class);
        }
        return wrapper.getDirective();
    }


    /**
     * Get the content id from the return headers from the AVS server
     * @param headers the return headers from the AVS server
     * @return a string form of our content id
     */
    private static String getCID(String headers) throws IOException {
        final String contentString = "Content-ID:";
        BufferedReader reader = new BufferedReader(new StringReader(headers));
        for (String line = reader.readLine(); line != null; line = reader.readLine()) {
            if (line.startsWith(contentString)) {
                return line.substring(contentString.length()).trim();
            }
        }
        return null;
    }

    /**
     * Check if the response is JSON (a validity check)
     * @param headers the return headers from the AVS server
     * @return true if headers state the response is JSON, false otherwise
     */
    private static boolean isJson(String headers) {
        if (headers.contains("application/json")) {
            return true;
        }
        return false;
    }
}
