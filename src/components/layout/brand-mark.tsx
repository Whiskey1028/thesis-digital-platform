/** Inline brand mark — dark circle + stylized globe (matches site favicon). */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <circle cx="32" cy="32" r="32" fill="#0f172a" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#f8fafc" strokeWidth="2.5" />
      <ellipse cx="32" cy="32" rx="8" ry="18" fill="none" stroke="#f8fafc" strokeWidth="2" />
      <path
        d="M14 32h36"
        fill="none"
        stroke="#f8fafc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 22c4 2 8 3 12 3s8-1 12-3"
        fill="none"
        stroke="#f8fafc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 42c4-2 8-3 12-3s8 1 12 3"
        fill="none"
        stroke="#f8fafc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="26" r="3.5" fill="#f8fafc" opacity="0.95" />
      <circle cx="40" cy="38" r="4" fill="#f8fafc" opacity="0.9" />
    </svg>
  );
}
