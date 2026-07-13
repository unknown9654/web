"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const chapters = ["序", "守候", "约定", "归家"];

type Tone = "welcome" | "tap" | "reveal" | "home";
type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const assetPrefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const asset = (path: string) => `${assetPrefix}${path}`;

export default function Home() {
  const [started, setStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [activeChapter, setActiveChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [thanksRevealed, setThanksRevealed] = useState(false);
  const [pledge, setPledge] = useState(1);
  const [homeLit, setHomeLit] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  const playTone = useCallback(
    (tone: Tone) => {
      if (!soundOn) return;

      const AudioCtor =
        window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!AudioCtor) return;

      const context = audioRef.current ?? new AudioCtor();
      audioRef.current = context;
      void context.resume();

      const palettes: Record<Tone, number[]> = {
        welcome: [392, 523.25, 659.25],
        tap: [587.33],
        reveal: [440, 554.37, 659.25],
        home: [523.25, 659.25, 783.99, 1046.5],
      };
      const now = context.currentTime;

      palettes[tone].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + index * 0.075;
        const duration = tone === "tap" ? 0.18 : 0.72;

        oscillator.type = index % 2 === 0 ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.detune.setValueAtTime(index * 2.5, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(
          tone === "tap" ? 0.028 : 0.045,
          start + 0.025,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
      });
    },
    [soundOn],
  );

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-chapter]"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.classList.add("is-visible");
          setActiveChapter(Number(target.dataset.chapter ?? 0));
        });
      },
      { threshold: 0.42 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const available =
        document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = available > 0 ? window.scrollY / available : 0;
      setProgress(Math.min(1, Math.max(0, nextProgress)));
      document.documentElement.style.setProperty(
        "--parallax",
        `${window.scrollY * -0.025}px`,
      );
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToChapter = (index: number) => {
    playTone("tap");
    document
      .querySelector(`[data-chapter="${index}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const beginLetter = () => {
    setStarted(true);
    window.setTimeout(() => playTone("welcome"), 80);
  };

  const revealThanks = () => {
    setThanksRevealed(true);
    playTone("reveal");
    navigator.vibrate?.(10);
  };

  const lightHome = () => {
    setHomeLit(true);
    playTone("home");
    navigator.vibrate?.([12, 40, 12]);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (!next) {
      void audioRef.current?.suspend();
    } else {
      void audioRef.current?.resume();
      window.setTimeout(() => playTone("tap"), 20);
    }
  };

  return (
    <main className={`site-shell ${homeLit ? "home-is-lit" : ""}`}>
      <div className="ambient-field" aria-hidden="true">
        <span className="ambient-orb orb-one" />
        <span className="ambient-orb orb-two" />
        <span className="ambient-orb orb-three" />
      </div>

      {!started && (
        <div className="entry-gate" role="dialog" aria-label="开启安全家书">
          <div className="gate-glow" aria-hidden="true" />
          <div className="gate-content">
            <div className="gate-mark" aria-hidden="true">
              <span />
            </div>
            <p className="eyebrow">安全生产月 · 一封家书</p>
            <h1>平安，是给家人<br />最长情的告白。</h1>
            <p className="gate-note">建议开启声音，慢慢向上滑动阅读</p>
            <button className="primary-action" onClick={beginLetter}>
              <span>轻触开启家书</span>
              <span className="action-arrow" aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      )}

      <header className="top-bar">
        <button
          className="brand-lockup glass-control"
          onClick={() => scrollToChapter(0)}
          aria-label="返回家书开头"
        >
          <span className="brand-crop" role="img" aria-label="前进民爆股份有限公司">
            <img src={asset("/brand-guide.jpg")} alt="" />
          </span>
        </button>
        <div className="top-actions">
          <span className="chapter-name" aria-live="polite">
            {chapters[activeChapter]}
          </span>
          <button
            className={`sound-toggle glass-control ${soundOn ? "is-on" : ""}`}
            onClick={toggleSound}
            aria-label={soundOn ? "关闭音效" : "开启音效"}
            aria-pressed={soundOn}
          >
            <span className="sound-bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </header>

      <nav className="chapter-rail" aria-label="家书章节">
        <span className="rail-line" aria-hidden="true">
          <span style={{ height: `${progress * 100}%` }} />
        </span>
        {chapters.map((chapter, index) => (
          <button
            key={chapter}
            className={activeChapter === index ? "active" : ""}
            onClick={() => scrollToChapter(index)}
            aria-label={`前往第${index + 1}章：${chapter}`}
          >
            <span />
          </button>
        ))}
      </nav>

      <section className="chapter hero-chapter is-visible" data-chapter="0">
        <div className="chapter-inner hero-grid">
          <div className="hero-copy">
            <p className="eyebrow reveal-item">致每一位默默守护的家人</p>
            <h2 className="display-title reveal-item">
              <span>岁月静好，</span>
              <em>只因有人负重前行。</em>
            </h2>
            <p className="hero-lead reveal-item">
              平安回家，只因背后有爱守候！
            </p>
            <button
              className="text-action reveal-item"
              onClick={() => scrollToChapter(1)}
            >
              <span>继续读下去</span>
              <span aria-hidden="true">↓</span>
            </button>
          </div>

          <div className="hero-visual reveal-item" aria-label="前小进向员工家属致意">
            <div className="mascot-halo" aria-hidden="true" />
            <div className="mascot-glass" aria-hidden="true" />
            <img
              className="mascot mascot-wave"
              src={asset("/qianxiaojin-wave.png")}
              alt="前小进一手抚心、一手挥手致意"
            />
            <div className="floating-note glass-card">
              <span className="note-dot" aria-hidden="true" />
              <span>每一次出发，都有人牵挂</span>
            </div>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span>向上滑动</span>
          <i />
        </div>
      </section>

      <section className="chapter gratitude-chapter" data-chapter="1">
        <div className="chapter-inner narrow-layout">
          <div className="chapter-index reveal-item">01 / 守候</div>
          <div className="gratitude-card glass-card reveal-item">
            <span className="quote-mark" aria-hidden="true">“</span>
            <p className="mini-label">TO OUR FAMILIES</p>
            <h2>平安回家，<br />只因背后有爱守候！</h2>
            <div className={`thanks-message ${thanksRevealed ? "is-revealed" : ""}`}>
              <span className="divider" />
              <p>
                前进民爆公司想向所有默默付出的员工家属道一声：
                <strong>感谢有您！</strong>
              </p>
            </div>
            {!thanksRevealed && (
              <button className="reveal-button" onClick={revealThanks}>
                <span className="pulse-ring" aria-hidden="true" />
                轻触，打开这句心里话
              </button>
            )}
          </div>
          <p className="side-whisper reveal-item">家，是我们出发的方向，也是归来的答案。</p>
        </div>
      </section>

      <section className="chapter promise-chapter" data-chapter="2">
        <div className="chapter-inner promise-grid">
          <div className="promise-copy">
            <div className="chapter-index reveal-item">02 / 约定</div>
            <h2 className="promise-title reveal-item">
              安全，是企业的<span>红线</span>，<br />
              是每一个家庭的<span>底线</span>。
            </h2>
            <p className="promise-body reveal-item">
              让我们与您携手，用亲情铸就安全防线，让每一次出发都充满期待，让每一次归来都伴随欢颜。
            </p>

            <div className="pledge-switcher reveal-item" role="tablist" aria-label="安全约定">
              {[
                ["红线", "敬畏规程，把风险止于行动之前。"],
                ["底线", "记得牵挂，把平安带回每一个家。"],
                ["防线", "企业与家庭携手，让守护彼此抵达。"],
              ].map(([label, text], index) => (
                <button
                  key={label}
                  className={pledge === index ? "active" : ""}
                  onClick={() => {
                    setPledge(index);
                    playTone("tap");
                  }}
                  role="tab"
                  aria-selected={pledge === index}
                >
                  <span>{label}</span>
                  <small>{text}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="promise-visual reveal-item">
            <div className="safety-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="mascot-pod glass-card">
              <img
                src={asset("/qianxiaojin-original.png")}
                alt="前小进安全形象"
              />
              <div className="pod-caption">
                <span>SAFE EVERY DAY</span>
                <strong>把安全带在身边</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="chapter home-chapter" data-chapter="3">
        <div className="home-light" aria-hidden="true" />
        <div className="chapter-inner home-layout">
          <div className="chapter-index reveal-item">03 / 归家</div>
          <p className="home-kicker reveal-item">这是企业与每个家庭共同的心愿</p>
          <h2 className="home-title reveal-item">
            <span>愿我们：</span>
            高高兴兴上班，<br />
            <em>平平安安回家！</em>
          </h2>
          <button
            className={`home-button reveal-item ${homeLit ? "is-lit" : ""}`}
            onClick={lightHome}
          >
            <span className="home-icon" aria-hidden="true">
              <i />
            </span>
            <span>{homeLit ? "灯已亮，等你平安归来" : "点亮一盏回家灯"}</span>
          </button>

          <div className={`home-message glass-card ${homeLit ? "is-visible" : ""}`} aria-live="polite">
            <span className="heart-line" aria-hidden="true" />
            <p>每一次平安归来，<br />都是给家人最好的回答。</p>
          </div>

          <footer className="site-footer reveal-item">
            <span>前进民爆股份有限公司</span>
            <span>安全生产月 · 家书</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
