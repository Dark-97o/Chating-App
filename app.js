// Real-time Couple Chat Logic & Canvas Heart Physics
document.addEventListener('DOMContentLoaded', () => {

  // Global State & Elements
  const chatMessages = document.getElementById('chatMessages');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const nudgeHeartBtn = document.getElementById('nudgeHeartBtn');
  const photoInput = document.getElementById('photoInput');
  const photoUploadTrigger = document.getElementById('photoUploadTrigger');
  const typingIndicator = document.getElementById('typingIndicator');
  const roleSwitcherBtn = document.getElementById('roleSwitcherBtn');
  const currentRoleLabel = document.getElementById('currentRoleLabel');
  const partnerName = document.getElementById('partnerName');
  const partnerAvatar = document.getElementById('partnerAvatar');
  const partnerStatusText = document.getElementById('partnerStatusText');

  // Theme & Lock Elements
  const themeModalBtn = document.getElementById('themeModalBtn');
  const themeModal = document.getElementById('themeModal');
  const closeThemeBtn = document.getElementById('closeThemeBtn');
  const lockAppBtn = document.getElementById('lockAppBtn');
  const lockModal = document.getElementById('lockModal');
  const pinDots = document.querySelectorAll('.pin-dot');
  const keypad = document.getElementById('keypad');

  // App Configuration
  let currentRole = localStorage.getItem('couple_user_role') || 'Person A';
  let pinCode = '';
  const correctPin = '1234';

  // Avatars & Names for Roles
  const rolesData = {
    'Person A': {
      name: 'Alex',
      partnerName: 'Sam ♥',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      status: 'Thinking of you ✨'
    },
    'Person B': {
      name: 'Sam',
      partnerName: 'Alex ♥',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      status: 'Counting down the hours 💫'
    }
  };

  // Setup Broadcast Channel for Real-time Cross-Tab Sync
  const channel = new BroadcastChannel('couple_chat_channel');

  // Audio Synthesizer (Web Audio API for zero-dependency cute sound FX)
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
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Audio fallback silent
    }
  };

  // Canvas Heart Burst System
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

  // Load Messages from localStorage
  const loadStoredMessages = () => {
    const defaultMessages = [
      { sender: 'Person B', text: 'Hey sweetheart! Did you see the sunset today? 🌅', time: '16:20', type: 'text' },
      { sender: 'Person A', text: 'Yes! It reminded me of our first date ✨', time: '16:22', type: 'text' }
    ];

    const stored = localStorage.getItem('couple_messages');
    const messages = stored ? JSON.parse(stored) : defaultMessages;
    renderMessages(messages);
  };

  const saveMessage = (msg) => {
    const stored = JSON.parse(localStorage.getItem('couple_messages') || '[]');
    stored.push(msg);
    localStorage.setItem('couple_messages', JSON.stringify(stored));
    renderSingleMessage(msg);
  };

  const renderMessages = (messages) => {
    chatMessages.innerHTML = `
      <div class="date-divider">
        <span>Today • Secret Space</span>
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

    row.innerHTML = `
      ${contentHtml}
      <div class="msg-meta">
        <span>${msg.time}</span>
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
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // Update UI for Active Role
  const updateRoleUI = () => {
    const info = rolesData[currentRole];
    currentRoleLabel.textContent = currentRole;
    partnerName.innerHTML = `${info.partnerName} <span class="couple-title-font">♥</span>`;
    partnerAvatar.src = info.avatar;
    partnerStatusText.textContent = info.status;
    loadStoredMessages();
  };

  // Event Handlers
  roleSwitcherBtn.addEventListener('click', () => {
    currentRole = currentRole === 'Person A' ? 'Person B' : 'Person A';
    localStorage.setItem('couple_user_role', currentRole);
    updateRoleUI();
  });

  // Send Message Logic
  const handleSendMessage = () => {
    const text = messageInput.value.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgData = {
      sender: currentRole,
      text: text,
      time: time,
      type: 'text'
    };

    saveMessage(msgData);
    playSound('send');
    messageInput.value = '';

    // Broadcast message to partner window
    channel.postMessage({ type: 'NEW_MESSAGE', data: msgData });
  };

  sendBtn.addEventListener('click', handleSendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
  });

  // Typing Indicator Broadcast
  let typingTimeout;
  messageInput.addEventListener('input', () => {
    channel.postMessage({ type: 'TYPING', sender: currentRole, isTyping: true });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      channel.postMessage({ type: 'TYPING', sender: currentRole, isTyping: false });
    }, 1500);
  });

  // Nudge Heart Button
  nudgeHeartBtn.addEventListener('click', () => {
    triggerHeartBurst(45);
    playSound('nudge');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgData = {
      sender: currentRole,
      time: time,
      type: 'nudge'
    };

    saveMessage(msgData);
    channel.postMessage({ type: 'NUDGE', sender: currentRole, data: msgData });
  });

  // Photo Polaroid Upload
  photoUploadTrigger.addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const caption = prompt('Add a romantic polaroid caption:', 'Making memories together ♥');
        const msgData = {
          sender: currentRole,
          imgUrl: event.target.result,
          caption: caption || '',
          time: time,
          type: 'polaroid'
        };
        saveMessage(msgData);
        playSound('send');
        channel.postMessage({ type: 'NEW_MESSAGE', data: msgData });
      };
      reader.readAsDataURL(file);
    }
  });

  // Quick Sticker Buttons
  document.querySelectorAll('.sticker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      messageInput.value += ` ${emoji} `;
      messageInput.focus();
    });
  });

  // Broadcast Channel Message Listener
  channel.onmessage = (event) => {
    const { type, sender, data, isTyping } = event.data;

    if (sender !== currentRole) {
      if (type === 'NEW_MESSAGE') {
        saveMessage(data);
        playSound('receive');
      } else if (type === 'NUDGE') {
        triggerHeartBurst(50);
        playSound('nudge');
        saveMessage(data);
      } else if (type === 'TYPING') {
        if (isTyping) {
          typingIndicator.classList.add('active');
        } else {
          typingIndicator.classList.remove('active');
        }
      }
    }
  };

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

  // PIN Lock Functionality
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

  // Initial Load
  updateRoleUI();
});
