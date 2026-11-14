import type { ReactNode } from 'react';
import { Button, Link } from 'react-aria-components';
import { cx } from '../lib/cx.ts';
import { FrameBackground } from './Frame.tsx';

export type ButtonVariant = 'primary' | 'secondary' | 'launch';

interface ActionButtonProps {
  variant?: ButtonVariant;
  size?: 'normal' | 'small';
  /** With `href` the control is a link; without it, a button. */
  href?: string;
  onPress?: () => void;
  children: ReactNode;
  className?: string;
  autoFocus?: boolean;
  'aria-describedby'?: string;
  slot?: string;
}

/** The cut-corner button of the mockups: yellow to go on, blue to go back, green to launch. */
export function ActionButton({
  variant = 'secondary',
  size = 'normal',
  href,
  onPress,
  children,
  className,
  ...rest
}: ActionButtonProps) {
  const classes = cx('frame btn', `btn--${variant}`, size === 'small' && 'btn--small', className);
  const content = (
    <>
      <FrameBackground />
      {children}
    </>
  );
  if (href !== undefined) {
    return (
      <Link href={href} className={classes} {...(onPress ? { onPress } : {})} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <Button className={classes} {...(onPress ? { onPress } : {})} {...rest}>
      {content}
    </Button>
  );
}
