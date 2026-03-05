import { AlertCircle } from 'lucide-react'

export default function Input({
  label,
  hint,
  error,
  icon,
  iconRight,
  size = 'md',
  value,
  onChange,
  disabled = false,
  placeholder = '',
  className = '',
  containerClassName = '',
  required = false,
  ...props
}) {
  const sizes = {
    sm: 'h-7 text-[12px] px-3',
    md: 'h-8 text-[14px] px-4',
    lg: 'h-10 text-sm px-5'
  }

  const isDisabled = disabled

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wider flex items-center gap-1">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-gray-400 pointer-events-none flex items-center">
            {icon}
          </span>
        )}
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={isDisabled}
          className={`
            w-full rounded border
            ${error ? 'border-red-600' : 'border-gray-300'}
            bg-white text-gray-900 placeholder-gray-400
            focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none
            transition-all duration-150
            ${sizes[size]}
            ${icon ? 'pl-10' : ''}
            ${iconRight ? 'pr-10' : ''}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
            ${className}
          `}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 text-gray-400 pointer-events-none flex items-center">
            {iconRight}
          </span>
        )}
      </div>
      {(hint || error) && (
        <p
          className={`text-[11px] flex items-center gap-1 ${error ? 'text-red-600' : 'text-gray-500'}`}
        >
          {error && <AlertCircle size={12} />}
          {error || hint}
        </p>
      )}
    </div>
  )
}
