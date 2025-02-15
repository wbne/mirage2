import { clearLogs } from './debugging.js';
import { updateStateEvent } from './main.js';
const controlPanel = document.querySelector("#controlPanel");

// Random State
const randStateButton = document.createElement('button');
randStateButton.onclick = function() {
    const theModel = document.querySelector('model-avatar');
    theModel.setRandomState();
};
randStateButton.textContent = 'Set Random State';
controlPanel.appendChild(randStateButton);

// Set Specific States
const states = document.querySelector('model-avatar').potentialStates;
states.forEach(element => {
    const button = document.createElement('button');
    button.style.textTransform = 'capitalize';
    button.onclick = function() {
        updateStateEvent(`${element}`);
    }
    button.textContent = `${element}`;
    controlPanel.appendChild(button);
});

// Clear Logs
const clearLogsButton = document.createElement('button');
clearLogsButton.onclick = function() {clearLogs()};
clearLogsButton.textContent = 'Clear Logs';
controlPanel.appendChild(clearLogsButton);

// Stop audio input
const stopAudioButton = document.createElement('button');
stopAudioButton.setAttribute('class', 'stopAudio');
stopAudioButton.textContent = 'Stop Audio Streaming';
controlPanel.appendChild(stopAudioButton);

// Resume audio input
const resumeAudioButton = document.createElement('button');
resumeAudioButton.setAttribute('class', 'resumeAudio');
resumeAudioButton.textContent = 'Resume Audio Streaming';
controlPanel.appendChild(resumeAudioButton);

// Mock audio input

// Mock audio -> text input

// Mock text -> sentiment input