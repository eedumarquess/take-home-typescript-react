const DURATION_MULTIPLIERS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDurationToMilliseconds(value: string) {
  const match = /^(\d+)([smhd])$/i.exec(value.trim());

  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  return amount * DURATION_MULTIPLIERS[unit];
}
