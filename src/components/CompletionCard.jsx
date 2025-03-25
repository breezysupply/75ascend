import { useRef } from 'react';
import html2canvas from 'html2canvas';

export default function CompletionCard({ day, onClose }) {
  const cardRef = useRef(null);
  
  const handleShare = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current);
        const image = canvas.toDataURL('image/png');
        
        // Check if Web Share API is available
        if (navigator.share) {
          const blob = await (await fetch(image)).blob();
          const file = new File([blob], 'day-completed.png', { type: 'image/png' });
          
          await navigator.share({
            title: `75 ASCEND - Day ${day} Completed!`,
            text: `I just completed Day ${day} of the 75 ASCEND challenge!`,
            files: [file]
          });
        } else {
          // Fallback - open in new tab or download
          const link = document.createElement('a');
          link.href = image;
          link.download = `75-ascend-day-${day}.png`;
          link.click();
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full overflow-hidden">
        <div 
          ref={cardRef} 
          className="bg-gradient-to-br from-primary to-secondary p-6 text-white text-center"
        >
          <h3 className="text-2xl font-bold mb-2">DAY {day} COMPLETE!</h3>
          <p className="text-lg mb-4">75 ASCEND Challenge</p>
          <div className="bg-white/20 rounded-lg p-4 mb-4">
            <p className="font-medium">
              {day === 75 
                ? "CHALLENGE COMPLETED! 🏆" 
                : `${day}/75 days completed`}
            </p>
            <p className="text-sm mt-2">
              {day === 75 
                ? "You've achieved something extraordinary!" 
                : `${75 - day} days remaining`}
            </p>
          </div>
          <p className="text-sm italic">
            "Discipline equals freedom."
          </p>
        </div>
        
        <div className="p-4 flex flex-col gap-3 dark:bg-gray-800">
          <button 
            onClick={handleShare}
            className="bg-primary text-white py-2 rounded-lg font-medium"
          >
            Share Achievement
          </button>
          <button 
            onClick={onClose}
            className="border border-gray-300 dark:border-gray-600 py-2 rounded-lg font-medium dark:text-white"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
} 