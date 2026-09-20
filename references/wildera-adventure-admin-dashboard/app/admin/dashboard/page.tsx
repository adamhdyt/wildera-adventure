'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  Menu,
  Mountain,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  TrendingUp,
  UserRound,
  Users,
  X,
} from 'lucide-react'

const navGroups = [
  { label: 'OPERASIONAL', items: [['Ringkasan', LayoutDashboard], ['Booking & Peserta', ClipboardList], ['Jadwal & Kuota', CalendarDays], ['Private Trip Inquiry', MessageIcon]] },
  { label: 'KATALOG', items: [['Trip', Mountain], ['Gunung & Jalur', TrendingUp], ['Destinasi', MapIcon]] },
  { label: 'SISTEM', items: [['Media Library', FileText], ['Konten CMS', FileText], ['Audit Log', Clock3], ['Pengaturan', Settings]] },
] as const

function MessageIcon() { return <span className="text-sm">◎</span> }
function MapIcon() { return <span className="text-sm">⌖</span> }

const schedules = [
  { date: '19–20 Sep 2025', trip: 'Gunung Prau — Sunrise', packages: 'Start Jakarta · Start Basecamp', filled: 18, total: 20, status: 'OPEN' },
  { date: '27–28 Sep 2025', trip: 'Gunung Papandayan', packages: 'Start Jakarta', filled: 12, total: 15, status: 'OPEN' },
  { date: '04–05 Okt 2025', trip: 'Gunung Gede Pangrango', packages: 'Start Basecamp', filled: 18, total: 18, status: 'FULL' },
  { date: '11–12 Okt 2025', trip: 'Gunung Ciremai', packages: 'Start Jakarta · Start Basecamp', filled: 2, total: 20, status: 'OPEN' },
]

const bookings = [
  { code: 'WA-250918-041', date: '18 Sep, 09:42', customer: 'Rizky Pratama', trip: 'Prau · 19–20 Sep', seats: 2, payment: 'DP_PAID', status: 'CONFIRMED' },
  { code: 'WA-250918-039', date: '18 Sep, 08:15', customer: 'Nadia Putri', trip: 'Papandayan · 27–28 Sep', seats: 4, payment: 'PENDING', status: 'CONFIRMED' },
  { code: 'WA-250917-122', date: '17 Sep, 16:28', customer: 'Andi Setiawan', trip: 'Prau · 19–20 Sep', seats: 1, payment: 'FULL_PAID', status: 'CONFIRMED' },
  { code: 'WA-250917-118', date: '17 Sep, 14:03', customer: 'Salsa Amalia', trip: 'Gede · 04–05 Okt', seats: 3, payment: 'FULL_PAID', status: 'CANCELLED' },
]

function MetricCard({ label, value, note, tone = 'default' }: { label: string; value: string; note: string; tone?: string }) {
  return <div className="metric-card"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className={`metric-note ${tone}`}>{note}</div></div>
}

function StatusBadge({ children, tone = 'green' }: { children: React.ReactNode; tone?: string }) { return <span className={`status-badge ${tone}`}>{children}</span> }

export default function AdminDashboard() {
  const [active, setActive] = useState('Ringkasan')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<typeof bookings[number] | null>(null)

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Mountain /></div><div><strong>WILDERA</strong><span>ADVENTURE · OPS</span></div><button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu"><X /></button></div>
      <div className="workspace-switcher"><div className="workspace-icon">WA</div><div><strong>Wildera Adventure</strong><span>Operations workspace</span></div><ChevronDown /></div>
      <nav>{navGroups.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(([label, Icon]) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => { setActive(label); setSidebarOpen(false) }}><Icon /><span>{label}</span>{label === 'Private Trip Inquiry' && <em>4</em>}</button>)}</div>)}</nav>
      <div className="sidebar-footer"><div className="help-row"><CircleHelp /> Pusat bantuan</div><div className="profile"><div className="avatar">AR</div><div><strong>Ardi Rahman</strong><span>SUPER_ADMIN</span></div><MoreHorizontal /></div></div>
    </aside>
    {sidebarOpen && <button className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Tutup sidebar" />}
    <main className="admin-main">
      <header className="topbar"><button className="menu-trigger" onClick={() => setSidebarOpen(true)} aria-label="Buka menu"><Menu /></button><div className="breadcrumbs"><span>Wildera Adventure</span><ChevronRight /><strong>{active}</strong></div><div className="top-actions"><button className="search-trigger"><Search /> <span>Cari apa saja...</span><kbd>⌘ K</kbd></button><button className="notification" aria-label="Notifikasi"><Bell /><i>3</i></button><div className="top-avatar">AR</div></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow">SELAMAT PAGI, ARDI <span className="online-dot" /></div><h1>{active === 'Ringkasan' ? 'Ringkasan operasional' : active}</h1><p>{active === 'Ringkasan' ? 'Pantau aktivitas dan kapasitas trip Wildera hari ini.' : `Kelola data ${active.toLowerCase()} Wildera Adventure.`}</p></div><div className="heading-actions"><button className="date-button"><CalendarDays /> 18 September 2025 <ChevronDown /></button>{active === 'Booking & Peserta' && <Button onClick={() => setShowBooking(true)}><Plus data-icon="inline-start" /> Input Booking Manual</Button>}</div></div>
        {active === 'Ringkasan' ? <DashboardView /> : active === 'Jadwal & Kuota' ? <ScheduleView /> : active === 'Booking & Peserta' ? <BookingView onAdd={() => setShowBooking(true)} onSelect={setSelectedBooking} /> : <EmptyView label={active} />}
      </div>
    </main>
    {showBooking && <BookingModal onClose={() => setShowBooking(false)} />}
    {selectedBooking && <ParticipantDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
  </div>
}

function DashboardView() { return <><div className="metrics-grid"><MetricCard label="TRIP AKTIF" value="12" note="↑ 2 dari bulan lalu" /><MetricCard label="JADWAL BULAN INI" value="18" note="6 jadwal minggu ini" /><MetricCard label="MENUNGGU KONFIRMASI" value="7" note="Perlu ditindaklanjuti" tone="warning" /><MetricCard label="SISA KUOTA KRITIS" value="3" note="Jadwal dengan ≤3 seat" tone="danger" /><MetricCard label="LEAD PRIVATE TRIP" value="4" note="Inquiry baru hari ini" tone="purple" /></div><div className="dashboard-grid"><section className="panel schedule-panel"><PanelHeader title="Jadwal terdekat & okupansi" action="Lihat semua" /><div className="schedule-list">{schedules.map(item => <div className="schedule-row" key={item.date}><div className="date-block"><strong>{item.date.split(' ')[0]}</strong><span>{item.date.split(' ').slice(1).join(' ')}</span></div><div className="schedule-info"><strong>{item.trip}</strong><span>{item.packages}</span><div className="progress-line"><div style={{ width: `${item.filled / item.total * 100}%` }} /><small>{item.filled}/{item.total} terisi</small></div></div><StatusBadge tone={item.filled / item.total > .89 ? 'orange' : 'green'}>{item.filled / item.total > .89 ? 'HAMPIR PENUH' : item.status}</StatusBadge><ChevronRight className="row-arrow" /></div>)}</div></section><section className="panel activity-panel"><PanelHeader title="Aktivitas terakhir" action="Lihat log" /><div className="activity-list"><Activity icon="wa" title="Booking baru masuk" detail="Rizky Pratama · 2 peserta" time="9 menit lalu" /><Activity icon="check" title="Pembayaran DP diterima" detail="WA-250918-039 · Rp 750.000" time="36 menit lalu" /><Activity icon="edit" title="Jadwal diperbarui" detail="Prau 19–20 Sep · kuota menjadi 20" time="1 jam lalu" /><Activity icon="user" title="Data peserta dilengkapi" detail="Andi Setiawan · Simaksi" time="2 jam lalu" /></div></section></div><section className="panel insight-panel"><div className="insight-icon"><TrendingUp /></div><div><strong>Okupansi bulan ini naik 18%</strong><p>Jadwal weekend memiliki performa terbaik. Pertimbangkan menambah 1 jadwal Prau di akhir bulan.</p></div><button className="text-button">Lihat analitik <ChevronRight /></button></section></> }

function PanelHeader({ title, action }: { title: string; action: string }) { return <div className="panel-header"><div><h2>{title}</h2><span>Update terakhir 5 menit lalu</span></div><button className="text-button">{action} <ChevronRight /></button></div> }
function Activity({ icon, title, detail, time }: { icon: string; title: string; detail: string; time: string }) { return <div className="activity-row"><div className={`activity-icon ${icon}`}>{icon === 'wa' ? 'WA' : icon === 'check' ? '✓' : icon === 'edit' ? '✎' : '●'}</div><div><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div> }

function ScheduleView() { return <div className="panel table-panel"><div className="filter-bar"><div className="filter-search"><Search /><input placeholder="Cari jadwal atau trip..." /></div><select defaultValue="all"><option value="all">Semua gunung</option><option>Prau</option><option>Papandayan</option></select><select defaultValue="all"><option value="all">Semua status</option><option>OPEN</option><option>FULL</option><option>CLOSED</option></select><button className="outline-button"><CalendarDays /> Pilih tanggal</button><Button><Plus data-icon="inline-start" /> Tambah jadwal</Button></div><DataTable type="schedule" /></div> }
function BookingView({ onAdd, onSelect }: { onAdd: () => void; onSelect: (b: typeof bookings[number]) => void }) { return <div className="panel table-panel"><div className="filter-bar"><div className="filter-search"><Search /><input placeholder="Cari kode, nama, atau WhatsApp..." /></div><select defaultValue="all"><option value="all">Semua pembayaran</option><option>PENDING</option><option>DP_PAID</option><option>FULL_PAID</option></select><button className="outline-button"><CalendarDays /> Rentang tanggal</button><Button onClick={onAdd}><Plus data-icon="inline-start" /> Input booking manual</Button></div><DataTable type="booking" onSelect={onSelect} /></div> }
function DataTable({ type, onSelect }: { type: 'schedule' | 'booking'; onSelect?: (b: typeof bookings[number]) => void }) { return <div className="data-table-wrap"><table><thead><tr>{type === 'schedule' ? <><th>TANGGAL TRIP</th><th>NAMA TRIP</th><th>KUOTA</th><th>SISA SEAT</th><th>PAKET TERHUBUNG</th><th>STATUS</th><th /></> : <><th>BOOKING CODE</th><th>TANGGAL PESAN</th><th>PEMESAN</th><th>TRIP / JADWAL</th><th>SEAT</th><th>PEMBAYARAN</th><th>STATUS</th><th /></>}</tr></thead><tbody>{type === 'schedule' ? schedules.map(s => <tr key={s.date}><td><strong>{s.date}</strong></td><td>{s.trip}</td><td className="number">{s.total}</td><td className={`number ${s.total - s.filled <= 3 ? 'critical' : ''}`}>{s.total - s.filled}</td><td><span className="package-pill">{s.packages}</span></td><td><StatusBadge tone={s.status === 'FULL' ? 'orange' : 'green'}>{s.status}</StatusBadge></td><td><button className="icon-button"><MoreHorizontal /></button></td></tr>) : bookings.map(b => <tr key={b.code} onClick={() => onSelect?.(b)} className="clickable"><td><strong className="code">{b.code}</strong></td><td>{b.date}</td><td><strong>{b.customer}</strong><span className="sub-cell">+62 812 3456 7890</span></td><td>{b.trip}</td><td className="number">{b.seats}</td><td><StatusBadge tone={b.payment === 'PENDING' ? 'orange' : b.payment === 'FULL_PAID' ? 'green' : 'blue'}>{b.payment}</StatusBadge></td><td><StatusBadge tone={b.status === 'CANCELLED' ? 'gray' : 'green'}>{b.status}</StatusBadge></td><td><button className="icon-button"><MoreHorizontal /></button></td></tr>)}</tbody></table><div className="table-footer"><span>Menampilkan {type === 'schedule' ? '4' : '4'} dari 24 data</span><div><button className="icon-button"><ChevronLeft /></button><span>1 / 6</span><button className="icon-button"><ChevronRight /></button></div></div></div> }

function EmptyView({ label }: { label: string }) { return <div className="empty-view panel"><Mountain /><h2>{label}</h2><p>Modul ini siap digunakan untuk operasional Wildera Adventure.</p><Button><Plus data-icon="inline-start" /> Tambah data</Button></div> }
function BookingModal({ onClose }: { onClose: () => void }) { return <div className="modal-backdrop"><div className="modal"><div className="modal-header"><div><div className="eyebrow">BOOKING MANUAL</div><h2>Input booking baru</h2><p>Catat booking yang masuk melalui WhatsApp.</p></div><button className="icon-button" onClick={onClose}><X /></button></div><div className="modal-body"><div className="form-grid"><label>Trip & jadwal<select><option>Gunung Prau — 19–20 Sep 2025 (sisa 2 seat)</option></select></label><label>Paket & meeting point<select><option>Start Jakarta — Rp 1.250.000 / pax</option></select></label><label>Nama pemesan<input placeholder="Nama lengkap" /></label><label>Nomor WhatsApp<input placeholder="08xxxxxxxxxx" /></label><label>Email (opsional)<input placeholder="email@contoh.com" /></label><label>Jumlah peserta<input type="number" defaultValue="1" min="1" /></label><label>Nominal tagihan<input placeholder="Rp 1.250.000" /></label><label>Skema pembayaran<select><option>DP (50%)</option><option>Lunas</option></select></label></div><div className="validation-note"><span>i</span> Sisa kuota jadwal ini 2 seat. Booking akan otomatis mengurangi kuota setelah disimpan.</div></div><div className="modal-footer"><button className="outline-button" onClick={onClose}>Batal</button><Button onClick={onClose}>Simpan booking</Button></div></div></div> }
function ParticipantDrawer({ booking, onClose }: { booking: typeof bookings[number]; onClose: () => void }) { return <div className="drawer-backdrop"><aside className="drawer"><div className="drawer-header"><div><div className="eyebrow">{booking.code}</div><h2>Detail peserta</h2><p>{booking.customer} · {booking.trip}</p></div><button className="icon-button" onClick={onClose}><X /></button></div><div className="drawer-body"><div className="drawer-summary"><div><span>Total peserta</span><strong>{booking.seats} orang</strong></div><StatusBadge>{booking.status}</StatusBadge></div>{Array.from({ length: booking.seats }, (_, i) => <div className="participant-card" key={i}><div className="participant-heading"><strong>{i === 0 ? booking.customer : `Peserta ${i + 1}`}</strong><span>Peserta {i + 1}</span></div><label>Nama lengkap<input defaultValue={i === 0 ? booking.customer : ''} placeholder="Belum diisi" /></label><div className="mini-form"><label>NIK<input placeholder="16 digit NIK" /></label><label>Gol. darah<select><option>-</option><option>A</option><option>B</option><option>O</option></select></label></div><label>Kontak darurat<input placeholder="Nama & nomor kontak darurat" /></label><label>Catatan medis<textarea placeholder="Alergi, kondisi khusus, atau catatan lain" /></label></div>)}</div><div className="drawer-footer"><button className="outline-button"><FileText /> Export Manifest CSV</button><Button><FileText /> Export Manifest PDF</Button></div></aside></div> }

