import type { FC } from 'react';

interface IconProps {
    width?: number;
    height?: number;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    className?: string;
}

export const Icons = {
    filter: (props?: IconProps) => (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <line x1="4" y1="7" x2="11" y2="7" />
            <line x1="15" y1="7" x2="20" y2="7" />
            <circle cx="13" cy="7" r="2.2" />
            <line x1="4" y1="17" x2="8" y2="17" />
            <line x1="12" y1="17" x2="20" y2="17" />
            <circle cx="10" cy="17" r="2.2" />
        </svg>
    ),
    info: (props?: IconProps) => (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <circle cx="12" cy="7.5" r="1" fill="currentColor" />
        </svg>
    ),
    close: (props?: IconProps) => (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
    ),
    expand: (props?: IconProps) => (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <polyline points="4 14 4 20 10 20" />
            <polyline points="20 10 20 4 14 4" />
            <line x1="14" y1="10" x2="20" y2="4" />
            <line x1="4" y1="20" x2="10" y2="14" />
        </svg>
    ),
    search: (props?: IconProps) => (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
    ),
    pin: (props?: IconProps) => (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            {...props}
        >
            <path d="M12 22s-7-7.5-7-13a7 7 0 0 1 14 0c0 5.5-7 13-7 13z" />
            <circle cx="12" cy="9" r="2.5" />
        </svg>
    ),
    bed: (props?: IconProps) => (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <path d="M3 18V8m18 10v-4a3 3 0 0 0-3-3H3" />
            <circle cx="7" cy="11" r="2" />
        </svg>
    ),
    bath: (props?: IconProps) => (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <path d="M4 13h16v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-3z" />
            <path d="M6 13V6a2 2 0 0 1 4 0" />
            <line x1="6" y1="19" x2="6" y2="21" />
            <line x1="18" y1="19" x2="18" y2="21" />
        </svg>
    ),
    area: (props?: IconProps) => (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
        </svg>
    ),
    heart: (props?: IconProps) => (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    ),
    arrow: (props?: IconProps) => (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            {...props}
        >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="13 6 19 12 13 18" />
        </svg>
    ),
    plus: (props?: IconProps) => (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            {...props}
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    minus: (props?: IconProps) => (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            {...props}
        >
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    layers: (props?: IconProps) => (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <polygon points="12 2 22 8 12 14 2 8 12 2" />
            <polyline points="2 14 12 20 22 14" />
        </svg>
    ),
    loc: (props?: IconProps) => (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            {...props}
        >
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
        </svg>
    ),
};

interface CatIconProps {
    kind: 'key' | 'bed' | 'office' | 'crane';
    className?: string;
}

export const CatIcon: FC<CatIconProps> = ({ kind, className }) => {
    const props = {
        width: 32,
        height: 32,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        className,
    };
    switch (kind) {
        case 'key':
            return (
                <svg {...props}>
                    <circle cx="8" cy="14" r="4" />
                    <path d="M11 12l9-9m-3 3l2 2m-4-2l2 2" />
                </svg>
            );
        case 'bed':
            return (
                <svg {...props}>
                    <path d="M3 18V8m18 10v-4a3 3 0 0 0-3-3H3" />
                    <circle cx="7" cy="11" r="2" />
                </svg>
            );
        case 'office':
            return (
                <svg {...props}>
                    <rect x="3" y="3" width="18" height="18" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
            );
        case 'crane':
            return (
                <svg {...props}>
                    <path d="M4 20V4h2v12h14v4z" />
                    <line x1="6" y1="10" x2="20" y2="10" />
                    <line x1="14" y1="10" x2="14" y2="16" />
                </svg>
            );
        default:
            return null;
    }
};
