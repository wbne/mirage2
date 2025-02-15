class Model extends HTMLElement {
    static observedAttributes = ["color", "size"];
    potentialStates = ['neutral', 'happy', 'sad', 'mad', 'talking'];
    innerState = 'neutral';
    assetDir = './assets/';

    constructor() {
        // Always call super first in constructor
        super();
    }

    connectedCallback() {
        const root = this;
        if(!this.querySelector("#avatar")) {
            const defaultImage = this.assetDir + this.innerState + '.png';
            const avatar = document.createElement("img");
            avatar.setAttribute("id", "avatar");
            avatar.setAttribute("src", defaultImage);
            avatar.setAttribute("alt", "Avatar goes here.");
            this.appendChild(avatar);
        }
        console.log("Custom element added to page.");

        if("documentPictureInPicture" in window && document.querySelector(".no-pip")) {
            document.querySelector(".no-pip").remove();
            const togglePipButton = document.createElement("button");
            togglePipButton.textContent = "Toggle PiP";
            togglePipButton.addEventListener("click", this.togglePiP, false);
            document.querySelector(".pip-controller").appendChild(togglePipButton);
        }
    }

    setRandomState() {
        const randState = Math.floor(Math.random() * this.potentialStates.length);
        const newStateString = this.potentialStates[randState];
        this.updateState(newStateString);
    }

    updateState(newState) {
        const event = new CustomEvent("stateUpdated", {
            detail: {
                oldState: `${this.innerState}`,
                newState: `${newState}`,
            },
        });
        this.innerState = newState;
        const defaultImage = this.assetDir + this.innerState + '.png';
        const avatar = this.querySelector("#avatar");
        avatar.setAttribute("src", defaultImage);
        window.dispatchEvent(event);
    }

    async togglePiP() {
        const avatar = document.querySelector("model-avatar");
        // Early return if there's already a Picture-in-Picture window open
        if (window.documentPictureInPicture.window) {
            playerContainer.append(avatar);
            window.documentPictureInPicture.window.close();
            return;
        }

        // Open a Picture-in-Picture window.
        const pipWindow = await window.documentPictureInPicture.requestWindow({
            width: avatar.clientWidth,
            height: avatar.clientHeight,
        });

        // Add pagehide listener to handle the case of the pip window being closed using the browser X button
        pipWindow.addEventListener("pagehide", (event) => {
            document.querySelector("#avatarWrapper").append(avatar);
        });
        pipWindow.addEventListener('updateState', (event) => {
            avatar.updateState(event.detail.newState);
        });

        // Copy style sheets over from the initial document
        // so that the player looks the same.
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = './modelStyle.css';
        pipWindow.document.head.appendChild(link);

        // Move the player to the Picture-in-Picture window.
        pipWindow.document.body.append(avatar);
    }

    disconnectedCallback() {
        console.log("Custom element removed from page.");
    }

    adoptedCallback() {
        console.log("Custom element moved to new page.");
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} has changed.`);
    }
};
customElements.define('model-avatar', Model);