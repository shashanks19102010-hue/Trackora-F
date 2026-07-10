import { AvatarSvg } from "@/components/avatar/avatar-svg";
import type { AvatarConfig } from "@/lib/validation/schemas";

export function PersonAvatar({
  name,
  avatarUrl,
  avatarConfig,
  size = 32,
}: {
  name: string;
  avatarUrl?: string | null;
  avatarConfig?: AvatarConfig | null;
  size?: number;
}) {
  if (avatarConfig) {
    return (
      <div style={{ width: size, height: size }} className="overflow-hidden rounded-full">
        <AvatarSvg config={avatarConfig} size={size} />
      </div>
    );
  }

  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-signal/20 text-xs font-semibold text-signal"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
