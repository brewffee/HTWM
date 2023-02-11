// TODO: Frame handle cursor feedback
// TODO: Fix button css
// TODO: Prefix "htwm-" to all elements, attributes, classes, and ids ( prevent conflicts )
// And so on !!

// This code is messy, possible rewrite ??

let browser = window; // for readability, as the objects we use are called 'windows'

// ############################

// HTWM get function, should replace any standard js functions
const __get = (attr, value) => document.querySelector(`[${attr}="${value}"]`); // htwm-${attr} later

// get function for already existing elements
const __getFrom = (parent, attr, value) => parent.querySelector(`[${attr}="${value}"]`);

// NOTE: This will be redone, as elements will be structured as <htwm-window>, <htwm-titlebar>, as opposed to 
// <window>, <div id="titlebar">, etc.

// for getting attributes
const __getAttr = (element, attr) => element.getAttribute(`htwm-${attr}`);

// ############################

// Applies standard window events to designated objects
// (moving, resizing, and window order)
const __recieveEvents = (reciever /* window */) => {

    // Move event
    __getFrom(reciever, "id", "titlebar").addEventListener("mousedown", ({ clientX, clientY, target }) => {
        // if maximized or holding a button, don't move
        //if (reciever.getAttribute("htwm-maximized") || target.tagName == "BUTTON") return;
        if (__getAttr(reciever, "maximized") || target.tagName == "BUTTON") return;
        

        let x = clientX - reciever.offsetLeft;
        let y = clientY - reciever.offsetTop;

        const move = ({ clientX, clientY }) => {
            if (clientY - y < 0) return;

            reciever.style.left = clientX - x + "px";
            reciever.style.top = clientY - y + "px";
        }

        browser.addEventListener("mousemove", move);

        browser.addEventListener("mouseup", function () { 
            removeEventListener("mousemove", move);
        });
    });

    // Resize event
    __getFrom(reciever, "id", "frame").addEventListener("mousedown", ({ clientX, clientY }) => {
        // if the window isn't resizable or is maximized, don't resize
        if (!__getAttr(reciever, "resizable") || __getAttr(reciever, "maximized")) return;

        // what edge of the frame is being clicked?
        let x = clientX - reciever.offsetLeft;
        let y = clientY - reciever.offsetTop;

        // determine current edge (this could be done a little better)
        let edge = "";
        if (y < 6) edge += "n";
        if (y > reciever.offsetHeight - 6) edge += "s";
        if (x > reciever.offsetWidth - 6) edge += "e";
        if (x < 6) edge += "w";

        // { top, left, width, height }
        let winTransform = {};

        const resize = ({ clientX, clientY }) => {

            // N/S transformation
            if (edge.includes("n")) {
                winTransform.top = Math.min(Math.max(clientY - 6, 0), browser.innerHeight - reciever.offsetHeight) + "px",
                winTransform.height = Math.min(Math.max(reciever.offsetHeight + reciever.offsetTop - clientY + 6, 0), browser.innerHeight) + "px"

                // border/min-size check
                let height = parseInt(winTransform.height.slice(0, -2));

                // TODO: move minimum window size to a global var
                if (height >= 64 && clientY >= 6 && clientY <= browser.innerHeight - 6) {
                    Object.assign(reciever.style, winTransform);
                }
            } else if (edge.includes("s")) {
                winTransform.height = Math.min(Math.max(clientY - reciever.offsetTop, 0), browser.innerHeight - reciever.offsetTop) + "px"
                
                // border/min-size check
                let height = parseInt(winTransform.height.slice(0, -2));

                // TODO: move minimum window size to a global var
                if (height >= 64 && clientY >= 6 && clientY <= browser.innerHeight - 6) {
                    Object.assign(reciever.style, winTransform);
                }
            }
            
            // E/W transformation
            if (edge.includes("e")) {
                winTransform.width = Math.min(Math.max(clientX - reciever.offsetLeft, 0), browser.innerWidth - reciever.offsetLeft) + "px";

                // border/min-size check
                let width = parseInt(winTransform.width.slice(0, -2));
                
                // TODO: move minimum window size to a global var
                if (width >= 64 && clientX >= 6 && clientX <= browser.innerWidth - 6) {
                    Object.assign(reciever.style, winTransform);
                }
            } else if (edge.includes("w")) {
                winTransform.left = Math.min(Math.max(clientX - 6, 0), browser.innerWidth - reciever.offsetWidth) + "px";
                winTransform.width = Math.min(Math.max(reciever.offsetWidth + reciever.offsetLeft - clientX + 6, 0), browser.innerWidth) + "px";

                // border/min-size check
                let width = parseInt(winTransform.width.slice(0, -2));

                // TODO: move minimum window size to a global var
                if (width >= 64 && clientX >= 6 && clientX <= browser.innerWidth - 6) {
                    Object.assign(reciever.style, winTransform);
                }
            }

            // TODO: fix resize check bug; move check and 
            // final assign here

        }

        browser.addEventListener("mousemove", resize);

        browser.addEventListener("mouseup", function () { 
            removeEventListener("mousemove", resize);
        });
    });

    // Update window order
    // TODO: could this be done a little better ?
    reciever.addEventListener("mousedown", () => {
        let windows = document.querySelectorAll("window");
        let highest = 0;
        for (let i = 0; i < windows.length; i++) {
            let z = parseInt(windows[i].style.zIndex);
            if (z > highest) highest = z;
        }
        reciever.style.zIndex = highest + 1;
    });
}


let defaultWindowOptions = { // mfw no typescript
    uid: null,
    title: "Untitled",
    content: "",
    resizable: true,
    scrollable: true,
    buttons: ["close"],
    width: 300, height: 200
}

// Creates a new window
const __createWindow = (options) => {
    // override default options
    options = Object.assign(defaultWindowOptions, options);
    let { uid, title, content, resizable, scrollable, buttons, width, height } = options;

    // TODO: Prevent windows from being created with the same uid, or invalid values
    
    let win = document.createElement("window");
    win.setAttribute("htwm-uid", uid);
    win.setAttribute("htwm-resizable", resizable);

    console.log("creating buttons", buttons);

    win.innerHTML = `
        <hbox id="titlebar">
            <label id="title">${title}</label>
            <hbox id="titlebar-buttonarea">
                ${buttons.includes("menu") ? `<button htwm-btn-type="menu" onclick="HTWM.openMenu('${uid}')"></button>` : ""}
                ${buttons.includes("minimize") ? `<button htwm-btn-type="minimize" onclick="HTWM.minimizeWindow('${uid}')"></button>` : ""}
                ${buttons.includes("maximize") ? `<button htwm-btn-type="maximize" onclick="HTWM.maximizeWindow('${uid}')"></button>` : ""}
                ${buttons.includes("close") ? `<button htwm-btn-type="close" onclick="HTWM.closeWindow('${uid}')"></button>` : ""}
            </hbox>
        </hbox>
        <div id="content" ${scrollable ? "htwm-scrollable" : ""}>
            ${content}
        </div>
        <div id="frame"></div>
    `;

    // set window size
    win.style.width = width + "px";
    win.style.height = height + "px";

    // add window to the DOM
    document.body.appendChild(win);

    // subscribe to window events
    __recieveEvents(win);

    console.log("window created");

}

// Deletes a window
const __destroyWindow = (uid) => {
    let win = document.querySelector(`window[htwm-uid="${uid}"]`);
    if (win) win.remove();
}

// Subscribes any existing windows in the HTML to window events
const __subscribeWindows = () => {
    let windows = document.querySelectorAll("window");
    windows.forEach((win) => {
        __recieveEvents(win);
    });
}

// ###############################

// TODO: Maximize, raise, and restore window

// Minimize window
const __minimizeWindow = (uid) => {
    let win = document.querySelector(`window[htwm-uid="${uid}"]`);
    if (!win) return;

    win.setAttribute("htwm-minimized", true);

    __getFrom(win, "id", "frame").style.display = 'none';
    __getFrom(win, "id", "content").style.display = 'none';

    // TODO: If there's a taskbar present, we'll give this 
    // function different behavior
}

// TODO: Give windows a menu item, and add right-click to titlebar
// and taskbar objects (<menu> ... </menu>)

// ###############################

// Settings

// Disables the context menu, necessary for some HTWM functions
__setContextMenuDisabled = (value) => {
    if (value) window.oncontextmenu = () => false;
}

// TODO: Use this var when handling right click events
let __contextMenuDisabled = false;

// ###############################

// Group all functions into an object
const HTWM = {
    recieveEvents: __recieveEvents,
    createWindow: __createWindow,
    closeWindow: __destroyWindow,
    maximizeWindow: null /* TODO: implement */,
    minimizeWindow: __minimizeWindow,
    openMenu: null /* TODO: implement */,
    subscribeWindows: __subscribeWindows,

    contextMenuDisabled: __contextMenuDisabled,
    setContextMenuDisabled: __setContextMenuDisabled,
}

// ###############################
