import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProcessingSettings } from './types';
import { processSealImage, upscaleAndSharpen, traceToSvg } from './utils/imageProcessor';

const DEFAULT_SETTINGS: ProcessingSettings = {
  redSensitivity: 50,
  lightnessThreshold: 220,
  edgeSoftness: 2,
  chromaThreshold: 15,
  targetColor: '#d90000',
  detectionMode: 'red'
};

const PRESET_COLORS = [
  { name: '클래식 인감', hex: '#d90000' },
  { name: '진한 주홍', hex: '#b91c1c' },
  { name: '전문가 블랙', hex: '#1e293b' },
  { name: '신뢰 네이비', hex: '#1e3a8a' },
  { name: '품격 골드', hex: '#a16207' },
];

type PreviewBg = 'checkerboard' | 'black' | 'white' | 'blue' | 'green';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [settings, setSettings] = useState<ProcessingSettings>(DEFAULT_SETTINGS);
  const [currentScale, setCurrentScale] = useState(1);
  const [previewBg, setPreviewBg] = useState<PreviewBg>('checkerboard');
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | 'about' | null>(null);
  
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const upscaleCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const getPreviewBgClass = () => {
    switch (previewBg) {
      case 'checkerboard':
        return 'bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]';
      case 'white': return 'bg-white';
      case 'black': return 'bg-slate-900';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-emerald-500';
      default: return 'bg-slate-100';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setProcessedImage(null);
        setUpscaledImage(null);
        setCurrentScale(1);
        setTimeout(() => {
            document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const performProcessing = useCallback(() => {
    if (!imgRef.current || !processedCanvasRef.current) return;
    setIsProcessing(true);
    requestAnimationFrame(() => {
      try {
        processSealImage(processedCanvasRef.current!, imgRef.current!, settings);
        setProcessedImage(processedCanvasRef.current!.toDataURL('image/png'));
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    });
  }, [settings]);

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        imgRef.current = img;
        performProcessing();
      };
    }
  }, [image, performProcessing]);

  const handleUpscale = (scale: number) => {
    if (!processedCanvasRef.current || !upscaleCanvasRef.current) return;
    setIsUpscaling(true);
    setCurrentScale(scale);
    setTimeout(() => {
      try {
        upscaleAndSharpen(processedCanvasRef.current!, upscaleCanvasRef.current!, scale);
        setUpscaledImage(upscaleCanvasRef.current!.toDataURL('image/png'));
      } finally {
        setIsUpscaling(false);
      }
    }, 50);
  };

  const handleDownloadPng = () => {
    const target = upscaledImage || processedImage;
    if (!target) return;
    const link = document.createElement('a');
    link.download = `digital_seal_${Date.now()}.png`;
    link.href = target;
    link.click();
  };

  const handleDownloadVector = () => {
    const canvas = upscaleCanvasRef.current || processedCanvasRef.current;
    if (!canvas) return;
    setIsVectorizing(true);
    setTimeout(() => {
      try {
        const svgString = traceToSvg(canvas);
        if (svgString) {
          const blob = new Blob([svgString], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `digital_seal_vector_${Date.now()}.svg`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      } finally {
        setIsVectorizing(false);
      }
    }, 100);
  };

  return (
    <div className="hero-gradient">
      {/* GNB */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl text-slate-900">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white text-lg">
              <i className="fa-solid fa-stamp"></i>
            </div>
            Seal AI
          </div>
          <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
            <a href="#tool" className="hover:text-red-600 transition-colors">누끼 따기</a>
            <a href="#guide" className="hover:text-red-600 transition-colors">이용 가이드</a>
            <a href="#info" className="hover:text-red-600 transition-colors">디지털 인감이란?</a>
          </div>
          <button onClick={() => document.getElementById('tool')?.scrollIntoView()} className="bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-red-600 transition-all shadow-lg shadow-slate-200">
            시작하기
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4">
        {/* 상단 광고 영역 */}
        <div className="ad-container max-w-4xl mx-auto">
          <span className="ad-label">ADVERTISEMENT</span>
          <div className="h-24 flex items-center justify-center text-slate-300 font-bold">광고 영역</div>
        </div>

        <header className="max-w-4xl mx-auto text-center mb-16 px-4">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            전문가 수준의 <br className="md:hidden" /><span className="text-red-600 underline decoration-red-100 underline-offset-8">인감 누끼</span>를 <br className="hidden md:block"/>단 3초 만에
          </h1>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium">
            복잡한 포토샵 없이 인공지능이 도장만 쏙! <br className="md:hidden"/>
            전자계약, 공문서, 디자인 프로젝트를 위한 고품질 투명 인감을 만드세요.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 text-xs font-bold text-slate-600">
              <i className="fa-solid fa-check text-green-500"></i> 무제한 무료
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 text-xs font-bold text-slate-600">
              <i className="fa-solid fa-check text-green-500"></i> 기기 내 로컬 처리
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 text-xs font-bold text-slate-600">
              <i className="fa-solid fa-check text-green-500"></i> SVG 벡터 지원
            </div>
          </div>
        </header>

        {/* 메인 툴 영역 */}
        <div id="tool" className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 이미지 영역 (Sticky) */}
          <div className="lg:col-span-8 space-y-8 order-1 lg:order-1">
            {!image ? (
              <div className="aspect-[16/10] bg-white rounded-[48px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center p-12 transition-all hover:border-red-200 hover:bg-red-50/20 group cursor-pointer relative shadow-inner overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="w-28 h-28 bg-white shadow-xl shadow-slate-200/50 text-red-600 rounded-[32px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-700">
                  <i className="fa-solid fa-cloud-arrow-up text-4xl"></i>
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">인감 이미지 가져오기</h3>
                <p className="text-slate-400 text-center max-w-sm leading-relaxed font-medium">
                  여기를 클릭하거나 파일을 드래그하여 <br/>도장 이미지를 업로드하세요.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md -mx-4 px-4 py-4 lg:static lg:bg-transparent lg:p-0 lg:mx-0 shadow-sm lg:shadow-none border-b border-slate-200/50 lg:border-none rounded-b-[32px] lg:rounded-none transition-all">
                    <div className="bg-white p-2 lg:p-6 rounded-[32px] lg:rounded-[48px] shadow-xl lg:shadow-2xl shadow-slate-200/50 border border-slate-50 relative">
                        <div className="flex justify-between items-center mb-4 px-2">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full animate-ping"></div>
                            <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Preview</p>
                        </div>
                        <div className="flex bg-slate-100 rounded-xl p-1 gap-1 shadow-inner scale-90 lg:scale-100 origin-right">
                            {(['checkerboard', 'white', 'black', 'blue', 'green'] as PreviewBg[]).map((bg) => (
                            <button 
                                key={bg}
                                onClick={() => setPreviewBg(bg)}
                                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-all ${previewBg === bg ? 'bg-white shadow-md scale-110 ring-1 ring-slate-200' : 'hover:scale-105'}`}
                            >
                                {bg === 'checkerboard' ? <i className="fa-solid fa-chess-board text-[10px] lg:text-xs text-slate-400"></i> : 
                                <div className={`w-4 h-4 lg:w-5 lg:h-5 rounded-md ${
                                bg === 'white' ? 'bg-white border border-slate-200' : 
                                bg === 'black' ? 'bg-slate-900' : 
                                bg === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
                                }`}></div>}
                            </button>
                            ))}
                        </div>
                        </div>
                        
                        <div className={`aspect-square lg:aspect-video ${getPreviewBgClass()} rounded-[24px] lg:rounded-[40px] overflow-hidden flex items-center justify-center border border-slate-100 transition-all duration-700 shadow-inner relative group`}>
                        {(isProcessing || isUpscaling || isVectorizing) && (
                            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center">
                            <div className="w-10 h-10 lg:w-14 lg:h-14 border-[4px] lg:border-[5px] border-red-50 border-t-red-600 rounded-full animate-spin mb-4 lg:mb-6"></div>
                            <span className="font-black text-slate-900 tracking-tighter text-sm lg:text-lg">처리 중...</span>
                            </div>
                        )}
                        
                        {upscaledImage ? (
                            <img src={upscaledImage} alt="Upscaled Result" className="max-h-[85%] max-w-[85%] object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                        ) : processedImage && (
                            <img src={processedImage} alt="Processed Result" className="max-h-[85%] max-w-[85%] object-contain drop-shadow-xl transition-transform duration-700 group-hover:scale-105" />
                        )}
                        
                        <canvas ref={processedCanvasRef} className="hidden" />
                        <canvas ref={upscaleCanvasRef} className="hidden" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-2 lg:px-0">
                  <button onClick={() => setImage(null)} className="px-4 py-4 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-[20px] font-bold text-sm transition-all flex items-center justify-center gap-2 border border-slate-100 shadow-sm"><i className="fa-solid fa-arrow-left"></i> 처음으로</button>
                  <button onClick={() => handleUpscale(2)} disabled={!processedImage || isUpscaling} className="py-4 bg-sky-50 text-sky-700 rounded-[20px] font-bold text-sm hover:bg-sky-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"><i className="fa-solid fa-expand"></i> 화질 개선</button>
                  <button onClick={handleDownloadPng} disabled={!processedImage} className="py-4 bg-red-600 hover:bg-red-700 text-white rounded-[20px] font-bold text-sm transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"><i className="fa-solid fa-file-export"></i> PNG</button>
                  <button onClick={handleDownloadVector} disabled={!processedImage || isVectorizing} className="py-4 bg-slate-900 hover:bg-black text-white rounded-[20px] font-bold text-sm transition-all shadow-xl shadow-slate-300 flex items-center justify-center gap-2 disabled:opacity-50"><i className="fa-solid fa-bezier-curve"></i> SVG</button>
                </div>
              </div>
            )}
          </div>

          {/* 설정 영역 */}
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-2">
            <section className="bg-white p-6 lg:p-8 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-50">
              <h2 className="text-lg lg:text-xl font-bold mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-red-600 rounded-full"></span>
                추출 옵션 설정
              </h2>
              
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                <button 
                  onClick={() => setSettings({...settings, detectionMode: 'red', targetColor: '#d90000'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${settings.detectionMode === 'red' ? 'bg-white text-red-600 shadow-md' : 'text-slate-400'}`}
                >
                  빨간 인감
                </button>
                <button 
                  onClick={() => setSettings({...settings, detectionMode: 'black', targetColor: '#1e293b'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${settings.detectionMode === 'black' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}
                >
                  검정 도장
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-3 items-center">
                    <label className="text-sm font-bold text-slate-700">추출 민감도</label>
                    <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg">{settings.redSensitivity}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={settings.redSensitivity} 
                    onChange={(e) => setSettings({...settings, redSensitivity: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-3 italic">* 인감이 번졌다면 민감도를 높여보세요.</p>
                </div>

                <div>
                  <div className="flex justify-between mb-3 items-center">
                    <label className="text-sm font-bold text-slate-700">배경 제거 세기</label>
                    <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{settings.lightnessThreshold}</span>
                  </div>
                  <input 
                    type="range" min="100" max="255" 
                    value={settings.lightnessThreshold} 
                    onChange={(e) => setSettings({...settings, lightnessThreshold: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-6 lg:p-8 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-50">
              <h2 className="text-lg lg:text-xl font-bold mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                전문적인 리컬러
              </h2>
              <div className="flex flex-wrap gap-4 mb-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color.hex}
                    onClick={() => setSettings({...settings, targetColor: color.hex})}
                    className={`group relative w-10 h-10 rounded-full border-2 transition-all ${settings.targetColor === color.hex ? 'border-red-500 scale-125 ring-4 ring-red-50' : 'border-transparent shadow-sm'}`}
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {color.name}
                    </span>
                  </button>
                ))}
                <div className="relative w-10 h-10">
                  <input 
                    type="color" 
                    value={settings.targetColor}
                    onChange={(e) => setSettings({...settings, targetColor: e.target.value})}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-full h-full rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <i className="fa-solid fa-plus text-xs"></i>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 🚨 AdSense 승인용 핵심 콘텐츠 섹션 (여기가 승인 치트키입니다) */}
        <div id="info" className="max-w-4xl mx-auto mt-32 space-y-24">
            
            {/* 1. 사용 가이드 */}
            <section id="guide" className="space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">누구나 쉽게 만드는 디지털 인감</h2>
                    <p className="text-slate-500">복잡한 디자인 툴 없이 3단계로 끝내는 온라인 도장 만들기</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-xl font-black mb-6">1</div>
                        <h3 className="font-bold text-lg mb-3">촬영하기</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">흰 종이에 도장을 찍고 스마트폰으로 촬영하세요. 그림자가 지지 않게 밝은 곳에서 찍으면 더 좋습니다.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-xl font-black mb-6">2</div>
                        <h3 className="font-bold text-lg mb-3">업로드 및 조정</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">사진을 업로드하면 AI가 자동으로 배경을 제거합니다. 민감도 슬라이더를 움직여 흐린 부분까지 잡아내세요.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-xl font-black mb-6">3</div>
                        <h3 className="font-bold text-lg mb-3">저장 및 사용</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">투명 배경이 적용된 PNG 파일을 다운로드하세요. 한글, 워드, PDF 계약서에 바로 서명으로 넣을 수 있습니다.</p>
                    </div>
                </div>
            </section>

            {/* 2. SEO 정보성 글 (구글이 좋아하는 긴 글) */}
            <article className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm space-y-10">
                <div className="space-y-4 border-b border-slate-100 pb-8">
                    <h2 className="text-2xl font-bold text-slate-900">디지털 인감이란 무엇인가요?</h2>
                    <p className="text-slate-600 leading-loose">
                        디지털 인감(Digital Seal)은 실제 인감 도장을 스캔하거나 그래픽 소프트웨어로 제작하여 전자 문서에 사용할 수 있도록 만든 이미지 파일입니다. 
                        재택근무와 비대면 계약이 활성화되면서, 기존의 종이 계약 방식 대신 PDF나 전자 계약 플랫폼을 통한 서명이 표준이 되었습니다. 
                        이때 배경이 투명하게 처리된 도장 이미지(PNG)가 필수적이며, 이를 통해 문서의 전문성과 신뢰도를 높일 수 있습니다.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800">배경 제거(누끼)가 중요한 이유</h3>
                        <p className="text-slate-500 text-sm leading-loose">
                            일반적인 사진(JPG)으로 도장을 찍어 문서에 올리면 흰색 배경이 글자를 가려 조잡해 보입니다. 
                            본 서비스는 <strong>알파 채널(Alpha Channel)</strong> 기술을 활용하여 붉은 인주 색상만 남기고 나머지를 완벽하게 투명화합니다. 
                            이를 통해 마치 종이에 직접 찍은 듯한 자연스러운 연출이 가능합니다.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800">법적 효력에 대하여</h3>
                        <p className="text-slate-500 text-sm leading-loose">
                            전자서명법에 따르면 전자 문서에 포함된 도장 이미지도 당사자의 서명 의도가 명확하다면 법적 효력을 가질 수 있습니다. 
                            다만, 인감증명서가 필수적인 부동산 거래나 법인 설립 등의 중요 계약에서는 반드시 실물 인감 날인과 증명서 제출이 필요하므로 주의해야 합니다.
                        </p>
                    </div>
                </div>
            </article>

            {/* 3. FAQ */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-center">자주 묻는 질문</h2>
                <div className="space-y-4">
                    <details className="bg-white rounded-2xl border border-slate-100 p-6 cursor-pointer group">
                        <summary className="font-bold flex justify-between items-center list-none">
                            <span>Q. 무료로 사용할 수 있나요?</span>
                            <span className="text-slate-300 group-open:rotate-180 transition-transform"><i className="fa-solid fa-chevron-down"></i></span>
                        </summary>
                        <p className="mt-4 text-slate-500 text-sm leading-loose">네, Seal AI의 모든 기능은 회원가입 없이 100% 무료로 제공됩니다. 횟수 제한 없이 마음껏 도장을 만드세요.</p>
                    </details>
                    <details className="bg-white rounded-2xl border border-slate-100 p-6 cursor-pointer group">
                        <summary className="font-bold flex justify-between items-center list-none">
                            <span>Q. 내 도장 사진이 서버에 저장되나요?</span>
                            <span className="text-slate-300 group-open:rotate-180 transition-transform"><i className="fa-solid fa-chevron-down"></i></span>
                        </summary>
                        <p className="mt-4 text-slate-500 text-sm leading-loose">아니요, 절대 저장되지 않습니다. 본 서비스는 '클라이언트 사이드' 기술을 사용하여 사용자의 브라우저(크롬, 사파리 등) 안에서만 이미지를 처리합니다. 보안 걱정 없이 안전하게 이용하세요.</p>
                    </details>
                    <details className="bg-white rounded-2xl border border-slate-100 p-6 cursor-pointer group">
                        <summary className="font-bold flex justify-between items-center list-none">
                            <span>Q. SVG 파일은 어디에 쓰나요?</span>
                            <span className="text-slate-300 group-open:rotate-180 transition-transform"><i className="fa-solid fa-chevron-down"></i></span>
                        </summary>
                        <p className="mt-4 text-slate-500 text-sm leading-loose">SVG는 크기를 아무리 키워도 깨지지 않는 벡터 파일입니다. 명함 인쇄, 대형 현수막 디자인, 혹은 웹사이트 로고로 사용할 때 적합합니다.</p>
                    </details>
                </div>
            </section>
        </div>
      </div>

      <footer className="mt-40 py-24 bg-slate-900 text-white relative">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-8">
            <div className="flex items-center justify-center gap-2 font-black text-2xl">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white">
                <i className="fa-solid fa-stamp"></i>
              </div>
              Seal AI
            </div>
          <p className="text-slate-500 text-xs font-medium">© 2025 SealNukki AI Labs. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-xs text-slate-400">
             <button onClick={() => setShowLegal('privacy')} className="hover:text-white">개인정보처리방침</button>
             <button onClick={() => setShowLegal('terms')} className="hover:text-white">이용약관</button>
          </div>
        </div>
      </footer>

      {/* 모달 시스템 */}
      {showLegal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[40px] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-12 md:p-16 shadow-2xl relative">
            <button onClick={() => setShowLegal(null)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors">
              <i className="fa-solid fa-xmark text-2xl"></i>
            </button>
            <h2 className="text-3xl font-black mb-12 tracking-tight">
                {showLegal === 'privacy' ? '개인정보처리방침' : showLegal === 'terms' ? '이용약관' : 'Seal AI Pro 소개'}
            </h2>
            <div className="text-slate-600 text-sm leading-loose space-y-8 font-medium">
              {showLegal === 'privacy' ? (
                <>
                  <p className="text-slate-900 font-bold">1. 데이터 비저장 원칙</p>
                  <p>Seal AI Pro는 사용자가 업로드하는 이미지를 서버로 전송하지 않습니다. 모든 픽셀 프로세싱은 사용자의 웹 브라우저 내 '임시 메모리'에서 실시간으로 처리된 후 즉시 삭제됩니다.</p>
                  <p className="text-slate-900 font-bold">2. 수집하는 정보</p>
                  <p>서비스 품질 개선 및 접속 분석을 위해 익명의 기술적 데이터(브라우저 종류, 방문 경로 등)만을 수집합니다.</p>
                </>
              ) : (
                <>
                  <p className="text-slate-900 font-bold">1. 서비스 이용 제한</p>
                  <p>본 툴을 범죄, 위조, 사기 행위에 이용하는 것은 엄격히 금지됩니다. 위법 행위 발견 시 운영진은 어떠한 책임도 지지 않으며 관계 기관에 협조할 수 있습니다.</p>
                  <p className="text-slate-900 font-bold">2. 권리 관계</p>
                  <p>생성된 디지털 인감 이미지의 소유권은 사용자에게 있습니다.</p>
                </>
              )}
            </div>
            <button onClick={() => setShowLegal(null)} className="w-full mt-16 py-5 bg-slate-900 text-white rounded-[24px] font-black tracking-widest hover:bg-red-600 transition-colors">
              확인했습니다
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
