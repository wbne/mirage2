# mirage2
a rewritten version of my original pngtuber application

Q: Why does it only work in Chrome?
A: Because of the experimental feature which allows ANY HTML element to be a Picture-In-Picture 

Q: Are there other Chrome-only things at the moment?
A: Yes. WebGL is the other feature which is currently used to speed up transformer.js models

Q: Why vanilla JS?
A: I wanted to get better at JS and explore Browser APIs by working on each feature hands-on

Q: Why transformers.js?
A: There was a weekly newsletter that mentioned whisper.js and I knew I wanted to use it.
   I had previously worked on a similar project (Mirage) that was a Java version of this project.
   However I got stuck on the realtime audio to sentiment analysis portion since I couldn't even get Sphinx to properly transcribe my voice. All of that just to eat up 5GB+ of RAM meant that the project was abandoned.

Q: Web Workers?
A: Yes I initially wanted to use Web Workers to just load in the models but most browsers don't support the
   level of object cloning that my models required. In addition web workers don't have access to the global
   scope so there was no real good way to load the model from the worker to the main thread.
   As a result I had to redesign the application a little but I think it's a net positive since it makes 
   sense to run each computationally intensive task (sentiment analysis or speech transcribing) on a 
   separate thread while the main thread handles communication, the DOM, and the avatar.