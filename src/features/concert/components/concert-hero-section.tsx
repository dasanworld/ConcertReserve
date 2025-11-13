'use client';

import Image from 'next/image';

import BlackpinkHero from '../../../../.img/Blackpink.png';
import IUHero from '../../../../.img/IU.png';
import BTSHero from '../../../../.img/BTS.png';
import DefaultHero from '../../../../.img/seat.png';

interface ConcertHeroSectionProps {
  thumbnailUrl: string;
  title: string;
}

export const ConcertHeroSection = ({
  thumbnailUrl,
  title,
}: ConcertHeroSectionProps) => {
  void thumbnailUrl;
  const key = title.toLowerCase();
  const resolvedSrc = key.includes('blackpink')
    ? BlackpinkHero
    : key.includes('bts')
      ? BTSHero
      : key.includes('iu') || key.includes('아이유') || key.includes('아유')
        ? IUHero
        : DefaultHero;
  return (
    <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-lg">
      <Image
        src={resolvedSrc}
        alt={title}
        fill
        priority
        className="object-cover"
        style={{ objectPosition: 'center 20%' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
      </div>
    </div>
  );
};
