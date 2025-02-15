import { startListening } from "./audioListener.js";
import { logEvent } from "./debugging.js";
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers";

/*
    Goal is to be the central file that controls all other files.
    Can be seen as the central node in regards to JS files.
    Since JS runs on a main thread, having a centralized source makes sense in my head.
*/
const isWorkerSupported = window.Worker ? true : false;
const isPiPSupported = window.documentPictureInPicture ? true : false;
const isAudioSupported = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
let transcribeWorker = null;
let sentimentWorker = null;

export function updateStateEvent(newState) {
    const event = new CustomEvent("updateState", {
        detail: {
            newState: `${newState}`,
        },
    });
    if(window.documentPictureInPicture.window) { // Here we make an assumption that any PiP is our avatar
        window.documentPictureInPicture.window.dispatchEvent(event);
    }
    else {
        document.querySelector('model-avatar').updateState(newState);
        window.dispatchEvent(event);
    }
}

export function growEars(transcriber) {
    // If user media is supported
    if (isAudioSupported) {
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

                mediaRecorder.start(1000); // Duration is a magic number
                logEvent(`[Transcribe] Recorder is now: ${mediaRecorder.state}`)

                stopButton.onclick = () => {
                    stopping = true;
                    chunks = [];
                    mediaRecorder.stop();
                    logEvent(`[Transcribe] Recorder is now: ${mediaRecorder.state}`)
                };
                resumeButton.onclick = () => {
                    if(mediaRecorder.state == 'inactive') {
                        stopping = false;
                        chunks = [];
                        logEvent("[Transcribe] Recorder is attempting to resume")
                        mediaRecorder.start(1000); 
                        logEvent(`[Transcribe] Recorder is now: ${mediaRecorder.state}`)
                    }
                };

                let chunks = [];
                let stopping = false;
                mediaRecorder.ondataavailable = (e) => {
                    // Determining if a noise has been made
                    const array = new Uint8Array(analyser.fftSize);
                    analyser.getByteTimeDomainData(array);
                    const peak = array.reduce((max, current) => Math.max(max, Math.abs(current - 127)), 0) / 128;
                    chunks.push(e.data);
                    if(peak > 0.008 && !stopping) { //hardcoded for now
                        // Creating WAV object and sending elsewhere
                        const blob = new Blob([...chunks], {'type' : 'audio/webm; codecs=opus'});
                        const audioURL = window.URL.createObjectURL(blob);
                        transcriber(audioURL).then((result) => {
                            const transcribedText = result.text;
                            logEvent(`[Transcribe] ${transcribedText}`)
                            window.URL.revokeObjectURL(audioURL);
                            sentimentWorker.postMessage(
                                {
                                    command: 'sentimentify',
                                    data: transcribedText
                                }
                            );
                        });
                    }
                    else {
                        // Note: Probably have a "previous state" in the model so it doesn't default to neutral
                        // OR if I go with model components I just need to turn the mouth to its previous state
                        updateStateEvent('neutral');
                    }
                    if(chunks.length > 5) { // Magic Number
                        if(!stopping) {
                            stopping = true;
                            mediaRecorder.stop();
                        }
                    }
                };
                mediaRecorder.onstop = () => {
                    if(chunks.length > 5) { // Same Magic Number
                        chunks = [];
                        mediaRecorder.start(1000);
                        stopping = false;
                    }
                }
        })
        .catch((err) => {
            console.error(`The following getUserMedia error occurred: ${err}`);
        });
    } else {
        console.error("getUserMedia not supported on your browser!");
    }
}

function loadSentimentModel() {
    sentimentWorker = new Worker("textToSentiment.js", { type: "module" });
    sentimentWorker.onmessage = (e) => {
        const message = e.data?.command;
        const data = e.data?.data;
        if(message === 'success') {

        }
        else if(message === 'mood') {
            console.log(data);
            updateStateEvent(data);
        }
        else {
            console.error("A fatal error has occured in the Sentiment WebWorker!");
        }
    }
    sentimentWorker.postMessage(
        {
            command: 'load',
            data: ''
        }
    );
}

/*
    So I tried forcing this into a WebWorker but there was one main problem: Copying a Blob.
    Current browsers don't allow complicated object cloning so the workaround was to
    cast the Blob into a Buffer Stream and then feed that into the Transcriber model.
    Unfortunately that sucked so much that I'd rather have the main thread handle Transcribing.
*/
function loadSpeech2TextModel() {
    transcribeWorker = new Worker("audioToText.js", { type: "module" });
    console.log("posted message to speech")
    transcribeWorker.onmessage = (e) => {
        const message = e.data.command;
        const data = e.data.data;
        if(message === 'success') {
            growEars();
        }
        else if(message === 'sentimentify') {
            sentimentWorker.postMessage(
                {
                    command: 'sentimentify',
                    data: data
                }
            );
        }
        else {
            console.error("TRANSCRIBER IT DIDN'T LOAD");
        }
    }
    transcribeWorker.postMessage(
        {
            command: 'load',
            data: ''
        }
    );
}

loadSentimentModel();
// loadSpeech2TextModel();
// This is the replacement to the shoddy WebWorker
const transcriber = pipeline(
    "automatic-speech-recognition", 
    "onnx-community/whisper-base.en",
    {
        device: "webgpu"
    },
);
transcriber.then((model) => {
    logEvent("[SETUP] finished loading the transcriber model"); 
    growEars(model);
});