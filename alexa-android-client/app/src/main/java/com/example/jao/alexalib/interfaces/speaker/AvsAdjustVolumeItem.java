package com.example.jao.alexalib.interfaces.speaker;

import com.example.jao.alexalib.interfaces.AvsItem;

/**
 * Directive to adjust the device volume
 */
public class AvsAdjustVolumeItem extends AvsItem {
    private long adjustment;

    /**
     * @param adjustment the direction and amount of adjustment (1, -1).
     */
    public AvsAdjustVolumeItem(String token, long adjustment){
        super(token);
        this.adjustment = adjustment;
    }

    public long getAdjustment() {
        return adjustment;
    }
}