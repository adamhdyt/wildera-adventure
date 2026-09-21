import { redirect } from 'next/navigation';

export default async function DestinasiPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  if (slug) {
    redirect(`/gunung/${slug}`);
  }
  redirect('/gunung');
}
