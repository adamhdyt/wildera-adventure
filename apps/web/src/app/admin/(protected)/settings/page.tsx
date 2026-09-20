import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import { SettingsClient } from './settings-client';

export const metadata = {
  title: 'Pengaturan · Admin Wildera Adventure',
};

export default async function SettingsPage() {
  const user = await requireAdmin();

  let settings = {
    business_whatsapp: '6281234567890',
    instagram_url: 'https://instagram.com/wildera.adventure',
    contact_email: 'info@wildera.id',
    almost_full_percentage: 20,
  };

  try {
    const res = await fetchAdminApi('admin/site-settings');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        settings = {
          business_whatsapp:
            json.data.business_whatsapp ?? settings.business_whatsapp,
          instagram_url: json.data.instagram_url ?? settings.instagram_url,
          contact_email: json.data.contact_email ?? settings.contact_email,
          almost_full_percentage:
            Number(json.data.almost_full_percentage) ||
            settings.almost_full_percentage,
        };
      }
    }
  } catch {
    // Fallback to default settings
  }

  const canManage = user.roles.includes('SUPER_ADMIN');

  return (
    <SettingsClient
      initialSettings={settings}
      canManage={canManage}
      userRoles={user.roles}
    />
  );
}
