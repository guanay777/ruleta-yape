// ======================
// 🎰 CONFIGURACIÓN INICIAL
// ======================
let currentBalance = 0;
let currentBet = 0; // Cambiado de 20 a 0 - NINGÚN MONTO POR DEFECTO
let isRegistered = false;
let depositConfirmed = false;
let isSpinning = false;
let playerName = '';
let playerPhone = '';
let wheelSegments = [];
let depositCode = ''; // Código único para cada depósito
let checkingDeposit = false; // Para evitar múltiples comprobaciones
let lastDepositCheck = 0; // Timestamp del último check
let canChangeBet = true; // Control para cambiar apuesta
let depositStartTime = 0; // Timestamp cuando se inició el depósito

// 🎨 Colores de los segmentos (NUEVA PALETA)
const SEGMENT_COLORS = [
    '#720e9e', '#00FFFF', '#FFFFFF', '#720e9e',
    '#00FFFF', '#FFFFFF', '#720e9e', '#00FFFF',
    '#FFFFFF', '#720e9e', '#00FFFF', '#FFFFFF'
];

// 🎯 MULTIPLICADORES FIJOS - 12 SEGMENTOS
// Índice 0 = segmento 1, Índice 11 = segmento 12
const FIXED_MULTIPLIERS = [
    0.0,   // Segmento 1: PERDISTE
    1.2,   // Segmento 2: PREMIO PEQUEÑO x1.2
    0.0,   // Segmento 3: PERDISTE
    1.0,   // Segmento 4: PREMIO PEQUEÑO x1.0
    0.0,   // Segmento 5: PERDISTE
    4.0,   // Segmento 6: PREMIO MEDIANO x4.0
    0.0,   // Segmento 7: PERDISTE
    0.8,   // Segmento 8: PREMIO PEQUEÑO x0.8
    10.0,  // Segmento 9: PREMIO MAYOR x10.0
    2.0,   // Segmento 10: PREMIO MEDIANO x2.0
    0.0,   // Segmento 11: PERDISTE
    0.5    // Segmento 12: PREMIO PEQUEÑO x0.5
];

// NOMBRES FIJOS PARA CADA SEGMENTO
const SEGMENT_NAMES = [
    "¡OH NO!",      // Segmento 1
    "P. PEQUEÑO",   // Segmento 2
    "¡OH NO!",      // Segmento 3
    "P. PEQUEÑO",   // Segmento 4
    "¡OH NO!",      // Segmento 5
    "P. MEDIANO",   // Segmento 6
    "¡OH NO!",      // Segmento 7
    "P. PEQUEÑO",   // Segmento 8
    "¡PREMIO MAYOR!", // Segmento 9
    "P. MEDIANO",   // Segmento 10
    "¡OH NO!",      // Segmento 11
    "P. PEQUEÑO"    // Segmento 12
];

// 🧱 Elementos del DOM
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');
const balanceElement = document.getElementById('balance');
const currentBetElement = document.getElementById('currentBet');
const currentResultElement = document.getElementById('currentResult');
const winMessageElement = document.getElementById('winMessage');
const amountButtons = document.querySelectorAll('.amount-btn');
const depositBtn = document.getElementById('depositBtn');
const confirmBtn = document.getElementById('confirmBtn');
const confirmationStatus = document.getElementById('confirmationStatus');
const qrAmountElement = document.getElementById('qrAmount');
const qrPlaceholder = document.getElementById('qrPlaceholder');
const registerBtn = document.getElementById('registerBtn');
const registerModal = document.getElementById('registerModal');
const cancelRegisterBtn = document.getElementById('cancelRegister');
const saveRegisterBtn = document.getElementById('saveRegister');
const modalNameInput = document.getElementById('modalName');
const modalPhoneInput = document.getElementById('modalPhone');
const registerStatus = document.getElementById('registerStatus');
const withdrawBtn = document.getElementById('withdrawBtn');
const endSessionBtn = document.getElementById('endSessionBtn');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const recentWinsElement = document.getElementById('recentWins');

// 🔐 Configuración de Telegram
const TELEGRAM_BOT_TOKEN = '8166864676:AAEIb2KgLV-hGLoJGoBRv2F_uAhytxuf9_c';
const TELEGRAM_CHAT_ID = '1182421471';

// 🔗 Tu QR estático
const STATIC_QR_URL = 'https://i.ibb.co/Qjh76HMb/julio2026.jpg';

// ⏰ Configuración de tiempo (5 minutos = 300,000 milisegundos)
const DEPOSIT_EXPIRATION_TIME = 300000; // 5 minutos en milisegundos
const DEPOSIT_EXPIRATION_SECONDS = 300; // 5 minutos en segundos

// 🏆 Datos para ganancias recientes (aleatorios)
const RECENT_PLAYERS = [
    { name: 'Carlos M.', amount: 150, time: 'Hace 2 min' },
    { name: 'Ana G.', amount: 80, time: 'Hace 5 min' },
    { name: 'Luis R.', amount: 200, time: 'Hace 8 min' },
    { name: 'María F.', amount: 120, time: 'Hace 12 min' },
    { name: 'José P.', amount: 90, time: 'Hace 15 min' },
    { name: 'Sofía L.', amount: 180, time: 'Hace 20 min' },
    { name: 'Miguel A.', amount: 250, time: 'Hace 25 min' },
    { name: 'Laura C.', amount: 70, time: 'Hace 30 min' },
    { name: 'Pedro S.', amount: 300, time: 'Hace 35 min' },
    { name: 'Carmen V.', amount: 110, time: 'Hace 40 min' }
];

// 🕒 Intervalo para verificar confirmaciones
let depositCheckInterval = null;
let depositTimeout = null;
let countdownInterval = null; // Intervalo para el contador visual

// 🔊 Sonidos
const spinSound = document.getElementById('spinSound');
const winSound = document.getElementById('winSound');
const loseSound = document.getElementById('loseSound');

// ======================
// 🔐 SISTEMA DE AUTORIZACIÓN TELEGRAM MEJORADO
// ======================

// Generar código único para depósito
function generateDepositCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Enviar solicitud de autorización a Telegram
function sendDepositRequestToTelegram() {
    depositCode = generateDepositCode();
    lastDepositCheck = 0; // Resetear timestamp
    depositStartTime = Date.now(); // Registrar hora de inicio
    
    const message = `
🎰 *SOLICITUD DE AUTORIZACIÓN DE DEPÓSITO*

👤 *Jugador:* ${playerName}
📱 *Teléfono:* ${playerPhone}
💰 *Monto:* ${currentBet} Bs.
🔢 *Código:* \`${depositCode}\`
⏰ *Hora:* ${new Date().toLocaleTimeString()}
🆔 *ID de Sesión:* ${generateSessionId()}
⌛ *Expira en:* 5 minutos

✅ *Para autorizar este depósito, responde con:*
\`/autorizar ${depositCode}\`

❌ *Para rechazar, responde con:*
\`/rechazar ${depositCode}\`

⚠️ *Este código expira en 5 minutos (${new Date(Date.now() + DEPOSIT_EXPIRATION_TIME).toLocaleTimeString()})*
    `;
    
    sendToTelegram(message);
    
    // Mostrar código al usuario
    confirmationStatus.innerHTML = `
        <div style="text-align:center;">
            <i class="fas fa-clock fa-spin" style="color:#f39c12;font-size:2rem;"></i>
            <h3>Esperando autorización del bot</h3>
            <p style="font-size:1.2rem;margin:10px 0;">
                <strong>Código:</strong> <span style="background:#2c3e50;padding:8px 15px;border-radius:8px;font-family:monospace;letter-spacing:2px;">${depositCode}</span>
            </p>
            <p>Envía este código al bot de Telegram para autorizar</p>
            <p><small style="color:#bdc3c7;"><i class="fas fa-info-circle"></i> El bot verificará el pago y autorizará automáticamente</small></p>
            <div id="countdownTimer" style="margin-top:15px;color:#27ae60;font-weight:bold;">
                <i class="fas fa-hourglass-start"></i> Tiempo restante: <span id="timeLeft">05:00</span>
            </div>
            <div style="margin-top:10px;font-size:0.9rem;color:#7f8c8d;">
                <i class="fas fa-exclamation-triangle"></i> Expira a las: <strong id="expiresAt">${new Date(Date.now() + DEPOSIT_EXPIRATION_TIME).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
            </div>
        </div>
    `;
    
    // Iniciar verificación periódica
    startDepositVerification();
    startCountdownTimer();
}

// Generar ID de sesión único
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Temporizador de cuenta regresiva (MEJORADO Y SINCROnIZADO)
function startCountdownTimer() {
    // Limpiar cualquier temporizador anterior
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    let timeLeft = DEPOSIT_EXPIRATION_SECONDS; // 5 minutos en segundos
    const timerElement = document.getElementById('timeLeft');
    const timerContainer = document.getElementById('countdownTimer');
    const expiresAtElement = document.getElementById('expiresAt');
    
    if (!timerElement) return;
    
    // Mostrar hora de expiración
    const expirationTime = new Date(Date.now() + DEPOSIT_EXPIRATION_TIME);
    if (expiresAtElement) {
        expiresAtElement.textContent = expirationTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        // Actualizar visualmente
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Cambiar color según tiempo restante
        if (timeLeft < 60) {
            // Menos de 1 minuto: ROJO
            timerElement.style.color = '#e74c3c';
            if (timerContainer) timerContainer.style.color = '#e74c3c';
            timerElement.innerHTML = `<span style="animation:blink 1s infinite">${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</span>`;
        } else if (timeLeft < 180) {
            // Menos de 3 minutos: NARANJA
            timerElement.style.color = '#f39c12';
            if (timerContainer) timerContainer.style.color = '#f39c12';
        } else {
            // Más de 3 minutos: VERDE
            timerElement.style.color = '#27ae60';
            if (timerContainer) timerContainer.style.color = '#27ae60';
        }
        
        // Verificar si el tiempo realmente expiró
        const elapsedTime = Date.now() - depositStartTime;
        if (elapsedTime >= DEPOSIT_EXPIRATION_TIME || timeLeft <= 0) {
            clearInterval(countdownInterval);
            if (!depositConfirmed) {
                handleDepositExpired();
            }
        }
    }, 1000);
    
    // Añadir estilo CSS para parpadeo
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Manejar depósito expirado (MEJORADO)
function handleDepositExpired() {
    // Limpiar TODOS los intervalos
    clearAllDepositIntervals();
    
    confirmationStatus.innerHTML = `
        <div style="text-align:center;">
            <i class="fas fa-times-circle" style="color:#e74c3c;font-size:2rem;"></i>
            <h3 style="color:#e74c3c">TIEMPO EXPIRADO</h3>
            <p>El código de autorización ha expirado después de 5 minutos.</p>
            <p><small>Por favor, genera un nuevo código de depósito.</small></p>
            <div style="margin-top:15px;padding:10px;background:#e74c3c20;border-radius:5px;font-size:0.9rem;">
                <i class="fas fa-info-circle"></i> Tienes tiempo suficiente para:<br>
                1. Realizar el pago<br>
                2. Tomar capturas<br>
                3. Enviar al bot
            </div>
        </div>
    `;
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-redo"></i> Generar Nuevo Código';
    depositBtn.disabled = false;
    canChangeBet = true; // Permitir cambiar apuesta de nuevo
    
    // Habilitar botones de monto
    amountButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    
    // Enviar notificación de expiración a Telegram
    sendToTelegram(`
⏰ *DEPÓSITO EXPIRADO*

🔢 *Código:* ${depositCode}
👤 *Jugador:* ${playerName}
💰 *Monto:* ${currentBet} Bs.
⏰ *Hora inicio:* ${new Date(depositStartTime).toLocaleTimeString()}
⏰ *Hora expiración:* ${new Date().toLocaleTimeString()}
🕐 *Duración:* 5 minutos completos

⚠️ *El jugador debe generar un nuevo código*
    `);
    
    showNotification('⚠️ Código expirado después de 5 minutos. Genera uno nuevo.');
}

// Limpiar todos los intervalos de depósito
function clearAllDepositIntervals() {
    if (depositCheckInterval) {
        clearInterval(depositCheckInterval);
        depositCheckInterval = null;
    }
    if (depositTimeout) {
        clearTimeout(depositTimeout);
        depositTimeout = null;
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// Verificar si el depósito fue autorizado (MEJORADO CON VERIFICACIÓN DE TIEMPO)
async function checkDepositAuthorization() {
    if (checkingDeposit || !depositCode || Date.now() - lastDepositCheck < 3000) {
        return; // Evitar checks muy frecuentes
    }
    
    // VERIFICAR PRIMERO SI HA EXPIRADO EL TIEMPO
    const elapsedTime = Date.now() - depositStartTime;
    if (elapsedTime >= DEPOSIT_EXPIRATION_TIME) {
        if (!depositConfirmed) {
            handleDepositExpired();
        }
        return;
    }
    
    checkingDeposit = true;
    lastDepositCheck = Date.now();
    
    try {
        // 🔄 MÉTODO 1: Verificar mediante API de Telegram (mejor)
        const telegramStatus = await checkTelegramAuthorization();
        if (telegramStatus.authorized) {
            handleSuccessfulAuthorization();
            return;
        }
        
        if (telegramStatus.rejected) {
            handleRejectedAuthorization();
            return;
        }
        
        // 🔄 MÉTODO 2: Verificar en localStorage (para desarrollo/pruebas)
        const localAuth = localStorage.getItem(`deposit_${depositCode}`);
        if (localAuth === 'authorized') {
            handleSuccessfulAuthorization();
            localStorage.removeItem(`deposit_${depositCode}`);
            return;
        }
        
        if (localAuth === 'rejected') {
            handleRejectedAuthorization();
            localStorage.removeItem(`deposit_${depositCode}`);
            return;
        }
        
    } catch (error) {
        console.error('Error verificando depósito:', error);
    } finally {
        checkingDeposit = false;
    }
}

// Verificar autorización en Telegram directamente
async function checkTelegramAuthorization() {
    try {
        // Obtener actualizaciones del bot
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-10&timeout=1`);
        const data = await response.json();
        
        if (!data.ok || !data.result) {
            return { authorized: false, rejected: false };
        }
        
        // Buscar mensajes que contengan nuestro código
        const updates = data.result;
        for (const update of updates) {
            if (update.message && update.message.text) {
                const text = update.message.text.toLowerCase();
                
                // Buscar comandos de autorización
                if (text.includes(`/autorizar ${depositCode}`.toLowerCase()) || 
                    text.includes(`autorizar ${depositCode}`.toLowerCase())) {
                    return { authorized: true, rejected: false };
                }
                
                // Buscar comandos de rechazo
                if (text.includes(`/rechazar ${depositCode}`.toLowerCase()) || 
                    text.includes(`rechazar ${depositCode}`.toLowerCase())) {
                    return { authorized: false, rejected: true };
                }
            }
        }
        
        return { authorized: false, rejected: false };
    } catch (error) {
        console.error('Error checking Telegram:', error);
        return { authorized: false, rejected: false };
    }
}

// Manejar autorización exitosa
function handleSuccessfulAuthorization() {
    clearAllDepositIntervals();
    
    depositConfirmed = true;
    currentBalance += currentBet;
    updateBalance();
    
    // Bloquear cambio de apuesta durante esta sesión
    canChangeBet = false;
    
    // Deshabilitar botones de monto
    amountButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
    });
    
    // Calcular tiempo transcurrido
    const elapsedTime = Date.now() - depositStartTime;
    const elapsedSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    
    // Actualizar interfaz
    confirmationStatus.innerHTML = `
        <div style="text-align:center;color:#2ecc71">
            <i class="fas fa-check-circle" style="font-size:3rem;"></i>
            <h3>¡DEPÓSITO AUTORIZADO!</h3>
            <p style="font-size:1.2rem;">Monto: <strong>${currentBet} Bs.</strong></p>
            <p style="font-size:1.2rem;">Nuevo saldo: <strong>${currentBalance} Bs.</strong></p>
            <p><small><i class="fas fa-clock"></i> Autorizado en ${minutes}:${seconds.toString().padStart(2, '0')} minutos</small></p>
            <div style="margin-top:15px;padding:10px;background:#27ae60;border-radius:5px;">
                <i class="fas fa-dice"></i> ¡Ya puedes girar la ruleta!
            </div>
        </div>
    `;
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Depósito Autorizado';
    spinBtn.disabled = false;
    depositBtn.disabled = true;
    
    showNotification(`✅ Depósito de ${currentBet} Bs. autorizado en ${minutes}:${seconds.toString().padStart(2, '0')} minutos. ¡Buena suerte!`);
    
    // Enviar confirmación a Telegram
    sendToTelegram(`
✅ *DEPÓSITO AUTORIZADO - CONFIRMACIÓN*

👤 *Jugador:* ${playerName}
📱 *Teléfono:* ${playerPhone}
💰 *Monto:* ${currentBet} Bs.
📊 *Nuevo saldo:* ${currentBalance} Bs.
🔢 *Código:* ${depositCode}
✅ *Estado:* AUTORIZADO
⏰ *Hora de inicio:* ${new Date(depositStartTime).toLocaleTimeString()}
⏰ *Hora de autorización:* ${new Date().toLocaleTimeString()}
🕐 *Tiempo transcurrido:* ${minutes}:${seconds.toString().padStart(2, '0')}

🎰 *El jugador ya puede apostar en la ruleta*
    `);
}

// Manejar autorización rechazada
function handleRejectedAuthorization() {
    clearAllDepositIntervals();
    
    confirmationStatus.innerHTML = `
        <div style="text-align:center;color:#e74c3c">
            <i class="fas fa-times-circle" style="font-size:3rem;"></i>
            <h3>DEPÓSITO RECHAZADO</h3>
            <p>El depósito ha sido rechazado por el bot.</p>
            <p><small>Posible motivo: pago no verificado o código incorrecto.</small></p>
            <div style="margin-top:15px;padding:10px;background:#c0392b;border-radius:5px;">
                <i class="fas fa-redo"></i> Intenta con un nuevo depósito
            </div>
        </div>
    `;
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-times-circle"></i> Depósito Rechazado';
    depositBtn.disabled = false;
    spinBtn.disabled = true;
    canChangeBet = true; // Permitir cambiar apuesta de nuevo
    
    // Habilitar botones de monto
    amountButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    
    showNotification('❌ Depósito rechazado por el bot. Verifica tu pago.');
    
    // Enviar notificación de rechazo a Telegram
    sendToTelegram(`
❌ *DEPÓSITO RECHAZADO*

👤 *Jugador:* ${playerName}
🔢 *Código:* ${depositCode}
💰 *Monto:* ${currentBet} Bs.
⏰ *Hora de inicio:* ${new Date(depositStartTime).toLocaleTimeString()}
⏰ *Hora de rechazo:* ${new Date().toLocaleTimeString()}

⚠️ *El jugador debe verificar el pago y generar nuevo código*
    `);
}

// Iniciar verificación periódica (MEJORADA)
function startDepositVerification() {
    // Limpiar intervalos anteriores
    clearAllDepositIntervals();
    
    // Verificar cada 3 segundos (pero no demasiado rápido)
    depositCheckInterval = setInterval(() => {
        checkDepositAuthorization();
    }, 3000);
    
    // Expirar después de 5 minutos EXACTOS
    depositTimeout = setTimeout(() => {
        if (!depositConfirmed) {
            handleDepositExpired();
        }
    }, DEPOSIT_EXPIRATION_TIME + 1000); // +1 segundo para asegurar
}

// ======================
// 🤖 INTEGRACIÓN CON TELEGRAM
// ======================
function sendToTelegram(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('⚠️ Token o Chat ID de Telegram no configurados');
        return;
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            disable_notification: false
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.ok) {
            console.error('❌ Telegram API error:', data.description);
        }
    })
    .catch(error => {
        console.error('❌ Error de conexión con Telegram:', error);
    });
}

// ======================
// 💰 SISTEMA DE DEPÓSITOS CON QR ESTÁTICO (CORREGIDO)
// ======================
function generateQRCode() {
    if (!isRegistered) {
        showNotification('Primero debes registrar tus datos');
        return;
    }
    
    // Verificar que se haya seleccionado un monto
    if (currentBet === 0) {
        showNotification('Por favor, primero selecciona un monto de apuesta');
        return;
    }
    
    // Mostrar tu QR estático
qrPlaceholder.innerHTML = `
    <div style="text-align: center;">
        <img src="${STATIC_QR_URL}" alt="QR para depositar ${currentBet} Bs." 
             class="qr-image qr-zoomable" 
             style="width: 200px; height: 200px; border-radius: 10px; cursor: pointer; object-fit: cover;">
        <p style="margin-top:15px;font-weight:bold;font-size:1.1rem;">ESCANEA PARA DEPOSITAR</p>
        <div class="qr-amount" style="font-size:1.3rem;margin:10px 0;">${currentBet} Bs.</div>
        <p style="font-size: 0.8rem; color: #f5f8f8ff; margin-top: 5px;">
            </i> Presiona la imagen para ampliar
        </p>
    </div>
`;
    
    // Bloquear cambio de apuesta una vez generado QR
    canChangeBet = false;
    amountButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
    });
    
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Solicitar Autorización';
    depositBtn.disabled = true;
    spinBtn.disabled = true;
    
    // Mostrar instrucciones
    confirmationStatus.innerHTML = `
        <div style="text-align:center;">
            <i class="fas fa-qrcode" style="color:#3498db;font-size:2rem;"></i>
            <h3>REALIZAR EL PAGO</h3>
            <p>1. Escanea el QR y paga <strong>${currentBet} Bs.</strong></p>
            <p>2. Guarda el comprobante (captura de pantalla)</p>
            <p>3. Haz clic en "Solicitar Autorización"</p>
            <div style="margin-top:15px;padding:10px;background:#3498db20;border-radius:5px;">
                <i class="fas fa-spinner fa-spin"></i> Tienes <strong>5 minutos completos</strong> para solicitar autorización
            </div>
            <div style="margin-top:10px;font-size:0.9rem;color:#2ecc71;">
                <i class="fas fa-check-circle"></i> el sistema confirmara su deposito habilitando la ruleta
            </div>
        </div>
    `;
    confirmationStatus.style.color = '#3498db';
    
    showNotification(`QR mostrado para depósito de ${currentBet} Bs. Tienes 5 minutos para completar el proceso.`);
}

function confirmDeposit() {
    // Solicitar autorización al bot
    sendDepositRequestToTelegram();
    
    // Cambiar estado del botón
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Esperando autorización...';
    
    showNotification(`Solicitud enviada al bot. Código: ${depositCode}. Tienes 5 minutos.`);
}

// ======================
// 🎡 RULETA Y JUEGO
// ======================
function createWheelSegments() {
    wheel.innerHTML = '';
    
    // Si no hay apuesta seleccionada, mostrar ruleta vacía
    if (currentBet === 0) {
        const segmentAngle = 360 / 12; // 30° por segmento
        for (let i = 0; i < 12; i++) {
            const segment = document.createElement('div');
            segment.className = 'wheel-segment';
            // CORRECCIÓN: Restar 15° para centrar cada segmento
            const startAngle = i * segmentAngle;
            segment.style.transform = `rotate(${startAngle}deg)`;
            segment.style.backgroundColor = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
            
            const content = document.createElement('div');
            content.className = 'segment-content';
            content.innerHTML = `
                <div style="font-size:0.8rem">APUESTA Y GANA</div>
                <div style="font-size:0.8rem;margin-top:-5px;"></div>`;       
            segment.appendChild(content);
            wheel.appendChild(segment);
        }
        return;
    }
    
    // Si hay apuesta seleccionada, crear ruleta normal
    wheelSegments = generatePrizesForBet(currentBet);
    const segmentAngle = 360 / wheelSegments.length;

    wheelSegments.forEach((prize, index) => {
        const segment = document.createElement('div');
        segment.className = 'wheel-segment';
        // CORRECCIÓN: Misma corrección para segmentos con premios
        const startAngle = index * segmentAngle;
        segment.style.transform = `rotate(${startAngle}deg)`;
        segment.style.backgroundColor = SEGMENT_COLORS[index % SEGMENT_COLORS.length];

        const content = document.createElement('div');
        content.className = 'segment-content';
        content.innerHTML = `
                <div style="font-size:0.9rem;line-height:1;margin-left:5px;margin-top:-10px">${prize.text}</div>
                <div style="font-size:0.6rem;line-height:1;margin-left:8px;margin-top:2px">${prize.subtext}</div>`;
        segment.appendChild(content);
        wheel.appendChild(segment);
    });
}

function spinWheel() {
    if (isSpinning) {
        showNotification('La ruleta ya está girando...');
        return;
    }
    
    if (!depositConfirmed) {
        showNotification('Primero debes tener un depósito autorizado');
        return;
    }
    
    if (currentBalance < currentBet) {
        showNotification('Saldo insuficiente. Realiza un depósito.');
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    amountButtons.forEach(btn => btn.disabled = true);
    depositBtn.disabled = true;

    currentBalance -= currentBet;
    updateBalance();

    playSound(spinSound);

    const winProbability = calculateWinProbability(currentBet);
    const isWin = Math.random() < winProbability;
    const validSegments = isWin ? 
        wheelSegments.filter(s => s.value > 0) : 
        wheelSegments.filter(s => s.value === 0);
    
    const segmentIndex = Math.floor(Math.random() * 12); // 0-11
    const winningSegment = wheelSegments[segmentIndex];
    const segmentAngle = 360 / 12; // 30° fijos
    const totalRotation = (360 * 5) + (segmentIndex * segmentAngle) + (Math.random() * 10);

    wheel.style.transition = 'transform 5s cubic-bezier(0.2,0.8,0.3,1)';
    wheel.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
        showResult(winningSegment);
        isSpinning = false;
        
        // Si ganó algo, reactivar botón de girar si hay saldo
        if (winningSegment.value > 0) {
            spinBtn.disabled = currentBalance < currentBet;
        } else {
            // Si perdió, verificar si puede seguir jugando
            spinBtn.disabled = currentBalance < currentBet;
        }
        
        // Mantener botones de monto deshabilitados durante la sesión
        amountButtons.forEach(btn => {
            btn.disabled = !canChangeBet;
            btn.style.opacity = canChangeBet ? '1' : '0.6';
        });
        
        depositBtn.disabled = !canChangeBet;

        if (winningSegment.value > 0) {
            currentBalance += winningSegment.value;
            updateBalance();
            showNotification(`¡FELICIDADES! Ganaste ${winningSegment.value} Bs.`);
            playSound(winSound);
            
            sendToTelegram(
                `🎉 *¡GANADOR!*\n` +
                `👤 *Jugador:* ${playerName}\n` +
                `💰 *Ganancia:* ${winningSegment.value} Bs.\n` +
                `🎰 *Apuesta:* ${currentBet} Bs.\n` +
                `📊 *Nuevo saldo:* ${currentBalance} Bs.`
            );
        } else {
            showNotification('¡Sigue intentando!');
            playSound(loseSound);
        }

        setTimeout(() => {
            wheel.style.transition = 'none';
            wheel.style.transform = 'rotate(0deg)';
            setTimeout(createWheelSegments, 100);
        }, 5200);
    }, 5000);
}

// ======================
// 🏆 GANANCIAS RECIENTES (ALEATORIAS)
// ======================
function generateRecentWins() {
    if (!recentWinsElement) return;
    
    // Seleccionar 3-5 ganadores aleatorios
    const randomCount = Math.floor(Math.random() * 3) + 3; // 3 a 5 ganadores
    const shuffled = [...RECENT_PLAYERS].sort(() => 0.5 - Math.random());
    const selectedWins = shuffled.slice(0, randomCount);
    
    recentWinsElement.innerHTML = selectedWins.map(win => `
        <div class="recent-win-item">
            <div class="recent-win-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="recent-win-details">
                <div class="recent-win-name">${win.name}</div>
                <div class="recent-win-time">${win.time}</div>
            </div>
            <div class="recent-win-amount">
                +${win.amount} Bs.
            </div>
        </div>
    `).join('');
}

function addToRecentWins(name, amount) {
    if (!recentWinsElement) return;
    
    // Crear nuevo elemento de ganancia
    const timeOptions = ['Hace 1 min', 'Hace 2 min', 'Hace 3 min', 'Hace 4 min', 'Hace 5 min'];
    const randomTime = timeOptions[Math.floor(Math.random() * timeOptions.length)];
    
    // Agregar al principio
    const newWin = `
        <div class="recent-win-item">
            <div class="recent-win-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="recent-win-details">
                <div class="recent-win-name">${name.split(' ')[0]}</div>
                <div class="recent-win-time">${randomTime}</div>
            </div>
            <div class="recent-win-amount">
                +${amount} Bs.
            </div>
        </div>
    `;
    
    // Insertar al principio y mantener máximo 5 elementos
    const currentItems = recentWinsElement.innerHTML;
    const itemsArray = currentItems.split('</div>').filter(item => item.trim());
    itemsArray.unshift(newWin);
    
    if (itemsArray.length > 5) {
        itemsArray.length = 5;
    }
    
    recentWinsElement.innerHTML = itemsArray.join('</div>') + '</div>';
}

// ======================
// 👤 REGISTRO Y UI (CORREGIDO)
// ======================
function registerPlayer() {
    const name = modalNameInput.value.trim();
    const phone = modalPhoneInput.value.trim();
    
    if (name.length < 3) {
        showNotification('El nombre debe tener al menos 3 caracteres');
        return;
    }
    
    if (!/^\d{8,12}$/.test(phone)) {
        showNotification('El teléfono debe tener 8-12 dígitos');
        return;
    }
    
    playerName = name;
    playerPhone = phone;
    isRegistered = true;
    
    // Actualizar campos en el modal principal
    const fullNameField = document.getElementById('fullName');
    const phoneField = document.getElementById('phone');
    
    if (fullNameField) fullNameField.value = name;
    if (phoneField) phoneField.value = phone;
    
    registerStatus.textContent = `👤 ${name.split(' ')[0]}`;
    registerStatus.style.color = '#2ecc71';
    registerStatus.title = `Registrado como: ${name} (${phone})`;
    
    // Actualizar texto del botón de registro
    registerBtn.innerHTML = `<i class="fas fa-user-edit"></i> Nuevo Registro`;
    
    // Cerrar modal y limpiar campos
    registerModal.classList.remove('active');
    modalNameInput.value = '';
    modalPhoneInput.value = '';
    
    showNotification(`¡Bienvenido ${name.split(' ')[0]}! Ya puedes realizar depósitos.`);
    
    // Guardar en localStorage (pero permitir cambiar)
    localStorage.setItem('fortuna_player_name', name);
    localStorage.setItem('fortuna_player_phone', phone);
    
    sendToTelegram(
        `📝 *NUEVO REGISTRO - RULETA*\n` +
        `👤 *Nombre:* ${name}\n` +
        `📱 *Teléfono:* ${phone}\n` +
        `⏰ *Hora:* ${new Date().toLocaleTimeString()}`
    );
}

// Función para cambiar usuario
function changeUser() {
    if (depositConfirmed || currentBalance > 0) {
        showNotification('Primero debes retirar o terminar tu sesión actual');
        return;
    }
    
    // Limpiar datos de usuario
    playerName = '';
    playerPhone = '';
    isRegistered = false;
    
    // Resetear estado de registro
    registerStatus.textContent = 'No registrado';
    registerStatus.style.color = '#e74c3c';
    registerStatus.title = '';
    
    // Resetear campos
    const fullNameField = document.getElementById('fullName');
    const phoneField = document.getElementById('phone');
    if (fullNameField) fullNameField.value = '';
    if (phoneField) phoneField.value = '';
    
    // Resetear botón de registro
    registerBtn.innerHTML = `<i class="fas fa-user-plus"></i> Registrarse`;
    
    // Limpiar localStorage
    localStorage.removeItem('fortuna_player_name');
    localStorage.removeItem('fortuna_player_phone');
    
    // Mostrar modal de registro
    registerModal.classList.add('active');
    modalNameInput.focus();
    
    showNotification('Por favor, regístrese con sus nuevos datos');
}

// ======================
// 🎯 EVENT LISTENERS
// ======================
function initEventListeners() {
    // Botones de monto
    amountButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Verificar si puede cambiar la apuesta
            if (!canChangeBet) {
                showNotification('No puedes cambiar la apuesta durante una sesión activa');
                return;
            }
            
            if (depositConfirmed) {
                showNotification('Ya tienes un depósito activo. Juega o retira primero.');
                return;
            }
            
            // Limpiar intervalos anteriores de depósito
            clearAllDepositIntervals();
            
            amountButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentBet = parseInt(btn.dataset.amount);
            currentBetElement.textContent = `${currentBet} Bs.`;
            qrAmountElement.textContent = `${currentBet} Bs.`;
            
            createWheelSegments();
            depositConfirmed = false;
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Depósito';
            spinBtn.disabled = true;
            
            // Resetear QR y estado
            qrPlaceholder.innerHTML = `
                <i class="fas fa-qrcode" style="font-size:3rem;color:#7f8c8d;"></i>
                <p style="margin-top:10px;">ESCOGE UN MONTO</p>
                <div class="qr-amount">${currentBet} Bs.</div>
            `;
            
   confirmationStatus.innerHTML = `
    <div style="text-align: center; color: #f8f8f7ff">
        <i class="fas fa-hand-pointer"></i> GENERA QR
    </div>
`;
            
            showNotification(`Apuesta cambiada a ${currentBet} Bs.`);
        });
    });

    // Botón de girar
    spinBtn.addEventListener('click', spinWheel);

    // Botón de depósito
    depositBtn.addEventListener('click', generateQRCode);

    // Botón de confirmar depósito
    confirmBtn.addEventListener('click', confirmDeposit);

    // Registro / Cambiar usuario
    registerBtn.addEventListener('click', () => {
        if (isRegistered) {
            // Si ya está registrado, permitir cambiar usuario
            changeUser();
        } else {
            // Si no está registrado, mostrar modal de registro
            registerModal.classList.add('active');
            modalNameInput.focus();
        }
    });

    cancelRegisterBtn.addEventListener('click', () => {
        registerModal.classList.remove('active');
    });

    saveRegisterBtn.addEventListener('click', registerPlayer);

    // Botón de retiro
    withdrawBtn.addEventListener('click', () => {
        if (currentBalance <= 0) {
            showNotification('No tienes saldo para retirar');
            return;
        }
        
        const withdrawCode = generateDepositCode();
        
        sendToTelegram(`
🏧 *SOLICITUD DE RETIRO - RULETA*

👤 *Jugador:* ${playerName}
📱 *Teléfono:* ${playerPhone}
💰 *Monto:* ${currentBalance} Bs.
📊 *Saldo actual:* ${currentBalance} Bs.
🔢 *Código de retiro:* ${withdrawCode}
⏰ *Hora:* ${new Date().toLocaleTimeString()}

✅ *Para autorizar este retiro, responde:*
\`/retirar ${withdrawCode}\`

❌ *Para rechazar, responde:*
\`/rechazar_retiro ${withdrawCode}\`
        `);
        
        // Reiniciar sesión después de retiro
        resetSessionAfterWithdrawal();
        
        showNotification(`Solicitud de retiro enviada. Código: ${withdrawCode}. Te contactaremos.`);
    });
    
    // Botón para terminar sesión
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', () => {
            endSession();
        });
    }
    
    // Permitir cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && registerModal.classList.contains('active')) {
            registerModal.classList.remove('active');
        }
    });
}

// Terminar sesión sin retirar
function endSession() {
    // Limpiar intervalos de depósito activos
    clearAllDepositIntervals();
    
    if (currentBalance > 0) {
        if (!confirm(`Tienes ${currentBalance} Bs. de saldo. ¿Seguro que quieres terminar la sesión sin retirar?`)) {
            return;
        }
        
        sendToTelegram(`
🔚 *SESIÓN TERMINADA*

👤 *Jugador:* ${playerName}
📱 *Teléfono:* ${playerPhone}
💰 *Saldo dejado:* ${currentBalance} Bs.
⏰ *Hora:* ${new Date().toLocaleTimeString()}

⚠️ *El jugador terminó la sesión sin retirar*
        `);
    }
    
    // Reiniciar completamente la sesión
    resetSession();
    
    showNotification('Sesión terminada. Puedes iniciar una nueva cuando quieras.');
}

// Reiniciar sesión completamente
function resetSession() {
    // Limpiar intervalos
    clearAllDepositIntervals();
    
    depositConfirmed = false;
    depositCode = '';
    canChangeBet = true;
    currentBalance = 0;
    depositStartTime = 0;
    
    // Actualizar balance
    updateBalance();
    
    // Habilitar botones de monto
    amountButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.classList.remove('active');
    });
    
    // NINGÚN MONTO ACTIVADO POR DEFECTO
    currentBet = 0;
    currentBetElement.textContent = `Elige un monto`;
    
    // Deshabilitar girar
    spinBtn.disabled = true;
    
    // Resetear estado de confirmación
    confirmationStatus.innerHTML = `
        <div style="text-align:center;color:#7f8c8d">
            <i class="fas fa-gamepad"></i>
            <h3>Sesión terminada</h3>
            <p>Puedes iniciar una nueva sesión cuando quieras</p>
        </div>
    `;
    
    // Resetear QR
    qrPlaceholder.innerHTML = `
        <i class="fas fa-qrcode" style="font-size:3rem;color:#7f8c8d;"></i>
        <p style="margin-top:10px;">ESCOGE UN MONTO</p>
        <div class="qr-amount">0 Bs.</div>
    `;
    
    // Resetear botón de confirmar
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Depósito';
    
    // Habilitar botón de depósito
    depositBtn.disabled = false;
    
    // Actualizar ruleta
    createWheelSegments();
}

// Reiniciar sesión después de retiro
function resetSessionAfterWithdrawal() {
    // Limpiar intervalos
    clearAllDepositIntervals();
    
    depositConfirmed = false;
    depositCode = '';
    canChangeBet = true;
    depositStartTime = 0;
    
    // Resetear balance
    currentBalance = 0;
    updateBalance();
    
    // Habilitar botones de monto
    amountButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.classList.remove('active');
    });
    
    // NINGÚN MONTO ACTIVADO POR DEFECTO
    currentBet = 0;
    currentBetElement.textContent = `Elige un monto`;
    
    // Deshabilitar girar
    spinBtn.disabled = true;
    
    // Resetear estado de confirmación
    confirmationStatus.innerHTML = `
        <div style="text-align:center;color:#9b59b6">
            <i class="fab fa-whatsapp"></i>
            <h3>Solicitud de retiro enviada</h3>
            <p>Revisa tu CUENTA YAPE y whatsapp confirmando tu retiro.</p>
            <p><small>Puedes iniciar una nueva sesión cuando quieras</small></p>
        </div>
    `;
    
    // Resetear QR
    qrPlaceholder.innerHTML = `
        <i class="fas fa-qrcode" style="font-size:3rem;color:#7f8c8d;"></i>
        <p style="margin-top:10px;">ESCOGE UN MONTO</p>
        <div class="qr-amount">0 Bs.</div>
    `;
    
    // Resetear botón de confirmar
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Depósito';
    
    // Habilitar botón de depósito
    depositBtn.disabled = false;
    
    // Actualizar ruleta
    createWheelSegments();
}

// ======================
// 🚀 INICIALIZACIÓN
// ======================
function init() {
    createWheelSegments();
    updateBalance();
    initEventListeners();
    
    // Desactivar botón de girar inicialmente
    spinBtn.disabled = true;
    
    // Verificar si ya hay un usuario registrado (en localStorage)
    const savedName = localStorage.getItem('fortuna_player_name');
    const savedPhone = localStorage.getItem('fortuna_player_phone');
    
    if (savedName && savedPhone) {
        playerName = savedName;
        playerPhone = savedPhone;
        isRegistered = true;
        registerStatus.textContent = `👤 ${savedName.split(' ')[0]}`;
        registerStatus.style.color = '#2ecc71';
        registerStatus.title = `Registrado como: ${savedName} (${savedPhone})`;
        
        // Actualizar botón de registro
        registerBtn.innerHTML = `<i class="fas fa-user-edit"></i> Cambiar Usuario`;
        
        document.getElementById('fullName').value = savedName;
        document.getElementById('phone').value = savedPhone;
    }
    
    setTimeout(() => {
        showNotification('🎰 ¡Bienvenido a la Ruleta multiplicadora! Regístrate y gana¡.');
    }, 1000);
    
    // Función para desarrollo: Simular autorización desde consola
    window.simulateTelegramAuth = function(code) {
        if (!code && depositCode) {
            code = depositCode;
        }
        
        if (!code) {
            console.log('❌ No hay código de depósito activo');
            console.log('Uso: simulateTelegramAuth("CODIGO")');
            return;
        }
        
        console.log(`✅ Simulando autorización para código: ${code}`);
        localStorage.setItem(`deposit_${code}`, 'authorized');
        showNotification(`Simulación: Código ${code} autorizado - Verificando...`);
        
        // Forzar verificación inmediata
        setTimeout(() => checkDepositAuthorization(), 1000);
    };
    
    // Función para desarrollo: Simular rechazo
    window.simulateTelegramReject = function(code) {
        if (!code && depositCode) {
            code = depositCode;
        }
        
        if (!code) {
            console.log('❌ No hay código de depósito activo');
            console.log('Uso: simulateTelegramReject("CODIGO")');
            return;
        }
        
        console.log(`❌ Simulando rechazo para código: ${code}`);
        localStorage.setItem(`deposit_${code}`, 'rejected');
        showNotification(`Simulación: Código ${code} rechazado - Verificando...`);
        
        // Forzar verificación inmediata
        setTimeout(() => checkDepositAuthorization(), 1000);
    };
    
    // Función para terminar sesión desde consola
    window.endSessionFromConsole = function() {
        endSession();
    };
    
    // Función para simular expiración de tiempo
    window.simulateTimeExpiration = function() {
        console.log('⏰ Simulando expiración de tiempo para código actual');
        if (depositStartTime > 0) {
            // Forzar expiración inmediata
            depositStartTime = Date.now() - DEPOSIT_EXPIRATION_TIME;
            handleDepositExpired();
        } else {
            console.log('❌ No hay depósito activo para expirar');
        }
    };
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ======================
// 📊 FUNCIONES AUXILIARES
// ======================
function getProbabilitiesForBet(betAmount) {
    const probabilities = {
        10: { lose: 5, smallWin: 4, mediumWin: 2, bigWin: 1 },
        20: { lose: 4, smallWin: 4, mediumWin: 3, bigWin: 1 },
        50: { lose: 3, smallWin: 4, mediumWin: 3, bigWin: 2 },
        100: { lose: 2, smallWin: 4, mediumWin: 4, bigWin: 2 }
    };
    return probabilities[betAmount] || probabilities[20];
}

// 🎯 FUNCIÓN MODIFICADA - MULTIPLICADORES FIJOS
function generatePrizesForBet(betAmount) {
    const prizes = [];
    
    for (let i = 0; i < 12; i++) {
        const multiplier = FIXED_MULTIPLIERS[i];
        const value = Math.round(betAmount * multiplier);
        
        // TEXTO FIJO - MISMO FORMATO PARA TODOS
        let text, subtext;

        // CASOS ESPECIALES PRIMERO
        if (i === 4) {
            // Índice [4]: Aunque multiplier=0 (pierde), mostrar "+X Bs. x10.0"
            const premio = betAmount * 10;
            text = `+${premio} Bs.`;
            subtext = "x10.0";
        } else if (i === 8) {
            // Índice [8]: Aunque multiplier=10 (gana), mostrar "¡PERDISTE!"
            text = "¡PERDISTE!";
            subtext = "Sigue intentando";
        } else if (multiplier === 0) {
            // PERDISTES normales
            text = "¡PERDISTE!";
            subtext = "Sigue intentando";
        } else {
            // Ganadores normales
            const visualMultipliers = [
                0.0,   // [0] PERDISTE (0.0)
                0.5,   // [1] 1.2 visual → 0.5 real
                0.0,   // [2] PERDISTE (0.0)
                2.0,   // [3] 1.0 visual → 2.0 real
                10.0,  // [4] 0.0 visual → 10.0 real (pero ya manejado arriba)
                0.8,   // [5] 4.0 visual → 0.8 real
                0.0,   // [6] PERDISTE (0.0)
                4.0,   // [7] 0.8 visual → 4.0 real
                0.0,   // [8] 10.0 visual → 0.0 real (pero ya manejado arriba)
                1.0,   // [9] 2.0 visual → 1.0 real
                0.0,   // [10] PERDISTE (0.0)
                1.2    // [11] 0.5 visual → 1.2 real
            ];
    
            const visualMultiplier = visualMultipliers[i];
            const visualValue = Math.round(betAmount * visualMultiplier);
    
            text = `+${visualValue} Bs.`;
            subtext = `x${visualMultiplier.toFixed(1)}`;
        }
        
        // TIPO SEGÚN MULTIPLICADOR
        const type = multiplier === 0 ? 'lose' : 
                    multiplier < 2 ? 'small' :
                    multiplier < 6 ? 'medium' : 'big';
        
        prizes.push({
            type: type,
            multiplier: multiplier,
            value: value,
            text: text,          // TEXTO PRINCIPAL
            subtext: subtext,    // SUBTEXTO
            segmentName: SEGMENT_NAMES[i]
        });
    }
    
    return prizes; // ✅ NO MÁS shuffleArray - ORDEN FIJO
}

function getRandomMultiplier(min, max, betAmount) {
    let adjustedMax = max;
    if (betAmount >= 50) adjustedMax = max * 0.8;
    if (betAmount >= 100) adjustedMax = max * 0.7;
    const multiplier = min + Math.random() * (adjustedMax - min);
    return Math.round(multiplier * 10) / 10;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function calculateWinProbability(betAmount) {
    const base = {10: 0.45, 20: 0.42, 50: 0.38, 100: 0.35};
    return base[betAmount] || 0.4;
}

function showResult(prize) {
    if (prize.multiplier === 0) {
        currentResultElement.textContent = '¡PERDISTE!';
        currentResultElement.style.color = '#f51823ff';
        winMessageElement.textContent = 'Sigue intentando';
    } else {
        currentResultElement.textContent = `¡GANASTE ${prize.value} Bs.!`;
        currentResultElement.style.color = '#31ec7fff';
        winMessageElement.textContent = `Multiplicador: ${prize.multiplier}x`;
    }
}

function updateBalance() {
    balanceElement.textContent = `${currentBalance} Bs.`;
    
    // Actualizar apuesta actual
    if (currentBet === 0) {
        currentBetElement.textContent = `Elige un monto`;
    } else {
        currentBetElement.textContent = `${currentBet} Bs.`;
    }
    
    // EL BOTÓN DE RETIRO SIEMPRE ESTÁ DISPONIBLE CUANDO HAY SALDO
    if (currentBalance <= 0) {
        withdrawBtn.disabled = true;
        withdrawBtn.innerHTML = `<i class="fas fa-money-bill-wave"></i> Retirar`;
    } else {
        withdrawBtn.disabled = false;
        withdrawBtn.innerHTML = `<i class="fas fa-money-bill-wave"></i> Retirar ${currentBalance} Bs.`;
    }
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('fortuna_balance', currentBalance.toString());
    
    // Solo activar girar si hay depósito confirmado y saldo suficiente
    spinBtn.disabled = !depositConfirmed || currentBalance < currentBet;
}

function showNotification(msg) {
    notificationText.textContent = msg;
    notification.classList.add('show');
    
    // Cambiar color según tipo de mensaje
    if (msg.includes('✅') || msg.includes('autorizado') || msg.includes('Ganaste')) {
        notification.style.background = '#2ecc71';
    } else if (msg.includes('❌') || msg.includes('rechazado') || msg.includes('PERDISTE')) {
        notification.style.background = '#e74c3c';
    } else if (msg.includes('expir') || msg.includes('expirado')) {
        notification.style.background = '#f39c12';
    } else {
        notification.style.background = '#3498db';
    }
    
    setTimeout(() => notification.classList.remove('show'), 3000);
}

function playSound(soundElement) {
    if (!soundElement) return;
    try {
        soundElement.currentTime = 0;
        soundElement.play().catch(() => {});
    } catch (error) {
        console.log('Error con sonido:', error);
    }
}

// Cargar balance guardado
window.addEventListener('load', () => {
    const savedBalance = localStorage.getItem('fortuna_balance');
    if (savedBalance) {
        currentBalance = parseInt(savedBalance) || 0;
        updateBalance();
    }
});

function toggleQRZoom(qrElement) {
    const qrImage = qrElement;
    
    if (qrImage.classList.contains('zoomed')) {
        // Volver a tamaño normal (200px)
        qrImage.classList.remove('zoomed');
        qrImage.style.cssText = `
            width: 200px;
            height: 200px;
            border-radius: 10px;
            cursor: pointer;
            object-fit: cover;
            position: relative;
            z-index: auto;
        `;
        document.body.style.overflow = 'auto';
        
        const overlay = document.getElementById('qr-overlay');
        if (overlay) overlay.remove();
    } else {
        // Ampliar al tamaño completo
        qrImage.classList.add('zoomed');
        qrImage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            z-index: 10000;
            cursor: zoom-out;
            border-radius: 15px;
            box-shadow: 0 0 30px rgba(0,0,0,0.5);
            background-color: white;
            padding: 15px;
        `;
        document.body.style.overflow = 'hidden';
        
        const overlay = document.createElement('div');
        overlay.id = 'qr-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0);
            z-index: 9999;
            cursor: zoom-out;
        `;
        
        overlay.onclick = function() {
            toggleQRZoom(qrImage);
        };
        
        document.body.appendChild(overlay);
    }
}

// DELEGACIÓN DE EVENTOS - Reemplaza la que tienes al final
document.addEventListener('click', function(event) {
    // Si se hace clic en una imagen con clase qr-zoomable
    if (event.target.classList.contains('qr-zoomable')) {
        toggleQRZoom(event.target);
        event.preventDefault();
    }
});

// Cerrar zoom con tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const qrImage = document.querySelector('.qr-zoomable.zoomed');
        if (qrImage) {
            toggleQRZoom(qrImage);
        }
    }
});
