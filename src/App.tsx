import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { landingContent } from './content';
import { scrollProgressToFrameIndex } from './utils/scrollVideo';

gsap.registerPlugin(ScrollTrigger);

const POSTER_SRC = '/银龙少女.png';
const DRAGON_SRC = '/幻世银龙.jpg';
const FRAME_COUNT = 193;
const FRAME_PATH_PREFIX = '/dragon-frames/frame_';
const SCROLL_DISTANCE = 4200;

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
      let removeScrollScene: (() => void) | undefined;

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
          '.brand-mark, .sigil, .side-note, .scroll-mark',
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06 },
          '-=0.65',
        );

      if (!reduceMotion) {
        const storyCards = gsap.utils.toArray<HTMLElement>('.story-card');
        const clampProgress = (value: number) => Math.min(1, Math.max(0, value));
        const revealProgress = (progress: number, start: number, end: number) =>
          clampProgress((progress - start) / (end - start));
        let lastProgress = -1;
        const stageStart = 0;

        const updateScrollScene = () => {
          const progress = clampProgress((window.scrollY - stageStart) / SCROLL_DISTANCE);
          if (Math.abs(progress - lastProgress) < 0.0005) {
            return;
          }

          lastProgress = progress;
          const heroAlpha = clampProgress(1 - progress / 0.16);
          const finalAlpha = revealProgress(progress, 0.72, 0.86);
          const frameIndex = scrollProgressToFrameIndex(progress, FRAME_COUNT);

          root.dataset.scrollProgress = progress.toFixed(4);
          root.dataset.scrollFrame = String(frameIndex);
          renderFrame(frameIndex);
          root.style.setProperty('--zoom', String(1.04 + progress * 0.09));
          gsap.set('.hero-content, .metric-strip', {
            autoAlpha: heroAlpha,
            y: -44 * (1 - heroAlpha),
          });
          storyCards.forEach((card, index) => {
            const storyAlpha = revealProgress(progress, 0.2 + index * 0.08, 0.34 + index * 0.08);
            gsap.set(card, {
              autoAlpha: storyAlpha,
              y: 90 * (1 - storyAlpha),
            });
          });
          gsap.set('.final-scroll-claim', {
            autoAlpha: finalAlpha,
            y: 34 * (1 - finalAlpha),
          });
        };

        const pinTrigger = ScrollTrigger.create({
          trigger: stage,
          start: 'top top',
          end: `+=${SCROLL_DISTANCE}`,
          pin: true,
          anticipatePin: 1,
          onUpdate: updateScrollScene,
        });

        const scrollTimer = window.setInterval(updateScrollScene, 33);
        window.addEventListener('scroll', updateScrollScene, { passive: true });
        updateScrollScene();
        pinTrigger.refresh();
        removeScrollScene = () => {
          window.clearInterval(scrollTimer);
          window.removeEventListener('scroll', updateScrollScene);
          pinTrigger.kill();
        };
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
        removeScrollScene?.();
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

        <header className="brand-mark" aria-label="镜澜映画">
          <span>{landingContent.brand.name}</span>
          <small>{landingContent.brand.descriptor}</small>
        </header>

        <div className="hero-content">
          <p className="hero-eyebrow">{landingContent.hero.eyebrow}</p>
          <h1>{landingContent.hero.title}</h1>
          <p>{landingContent.hero.subtitle}</p>
          <div className="hero-actions">
            <a className="action action-primary" href="#contact">
              {landingContent.hero.primaryAction}
              <span aria-hidden="true">-&gt;</span>
            </a>
            <a className="action action-secondary" href="#services">
              {landingContent.hero.secondaryAction}
            </a>
          </div>
        </div>

        <div className="metric-strip" aria-label="服务摘要">
          {landingContent.stats.map((item) => (
            <div className="stat-card" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="interface-layer">
          <div className="sigil">08S / CHARACTER FILM</div>
          <div className="side-note">Jinglan Eiga</div>
          <div className="scroll-mark">向下滚动</div>
        </div>

        <div className="story-layer" aria-label="滚动案例说明">
          {landingContent.scrollStory.map((item, index) => (
            <article className={`story-card story-${index + 1}`} key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <div className="final-scroll-claim">一支角色短片，也可以成为一次完整的首发现场。</div>
        <div className="load-curtain" aria-hidden="true" />
      </section>

      <section className="proof-section">
        <div className="section-heading">
          <p className="kicker">Why It Matters</p>
          <h2>不是再做一个好看的页面，而是让角色被记住。</h2>
        </div>
        <div className="problem-grid">
          {landingContent.problems.map((item) => (
            <article className="problem-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="service-section" id="services">
        <div className="section-heading">
          <p className="kicker">Services</p>
          <h2>从角色视觉到互动网页，一条线完成。</h2>
        </div>
        <div className="service-grid">
          {landingContent.services.map((item, index) => (
            <article className="service-card" key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="audience-section">
        <img src={DRAGON_SRC} alt="幻世银龙视觉案例" />
        <div className="audience-panel">
          <p className="kicker">For Who</p>
          <h2>适合正在准备“角色登场”的项目。</h2>
          <ul>
            {landingContent.audiences.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="process-section">
        <div className="section-heading">
          <p className="kicker">Workflow</p>
          <h2>用个人导演式流程，保持风格统一。</h2>
        </div>
        <div className="process-list">
          {landingContent.process.map((item) => (
            <article className="process-item" key={item.step}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <p className="kicker">Start A Character Launch</p>
        <h2>{landingContent.finalCta.title}</h2>
        <p>{landingContent.finalCta.text}</p>
        <a className="action action-primary" href="mailto:hello@jinglan.eiga">
          {landingContent.finalCta.action}
          <span aria-hidden="true">-&gt;</span>
        </a>
      </section>
    </main>
  );
}

export default App;
