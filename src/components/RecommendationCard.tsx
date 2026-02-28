import React from 'react';
import { Recommendation } from '../lib/parser';
import { AlertTriangle, CheckCircle, Clock, AlertOctagon } from 'lucide-react';
import { cn } from '../lib/utils';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'border-l-red-500 bg-red-50/50';
      case 'MEDIUM': return 'border-l-yellow-500 bg-yellow-50/50';
      case 'LOW': return 'border-l-emerald-500 bg-emerald-50/50';
      default: return 'border-l-slate-300 bg-slate-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase tracking-wider">High Priority</span>;
      case 'MEDIUM': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 uppercase tracking-wider">Medium Priority</span>;
      case 'LOW': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wider">Low Priority</span>;
      default: return null;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('APPROVED')) return <CheckCircle size={14} className="text-emerald-600" />;
    if (status.includes('BLOCKED')) return <AlertOctagon size={14} className="text-red-600" />;
    if (status.includes('INSUFFICIENT')) return <AlertTriangle size={14} className="text-orange-600" />;
    return <Clock size={14} className="text-slate-500" />;
  };

  return (
    <div className={cn(
      "border border-slate-200 rounded-lg p-4 border-l-4 shadow-sm transition-all hover:shadow-md",
      getPriorityColor(recommendation.priority)
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500 font-medium">{recommendation.id}</span>
          {getPriorityBadge(recommendation.priority)}
        </div>
        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
          {getStatusIcon(recommendation.status)}
          <span className="text-[10px] font-medium text-slate-600 uppercase">{recommendation.status}</span>
        </div>
      </div>
      
      <h3 className="text-sm font-semibold text-slate-900 mb-2 leading-relaxed">
        {recommendation.statement}
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200/60">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Supporting Facts</span>
          <p className="text-xs text-slate-600 font-mono">{recommendation.facts || "N/A"}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Source</span>
          <p className="text-xs text-slate-600 truncate" title={recommendation.sources}>{recommendation.sources || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}
