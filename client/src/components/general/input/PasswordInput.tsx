import React from 'react';

export type PasswordInputSize = 'sm' | 'md' | 'lg' | 'xl';
export type PasswordInputVariant = 'outline' | 'filled' | 'flushed' | 'unstyled';
export type PasswordInputTheme = 'slate' | 'gray' | 'blue' | 'red' | 'green';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: PasswordInputSize;
  variant?: PasswordInputVariant;
  theme?: PasswordInputTheme;
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  showStrength?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      inputSize = 'md',
      variant = 'outline',
      theme = 'slate',
      label,
      helperText,
      error,
      success = false,
      leftIcon,
      showStrength = false,
      fullWidth = false,
      required = false,
      disabled = false,
      containerClassName = '',
      labelClassName = '',
      helperClassName = '',
      className = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const hasError = !!error;

    
    const baseStyles = 'w-full transition-all duration-200 font-medium rounded-md focus:outline-none bg-transparent';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-4 py-2.5 text-base',
      xl: 'px-4 py-3 text-lg'
    };

    const variantStyles = {
      outline: 'border focus:ring-2 focus:ring-offset-1',
      filled: 'border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:border',
      flushed: 'border-0 border-b-2 rounded-none px-0 focus:ring-0',
      unstyled: 'border-0 focus:ring-0 px-0'
    };

    const getThemeStyles = () => {
      if (hasError) {
        return {
          outline: 'border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-900',
          filled: 'bg-red-50 focus:border-red-500 focus:ring-red-500/20 text-red-900',
          flushed: 'border-red-500 focus:border-red-500 text-red-900',
          unstyled: 'text-red-900'
        }[variant];
      }

      if (success) {
        return {
          outline: 'border-green-500 focus:border-green-500 focus:ring-green-500/20 text-green-900',
          filled: 'bg-green-50 focus:border-green-500 focus:ring-green-500/20 text-green-900',
          flushed: 'border-green-500 focus:border-green-500 text-green-900',
          unstyled: 'text-green-900'
        }[variant];
      }

      const themes = {
        slate: {
          outline: 'border-slate-300 focus:border-slate-500 focus:ring-slate-500/20',
          filled: 'focus:border-slate-500 focus:ring-slate-500/20',
          flushed: 'border-slate-300 focus:border-slate-500',
          unstyled: ''
        },
        gray: {
          outline: 'border-gray-300 focus:border-gray-500 focus:ring-gray-500/20',
          filled: 'focus:border-gray-500 focus:ring-gray-500/20',
          flushed: 'border-gray-300 focus:border-gray-500',
          unstyled: ''
        },
        blue: {
          outline: 'border-blue-300 focus:border-blue-500 focus:ring-blue-500/20',
          filled: 'focus:border-blue-500 focus:ring-blue-500/20',
          flushed: 'border-blue-300 focus:border-blue-500',
          unstyled: ''
        },
        red: {
          outline: 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
          filled: 'focus:border-red-500 focus:ring-red-500/20',
          flushed: 'border-red-300 focus:border-red-500',
          unstyled: ''
        },
        green: {
          outline: 'border-green-300 focus:border-green-500 focus:ring-green-500/20',
          filled: 'focus:border-green-500 focus:ring-green-500/20',
          flushed: 'border-green-300 focus:border-green-500',
          unstyled: ''
        }
      };

      return themes[theme][variant];
    };

    const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';

    const inputClasses = [
      baseStyles,
      sizeStyles[inputSize],
      variantStyles[variant],
      getThemeStyles(),
      disabledStyle,
      className
    ]?.filter(Boolean).join(' ');

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className={`${fullWidth ? 'w-full' : 'w-auto mx-auto'} ${containerClassName}`}>
        {label && (
          <label className={`block text-sm font-medium mb-1 text-center ${hasError ? 'text-red-700' : 'text-gray-700'} ${labelClassName}`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={`${inputClasses} ${leftIcon ? 'pl-10' : ''} pr-10`}
            disabled={disabled}
            required={required}
            {...props}
          />

          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={togglePasswordVisibility}
            disabled={disabled}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
        </div>

        {(helperText || error) && (
          <p className={`mt-1 text-sm text-center ${hasError ? 'text-red-600' : 'text-gray-500'} ${helperClassName}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;