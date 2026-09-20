import React from 'react';
import { Map, Cpu, Share2, Flame, Droplets, Wind } from 'lucide-react';

export type ActiveTab = 'map' | 'twin' | 'mesh';

interface TabsNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeAlertCount: number;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  activeTab,
  onTabChange,
  activeAlertCount,
}) => {
  return (
    <div className="bg-[#0b1222] border-b border-slate-800 px-4 flex items-center justify-between">
      <nav className="flex space-x-1 sm:space-x-2" aria-label="Dashboard views">
        {/* TAB 1: LIVE RISK MAP */}
        <button
          id="tab-btn-map"
          onClick={() => onTabChange('map')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-tactical font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 shadow-[inset_0_-2px_8px_rgba(6,182,212,0.2)]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Map className="w-4 h-4 text-cyan-400" />
          <span>TAB 1: LIVE RISK MAP</span>
          {activeAlertCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full">
              {activeAlertCount}
            </span>
          )}
        </button>

        {/* TAB 2: DIGITAL TWIN SIMULATOR */}
        <button
          id="tab-btn-twin"
          onClick={() => onTabChange('twin')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-tactical font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
            activeTab === 'twin'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30 shadow-[inset_0_-2px_8px_rgba(52,211,153,0.2)]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>TAB 2: DIGITAL TWIN SIMULATOR</span>
          <span className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
            AI CORE
          </span>
        </button>

        {/* TAB 3: RF MESH NETWORK VIEW */}
        <button
          id="tab-btn-mesh"
          onClick={() => onTabChange('mesh')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-tactical font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
            activeTab === 'mesh'
              ? 'border-amber-400 text-amber-300 bg-amber-950/30 shadow-[inset_0_-2px_8px_rgba(251,191,36,0.2)]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Share2 className="w-4 h-4 text-amber-400" />
          <span>TAB 3: RF MESH NETWORK</span>
          <span className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/30">
            FIRE PROPAGATION
          </span>
        </button>
      </nav>

      {/* Quick Hazard Legend */}
      <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-blue-400" />
          <span>Flood</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>Fire</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-slate-400" />
          <span>Air Quality</span>
        </span>
        <div className="h-3 w-px bg-slate-700 mx-1"></div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Normal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>Watch</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Warning</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Critical</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500"></span>Offline</span>
        </div>
      </div>
    </div>
  );
};
