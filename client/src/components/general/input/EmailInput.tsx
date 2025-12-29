import React from "react";

export type InputSize = "sm" | "md" | "lg" | "xl";
export type InputVariant = "outline" | "filled" | "flushed" | "unstyled";
export type InputTheme = "slate" | "gray" | "blue" | "red" | "green";

export interface EmailInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: InputSize;
  variant?: InputVariant;
  theme?: InputTheme;
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
}

const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  (
    {
      inputSize = "md",
      variant = "outline",
      theme = "slate",
      label,
      helperText,
      error,
      success = false,
      leftIcon,
      rightIcon,
      leftElement,
      rightElement,
      fullWidth = false,
      required = false,
      disabled = false,
      loading = false,
      containerClassName = "",
      labelClassName = "",
      helperClassName = "",
      className = "",
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const isDisabled = disabled || loading;

    const baseStyles =
      "w-full transition-all duration-200 font-medium rounded-md focus:outline-none bg-transparent";

    const sizeStyles: Record<InputSize, string> = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-4 py-2.5 text-base",
      xl: "px-4 py-3 text-lg",
    };

    const variantStyles: Record<InputVariant, string> = {
      outline: "border focus:ring-2 focus:ring-offset-1",
      filled: "border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:border",
      flushed: "border-0 border-b-2 rounded-none px-0 focus:ring-0",
      unstyled: "border-0 focus:ring-0 px-0",
    };

    const getThemeStyles = (): string => {
      if (hasError) {
        const errorStyles: Record<InputVariant, string> = {
          outline:
            "border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-900",
          filled:
            "bg-red-50 focus:border-red-500 focus:ring-red-500/20 text-red-900",
          flushed: "border-red-500 focus:border-red-500 text-red-900",
          unstyled: "text-red-900",
        };
        return errorStyles[variant];
      }

      if (success) {
        const successStyles: Record<InputVariant, string> = {
          outline:
            "border-green-500 focus:border-green-500 focus:ring-green-500/20 text-green-900",
          filled:
            "bg-green-50 focus:border-green-500 focus:ring-green-500/20 text-green-900",
          flushed: "border-green-500 focus:border-green-500 text-green-900",
          unstyled: "text-green-900",
        };
        return successStyles[variant];
      }

      const themes: Record<InputTheme, Record<InputVariant, string>> = {
        slate: {
          outline:
            "border-slate-300 focus:border-slate-500 focus:ring-slate-500/20",
          filled: "focus:border-slate-500 focus:ring-slate-500/20",
          flushed: "border-slate-300 focus:border-slate-500",
          unstyled: "",
        },
        gray: {
          outline:
            "border-gray-300 focus:border-gray-500 focus:ring-gray-500/20",
          filled: "focus:border-gray-500 focus:ring-gray-500/20",
          flushed: "border-gray-300 focus:border-gray-500",
          unstyled: "",
        },
        blue: {
          outline:
            "border-blue-300 focus:border-blue-500 focus:ring-blue-500/20",
          filled: "focus:border-blue-500 focus:ring-blue-500/20",
          flushed: "border-blue-300 focus:border-blue-500",
          unstyled: "",
        },
        red: {
          outline: "border-red-300 focus:border-red-500 focus:ring-red-500/20",
          filled: "focus:border-red-500 focus:ring-red-500/20",
          flushed: "border-red-300 focus:border-red-500",
          unstyled: "",
        },
        green: {
          outline:
            "border-green-300 focus:border-green-500 focus:ring-green-500/20",
          filled: "focus:border-green-500 focus:ring-green-500/20",
          flushed: "border-green-300 focus:border-green-500",
          unstyled: "",
        },
      };

      return themes[theme][variant];
    };

    const disabledStyle = isDisabled ? "opacity-50 cursor-not-allowed" : "";

    const inputClasses = [
      baseStyles,
      sizeStyles[inputSize],
      variantStyles[variant],
      getThemeStyles(),
      disabledStyle,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        className={`${
          fullWidth ? "w-full" : "w-auto mx-auto"
        } ${containerClassName}`}
      >
        {label && (
          <label
            className={`block text-sm font-medium mb-1 text-center ${
              hasError ? "text-red-700" : "text-gray-700"
            } ${labelClassName}`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftElement && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              {leftElement}
            </div>
          )}

          {leftIcon && (
            <div
              className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${
                leftElement ? "hidden" : ""
              }`}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type="email"
            className={`${inputClasses} ${
              leftIcon || leftElement ? "pl-10" : ""
            } ${rightIcon || rightElement ? "pr-10" : ""}`}
            disabled={isDisabled}
            required={required}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              {rightElement}
            </div>
          )}

          {rightIcon && (
            <div
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 ${
                rightElement ? "hidden" : ""
              }`}
            >
              {rightIcon}
            </div>
          )}

          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            </div>
          )}
        </div>

        {(helperText || error) && (
          <p
            className={`mt-1 text-sm text-center ${
              hasError ? "text-red-600" : "text-gray-500"
            } ${helperClassName}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

export default EmailInput;
