import CreatePost from "../components/CreatePost";
import { motion } from "motion/react";

export default function CreatePostPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-16 px-6"
    >
      <div className="mb-8 px-2">
        <h1 className="text-3xl font-bold text-white tracking-tighter uppercase">
          Neural <span className="text-cyan-glow">Broadcast</span>
        </h1>
        <p className="text-white/40 text-sm font-light mt-1">
          Share your consciousness with the network.
        </p>
      </div>
      <CreatePost />
    </motion.div>
  );
}