import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

// Configurações constantes
const FACE_CONFIDENCE_THRESHOLD = 0.45;
const DISPLAY_SIZE = { width: 250, height: 400 };

const COLORS = {
  primary: "#0056b3",
  secondary: "#e1f0ff",
  background: "#f8faff",
  white: "#ffffff",
  text: "#2c3e50",
  success: "#28a745",
  danger: "#dc3545",
  overlay: "rgba(0, 40, 85, 0.5)",
  scanLine: "#3498db",
};

interface UserData {
  name: string;
  descriptor: number[];
}

export const ReconhecimentoFacial = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estados principais
  const [savedUser, setSavedUser] = useState<UserData | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // NOVO: Controle de scan automático

  // Modais e Resultados
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempDescriptor, setTempDescriptor] = useState<Float32Array | null>(
    null,
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isMatch: boolean;
    confidence: string;
  } | null>(null);

  useEffect(() => {
    async function init() {
      await loadModels();
      const data = localStorage.getItem("faceUserData");
      console.log(data);
      if (data) setSavedUser(JSON.parse(data));
    }
    init();
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = `${window.location.origin}/models`;
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (e) {
      console.error("Erro nos modelos", e);
    }
  };

  const captureSingleFrame = async () => {
    if (!webcamRef.current?.video) return null;
    const video = webcamRef.current.video;
    return await faceapi
      .detectSingleFace(video)
      .withFaceLandmarks()
      .withFaceDescriptor();
  };

  // Loop de escaneamento automático
  useEffect(() => {
    let active = true;

    const runScan = async () => {
      if (!isScanning || !savedUser || !active) return;

      const detection = await captureSingleFrame();

      if (detection && isScanning) {
        const savedDescriptorArray = new Float32Array(savedUser.descriptor);
        const distance = faceapi.euclideanDistance(
          savedDescriptorArray,
          detection.descriptor,
        );

        if (distance < FACE_CONFIDENCE_THRESHOLD) {
          // SUCESSO! Para o scan e mostra o modal
          setIsScanning(false);
          setValidationResult({
            isMatch: true,
            confidence: (1 - distance).toFixed(2),
          });
          setCapturedImage(webcamRef.current?.getScreenshot() || null);
          setShowVerifyModal(true);
          return;
        }
      }

      // Se não achou ou não bateu, tenta de novo no próximo frame (recursão controlada)
      if (isScanning && active) {
        setTimeout(runScan, 100);
      }
    };

    if (isScanning) runScan();
    return () => {
      active = false;
    };
  }, [isScanning, savedUser]);

  const handleStartRegister = async () => {
    const detection = await captureSingleFrame();
    if (detection) {
      setTempDescriptor(detection.descriptor);
      setCapturedImage(webcamRef.current?.getScreenshot() || null);
      setShowRegisterModal(true);
    } else {
      alert("Posicione seu rosto na moldura antes de cadastrar.");
    }
  };
  console.log(tempDescriptor);

  const confirmRegistration = () => {
    if (!tempName.trim()) return;
    const userData = {
      name: tempName,
      descriptor: Array.from(tempDescriptor!),
    };
    localStorage.setItem("faceUserData", JSON.stringify(userData));
    setSavedUser(userData);
    alert("✅ CADASTRADO COM SUCESSO!");
    closeModals();
  };

  const closeModals = () => {
    setShowRegisterModal(false);
    setShowVerifyModal(false);
    setIsScanning(false);
    setTempName("");
    setCapturedImage(null);
  };

  const Modal = ({ title, children, onClose, footer }: any) => (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h3 style={{ color: COLORS.primary }}>{title}</h3>
        <div style={{ margin: "20px 0" }}>{children}</div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {footer}
          <button onClick={onClose} style={styles.secondaryButton}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: COLORS.primary }}>Acesso Biométrico</h2>

        <div style={styles.webcamWrapper}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={styles.webcam}
            videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
          />
          {/* Linha de Scan Animada */}
          {isScanning && <div style={styles.scanLine} />}

          <canvas ref={canvasRef} style={styles.canvas} />
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={handleStartRegister}
            disabled={!modelsLoaded}
            style={styles.primaryButton}
          >
            {modelsLoaded ? "📝 Novo Cadastro" : "Carregando..."}
          </button>

          <button
            onClick={() => setIsScanning(!isScanning)}
            disabled={!savedUser}
            style={{
              ...styles.primaryButton,
              backgroundColor: isScanning ? COLORS.danger : COLORS.primary,
              display: savedUser ? "block" : "none",
            }}
          >
            {isScanning ? "🛑 Parar Busca" : "🔍 Iniciar Validação"}
          </button>
        </div>

        {isScanning && (
          <p
            style={{
              color: COLORS.scanLine,
              fontWeight: "bold",
              animation: "pulse 1.5s infinite",
            }}
          >
            Aguardando rosto conhecido...
          </p>
        )}
      </div>

      {showRegisterModal && (
        <Modal
          title="Confirmar Cadastro"
          onClose={closeModals}
          footer={
            <button onClick={confirmRegistration} style={styles.successButton}>
              Salvar
            </button>
          }
        >
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Seu nome"
            style={styles.input}
            autoFocus
          />
        </Modal>
      )}

      {showVerifyModal && validationResult && (
        <Modal title="Acesso Autorizado!" onClose={closeModals}>
          <div style={{ color: COLORS.success }}>
            <div style={{ fontSize: "3rem" }}>✅</div>
            <h4>Olá, {savedUser?.name}!</h4>
            <p>Confiança: {validationResult.confidence}</p>
          </div>
        </Modal>
      )}

      {/* Adição de Estilo de Animação via Injeção de CSS */}
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, any> = {
  container: {
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: COLORS.background,
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  card: {
    maxWidth: "500px",
    margin: "0 auto",
    backgroundColor: COLORS.white,
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  },
  webcamWrapper: {
    position: "relative",
    width: DISPLAY_SIZE.width,
    height: DISPLAY_SIZE.height,
    margin: "0 auto",
    overflow: "hidden",
    borderRadius: "12px",
    border: `4px solid ${COLORS.secondary}`,
    backgroundColor: "#000",
  },
  webcam: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    minWidth: "100%",
    minHeight: "100%",
    objectFit: "cover",
  },
  canvas: { position: "absolute", top: 0, left: 0, zIndex: 10 },
  scanLine: {
    position: "absolute",
    width: "100%",
    height: "2px",
    backgroundColor: COLORS.scanLine,
    zIndex: 20,
    boxShadow: `0 0 15px ${COLORS.scanLine}`,
    animation: "scan 2s linear infinite",
  },
  buttonGroup: {
    marginTop: "30px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
  primaryButton: {
    padding: "12px 20px",
    backgroundColor: COLORS.primary,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  secondaryButton: {
    padding: "12px 20px",
    backgroundColor: COLORS.secondary,
    color: COLORS.primary,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  successButton: {
    padding: "12px 20px",
    backgroundColor: COLORS.success,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.overlay,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: "30px",
    borderRadius: "15px",
    width: "90%",
    maxWidth: "350px",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: `1px solid ${COLORS.secondary}`,
    marginBottom: "10px",
  },
};
