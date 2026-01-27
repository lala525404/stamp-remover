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
        // 이미지가 로드되면 툴 위치로 스크롤
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
            <a href="#how-to" className="hover:text-red-600 transition-colors">사용 방법</a>
            <a href="#knowledge" className="hover:text-red-600 transition-colors">전문 지식</a>
            <a href="#faq" className="hover:text-red-600 transition-colors">FAQ</a>
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

        {/* 메인 툴 영역 - 모바일 레이아웃 개선 적용 */}
        <div id="tool" className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. 이미지 영역 (모바일: 최상단 고정 / PC: 왼쪽 배치) */}
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
                <div className="mt-12 flex items-center gap-6 opacity-30">
                  <i className="fa-solid fa-image text-2xl"></i>
                  <i className="fa-solid fa-file-pdf text-2xl"></i>
                  <i className="fa-solid fa-file-image text-2xl"></i>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* 모바일 Sticky Header 적용 부분 */}
                <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md -mx-4 px-4 py-4 lg:static lg:bg-transparent lg:p-0 lg:mx-0 shadow-sm lg:shadow-none border-b border-slate-200/50 lg:border-none rounded-b-[32px] lg:rounded-none transition-all">
                    <div className="bg-white p-2 lg:p-6 rounded-[32px] lg:rounded-[48px] shadow-xl lg:shadow-2xl shadow-slate-200/50 border border-slate-50 relative">
                        {/* 프리뷰 컨트롤바 */}
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

                {/* 하단 버튼 그룹 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-2 lg:px-0">
                  <button onClick={() => setImage(null)} className="px-4 py-4 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-[20px] font-bold text-sm transition-all flex items-center justify-center gap-2 border border-slate-100 shadow-sm"><i className="fa-solid fa-arrow-left"></i> 처음으로</button>
                  <button onClick={() => handleUpscale(2)} disabled={!processedImage || isUpscaling} className="py-4 bg-sky-50 text-sky-700 rounded-[20px] font-bold text-sm hover:bg-sky-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"><i className="fa-solid fa-expand"></i> 화질 개선</button>
                  <button onClick={handleDownloadPng} disabled={!processedImage} className="py-4 bg-red-600 hover:bg-red-700 text-white rounded-[20px] font-bold text-sm transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"><i className="fa-solid fa-file-export"></i> PNG</button>
                  <button onClick={handleDownloadVector} disabled={!processedImage || isVectorizing} className="py-4 bg-slate-900 hover:bg-black text-white rounded-[20px] font-bold text-sm transition-all shadow-xl shadow-slate-300 flex items-center justify-center gap-2 disabled:opacity-50"><i className="fa-solid fa-bezier-curve"></i> SVG</button>
                </div>
              </div>
            )}
          </div>

          {/* 2. 설정 영역 (모바일: 이미지 아래 / PC: 오른쪽 배치) */}
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

        {/* 정보성 콘텐츠 섹션 */}
        <div className="max-w-4xl mx-auto mt-32 space-y-32">
          
          {/* 가이드 섹션 */}
          <section id="how-to" className="text-center">
            <h2 className="text-3xl font-black mb-16 tracking-tight">고해상도 도장 추출 3단계</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-6 group">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[32px] flex items-center justify-center mx-auto text-3xl font-black group-hover:bg-red-50 group-hover:text-red-600 transition-all duration-500">01</div>
                <h4 className="font-bold text-xl">깨끗하게 찍기</h4>
                <p className="text-slate-500 text-sm leading-loose px-4">
                  흰색 A4 용지에 도장을 흔들림 없이 찍으세요. 조명이 밝은 곳에서 촬영하면 AI 추출이 훨씬 정확해집니다.
                </p>
              </div>
              <div className="space-y-6 group">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[32px] flex items-center justify-center mx-auto text-3xl font-black group-hover:bg-red-50 group-hover:text-red-600 transition-all duration-500">02</div>
                <h4 className="font-bold text-xl">색상 조절하기</h4>
                <p className="text-slate-500 text-sm leading-loose px-4">
                  '민감도' 조절을 통해 번진 잉크까지 정밀하게 선택하세요. '리컬러' 기능을 사용해 선명한 빨간색으로 보정할 수 있습니다.
                </p>
              </div>
              <div className="space-y-6 group">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[32px] flex items-center justify-center mx-auto text-3xl font-black group-hover:bg-red-50 group-hover:text-red-600 transition-all duration-500">03</div>
                <h4 className="font-bold text-xl">무한 확대 SVG</h4>
                <p className="text-slate-500 text-sm leading-loose px-4">
                  웹/앱 개발이나 디자인 작업이 필요하다면 SVG 형식을 선택하세요. 크기를 아무리 키워도 선명함이 유지됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* 정보성 칼럼 영역 */}
          <section id="knowledge" className="space-y-20">
            <div className="ad-container">
              <span className="ad-label">ADVERTISEMENT</span>
              <div className="h-40 flex items-center justify-center text-slate-300 font-bold">중간 광고 영역</div>
            </div>

            <article className="bg-white p-10 md:p-20 rounded-[56px] border border-slate-100 shadow-sm leading-relaxed space-y-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight border-b border-red-100 pb-4 inline-block">인감 도장의 디지털화, 왜 필요한가요?</h2>
                <p className="text-slate-600 mb-6 text-lg font-light leading-loose">
                  최근 비대면 서비스의 확산으로 <strong>전자 계약</strong>이 기업과 개인의 표준으로 자리 잡았습니다. 단순히 종이에 도장을 찍어 스캔하는 방식은 해상도가 낮고 배경이 지저분해 신뢰도가 떨어질 수 있습니다. 
                  디지털 인감 누끼 도구는 전문적인 수준의 투명 배경 이미지를 생성하여 문서의 격을 높여줍니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-red-600">법적 효력과 디지털 인감</h3>
                  <p className="text-sm text-slate-500 leading-loose">
                    국내 전자서명법에 따르면, 전자문서에 사용된 도장 이미지 역시 당사자의 의사가 반영되었다면 법적 효력을 가집니다. 하지만 인감 증명서 제출이 필요한 오프라인 법무 대행의 경우 반드시 원본 문서를 확인해야 하므로 사용처를 구분하는 지혜가 필요합니다.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-red-600">완벽한 추출을 위한 팁</h3>
                  <p className="text-sm text-slate-500 leading-loose">
                    도장을 찍을 때 바닥에 고무 패드를 깔아 잉크가 골고루 묻게 하세요. 사진 촬영 시에는 줌(Zoom)을 사용하기보다 카메라를 가까이 대고 초점을 명확히 잡는 것이 좋습니다. 노란 조명보다는 형광등이나 자연광이 AI 분석에 유리합니다.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-200/50">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <i className="fa-solid fa-lock text-slate-800"></i>
                  철저한 보안 및 프라이버시 원칙
                </h3>
                <p className="text-sm text-slate-500 leading-loose">
                  인감 도장은 개인과 기업의 권리를 증명하는 매우 중요한 정보입니다. 본 서비스는 **서버 저장형 방식이 아닌, 사용자의 브라우저 내에서만 연산되는 '클라이언트 사이드' 기술**을 사용합니다. 
                  즉, 귀하의 인감 데이터는 인터넷 어딘가로 전송되거나 서버에 남지 않습니다. 안전하게 안심하고 이용하세요.
                </p>
              </div>
            </article>
          </section>

          {/* FAQ 섹션 */}
          <section id="faq" className="space-y-10">
            <h2 className="text-3xl font-black text-center tracking-tight">자주 묻는 질문</h2>
            <div className="space-y-4">
              {[
                { q: "누끼 작업이 무료인가요?", a: "네, 인감 누끼 AI Pro는 어떠한 비용도 요구하지 않습니다. 전문적인 고해상도 추출 기능을 무제한으로 사용하실 수 있습니다." },
                { q: "전자 계약 서비스와 호환되나요?", a: "모두싸인, 싸인이큐, 어도비 사인 등 대부분의 메이저 전자계약 솔루션에서 배경이 없는 PNG 파일을 지원합니다. 본 툴에서 생성된 이미지를 그대로 업로드하여 사용하세요." },
                { q: "모바일에서도 사용 가능한가요?", a: "반응형 웹 디자인을 지원하므로 스마트폰 카메라로 찍은 직후 모바일 브라우저에서 바로 누끼를 따고 저장할 수 있습니다." },
                { q: "개인 인감을 위조에 사용할 위험은 없나요?", a: "본 도구는 정당한 권한을 가진 사용자의 편의를 위한 툴입니다. 타인의 인감을 무단 도용하는 행위는 법적 처벌 대상이며, 이에 대한 모든 책임은 사용자에게 있습니다." }
              ].map((faq, i) => (
                <details key={i} className="group bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                  <summary className="p-8 font-bold cursor-pointer flex justify-between items-center select-none group-open:bg-slate-50">
                    <span className="flex gap-4">
                      <span className="text-red-500 font-black">Q.</span>
                      {faq.q}
                    </span>
                    <i className="fa-solid fa-chevron-down text-slate-300 transition-transform group-open:rotate-180"></i>
                  </summary>
                  <div className="px-20 py-10 text-slate-500 text-sm leading-loose border-t border-slate-50 bg-slate-50/30">
                    <span className="font-bold text-slate-800 block mb-2">A.</span>
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="mt-40 py-24 bg-slate-900 text-white relative">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-4 space-y-8">
            <div className="flex items-center gap-2 font-black text-2xl">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white">
                <i className="fa-solid fa-stamp"></i>
              </div>
              Seal AI Pro
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              이미지 처리 기술과 AI를 활용하여 인감 도장의 배경을 제거하고 전문적인 디지털 인감으로 변환해주는 프리미엄 무료 웹 서비스입니다.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><i className="fa-brands fa-github"></i></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><i className="fa-solid fa-envelope"></i></a>
            </div>
          </div>
          
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div className="space-y-6">
              <h5 className="font-bold text-sm uppercase tracking-widest text-red-500">Service</h5>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><button onClick={() => document.getElementById('tool')?.scrollIntoView()} className="hover:text-white transition-colors">인감 누끼 따기</button></li>
                <li><button onClick={() => handleUpscale(2)} className="hover:text-white transition-colors">고해상도 복원</button></li>
                <li><button className="hover:text-white transition-colors">벡터 SVG 변환</button></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="font-bold text-sm uppercase tracking-widest text-red-500">Knowledge</h5>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><button onClick={() => setShowLegal('about')} className="hover:text-white transition-colors">서비스 소개</button></li>
                <li><a href="#knowledge" className="hover:text-white transition-colors">법적 효력 안내</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">자주 묻는 질문</a></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="font-bold text-sm uppercase tracking-widest text-red-500">Policy</h5>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors">개인정보처리방침</button></li>
                <li><button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors">서비스 이용약관</button></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 mt-24 pt-12 border-t border-white/5 text-center space-y-4">
          <p className="text-slate-500 text-xs font-medium">© 2025 SealNukki AI Labs. All rights reserved.</p>
          <p className="text-slate-600 text-[10px] max-w-2xl mx-auto leading-loose">
            본 서비스는 전문적인 인감 추출 기술을 제공하며, 모든 법적 책임은 사용자에게 있습니다. 인감 이미지 오남용은 형법상 '인장위조죄' 등에 해당할 수 있으므로 각별한 주의를 바랍니다.
          </p>
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
                  <p className="text-slate-900 font-bold">3. 제3자 광고 네트워크</p>
                  <p>구글 애드센스와 같은 광고 파트너가 쿠키를 사용하여 방문자의 관심사에 맞는 광고를 노출할 수 있습니다.</p>
                </>
              ) : showLegal === 'terms' ? (
                <>
                  <p className="text-slate-900 font-bold">1. 서비스 이용 제한</p>
                  <p>본 툴을 범죄, 위조, 사기 행위에 이용하는 것은 엄격히 금지됩니다. 위법 행위 발견 시 운영진은 어떠한 책임도 지지 않으며 관계 기관에 협조할 수 있습니다.</p>
                  <p className="text-slate-900 font-bold">2. 권리 관계</p>
                  <p>생성된 디지털 인감 이미지의 소유권은 사용자에게 있습니다. 다만, 상업적 효력을 가지는 공식 문서 사용 전 반드시 법률적 검토를 받으시기 바랍니다.</p>
                  <p className="text-slate-900 font-bold">3. 보증의 부인</p>
                  <p>운영진은 서비스 사용 결과의 무결성이나 법적 완결성을 보증하지 않습니다.</p>
                </>
              ) : (
                <>
                  <p className="text-slate-900 font-bold">"우리는 더 효율적인 행정 환경을 꿈꿉니다."</p>
                  <p>포토샵을 배우지 않아도, 비싼 소프트웨어를 구독하지 않아도 누구나 고품질의 디지털 자산을 가질 수 있어야 합니다.</p>
                  <p>Seal AI Pro는 고급 픽셀 알고리즘과 인공지능 분석 기능을 결합하여 비즈니스 효율을 극대화하는 것을 목표로 합니다. 끊임없는 기술 업데이트로 사용자 여러분께 최고의 경험을 제공하겠습니다.</p>
                </>
              )}
            </div>
            <button onClick={() => setShowLegal(null)} className="w-full mt-16 py-5 bg-slate-900 text-white rounded-[24px] font-black tracking-widest hover:bg-red-600 transition-colors">
              내용을 모두 확인했습니다
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
