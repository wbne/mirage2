import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers";
let sentiment_model = null;
let toxic_model = null;

onmessage = (e) => {
    const message = e.data.command
    if(message === 'sentimentify') {
        sentimentify(e.data.data);
    }
    else if (message === 'load'){
        sniffsniffsniff();
    }
}

async function sniffsniffsniff() {
    let sentiment = pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    let toxic = pipeline('text-classification', 'Xenova/toxic-bert');
    sentiment.then((m1) => {
        toxic.then((m2) => {
            console.log("[SETUP] finished loading sentimentify")
            sentiment_model = m1;
            toxic_model = m2;            
            postMessage({
                command: "success",
                data: ""
            });
        })
    })
}

async function sentimentify(text) {
    // Clean up the text 
    //  Remove sound effects if it's problematic
    //  Remove extra spaces
    // Send into both classifiers
    //  Two seperate web workers? not sure how I wanna do this
    let sentimentResponse = await sentiment_model(text, { top_k: null })
    let toxicRepsonse = await toxic_model(text, { top_k: null })
    // console.log(sentimentResponse)
    // console.log(toxicRepsonse)

    // With both responses, go through flowchart to determine custom emotion
    let positivity = 0;
    if(sentimentResponse[0].label == 'POSITIVE') {
        positivity = sentimentResponse[0].score;
    }
    else {
        positivity = 1 - sentimentResponse[0].score;
    }
    let toxicity = toxicRepsonse[0].score;
    // console.log(positivity, toxicity)
    // Emit the custom emotion event to the model

    const POSITIVE_THRESHOLD = 0.6;
    const TOXIC_THRESHOLD = 0.7;
    const NEGATIVE_THRESHOLD = 0.4
    // Positive
    //  |- Toxic = Evilge
    //  |- Not-Toxic = Happy
    if(positivity > POSITIVE_THRESHOLD) {
        if(toxicity > TOXIC_THRESHOLD) {
            // evil
            console.log("evil")
            postMessage({
                command: "mood",
                data: "evil"
            });
        }
        else {
            // happy
            console.log("happy")
            postMessage({
                command: "mood",
                data: "happy"
            });
        }
    }
    // Negative
    //  |- Toxic = Angry
    //  |- Not-Toxic = Sad
    else if(positivity < NEGATIVE_THRESHOLD) {
        if(toxicity > TOXIC_THRESHOLD) {
            // angry
            console.log("angry")
            postMessage({
                command: "mood",
                data: "angry"
            });
        }
        else {
            // sad
            console.log("sad")
            postMessage({
                command: "mood",
                data: "sad"
            });
        }
    }
    // Neutral (40-60 either way)
    //  |- Toxic = Neutral (Sarcastic)
    //  |- Not-Toxic = Neutral
    else {
        // neutral
        console.log("neutral")
        postMessage({
            command: "mood",
            data: "talking"
        });
    }
}