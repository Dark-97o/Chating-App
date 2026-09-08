// Firebase Realtime Database Integrated Couple Chat Logic for Mausikta & Subhranil
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  push, 
  onValue, 
  onChildAdded,
  set, 
  off,
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
  const myAvatarThumb = document.getElementById('myAvatarThumb');
  const myNameLabel = document.getElementById('myNameLabel');
  const togetherDaysText = document.getElementById('togetherDaysText');

  // Call Elements
  const videoCallBtn = document.getElementById('videoCallBtn');
  const audioCallBtn = document.getElementById('audioCallBtn');
  const callModal = document.getElementById('callModal');
  const callIframe = document.getElementById('callIframe');
  const callPartnerAvatar = document.getElementById('callPartnerAvatar');
  const callPartnerName = document.getElementById('callPartnerName');
  const callDurationLabel = document.getElementById('callDurationLabel');
  const endCallBtn = document.getElementById('endCallBtn');

  // Incoming Call Elements
  const incomingCallModal = document.getElementById('incomingCallModal');
  const incomingCallerAvatar = document.getElementById('incomingCallerAvatar');
  const incomingCallerName = document.getElementById('incomingCallerName');
  const incomingCallTypeText = document.getElementById('incomingCallTypeText');
  const acceptCallBtn = document.getElementById('acceptCallBtn');
  const declineCallBtn = document.getElementById('declineCallBtn');

  // Modals & Settings
  const themeModalBtn = document.getElementById('themeModalBtn');
  const themeModal = document.getElementById('themeModal');
  const closeThemeBtn = document.getElementById('closeThemeBtn');
  const joinModalTriggerBtn = document.getElementById('joinModalTriggerBtn');
  const joinModal = document.getElementById('joinModal');
  const passcodeInput = document.getElementById('passcodeInput');
  const joinSpaceBtn = document.getElementById('joinSpaceBtn');
  const mauPreview = document.getElementById('mauPreview');
  const subPreview = document.getElementById('subPreview');

  // Milestones Modal Elements
  const milestonesBtn = document.getElementById('milestonesBtn');
  const togetherCounterBtn = document.getElementById('togetherCounterBtn');
  const milestonesModal = document.getElementById('milestonesModal');
  const closeMilestonesBtn = document.getElementById('closeMilestonesBtn');
  const modalDaysTogether = document.getElementById('modalDaysTogether');
  const modalYearsMonths = document.getElementById('modalYearsMonths');
  const subBirthdayCountdown = document.getElementById('subBirthdayCountdown');
  const mauBirthdayCountdown = document.getElementById('mauBirthdayCountdown');

  // Profiles Database (Mausikta & Subhranil)
  const profiles = {
    'MAU': {
      code: 'MAU',
      name: 'Mausikta',
      avatar: 'assets/mausikta.jpg',
      partnerCode: 'SUB',
      partnerName: 'Subhranil',
      partnerAvatar: 'assets/subhranil.jpg'
    },
    'SUB': {
      code: 'SUB',
      name: 'Subhranil',
      avatar: 'assets/subhranil.jpg',
      partnerCode: 'MAU',
      partnerName: 'Mausikta',
      partnerAvatar: 'assets/mausikta.jpg'
    }
  };

  // State (ALWAYS prompt profile selection every time the website is opened)
  let currentPasscode = ''; // Force profile selection on every visit
  const currentRoomId = 'our-secret-space';
  let isInitialLoadComplete = false;
  let activeListeners = [];

  // WebRTC & PeerJS State
  let peerConnection = null;
  let peer = null;
  let activePeerCall = null;
  let localStream = null;
  let remoteStream = null;
  let pendingOffer = null;
  let isCallActive = false;
  let callTimerInterval = null;
  let ringtoneInterval = null;

  let iceCandidatesQueue = [];

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      { urls: 'stun:stun.services.mozilla.com' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turns:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  };

  // Helper to safely get Realtime Database references
  const getOfferRef = () => ref(db, `rooms/${currentRoomId}/callSignal/offer`);
  const getAnswerRef = () => ref(db, `rooms/${currentRoomId}/callSignal/answer`);
  const getCandidatesRef = (code) => ref(db, `rooms/${currentRoomId}/callSignal/candidates/${code}`);
  const getEndSignalRef = () => ref(db, `rooms/${currentRoomId}/callSignal/end`);
  const getMessagesRef = () => ref(db, `rooms/${currentRoomId}/messages`);
  const getAnimRef = () => ref(db, `rooms/${currentRoomId}/anim`);

  // Calculate Days Together & Birthday Countdowns
  const updateMilestones = () => {
    const now = new Date();
    const startDate = new Date(2023, 8, 25);
    const diffTime = Math.abs(now - startDate);
    const totalDaysTogether = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const breakdownText = `${years} Year${years !== 1 ? 's' : ''}, ${months} Month${months !== 1 ? 's' : ''}, ${days} Day${days !== 1 ? 's' : ''}`;
    
    togetherDaysText.textContent = `💖 Day ${totalDaysTogether.toLocaleString()} Together`;
    modalDaysTogether.textContent = `${totalDaysTogether.toLocaleString()} Days`;
    modalYearsMonths.textContent = breakdownText;

    subBirthdayCountdown.textContent = calculateBirthdayCountdown(new Date(2004, 4, 24), 'Subhranil');
    mauBirthdayCountdown.textContent = calculateBirthdayCountdown(new Date(2005, 10, 8), 'Mausikta');
  };

  const calculateBirthdayCountdown = (birthDate, name) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    let age = currentYear - birthDate.getFullYear();

    let nextBday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    if (now > nextBday && (now.getMonth() !== birthDate.getMonth() || now.getDate() !== birthDate.getDate())) {
      nextBday.setFullYear(currentYear + 1);
    } else if (now < nextBday) {
      age--;
    }

    const diffDays = Math.ceil((nextBday - now) / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || (now.getMonth() === birthDate.getMonth() && now.getDate() === birthDate.getDate())) {
      return `🎉 TODAY IS ${name.toUpperCase()}'S ${age + 1}th BIRTHDAY! 🎂💖`;
    }

    return `${age + 1}th Birthday in ${diffDays} Day${diffDays !== 1 ? 's' : ''} (${nextBday.toLocaleDateString([], { month: 'short', day: 'numeric' })})`;
  };

  updateMilestones();

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
      } else if (type === 'ringtone') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(480, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  const startRingtone = () => {
    stopRingtone();
    ringtoneInterval = setInterval(() => playSound('ringtone'), 1200);
  };

  const stopRingtone = () => {
    if (ringtoneInterval) {
      clearInterval(ringtoneInterval);
      ringtoneInterval = null;
    }
  };

  // Canvas Particle Animation Engine
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

  let previousPasscode = '';

  // Clean up existing listeners when switching users
  const cleanupListeners = () => {
    activeListeners.forEach(r => off(r));
    activeListeners = [];
  };

  // Firebase Realtime Connection & WebRTC Signaling
  const initFirebaseRoom = () => {
    if (!profiles[currentPasscode]) {
      joinModal.classList.add('active');
      return;
    }

    // Mark previous user offline if switching identity
    if (previousPasscode && previousPasscode !== currentPasscode && profiles[previousPasscode]) {
      const prevProfile = profiles[previousPasscode];
      const prevPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${prevProfile.name}`);
      set(prevPresenceRef, {
        online: false,
        typing: false,
        lastSeen: serverTimestamp()
      });
    }
    previousPasscode = currentPasscode;

    cleanupListeners();
    isInitialLoadComplete = false;

    const myProfile = profiles[currentPasscode];
    const partnerProfile = profiles[myProfile.partnerCode];

    myNameLabel.textContent = myProfile.name;
    myAvatarThumb.src = myProfile.avatar;
    messageInput.placeholder = `Write something sweet, ${myProfile.name}...`;

    partnerName.innerHTML = `${partnerProfile.name} <span class="couple-title-font">♥</span>`;
    partnerAvatar.src = partnerProfile.avatar;
    callPartnerAvatar.src = partnerProfile.avatar;
    callPartnerName.textContent = partnerProfile.name;
    incomingCallerAvatar.src = partnerProfile.avatar;
    incomingCallerName.textContent = partnerProfile.name;
    typingTextLabel.textContent = `${partnerProfile.name} is typing...`;

    // Initialize PeerJS for 1-on-1 WebRTC Call
    if (window.Peer) {
      const myPeerId = `couplespace-secret-${currentPasscode.toLowerCase()}`;
      if (peer) {
        try { peer.destroy(); } catch (e) {}
      }
      peer = new window.Peer(myPeerId, { config: rtcConfig });

      peer.on('call', (call) => {
        activePeerCall = call;
        pendingOffer = { isVideo: true, callerCode: partnerProfile.code };
        incomingCallTypeText.textContent = 'Incoming Video / Audio Call...';
        incomingCallModal.classList.add('active');
        startRingtone();
      });
    }

    const myPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${myProfile.name}`);
    const partnerPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${partnerProfile.name}`);

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

    // Listen to Partner Online Status
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
    activeListeners.push(partnerPresenceRef);

    // Listen for Realtime Messages
    const msgsRef = getMessagesRef();
    onValue(msgsRef, (snapshot) => {
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
    activeListeners.push(msgsRef);

    // Listen for Realtime Animations
    const animsRef = getAnimRef();
    onValue(animsRef, (snapshot) => {
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
    activeListeners.push(animsRef);

    // WebRTC Realtime Firebase Signaling Listeners
    const offerRef = getOfferRef();
    onValue(offerRef, (snapshot) => {
      const signal = snapshot.val();
      if (!signal || signal.callerCode === currentPasscode) return;

      if (Date.now() - signal.timestamp < 30000) {
        pendingOffer = signal;
        incomingCallTypeText.textContent = signal.isVideo ? 'Incoming Video Call...' : 'Incoming Voice Call...';
        incomingCallModal.classList.add('active');
        startRingtone();
      }
    });
    activeListeners.push(offerRef);

    const endRef = getEndSignalRef();
    onValue(endRef, (snapshot) => {
      const endSignal = snapshot.val();
      if (endSignal && endSignal.callerCode !== currentPasscode && isCallActive) {
        cleanUpCall();
      }
    });
    activeListeners.push(endRef);
  };

  // Call Core Logic (Default Zero-Login Video/Audio Feed)
  const startCall = (isVideo = true) => {
    if (!currentPasscode || !profiles[currentPasscode]) {
      alert('Please select your profile (MAU or SUB) before making a call!');
      joinModal.classList.add('active');
      return;
    }

    const roomName = `our-secret-space-mausikta-subhranil`;
    const myPush = currentPasscode === 'MAU' ? 'MAU' : 'SUB';
    const partnerView = currentPasscode === 'MAU' ? 'SUB' : 'MAU';
    const audioOnlyFlag = isVideo ? '' : '&webcam=0';
    const zeroLoginUrl = `https://vdo.ninja/?room=${roomName}&push=${myPush}&view=${partnerView}&autostart=1&nobuttons=0&quality=0${audioOnlyFlag}`;

    if (callIframe) {
      callIframe.src = zeroLoginUrl;
    }
    callModal.classList.add('active');
    isCallActive = true;
    startCallTimer();

    // Trigger ringtone on partner's phone
    set(getOfferRef(), {
      callerCode: currentPasscode,
      isVideo: isVideo,
      timestamp: Date.now()
    });
  };

  const acceptCall = () => {
    if (!currentPasscode || !profiles[currentPasscode]) return;
    stopRingtone();
    incomingCallModal.classList.remove('active');

    const roomName = `our-secret-space-mausikta-subhranil`;
    const myPush = currentPasscode === 'MAU' ? 'MAU' : 'SUB';
    const partnerView = currentPasscode === 'MAU' ? 'SUB' : 'MAU';
    const isVideo = pendingOffer ? pendingOffer.isVideo : true;
    const audioOnlyFlag = isVideo ? '' : '&webcam=0';
    const zeroLoginUrl = `https://vdo.ninja/?room=${roomName}&push=${myPush}&view=${partnerView}&autostart=1&nobuttons=0&quality=0${audioOnlyFlag}`;

    if (callIframe) {
      callIframe.src = zeroLoginUrl;
    }
    callModal.classList.add('active');
    isCallActive = true;
    startCallTimer();
  };

  const declineCall = () => {
    stopRingtone();
    incomingCallModal.classList.remove('active');
    if (currentPasscode) {
      set(getEndSignalRef(), {
        callerCode: currentPasscode,
        timestamp: Date.now()
      });
    }
    cleanUpCall();
  };

  const cleanUpCall = () => {
    stopRingtone();
    if (callTimerInterval) clearInterval(callTimerInterval);
    
    if (callIframe) {
      callIframe.src = '';
    }
    isCallActive = false;
    pendingOffer = null;
    callModal.classList.remove('active');
    incomingCallModal.classList.remove('active');
  };

  const endCall = () => {
    if (currentPasscode) {
      set(getEndSignalRef(), {
        callerCode: currentPasscode,
        timestamp: Date.now()
      });
    }
    cleanUpCall();
  };

  const startCallTimer = () => {
    let seconds = 0;
    if (callTimerInterval) clearInterval(callTimerInterval);
    callTimerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      callDurationLabel.textContent = `Connected ${m}:${s}`;
    }, 1000);
  };

  // Call Event Handlers
  videoCallBtn.addEventListener('click', () => startCall(true));
  audioCallBtn.addEventListener('click', () => startCall(false));
  acceptCallBtn.addEventListener('click', acceptCall);
  declineCallBtn.addEventListener('click', declineCall);
  endCallBtn.addEventListener('click', endCall);

  toggleMicBtn.addEventListener('click', () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        toggleMicBtn.classList.toggle('off', !audioTrack.enabled);
        toggleMicBtn.innerHTML = audioTrack.enabled ? '<i class="fa-solid fa-microphone"></i>' : '<i class="fa-solid fa-microphone-slash"></i>';
      }
    }
  });

  toggleCamBtn.addEventListener('click', () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        toggleCamBtn.classList.toggle('off', !videoTrack.enabled);
        toggleCamBtn.innerHTML = videoTrack.enabled ? '<i class="fa-solid fa-video"></i>' : '<i class="fa-solid fa-video-slash"></i>';
        localVideo.style.display = videoTrack.enabled ? 'block' : 'none';
      }
    }
  });

  const renderMessages = (messages) => {
    chatMessages.innerHTML = `
      <div class="date-divider">
        <span>Firebase Realtime Connected • Secret Space</span>
      </div>
    `;
    messages.forEach(msg => renderSingleMessage(msg));
    scrollToBottom();
  };

  const sanitizeUrl = (url) => {
    if (!url) return '';
    const clean = String(url).trim();
    if (clean.startsWith('data:image/') || clean.startsWith('https://') || clean.startsWith('http://') || clean.startsWith('assets/')) {
      return clean;
    }
    return '';
  };

  const renderSingleMessage = (msg) => {
    const isMe = msg.senderCode === currentPasscode;
    const row = document.createElement('div');
    row.className = `message-row ${isMe ? 'me' : 'partner'}`;

    let contentHtml = '';
    if (msg.type === 'text') {
      contentHtml = `<div class="bubble">${escapeHtml(msg.text)}</div>`;
    } else if (msg.type === 'polaroid') {
      const imgSrc = sanitizeUrl(msg.imgUrl);
      contentHtml = `
        <div class="polaroid-card">
          ${imgSrc ? `<img class="polaroid-img" src="${imgSrc}" alt="Couple Memory">` : `<div style="padding:10px; color:#666;">Image Unavailable</div>`}
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
    if (!currentPasscode || !profiles[currentPasscode]) {
      alert('Please select your profile (MAU or SUB) first!');
      joinModal.classList.add('active');
      return;
    }

    triggerAnimation(animType, 16);
    if (animType === 'kiss') {
      playSound('kiss');
    } else {
      playSound('nudge');
    }

    set(getAnimRef(), {
      senderCode: currentPasscode,
      senderName: profiles[currentPasscode].name,
      animType: animType,
      timestamp: Date.now()
    });

    push(getMessagesRef(), {
      senderCode: currentPasscode,
      senderName: profiles[currentPasscode].name,
      animType: animType,
      timestamp: Date.now(),
      type: 'anim'
    });
  };

  // Animation Buttons
  kissAnimBtn.addEventListener('click', () => sendAnimationEvent('kiss'));
  hugAnimBtn.addEventListener('click', () => sendAnimationEvent('hug'));
  roseAnimBtn.addEventListener('click', () => sendAnimationEvent('rose'));
  ringAnimBtn.addEventListener('click', () => sendAnimationEvent('ring'));

  // Send Text Message
  const handleSendMessage = () => {
    if (!currentPasscode || !profiles[currentPasscode]) {
      alert('Please select your profile (MAU or SUB) first!');
      joinModal.classList.add('active');
      return;
    }
    const text = messageInput.value.trim();
    if (!text) return;

    push(getMessagesRef(), {
      senderCode: currentPasscode,
      senderName: profiles[currentPasscode].name,
      text: text,
      timestamp: Date.now(),
      type: 'text'
    });

    playSound('send');
    messageInput.value = '';

    const myPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${profiles[currentPasscode].name}`);
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
    if (!currentPasscode || !profiles[currentPasscode]) return;
    const myPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${profiles[currentPasscode].name}`);
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

  // Photo Polaroid Upload Guard
  photoUploadTrigger.addEventListener('click', () => {
    if (!currentPasscode || !profiles[currentPasscode]) {
      alert('Please select your profile (MAU or SUB) first!');
      joinModal.classList.add('active');
      return;
    }
    photoInput.click();
  });

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && currentPasscode && profiles[currentPasscode]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const caption = prompt('Add a romantic polaroid caption:', 'Making memories together ♥');
        push(getMessagesRef(), {
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
      if (!currentPasscode || !profiles[currentPasscode]) {
        alert('Please select your profile (MAU or SUB) first!');
        joinModal.classList.add('active');
        return;
      }
      messageInput.value += ` ${btn.dataset.emoji} `;
      messageInput.focus();
    });
  });

  // Milestones Modal Event Listeners
  milestonesBtn.addEventListener('click', () => milestonesModal.classList.add('active'));
  togetherCounterBtn.addEventListener('click', () => milestonesModal.classList.add('active'));
  closeMilestonesBtn.addEventListener('click', () => milestonesModal.classList.remove('active'));

  // Select Profile Handler
  const selectProfile = (code) => {
    if (code !== 'MAU' && code !== 'SUB') {
      alert('Invalid passcode! Please click Mausikta or Subhranil avatar, or enter "MAU" / "SUB".');
      return;
    }
    currentPasscode = code;
    passcodeInput.value = code;
    joinModal.classList.remove('active');
    initFirebaseRoom();
  };

  // Join Space / Profile Card Selection
  mauPreview.addEventListener('click', () => {
    selectProfile('MAU');
  });

  subPreview.addEventListener('click', () => {
    selectProfile('SUB');
  });

  passcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      selectProfile(passcodeInput.value.trim().toUpperCase());
    }
  });

  joinSpaceBtn.addEventListener('click', () => {
    selectProfile(passcodeInput.value.trim().toUpperCase());
  });

  const switchUserBtn = document.getElementById('switchUserBtn');
  if (switchUserBtn) {
    switchUserBtn.addEventListener('click', () => {
      passcodeInput.value = currentPasscode;
      joinModal.classList.add('active');
    });
  }

  if (myAvatarThumb) {
    myAvatarThumb.addEventListener('click', (e) => {
      e.stopPropagation();
      passcodeInput.value = currentPasscode;
      joinModal.classList.add('active');
    });
  }

  // Window unload cleanup (mark presence offline, terminate ongoing call)
  window.addEventListener('beforeunload', () => {
    if (currentPasscode && profiles[currentPasscode]) {
      const myProfile = profiles[currentPasscode];
      const myPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${myProfile.name}`);
      set(myPresenceRef, {
        online: false,
        typing: false,
        lastSeen: serverTimestamp()
      });
    }
    if (isCallActive && currentPasscode) {
      set(getEndSignalRef(), {
        callerCode: currentPasscode,
        timestamp: Date.now()
      });
    }
  });

  // Theme Switching
  if (themeModalBtn) {
    themeModalBtn.addEventListener('click', () => themeModal.classList.add('active'));
  }
  if (closeThemeBtn) {
    closeThemeBtn.addEventListener('click', () => themeModal.classList.remove('active'));
  }

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

  // ALWAYS pop up Join Modal every time website is opened
  joinModal.classList.add('active');
});
