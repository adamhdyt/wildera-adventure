export function WhyWildera() {
  const features = [
    {
      icon: (
        <svg
          className="size-6 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: 'Standar Keselamatan Medis Ketat',
      description:
        'Dilengkapi briefing kesiapan ketinggian, protokol evakuasi darurat, tabung oksigen portabel, dan tim yang terlatih Wilderness First Aid.',
    },
    {
      icon: (
        <svg
          className="size-6 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      title: 'Guide Bersertifikat & Porter Handal',
      description:
        'Pemandu berlisensi resmi APGI yang memahami karakter jalur dan perubahan iklim mikro pegunungan, didukung keramahan porter lokal.',
    },
    {
      icon: (
        <svg
          className="size-6 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"
          />
        </svg>
      ),
      title: 'Camp Nyaman & Sajian Hangat',
      description:
        'Tenda dome double layer tahan badai, matras busa tebal, sleeping bag bersih, serta menu makanan bernutrisi tinggi yang dimasak hangat di setiap pos.',
    },
    {
      icon: (
        <svg
          className="size-6 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
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
