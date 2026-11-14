/**
 * The Book360 mark: a map pin (the place you stay) standing inside a ring that passes behind and in
 * front of it (looking all the way around the place).
 *
 * The shapes are copied from brand/logo-template.svg, which is the working file. If the logo changes
 * there, copy the three shapes here and into src/app/icon.svg. It is decorative, so it is hidden from
 * screen readers; the wordmark beside it is what gets read out.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <path d="M8 46a24 8 0 0 1 48 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.4" />
      <path d="M32 50S17 35.5 17 24a15 15 0 0 1 30 0c0 11.5-15 26-15 26ZM32 18.5a5.5 5.5 0 1 0 0 11a5.5 5.5 0 1 0 0-11Z" fill="currentColor" fillRule="evenodd" />
      <path d="M8 46a24 8 0 0 0 48 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The wordmark: BOOK in the text colour and 360 in blue. On dark backgrounds the blue switches to a
 * lighter one, because the normal blue is too dim to read against navy.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`font-medium uppercase tracking-[0.22em] ${className ?? ""}`}>
      Book<span className="text-ocean [.on-dark_&]:text-sky">360</span>
    </span>
  );
}
