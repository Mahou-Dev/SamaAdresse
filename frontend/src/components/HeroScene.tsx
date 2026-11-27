/**
 * Illustration vectorielle du visuel d'accueil : ville côtière au coucher du soleil (phare sur la
 * colline, minaret, immeubles éclairés, palmiers, océan) et itinéraire jalonné de repères.
 * Ce n'est pas une photographie : aucune photo libre de droits n'est fournie dans le projet.
 */
const WINDOWS = Array.from({ length: 46 }, (_, i) => ({ x: 70 + ((i * 137) % 1300), y: 520 + ((i * 53) % 60) }))

function Palm({ x, scale = 1 }: { x: number; scale?: number }) {
  return (
    <g transform={`translate(${x} 600) scale(${scale})`} fill="#0a0820">
      <path d="M-3 0C-1-40 2-80 8-118l5 1C8-78 5-38 4 0Z" />
      <path d="M10-118c-22-14-48-12-66 4 22-8 44-6 66-2Z" />
      <path d="M10-118c-16-22-40-30-62-24 22 2 44 10 62 24Z" />
      <path d="M10-118c4-26 24-44 50-46-20 10-38 26-50 46Z" />
      <path d="M10-118c24-12 52-8 70 10-24-8-48-10-70-10Z" />
      <path d="M10-118c18 6 34 22 40 44-12-18-26-32-40-44Z" />
    </g>
  )
}

export function HeroScene() {
  return (
    <svg className="hero-scene" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050f24" />
          <stop offset=".34" stopColor="#0f3466" />
          <stop offset=".58" stopColor="#5b3a72" />
          <stop offset=".72" stopColor="#d9604f" />
          <stop offset=".82" stopColor="#f59a4a" />
          <stop offset=".88" stopColor="#ffc56e" />
        </linearGradient>
        <radialGradient id="hs-sun" cx=".7" cy=".8" r=".36">
          <stop offset="0" stopColor="#ffe1a1" stopOpacity="1" />
          <stop offset=".18" stopColor="#ffb25c" stopOpacity=".8" />
          <stop offset=".5" stopColor="#f0784a" stopOpacity=".3" />
          <stop offset="1" stopColor="#f0784a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hs-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a4a78" />
          <stop offset=".35" stopColor="#24305a" />
          <stop offset="1" stopColor="#061632" />
        </linearGradient>
        <linearGradient id="hs-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#050f1f" stopOpacity=".9" />
          <stop offset=".45" stopColor="#050f1f" stopOpacity=".5" />
          <stop offset="1" stopColor="#050f1f" stopOpacity=".05" />
        </linearGradient>
        <linearGradient id="hs-bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".6" stopColor="#050f1f" stopOpacity="0" />
          <stop offset="1" stopColor="#050f1f" stopOpacity=".85" />
        </linearGradient>
      </defs>

      <rect width="1440" height="720" fill="url(#hs-sky)" />
      <rect width="1440" height="720" fill="url(#hs-sun)" />
      <circle cx="1008" cy="560" r="46" fill="#ffd690" opacity=".85" />
      <g fill="#ffffff" opacity=".6">
        <circle cx="180" cy="70" r="1.2" /><circle cx="420" cy="40" r="1" /><circle cx="640" cy="95" r="1.3" />
        <circle cx="880" cy="55" r="1" /><circle cx="1120" cy="85" r="1.2" /><circle cx="1330" cy="35" r="1" />
        <circle cx="300" cy="150" r=".9" /><circle cx="760" cy="30" r=".9" /><circle cx="1240" cy="140" r=".8" />
      </g>
      {/* Nuages fins éclairés par le couchant */}
      <g fill="#f7a76a" opacity=".28">
        <rect x="760" y="430" width="380" height="5" rx="2.5" /><rect x="840" y="446" width="260" height="4" rx="2" />
        <rect x="1150" y="410" width="220" height="4" rx="2" />
      </g>

      {/* Colline et phare */}
      <path d="M1160 560c40-40 90-70 150-72 60-2 110 30 130 52v20h-280Z" fill="#2b2148" />
      <g fill="#1d1638">
        <rect x="1298" y="438" width="14" height="54" />
        <path d="M1294 440h22l-4-10h-14Z" />
      </g>
      <circle cx="1305" cy="434" r="4" fill="#ffe7a8" />
      <path d="M1305 434 1440 400v14Z" fill="#ffe7a8" opacity=".18" />

      {/* Silhouette urbaine lointaine */}
      <path fill="#32285a" opacity=".9" d="M0 572v-44h38v-20h26v28h24v-46h32v34h28v-24h30v52h22v-64h18v-12h18v76h38v-36h26v22h26v-50h40v58h22v-28h30v40h34v-66h16v-18h12v84h40v-30h26v22h30v-54h38v60h28v-36h24v44h36v-70h22v76h30v-26h34v34h28v-50h40v52h26v-30h30v40h36v-62h18v68h32v-24h28v30h36v-44h30v48h40v-34h34v40h28v52H0Z" />
      {/* Mosquée : coupole et minaret */}
      <g fill="#1a1436">
        <rect x="560" y="470" width="12" height="90" />
        <path d="M556 474h20l-10-26Z" />
        <rect x="554" y="500" width="24" height="5" />
        <path d="M590 540a40 34 0 0 1 80 0Z" />
        <rect x="586" y="540" width="88" height="28" />
      </g>
      {/* Immeubles proches et fenêtres éclairées */}
      <path fill="#151030" d="M0 610v-62h56v-24h36v40h30v-70h44v58h38v-30h34v52h26v-96h24v-22h18v118h50v-46h40v30h28v-64h56v80h30v-40h40v54h44v-90h22v-26h14v116h52v-38h34v30h40v-74h48v84h36v-48h30v58h50v-102h26v108h40v-34h44v42h36v-66h56v70h34v-40h40v52h48v-84h24v90h44v-30h38v36h46v-58h40v62h36v66H0Z" />
      <g fill="#ffc977" opacity=".75">
        {WINDOWS.map((w, i) => <rect key={i} x={w.x} y={w.y} width="4" height="5" rx="1" />)}
      </g>

      <rect y="598" width="1440" height="122" fill="url(#hs-sea)" />
      <g stroke="#ffc27a" strokeLinecap="round" opacity=".6">
        <path d="M940 618h150" strokeWidth="3" /><path d="M970 638h96" strokeWidth="2.5" /><path d="M992 658h58" strokeWidth="2" />
        <path d="M1000 676h30" strokeWidth="1.6" />
      </g>
      {/* Pirogue */}
      <path d="M300 650h70l-10 9h-50Z" fill="#0a0820" opacity=".8" />

      <Palm x={90} scale={1.05} />
      <Palm x={150} scale={.8} />
      <Palm x={1390} scale={.95} />

      {/* Itinéraire et repères SamaAdresse */}
      <path d="M220 700C400 650 520 590 720 584s320-70 470-140" fill="none" stroke="#10c4d9" strokeWidth="2.5" strokeDasharray="6 9" opacity=".75" />
      <g opacity=".95">
        <path d="M720 560c-9 0-16 7-16 15 0 11 16 25 16 25s16-14 16-25c0-8-7-15-16-15Z" fill="#1a7cff" />
        <circle cx="720" cy="575" r="5" fill="#fff" />
        <path d="M1190 420c-9 0-16 7-16 15 0 11 16 25 16 25s16-14 16-25c0-8-7-15-16-15Z" fill="#13b07f" />
        <circle cx="1190" cy="435" r="5" fill="#fff" />
      </g>
      <rect width="1440" height="720" fill="url(#hs-fade)" />
      <rect width="1440" height="720" fill="url(#hs-bottom)" />
    </svg>
  )
}
