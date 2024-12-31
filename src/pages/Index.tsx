import { useState, useEffect, useMemo, useRef } from "react";
import { Howl } from "howler";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";
import audiofile from '/piano-keys/all-I-want.mp3'
import videofile from '/piano-keys/cat.mp4'
const Index = () => {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [lastPlayedId, setLastPlayedId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Track if the song is playing
  const timeoutsRef = useRef([]);
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2', 'Q','Z'];
  const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
  
  // Map computer keys to piano keys
  const keyMapping = {
    'a': 'C', 's': 'D', 'd': 'E', 'f': 'F', 
    'g': 'G', 'h': 'A', 'j': 'B', 'k': 'C2', 'l':'Q',
    'w': 'C#', 'e': 'D#', 't': 'F#', 'y': 'G#', 'u': 'A#'
  };

  const timeSegments = {
    'C': { start: 0, duration: 6 },
    'D': { start: 6, duration: 6 },
    'E': { start: 12, duration: 6 },
    'F': { start: 18, duration: 6 },
    'G': { start: 24, duration: 6 },
    'A': { start: 30, duration: 6 },
    'B': { start: 36, duration: 6 },
    'C2': { start: 42, duration: 6 },
    'Q': { start: 48, duration: 6 },
    'C#': { start: 54, duration: 6 },
    'D#': { start: 60, duration: 6 },
    'F#': { start: 66, duration: 6 },
    'G#': { start: 72, duration: 6 },
    'A#': { start: 84, duration: 6 }
  };

  const FADE_DURATION = 600;

  const stopSong = () => {
    // Clear all scheduled timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    
    // Stop all currently playing sounds
    song.stop();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset the video to the start

      }
    setIsPlaying(false);
    toast({
      description: "Song playback stopped",
      duration: 1000,
    });
  };

  const playFullSong = () => {
    if (isPlaying) {
      stopSong();
      return;
    }

    setIsPlaying(true);
    let delay = 0;

    // Clear previous timeouts array
    timeoutsRef.current = [];

    Object.keys(timeSegments).forEach((note, index) => {
      const { duration } = timeSegments[note];

      const timeout = setTimeout(() => {
        song.play(note);
        setActiveKey(note); 
        // Clear the note after duration
        const clearTimeout = setTimeout(() => {
          if (index === Object.keys(timeSegments).length - 1) {
            setIsPlaying(false);
          }
        }, duration * 1000);
        
        timeoutsRef.current.push(clearTimeout);
      }, delay);

      timeoutsRef.current.push(timeout);
      delay += duration * 1000;
    });
    if (videoRef.current) {
      videoRef.current.play();
    }

    toast({
      description: "Playing full song...",
      duration: delay,
    });
  };

  const song = useMemo(() => new Howl({
    src: [audiofile],
    preload: true,
    volume: 1.0,
    sprite: Object.fromEntries(
      Object.entries(timeSegments).map(([key, { start, duration }]) => [
        key,
        [start * 1000, duration * 1000]
      ])
    )
  }), []);

  const handleKeyPress = (note: string) => {
    if (timeSegments[note]) {
      if (lastPlayedId !== null) {
        song.fade(1.0, 0, FADE_DURATION, lastPlayedId);
        setTimeout(() => {
          song.stop(lastPlayedId);
        }, FADE_DURATION);
      }
      const newSoundId = song.play(note);
      setLastPlayedId(newSoundId);
      setActiveKey(note);
      
      if (videoRef.current) {
        videoRef.current.play();
      }

      toast({
        description: `Playing: ${note}`,
        duration: 1000,
      });
    }
  };

  const handleKeyRelease = (note: string) => {
    if (activeKey === note) {
      setActiveKey(null);
      if (lastPlayedId !== null) {
        song.stop(lastPlayedId);
        setLastPlayedId(null);
      }
      if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset the video to the start

      }
    }
  };
  

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.repeat && keyMapping[event.key.toLowerCase()]) {
        handleKeyPress(keyMapping[event.key.toLowerCase()]);
      }
    };
    

    const handleKeyUp = (event: KeyboardEvent) => {
      if (keyMapping[event.key.toLowerCase()]) {
        handleKeyRelease(keyMapping[event.key.toLowerCase()]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKey, lastPlayedId]);
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <header className="w-full p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          </div>
          <div className="flex  items-center gap-2">
            <Sun className="h-9 w-4" />
            <Switch
              checked={isDarkMode}
              onCheckedChange={setIsDarkMode}
              className="data-[state=checked]:bg-slate-700"
            />
            <Moon className="h-4 w-4" />
          </div>
      </header>

      <main className="flex p-4">
         <div className=" relative flex flex-col items-top ${isDarkMode ? 'text-white' : 'text-zinc-800'} justify-start">
            <h1 className="leading-[100%] font-bold text-7xl tracking-tight">
              Bored on a
              <br />
               Christmas Day ?
               <br />
              Play the song and atleast the cat vibe<br />
              He's Waiting ! <br />
            </h1>
            <div className="text-left mt-12 text-lg text-muted-foreground font-medium">
             <p>Use your keyboard or click the piano keys to play - </p>
             <p className="mt-2">White keys: A S D F G H J K</p>
             <p>Black keys: W E T Y U</p>
             <button
    onClick={() => playFullSong()}
    className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors"
  >
{isPlaying ? "Stop Song" : "Play Full Song"}
  </button>
            </div>
          </div>
        <div className="max-w-8xl mx-auto">
          <div className="relative h-80 bg-gray-100 rounded-lg w-[98vh] p-3 mb-8">
            <div className="flex h-full">
              {whiteKeys.map((note, index) => (
                <button
                  key={note}
                  onMouseDown={() => handleKeyPress(note)}
                  onMouseUp={() => handleKeyRelease(note)}
                  onMouseLeave={() => handleKeyRelease(note)}
                  className={`
                    relative flex-1 mr-1 rounded-b-lg transition-colors
                    ${activeKey === note ? 'pressed bg-gray-300 border-glow' : 'bg-white'}
                    hover:bg-gray-100 active:bg-gray-200
                    border border-gray-300
                  `}
                >
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-gray-500">
                    {Object.keys(keyMapping).find(key => keyMapping[key] === note)?.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Black Keys */}
            <div className="absolute top-4 left-0 right-0 flex justify-center">
              <div className="flex">
                {blackKeys.map((note, index) => {
                  const offset = `${(index + (index > 1 ? 1 : 0)) * 14.28 + 8.5}%`;
                  return (
                    <button
                      key={note}
                      onMouseDown={() => handleKeyPress(note)}
                      onMouseUp={() => handleKeyRelease(note)}
                      onMouseLeave={() => handleKeyRelease(note)}
                      className={`
                        absolute h-40 w-10 rounded-b-lg transition-colors
                        ${activeKey === note ? 'pressed bg-gray-700 border-flow' : 'bg-black'}
                        hover:bg-gray-900
                      `}
                      style={{ left: offset }}
                    >
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-white">
                        {Object.keys(keyMapping).find(key => keyMapping[key] === note)?.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-full bg-black/5 rounded-lg mb-5">
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                src={videofile}
                className="w-full h-full rounded-xl object-cover"
                playsInline
                muted
                loop
              >
              </video>
              {!activeKey && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                  <p className="text-white text-xl">Keep playing, the cat needs to vibe!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full p-4 mt-auto">
        <div className="max-w-4xl mx-auto text-center text-muted-foreground">
          <p>© 2024 Christmas Piano. Made with ♪ and ♥</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;