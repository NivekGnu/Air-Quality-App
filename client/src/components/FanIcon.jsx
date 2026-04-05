export default function FanIcon({ className }) {
    return (
        <svg
            className={className}
            width="54"
            height="54"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            {[0, 90, 180, 270].map((angle) => (
                <g key={angle} transform={`rotate(${angle} 50 50)`}>
                    <ellipse cx="50" cy="28" rx="15" ry="24" fill="white" opacity="0.95" />
                </g>
            ))}
            <circle cx="50" cy="50" r="7" fill="#0f1b2d" />
            <circle cx="50" cy="50" r="3.5" fill="white" opacity="0.5" />
        </svg>
    );
}