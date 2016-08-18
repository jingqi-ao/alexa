package com.example.jao.alexalib.interfaces.playbackcontrol;

// Note: not quite sure where it comes from

// Directive to replace all the items in the queue plus the currently playing item

import com.example.jao.alexalib.interfaces.AvsItem;

public class AvsReplaceAllItem extends AvsItem {
    public AvsReplaceAllItem(String token) {
        super(token);
    }
}