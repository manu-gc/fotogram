const video = document.getElementById('camera')
const photos = document.getElementById('photos')

const imgDalmata = new Image(); imgDalmata.src = 'efeitos/dalmata.png';
const imgCachorro = new Image(); imgCachorro.src = 'efeitos/cachorro.png';
const imgBarba = new Image(); imgBarba.src = 'efeitos/barba.png';
const imgLaco = new Image(); imgLaco.src = 'efeitos/laco.png';
const imgJuliet = new Image(); imgJuliet.src = 'efeitos/juliet.png';

// Variável de controle dos modelos
let modelsLoaded = false;

// 1. Inicializa carregando os modelos do Face-API antes de abrir a câmera
async function initApp() {
    try {
        console.log("Carregando modelos de IA...")
        const MODEL_URL = './models' 
        
        // Carrega os detectores de rosto, pontos faciais e expressões
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        
        console.log("Modelos carregados com sucesso!")
        modelsLoaded = true; 
        startCamera()
    } catch (error) {
        console.error("Erro ao carregar modelos:", error)
        alert('Erro ao carregar os modelos de inteligência artificial.')
    }
}

async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: "user", 
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await video.play(); 
    } catch (error) {
        alert('Erro ao acessar câmera: ' + error.message);
    }
}

// 2. Transforma a função em assíncrona para esperar a detecção facial terminar
async function capturaPhoto(efeito) {
    if (!modelsLoaded && ['dalmata', 'cachorro', 'barba', 'laco', 'juliet'].includes(efeito)) {
        alert('Os modelos de IA ainda estão carregando. Aguarde um momento.');
        return;
    }

    const photo = document.createElement('canvas');
    photo.width = video.videoWidth;
    photo.height = video.videoHeight;
    const context = photo.getContext('2d');

    // 2.1 Aplica o espelhamento base (para selfie)
    context.translate(photo.width, 0);
    context.scale(-1, 1);

    // 2.2 Aplica efeitos de CSS (filtros)
    if (['cinza', 'antiga', 'desfoque', 'brilho', 'saturacao', 'opacidade'].includes(efeito)) {
        switch (efeito) {
            case 'cinza': context.filter = 'grayscale(100%)'; break;
            case 'antiga': context.filter = 'sepia(100%)'; break;
            case 'desfoque': context.filter = 'blur(5px)'; break;
            case 'brilho': context.filter = 'brightness(150%)'; break;
            case 'saturacao': context.filter = 'saturate(200%)'; break;
            case 'opacidade': context.filter = 'opacity(40%)'; break;
        }
    } else if (efeito === 'espelho') {
        context.scale(-1, 1);
        context.translate(-photo.width, 0);
    } else if (efeito === 'pontaCabeca') {
        context.scale(1, -1);
        context.translate(0, -photo.height);
    }

    // 2.3 Desenha o vídeo no Canvas com os filtros aplicados
    context.drawImage(video, 0, 0, photo.width, photo.height);

    // 2.4 Reseta as transformações e filtros para o Face-API ler a imagem limpa
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.filter = 'none';

    // Lista de efeitos que precisam de IA
    const efeitosIA = ['dalmata', 'cachorro', 'barba', 'laco', 'juliet'];

    // 2.5 Se o efeito for de IA, executa a detecção facial
    if (efeitosIA.includes(efeito)) {
        console.log(`Executando detecção facial para efeito: ${efeito}...`);
        
        // Detecta rostos e pontos faciais (landmarks)
        const detections = await faceapi.detectAllFaces(photo, new faceapi.TinyFaceDetectorOptions())
                                        .withFaceLandmarks();

        if (detections && detections.length > 0) {
            console.log(`${detections.length} rosto(s) detectado(s).`);
            
            // Pega os pontos do primeiro rosto detectado
            const landmarks = detections[0].landmarks;
            
            // Pontos anatômicos principais
            const nariz = landmarks.getNose()[3]; 
            const lateralEsq = landmarks.getJawOutline()[0]; 
            const lateralDir = landmarks.getJawOutline()[16]; 
            const olhoEsq = landmarks.getLeftEye()[0];
            const olhoDir = landmarks.getRightEye()[3];
            const contornoCabeça = landmarks.getJawOutline();

            // Calcula a largura do rosto
            const larguraRosto = Math.abs(lateralDir.x - lateralEsq.x);

            // -- LÓGICA DE POSICIONAMENTO DOS ADESIVOS --

            if (efeito === 'dalmata') {
                const largura = larguraRosto * 1.8;
                const altura = largura * 1.2;
                const eixoX = nariz.x - (largura / 2);
                const eixoY = nariz.y - (altura * 0.45); 
                context.drawImage(imgDalmata, eixoX, eixoY, largura, altura);
            } 
            else if (efeito === 'cachorro') {
                const largura = larguraRosto * 1.8;
                const altura = largura * 1.0; 
                const eixoX = nariz.x - (largura / 2);
                const eixoY = nariz.y - (altura * 0.55); 
                context.drawImage(imgCachorro, eixoX, eixoY, largura, altura);
            } 
            else if (efeito === 'barba') {
                const largura = larguraRosto * 1.4;
                const altura = largura * 0.8;
                const eixoX = nariz.x - (largura / 2);
                const eixoY = nariz.y - (altura * 0.1); 
                context.drawImage(imgBarba, eixoX, eixoY, largura, altura);
            }
            else if (efeito === 'laco') {
                // DIMINUÍDO: De 0.7 para 0.55 (agora o laço é menor)
                const largura = larguraRosto * 0.55; 
                const proporcao = imgLaco.height / imgLaco.width;
                const altura = largura * proporcao;

                // Encontra o topo da cabeça
                let pontoMaisAltoY = contornoCabeça[0].y;
                for (let i = 1; i < contornoCabeça.length; i++) {
                    if (contornoCabeça[i].y < pontoMaisAltoY) {
                        pontoMaisAltoY = contornoCabeça[i].y;
                    }
                }

                // Posicionamento X: metade do laço para fora, metade para dentro do rosto
                const eixoX = lateralEsq.x - (largura / 2);
                
                // SUBIU: De 0.5 para 0.75 (faz o laço ir um pouco mais para cima no cabelo)
                const eixoY = pontoMaisAltoY - (altura * 0.75); 
                
                context.drawImage(imgLaco, eixoX, eixoY, largura, altura);
            }
            else if (efeito === 'juliet') {
                const distanciaOlhos = Math.abs(olhoDir.x - olhoEsq.x);
                const largura = distanciaOlhos * 1.3; 
                
                const proporcao = imgJuliet.height / imgJuliet.width;
                const altura = largura * proporcao;

                const eixoX = nariz.x - (largura / 2);
                const alturaMediaOlhos = (olhoEsq.y + olhoDir.y) / 2;
                const eixoY = alturaMediaOlhos - (altura / 2); 
                
                context.drawImage(imgJuliet, eixoX, eixoY, largura, altura);
            }
        } else {
            console.warn("Nenhum rosto detectado para aplicar o efeito.");
        }
    }
    
    // Adiciona a foto capturada na galeria
    photos.prepend(photo);
}

// Inicializa a aplicação ao carregar o script
initApp();