import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';
import clsx from 'clsx';
import '../../index.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'neutral' | 'ghost';
    label?: string;
    icon?: string;
    children?: ReactNode;
}

export const Button: FC<ButtonProps> = ({ variant = 'primary', label, icon, children, className, ...props }) => {

    const variantClass = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger',
        neutral: 'btn-neutral',
        ghost: 'btn-ghost',
    }[variant];

    return (
        <button
            className={clsx('btn-base', variantClass, className)}
            {...props}
        >
            {icon && <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>}
            {children || label}
        </button>
    );
};
