const debuggingPanel = document.querySelector('#debugging');
window.addEventListener('stateUpdated', (e) => {
    // console.log(e.detail);
    const oldState = e.detail.oldState;
    const newState = e.detail.newState;
    const message = `${oldState} -> ${newState}`;
    // Disabled for now because it's not being tested
    // logEvent(message);
});

export function logEvent(message, append=true) {
    const date = new Date();
    const timestamp = `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] `;
    let log = `
    <h2>Debugging Panel</h2> 
    `;
    if(append) {
        log = `
           ${debuggingPanel.innerHTML}
           </br>
           ${timestamp}| ${message}
        `;
    }
    debuggingPanel.innerHTML = log;
}

export function clearLogs() {
    logEvent('', false);
}

