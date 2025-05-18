// Create a floating menu for login/register
const menu = document.createElement('div');
menu.id = 'floating-menu';
menu.innerHTML = `
  <div id="menu-button-container">
    <button id="menu-toggle">☰</button>
  </div>
  <div id="menu-content">
    <div id="user-section" style="display: none;">
      <span class="section-title">Conectado como</span>
      <div id="logged-user"></div>
      <button id="logout-button">Cerrar Sesión</button>
    </div>
    <div id="auth-sections">
      <div>
        <span class="section-title">Iniciar Sesión</span>
        <input id='login-username' placeholder='Usuario'>
        <input id='login-password' type='password' placeholder='Contraseña'>
        <button id="login-button">Iniciar Sesión</button>
      </div>
      <div>
        <span class="section-title">Registrarse</span>
        <input id='register-username' placeholder='Usuario'>
        <input id='register-password' type='password' placeholder='Contraseña'>
        <button id="register-button">Registrarse</button>
        <div id='auth-message'></div>      </div>
    </div>
    <hr style='width:100%;border:1px solid #333;margin:1.5em 0;'>
    <div>
      <span class="section-title">Desbloquear Conocimiento</span>
      <div id="qr-scanner-container">
        <video id="qr-video"></video>
        <div id="qr-scanner-overlay"></div>
      </div>
      <button class="scan-button" id="qr-scan-button">
        <i>📷</i> Escanear Código QR
      </button>
      <div style="text-align:center;margin:0.5em 0;color:#fff8;font-size:0.9em;">- o -</div>
      <input id="qr-code-input" placeholder="Introducir código (1-4)">
      <button id="qr-unlock-button">Desbloquear</button>
      <div id="qr-message"></div>
    </div>
  </div>
`;
document.body.appendChild(menu);

// Initialize menu state and add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menuContent = document.getElementById('menu-content');
    const menuContainer = document.getElementById('menu-button-container');
    
    // Menu toggle functionality
    if (menuToggle && menuContent && menuContainer) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            menuToggle.classList.toggle('active');
            menuContent.classList.toggle('active');
            menuContainer.classList.toggle('menu-open');
        });
    }

    // Add event listeners for auth buttons
    document.getElementById('login-button')?.addEventListener('click', login);
    document.getElementById('register-button')?.addEventListener('click', register);
    document.getElementById('logout-button')?.addEventListener('click', logout);
    
    // Add QR code event listeners
    document.getElementById('qr-scan-button')?.addEventListener('click', toggleQRScanner);
    document.getElementById('qr-unlock-button')?.addEventListener('click', handleUnlock);
    document.getElementById('qr-code-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUnlock();
        }
    });

    // Make sure menu is visible
    if (menuToggle) {
        menuToggle.style.opacity = '1';
        menuToggle.style.transform = 'none';
    }

    // Make content visible after page load
    if (menuContent) {
        menuContent.style.visibility = 'visible';
    }

    // Initialize login state
    updateLoginState();
});

function showAuthError(msg) {
  const authMsg = document.getElementById('auth-message');
  authMsg.innerHTML = `<span style="display:inline-flex;align-items:center;"><span style="font-size:1.3em;margin-right:0.4em;">❌</span>${msg}</span>`;
  authMsg.style.background = '#a11a2a';
  authMsg.style.color = '#fff';
  authMsg.style.padding = '0.3em 1em';
  authMsg.style.borderRadius = '8px';
  authMsg.style.fontWeight = 'bold';
  authMsg.style.boxShadow = '0 0 12px 2px #a11a2a88';
  authMsg.style.transition = 'transform 0.2s';
  authMsg.style.transform = 'scale(1.15)';
  setTimeout(() => {
    authMsg.style.transform = 'scale(1)';
    setTimeout(() => {
      authMsg.style.background = '';
      authMsg.style.color = '#ffe066';
      authMsg.style.padding = '';
      authMsg.style.borderRadius = '';
      authMsg.style.fontWeight = '';
      authMsg.style.boxShadow = '';
      authMsg.innerText = '';
    }, 1800);
  }, 200);
}

function updateLoginState() {
  const token = localStorage.getItem('token');
  const userSection = document.getElementById('user-section');
  const authSections = document.getElementById('auth-sections');
  
  if (token) {
    // Decode the JWT to get username
    const payload = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('logged-user').textContent = payload.username;
    userSection.style.display = 'block';
    authSections.style.display = 'none';
  } else {
    userSection.style.display = 'none';
    authSections.style.display = 'block';
  }
}

function logout() {
  localStorage.removeItem('token');
  updateLoginState();
  location.reload(); // Refresh to reset unlocked states
}

function login() {
  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: document.getElementById('login-username').value,
      password: document.getElementById('login-password').value
    })
  })
  .then(res => res.json())
  .then((data) => {      if (data.message === 'Invalid credentials') {
      showAuthError('Credenciales inválidas');
    } else {
      document.getElementById('auth-message').innerText = data.message;
      if (data.token) {
        localStorage.setItem('token', data.token);
        updateLoginState();
        // Force a re-render of the skill tree
        renderSkillTree();
        
        // Wait for the DOM to update
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const svg = document.querySelector('#skill-tree svg');
            if (svg) {
              const startNode = Array.from(svg.querySelectorAll('.skill-node')).find(node => {
                const transform = node.getAttribute('transform') || '';
                const x = transform.match(/translate\((\d+)/)?.[1];
                return x === '960'; // Start node's x coordinate
              });
              
              if (startNode) {
                // Make sure all child elements are visible first
                const group = d3.select(startNode);
                group.selectAll('*').style('opacity', 1);
                
                // Sequence of animations
                group.selectAll('circle')
                  .transition()
                  .duration(300)
                  .style('filter', 'url(#node-glow) brightness(2)')
                  .transition()
                  .duration(500)
                  .style('filter', 'url(#node-glow)');
                
                // Animate rays
                group.selectAll('line')
                  .style('transform-origin', 'center')
                  .style('transform', 'scale(0.5)')
                  .transition()
                  .duration(800)
                  .style('transform', 'scale(1.2)')
                  .transition()
                  .duration(400)
                  .style('transform', 'scale(1)');
                
                // Add extra glow effect
                const extraGlow = group.append('circle')
                  .attr('cx', skill.x)
                  .attr('cy', skill.y)
                  .attr('r', baseRadius * 2)
                  .attr('fill', 'none')
                  .attr('stroke', '#fff')
                  .attr('stroke-width', 2)
                  .attr('opacity', 0);
                
                extraGlow
                  .transition()
                  .duration(300)
                  .attr('r', baseRadius * 4)
                  .attr('opacity', 0.8)
                  .transition()
                  .duration(500)
                  .attr('r', baseRadius * 2)
                  .attr('opacity', 0)
                  .remove();
              }
            }
          });
        });
      }
    }
  });
}

function register() {
  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: document.getElementById('register-username').value,
      password: document.getElementById('register-password').value
    })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('auth-message').innerText = data.message;
  });
}

// QR Code handling variables and functions
let qrScannerActive = false;
let qrVideoStream = null;

function toggleQRScanner() {
  const scannerContainer = document.getElementById('qr-scanner-container');
  const qrVideo = document.getElementById('qr-video');
  const overlay = document.getElementById('qr-scanner-overlay');
  
  qrScannerActive = !qrScannerActive;
  
  if (qrScannerActive) {
    // Start QR scanner
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        qrVideoStream = stream;
        qrVideo.srcObject = stream;
        qrVideo.setAttribute('playsinline', ''); // Required for iOS Safari
        qrVideo.play();
        
        overlay.style.display = 'block';
        document.getElementById('qr-scan-button').innerHTML = 'Stop Scanning';

        // Start processing frames
        processQRCode();
      })
      .catch((err) => {
        console.error('Error accessing camera: ', err);
        showAuthError('Unable to access camera. Please check permissions.');
        qrScannerActive = false;
      });
  } else {
    // Stop QR scanner
    if (qrVideoStream) {
      const tracks = qrVideoStream.getTracks();
      tracks.forEach(track => track.stop());
      qrVideoStream = null;
    }
    qrVideo.srcObject = null;
    overlay.style.display = 'none';
    document.getElementById('qr-scan-button').innerHTML = '<i>📷</i> Scan QR Code';
  }
}

function processQRCode() {
  const qrVideo = document.getElementById('qr-video');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  function scanFrame() {
    if (!qrScannerActive) return;

    if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
      canvas.width = qrVideo.videoWidth;
      canvas.height = qrVideo.videoHeight;
      context.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        // Valid QR code found
        console.log('Decoded QR code:', code.data);
        document.getElementById('qr-code-input').value = code.data;
        handleUnlock();
        toggleQRScanner(); // Stop scanning after successful scan
      }
    }

    // Continue scanning
    if (qrScannerActive) {
      requestAnimationFrame(scanFrame);
    }
  }

  requestAnimationFrame(scanFrame);
}

function handleUnlock() {
  const codeInput = document.getElementById('qr-code-input');
  const qrMessage = document.getElementById('qr-message');
  const code = codeInput.value.trim();
    if (!code) {
    showAuthError('Por favor introduce un código o escanea un código QR');
    return;
  }
  
  fetch('/api/unlock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ code: String(code) })
  })
  .then(async res => {
    let data;
    try {
      data = await res.json();
    } catch (e) {      showAuthError('Error del servidor: respuesta inválida');
      return;
    }
    qrMessage.innerText = data.message || 'Error desconocido';
    if (data.success) {
      // Handle successful unlock (e.g., update UI, show success message)
      // For now, just reload the page to reflect changes
      location.reload();
    } else {
      // If unlock failed, show error message
      showAuthError(data.message || 'Desbloqueo fallido');
    }
  })
  .catch(err => {
    console.error('Error unlocking:', err);
    showAuthError('Ocurrió un error al desbloquear. Por favor, inténtalo de nuevo.');
  });
}

// QR Code scanning and handling integration
document.getElementById('qr-video').addEventListener('playing', () => {
  const qrVideo = document.getElementById('qr-video');
  const overlay = document.getElementById('qr-scanner-overlay');
  
  // Continuously decode QR code while video is playing
  const decodeFrame = () => {
    if (qrScannerActive && qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = qrVideo.videoWidth;
      canvas.height = qrVideo.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);
      
      // Decode the QR code from the canvas
      const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      
      if (code) {
        console.log('QR code result:', code.data);
        document.getElementById('qr-code-input').value = code.data;
        handleUnlock();
      } else {
        requestAnimationFrame(decodeFrame);
      }
    } else {
      requestAnimationFrame(decodeFrame);
    }
  };
  
  requestAnimationFrame(decodeFrame);
});

document.getElementById('qr-video').addEventListener('error', (e) => {
  console.error('Error with video element:', e);
  showAuthError('Error con la transmisión de video. Por favor, inténtalo de nuevo.');
});
