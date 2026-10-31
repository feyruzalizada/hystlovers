import { fillPoster, POSTER_MIN_WIDTH, type Poster } from "@/lib/poster";

/** The title band banner, each screen size getting its own file. */
export default function PosterImage({ poster }: { poster: Poster }) {
  const files = fillPoster(poster);
  return (
    <picture>
      <source media={`(min-width: ${POSTER_MIN_WIDTH.wide}px)`} srcSet={files.wide} />
      <source media={`(min-width: ${POSTER_MIN_WIDTH.desktop}px)`} srcSet={files.desktop} />
      <source media={`(min-width: ${POSTER_MIN_WIDTH.tablet}px)`} srcSet={files.tablet} />
      {/* The files are made for these screens already, so next/image would only resize them again. */}
      <img
        src={files.mobile}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
    </picture>
  );
}
