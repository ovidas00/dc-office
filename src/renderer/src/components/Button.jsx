import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  variant = 'default',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'h-7 px-3 text-[12px] gap-1',
    md: 'h-8 px-4 text-[14px] gap-1.5',
    lg: 'h-10 px-5 text-sm gap-2'
  }

  const variants = {
    default: 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 active:bg-gray-600',
    primary: 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-500 active:bg-blue-500',
    ghost: 'bg-transparent text-gray-300 border border-transparent hover:bg-gray-700',
    danger: 'bg-red-600 text-white border border-red-600 hover:bg-red-500 active:bg-red-500',
    outline: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
  }

  const isDisabled = disabled || loading

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium
        rounded select-none whitespace-nowrap
        transition-all duration-150 ease-out
        ${sizes[size]} ${variants[variant]}
        ${isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 size={12} className="animate-spin" />}
      {icon && !loading && <span>{icon}</span>}
      {children}
      {iconRight && !loading && <span>{iconRight}</span>}
    </button>
  )
}
