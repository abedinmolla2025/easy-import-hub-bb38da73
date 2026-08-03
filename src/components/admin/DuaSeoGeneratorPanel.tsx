import { ContentSeoGeneratorPanel } from "@/components/admin/content/shared/ContentSeoGeneratorPanel";

/** Thin wrapper kept for backward compatibility — logic lives in the shared panel. */
export default function DuaSeoGeneratorPanel() {
  return (
    <ContentSeoGeneratorPanel
      contentType="dua"
      totalLabel="মোট দোয়া"
      description={
        <>
          প্রতিটি দোয়ার জন্য AI দিয়ে <code>explanation</code> (১০০–১৫০ শব্দ) ও <code>benefits</code> (৩–৫ পয়েন্ট)
          চারটি ভাষায় তৈরি করো — বাংলা, English, हिंदी, اردو। বিদ্যমান কন্টেন্ট overwrite হবে না; শুধু missing
          language fields পূরণ হবে।
        </>
      }
    />
  );
}
