import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cx } from '../lib/cx.ts';

export type FrameTone = 'default' | 'panel' | 'plain' | 'good' | 'bad' | 'warn';

const TONE_CLASS: Record<FrameTone, string> = {
  default: '',
  panel: 'frame--panel',
  plain: 'frame--plain',
  good: 'frame--good',
  bad: 'frame--bad',
  warn: 'frame--warn',
};

type FrameProps<T extends ElementType> = {
  as?: T;
  tone?: FrameTone;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

/** The cut-corner panel of the mockups. The decoration is hidden from assistive technology. */
export function Frame<T extends ElementType = 'div'>({
  as,
  tone = 'default',
  className,
  children,
  ...rest
}: FrameProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag className={cx('frame', TONE_CLASS[tone], className)} {...rest}>
      <FrameBackground />
      {children}
    </Tag>
  );
}

/** The decorative layer of a frame, for elements that carry the `frame` class themselves. */
export function FrameBackground() {
  return <span aria-hidden="true" className="frame__bg" />;
}
