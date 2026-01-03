import { useState, useCallback } from "react";

interface ModalConfig {
  title?: string;
  message: string;
  type?: "info" | "success" | "error" | "warning" | "confirm";
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    message: "",
    type: "info",
  });

  const showModal = useCallback((config: ModalConfig) => {
    setModalConfig(config);
    setIsOpen(true);
  }, []);

  const showAlert = useCallback(
    (message: string, type: ModalConfig["type"] = "info", title?: string) => {
      showModal({ message, type, title });
    },
    [showModal]
  );

  const showConfirm = useCallback(
    (
      message: string,
      onConfirm: () => void,
      title?: string,
      onCancel?: () => void
    ) => {
      showModal({
        message,
        type: "confirm",
        title: title || "Confirm",
        onConfirm,
        onCancel,
      });
    },
    [showModal]
  );

  const hideModal = useCallback(() => {
    setIsOpen(false);

    setTimeout(() => {
      setModalConfig({ message: "", type: "info" });
    }, 300);
  }, []);

  return {
    isOpen,
    modalConfig,
    showModal,
    showAlert,
    showConfirm,
    hideModal,
  };
};