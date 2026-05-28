export interface Property {
    id: number;
    x: number;
    y: number;
    price: string;
    beds: number;
    baths: number;
    area: number;
    type: string;
    title: string;
    district: string;
    status: 'sale' | 'rent';
}

export interface FeaturedProperty {
    id: string;
    title: string;
    price: string;
    spec: string;
    tag: string;
    color: string;
}

export interface Category {
    key: string;
    label: string;
    count: string;
    icon: 'key' | 'bed' | 'office' | 'crane';
}

export interface TweakValues {
    accent: string;
    bg: string;
    fontDisplay: string;
    showHero: boolean;
}

export interface IconProps {
    width?: number;
    height?: number;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
}
