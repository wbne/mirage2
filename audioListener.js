import { updateStateEvent } from "./main.js";
import { logEvent } from "./debugging.js";
// Note: I probably want to allocate this to a separate web worker
// Note 2: Now the function is dependent on the audioToText.js file to run
export function startListening(transcriber) {
    // If user media is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
        .getUserMedia(
            // constraints - only audio needed for this app
            {
            audio: true,
            },
        )
        // Success callback
        .then((stream) => {
                const stopButton = document.querySelector('.stopAudio');
                const resumeButton = document.querySelector('.resumeAudio');
                const mediaRecorder = new MediaRecorder(stream);
                const audioContext = new AudioContext();
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.smoothingTimeConstant = 0.8;
                analyser.fftSize = 1024;
                source.connect(analyser);

                mediaRecorder.start(1000);
                logEvent(`A2L: Recorder is now: ${mediaRecorder.state}`)

                // Setup stopping button in controls
                stopButton.onclick = () => {
                    stopping = true;
                    chunks = [];
                    mediaRecorder.stop();
                    logEvent(`A2L: Recorder is now: ${mediaRecorder.state}`)
                };
                resumeButton.onclick = () => {
                    if(mediaRecorder.state == 'inactive') {
                        stopping = false;
                        chunks = [];
                        logEvent("A2L: Recorder is attempting to resume")
                        mediaRecorder.start(1000); 
                        logEvent(`A2L: Recorder is now: ${mediaRecorder.state}`)
                    }
                };

                let chunks = [];
                let HEADER = null;
                let stopping = false;
                mediaRecorder.ondataavailable = (e) => {
                    // Determining if a noise has been made
                    const array = new Uint8Array(analyser.fftSize);
                    analyser.getByteTimeDomainData(array);
                    const peak = array.reduce((max, current) => Math.max(max, Math.abs(current - 127)), 0) / 128;
                    if(!HEADER) { // There seems to be some metadata that's only present at the start
                        HEADER = e.data;
                    }
                    chunks.push(e.data);
                    if(peak > 0.008 && !stopping) { //hardcoded for now
                        // Creating WAV object and sending elsewhere
                        // updateStateEvent('talking');
                        const blob = new Blob([...chunks], {'type' : 'audio/wav; codecs=0'});
                        const audioURL = window.URL.createObjectURL(blob);
                        transcriber(audioURL).then((result) => {
                            const transcribedText = result.text;
                            logEvent(`A2L: ${transcribedText}`)
                            window.URL.revokeObjectURL(audioURL);
                            sentimentify(transcribedText);
                        });
                    }
                    else {
                        // Note: Probably have a "previous state" in the model so it doesn't default to neutral
                        // OR if I go with model components I just need to turn the mouth to its previous state
                        updateStateEvent('neutral');
                    }
                    if(chunks.length > 5) {
                        if(!stopping) {
                            stopping = true;
                            // logEvent("A2L: RESTARTING RECORDER")
                            mediaRecorder.stop();
                        }
                    }
                };

                mediaRecorder.onstop = () => {
                    if(chunks.length > 5) {
                        chunks = [];
                        mediaRecorder.start(1000);
                        // logEvent("A2L: RE-LISTENING")
                        // logEvent(`A2L: Recorder is now: ${mediaRecorder.state}`)
                        stopping = false;
                    }
                }
        })
    
        // Error callback
        .catch((err) => {
            console.error(`The following getUserMedia error occurred: ${err}`);
        });
    } else {
        console.error("getUserMedia not supported on your browser!");
    }
} 