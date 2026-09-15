const paths = {
  search: "M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
  user: "M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  bag: "M6 7h12l1 14H5L6 7ZM9 7V6a3 3 0 0 1 6 0v1",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  "chevron-down": "m6 9 6 6 6-6",
  "chevron-left": "m15 6-6 6 6 6",
  "chevron-right": "m9 6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  "arrow-right": "M4 12h16m0 0-6-6m6 6-6 6",
  filter: "M4 6h16M7 12h10M10 18h4",
  trash: "M5 7h14M10 7V5h4v2m-7 0 1 13h8l1-13",
  check: "m5 13 4 4L19 7",
} as const;

export type IconName = keyof typeof paths;

export default function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
