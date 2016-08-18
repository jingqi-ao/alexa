package com.example.jao.alexalib.interfaces.playbackcontrol;

import com.example.jao.alexalib.interfaces.AvsItem;

// Directive to replace all items in the queue, but leave the playing item
public class AvsReplaceEnqueuedItem extends AvsItem {
    public AvsReplaceEnqueuedItem(String token) {
        super(token);
    }
}