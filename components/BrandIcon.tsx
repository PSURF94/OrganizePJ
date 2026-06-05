export default function BrandIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="40" height="40" rx="9" fill="#1A1A1D" />

      {/*
        Protective ring — arc from 1 o'clock (25.5, 12.5) clockwise 300°
        to 11 o'clock (14.5, 12.5), leaving a 60° opening at the top.
        Represents "Organize" encircling and protecting PJ.
      */}
      <path
        d="M 25.5 12.5 A 11 11 0 1 1 14.5 12.5"
        stroke="#FF8A00"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />

      {/*
        Growth arrow emerging from the gap at top — prosperity and growth
        pointing upward from within the protective ring.
      */}
      <line x1="20" y1="11.5" x2="20" y2="5.5" stroke="#FF8A00" strokeWidth="2.2" strokeLinecap="round" />
      <polyline
        points="17,8 20,5.5 23,8"
        stroke="#FF8A00"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* PJ — the company, centered and protected inside the ring */}
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fill="white"
        fontWeight="800"
        fontSize="12"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.3"
      >
        PJ
      </text>
    </svg>
  )
}
