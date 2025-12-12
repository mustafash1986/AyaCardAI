
import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { CardState, TextLayerState } from '../types';
import html2canvas from 'html2canvas';
import { CalendarDays, Instagram, Twitter, Facebook, Globe, Youtube, Send, Linkedin, MessageCircle } from 'lucide-react';

interface CardCanvasProps {
  cardState: CardState;
  className?: string;
  hideText?: boolean;
  showGuides?: boolean;
  labels?: {
    canvas: string;
    ayah: string;
    info: string;
    tafseer: string;
    source: string;
    footer: string;
  };
}

export interface CardCanvasHandle {
  getDataUrl: () => Promise<string>;
}

const CardCanvas = forwardRef<CardCanvasHandle, CardCanvasProps>(({ cardState, className, hideText = false, showGuides = false, labels }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getDataUrl: async () => {
      if (containerRef.current) {
        try {
          // Temporarily disable guides for capture if they are implemented via DOM elements
          // But since showGuides is state driven, the capture logic usually captures what is rendered.
          // Ideally, we'd pass showGuides=false during capture, but for now assuming user might want to capture guides if enabled.
          // To strictly prevent capturing guides, the parent should toggle showGuides off before calling capture, or we handle it here.
          // For simplicity, we capture what is seen.
          const canvas = await html2canvas(containerRef.current, {
            scale: 2, 
            useCORS: true, 
            backgroundColor: null,
            logging: false,
            allowTaint: true,
          });
          return canvas.toDataURL('image/png');
        } catch (e) {
          console.error("Capture failed", e);
          return "";
        }
      }
      return Promise.resolve('');
    }
  }));

  const getDateString = () => {
    const parts = [];
    const today = new Date();
    
    if (cardState.footer.showHijri) {
      try {
        const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            day: 'numeric', month: 'long', year: 'numeric'
        }).format(today);
        parts.push(hijri);
      } catch (e) {
        parts.push("١٤٤٦ هـ"); 
      }
    }
    
    if (cardState.footer.showGregorian) {
       const greg = new Intl.DateTimeFormat('ar-EG', {
         day: 'numeric', month: 'long', year: 'numeric'
       }).format(today);
       parts.push(greg);
    }

    return parts.join(' | ');
  };

  const renderSocials = () => {
    const iconSize = cardState.footer.fontSize;
    const { socials } = cardState.footer;
    const items = [];

    if (socials.telegram) items.push({ icon: <Send size={iconSize} />, text: socials.telegram });
    if (socials.twitter) items.push({ icon: <Twitter size={iconSize} />, text: socials.twitter });
    if (socials.instagram) items.push({ icon: <Instagram size={iconSize} />, text: socials.instagram });
    if (socials.facebook) items.push({ icon: <Facebook size={iconSize} />, text: socials.facebook });
    if (socials.whatsapp) items.push({ icon: <MessageCircle size={iconSize} />, text: socials.whatsapp });
    if (socials.linkedin) items.push({ icon: <Linkedin size={iconSize} />, text: socials.linkedin });
    if (socials.website) items.push({ icon: <Globe size={iconSize} />, text: socials.website });

    if (items.length === 0) return null;

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-1" dir="ltr">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 opacity-90">
             {item.icon}
             <span>{item.text}</span>
          </div>
        ))}
      </div>
    );
  };

  const GuideLabel = ({ label }: { label: string }) => (
    <div className="absolute -top-3 left-0 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm z-50 pointer-events-none whitespace-nowrap opacity-90 shadow-sm" style={{ direction: 'ltr' }}>
      {label}
    </div>
  );

  const renderTextLayer = (config: TextLayerState, key: string, label?: string) => {
    if (!config.content || hideText) return null;

    const style: React.CSSProperties = {
      fontFamily: config.fontFamily,
      fontSize: `${config.fontSize}px`,
      lineHeight: config.lineHeight,
      color: config.color,
      textAlign: config.align,
      fontWeight: config.bold ? 'bold' : 'normal',
      fontStyle: config.italic ? 'italic' : 'normal',
      width: `${config.widthPercent}%`,
      textShadow: config.shadow ? `${config.shadowColor} 0px 2px ${4}px` : 'none',
      backgroundColor: config.bgEnabled ? `rgba(${hexToRgb(config.bgColor)}, ${config.bgOpacity})` : 'transparent',
      padding: config.bgEnabled ? `${config.bgPadding}px` : '0',
      borderRadius: config.bgEnabled ? `${config.bgRadius}px` : '0',
      transform: `translateY(${config.offsetY}px)`,
      marginBottom: '1rem',
      whiteSpace: 'pre-wrap',
      direction: 'rtl',
      unicodeBidi: 'normal', 
      position: 'relative', // for guide positioning
      outline: showGuides ? '1px dashed #3b82f6' : 'none', // Blue outline for guides
    };

    return (
      <div key={key} style={style} className="relative z-10 transition-all duration-200" dir="rtl">
        {showGuides && label && <GuideLabel label={label} />}
        {config.content}
      </div>
    );
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
  };

  const containerStyle: React.CSSProperties = {
    width: `${cardState.width}px`,
    height: `${cardState.height}px`,
    backgroundColor: cardState.backgroundColor,
    backgroundImage: cardState.backgroundImage ? `url(${cardState.backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    overflow: 'hidden',
    direction: 'rtl',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundColor: cardState.overlayColor,
    opacity: cardState.overlayOpacity,
    zIndex: 1,
  };

  const safeAreaStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${cardState.padding.top}px`,
    right: `${cardState.padding.right}px`,
    bottom: `${cardState.padding.bottom}px`,
    left: `${cardState.padding.left}px`,
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const borderStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderWidth: `${cardState.border.width}px`,
    borderStyle: cardState.border.style,
    borderColor: cardState.border.color,
    opacity: cardState.border.opacity,
    borderTopLeftRadius: `${cardState.border.radius.tl}px`,
    borderTopRightRadius: `${cardState.border.radius.tr}px`,
    borderBottomRightRadius: `${cardState.border.radius.br}px`,
    borderBottomLeftRadius: `${cardState.border.radius.bl}px`,
    pointerEvents: 'none', 
    zIndex: 5, 
  };

  return (
    <div className={`overflow-hidden shadow-2xl ${className}`}>
      {/* Canvas Wrapper - can be used to show "Canvas Space" guide */}
      <div className="relative">
         {showGuides && (
            <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm z-50 pointer-events-none">{labels?.canvas || "Canvas Space"}</div>
         )}
         <div id="card-preview" ref={containerRef} style={containerStyle}>
        
        {/* Background Overlay */}
        <div style={overlayStyle}></div>

        {/* Safe Area Container */}
        <div style={safeAreaStyle}>
           
           {/* Internal Border (Frame) */}
           {cardState.border.enabled && (
             <div style={borderStyle}></div>
           )}

           {/* Content Wrapper */}
           <div className="w-full flex flex-col items-center justify-center h-full relative z-10 p-4">
             {/* 1. Ayah */}
             {renderTextLayer(cardState.text1, 't1', labels?.ayah)}
             
             {/* 2. Primary Subtitle (Surah/Verse Name) */}
             {renderTextLayer(cardState.text3, 't3', labels?.info)}
             
             {/* 3. Tafseer Text */}
             {renderTextLayer(cardState.text2, 't2', labels?.tafseer)}
             
             {/* 4. Secondary Subtitle (Tafseer Source) */}
             {renderTextLayer(cardState.text4, 't4', labels?.source)}
           </div>

           {/* Footer */}
           {cardState.footer.enabled && !hideText && (
             <div 
               style={{
                 position: 'absolute',
                 bottom: `${cardState.footer.offsetY}px`,
                 fontFamily: cardState.footer.fontFamily,
                 fontSize: `${cardState.footer.fontSize}px`,
                 color: cardState.footer.color,
                 width: '100%',
                 textAlign: 'center',
                 zIndex: 20,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 gap: '6px',
                 direction: 'rtl',
                 outline: showGuides ? '1px dashed #3b82f6' : 'none',
               }}
             >
                {showGuides && <GuideLabel label={labels?.footer || "Footer"} />}
                
                {cardState.footer.divider && (
                  <div className="w-1/3 h-px bg-current mb-2 opacity-50"></div>
                )}
                
                {(cardState.footer.showHijri || cardState.footer.showGregorian) && (
                   <div className="flex items-center gap-2 opacity-90" dir="rtl">
                     <CalendarDays size={cardState.footer.fontSize} />
                     <span>{getDateString()}</span>
                   </div>
                )}
                
                {renderSocials()}
             </div>
           )}

        </div>
      </div>
      </div>
    </div>
  );
});

CardCanvas.displayName = 'CardCanvas';
export default CardCanvas;
