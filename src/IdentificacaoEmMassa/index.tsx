import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";
import { COLORS, WIDE_DISPLAY_SIZE, FACE_CONFIDENCE_THRESHOLD } from "../ReconhecimentoFacial/constants";

export const IdentificacaoEmMassa: React.FC = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning] = useState(true);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);

  // Carregar modelos e preparar FaceMatcher
  useEffect(() => {
    const init = async () => {
      try {
        const MODEL_URL = `${window.location.origin}/models`;
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        const savedData = localStorage.getItem("faceUsers");
        if (savedData) {
          const users = JSON.parse(savedData);
          const labeledDescriptors = users.map((u: any) => 
            new faceapi.LabeledFaceDescriptors(u.name, [new Float32Array(u.descriptor)])
          );
          if (labeledDescriptors.length > 0) {
            setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, FACE_CONFIDENCE_THRESHOLD));
          }
        }
        setModelsLoaded(true);
      } catch (e) {
        console.error("Erro ao carregar modelos/dados", e);
      }
    };
    init();
  }, []);

  // Loop de detecção contínua
  useEffect(() => {
    let animationId: number;
    let active = true;

    const detect = async () => {
      // Garantir que tudo está pronto
      if (!isScanning || !modelsLoaded || !active) return;
      
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || video.readyState !== 4 || video.videoWidth === 0) {
        animationId = requestAnimationFrame(detect);
        return;
      }

      // Detecção
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!active) return; // Checagem rápida após o await

      const dims = faceapi.matchDimensions(canvas, video, true);
      const resizedDetections = faceapi.resizeResults(detections, dims);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        resizedDetections.forEach((detection) => {
          const { detection: det, descriptor } = detection;
          const box = det.box;

          let label = "Desconhecido";
          let color = COLORS.danger;
          let distance = 0;

          if (faceMatcher) {
            const match = faceMatcher.findBestMatch(descriptor);
            if (match.label !== "unknown") {
              console.log(match);
              label = match.label;
              color = COLORS.scanLine; // Azul como solicitado
              distance = match.distance;
            }
          }

          // Desenhar Quadrado Azul (ou Vermelho se desconhecido)
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Desenhar Label com Fundo
          ctx.fillStyle = color;
          ctx.font = "bold 16px Arial";
          const text = `${label} (${(1 - distance).toFixed(2)})`;
          const textWidth = ctx.measureText(text).width;
          
          ctx.fillRect(box.x, box.y - 30, textWidth + 10, 30);
          ctx.fillStyle = "#fff";
          ctx.fillText(text, box.x + 5, box.y - 10);
        });
      }

      if (active) {
        animationId = requestAnimationFrame(detect);
      }
    };

    if (modelsLoaded && isScanning) {
      detect();
    }

    return () => {
      active = false;
      cancelAnimationFrame(animationId);
    };
  }, [isScanning, modelsLoaded, faceMatcher]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate("/")} style={styles.backButton}>
          ← Voltar
        </button>
        <h2 style={{ color: COLORS.white, margin: 0 }}>Identificação em Massa</h2>
        <div style={{ width: "80px" }} /> {/* Spacer */}
      </div>

      <div style={styles.webcamWrapper}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={styles.webcam}
          videoConstraints={{ 
            width: 1280, 
            height: 720, 
            facingMode: "user" 
          }}
        />
        <canvas ref={canvasRef} style={styles.canvas} />
        
        {!modelsLoaded && (
          <div style={styles.loadingOverlay}>
            <p style={{ color: COLORS.white }}>Carregando Inteligência Artificial...</p>
          </div>
        )}
      </div>

      <div style={styles.info}>
        <p style={{ color: COLORS.secondary }}>
          Detectando todos os rostos presentes na câmera simultaneamente.
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    backgroundColor: "#0a0e14",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    width: "100%",
    maxWidth: "800px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  backButton: {
    padding: "10px 20px",
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    backdropFilter: "blur(10px)",
  },
  webcamWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: WIDE_DISPLAY_SIZE.width + "px",
    height: WIDE_DISPLAY_SIZE.height + "px",
    borderRadius: "20px",
    overflow: "hidden",
    border: `4px solid ${COLORS.scanLine}`,
    boxShadow: `0 0 30px rgba(52, 152, 219, 0.3)`,
    backgroundColor: "#000",
  },
  webcam: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 10,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  info: {
    marginTop: "20px",
    textAlign: "center",
  }
};
