import React from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 border-transparent',
            secondary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border-transparent',
            outline: 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800',
            ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 border-transparent',
            danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 border-transparent',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs rounded-lg',
            md: 'h-10 px-4 py-2 text-sm rounded-xl',
            lg: 'h-12 px-6 text-base rounded-2xl',
            icon: 'h-10 w-10 p-2 rounded-xl flex items-center justify-center',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {loading && <Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
