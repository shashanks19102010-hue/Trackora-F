import type { AvatarConfig } from "@/lib/validation/schemas";

const HAIR_PATHS: Record<AvatarConfig["hairStyle"], string> = {
  bald: "",
  short: "M20 45 Q50 10 80 45 L80 30 Q50 15 20 30 Z",
  curly: "M15 42 Q18 12 50 12 Q82 12 85 42 Q78 20 50 20 Q22 20 15 42 Z",
  long: "M18 45 Q15 90 25 95 L32 95 Q28 55 30 45 Q50 15 70 45 Q72 55 68 95 L75 95 Q85 90 82 45 Q78 12 50 12 Q22 12 18 45 Z",
  buzz: "M22 40 Q50 20 78 40 L78 34 Q50 24 22 34 Z",
  mohawk: "M45 10 L55 10 L58 42 L42 42 Z",
};

const EYE_PATHS: Record<AvatarConfig["eyes"], string> = {
  round: "M0 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0",
  sleepy: "M0 3 Q4 6 8 3",
  sharp: "M0 3 L8 1",
  wink: "M0 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0",
};

const MOUTH_PATHS: Record<AvatarConfig["mouth"], string> = {
  smile: "M38 68 Q50 78 62 68",
  neutral: "M40 70 L60 70",
  grin: "M36 66 Q50 82 64 66 Q50 74 36 66 Z",
  surprised: "M50 66 a6 6 0 1 0 0.1 0",
};

export function AvatarSvg({ config, size = 96 }: { config: AvatarConfig; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Avatar">
      <circle cx="50" cy="50" r="50" fill={config.backgroundColor} />
      {/* Head */}
      <circle cx="50" cy="55" r="32" fill={config.skinTone} />
      {/* Hair (behind or over head depending on style) */}
      {config.hairStyle !== "bald" && <path d={HAIR_PATHS[config.hairStyle]} fill={config.hairColor} />}
      {/* Eyes */}
      <g transform="translate(30, 50)" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
        <path d={EYE_PATHS[config.eyes]} fill={config.eyes === "round" || config.eyes === "wink" ? "#1a1a1a" : "none"} />
      </g>
      <g transform="translate(62, 50)" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
        {config.eyes === "wink" ? (
          <path d="M0 3 Q4 6 8 3" />
        ) : (
          <path d={EYE_PATHS[config.eyes]} fill={config.eyes === "round" ? "#1a1a1a" : "none"} />
        )}
      </g>
      {/* Mouth */}
      <path d={MOUTH_PATHS[config.mouth]} fill="none" stroke="#a83a2c" strokeWidth="2.5" strokeLinecap="round" />
      {/* Accessories */}
      {config.accessory === "glasses" && (
        <g stroke="#1a1a1a" strokeWidth="2.5" fill="none">
          <circle cx="34" cy="51" r="9" />
          <circle cx="66" cy="51" r="9" />
          <line x1="43" y1="51" x2="57" y2="51" />
        </g>
      )}
      {config.accessory === "sunglasses" && (
        <g>
          <rect x="25" y="44" width="18" height="12" rx="4" fill="#111" />
          <rect x="57" y="44" width="18" height="12" rx="4" fill="#111" />
          <line x1="43" y1="49" x2="57" y2="49" stroke="#111" strokeWidth="2.5" />
        </g>
      )}
      {config.accessory === "cap" && (
        <g>
          <path d="M18 32 Q50 5 82 32 L82 22 Q50 -5 18 22 Z" fill={config.hairColor} />
          <ellipse cx="50" cy="30" rx="34" ry="6" fill={config.hairColor} />
        </g>
      )}
    </svg>
  );
}
