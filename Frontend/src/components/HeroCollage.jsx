// Full-width tilted photo collage, shared by the intro page and the dashboard.
// The row is wider than its container and clipped, so the skew never leaves gaps or causes side-scroll.
const HERO_PHOTOS = [
  ['1464822759023-fed622ff2c3b', 'Mountains'],
  ['1602216056096-3b40cc0c9944', 'Kerala backwaters'],
  ['1477587458883-47145ed94245', 'Hawa Mahal, Jaipur'],
  ['1551641506-ee5bf4cb45f1', 'Tokyo at night'],
  ['1512343879784-a960bf40e7f2', 'Goa beach'],
  ['1499678329028-101435549a4e', 'Cinque Terre'],
  ['1564507592333-c60657eea523', 'Taj Mahal'],
  ['1626621341517-bbf3d9990a23', 'Snow trek'],
  ['1537996194471-e657df975ab4', 'Bali temple'],
  ['1514222134-b57cbb8ce073', 'Golden Temple, Amritsar'],
  ['1499856871958-5b9627545d1a', 'Paris'],
  ['1470071459604-3b5ec3a7fe05', 'Green valley'],
  ['1573843981267-be1999ff37cd', 'Maldives'],
  ['1599661046289-e31897846e41', 'Amber Fort'],
  ['1493976040374-85c8e12f0c0e', 'Kyoto street'],
  ['1501785888041-af3ef285b470', 'Mountain lake'],
  ['1548661710-7f540c9c56d6', 'Singapore skyline'],
  ['1531366936337-7c912a4589a7', 'Northern lights'],
  ['1593693411515-c20261bcad6e', 'Houseboat'],
  ['1587595431973-160d0d94add1', 'Machu Picchu'],
  ['1507525428034-b723cf961d3e', 'Beach sunset'],
  ['1540959733332-eab4deabeeaf', 'Tokyo crossing'],
  ['1469474968028-56623f02e42e', 'Misty hills'],
  ['1533105079780-92b9be482077', 'Santorini'],
  ['1561361513-2d000a50f0dc', 'Road trip'],
];

// Small seeded PRNG so the "random" collage looks organic but stays identical on every render.
const seededRandom = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Tilted full-width hero collage: columns of varying width, each with 1–3 tiles of varying height/width/offset.
const HERO_COLUMNS = (() => {
  const rand = seededRandom(20261006);
  let photo = 0;
  const total = 7;
  return Array.from({ length: total }, (_, c) => {
    const r = rand();
    const count = r < 0.4 ? 1 : 2;
    return {
      grow: 0.85 + rand() * 0.6,
      // Spacer weights relative to tiles (~1 each) give each column a random vertical offset.
      padTop: rand() * 0.3,
      padBottom: rand() * 0.25,
      mobile: c < 4,
      tiles: Array.from({ length: count }, () => {
        const [id, alt] = HERO_PHOTOS[photo++ % HERO_PHOTOS.length];
        return {
          src: `https://images.unsplash.com/photo-${id}?q=75&w=600`,
          alt,
          grow: 0.6 + rand(),
          width: 92 + Math.round(rand() * 8),
          align: rand() < 0.5 ? 'self-start' : 'self-end',
        };
      }),
    };
  });
})();

export default function HeroCollage() {
  return (
    <div className="flex gap-2.5 md:gap-4 h-full w-[116%] -ml-[8%]" style={{ transform: 'skewX(-12deg)' }}>
      {HERO_COLUMNS.map((col, c) => (
        <div
          key={c}
          className={`${col.mobile ? 'flex' : 'hidden md:flex'} flex-col gap-2.5 md:gap-4 min-w-0`}
          style={{ flex: `${col.grow} 1 0` }}
        >
          <div aria-hidden="true" style={{ flex: `${col.padTop} 1 0` }} />
          {col.tiles.map((tile, t) => (
            <div
              key={t}
              className={`hero-tile relative overflow-hidden bg-[#d6e7cc] shadow-md cursor-pointer transition-all duration-500 ease-out hover:z-20 hover:scale-[1.08] hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#152010]/30 group/tile ${tile.align}`}
              style={{ flex: `${tile.grow} 1 0`, width: `${tile.width}%`, minHeight: 0 }}
            >
              <img
                src={tile.src}
                alt={tile.alt}
                className="absolute top-0 h-full max-w-none -left-1/2 w-[200%] object-cover"
                style={{ transform: 'skewX(12deg)' }}
              />
              <div className="absolute inset-0 bg-[#152010]/0 group-hover/tile:bg-[#152010]/10 transition-colors duration-500" />
            </div>
          ))}
          <div aria-hidden="true" style={{ flex: `${col.padBottom} 1 0` }} />
        </div>
      ))}
    </div>
  );
}
