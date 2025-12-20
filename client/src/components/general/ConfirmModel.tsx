import React, { Fragment } from "react";
import { X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <Fragment>
      <div
        className="fixed inset-0  bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onCancel}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white border-2 border-black rounded-3xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-black">{title}</h3>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              disabled={isLoading}
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-8">
            <p className="text-gray-600 text-lg leading-relaxed">{message}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-6 py-3.5 text-black text-lg font-semibold rounded-xl border-2 border-black hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-6 py-3.5 bg-black text-white text-lg font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging out...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default ConfirmModal;
