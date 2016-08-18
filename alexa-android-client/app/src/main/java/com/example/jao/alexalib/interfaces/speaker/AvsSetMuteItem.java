package com.example.jao.alexalib.interfaces.speaker;

import com.example.jao.alexalib.interfaces.AvsItem;

/**
 * Directive to set the device mute state
 */
public class AvsSetMuteItem extends AvsItem {

    boolean mute;

    public AvsSetMuteItem(String token, boolean mute){
        super(token);
        this.mute = mute;
    }

    public boolean isMute() {
        return mute;
    }
}
