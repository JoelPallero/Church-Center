import type { HTMLAttributes, ReactNode, FC, CSSProperties } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export const Card: FC<CardProps> = ({ children, className, style, ...props }) => {
    const defaultStyles: CSSProperties = {
        backgroundColor: 'var(--color-card-bg)', // Dynamic Background
        borderRadius: '24px',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        width: '100%',
        padding: '24px',
    };

    return (
        <div
            className={clsx('card-component', className)}
            style={{ ...defaultStyles, ...style }}
            {...props}
        >
            {children}
        </div>
    );
};
