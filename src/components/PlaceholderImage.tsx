interface PlaceholderImageProps {
    label: string;
    tone?: 'dark' | 'warm';
}

export const PlaceholderImage = ({ label, tone = 'dark' }: PlaceholderImageProps) => {
    const bg =
        tone === 'warm'
            ? 'linear-gradient(135deg,#3a2418,#1a0f08)'
            : 'linear-gradient(135deg,#0e1a2e,#040810)';
    const cleanLabel = label.replace(/\s/g, '');

    return (
        <div className="dm-ph" style={{ background: bg }}>
            <svg className="dm-ph__stripes" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                    <pattern
                        id={`s${cleanLabel}`}
                        width="6"
                        height="6"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                    >
                        <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                    </pattern>
                </defs>
                <rect width="100" height="100" fill={`url(#s${cleanLabel})`} />
            </svg>
            <div className="dm-ph__label">{label}</div>
        </div>
    );
};
