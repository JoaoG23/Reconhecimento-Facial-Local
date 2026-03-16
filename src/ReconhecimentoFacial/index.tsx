import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { COLORS, DISPLAY_SIZE } from "./constants";
import { RegisterModal, VerifyModal, AlertModal } from "./components/Modals";
import { buscarRostoEmDB } from "../helpers/buscarRostoEmDB";
import { salvarRostoEmDB } from "../helpers/salvarRostoEmDB";

interface UserData {
  name: string;
  descriptor: number[];
}

export const ReconhecimentoFacial: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estados principais
  const [savedUser, setSavedUser] = useState<UserData | null>(null);
  const [hasRegisteredUsers, setHasRegisteredUsers] = useState(false);
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
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, title: "", message: "", type: "info" });

  useEffect(() => {
    async function init() {
      await loadModels();
      const data = localStorage.getItem("faceUsers");
      if (data) {
        const users = JSON.parse(data);
        setHasRegisteredUsers(users.length > 0);
      }
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
      if (!isScanning || !active) return;

      const detection = await captureSingleFrame();

      if (detection && isScanning) {
        const match = await buscarRostoEmDB(detection.descriptor);

        if (match) {
          // SUCESSO! Para o scan e mostra o modal
          setIsScanning(false);
          setSavedUser(match); // Salva o usuário encontrado
          setValidationResult({
            isMatch: true,
            confidence: (1 - match.distance).toFixed(2),
          });
          setCapturedImage(webcamRef.current?.getScreenshot() || null);
          setShowVerifyModal(true);
          return;
        } else {
          // DIVERGENTE OU NÃO ENCONTRADO! 
          // Só mostra o modal de erro se realmente não achou ninguém após processar
          setIsScanning(false);
          setValidationResult({
            isMatch: false,
            confidence: detection ? "0.00" : "N/A",
          });
          setShowVerifyModal(true);
          return;
        }
      }

      // Se não achou rosto, tenta de novo no próximo frame (recursão controlada)
      if (isScanning && active) {
        setTimeout(runScan, 100);
      }
    };

    if (isScanning) runScan();
    return () => {
      active = false;
    };
  }, [isScanning]);

  const handleStartRegister = async () => {
    const detection = await captureSingleFrame();
    if (detection) {
      setTempDescriptor(detection.descriptor);
      setCapturedImage(webcamRef.current?.getScreenshot() || null);
      setShowRegisterModal(true);
    } else {
      setAlertConfig({
        show: true,
        title: "Atenção",
        message: "Posicione seu rosto na moldura antes de cadastrar.",
        type: "info",
      });
    }
  };

  const confirmRegistration = async () => {
    if (!tempName.trim() || !tempDescriptor) return;
    
    await salvarRostoEmDB(tempName, tempDescriptor);
    setHasRegisteredUsers(true);
    
    setAlertConfig({
      show: true,
      title: "Sucesso",
      message: "Cadastro concluído com sucesso!",
      type: "success",
    });
    closeModals();
  };

  const closeModals = () => {
    setShowRegisterModal(false);
    setShowVerifyModal(false);
    setIsScanning(false);
    setTempName("");
    setCapturedImage(null);
    setAlertConfig((prev: any) => ({ ...prev, show: false }));
  };

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
            disabled={!hasRegisteredUsers}
            style={{
              ...styles.primaryButton,
              backgroundColor: isScanning ? COLORS.danger : COLORS.primary,
              display: hasRegisteredUsers ? "block" : "none",
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
        <RegisterModal
          tempName={tempName}
          setTempName={setTempName}
          onConfirm={confirmRegistration}
          onClose={closeModals}
        />
      )}

      {showVerifyModal && validationResult && (
        <VerifyModal
          isMatch={validationResult.isMatch}
          confidence={validationResult.confidence}
          userName={savedUser?.name}
          onClose={closeModals}
        />
      )}

      {alertConfig.show && (
        <AlertModal
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={closeModals}
        />
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
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: `1px solid ${COLORS.secondary}`,
    marginBottom: "10px",
  },
};
