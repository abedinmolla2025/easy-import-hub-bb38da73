import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SparklesBadge } from "@/components/BadgeIcons";
import { useDomToPng } from "@/hooks/useDomToPng";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import noorLogo from "@/assets/noor-logo.png";

interface Props {
  open: boolean;
  totalXP: number;
  correctAnswers: number;
  accuracy: number;
  onClose: () => void;
}

const generateCertId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "NQ-";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

export const QuranExpertCertificate = ({ open, totalXP, correctAnswers, accuracy, onClose }: Props) => {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [certId] = useState(generateCertId);
  const certRef = useRef<HTMLDivElement>(null);
  const { isRendering, download, render } = useDomToPng(certRef as React.RefObject<HTMLElement>, {
    fileName: `quran-expert-certificate-${certId}.png`,
    pixelRatio: 3,
  });

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!open) return null;

  const handleShare = async (platform: "whatsapp" | "facebook" | "copy") => {
    try {
      const result = await render();
      if (platform === "whatsapp") {
        // Can't directly share image to WhatsApp web, share text with download
        const text = encodeURIComponent(
          `🏆 I earned the Quran Expert badge on Noor App! ${totalXP} XP with ${accuracy}% accuracy. #QuranExpert #NoorApp`
        );
        window.open(`https://wa.me/?text=${text}`, "_blank");
      } else if (platform === "facebook") {
        const text = encodeURIComponent(
          `🏆 I earned the Quran Expert badge on Noor App! ${totalXP} XP with ${accuracy}% accuracy.`
        );
        window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}`, "_blank");
      } else if (platform === "copy") {
        await navigator.clipboard.writeText(
          `🏆 I'm a Quran Expert on Noor App! Earned ${totalXP} XP with ${accuracy}% accuracy. Certificate ID: ${certId}`
        );
        alert("Link copied to clipboard!");
      }
    } catch (e) {
      console.error("Share failed:", e);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm p-4 flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">
            {step === "form" ? "Generate Certificate" : "Your Certificate"}
          </h1>
        </div>

        <div className="flex-1 p-4 max-w-lg mx-auto w-full">
          {step === "form" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center py-4">
                <SparklesBadge className="w-16 h-16 mx-auto mb-3" />
                <h2 className="text-xl font-bold">🎓 Quran Expert Certificate</h2>
                <p className="text-sm text-muted-foreground mt-1">Fill in your details below</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address (optional)</Label>
                  <Input
                    id="address"
                    placeholder="City, Country"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input value={currentDate} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Certificate ID</Label>
                  <Input value={certId} disabled />
                </div>
              </div>

              <Button
                onClick={() => setStep("preview")}
                disabled={!fullName.trim()}
                className="w-full h-12 rounded-xl text-base font-bold"
                style={{
                  background: "linear-gradient(135deg, hsl(45 90% 55%), hsl(35 85% 45%))",
                  color: "hsl(35 60% 10%)",
                }}
              >
                Preview Certificate
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Certificate preview */}
              <div
                ref={certRef}
                className="relative overflow-hidden rounded-2xl mx-auto"
                style={{
                  width: "100%",
                  maxWidth: 480,
                  aspectRatio: "3/4",
                  background: "linear-gradient(160deg, hsl(40 30% 97%), hsl(45 40% 92%), hsl(40 30% 95%))",
                  border: "3px solid hsl(45 80% 55%)",
                }}
              >
                {/* Islamic geometric border pattern */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    opacity: 0.08,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23B8860B' stroke-width='0.8'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z' fill='none' stroke='%23B8860B' stroke-width='0.5'/%3E%3Cpath d='M40 20L60 40L40 60L20 40Z' fill='none' stroke='%23B8860B' stroke-width='0.3'/%3E%3C/svg%3E")`,
                    backgroundSize: "80px 80px",
                  }}
                />

                {/* Gold border inner */}
                <div
                  className="absolute inset-3 rounded-xl pointer-events-none"
                  style={{ border: "1.5px solid hsl(45 70% 60% / 0.4)" }}
                />
                <div
                  className="absolute inset-5 rounded-lg pointer-events-none"
                  style={{ border: "0.5px solid hsl(45 70% 60% / 0.2)" }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-between h-full p-6 sm:p-8 text-center">
                  {/* Top: logo + badge */}
                  <div className="flex flex-col items-center gap-2">
                    <img src={noorLogo} alt="Noor" className="w-10 h-10 rounded-lg" />
                    <SparklesBadge className="w-14 h-14" />
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.25em]"
                      style={{ color: "hsl(45 60% 40%)" }}
                    >
                      Certificate of Achievement
                    </p>
                  </div>

                  {/* Middle: cert text */}
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    <p className="text-xs" style={{ color: "hsl(45 30% 40%)" }}>
                      This certifies that
                    </p>
                    <h2
                      className="text-2xl font-bold"
                      style={{
                        color: "hsl(35 50% 25%)",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {fullName}
                    </h2>
                    {address && (
                      <p className="text-xs" style={{ color: "hsl(45 30% 50%)" }}>
                        {address}
                      </p>
                    )}
                    <p
                      className="text-xs leading-relaxed max-w-[280px] mx-auto"
                      style={{ color: "hsl(45 30% 40%)" }}
                    >
                      has successfully earned {totalXP} XP by answering {correctAnswers}+ questions correctly
                      with at least {accuracy}% accuracy and is awarded the title
                    </p>
                    <h3
                      className="text-xl font-extrabold uppercase tracking-widest"
                      style={{ color: "hsl(45 70% 40%)" }}
                    >
                      QURAN EXPERT
                    </h3>
                  </div>

                  {/* Bottom: date + ID */}
                  <div className="w-full space-y-1">
                    <div className="h-px w-2/3 mx-auto" style={{ background: "hsl(45 60% 60% / 0.4)" }} />
                    <p className="text-[10px]" style={{ color: "hsl(45 30% 50%)" }}>
                      {currentDate}
                    </p>
                    <p className="text-[9px] font-mono" style={{ color: "hsl(45 20% 60%)" }}>
                      ID: {certId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Export options */}
              <div className="space-y-3">
                <Button
                  onClick={download}
                  disabled={isRendering}
                  className="w-full h-12 rounded-xl text-base font-bold gap-2"
                  style={{
                    background: "linear-gradient(135deg, hsl(45 90% 55%), hsl(35 85% 45%))",
                    color: "hsl(35 60% 10%)",
                  }}
                >
                  <Download className="w-5 h-5" />
                  {isRendering ? "Generating..." : "Download as Image"}
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => handleShare("whatsapp")}
                    variant="outline"
                    className="h-10 text-xs gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={() => handleShare("facebook")}
                    variant="outline"
                    className="h-10 text-xs gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    Facebook
                  </Button>
                  <Button
                    onClick={() => handleShare("copy")}
                    variant="outline"
                    className="h-10 text-xs gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    Copy Link
                  </Button>
                </div>
              </div>

              <Button onClick={() => setStep("form")} variant="ghost" className="w-full">
                ← Edit Details
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
