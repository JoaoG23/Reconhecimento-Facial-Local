import React from "react";
import { COLORS } from "../constants";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}

export const Modal = ({ title, children, onClose, footer }: ModalProps) => (
  <div style={styles.modalOverlay}>
    <div style={styles.modalContent}>
      <h3 style={{ color: COLORS.primary, marginTop: 0, marginBottom: "15px" }}>{title}</h3>
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

interface RegisterModalProps {
  tempName: string;
  setTempName: (name: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const RegisterModal = ({ tempName, setTempName, onConfirm, onClose }: RegisterModalProps) => (
  <Modal
    title="Confirmar Cadastro"
    onClose={onClose}
    footer={
      <button onClick={onConfirm} style={styles.successButton}>
        Salvar
      </button>
    }
  >
    <input
      type="text"
      value={tempName}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempName(e.target.value)}
      placeholder="Seu nome"
      style={styles.input}
      autoFocus
    />
  </Modal>
);

interface VerifyModalProps {
  isMatch: boolean;
  confidence?: string;
  userName?: string;
  onClose: () => void;
}

export const VerifyModal = ({ isMatch, confidence, userName, onClose }: VerifyModalProps) => (
  <Modal title={isMatch ? "Acesso Autorizado!" : "Acesso Negado"} onClose={onClose}>
    {isMatch ? (
      <div style={{ color: COLORS.success }}>
        <div style={{ fontSize: "3rem", marginBottom: "10px" }}>✅</div>
        <h4 style={{ margin: "10px 0" }}>Olá, {userName}!</h4>
        <p style={{ margin: 0, opacity: 0.8 }}>Confiança: {confidence}</p>
      </div>
    ) : (
      <div style={{ color: COLORS.danger }}>
        <div style={{ fontSize: "3rem", marginBottom: "10px" }}>❌</div>
        <h4 style={{ margin: "10px 0" }}>Rosto não encontrado</h4>
        <p style={{ margin: 0, opacity: 0.8 }}>Não foi possível validar sua identidade.</p>
      </div>
    )}
  </Modal>
);

interface AlertModalProps {
  title: string;
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export const AlertModal = ({ title, message, type = "info", onClose }: AlertModalProps) => (
  <Modal title={title} onClose={onClose}>
    <div style={{ color: type === "success" ? COLORS.success : type === "error" ? COLORS.danger : COLORS.text }}>
      <div style={{ fontSize: "3rem", marginBottom: "10px" }}>
        {type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
      </div>
      <p style={{ margin: 0, fontSize: "1.1rem" }}>{message}</p>
    </div>
  </Modal>
);

const styles: Record<string, React.CSSProperties> = {
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
    borderRadius: "20px",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },
  secondaryButton: {
    padding: "12px 24px",
    backgroundColor: COLORS.secondary,
    color: COLORS.primary,
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  successButton: {
    padding: "12px 24px",
    backgroundColor: COLORS.success,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  input: {
    width: "100%",
    padding: "12px 15px",
    borderRadius: "10px",
    border: `2px solid ${COLORS.secondary}`,
    marginBottom: "10px",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
  },
};
