import React from "react";

export default function Soundwave() {
  return (
    <div className="flex items-center gap-1 h-6 select-none shrink-0">
      <span 
        className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" 
        style={{ height: "60%", animationDuration: "0.8s", animationDelay: "0.1s" }} 
      />
      <span 
        className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" 
        style={{ height: "100%", animationDuration: "0.7s", animationDelay: "0.2s" }} 
      />
      <span 
        className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" 
        style={{ height: "40%", animationDuration: "0.9s", animationDelay: "0.3s" }} 
      />
      <span 
        className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" 
        style={{ height: "80%", animationDuration: "0.6s", animationDelay: "0.4s" }} 
      />
      <span 
        className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" 
        style={{ height: "50%", animationDuration: "0.8s", animationDelay: "0.5s" }} 
      />
    </div>
  );
}
