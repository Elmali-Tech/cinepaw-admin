interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

export default function Avatar({ name, src, size = 40 }: AvatarProps) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
