const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    ...props
  }) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-pink-600 text-white hover:bg-pink-700 focus:ring-pink-600 dark:bg-pink-500/80 dark:hover:bg-pink-500 dark:focus:ring-pink-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };
  
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
  
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </button>
    );
  };
  
  export default Button;