import { AbsoluteFill } from "remotion";

export interface PhaseWrapProps {
  t: number;
  from: number;
  to: number;
  fadeIn?: number;
  fadeOut?: number;
  children: React.ReactNode;
}

const progress = (t: number, from: number, to: number) => {
  if (t <= from) return 0;
  if (t >= to) return 1;
  return (t - from) / (to - from);
};

export const PhaseWrap: React.FC<PhaseWrapProps> = ({
  t,
  from,
  to,
  fadeIn = 0,
  fadeOut = 0,
  children,
}) => {
  const enter =
    fadeIn <= 0 ? (t >= from ? 1 : 0) : progress(t, from, from + fadeIn);
  const exit =
    fadeOut <= 0 ? (t < to ? 1 : 0) : 1 - progress(t, to - fadeOut, to);
  const opacity = Math.min(enter, exit);

  if (opacity === 0) return null;

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
