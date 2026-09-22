import { useRef, useState } from 'react';
import { EncoderPanel } from './components/EncoderPanel';
import { TransmissionChannel } from './components/TransmissionChannel';
import { ReceiverPanel } from './components/ReceiverPanel';
import { HowItWorksPanel } from './components/HowItWorksPanel';
import { Modal } from './components/Modal';


function App() {
  const [session, setSession] = useState<{ codeword: string, poly: string } | null>(null);
  const [receivedCodeword, setReceivedCodeword] = useState<string | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const howItWorksRef = useRef<HTMLDivElement | null>(null);

  const handleEncode = (_data: string, poly: string, codeword: string) => {
    setSession({ codeword, poly });
    setReceivedCodeword(null);
  };

  const handleTransmit = (codeword: string) => {
    setReceivedCodeword(codeword);
  };

  const handleHowItWorksClick = () => {
    setIsVideoModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3">
              <img src="/website icon.png" alt="CRC Simulator logo" width={36} height={36} className="object-contain rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-text-primary tracking-tight">CRC Simulator</h1>
                <p className="text-xs text-text-secondary font-medium hidden sm:block">Visualizing Cyclic Redundancy Check error detection</p>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleHowItWorksClick}
                className="flex items-center justify-center gap-2 bg-accent text-white px-3 sm:px-4 py-2 rounded-md hover:bg-accent/90 transition-colors font-medium text-sm h-9 whitespace-nowrap shrink-0"
                title="How It Works"
              >
                How It Works
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
        
        <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-6 xl:gap-8 mb-8">
          
          {/* SENDER PANEL */}
          <div className="flex-1 w-full min-w-0">
            <EncoderPanel key={`encoder-${resetKey}`} onEncode={handleEncode} />
          </div>

          {/* TRANSMISSION CHANNEL */}
          <div className="flex-1 w-full min-w-0">
            <TransmissionChannel 
              codeword={session?.codeword || null} 
              onTransmit={handleTransmit} 
            />
          </div>

          {/* RECEIVER PANEL */}
          <div className="flex-1 w-full min-w-0">
            <ReceiverPanel 
              codeword={receivedCodeword} 
              poly={session?.poly || ''} 
              onReset={() => {
                setSession(null);
                setReceivedCodeword(null);
                setResetKey(prev => prev + 1);
              }}
            />
          </div>
          
        </div>

        <div ref={howItWorksRef}>
          <HowItWorksPanel isOpen={isHowItWorksOpen} onToggle={() => setIsHowItWorksOpen((value) => !value)} />
        </div>

        <div className="w-full max-w-4xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-border border-l-[3px] border-l-accent rounded-lg p-6 shadow-sm">
            <span className="font-mono text-xs text-text-secondary/40 font-bold tracking-wide">01</span>
            <h3 className="font-semibold text-text-primary mt-2 mb-2">Error Detection</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              CRC is highly effective at detecting single-bit, double-bit, and burst errors in data transmission.
            </p>
          </div>

          <div className="bg-surface border border-border border-l-[3px] border-l-highlight rounded-lg p-6 shadow-sm">
            <span className="font-mono text-xs text-text-secondary/40 font-bold tracking-wide">02</span>
            <h3 className="font-semibold text-text-primary mt-2 mb-2">Binary Polynomials</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              It uses polynomial division in modulo-2 arithmetic, making it incredibly fast for computers to compute.
            </p>
          </div>

          <div className="bg-surface border border-border border-l-[3px] border-l-success rounded-lg p-6 shadow-sm">
            <span className="font-mono text-xs text-text-secondary/40 font-bold tracking-wide">03</span>
            <h3 className="font-semibold text-text-primary mt-2 mb-2">Industry Standard</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              From Ethernet to USB to ZIP files, CRC is a ubiquitous standard across all digital networking.
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-surface border-t border-border py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-2.5">
          <span className="text-sm font-semibold text-text-primary tracking-tight">CRC Simulator</span>
          <p className="text-xs text-text-secondary/60 text-center max-w-md leading-relaxed">
            An interactive tool for visualizing Cyclic Redundancy Check error detection — built for learning, one bit at a time.
          </p>
        </div>
      </footer>

      <Modal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
        title="How CRC Works"
      >
        <div className="flex justify-center bg-black rounded-md overflow-hidden">
          <video 
            src="/how_it_works.mp4" 
            controls 
            autoPlay 
            className="w-full max-h-[70vh] object-contain"
          />
        </div>
      </Modal>
    </div>
  );
}

export default App;
