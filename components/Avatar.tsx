const COLORS = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
  "bg-teal-500",
  "bg-orange-500",
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = {
  name: string;
  src?: string;
  className?: string;
  textClassName?: string;
};

export default function Avatar({ name, src, className = "w-12 h-12 rounded-full", textClassName = "text-sm" }: Props) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${className} object-cover flex-shrink-0`}
      />
    );
  }
  const color = COLORS[hash(name) % COLORS.length];
  return (
    <div className={`${className} ${color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      <span className={textClassName}>{initials(name)}</span>
    </div>
  );
}
