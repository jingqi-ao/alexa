package com.example.jao.alexalib.interfaces.alerts;

import com.example.jao.alexalib.interfaces.AvsItem;

/**
 * An AVS Item to handle setting alerts on the device
 */
public class AvsSetAlertItem extends AvsItem {
    private String type;
    private String scheduledTime;

    /**
     * Create a new AVSItem directive for an alert
     *
     * @param token the alert identifier
     * @param type the alert type
     * @param scheduledTime the alert time
     */
    public AvsSetAlertItem(String token, String type, String scheduledTime){
        super(token);
        this.type = type;
        this.scheduledTime = scheduledTime;
    }
}
