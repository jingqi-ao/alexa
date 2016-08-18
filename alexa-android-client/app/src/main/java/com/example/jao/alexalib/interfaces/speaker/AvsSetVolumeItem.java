package com.example.jao.alexalib.interfaces.speaker;

import com.example.jao.alexalib.interfaces.AvsItem;

/**
 * Directive to set the device volume
 */
public class AvsSetVolumeItem extends AvsItem {

    long volume;


    public AvsSetVolumeItem(String token, long volume){
        super(token);
        this.volume = volume;
    }

    public long getVolume() {
        return volume;
    }
}
