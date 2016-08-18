package com.example.jao.alexalib.interfaces.system;

import com.example.jao.alexalib.data.Event;
import com.example.jao.alexalib.interfaces.SendEvent;

import org.jetbrains.annotations.NotNull;

/**
 * Synchronize state Event to open a synchonize the state with the server
 * and get pending Directive
 */
public class SynchronizeStateEvent extends SendEvent {
    @NotNull
    @Override
    protected String getEvent() {
        return Event.getSynchronizeStateEvent();
    }
}
