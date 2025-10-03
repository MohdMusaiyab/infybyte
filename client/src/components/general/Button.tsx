import React from 'react';

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type ButtonTheme = 'black' | 'white' | 'slate';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  theme?: ButtonTheme;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'solid',
      size = 'md',
      theme = 'slate',
      loading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base',
      xl: 'px-8 py-3 text-lg'
    };

    // Theme and variant combinations
    const themeStyles = {
      black: {
        solid: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500 active:bg-gray-700',
        outline: 'border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white focus:ring-gray-500 active:bg-gray-800',
        ghost: 'text-gray-900 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
        link: 'text-gray-900 hover:underline focus:ring-gray-500 p-0'
      },
      white: {
        solid: 'bg-white text-gray-900 hover:bg-gray-50 focus:ring-gray-300 active:bg-gray-100 border border-gray-300',
        outline: 'border border-white text-white hover:bg-white hover:text-gray-900 focus:ring-white active:bg-gray-100',
        ghost: 'text-white hover:bg-white/10 focus:ring-white active:bg-white/20',
        link: 'text-white hover:underline focus:ring-white p-0'
      },
      slate: {
        solid: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500 active:bg-slate-800',
        outline: 'border border-slate-600 text-slate-600 hover:bg-slate-600 hover:text-white focus:ring-slate-500 active:bg-slate-700',
        ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-500 active:bg-slate-200',
        link: 'text-slate-600 hover:underline focus:ring-slate-500 p-0'
      }
    };

    const widthStyle = fullWidth ? 'w-full' : '';
    
    const buttonClasses = [
      baseStyles,
      sizeStyles[size],
      themeStyles[theme][variant],
      widthStyle,
      className
    ].filter(Boolean).join(' ');

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isDisabled}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;