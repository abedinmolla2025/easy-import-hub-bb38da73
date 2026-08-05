/**
 * Noor App - Smart Dua Share Handler
 * This script handles sharing with auto-captions and social previews.
 */

const NoorShare = {
    /**
     * @param {Object} dua - The Dua object from your JSON
     * @param {string} baseUrl - Your website base URL (e.g., 'https://noorapp.in')
     */
    share: async function(dua, baseUrl = 'https://noorapp.in') {
        const shareUrl = `${baseUrl}/dua/${dua.slug}`;
        const shareTitle = dua.title_bn;
        
        // Use the custom social text we added to the JSON
        const shareText = dua.social?.facebook || dua.share_text || `${dua.title_bn} — নূর অ্যাপে পড়ুন।`;
        
        const fullMessage = `${shareText}\n\nপড়তে ক্লিক করুন: ${shareUrl}`;

        // 1. Try Web Share API (Best for Mobile: Chrome, Safari, etc.)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: fullMessage,
                    url: shareUrl,
                });
                console.log('Successfully shared');
                return;
            } catch (err) {
                console.log('Web Share failed or cancelled:', err);
                // Fallback if user cancels or it fails
            }
        }

        // 2. Fallback for Desktop or unsupported browsers
        // Detect if it is a mobile device to prefer WhatsApp
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            // Open WhatsApp directly
            window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
        } else {
            // Desktop: Copy to clipboard as a smart workaround for Facebook's restriction
            try {
                await navigator.clipboard.writeText(fullMessage);
                alert("ক্যাপশনটি কপি করা হয়েছে! ফেসবুকে পেস্ট (Paste) করে দিন।");
            } catch (err) {
                console.error("Failed to copy caption:", err);
            }
            // Open Facebook Sharer for Desktop
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        }
    },

    /**
     * Helper to bind to buttons automatically
     * Use data-dua-slug attribute on your buttons
     */
    initButtons: function(duasArray, baseUrl) {
        const buttons = document.querySelectorAll('[data-share-dua]');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const slug = btn.getAttribute('data-share-dua');
                const dua = duasArray.find(d => d.slug === slug);
                if (dua) {
                    this.share(dua, baseUrl);
                }
            });
        });
    }
};

// Example Usage:
// <button data-share-dua="dua-for-guidance">Share Dua</button>
// NoorShare.initButtons(yourDuaDataArray, 'https://noorapp.in');
