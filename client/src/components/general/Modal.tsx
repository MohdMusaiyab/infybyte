import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "info" | "success" | "error" | "warning" | "confirm";
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel",
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeStyles = {
    info: {
      border: "border-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-800",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    success: {
      border: "border-green-500",
      bg: "bg-green-50",
      text: "text-green-800",
      button: "bg-green-600 hover:bg-green-700",
    },
    error: {
      border: "border-red-500",
      bg: "bg-red-50",
      text: "text-red-800",
      button: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      border: "border-yellow-500",
      bg: "bg-yellow-50",
      text: "text-yellow-800",
      button: "bg-yellow-600 hover:bg-yellow-700",
    },
    confirm: {
      border: "border-gray-500",
      bg: "bg-white",
      text: "text-gray-800",
      button: "bg-black hover:bg-gray-800",
    },
  };

  const currentStyle = typeStyles[type];

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <>
      {}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={`relative w-full max-w-md rounded-2xl ${currentStyle.bg} border-2 ${currentStyle.border} shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {}
            <div className="flex items-center justify-between p-6 pb-4">
              {title && (
                <h3 className={`text-xl font-bold ${currentStyle.text}`}>
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {}
            <div className="px-6 py-2">
              <p className={`${currentStyle.text} whitespace-pre-line`}>
                {message}
              </p>
            </div>

            {}
            <div className="flex items-center justify-end gap-3 p-6 pt-4">
              {type === "confirm" ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`px-5 py-2.5 rounded-lg text-white ${currentStyle.button} transition-colors font-medium`}
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className={`px-5 py-2.5 rounded-lg text-white ${currentStyle.button} transition-colors font-medium`}
                >
                  {confirmText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
