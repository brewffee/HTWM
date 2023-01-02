// TODO: Fix height in titlebar when implemented in existing HTML

let browser = window; // for readability, as the objects we use are called 'windows'

// Applies standard window events to designated objects
// (moving, resizing, and window order)
const __recieveEvents = (reciever /* window */) => {

    // Move event
    reciever.querySelector("#titlebar").addEventListener("mousedown", ({ clientX, clientY }) => {
        // if on a button or maximized, don't move
        if (event.target.tagName == "BUTTON") return;
        if (reciever.getAttribute("maximized") == "true") return;

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
    reciever.querySelector("#frame").addEventListener("mousedown", ({ clientX, clientY }) => {
        // if the window isn't resizable or is maximized, don't resize
        if (reciever.getAttribute("resizable") == "false") return;
        if (reciever.getAttribute("maximized") == "true") return;

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
                    console.log(
                        "is height greater than 64?", height, height >= 64,
                    )
                    console.log(
                        "is clientY greater than 6?", clientY, clientY >= 6,
                    )
                    console.log(
                        "is clientY less than browser.innerHeight - 6?", clientY, clientY <= browser.innerHeight - 6,
                    )
                    Object.assign(reciever.style, winTransform);
                } else {
                    console.log("failed")
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

// Creates a new window
// TODO: use object-based args instead of positional
const __createWindow = (uid, title, content, resizable = true, scrollable = true, buttons = ["close"], width = 300, height = 200) => {
    let win = document.createElement("window");
    win.setAttribute("uid", uid);
    win.setAttribute("resizable", resizable);

    console.log("creating buttons", buttons);

    win.innerHTML = `
        <hbox id="titlebar">
            <label id="title">${title}</label>
            <hbox id="titlebar-buttonarea">
                ${buttons.includes("menu") ? `<button btn-type="menu" onclick="HTWM.openMenu('${uid}')">☰</button>` : ""}
                ${buttons.includes("minimize") ? `<button btn-type="minimize" onclick="HTWM.minimizeWindow('${uid}')">_</button>` : ""}
                ${buttons.includes("maximize") ? `<button btn-type="maximize" onclick="HTWM.maximizeWindow('${uid}')">[]</button>` : ""}
                ${buttons.includes("close") ? `<button btn-type="close" onclick="HTWM.closeWindow('${uid}')">X</button>` : ""}
            </hbox>
        </hbox>
        <div id="content" ${scrollable ? "scrollable" : ""}>
            ${content}
        </div>
        <div id="frame"></div>
    `;

    // Button actions are no longer defined here, but in global scope
    // TODO: move button actions to a global scope

    // set window size
    win.style.width = width + "px";
    win.style.height = height + "px";

    // add window to the DOM
    document.body.appendChild(win);

    // subscribe to window events
    __recieveEvents(win);
    return win;
}

// Deletes a window
const __destroyWindow = (uid) => {
    let win = document.querySelector(`window[uid="${uid}"]`);
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

// TODO: Maximize and restore window

// Minimize window
const __minimizeWindow = (uid) => {
    let win = document.querySelector(`window[uid="${uid}"]`);
    if (!win) return;

    win.setAttribute("minimized", true);
    win.style.display = "none";

    // TODO: Shade the window instead of hiding it 
    // (this will require a new attribute)

    // TODO: Add taskbar consideration (if enabled)     
}

// TODO: Give windows a menu item, and add right-click to titlebar
// and taskbar objects (<menu> ... </menu>)

// ###############################

// Group all functions into an object
const HTWM = {
    recieveEvents: __recieveEvents,
    createWindow: __createWindow,
    closeWindow: __destroyWindow,
    maximizeWindow: null /* TODO: implement */,
    minimizeWindow: null /* TODO: implement */,
    openMenu: null /* TODO: implement */,
    subscribeWindows: __subscribeWindows
}

// ###############################

/*window.onload = () => {
    // subscribe to all existing windows
    HTWM.subscribeWindows();

    HTWM.createWindow(0, "Hello World!", "This is a window!", true, true, ['close', 'minimize', 'maximize'], 300, 200);

    HTWM.createWindow(1, "Hello World!", 
        `
        <vbox>
            <img src="jhu.gif" style="height: 340px; width: 512px;">
        </vbox>
        `            
        , false, true,  ['close', 'minimize', 'maximize', 'menu'], 518, 372);
}*/


