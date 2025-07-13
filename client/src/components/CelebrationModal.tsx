import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Trophy, PartyPopper } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  celebrationData: {
    primaryMessage: string;
    secondaryMessage: string;
    creditAmount: number;
  };
}

interface FloatingIconProps {
  Icon: React.ComponentType<any>;
  delay: number;
  x: number;
  y: number;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({ Icon, delay, x, y }) => (
  <motion.div
    className="absolute text-yellow-400"
    initial={{ opacity: 0, scale: 0, x, y }}
    animate={{ 
      opacity: [0, 1, 1, 0], 
      scale: [0, 1.2, 1, 0.8], 
      y: y - 50,
      rotate: [0, 360]
    }}
    transition={{ 
      duration: 2, 
      delay,
      ease: "easeOut"
    }}
  >
    <Icon size={24} />
  </motion.div>
);

const CelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, onRequestClose, celebrationData }) => {
  const [showSecondaryEffects, setShowSecondaryEffects] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // Initial confetti burst
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
      });

      // Delayed side confetti
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 }
        });
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 }
        });
      }, 400);

      // Show secondary effects
      setTimeout(() => setShowSecondaryEffects(true), 600);

      // Auto-close after 8 seconds
      const autoCloseTimer = setTimeout(() => {
        onRequestClose();
      }, 8000);

      return () => {
        clearTimeout(autoCloseTimer);
        setShowSecondaryEffects(false);
      };
    }
  }, [isOpen, onRequestClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onRequestClose}>
          <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-yellow-300 overflow-visible">
            <div className="relative">
              {/* Floating Icons */}
              <FloatingIcon Icon={Star} delay={0.5} x={-30} y={-20} />
              <FloatingIcon Icon={Trophy} delay={0.8} x={30} y={-25} />
              <FloatingIcon Icon={Gift} delay={1.1} x={-40} y={-35} />
              <FloatingIcon Icon={PartyPopper} delay={1.4} x={35} y={-15} />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -50 }}
                transition={{ 
                  type: "spring", 
                  damping: 15, 
                  stiffness: 300,
                  duration: 0.6 
                }}
                className="text-center"
              >
                <DialogHeader className="space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <div className="text-6xl mb-2">🎉</div>
                  </motion.div>
                  
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Congratulations!
                  </DialogTitle>
                </DialogHeader>
                
                <motion.div 
                  className="mt-6 space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <DialogDescription asChild>
                    <div>
                      <motion.p 
                        className="text-lg font-semibold text-gray-800"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                      >
                        {celebrationData.primaryMessage}
                      </motion.p>
                      
                      <motion.p 
                        className="mt-3 text-md text-gray-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                      >
                        {celebrationData.secondaryMessage}
                      </motion.p>
                      
                      <motion.div
                        className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.3, type: "spring", stiffness: 200 }}
                      >
                        <p className="text-sm text-blue-800 font-medium text-center">
                          💡 Share your referral code with more friends to earn even more credits!
                        </p>
                        <p className="text-xs text-blue-600 text-center mt-1">
                          Every friend earns you 5€ per night they stay ✨
                        </p>
                      </motion.div>
                      
                      <motion.div
                        className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300"
                        initial={{ scale: 0, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
                      >
                        <div className="text-3xl font-bold text-center text-green-600">
                          +{celebrationData.creditAmount}€
                        </div>
                        <div className="text-sm text-center text-gray-600 mt-1">
                          Added to your credits!
                        </div>
                      </motion.div>
                    </div>
                  </DialogDescription>
                </motion.div>
                
                {showSecondaryEffects && (
                  <motion.div
                    className="mt-6 flex justify-center space-x-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button 
                      onClick={onRequestClose}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg"
                    >
                      Awesome! 🚀
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default CelebrationModal;
