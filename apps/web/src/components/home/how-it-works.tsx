export function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Pilih Trip & Jadwal',
      shortTitle: 'Pilih',
      desc: 'Tentukan gunung dan tanggal yang sesuai dengan ketersediaan waktumu melalui katalog open trip atau ajukan tanggal private trip.',
      image:
        'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200&auto=format&fit=crop',
    },
    {
      num: '02',
      title: 'Konsultasi Admin via WhatsApp',
      shortTitle: 'Konsultasi',
      desc: 'Diskusikan kuota kursi, pilihan paket titik temu, dan konsultasi kesiapan fisik bersama trip specialist kami.',
      image:
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    },
    {
      num: '03',
      title: 'Konfirmasi & Pembayaran Aman',
      shortTitle: 'Konfirmasi',
      desc: 'Kunci slot pendakianmu dengan pembayaran DP resmi. Dapatkan tanda terima, bukti pemesanan, dan jaminan kuota berangkat.',
      image:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    },
    {
      num: '04',
      title: 'Persiapan Fisik & Perlengkapan',
      shortTitle: 'Persiapan',
      desc: 'Dapatkan panduan packing list, briefing SOP keselamatan, dan bergabung ke grup koordinasi peserta sebelum keberangkatan.',
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    },
    {
      num: '05',
      title: 'Berangkat & Capai Puncak',
      shortTitle: 'Berangkat',
      desc: 'Bertemu tim di meeting point yang disepakati, nikmati keindahan alam Indonesia, dan ciptakan momen puncak yang aman bersama Wildera.',
      image:
        'https://commons.wikimedia.org/wiki/Special:FilePath/Mount%20Semeru.jpg?width=1200',
    },
  ];

  return (
    <section aria-label="How It Works" className="py-16 md:py-24">
      <div className="flex flex-col gap-8 md:gap-14">
        {/* Header */}
        <div className="flex flex-col items-center w-content-width mx-auto gap-3 text-center">
          <div className="px-3.5 py-1 text-xs font-semibold tracking-wider uppercase card rounded-full w-fit text-accent">
            Cara Booking
          </div>
          <h2 className="bg-gradient-to-r from-foreground to-primary-cta bg-clip-text text-transparent text-4xl md:text-6xl font-bold leading-tight text-balance">
            5 Langkah Menuju Puncak
          </h2>
          <p className="max-w-2xl text-base md:text-lg leading-relaxed text-foreground/80 text-balance">
            Alur pemesanan yang jelas, ramah, dan bebas ribet dari awal
            pendaftaran hingga kembali pulang dengan selamat.
          </p>
        </div>

        {/* Steps Cards List */}
        <div className="flex flex-col w-content-width mx-auto gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex flex-col md:flex-row justify-between 2xl:w-9/10 mx-auto gap-6 p-6 md:p-10 card rounded-3xl border border-black/5 hover:border-black/15 transition-all duration-300 shadow-sm overflow-hidden"
            >
              {/* Step Text Info */}
              <div className="flex flex-col justify-between w-full md:w-1/2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="px-3 py-1 text-xs font-semibold tracking-wider uppercase card rounded-full w-fit text-accent">
                    Langkah {step.num}
                  </div>
                  <h3 className="text-5xl md:text-7xl font-bold leading-none text-foreground/90 tracking-tight">
                    {step.shortTitle}
                  </h3>
                </div>
                <div className="flex flex-col gap-2 pt-2 md:pt-4 border-t border-foreground/10">
                  <h4 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
                    {step.title}
                  </h4>
                  <p className="text-sm md:text-base text-foreground/75 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Step Image */}
              <div className="w-full md:w-1/2 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shadow-inner bg-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
