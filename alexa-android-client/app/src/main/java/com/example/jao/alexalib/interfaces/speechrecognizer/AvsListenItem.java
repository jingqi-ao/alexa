package com.example.jao.alexalib.interfaces.speechrecognizer;

// Note: why needs extension?

/**
 * Directive to prompt the user for a speech input
 */

@Deprecated
public class AvsListenItem extends AvsExpectSpeechItem {
    public AvsListenItem(){
        this(null, 2000);
    }
    public AvsListenItem(String token, long timeoutInMiliseconds) {
        super(token, timeoutInMiliseconds);
    }

}
