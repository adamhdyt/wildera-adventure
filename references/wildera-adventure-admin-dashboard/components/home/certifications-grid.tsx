"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { Maximize2 } from "lucide-react"
import { LightboxModal, type LightboxItem } from "@/components/shared/lightbox-modal"
import { Reveal } from "@/components/ui/reveal"

const CERTIFICATIONS_DATA: LightboxItem[] = [
  {
    title: "Oracle Autonomous Database Cloud 2025 Certified Professional",
    org: "Oracle University",
    image: "/images/certs/eCertificate_Oracle_Autonomous_Database.jpg",
    year: "2025",
    credentialType: "Cloud Professional",
  },
  {
    title: "Oracle Cloud Database Service Administration 2025 Certified Professional",
    org: "Oracle University",
    image: "/images/certs/eCertificate_Oracle_Cloud_Database_Service.jpg",
    year: "2025",
    credentialType: "Cloud Professional",
  },
  {
    title: "Oracle Database 19c: Performance Management and Tuning",
    org: "Oracle University",
    image: "/images/certs/Sertifikat_Oracle_Performance_Management_and_Tuning.jpg",
    year: "Specialization",
    credentialType: "Performance Tuning",
  },
  {
    title: "Oracle Database 19c Administration Workshop",
    org: "Oracle University",
    image: "/images/certs/SertifikatOracle_Database19cAdministrationWorkshop.jpg",
    year: "Core DBA",
    credentialType: "Database Architecture",
  },
  {
    title: "Oracle Database 19c RAC Administration Workshop",
    org: "Oracle University",
    image: "/images/certs/SertifikatOracle_Database19cRACAdministrationWorkshop.jpg",
    year: "High Availability",
    credentialType: "Cluster & RAC",
  },
  {
    title: "Oracle Database 19c: Backup and Recovery",
    org: "Oracle University",
    image: "/images/certs/SertifikatBackup19cRecovery.jpg",
    year: "Disaster Recovery",
    credentialType: "RMAN & Standby",
  },
]

export function CertificationsGrid() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <section id="certifications" aria-labelledby="certifications-heading" className="mx-auto w-full max-w-7xl border-t border-border px-6 py-20 sm:px-10 lg:px-16">
      <Reveal className="mb-10 grid gap-5 md:grid-cols-[1fr_0.7fr] md:items-end md:gap-16">
        <div>
          <span className="section-label">Verified Credentials & Accreditations</span>
          <h2 id="certifications-heading" className="mt-3">Oracle Certified Expertise</h2>
        </div>
        <p className="text-base leading-relaxed text-muted-foreground">Six verified credentials across cloud autonomous systems, high-availability RAC clusters, disaster recovery, and query optimization.</p>
      </Reveal>
      <div className="rounded-2xl border border-border bg-card px-5 sm:px-8">
        <div className="flex items-center justify-between gap-4 py-5 text-xs text-muted-foreground"><span>Oracle University Validated</span><span>6 credentials</span></div>
        <ul className="divide-y divide-border border-t border-border">
          {CERTIFICATIONS_DATA.map((cert, index) => (
            <li key={cert.title} className="grid grid-cols-[64px_1fr] items-start gap-x-4 gap-y-2 py-6 sm:grid-cols-[112px_1fr_auto] sm:items-center sm:gap-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-background">
                <Image src={cert.image} alt="" fill sizes="(max-width: 639px) 64px, 112px" className="object-contain" />
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-xs text-muted-foreground">{cert.org} · {cert.year}</p>
                <h3 className="text-base font-medium leading-snug sm:text-xl">{cert.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{cert.credentialType}</p>
              </div>
              <button type="button" aria-label={`View certificate: ${cert.title}`} onClick={event => {
                triggerRef.current = event.currentTarget
                setSelectedIndex(index)
                setLightboxOpen(true)
              }} className="col-start-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-1 text-xs font-medium underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground sm:col-start-auto sm:px-3">
                Preview <Maximize2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <LightboxModal isOpen={lightboxOpen} items={CERTIFICATIONS_DATA} initialIndex={selectedIndex} onClose={closeLightbox} />
    </section>
  )
}
