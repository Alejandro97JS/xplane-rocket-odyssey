import type { SVGProps } from 'react';

/**
 * Small line icons. They are decorative: the text next to them carries the
 * meaning, so they are hidden from assistive technology.
 */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
);
export const CheckIcon = (p: IconProps) => (
  <Icon strokeWidth={3} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);
export const CrossIcon = (p: IconProps) => (
  <Icon strokeWidth={3} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5L2.5 20h19L12 3.5z" />
    <path d="M12 10v4.5M12 17.4v.1" />
  </Icon>
);
export const InfoIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.6v.1" />
  </Icon>
);
export const CoinIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9.2c-.5-.9-1.5-1.4-2.8-1.4-1.700 0-2.900.9-2.900 2.100 0 2.900 5.900 1.300 5.900 4.200 0 1.200-1.300 2.100-3 2.100-1.400 0-2.500-.6-3-1.500M12 5.800v12.400" />
  </Icon>
);
export const WeightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.500 9h11l2.500 11H4L6.500 9z" />
    <circle cx="12" cy="6" r="2.500" />
  </Icon>
);
export const RocketIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 2.500c3.200 2.600 4.500 6.300 4.500 10V16h-9v-3.500c0-3.700 1.300-7.400 4.500-10z" />
    <circle cx="12" cy="10" r="1.800" />
    <path d="M7.500 13l-3 4.500h3M16.500 13l3 4.500h-3M10 19.500l2 2.500 2-2.500" />
  </Icon>
);
export const OrbitIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <ellipse cx="12" cy="12" rx="10" ry="4.200" transform="rotate(-28 12 12)" />
  </Icon>
);
export const TargetIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.500" />
    <path d="M12 1.500v4M12 18.500v4M1.500 12h4M18.500 12h4" />
  </Icon>
);
export const BoxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 2.500l8.500 4.700v9.600L12 21.500l-8.500-4.700V7.200L12 2.500z" />
    <path d="M3.500 7.200L12 12l8.500-4.800M12 12v9.500" />
  </Icon>
);
export const PauseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 5v14M16 5v14" />
  </Icon>
);
export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4.500v15l12-7.500-12-7.500z" />
  </Icon>
);
export const SkipIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 5l9 7-9 7V5zM18.500 5v14" />
  </Icon>
);
export const ReplayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12a8 8 0 1 0 2.600-5.900M4 4v4.500h4.500" />
  </Icon>
);
export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8} {...p}>
    <path d="M12 2.800l2.800 5.900 6.400.8-4.700 4.500 1.200 6.400L12 17.300l-5.700 3.100 1.200-6.400L2.800 9.500l6.400-.8L12 2.800z" />
  </Icon>
);
export const LightbulbIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2V16h5v-.1c0-.8.400-1.500 1-2A6 6 0 0 0 12 3z" />
  </Icon>
);
export const UsersIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.500" />
    <path d="M2.500 20c.5-3.500 3-5.500 6.500-5.500s6 2 6.500 5.500M16 4.800a3.500 3.500 0 0 1 0 6.400M18.500 14.800c1.700.8 2.700 2.500 3 5.200" />
  </Icon>
);
export const GaugeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.500 17a9 9 0 1 1 17 0" />
    <path d="M12 14l4-5.500" />
    <circle cx="12" cy="14.500" r="1.200" />
  </Icon>
);
export const SoundOnIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4v-5z" />
    <path d="M15.500 9a4 4 0 0 1 0 6M18 6.500a7.500 7.500 0 0 1 0 11" />
  </Icon>
);
export const SoundOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4v-5z" />
    <path d="M16 9.500l5 5M21 9.500l-5 5" />
  </Icon>
);
