package com.example.jao.alexalib.interfaces.audioplayer;

import android.net.Uri;

import com.example.jao.alexalib.interfaces.AvsItem;

/**
 * Directive to play a local content item, this is not generated from the Alexa servers, this is for local
 * use only.
 */
public class AvsPlayContentItem extends AvsItem {
    private Uri mUri;

    /**
     * Create a new local play item
     * @param uri the local URI
     */
    public AvsPlayContentItem(String token, Uri uri){
        super(token);
        mUri = uri;
    }
    public Uri getUri(){
        return mUri;
    }
}
