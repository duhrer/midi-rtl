/*

 A harness to handle passing "noteOn", "noteOff", and "pitchbend" events to a synth.  Designed to work with grades
 that extend `cheatar`.

 */
/* globals flock */
(function (fluid, flock) {
    "use strict";
    fluid = fluid || require("infusion");
    flock = flock || require("flocking");

    var environment = flock.init(); // eslint-disable-line no-unused-vars

    var midiRtl = fluid.registerNamespace("midiRtl");

    midiRtl.invertAndRelayMessage = function (that, payload) {
        var payloadAsJson = flock.midi.read(payload);
        var destination = fluid.get(that, "midiOutputSelector.connection");
        if (destination) {
            if (that.model.mode === "rtl" && (payloadAsJson.type === "noteOn"|| payloadAsJson.type === "noteOff")) {
                var invertedJsonPayload = fluid.copy(payloadAsJson);
                // Flip the pitch, but ensure that it's not possible to end up with a negative pitch.
                invertedJsonPayload.note = Math.max(124 - invertedJsonPayload.note, 0);
                destination.sendRaw(flock.midi.write(invertedJsonPayload));
            }
            else {
                destination.sendRaw(payload);
            }
        }
    };

    midiRtl.filterKeyPress = function (that, event) {
        if (event.keyCode === 13) {
            that.updateMode(event);
        }
    };

    midiRtl.updateMode = function (that, event) {
        event.preventDefault();

        var allSelectors = that.locate("modeSelector");
        $(allSelectors).removeClass("active");

        var mode = event.currentTarget.getAttribute("mode");
        $(event.currentTarget).addClass("active");
        that.applier.change("mode", mode);
    };


    fluid.defaults("midiRtl", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            midiInputSelector:  "#input-selector",
            midiOutputSelector: "#output-selector",
            modeSelector:       ".mode-selector"
        },
        model: {
            mode: "rtl"
        },
        components: {
            enviro: "{flock.enviro}",
            // TODO: Save the current settings to a cookie and attempt to use them on startup.
            midiInputSelector: {
                type: "flock.ui.midiConnector",
                container: "{that}.dom.midiInputSelector",
                options: {
                    portType: "input",
                    strings: {
                        selectBoxLabel: "MIDI Input:"
                    },
                    components: {
                        connection: {
                            options: {
                                listeners: {
                                    raw: {
                                        funcName: "midiRtl.invertAndRelayMessage",
                                        args:     ["{midiRtl}", "{arguments}.0.data"]
                                    }
                                },
                                sysex: true
                            }
                        }
                    }
                }
            },
            midiOutputSelector: {
                type: "flock.ui.midiConnector",
                container: "{that}.dom.midiOutputSelector",
                options: {
                    portType: "output",
                    strings: {
                        selectBoxLabel: "MIDI Output:"
                    },
                    distributeOptions: {
                        source: "{that}.options.selectBoxLabel",
                        target: "{that fluid.ui.selectbox}.options.strings.selectBoxLabel"
                    },
                    components: {
                        connection: {
                            options: {
                                sysex: true
                            }
                        }
                    }
                }
            }
        },
        invokers: {
            filterKeyPress: {
                funcName: "midiRtl.filterKeyPress",
                args:     ["{that}", "{arguments}.0"] // event
            },
            updateMode: {
                funcName: "midiRtl.updateMode",
                args:     ["{that}", "{arguments}.0"] // event
            }

        },
        listeners: {
            "onCreate.startEnvironment": {
                func: "{that}.enviro.start"
            },
            "onCreate.bindModeSelectKeyPress": {
                "this": "{that}.dom.modeSelector",
                method: "keydown",
                args:   "{that}.filterKeyPress"
            },
            "onCreate.bindModeSelectClick": {
                "this": "{that}.dom.modeSelector",
                method: "click",
                args:   "{that}.updateMode"
            }
        }
    });
})(fluid, flock);
