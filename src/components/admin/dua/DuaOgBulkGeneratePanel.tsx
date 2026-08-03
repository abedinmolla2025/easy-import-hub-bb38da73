import { ContentOgBulkGeneratePanel } from '@/components/admin/content/og/ContentOgBulkGeneratePanel';

export function DuaOgBulkGeneratePanel({ canEdit = true }: { canEdit?: boolean }) {
  return <ContentOgBulkGeneratePanel canEdit={canEdit} contentType="dua" folder="dua-og" brandLabel="NoorApp · Dua" />;
}

export default DuaOgBulkGeneratePanel;
