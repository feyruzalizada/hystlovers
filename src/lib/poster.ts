/** A title band banner per screen size, smallest first. */
export type Poster = { mobile: string | null; tablet: string | null; desktop: string | null; wide: string | null };

const ORDER = ["mobile", "tablet", "desktop", "wide"] as const;

/** The smallest screen width each size is for, as in POSTER_SIZES. */
export const POSTER_MIN_WIDTH = { mobile: 0, tablet: 640, desktop: 1024, wide: 1920 } as const;

export const hasPoster = (poster: Poster | null | undefined): poster is Poster =>
  Boolean(poster && ORDER.some((size) => poster[size]));

/**
 * Every size filled in: an empty one takes the nearest size that is set, the
 * larger of two equally near ones, since shrinking keeps it sharp.
 */
export function fillPoster(poster: Poster): Record<(typeof ORDER)[number], string> {
  const filled = {} as Record<(typeof ORDER)[number], string>;
  ORDER.forEach((size, index) => {
    const nearest = ORDER.map((other, at) => ({ url: poster[other], distance: Math.abs(at - index), at }))
      .filter((candidate) => candidate.url)
      .sort((a, b) => a.distance - b.distance || b.at - a.at)[0];
    filled[size] = nearest?.url ?? "";
  });
  return filled;
}
