package com.example.jao.alexalib.interfaces.errors;

// Note: not quite sure where it comes from

import com.example.jao.alexalib.data.Directive;
import com.example.jao.alexalib.interfaces.AvsItem;

public class AvsResponseException extends AvsItem {
    Directive directive;
    public AvsResponseException(Directive directive) {
        super(null);
        this.directive = directive;
    }

    public Directive getDirective() {
        return directive;
    }
}
