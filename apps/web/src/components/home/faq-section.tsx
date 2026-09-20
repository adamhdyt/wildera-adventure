'use client';

import { useState } from 'react';
import type { PublicFaq } from '@wildera/types';

interface FaqSectionProps {
  faqs?: PublicFaq[];
}

const FALLBACK_FAQS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'faq-1',
    question: 'Apakah pemula yang belum pernah mendaki bisa ikut Open Trip?',
    answer:
      'Bisa! Sebagian besar rute open trip kami dirancang bersahabat untuk pemula dengan kategori kesulitan Moderate (seperti Gunung Prau dan Gunung Gede). Tim pemandu kami akan memandu langkahmu, mengatur ritme istirahat, dan memberikan briefing kesiapan fisik sebelum keberangkatan.',
  },
  {
    id: 'faq-2',
    question: 'Apa saja perlengkapan pribadi yang wajib dibawa peserta?',
    answer:
      'Perlengkapan pribadi esensial meliputi: sepatu trekking bertapak grip, jaket penahan angin/dingin (windproof & fleece), jas hujan ponco/setelan, headlamp dengan baterai cadangan, pakaian ganti cadangan dalam dry bag, serta obat-obatan pribadi. Tenda, matras, nesting masak, dan logistik utama telah disediakan oleh Wildera.',
  },
  {
    id: 'faq-3',
    question:
      'Bagaimana jika cuaca buruk atau ada penutupan jalur oleh Balai Taman Nasional?',
    answer:
      'Keselamatan peserta adalah prioritas absolut. Jika terjadi penutupan resmi oleh Balai Taman Nasional atau kondisi force majeure cuaca ekstrem yang membahayakan nyawa, jadwal perjalanan akan dijadwalkan ulang (reschedule) atau dana peserta dikembalikan sesuai ketentuan kebijakan pembatalan darurat Wildera.',
  },
  {
    id: 'faq-4',
    question: 'Apakah makanan dan air minum selama di gunung sudah disediakan?',
    answer:
      'Ya. Seluruh paket trip Wildera mencakup makan besar bernutrisi tinggi selama di area camp (dimasak hangat dan higienis oleh tim porter/koki kami), teh hangat/kopi, serta suplai air minum yang cukup untuk kebutuhan rehidrasi pendakian.',
  },
  {
    id: 'faq-5',
    question: 'Bagaimana sistem pembayaran dan pelunasan trip?',
    answer:
      'Pendaftaran diamankan dengan pembayaran uang muka (DP) sebesar 30%–50% tergantung destinasi. Sisa pelunasan dapat dilakukan maksimal H-7 sebelum hari keberangkatan melalui transfer bank resmi Wildera dengan e-invoice transparan.',
  },
];

export function FaqSection({ faqs }: FaqSectionProps) {
  const displayFaqs = faqs && faqs.length > 0 ? faqs : FALLBACK_FAQS;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <section aria-label="FAQ" className="py-16 md:py-24">
      <div className="w-content-width mx-auto flex flex-col gap-10 md:gap-14">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="px-3.5 py-1 text-xs font-semibold tracking-wider uppercase card rounded-full w-fit text-accent">
            FAQ
          </div>
          <h2 className="bg-gradient-to-r from-foreground to-primary-cta bg-clip-text text-transparent text-4xl md:text-6xl font-bold leading-tight text-balance">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="max-w-2xl text-base md:text-lg text-foreground/80 leading-relaxed text-balance">
            Semua hal yang perlu kamu ketahui sebelum melangkah dan menjelajahi
            gunung impianmu bersama Wildera.
          </p>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl w-full mx-auto flex flex-col gap-4">
          {displayFaqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={faq.id || i}
                className="card rounded-2xl border border-black/5 overflow-hidden transition-all duration-300 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left cursor-pointer hover:bg-black/[0.02] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-base md:text-lg font-bold text-foreground pr-4">
                    {faq.question}
                  </span>
                  <div className="size-8 rounded-full flex items-center justify-center secondary-button text-foreground shrink-0">
                    <svg
                      className={`size-4 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 md:px-6 md:pb-6 pt-1 text-sm md:text-base text-foreground/75 leading-relaxed border-t border-foreground/5 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
