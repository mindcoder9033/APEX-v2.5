import React, { useState } from 'react';
import {
  DriverLevelPreset,
  WidgetId,
  PracticeViewLayout,
  PRESET_LEVELS,
  PRESET_LAYOUTS,
  WIDGET_CATALOG
} from '../../types/widgets';
import {
  SlidersHorizontal,
  Plus,
  RotateCcw,
  Layers,
  ChevronDown,
  Sparkles,
  Check,
  Eye,
  Info
} from 'lucide-react';

interface ViewCustomizerControlsProps {
  layout: PracticeViewLayout;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onSelectPreset: (preset: DriverLevelPreset) => void;
  onResetPreset: () => void;
  onAddWidget: (widgetId: WidgetId) => void;
}

export const ViewCustomizerControls: React.FC<ViewCustomizerControlsProps> = ({
  layout,
  isEditMode,
  onToggleEditMode,
  onSelectPreset,
  onResetPreset,
  onAddWidget
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentPresetMeta = PRESET_LEVELS.find(p => p.id === layout.preset) || PRESET_LEVELS[2];
  
  // Find which widgets from the 10-widget catalog are currently inactive/removed
  const activeWidgetIds = new Set(layout.widgets.map(w => w.id));
  const inactiveWidgets = (Object.keys(WIDGET_CATALOG) as WidgetId[]).filter(
    id => !activeWidgetIds.has(id)
  );

  return (
    <div className="space-y-3">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14141E] p-3 border border-[#232332]">
        {/* Preset Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-slate-300 text-xs font-racing font-bold tracking-wider">
            <Layers className="w-4 h-4 text-[#00F0FF]" />
            <span>DRIVER VIEW:</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="chamfer-btn flex items-center space-x-2.5 px-3.5 py-1.5 bg-[#1B1B28] hover:bg-[#252538] text-white border border-[#303045] text-xs font-semibold transition-all cursor-pointer shadow-md"
            >
              <span className="font-racing tracking-wide text-white">{currentPresetMeta.label}</span>
              <span className="chamfer-badge text-[9px] font-mono font-bold px-1.5 py-0.2 bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                {layout.isCustom ? 'CUSTOM' : currentPresetMeta.badge}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-72 bg-[#12121A] border border-[#2D2D40] shadow-2xl z-50 p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-[#232332] mb-1">
                    Select Driver Level Preset
                  </div>
                  {PRESET_LEVELS.map(preset => {
                    const isSelected = layout.preset === preset.id && !layout.isCustom;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          onSelectPreset(preset.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col space-y-1 transition-all border ${
                          isSelected
                            ? 'bg-[#E10600]/20 border-[#E10600]/60 text-white'
                            : 'bg-[#181824] hover:bg-[#202030] text-slate-300 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-racing font-bold tracking-wider">{preset.label}</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-black/40 text-slate-400 border border-slate-700">
                              {preset.badge}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#00FF66]" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-tight">
                          {preset.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {layout.isCustom && (
            <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5">
              <Sparkles className="w-3 h-3" />
              <span>Customized ({layout.widgets.length} active widgets)</span>
            </span>
          )}
        </div>

        {/* Action Buttons: Customize Layout / Reset */}
        <div className="flex items-center space-x-2">
          {layout.isCustom && (
            <button
              onClick={onResetPreset}
              className="chamfer-btn flex items-center space-x-1.5 px-3 py-1.5 text-xs font-racing font-semibold text-slate-300 hover:text-white bg-[#181824] hover:bg-[#222234] border border-[#2E2E42] transition-all cursor-pointer"
              title="Reset layout back to preset default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Preset</span>
            </button>
          )}

          <button
            onClick={onToggleEditMode}
            className={`chamfer-btn flex items-center space-x-1.5 px-4 py-1.5 text-xs font-racing font-bold tracking-wider transition-all cursor-pointer border ${
              isEditMode
                ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.4)] animate-pulse'
                : 'bg-[#1F1F2E] hover:bg-[#29293D] text-slate-200 border-[#333348]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Done Customizing' : 'Customize View'}</span>
          </button>
        </div>
      </div>

      {/* Inactive Widgets Tray (shown when Edit Mode is active) */}
      {isEditMode && (
        <div className="p-4 bg-[#101018] border border-[#00F0FF]/40 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-racing font-bold text-[#00F0FF] uppercase tracking-wider">
              <Plus className="w-4 h-4" />
              <span>Add Inactive Widgets to Cockpit</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Use arrows on cards to reorder, ↔ to toggle width, ✕ to remove</span>
            </div>
          </div>

          {inactiveWidgets.length === 0 ? (
            <div className="text-xs font-mono text-slate-500 py-2 text-center bg-[#151522] border border-[#252535]">
              All 10 telemetry widgets are currently mounted on your cockpit layout.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {inactiveWidgets.map(widgetId => {
                const meta = WIDGET_CATALOG[widgetId];
                return (
                  <div
                    key={widgetId}
                    className="p-2.5 bg-[#171724] border border-[#2A2A3E] hover:border-[#00F0FF]/50 flex items-center justify-between space-x-2 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-racing font-bold text-white truncate">
                        {meta.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans truncate">
                        {meta.description}
                      </div>
                    </div>
                    <button
                      onClick={() => onAddWidget(widgetId)}
                      className="chamfer-btn p-1.5 bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 cursor-pointer transition-all flex items-center justify-center shrink-0"
                      title={`Add ${meta.title}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
