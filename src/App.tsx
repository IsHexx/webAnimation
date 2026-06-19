import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollProgressToFrameIndex } from './utils/scrollVideo';

gsap.registerPlugin(ScrollTrigger);

const POSTER_SRC = '/银龙少女.png';
const DRAGON_SRC = '/幻世银龙.jpg';
const FRAME_COUNT = 193;
const FRAME_PATH_PREFIX = '/dragon-frames/frame_';

function getFrameSrc(index: number): string {
  return `${FRAME_PATH_PREFIX}${String(index + 1).padStart(4, '0')}.webp`;
}

function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;

    if (!root || !stage || !canvas) {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      const context = canvas.getContext('2d');
      const frames = Array.from({ length: FRAME_COUNT }, (_, index) => {
        const image = new Image();
        image.decoding = 'async';
        image.src = getFrameSrc(index);
        return image;
      });
      let activeFrameIndex = -1;
      let removeCanvasResize: (() => void) | undefined;

      const drawCoverFrame = (image: HTMLImageElement) => {
        if (!context || !image.complete || !image.naturalWidth || !image.naturalHeight) {
          return;
        }

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        const nextWidth = Math.round(displayWidth * pixelRatio);
        const nextHeight = Math.round(displayHeight * pixelRatio);

        if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
          canvas.width = nextWidth;
          canvas.height = nextHeight;
        }

        context.clearRect(0, 0, nextWidth, nextHeight);
        const canvasRatio = nextWidth / nextHeight;
        const imageRatio = image.naturalWidth / image.naturalHeight;
        const drawHeight = imageRatio > canvasRatio ? nextHeight : nextWidth / imageRatio;
        const drawWidth = imageRatio > canvasRatio ? nextHeight * imageRatio : nextWidth;
        const drawX = (nextWidth - drawWidth) / 2;
        const drawY = (nextHeight - drawHeight) / 2;

        context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      };

      const renderFrame = (frameIndex: number) => {
        const nextFrameIndex = Math.min(FRAME_COUNT - 1, Math.max(0, frameIndex));
        if (nextFrameIndex === activeFrameIndex) {
          return;
        }

        activeFrameIndex = nextFrameIndex;
        canvas.dataset.frameIndex = String(nextFrameIndex);
        const frame = frames[nextFrameIndex];
        if (frame.complete) {
          drawCoverFrame(frame);
          return;
        }

        frame.onload = () => drawCoverFrame(frame);
      };

      const handleCanvasResize = () => {
        drawCoverFrame(frames[activeFrameIndex < 0 ? 0 : activeFrameIndex]);
      };

      frames[0].onload = () => renderFrame(0);
      renderFrame(0);
      window.addEventListener('resize', handleCanvasResize);
      removeCanvasResize = () => window.removeEventListener('resize', handleCanvasResize);

      const revealTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      revealTimeline
        .fromTo('.load-curtain', { scaleY: 1 }, { scaleY: 0, duration: 1.25, transformOrigin: 'top' })
        .fromTo(
          '.sigil, .side-note, .scroll-mark',
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 },
          '-=0.65',
        );

      if (!reduceMotion) {
        const scrollTimeline = gsap
          .timeline({
            scrollTrigger: {
              trigger: stage,
              start: 'top top',
              end: '+=4200',
              pin: true,
              scrub: true,
              anticipatePin: 1,
              onUpdate: (self) => {
                renderFrame(scrollProgressToFrameIndex(self.progress, FRAME_COUNT));
              },
            },
          })
          .fromTo('.myth-copy', { y: 140, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.28 }, 0.48)
          .to('.video-layer', { scale: 1.13, duration: 1 }, 0)
          .to('.final-word', { autoAlpha: 1, y: 0, duration: 0.25 }, 0.72);

        scrollTimeline.scrollTrigger?.refresh();
      }

      const moveX = gsap.quickTo(root, '--mx', { duration: 0.65, ease: 'power3.out' });
      const moveY = gsap.quickTo(root, '--my', { duration: 0.65, ease: 'power3.out' });

      const onPointerMove = (event: PointerEvent) => {
        const normalizedX = event.clientX / window.innerWidth - 0.5;
        const normalizedY = event.clientY / window.innerHeight - 0.5;
        moveX(normalizedX);
        moveY(normalizedY);
      };

      window.addEventListener('pointermove', onPointerMove);
      return () => {
        removeCanvasResize?.();
        window.removeEventListener('pointermove', onPointerMove);
      };
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={rootRef} className="site-shell">
      <section ref={stageRef} className="myth-stage">
        <div className="video-layer parallax-back">
          <img className="scroll-poster" src={POSTER_SRC} alt="" aria-hidden="true" />
          <canvas ref={canvasRef} className="scroll-canvas" aria-label="银龙少女逐帧动画" />
        </div>

        <div className="interface-layer">
          <div className="sigil">08S / SCROLL FILM</div>
          <div className="side-note">Dragon-bound reverie</div>
          <div className="scroll-mark">向下滚动</div>
        </div>

        <div className="myth-copy copy-left">
          <p>滚动不是翻页，而是拨动时间。</p>
          <span>画面随指尖慢慢醒来，银色轮廓从暗处浮出。</span>
        </div>
        <div className="myth-copy copy-right">
          <p>鼠标牵引空间层次。</p>
          <span>远景、雾层、前景碎片产生不同速度的偏移。</span>
        </div>

        <div className="final-word">在第八秒，梦境抵达你面前。</div>
        <div className="load-curtain" aria-hidden="true" />
      </section>

      <section className="after-section">
        <img src={DRAGON_SRC} alt="幻世银龙" />
        <div>
          <p className="kicker">Scene Archive</p>
          <h2>保留余韵，而不是急着结束。</h2>
          <p>
            视频段落之后，页面进入更安静的图文空间，适合继续放作品集、故事设定、角色介绍或预约入口。
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
