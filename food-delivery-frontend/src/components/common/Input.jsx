const Input = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    error,
    placeholder,
    required = false,
    className = '',
    ...props
  }) => {
    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-pink-600 dark:focus:ring-pink-300 ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-800'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  };
  
  export default Input;