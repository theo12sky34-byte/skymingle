const chatBody = document.getElementById('chatBody');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const status = document.getElementById('status');
const nicknameInput = document.getElementById('nickname');
const roomsSelect = document.getElementById('rooms');
const newRoomInput = document.getElementById('newRoom');
const createRoomBtn = document.getElementById('createRoom');
const usersDiv = document.getElementById('users');

const APP_PREFIX = 'skymingle_demo_v1';
const roomsKey = `${APP_PREFIX}:rooms`;
const clearBtn = document.getElementById('clearRoom');
const exportBtn = document.getElementById('exportRoom');

const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('skymingle_channel') : null;
// WebSocket signaling (optional server). UI lets you set custom URL.
let socket = null;
const signalUrlInput = document.getElementById('signalUrl');
const connectSignalBtn = document.getElementById('connectSignal');
const signalStatusSpan = document.getElementById('signalStatus');
const copySignalBtn = document.getElementById('copySignal');
const remoteCountSpan = document.getElementById('remoteCount');

function connectSignaling(url) {
    try {
        if (socket) {
            try { socket.disconnect(); } catch(e) {}
            socket = null;
        }
        if (!url) return;

        // Clean up the URL format for Socket.IO
        let cleanUrl = url.replace(/^ws:\/\//, 'http://').replace(/^wss:\/\//, 'https://');
        socket = io(cleanUrl);

        socket.on('connect', () => {
            console.log('Socket.IO signaling connected');
            setStatus('Signal: connected');
        });
        socket.on('disconnect', () => {
            console.log('Socket.IO signaling closed');
            setStatus('Signal: disconnected');
        });
        socket.on('connect_error', (e) => {
            console.warn('Socket.IO signaling error', e);
            setStatus('Signal: error');
        });
        socket.on('message', (data) => {
            try {
                const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                if (bc) bc.postMessage(parsedData);
            } catch(e) {}
        });

        // persist preference
        try { localStorage.setItem(`${APP_PREFIX}:signalUrl`, url); } catch(e) {}
    } catch(e) {
        console.warn('Could not connect signaling', e);
        socket = null;
        setStatus('Signaling connection failed');
    }
}

function postSignal(obj) {
    // BroadcastChannel may throw on non-cloneable objects (RTC types). swallow and continue.
    if (bc) {
        try { bc.postMessage(obj); } catch(e) { console.warn('BC post failed (non-cloneable), continuing'); }
    }
    if (socket && socket.connected) {
        try { socket.send(obj); } catch(e) { console.warn('send failed', e); }
    }
}

function updateRemoteCount() {
    try {
        const count = Object.keys(peers || {}).length;
        remoteCountSpan.textContent = count;
    } catch(e) {}
}

// wire UI
if (connectSignalBtn) {
    connectSignalBtn.addEventListener('click', () => {
        const u = (signalUrlInput.value || '').trim();
        if (u) connectSignaling(u);
    });
}

if (copySignalBtn) {
    copySignalBtn.addEventListener('click', () => {
        const u = (signalUrlInput.value || '').trim();
        if (u) navigator.clipboard.writeText(u).catch(() => {});
    });
}

// on load, set input value from storage and auto-connect
const savedSignal = localStorage.getItem(`${APP_PREFIX}:signalUrl`);
const defaultSignal = (location.protocol === 'https:' ? 'https://' : 'http://') + location.host;
if (signalUrlInput) {
    signalUrlInput.value = savedSignal || defaultSignal;
}

// attempt auto-connect in background
setTimeout(() => {
    try {
        if (signalUrlInput && signalUrlInput.value) {
            connectSignaling(signalUrlInput.value);
        }
    } catch(e) {}
}, 3000);