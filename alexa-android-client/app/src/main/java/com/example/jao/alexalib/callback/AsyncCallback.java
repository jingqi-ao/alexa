package com.example.jao.alexalib.callback;

/**
 * A generic callback to handle four states of asynchronous operations
 */
public interface AsyncCallback<D, E>{
    void start();
    void success(D result);
    void failure(E error);
    void complete();
}