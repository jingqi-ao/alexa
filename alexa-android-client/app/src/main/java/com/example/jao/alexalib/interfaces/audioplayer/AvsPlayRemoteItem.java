package com.example.jao.alexalib.interfaces.audioplayer;

import com.example.jao.alexalib.interfaces.AvsItem;

/**
 * Directive to play a remote URL item
 *
 */
public class AvsPlayRemoteItem extends AvsItem {
    private String mUrl;
    private String mStreamId;
    private long mStartOffset;

    public AvsPlayRemoteItem(String token, String url, long startOffset) {
        super(token);
        mUrl = url;
        mStartOffset = (startOffset < 0) ? 0 : startOffset;
    }
    public String getUrl() {
        return mUrl;
    }

    public long getStartOffset() {
        return mStartOffset;
    }

}