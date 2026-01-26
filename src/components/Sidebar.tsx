import { useVisudev } from '../lib/visudev/store';
import svgPaths from "../imports/svg-mni0z0xtlg";
import { Loader2 } from 'lucide-react';
import logoImage from "figma:asset/3305ba5fc95fb7f7afe99537b027f7238dc7c767.png";

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  onNewProject: () => void;
}

export function Sidebar({ activeScreen, onNavigate, onNewProject }: SidebarProps) {
  const { activeProject, scanStatuses } = useVisudev();

  const renderScanIndicator = (scanType: 'appflow' | 'blueprint' | 'data') => {
    const status = scanStatuses[scanType];
    if (status.status === 'running') {
      return (
        <div className="flex items-center gap-1 ml-auto mr-4">
          <Loader2 className="w-4 h-4 text-[#03ffa3] animate-spin" />
          <span className="text-[#03ffa3] text-xs">{status.progress}%</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-black h-screen relative shrink-0 w-[256px]" data-name="Sidebar">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-full items-start relative w-[256px]">
        {/* Header */}
        <div className="h-[93px] relative shrink-0 w-[256px]">
          <div aria-hidden="true" className="absolute border-[#1e2939] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[93px] items-start pb-px pt-[24px] px-[24px] relative w-[256px]">
            <div className="content-stretch flex gap-[12px] h-[44px] items-center relative shrink-0 w-full">
              <div className="bg-[#03ffa3] relative rounded-[1.67772e+07px] shrink-0 size-[40px]">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[40px]">
                  <img src={logoImage} alt="VisuDEV Logo" className="w-full h-full object-cover rounded-[1.67772e+07px]" />
                </div>
              </div>
              <div className="h-[44px] relative shrink-0 w-[120.516px]">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[44px] items-start relative w-[120.516px]">
                  <div className="content-stretch flex h-[28px] items-start relative shrink-0 w-full">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[28px] left-0 not-italic text-[18px] text-nowrap text-white top-0 tracking-[-0.4395px] whitespace-pre">VisuDEV</p>
                  </div>
                  <div className="h-[16px] relative shrink-0 w-full">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic text-[#99a1af] text-[12px] text-nowrap top-px whitespace-pre">Visualize Code</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[256px]">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[4px] h-full items-start pb-0 pt-[16px] px-[16px] relative w-[256px]">
            {/* Projekte Button */}
            <button
              onClick={() => onNavigate('projects')}
              className={`h-[48px] relative rounded-[8px] shrink-0 w-full ${
                activeScreen === 'projects' ? 'bg-[#03ffa3]' : ''
              }`}
            >
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[12px] h-[48px] items-center pl-[16px] pr-0 py-0 relative w-full">
                  <div className="relative shrink-0 size-[20px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g id="Icon">
                        <path d={svgPaths.p1f5dba00} stroke={activeScreen === 'projects' ? 'black' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p17f7d000} stroke={activeScreen === 'projects' ? 'black' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p42d6b00} stroke={activeScreen === 'projects' ? 'black' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                    </svg>
                  </div>
                  <div className="h-[24px] relative shrink-0">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative">
                      <p className={`font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic text-[16px] text-nowrap tracking-[-0.3125px] whitespace-pre ${
                        activeScreen === 'projects' ? 'text-black' : 'text-[#d1d5dc]'
                      }`}>Projekte</p>
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {/* Active Project Display */}
            {activeProject && (
              <div className="bg-black box-border content-stretch flex gap-[12px] h-[48px] items-center pl-[16px] pr-0 py-0 relative rounded-[8px] shrink-0 w-full">
                <div className="h-[24px] relative shrink-0">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative">
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic text-[#03ffa3] text-[16px] text-nowrap tracking-[-0.3125px] whitespace-pre truncate max-w-[180px]">
                      {activeProject.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* App/Flow */}
            <button
              onClick={() => activeProject && onNavigate('appflow')}
              disabled={!activeProject}
              className={`h-[48px] relative rounded-[8px] shrink-0 w-full ${
                !activeProject ? 'opacity-50 cursor-not-allowed' : ''
              } ${activeScreen === 'appflow' ? 'bg-gray-900' : ''}`}
            >
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[12px] h-[48px] items-center pl-[16px] pr-0 py-0 relative w-full">
                  <div className="relative shrink-0 size-[20px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g id="Icon">
                        <path d={svgPaths.p1f5dba00} stroke={activeScreen === 'appflow' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p17f7d000} stroke={activeScreen === 'appflow' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p42d6b00} stroke={activeScreen === 'appflow' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                    </svg>
                  </div>
                  <div className="h-[24px] relative shrink-0">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative">
                      <p className={`font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic text-[16px] text-nowrap tracking-[-0.3125px] whitespace-pre ${
                        activeScreen === 'appflow' ? 'text-[#03ffa3]' : 'text-[#d1d5dc]'
                      }`}>App/Flow</p>
                    </div>
                  </div>
                  {renderScanIndicator('appflow')}
                </div>
              </div>
            </button>

            {/* Blueprint */}
            <button
              onClick={() => activeProject && onNavigate('blueprint')}
              disabled={!activeProject}
              className={`h-[48px] relative rounded-[8px] shrink-0 w-full ${
                !activeProject ? 'opacity-50 cursor-not-allowed' : ''
              } ${activeScreen === 'blueprint' ? 'bg-gray-900' : ''}`}
            >
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[12px] h-[48px] items-center pl-[16px] pr-0 py-0 relative w-full">
                  <div className="relative shrink-0 size-[20px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g id="Icon">
                        <path d="M5 2.5V12.5" stroke={activeScreen === 'blueprint' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p3a3cf580} stroke={activeScreen === 'blueprint' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p34c9bb80} stroke={activeScreen === 'blueprint' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p13cf9c00} stroke={activeScreen === 'blueprint' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                    </svg>
                  </div>
                  <div className="h-[24px] relative shrink-0">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative">
                      <p className={`font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic text-[16px] text-nowrap tracking-[-0.3125px] whitespace-pre ${
                        activeScreen === 'blueprint' ? 'text-[#03ffa3]' : 'text-[#d1d5dc]'
                      }`}>Blueprint</p>
                    </div>
                  </div>
                  {renderScanIndicator('blueprint')}
                </div>
              </div>
            </button>

            {/* Data */}
            <button
              onClick={() => activeProject && onNavigate('data')}
              disabled={!activeProject}
              className={`h-[48px] relative rounded-[8px] shrink-0 w-full ${
                !activeProject ? 'opacity-50 cursor-not-allowed' : ''
              } ${activeScreen === 'data' ? 'bg-gray-900' : ''}`}
            >
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[12px] h-[48px] items-center pl-[16px] pr-0 py-0 relative w-full">
                  <div className="relative shrink-0 size-[20px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g id="Icon">
                        <path d={svgPaths.p2e7662c0} stroke={activeScreen === 'data' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.pbd81000} stroke={activeScreen === 'data' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p2a44e700} stroke={activeScreen === 'data' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                    </svg>
                  </div>
                  <div className="h-[24px] relative shrink-0">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative">
                      <p className={`font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic text-[16px] text-nowrap tracking-[-0.3125px] whitespace-pre ${
                        activeScreen === 'data' ? 'text-[#03ffa3]' : 'text-[#d1d5dc]'
                      }`}>Data</p>
                    </div>
                  </div>
                  {renderScanIndicator('data')}
                </div>
              </div>
            </button>

            {/* Logs */}
            <button
              onClick={() => activeProject && onNavigate('logs')}
              disabled={!activeProject}
              className={`h-[48px] relative rounded-[8px] shrink-0 w-full ${
                !activeProject ? 'opacity-50 cursor-not-allowed' : ''
              } ${activeScreen === 'logs' ? 'bg-gray-900' : ''}`}
            >
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[12px] h-[48px] items-center pl-[16px] pr-0 py-0 relative w-full">
                  <div className="relative shrink-0 size-[20px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g clipPath="url(#clip0_109_366)">
                        <path d={svgPaths.p363df2c0} stroke={activeScreen === 'logs' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                      <defs>
                        <clipPath id="clip0_109_366">
                          <rect fill="white" height="20" width="20" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <div className="h-[24px] relative shrink-0">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative">
                      <p className={`font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic text-[16px] text-nowrap tracking-[-0.3125px] whitespace-pre ${
                        activeScreen === 'logs' ? 'text-[#03ffa3]' : 'text-[#d1d5dc]'
                      }`}>Logs</p>
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {/* Settings */}
            <button
              onClick={() => onNavigate('settings')}
              className={`h-[48px] relative rounded-[8px] shrink-0 w-full ${
                activeScreen === 'settings' ? 'bg-gray-900' : ''
              }`}
            >
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[12px] h-[48px] items-center pl-[16px] pr-0 py-0 relative w-full">
                  <div className="relative shrink-0 size-[20px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g id="Icon">
                        <path d={svgPaths.p2483b8c0} stroke={activeScreen === 'settings' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p3b27f100} stroke={activeScreen === 'settings' ? '#03ffa3' : '#D1D5DC'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                    </svg>
                  </div>
                  <div className="h-[24px] relative shrink-0">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative">
                      <p className={`font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic text-[16px] text-nowrap tracking-[-0.3125px] whitespace-pre ${
                        activeScreen === 'settings' ? 'text-[#03ffa3]' : 'text-[#d1d5dc]'
                      }`}>Settings</p>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer - Neues Projekt */}
        <div className="h-[81px] relative shrink-0 w-[256px]">
          <div aria-hidden="true" className="absolute border-[#1e2939] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[81px] items-start pb-0 pt-[17px] px-[16px] relative w-[256px]">
            <button
              onClick={onNewProject}
              className="bg-[#03ffa3] h-[48px] relative rounded-[8px] shrink-0 w-full hover:bg-[#02dd8c] transition-colors"
            >
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[12px] h-[48px] items-center pl-[16px] pr-0 py-0 relative w-full">
                  <div className="relative shrink-0 size-[20px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g id="Icon">
                        <path d="M4.16667 10H15.8333" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d="M10 4.16667V15.8333" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                    </svg>
                  </div>
                  <div className="h-[24px] relative shrink-0">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative">
                      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic text-[16px] text-black text-nowrap tracking-[-0.3125px] whitespace-pre">Neues Projekt</p>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}