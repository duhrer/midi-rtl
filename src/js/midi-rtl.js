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
            if (payloadAsJson.type === "noteOn"|| payloadAsJson.type === "noteOff") {
                var invertedJsonPayload = fluid.copy(payloadAsJson);
                invertedJsonPayload.note = 124 - invertedJsonPayload.note;
                destination.sendRaw(flock.midi.write(invertedJsonPayload));
            }
            else {
                destination.sendRaw(payload);
            }
        }
    };

    fluid.defaults("midiRtl", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            midiInputSelector:  "#input-selector",
            midiOutputSelector: "#output-selector"
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
        listeners: {
            "onCreate.startEnvironment": {
                func: "{that}.enviro.start"
            }
        }
    });
})(fluid, flock);
