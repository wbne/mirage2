import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers";
let transcriber_model = null;

onmessage = (e) => {
    console.log(e)
    const message = e.data.command;
    if(message === 'transcribe') {
        transcribe(transcriber_model, e.data.data);
    }
    else if (message === 'load'){
        sniffsniffsniffsniff()
    }
}

async function sniffsniffsniffsniff() {
    const transcriber = pipeline(
        "automatic-speech-recognition", 
        "onnx-community/whisper-base.en",
        {
            device: "webgpu"
        },
    );
    transcriber.then((model) => {
        console.log("finished loading"); 
        transcriber_model = model; 
        postMessage({
            command: "success",
            data: ""
        });
    });
}

async function transcribe(transcriber, blob) {
    // const audioURL = self.URL.createObjectURL(blob);
    // const arrayBuffer = await new Response(blob).arrayBuffer();
    // console.log(arrayBuffer)
    // const floatArr = new Float64Array(arrayBuffer);
    // const floatArr = read_audio(audioURL);
    // console.log(floatArr)
    transcriber(blob).then((result) => {
        const transcribedText = result.text;
        console.log(`A2L: ${transcribedText}`)
        postMessage({
            command: "sentimentify",
            data: transcribedText
        });
        // self.URL.revokeObjectURL(audioURL);
    })
} 