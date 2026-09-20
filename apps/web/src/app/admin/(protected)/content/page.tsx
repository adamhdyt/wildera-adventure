import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import type { ContentPageItem, FaqItem } from '@wildera/types';
import { ContentClient } from './content-client';

export const metadata = {
  title: 'Konten & FAQ · Admin Wildera Adventure',
};

export default async function ContentPage() {
  const user = await requireAdmin();

  let faqs: FaqItem[] = [];
  let pages: ContentPageItem[] = [];

  try {
    const [faqRes, pagesRes] = await Promise.all([
      fetchAdminApi('admin/faqs'),
      fetchAdminApi('admin/content-pages'),
    ]);

    if (faqRes.ok) {
      const json = await faqRes.json();
      faqs = json.data ?? [];
    }

    if (pagesRes.ok) {
      const json = await pagesRes.json();
      pages = json.data ?? [];
    }
  } catch {
    faqs = [];
    pages = [];
  }

  return (
    <ContentClient
      initialFaqs={faqs}
      initialPages={pages}
      userRoles={user.roles}
    />
  );
}
