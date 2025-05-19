// QR code handling functionality
document.addEventListener('DOMContentLoaded', function() {
    let qrScanner = null;
    let lastScannedCode = '';
    let lastScannedTime = 0;

    async function checkCameraPermission() {
        try {
            // Check if we already have permission
            const permissions = await navigator.permissions.query({ name: 'camera' });
            return permissions.state;
        } catch (err) {
            console.log('Permissions API not supported, will try direct access');
            return 'prompt'; // Default to prompt on browsers that don't support permission check
        }
    }

    window.toggleQRScanner = async function() {
        const container = document.getElementById('qr-scanner-container');
        const video = document.getElementById('qr-video');
        const button = document.getElementById('qr-scan-button');
        const isActive = container.classList.toggle('active');
        
        if (isActive) {
            button.innerHTML = '<i>⏹️</i> Detener Escáner';
            
            // Show permission request message
            container.innerHTML = `
                <div id="loading-message" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;background:rgba(0,0,0,0.8);padding:20px;border-radius:8px;text-align:center;max-width:80%;">
                    <div style="margin-bottom:10px;">📸 Permiso de Cámara</div>
                    <div>Para escanear códigos QR, necesitamos acceso a tu cámara.</div>
                    <div style="margin-top:10px;font-size:0.9em;color:#aaa;">Por favor, acepta el permiso cuando aparezca.</div>
                </div>
            `;

            try {
                // Check permission status first
                const permissionStatus = await checkCameraPermission();
                
                if (permissionStatus === 'denied') {
                    throw new Error('Camera permission denied');
                }

                // Request camera with explicit mobile support
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: { ideal: 'environment' },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });

                // Update container with video elements after permission granted
                container.innerHTML = `
                    <video id="qr-video" playsinline></video>
                    <div id="qr-scanner-overlay"></div>
                `;

                const newVideo = document.getElementById('qr-video');
                newVideo.srcObject = stream;
                newVideo.setAttribute('playsinline', '');
                await newVideo.play();

                // Start QR detection loop
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                function scanQRCode() {
                    if (!container.classList.contains('active')) {
                        return;
                    }

                    if (newVideo.readyState === newVideo.HAVE_ENOUGH_DATA) {
                        canvas.width = newVideo.videoWidth;
                        canvas.height = newVideo.videoHeight;
                        context.drawImage(newVideo, 0, 0, canvas.width, canvas.height);
                        
                        try {
                            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                inversionAttempts: "dontInvert",
                            });
                            
                            if (code) {
                                const now = Date.now();
                                // Prevent multiple scans of the same code within 2 seconds
                                if (code.data !== lastScannedCode || now - lastScannedTime > 2000) {
                                    lastScannedCode = code.data;
                                    lastScannedTime = now;
                                    
                                    // Auto-fill and submit the code
                                    const input = document.getElementById('qr-code-input');
                                    input.value = code.data;
                                    
                                    // Visual feedback
                                    const overlay = document.getElementById('qr-scanner-overlay');
                                    overlay.style.border = '3px solid #00ff00';
                                    setTimeout(() => {
                                        overlay.style.border = '';
                                        // Stop scanner and submit code
                                        toggleQRScanner();
                                        handleUnlock();
                                    }, 500);
                                    return;
                                }
                            }
                        } catch (e) {
                            console.error('QR scanning error:', e);
                        }
                    }
                    
                    qrScanner = requestAnimationFrame(scanQRCode);
                }
                
                qrScanner = requestAnimationFrame(scanQRCode);
                
            } catch (err) {
                console.error('Camera access error:', err);
                
                // Show appropriate error message based on error type
                const errorMessage = err.name === 'NotAllowedError' || err.message === 'Camera permission denied'
                    ? `
                        <div style="text-align:center;padding:20px;color:white;background:rgba(0,0,0,0.8);border-radius:8px;">
                            <div style="margin-bottom:10px;">❌ Acceso Denegado</div>
                            <div>No se pudo acceder a la cámara porque el permiso fue denegado.</div>
                            <div style="margin-top:15px;font-size:0.9em;">
                                Para permitir el acceso:
                                <ol style="text-align:left;margin-top:10px;">
                                    <li>Haz clic en el icono 🔒 en la barra de direcciones</li>
                                    <li>Selecciona "Permitir" para la cámara</li>
                                    <li>Recarga la página</li>
                                </ol>
                            </div>
                        </div>
                    `
                    : `
                        <div style="text-align:center;padding:20px;color:white;background:rgba(0,0,0,0.8);border-radius:8px;">
                            <div style="margin-bottom:10px;">❌ Error</div>
                            <div>No se pudo acceder a la cámara.</div>
                            <div style="margin-top:10px;font-size:0.9em;color:#aaa;">
                                Asegúrate de que tu dispositivo tiene una cámara y de usar un navegador compatible.
                            </div>
                        </div>
                    `;
                
                container.innerHTML = errorMessage;
                button.innerHTML = '<i>📷</i> Escanear Código QR';
            }
        } else {
            button.innerHTML = '<i>📷</i> Escanear Código QR';
            // Stop camera if scanner is deactivated
            try {
                if (video.srcObject) {
                    video.srcObject.getTracks().forEach(track => track.stop());
                }
                if (qrScanner) {
                    cancelAnimationFrame(qrScanner);
                    qrScanner = null;
                }
                // Reset the container
                container.innerHTML = `
                    <video id="qr-video" playsinline></video>
                    <div id="qr-scanner-overlay"></div>
                `;
            } catch (err) {
                console.error('Error stopping camera:', err);
            }
        }
    };

    function scanQRCode() {
        const video = document.getElementById('qr-video');
        if (!video || video.paused || video.ended) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            // QR code found - use it
            const input = document.getElementById('qr-code-input');
            if (input) {
                input.value = code.data;
                handleUnlock();
            }
            toggleQRScanner(); // Close scanner after successful scan
        } else {
            // Keep scanning
            qrScanner = requestAnimationFrame(scanQRCode);
        }
    }

    window.handleUnlock = function() {
        const menuInput = document.getElementById('qr-code-input');
        const code = menuInput ? menuInput.value.trim() : '';
        
        console.log('Attempting to unlock with code:', code);
          if (!code) {
            showQRMessage('Por favor, introduce un código', true);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            showQRMessage('Debes iniciar sesión primero', true);
            return;
        }

        fetch('/api/unlock', {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: code })
        })
        .then(res => {
            console.log('Server response:', res.status);            if (!res.ok) {
                throw new Error(res.status === 401 ? 'Debes iniciar sesión primero' : 'Error de conexión');
            }
            return res.json();
        })
        .then(data => {
            console.log('Response data:', data);
            const isError = !data.success;
            showQRMessage(data.message || (isError ? 'Desbloqueo fallido' : '¡Desbloqueado!'), isError);

            if (data.success && data.unlockedSkills) {
                // Update the unlocked skills and re-render
                window.unlockedSkillsFromBackend = data.unlockedSkills;
                if (typeof window.checkUnlockedSkills === 'function') {
                    window.checkUnlockedSkills();
                }
                // Clear input on success
                if (menuInput) {
                    menuInput.value = '';
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showQRMessage(error.message || 'Error de conexión con el servidor', true);
        });
    };
});

function showQRMessage(msg, isError = false) {
    const qrMsg = document.getElementById('qr-message');
    if (!qrMsg) return;

    // Remove any existing classes
    qrMsg.className = '';

    if (isError) {
        qrMsg.classList.add('error');
        qrMsg.innerHTML = `
            <span style="display:inline-flex;align-items:center;">
                <span class="error-icon">✕</span>
                <span>${msg}</span>
            </span>`;
    } else {
        qrMsg.innerHTML = `
            <span style="display:inline-flex;align-items:center;">
                <span style="font-size:1.3em;margin-right:0.4em;">✨</span>
                <span>${msg}</span>
            </span>`;
        qrMsg.style.background = '#2a824d';
        qrMsg.style.color = '#fff';
        qrMsg.style.padding = '0.3em 1em';
        qrMsg.style.borderRadius = '8px';
        qrMsg.style.fontWeight = 'bold';
        qrMsg.style.boxShadow = '0 0 12px 2px #2a824d88';
        qrMsg.style.transform = 'scale(1.15)';
        
        // Clear success message after delay
        setTimeout(() => {
            qrMsg.style.transform = 'scale(1)';
            setTimeout(() => {
                if (!qrMsg.classList.contains('error')) {  // Only clear if it's not showing an error
                    qrMsg.style.background = '';
                    qrMsg.style.color = '#ffe066';
                    qrMsg.style.padding = '';
                    qrMsg.style.borderRadius = '';
                    qrMsg.style.fontWeight = '';
                    qrMsg.style.boxShadow = '';
                    qrMsg.innerHTML = '';
                }
            }, 2000);
        }, 200);
    }
}
