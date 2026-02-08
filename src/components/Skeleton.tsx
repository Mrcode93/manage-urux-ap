import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height
}) => {
    const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700/50';

    const variantClasses = {
        text: 'rounded h-4 w-full mb-2',
        circular: 'rounded-full',
        rectangular: 'rounded-xl',
    };

    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
