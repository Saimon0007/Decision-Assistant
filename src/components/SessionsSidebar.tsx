import React from 'react';
import { Clock, Trash2, ArrowRight } from 'lucide-react';

interface Session {
  id: number;
  title: string;
  created_at: string;
}

interface SessionsSidebarProps {
  sessions: Session[];
  onSelectSession: (id: number) => void;
  onDeleteSession: (id: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionsSidebar({ sessions, onSelectSession, onDeleteSession, isOpen, onClose }: SessionsSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h3 className="font-semibold text-slate-800">Saved Sessions</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved sessions yet.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.id}
              className="group bg-white border border-slate-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer relative"
              onClick={() => onSelectSession(session.id)}
            >
              <h4 className="text-sm font-medium text-slate-800 mb-1 pr-6 truncate">{session.title}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={10} />
                {new Date(session.created_at).toLocaleDateString()}
              </p>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
