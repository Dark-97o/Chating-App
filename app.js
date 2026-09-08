// Firebase Realtime Database Integrated Couple Chat Logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  push, 
  onValue, 
  set, 
  onDisconnect, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_Iu7VzVBsXeq63FCWQDFyNIc3pFk5O80",
  authDomain: "chatting-247af.firebaseapp.com",
  databaseURL: "https://chatting-247af-default-rtdb.firebaseio.com",
  projectId: "chatting-247af",
  storageBucket: "chatting-247af.firebasestorage.app",
  messagingSenderId: "708580936424",
  appId: "1:708580936424:web:e63c92380a22b4f1eed75d",
  measurementId: "G-GCKD9QD7CS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {

  // UI Elements
  const chatMessages = document.getElementById('chatMessages');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const nudgeHeartBtn = document.getElementById('nudgeHeartBtn');
  const photoInput = document.getElementById('photoInput');
  const photoUploadTrigger = document.getElementById('photoUploadTrigger');
  const typingIndicator = document.getElementById('typingIndicator');
  
  // Header & Status Elements
  const partnerName = document.getElementById('partnerName');
  const partnerAvatar = document.getElementById('partnerAvatar');
  const partnerStatusText = document.getElementById('partnerStatusText');
  const statusDot = document.getElementById('statusDot');
  const currentRoomCodeLabel = document.getElementById('currentRoomCodeLabel');

  // Modals & Settings
  const themeModalBtn = document.getElementById('themeModalBtn');
  const themeModal = document.getElementById('themeModal');
  const closeThemeBtn = document.getElementById('closeThemeBtn');
  const lockAppBtn = document.getElementById('lockAppBtn');
  const lockModal = document.getElementById('lockModal');
  const roomSettingsBtn = document.getElementById('roomSettingsBtn');
  const roomBadgeBtn = document.getElementById('roomBadgeBtn');
  const roomModal = document.getElementById('roomModal');
  const roomCodeInput = document.getElementById('roomCodeInput');
  const roleSelect = document.getElementById('roleSelect');
  const saveRoomSettingsBtn = document.getElementById('saveRoomSettingsBtn');
  const pinDots = document.querySelectorAll('.pin-dot');
  const keypad = document.getElementById('keypad');

  // Application State
  let currentRoomId = localStorage.getItem('couple_room_code') || 'our-secret-space';
  let currentRole = localStorage.getItem('couple_user_role') || 'Person A';
  let pinCode = '';
  const correctPin = '1234';
  let isInitialLoadComplete = false;

  // Role Metadata
  const rolesData = {
    'Person A': {
      partnerRole: 'Person B',
      partnerName: 'Sam ♥',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    'Person B': {
      partnerRole: 'Person A',
      partnerName: 'Alex ♥',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    }
  };

  // Audio Synthesizer (Web Audio API)
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'send') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'receive') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'nudge') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  // Canvas Heart Particle System
  const canvas = document.getElementById('heartCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class HeartParticle {
    constructor(x, y) {
      this.x = x || canvas.width / 2;
      this.y = y || canvas.height / 2;
      this.size = Math.random() * 18 + 12;
      this.speedX = (Math.random() - 0.5) * 8;
      this.speedY = (Math.random() - 0.8) * 8 - 3;
      this.gravity = 0.15;
      this.opacity = 1;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.1;
      this.emoji = ['❤️', '💖', '🌹', '✨', '💋', '💍'][Math.floor(Math.random() * 6)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.speedY += this.gravity;
      this.opacity -= 0.015;
      this.rotation += this.rotSpeed;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.font = `${this.size}px sans-serif`;
      ctx.fillText(this.emoji, 0, 0);
      ctx.restore();
    }
  }

  const triggerHeartBurst = (count = 35) => {
    for (let i = 0; i < count; i++) {
      particles.push(new HeartParticle());
    }
  };

  const animateParticles = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, index) => {
      p.update();
      p.draw();
      if (p.opacity <= 0) particles.splice(index, 1);
    });
    requestAnimationFrame(animateParticles);
  };
  animateParticles();

  // Firebase Realtime Database Connection & Listeners
  let messagesRef, myPresenceRef, partnerPresenceRef, nudgeRef;

  const initFirebaseRoom = () => {
    currentRoomCodeLabel.textContent = currentRoomId;
    const partnerRole = rolesData[currentRole].partnerRole;

    // Update Header
    partnerName.innerHTML = `${rolesData[currentRole].partnerName} <span class="couple-title-font">♥</span>`;
    partnerAvatar.src = rolesData[currentRole].avatar;

    // Firebase References
    messagesRef = ref(db, `rooms/${currentRoomId}/messages`);
    myPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${currentRole}`);
    partnerPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${partnerRole}`);
    nudgeRef = ref(db, `rooms/${currentRoomId}/nudge`);

    // Set My Presence & OnDisconnect Handler
    set(myPresenceRef, {
      online: true,
      typing: false,
      lastSeen: serverTimestamp()
    });

    const onDisconnectRef = onDisconnect(myPresenceRef);
    onDisconnectRef.set({
      online: false,
      typing: false,
      lastSeen: serverTimestamp()
    });

    // Listen to Partner's Online Presence & Typing Status
    onValue(partnerPresenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.online) {
        statusDot.classList.add('online');
        statusDot.title = 'Online';
        partnerStatusText.textContent = data.typing ? 'Typing...' : 'Online & Thinking of you ✨';

        if (data.typing) {
          typingIndicator.classList.add('active');
        } else {
          typingIndicator.classList.remove('active');
        }
      } else {
        statusDot.classList.remove('online');
        statusDot.title = 'Offline';
        partnerStatusText.textContent = 'Offline';
        typingIndicator.classList.remove('active');
      }
    });

    // Listen for Realtime Messages
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.values(data);
        renderMessages(msgList);

        if (isInitialLoadComplete) {
          const lastMsg = msgList[msgList.length - 1];
          if (lastMsg && lastMsg.sender !== currentRole) {
            playSound('receive');
          }
        }
      } else {
        renderMessages([]);
      }
      isInitialLoadComplete = true;
    });

    // Listen for Realtime Heart Nudges
    onValue(nudgeRef, (snapshot) => {
      const nudgeData = snapshot.val();
      if (nudgeData && nudgeData.sender !== currentRole && (Date.now() - nudgeData.timestamp < 3000)) {
        triggerHeartBurst(50);
        playSound('nudge');
      }
    });
  };

  const renderMessages = (messages) => {
    chatMessages.innerHTML = `
      <div class="date-divider">
        <span>Firebase Realtime Connected • Secret Space</span>
      </div>
    `;
    messages.forEach(msg => renderSingleMessage(msg));
    scrollToBottom();
  };

  const renderSingleMessage = (msg) => {
    const isMe = msg.sender === currentRole;
    const row = document.createElement('div');
    row.className = `message-row ${isMe ? 'me' : 'partner'}`;

    let contentHtml = '';
    if (msg.type === 'text') {
      contentHtml = `<div class="bubble">${escapeHtml(msg.text)}</div>`;
    } else if (msg.type === 'polaroid') {
      contentHtml = `
        <div class="polaroid-card">
          <img class="polaroid-img" src="${msg.imgUrl}" alt="Couple Memory">
          <div class="polaroid-caption">${escapeHtml(msg.caption || 'Our Moment ♥')}</div>
        </div>
      `;
    } else if (msg.type === 'nudge') {
      contentHtml = `<div class="bubble" style="background: linear-gradient(135deg, #ff4b72, #ff7e5f); color: #fff;">💖 Sent a Heart Burst Nudge!</div>`;
    }

    const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

    row.innerHTML = `
      ${contentHtml}
      <div class="msg-meta">
        <span>${timeStr}</span>
        ${isMe ? '<span>✓✓</span>' : ''}
      </div>
    `;

    chatMessages.appendChild(row);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const escapeHtml = (str) => {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // Send Text Message to Firebase
  const handleSendMessage = () => {
    const text = messageInput.value.trim();
    if (!text) return;

    push(messagesRef, {
      sender: currentRole,
      text: text,
      timestamp: Date.now(),
      type: 'text'
    });

    playSound('send');
    messageInput.value = '';

    // Reset typing status
    set(myPresenceRef, {
      online: true,
      typing: false,
      lastSeen: serverTimestamp()
    });
  };

  sendBtn.addEventListener('click', handleSendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
  });

  // Typing Status Broadcast to Firebase
  let typingTimeout;
  messageInput.addEventListener('input', () => {
    set(myPresenceRef, {
      online: true,
      typing: true,
      lastSeen: serverTimestamp()
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      set(myPresenceRef, {
        online: true,
        typing: false,
        lastSeen: serverTimestamp()
      });
    }, 1500);
  });

  // Heart Nudge Trigger to Firebase
  nudgeHeartBtn.addEventListener('click', () => {
    triggerHeartBurst(45);
    playSound('nudge');

    set(nudgeRef, {
      sender: currentRole,
      timestamp: Date.now()
    });

    push(messagesRef, {
      sender: currentRole,
      timestamp: Date.now(),
      type: 'nudge'
    });
  });

  // Photo Polaroid Upload to Firebase
  photoUploadTrigger.addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const caption = prompt('Add a romantic polaroid caption:', 'Making memories together ♥');
        push(messagesRef, {
          sender: currentRole,
          imgUrl: event.target.result,
          caption: caption || '',
          timestamp: Date.now(),
          type: 'polaroid'
        });
        playSound('send');
      };
      reader.readAsDataURL(file);
    }
  });

  // Emoji Stickers
  document.querySelectorAll('.sticker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      messageInput.value += ` ${btn.dataset.emoji} `;
      messageInput.focus();
    });
  });

  // Room & Role Settings Modal
  const openRoomModal = () => {
    roomCodeInput.value = currentRoomId;
    roleSelect.value = currentRole;
    roomModal.classList.add('active');
  };

  roomSettingsBtn.addEventListener('click', openRoomModal);
  roomBadgeBtn.addEventListener('click', openRoomModal);

  saveRoomSettingsBtn.addEventListener('click', () => {
    const newRoom = roomCodeInput.value.trim().toLowerCase() || 'our-secret-space';
    const newRole = roleSelect.value;

    currentRoomId = newRoom;
    currentRole = newRole;

    localStorage.setItem('couple_room_code', currentRoomId);
    localStorage.setItem('couple_user_role', currentRole);

    roomModal.classList.remove('active');
    initFirebaseRoom();
  });

  // Theme Switching
  themeModalBtn.addEventListener('click', () => themeModal.classList.add('active'));
  closeThemeBtn.addEventListener('click', () => themeModal.classList.remove('active'));

  document.querySelectorAll('[data-set-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.setTheme;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('couple_theme', theme);
      themeModal.classList.remove('active');
    });
  });

  const savedTheme = localStorage.getItem('couple_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // PIN Lock Screen Logic
  lockAppBtn.addEventListener('click', () => lockModal.classList.add('active'));

  keypad.addEventListener('click', (e) => {
    if (!e.target.classList.contains('key-btn')) return;
    const key = e.target.dataset.key;

    if (key === 'C') {
      pinCode = '';
    } else if (key === '✓') {
      if (pinCode === correctPin) {
        lockModal.classList.remove('active');
        pinCode = '';
      } else {
        alert('Incorrect PIN! Try 1234');
        pinCode = '';
      }
    } else if (pinCode.length < 4) {
      pinCode += key;
    }

    updatePinDots();
  });

  const updatePinDots = () => {
    pinDots.forEach((dot, index) => {
      if (index < pinCode.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  };

  // Initialize Room & Firebase Connection
  initFirebaseRoom();
});
