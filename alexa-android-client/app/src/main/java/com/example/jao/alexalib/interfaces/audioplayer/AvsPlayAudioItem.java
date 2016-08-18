package com.example.jao.alexalib.interfaces.audioplayer;

import com.example.jao.alexalib.interfaces.speechsynthesizer.AvsSpeakItem;

import java.io.ByteArrayInputStream;
import java.io.IOException;

/**
 * Directive to play a local, returned audio item
 */
public class AvsPlayAudioItem extends AvsSpeakItem {
    public AvsPlayAudioItem(String token, String cid, ByteArrayInputStream audio) throws IOException {
        super(token, cid, audio);
    }
}