// QR code handling functionality
document.addEventListener('DOMContentLoaded', function() {
    // QR Scanner functionality
    let qrScanner = null;

    window.toggleQRScanner = async function() {
        const container = document.getElementById('qr-scanner-container');
        const isActive = container.classList.toggle('active');
        
        if (isActive) {
            // Import jsQR from CDN if needed
            if (!window.jsQR) {
                const jsQRScript = document.createElement('script');
                jsQRScript.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
                document.head.appendChild(jsQRScript);
                await new Promise(resolve => jsQRScript.onload = resolve);
            }
            
            const video = document.getElementById('qr-video');
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                });
                
                video.srcObject = stream;
                await video.play();
                
                // Start QR detection loop
                qrScanner = requestAnimationFrame(scanQRCode);
            } catch (err) {
                console.error('Camera access error:', err);
                container.innerHTML = '<div style="color:#fff;padding:1em;text-align:center;">Camera access denied or not available</div>';
            }
        } else {
            // Stop camera if scanner is deactivated
            const video = document.getElementById('qr-video');
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
            }
            if (qrScanner) {
                cancelAnimationFrame(qrScanner);
                qrScanner = null;
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

        if (!/^[1-4]$/.test(code)) {
            showQRMessage('Por favor, introduce un número entre 1 y 4', true);
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
