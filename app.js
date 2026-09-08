// Firebase Realtime Database Integrated Couple Chat Logic for Mausikta & Subhranil
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
  const typingTextLabel = document.getElementById('typingTextLabel');
  
  // Animation Buttons
  const kissAnimBtn = document.getElementById('kissAnimBtn');
  const hugAnimBtn = document.getElementById('hugAnimBtn');
  const roseAnimBtn = document.getElementById('roseAnimBtn');
  const ringAnimBtn = document.getElementById('ringAnimBtn');

  // Header & Status Elements
  const partnerName = document.getElementById('partnerName');
  const partnerAvatar = document.getElementById('partnerAvatar');
  const partnerStatusText = document.getElementById('partnerStatusText');
  const statusDot = document.getElementById('statusDot');
  const currentRoomCodeLabel = document.getElementById('currentRoomCodeLabel');
  const myAvatarThumb = document.getElementById('myAvatarThumb');
  const myNameLabel = document.getElementById('myNameLabel');

  // Modals & Settings
  const themeModalBtn = document.getElementById('themeModalBtn');
  const themeModal = document.getElementById('themeModal');
  const closeThemeBtn = document.getElementById('closeThemeBtn');
  const lockAppBtn = document.getElementById('lockAppBtn');
  const lockModal = document.getElementById('lockModal');
  const joinModalTriggerBtn = document.getElementById('joinModalTriggerBtn');
  const roomBadgeBtn = document.getElementById('roomBadgeBtn');
  const joinModal = document.getElementById('joinModal');
  const passcodeInput = document.getElementById('passcodeInput');
  const roomCodeInput = document.getElementById('roomCodeInput');
  const joinSpaceBtn = document.getElementById('joinSpaceBtn');
  const mauPreview = document.getElementById('mauPreview');
  const subPreview = document.getElementById('subPreview');
  const pinDots = document.querySelectorAll('.pin-dot');
  const keypad = document.getElementById('keypad');

  // Profiles Database (Mausikta & Subhranil)
  const profiles = {
    'MAU': {
      code: 'MAU',
      name: 'Mausikta',
      avatar: 'assets/mausikta.jpg',
      partnerCode: 'SUB',
      partnerName: 'Subhranil ♥',
      partnerAvatar: 'assets/subhranil.jpg'
    },
    'SUB': {
      code: 'SUB',
      name: 'Subhranil',
      avatar: 'assets/subhranil.jpg',
      partnerCode: 'MAU',
      partnerName: 'Mausikta ♥',
      partnerAvatar: 'assets/mausikta.jpg'
    }
  };

  // State
  let currentPasscode = localStorage.getItem('couple_user_code') || '';
  let currentRoomId = localStorage.getItem('couple_room_code') || 'our-secret-space';
  let pinCode = '';
  const correctPin = '1234';
  let isInitialLoadComplete = false;

  // Audio Synthesizer
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'send') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'receive') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'kiss') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'nudge') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  // On-Demand Particle Engine
  const canvas = document.getElementById('heartCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId = null;

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class LightweightParticle {
    constructor(type = 'heart') {
      this.type = type;
      this.x = canvas.width / 2 + (Math.random() - 0.5) * 80;
      this.y = type === 'rose' ? -20 : canvas.height / 2 + (Math.random() - 0.5) * 40;
      
      if (type === 'kiss') {
        this.size = Math.random() * 24 + 24;
        this.speedX = (Math.random() - 0.5) * 5;
        this.speedY = -Math.random() * 4 - 2;
        this.gravity = 0.09;
        this.opacity = 1;
        this.emoji = ['💋', '💋', '❤️'][Math.floor(Math.random() * 3)];
      } else if (type === 'hug') {
        this.size = Math.random() * 24 + 18;
        this.speedX = (Math.random() - 0.5) * 7;
        this.speedY = (Math.random() - 0.5) * 7;
        this.gravity = 0.02;
        this.opacity = 1;
        this.emoji = ['🫂', '🤗', '💖'][Math.floor(Math.random() * 3)];
      } else if (type === 'rose') {
        this.x = Math.random() * canvas.width;
        this.size = Math.random() * 20 + 14;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = Math.random() * 3 + 2;
        this.gravity = 0.02;
        this.opacity = 1;
        this.emoji = ['🌹', '🌸'][Math.floor(Math.random() * 2)];
      } else if (type === 'ring') {
        this.size = Math.random() * 26 + 18;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = -Math.random() * 5 - 2;
        this.gravity = 0.12;
        this.opacity = 1;
        this.emoji = ['💍', '💎', '✨'][Math.floor(Math.random() * 3)];
      } else {
        this.size = Math.random() * 16 + 12;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.8) * 6 - 2;
        this.gravity = 0.12;
        this.opacity = 1;
        this.emoji = ['❤️', '💖', '✨'][Math.floor(Math.random() * 3)];
      }
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.speedY += this.gravity;
      this.opacity -= 0.02;
    }

    draw() {
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.font = `${this.size}px sans-serif`;
      ctx.fillText(this.emoji, this.x, this.y);
    }
  }

  const triggerAnimation = (type, count = 14) => {
    for (let i = 0; i < count; i++) {
      particles.push(new LightweightParticle(type));
    }
    if (!animId) {
      animId = requestAnimationFrame(animateLoop);
    }
  };

  const animateLoop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.opacity <= 0 || p.y > canvas.height + 40) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      animId = requestAnimationFrame(animateLoop);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animId = null;
    }
  };

  // Firebase Realtime Connection
  let messagesRef, myPresenceRef, partnerPresenceRef, animRef;

  const initFirebaseRoom = () => {
    if (!profiles[currentPasscode]) {
      joinModal.classList.add('active');
      return;
    }

    const myProfile = profiles[currentPasscode];
    const partnerProfile = profiles[myProfile.partnerCode];

    // Update Header & Banner UI
    currentRoomCodeLabel.textContent = currentRoomId;
    myNameLabel.textContent = myProfile.name;
    myAvatarThumb.src = myProfile.avatar;

    partnerName.innerHTML = `${partnerProfile.name} <span class="couple-title-font">♥</span>`;
    partnerAvatar.src = partnerProfile.avatar;
    typingTextLabel.textContent = `${partnerProfile.name} is typing...`;

    messagesRef = ref(db, `rooms/${currentRoomId}/messages`);
    myPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${myProfile.name}`);
    partnerPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${partnerProfile.name}`);
    animRef = ref(db, `rooms/${currentRoomId}/anim`);

    set(myPresenceRef, {
      online: true,
      typing: false,
      lastSeen: serverTimestamp()
    });

    onDisconnect(myPresenceRef).set({
      online: false,
      typing: false,
      lastSeen: serverTimestamp()
    });

    // Listen to Partner Online Status & Typing
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
          if (lastMsg && lastMsg.senderCode !== currentPasscode) {
            playSound('receive');
          }
        }
      } else {
        renderMessages([]);
      }
      isInitialLoadComplete = true;
    });

    // Listen for Realtime Animations
    onValue(animRef, (snapshot) => {
      const animData = snapshot.val();
      if (animData && animData.senderCode !== currentPasscode && (Date.now() - animData.timestamp < 3000)) {
        triggerAnimation(animData.animType, 16);
        if (animData.animType === 'kiss') {
          playSound('kiss');
        } else {
          playSound('nudge');
        }
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
    const isMe = msg.senderCode === currentPasscode;
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
    } else if (msg.type === 'anim') {
      const animIcons = { kiss: '💋 Sent a Kiss!', hug: '🫂 Sent a Warm Hug!', rose: '🌹 Sent a Rose Shower!', ring: '💍 Sent Diamond Love!', nudge: '💖 Sent a Heart Burst!' };
      contentHtml = `<div class="bubble" style="background: linear-gradient(135deg, #ff4b72, #ff7e5f); color: #fff;">${animIcons[msg.animType] || '💖 Sent Love Animation!'}</div>`;
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

  const sendAnimationEvent = (animType) => {
    if (!profiles[currentPasscode]) return;

    triggerAnimation(animType, 16);
    if (animType === 'kiss') {
      playSound('kiss');
    } else {
      playSound('nudge');
    }

    set(animRef, {
      senderCode: currentPasscode,
      senderName: profiles[currentPasscode].name,
      animType: animType,
      timestamp: Date.now()
    });

    push(messagesRef, {
      senderCode: currentPasscode,
      senderName: profiles[currentPasscode].name,
      animType: animType,
      timestamp: Date.now(),
      type: 'anim'
    });
  };

  // Button Animation Event Listeners
  kissAnimBtn.addEventListener('click', () => sendAnimationEvent('kiss'));
  hugAnimBtn.addEventListener('click', () => sendAnimationEvent('hug'));
  roseAnimBtn.addEventListener('click', () => sendAnimationEvent('rose'));
  ringAnimBtn.addEventListener('click', () => sendAnimationEvent('ring'));

  // Send Text Message
  const handleSendMessage = () => {
    if (!profiles[currentPasscode]) return;
    const text = messageInput.value.trim();
    if (!text) return;

    push(messagesRef, {
      senderCode: currentPasscode,
      senderName: profiles[currentPasscode].name,
      text: text,
      timestamp: Date.now(),
      type: 'text'
    });

    playSound('send');
    messageInput.value = '';

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

  // Typing Status
  let typingTimeout;
  messageInput.addEventListener('input', () => {
    if (!myPresenceRef) return;
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

  // Nudge Button
  nudgeHeartBtn.addEventListener('click', () => sendAnimationEvent('nudge'));

  // Photo Polaroid Upload
  photoUploadTrigger.addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && profiles[currentPasscode]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const caption = prompt('Add a romantic polaroid caption:', 'Making memories together ♥');
        push(messagesRef, {
          senderCode: currentPasscode,
          senderName: profiles[currentPasscode].name,
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

  // Join Space / Code Handling
  mauPreview.addEventListener('click', () => {
    passcodeInput.value = 'MAU';
  });

  subPreview.addEventListener('click', () => {
    passcodeInput.value = 'SUB';
  });

  joinSpaceBtn.addEventListener('click', () => {
    const typedCode = passcodeInput.value.trim().toUpperCase();
    const typedRoom = roomCodeInput.value.trim().toLowerCase() || 'our-secret-space';

    if (typedCode !== 'MAU' && typedCode !== 'SUB') {
      alert('Invalid passcode! Please enter "MAU" for Mausikta or "SUB" for Subhranil.');
      return;
    }

    currentPasscode = typedCode;
    currentRoomId = typedRoom;

    localStorage.setItem('couple_user_code', currentPasscode);
    localStorage.setItem('couple_room_code', currentRoomId);

    joinModal.classList.remove('active');
    initFirebaseRoom();
  });

  joinModalTriggerBtn.addEventListener('click', () => {
    passcodeInput.value = currentPasscode;
    roomCodeInput.value = currentRoomId;
    joinModal.classList.add('active');
  });

  roomBadgeBtn.addEventListener('click', () => {
    passcodeInput.value = currentPasscode;
    roomCodeInput.value = currentRoomId;
    joinModal.classList.add('active');
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

  // PIN Lock Logic
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

  // Start App
  if (currentPasscode && profiles[currentPasscode]) {
    initFirebaseRoom();
  } else {
    joinModal.classList.add('active');
  }
});
