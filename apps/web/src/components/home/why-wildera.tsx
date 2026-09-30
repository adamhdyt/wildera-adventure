export function WhyWildera() {
  const features = [
    {
      icon: (
        <svg
          aria-hidden="true"
          className="size-7 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="M9 12h6" />
          <path d="M12 9v6" />
        </svg>
      ),
      title: 'Standar Keselamatan Medis Ketat',
      description:
        'Dilengkapi briefing kesiapan ketinggian, protokol evakuasi darurat, tabung oksigen portabel, dan tim yang terlatih Wilderness First Aid.',
    },
    {
      icon: (
        <svg
          aria-hidden="true"
          className="size-7 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      title: 'Guide Bersertifikat & Porter Handal',
      description:
        'Pemandu berlisensi resmi APGI yang memahami karakter jalur dan perubahan iklim mikro pegunungan, didukung keramahan porter lokal.',
    },
    {
      icon: (
        <svg
          aria-hidden="true"
          className="size-7 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M3.5 21 14 3" />
          <path d="M20.5 21 10 3" />
          <path d="M15.5 21 12 15l-3.5 6" />
          <path d="M2 21h20" />
        </svg>
      ),
      title: 'Camp Nyaman & Sajian Hangat',
      description:
        'Tenda dome double layer tahan badai, matras busa tebal, sleeping bag bersih, serta menu makanan bernutrisi tinggi yang dimasak hangat di setiap pos.',
    },
    {
      icon: (
        <svg
          aria-hidden="true"
          className="size-7 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
          <path d="M14 8H8" />
          <path d="M16 12H8" />
          <path d="M13 16H8" />
        </svg>
      ),
      title: 'Transparansi Biaya & Pelayanan Prima',
      description:
        'Rincian tiket masuk taman nasional, simaksi resmi, asuransi pendakian, dan logistik tertera jelas tanpa biaya tersembunyi di kemudian hari.',
    },
  ];

  return (
    <section aria-label="Why Wildera" className="py-16 md:py-24">
      <div className="w-content-width mx-auto flex flex-col gap-10 md:gap-14">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="px-3.5 py-1 text-xs font-semibold tracking-wider uppercase card rounded-full w-fit text-accent">
            Kenapa Wildera
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl text-foreground text-balance">
            Petualangan sejati menuntut standar keselamatan tanpa kompromi dan
            kenyamanan yang dipersiapkan matang.
          </h2>
          <p className="max-w-2xl text-base md:text-lg text-foreground/75 leading-relaxed text-balance">
            Kami mengubah pendakian berat menjadi pengalaman hidup yang
            berkesan, aman, dan mendalam bagi setiap penjelajah.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="flex flex-col gap-4 p-6 md:p-8 card rounded-3xl border border-black/5 hover:border-black/15 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="size-12 rounded-2xl flex items-center justify-center secondary-button shadow-inner">
                {f.icon}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-2xs font-semibold text-accent/80 tracking-widest uppercase">
                  Keunggulan 0{i + 1}
                </span>
                <h3 className="text-xl font-bold text-foreground leading-snug">
                  {f.title}
                </h3>
                <p className="text-sm text-foreground/75 leading-relaxed">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
