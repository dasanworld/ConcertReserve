'use client';

interface ConcertHeroSectionProps {
  thumbnailUrl: string;
  title: string;
}

export const ConcertHeroSection = ({
  thumbnailUrl,
  title,
}: ConcertHeroSectionProps) => {
  return (
    <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-lg">
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
      </div>
    </div>
  );
};
