import { useState, useRef, type ChangeEvent } from 'react';
import { Image, Video, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Avatar from './Avatar';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMedia(url);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    }
  };

  const handlePost = () => {
    if (!content.trim() && !media) return;
    // Handle post creation logic here
    console.log('Posting:', { content, media, mediaType });
    setContent('');
    setMedia(null);
    setMediaType(null);
  };

  return (
    <div className="glass-card p-6 mb-8 border-cyan-glow/20 shadow-[0_0_20px_rgba(0,186,158,0.05)]">
      <div className="flex gap-4">
        <Avatar src="https://picsum.photos/seed/nilesh/200" alt="Nilesh" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in the network?"
            className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none placeholder:text-text-light/30 min-h-[100px]"
          />

          <AnimatePresence>
            {media && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative mb-4 rounded-xl overflow-hidden border border-glass-border"
              >
                <button
                  onClick={() => setMedia(null)}
                  className="absolute top-2 right-2 p-1 bg-background/80 hover:bg-background rounded-full transition-colors z-10"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
                {mediaType === 'video' ? (
                  <video src={media} className="w-full aspect-video object-cover" controls />
                ) : (
                  <img src={media} alt="Upload preview" className="w-full object-cover max-h-[400px]" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-4 border-t border-glass-border">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-teal-accent/20 rounded-lg transition-colors group"
                title="Add Image"
              >
                <Image className="w-5 h-5 text-cyan-glow group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-teal-accent/20 rounded-lg transition-colors group"
                title="Add Video"
              >
                <Video className="w-5 h-5 text-cyan-highlight group-hover:scale-110 transition-transform" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleMediaUpload}
                accept="image/*,video/*"
                className="hidden"
              />
            </div>

            <button
              onClick={handlePost}
              disabled={!content.trim() && !media}
              className="btn-primary flex items-center gap-2 py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="text-sm">TRANSMIT</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
