import React from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, GitBranch, Layers } from 'lucide-react';

import Brand from '../components/Layout/Brand';
import ThemeToggle from '../components/Layout/ThemeToggle';
import DocsNav from '../components/Docs/DocsNav';
import CodeBlock from '../components/Docs/CodeBlock';
import { ArchitectureDiagram, FlowRow, PhaseWeights } from '../components/Docs/Visuals';
import { Section, P, Sub, Callout, Facts, SpecTable, Steps } from '../components/Docs/Bits';
import { useThemeMode } from '../theme/context';

/* ----------------------------------------------------------------- chapters */

const SECTIONS = [
  { id: 'overview', number: '01', label: 'The short version' },
  { id: 'lifecycle', number: '02', label: 'One request, end to end' },
  { id: 'script', number: '03', label: 'Writing the lesson' },
  { id: 'narration', number: '04', label: 'The voice track' },
  { id: 'visuals', number: '05', label: 'The figures' },
  { id: 'layout', number: '06', label: 'The layout engine' },
  { id: 'timeline', number: '07', label: 'Timing and sync' },
  { id: 'frames', number: '08', label: 'Painting frames' },
  { id: 'encode', number: '09', label: 'Encoding the MP4' },
  { id: 'auth', number: '10', label: 'Accounts and access' },
  { id: 'stack', number: '11', label: 'The stack, file by file' },
  { id: 'limits', number: '12', label: 'Limits and next steps' },
];

/* ------------------------------------------------------------------ samples */

const SCHEMA_SAMPLE = `// agents/TextAgent.js — the response contract
const RESPONSE_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'lesson',
    strict: true,
    schema: {
      type: 'object',
      required: ['steps'],
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            required: ['writeOnWhiteBoard', 'speak', 'imagePrompt'],
            properties: {
              writeOnWhiteBoard: { type: 'string' },  // markdown for the slide
              speak: { type: 'string' },              // narration for this step
              imagePrompt: { /* null, or a styled image brief */ },
            },
          },
        },
      },
    },
  },
};`;

const STEP_SAMPLE = `{
  "writeOnWhiteBoard": "## Photosynthesis\\n\\n- Chlorophyll absorbs light\\n- Water is split, releasing O₂\\n\\n$$6CO_2 + 6H_2O -> C_6H_{12}O_6 + 6O_2$$",
  "speak": "Plants make their own food. Chlorophyll in the leaf absorbs sunlight, and that energy splits water molecules apart.",
  "imagePrompt": {
    "prompt": "A leaf cross-section with sunlight striking chloroplasts",
    "artStylePreset": "illustration",
    "artStylePrompt": "clean educational vector illustration, flat colours",
    "stylePrompt": "light background, no text labels"
  }
}`;

const NDJSON_SAMPLE = `{"type":"progress","message":"Generating explanation text...","progress":10}
{"type":"progress","message":"Processing step 1/9","step":1,"total":9,"progress":20}
{"type":"progress","message":"Generating image for slide 1...","progress":20}
{"type":"progress","message":"Processing step 2/9","step":2,"total":9,"progress":27}
{"type":"complete","success":true,"progress":100}`;

const TIMELINE_SAMPLE = `// hooks/useVideoGenerator.js — a slide divides its own narration window
const { pages } = composeSlide(slide.content, { width, height, theme, imageCache });

const totalWeight = pages.reduce((sum, page) => sum + page.weight, 0) || 1;

pages.forEach((page) => {
  const span = (safeDuration * page.weight) / totalWeight;   // ms for this page
  segments.push({
    page,
    start: clock,
    end: clock + span,
    revealMs: Math.min(
      Math.max(page.bounds.length * 240, 650),   // one beat per block
      Math.min(2600, span * 0.55),               // never more than half the page
    ),
  });
  clock += span;
});`;

const BAKE_SAMPLE = `// Only the reveal window is painted op-by-op; the rest is one drawImage.
const createBaker = (segments, theme) => {
  const cache = new Map();
  const KEEP = 2;                       // a 1080p canvas is ~8MB — hold almost none

  return (i) => {
    if (cache.has(i)) return cache.get(i);

    const c = document.createElement('canvas');
    c.width = 1920; c.height = 1080;
    const ctx = c.getContext('2d');
    paintBackground(ctx, { width: 1920, height: 1080, theme });
    paintPage(ctx, segments[i].page, { t: 1, stagger: false });

    cache.set(i, c);
    for (const key of cache.keys()) {
      if (key < i - KEEP) { cache.get(key).width = 0; cache.delete(key); }
    }
    return c;
  };
};`;

const ENCODE_SAMPLE = `// video/encoder.js
const AVC_CODECS = ['avc1.640033', 'avc1.640028', 'avc1.4D4028', 'avc1.42E01E'];

const videoBitrate = (w, h, fps) =>
  Math.min(24_000_000, Math.max(2_000_000, Math.round(w * h * fps * 0.11)));

// 1920 × 1080 × 30 × 0.11 ≈ 6.8 Mbps — enough for text edges to stay crisp.`;

const GUARD_SAMPLE = `// components/Auth/RequireAuth.jsx
const { isLoaded, isSignedIn } = useAuth();

// The loading branch is the important one: rendering the redirect before Clerk
// has resolved the session would bounce signed-in users out on every refresh.
if (!isLoaded) return <LoadingScreen message="Checking your session…" />;

if (!isSignedIn) {
  const target = location.pathname + location.search;
  return <Navigate to={\`/sign-in?redirect_url=\${encodeURIComponent(target)}\`} replace />;
}

return children;`;

const FILES = [
  ['agents/TextAgent.js', 'Calls Azure OpenAI under a strict JSON schema and returns the lesson steps.'],
  ['agents/VoiceAgent.js', 'Azure Speech neural TTS — one WAV file per step.'],
  ['agents/ImageAgent.js', 'Image generation for steps that carry an imagePrompt.'],
  ['services/AudioProcessor.js', 'Session folders, image saving, clip durations, and the merged narration track.'],
  ['controllers/explainController.js', 'Runs the stages in order and streams NDJSON progress to the browser.'],
  ['src/render/md.js', 'Markdown → typed blocks (headings, lists, code, math, tables, images).'],
  ['src/render/layout.js', 'Measurement and placement: the part that decides whether content fits.'],
  ['src/render/slide.js', 'Fit, paginate, place images, draw slide chrome.'],
  ['src/render/math/', 'A small parser and layout pass for typeset equations.'],
  ['src/render/code.js', 'Tokeniser for syntax-highlighted code blocks.'],
  ['src/video/encoder.js', 'WebCodecs H.264 encode plus the ffmpeg.wasm fallback.'],
  ['src/hooks/useVideoGenerator.js', 'The conductor: streaming, assets, timeline, frames, encode, progress.'],
];

const ROUTES = [
  ['/', 'Public. Landing page.'],
  ['/how-it-works', 'Public. This document.'],
  ['/sign-in/*, /sign-up/*', 'Public. Clerk owns every sub-path — verification, MFA, SSO callbacks.'],
  ['/app, /app/videos', 'Protected. Wrapped in RequireAuth; unauthenticated visits redirect with a return URL.'],
];

/* --------------------------------------------------------------------- page */

const HowItWorks = () => {
  const { theme, toggleTheme } = useThemeMode();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  return (
    <div className="min-h-screen bg-ink-950 text-mist-100">
      {/* Reading progress */}
      <Motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] w-full max-w-6xl items-center gap-4 px-5 sm:px-8">
          <Brand to="/" />
          <span className="hidden rounded-full border border-line bg-ink-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-400 sm:inline">
            Documentation
          </span>

          <div className="ml-auto flex items-center gap-2.5">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <Link
              to="/app"
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-on-accent transition-colors hover:bg-accent-strong"
            >
              Open studio
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 ff-grid ff-fade-mask opacity-50" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 ff-bloom" />

        <div className="relative mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-mist-400 transition-colors hover:text-mist-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <h1 className="mt-7 max-w-3xl text-[38px] font-extrabold leading-[1.06] tracking-[-0.035em] text-mist-100 sm:text-[52px]">
            How Xplainer turns a
            <br />
            sentence into a video
          </h1>

          <p className="mt-6 max-w-2xl text-[16.5px] leading-[1.75] text-mist-400">
            A complete walk-through of the system: the four AI stages that produce a script,
            narration and figures, and the browser-side engine that lays out slides, paints every
            frame and encodes the finished MP4. Written to be read start to finish — no prior
            knowledge of the codebase assumed.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-2.5">
            {[
              { icon: Clock, label: '~12 minute read' },
              { icon: Layers, label: '12 chapters' },
              { icon: GitBranch, label: 'React 19 · Express · Azure' },
            ].map((chip) => (
              <span
                key={chip.label}
                className="flex items-center gap-2 rounded-full border border-line bg-ink-900 px-3 py-1.5 text-[12px] font-medium text-mist-400"
              >
                <chip.icon className="h-3.5 w-3.5 text-accent-fg" />
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_224px] lg:gap-14">
          <article className="min-w-0 max-w-[760px]">
            {/* ---------------------------------------------------- 01 */}
            <Section
              id="overview"
              number="01"
              title="The short version"
              lead="You type a topic. Four specialised stages turn it into a script, a voice track and a set of figures. Your own browser then lays those out as slides, paints them frame by frame and encodes an MP4 — no render server involved."
            >
              <FlowRow
                steps={[
                  { label: 'Your topic', sub: 'one sentence' },
                  { label: 'Lesson script', sub: 'ordered steps' },
                  { label: 'Narration', sub: 'one clip per step' },
                  { label: 'Figures', sub: 'where useful' },
                  { label: 'Slides', sub: 'measured layout' },
                  { label: 'MP4', sub: '1080p · 30fps' },
                ]}
                caption="Each arrow is a real handover: a JSON file, a WAV file, a PNG, a canvas, a blob."
              />

              <P>
                The split of work is the design decision everything else follows from. The server is
                good at one thing — talking to models that need secret keys — so that is all it
                does. Video work is expensive, embarrassingly parallel per user, and needs a GPU,
                which is exactly what a modern browser already has.
              </P>

              <ArchitectureDiagram />

              <Facts
                items={[
                  { value: '1920×1080', label: 'Frame size the layout targets' },
                  { value: '30 fps', label: 'H.264, muxed into MP4' },
                  { value: '9 sizes', label: 'Type scales tried before a slide splits' },
                  { value: '~6.8 Mbps', label: 'Video bitrate at 1080p30' },
                ]}
              />
            </Section>

            {/* ---------------------------------------------------- 02 */}
            <Section
              id="lifecycle"
              number="02"
              title="One request, end to end"
              lead="Pressing Generate starts a single streaming request, and the UI is driven by what comes back down it."
            >
              <Steps
                items={[
                  {
                    title: 'The browser opens a stream',
                    body:
                      'It POSTs the prompt and a freshly generated chatID to /api/explain. The response is NDJSON — newline-delimited JSON objects — so progress arrives while the work is still happening, instead of after it.',
                  },
                  {
                    title: 'The server runs the stages in order',
                    body:
                      'Script first, then per-step narration and images. Steps run one at a time, not in parallel: firing nine TTS and nine image calls at once trips provider rate limits, and a rate-limited step is a missing slide.',
                  },
                  {
                    title: 'Everything is written to a session folder',
                    body:
                      'Under audio/<chatID>/ the server leaves j1.json (the slide list with durations), merged/output.wav (the full narration) and images/img_N.png. The chatID is what keeps two tabs from colliding.',
                  },
                  {
                    title: 'The browser fetches those artefacts',
                    body:
                      'Once the stream closes it pulls the JSON, preloads every image and downloads the narration track. Only then does rendering begin — the timeline needs all the durations up front.',
                  },
                  {
                    title: 'The render engine takes over',
                    body:
                      'Layout, then frames, then encode. From here on nothing touches the network, and the progress bar is measuring local work.',
                  },
                ]}
              />

              <CodeBlock
                title="progress events, as they arrive"
                language="ndjson"
                code={NDJSON_SAMPLE}
                caption="Each line is a complete JSON object. Partial lines are buffered until the newline arrives — a chunk boundary can land mid-object."
              />

              <Sub>Why the progress bar behaves</Sub>
              <P>
                Two separate systems report progress — the server for the AI stages, the encoder for
                the frames — and naively rendering both produced a bar that filled up, snapped back
                to zero and filled again. Every stage now maps onto one weighted 0–100 scale, and
                the value is clamped so it can never move backwards.
              </P>

              <PhaseWeights />

              <Callout kind="why" title="Why 98%, not 100%">
                The bar stops just short until the MP4 blob actually exists. A progress bar that
                reads 100% while the user is still waiting is worse than one that reads 98%.
              </Callout>
            </Section>

            {/* ---------------------------------------------------- 03 */}
            <Section
              id="script"
              number="03"
              title="Stage one — writing the lesson"
              lead="A language model is asked for a structured lesson, not prose: an ordered list of steps, each one carrying three separate things."
            >
              <P>
                The model behind this stage is Azure OpenAI (<span className="ff-code">gpt-5-mini</span>{' '}
                by default). For every step it returns what should appear on the board, what the
                narrator should say, and — optionally — a brief for an illustration. Keeping those
                three fields apart is what lets the slide be terse while the narration stays
                conversational.
              </P>

              <CodeBlock title="the response contract" language="javascript" code={SCHEMA_SAMPLE} />

              <Callout kind="why" title="Why a strict schema instead of “please reply in JSON”">
                With plain JSON mode a malformed reply used to slip through the controller&apos;s
                fallback and produce a video with zero slides — a success as far as the UI was
                concerned. Under <span className="ff-code">strict: true</span> the shape is enforced
                by the API, and a genuine failure fails loudly instead. The code still keeps a
                fallback path, because not every deployment accepts{' '}
                <span className="ff-code">json_schema</span>.
              </Callout>

              <Sub>What one step looks like</Sub>
              <CodeBlock
                title="a single step"
                language="json"
                code={STEP_SAMPLE}
                caption="The board text is markdown, and it may contain maths or fenced code. The renderer parses all of it."
              />
            </Section>

            {/* ---------------------------------------------------- 04 */}
            <Section
              id="narration"
              number="04"
              title="Stage two — the voice track"
              lead="Each step's narration is synthesised separately, and the length of that audio is what decides how long its slide stays on screen."
            >
              <P>
                Azure Speech renders the <span className="ff-code">speak</span> field of every step
                to its own WAV file. The server then measures each clip and stores the result, in
                milliseconds, alongside the slide content. Finally the clips are concatenated into
                one continuous narration track.
              </P>

              <CodeBlock
                title="what the browser downloads"
                language="json"
                code={`[
  { "time": 7480, "content": "## Photosynthesis\\n\\n- Chlorophyll absorbs light…" },
  { "time": 9120, "content": "### The light reaction\\n\\n…\\n\\n![Generated Image](/chat_x/images/img_1.png)" }
]`}
                caption="j1.json — slide markdown plus the measured duration of that slide's narration."
              />

              <Callout kind="why" title="Why measure instead of estimate">
                Estimating narration length from word count drifts by a second or two per slide,
                and the drift accumulates: by slide nine the voice is describing the wrong picture.
                Measuring the rendered audio removes the guess entirely — the visual timeline is
                derived from the audio, so they cannot disagree.
              </Callout>

              <P>
                A step that fails is dropped from both lists together, so audio and slides stay in
                lockstep even when one TTS call errors. And a duration that arrives as zero — which
                once made a slide unreachable while its audio still played — is replaced with a
                safe default before it can desynchronise everything after it.
              </P>
            </Section>

            {/* ---------------------------------------------------- 05 */}
            <Section
              id="visuals"
              number="05"
              title="Stage three — the figures"
              lead="Not every step needs a picture, so the script decides which ones do."
            >
              <P>
                When a step includes an <span className="ff-code">imagePrompt</span>, it is passed to
                an image model (FLUX 1.1 pro on Azure) together with an art-style preset —{' '}
                <span className="ff-code">3D</span>, <span className="ff-code">illustration</span>,{' '}
                <span className="ff-code">chalkboard</span> or <span className="ff-code">neon</span>.
                The preset is why nine slides look like one lesson rather than nine unrelated
                pictures.
              </P>

              <P>
                The generated file is saved into the session folder and appended to the slide&apos;s
                markdown as a standard image reference. From the renderer&apos;s point of view there
                is nothing special about it: it is just another markdown block to measure and place.
              </P>

              <Callout kind="note" title="Two failure modes, both handled">
                An image that fails to generate is skipped and the slide is laid out as text only —
                one bad picture must not sink the whole video. And an image that loads but fails its
                CORS check would silently taint the canvas, making the first encode call throw after
                all the AI work is already paid for; every image is therefore probed on a 2×2 test
                canvas first, and unsafe ones are dropped before rendering starts.
              </Callout>
            </Section>

            {/* ---------------------------------------------------- 06 */}
            <Section
              id="layout"
              number="06"
              title="Stage four — the layout engine"
              lead="This is the part that makes text overflowing a slide structurally impossible, rather than something to hope about."
            >
              <P>
                A slide starts as markdown and is parsed into typed blocks: headings, paragraphs,
                lists, tables, block quotes, fenced code, maths and images. Layout is then pure
                measurement — given a root font size, the engine can compute exactly how tall the
                content will be without drawing anything.
              </P>

              <P>
                Because measuring is cheap and side-effect free, the slide can be laid out
                repeatedly at descending sizes until one fits:
              </P>

              <CodeBlock
                title="render/slide.js"
                language="javascript"
                code={`// Root sizes to try, as a fraction of frame height:
// 1080p maps to roughly 41px down to 22px.
const ROOT_STEPS = [0.038, 0.0355, 0.033, 0.0305, 0.0285, 0.0265, 0.0245, 0.0225, 0.0205];

for (const root of roots) {
  const fit = tryFit(blocks, image, frame, theme, root);
  if (fit) return { pages: [buildPage(fit, …)] };   // largest size that fits wins
}

// Nothing fits even at the floor size — split across pages instead of
// drawing off the bottom of the frame.`}
              />

              <Steps
                items={[
                  {
                    title: 'Try the largest size first',
                    body:
                      'Nine candidate root sizes, largest to smallest. The first that fits wins, so slides are as legible as their content allows.',
                  },
                  {
                    title: 'Score the arrangements',
                    body:
                      'A slide with an image has several possible arrangements — image beside the text, above it, or dominant. Candidates are measured and scored against the image’s real aspect ratio rather than always reserving a fixed 40% column.',
                  },
                  {
                    title: 'Paginate only as a last resort',
                    body:
                      'If even the floor size overflows, blocks are packed into pages. All pages of one slide then settle on the smallest winning root size, because type that changes size mid-thought looks like a bug.',
                  },
                ]}
              />

              <Sub>Maths and code</Sub>
              <P>
                Equations are not drawn as plain text. A small parser builds an expression tree —
                fractions, roots, superscripts, subscripts, Greek, operators — and a layout pass
                positions each piece the way a typesetter would, so a fraction has a real rule and
                an exponent sits where an exponent belongs. Fenced code goes through a tokeniser
                first and is drawn with syntax colours and a line gutter.
              </P>

              <Callout kind="why" title="Why the fonts are awaited before the first measurement">
                Canvas text measurement uses whatever font is currently resolvable. Measure before
                the web fonts have loaded and every calculation is done against fallback metrics —
                the layout then fits perfectly for a font nobody will see. The engine waits for the
                real families first.
              </Callout>
            </Section>

            {/* ---------------------------------------------------- 07 */}
            <Section
              id="timeline"
              number="07"
              title="Stage five — timing and sync"
              lead="Slides and narration are produced independently, so something has to guarantee they line up. That something is a weighted timeline."
            >
              <P>
                Each slide arrives with a measured narration duration. If its content fitted on one
                page, that page simply owns the whole window. If the fitter had to split it, the
                window is divided between the pages in proportion to how much content each one
                carries.
              </P>

              <CodeBlock title="building the timeline" language="javascript" code={TIMELINE_SAMPLE} />

              <P>
                A page&apos;s <span className="ff-code">weight</span> is its number of laid-out
                blocks, plus one if it carries an image. The result is that a dense page holds the
                narration longer than a sparse one, and the sum of the pages always equals the
                original audio length exactly — so no drift can accumulate, no matter how the
                fitter paginated.
              </P>

              <Sub>Reveal and hand-off</Sub>
              <P>
                Within its window, a page writes itself on: blocks appear in sequence over a reveal
                period of roughly a quarter-second per block, bounded to between 0.65s and 2.6s and
                never allowed to exceed 55% of the page&apos;s own span. In the last 260ms before a
                cut, the outgoing page fades out, so slides hand over rather than snap.
              </P>

              <Callout kind="note" title="What the viewer sees">
                Content appearing as it is narrated, a thin progress rail and a slide counter along
                the bottom edge, and a soft transition between slides. All of it is drawn by the
                same paint pass that draws the text — there is no video editor and no template.
              </Callout>
            </Section>

            {/* ---------------------------------------------------- 08 */}
            <Section
              id="frames"
              number="08"
              title="Stage six — painting frames"
              lead="At 30fps, a four-minute lesson is about 7,200 frames. Painting each one from scratch would be both slow and pointless."
            >
              <P>
                Only the reveal window is genuinely animated. Once a page has finished revealing it
                is a static image for the rest of its span, so those frames collapse to a single{' '}
                <span className="ff-code">drawImage</span> from a pre-baked canvas instead of
                replaying hundreds of paint operations.
              </P>

              <P>
                Baking every page up front would be the simple version, and it would also be a
                memory leak by design: at 1080p each canvas is roughly 8MB, so a long lesson would
                hold hundreds of megabytes for no reason. Frames are produced in time order and
                never revisit an earlier page, so the cache only has to hold a sliding window of
                two.
              </P>

              <CodeBlock title="the bake cache" language="javascript" code={BAKE_SAMPLE} />

              <Callout kind="why" title="Why the discarded canvases are resized to zero">
                Deleting the map entry drops the reference, but the browser may hold the backing
                store for a while. Setting width and height to zero releases the pixels
                immediately, which is what keeps memory flat across a long render instead of
                sawtoothing towards a crash.
              </Callout>
            </Section>

            {/* ---------------------------------------------------- 09 */}
            <Section
              id="encode"
              number="09"
              title="Stage seven — encoding the MP4"
              lead="The final step turns the painted frames and the narration track into one downloadable file, using the browser's own hardware encoder."
            >
              <P>
                The original pipeline captured frames as WebP data URLs and handed the pile to
                ffmpeg.wasm — roughly 80KB per frame, which is why capture had to be pinned at a
                couple of frames per second. WebCodecs&apos; <span className="ff-code">VideoEncoder</span>{' '}
                hands back compressed chunks as it goes, so memory stays flat and a muxer can stream
                them straight into an MP4.
              </P>

              <CodeBlock title="codec selection and bitrate" language="javascript" code={ENCODE_SAMPLE} />

              <P>
                Four H.264 profiles are tried in order, from High 5.1 down to Baseline, and the
                first the browser accepts is used. That buys 30fps, hardware acceleration and output
                that plays on iOS — none of which the old WebM path could offer.
              </P>

              <Sub>When WebCodecs is missing</Sub>
              <P>
                Support is probed once at startup, before the UI reports the engine as ready. If the
                fast path is unavailable, ffmpeg.wasm is loaded on demand and the render runs at 6fps
                instead. It is slower and larger, but it produces a playable file rather than an
                error — and because the check happens up front, the 25MB WebAssembly core is never
                downloaded by the browsers that do not need it.
              </P>

              <Callout kind="note" title="One header requirement">
                ffmpeg.wasm needs <span className="ff-code">SharedArrayBuffer</span>, which browsers
                only expose to cross-origin-isolated pages. The app therefore sets{' '}
                <span className="ff-code">COOP: same-origin</span> and{' '}
                <span className="ff-code">COEP: credentialless</span> — the credentialless variant
                keeps isolation while still allowing third-party scripts such as Clerk&apos;s to
                load.
              </Callout>
            </Section>

            {/* ---------------------------------------------------- 10 */}
            <Section
              id="auth"
              number="10"
              title="Accounts and access"
              lead="Sign-in is handled by Clerk, which owns credentials, sessions and the account UI. The app only decides which routes need one."
            >
              <P>
                The frontend holds a publishable key only — safe to ship, and useless on its own.
                Clerk stores the session and exposes it through React hooks; the app never sees a
                password, and there is no bespoke token handling to get wrong.
              </P>

              <Sub>Protecting a route</Sub>
              <CodeBlock title="the route guard" language="javascript" code={GUARD_SAMPLE} />

              <SpecTable head={['Route', 'Access']} rows={ROUTES} />

              <Callout kind="why" title="Why the docs page is public">
                The studio needs an account, because a video library belongs to a person. This
                write-up does not: anyone given the link — a teacher, a reviewer, a classmate —
                should be able to read how the system works without signing up for anything.
              </Callout>

              <P>
                Clerk&apos;s own components are themed through its appearance API using the same
                palette as the rest of the product, and the theme toggle drives both at once. That
                is why the sign-in card matches the app instead of looking like a bolted-on widget.
              </P>
            </Section>

            {/* ---------------------------------------------------- 11 */}
            <Section
              id="stack"
              number="11"
              title="The stack, file by file"
              lead="Where to look if you want to read the real thing."
            >
              <SpecTable head={['Path', 'Responsibility']} rows={FILES} />

              <Facts
                items={[
                  { value: 'React 19', label: 'Vite + SWC frontend' },
                  { value: 'Tailwind v4', label: 'One token set, two themes' },
                  { value: 'Express 5', label: 'Streaming NDJSON API' },
                  { value: 'Clerk', label: 'Sessions and account UI' },
                ]}
              />

              <P>
                Both halves are deliberately small. The backend is four agent classes and one
                controller; the frontend&apos;s render engine is a handful of pure modules with a
                single React hook conducting them. Nothing in the render path depends on React,
                which is what makes it testable — there is a script that renders slides to a static
                preview page without a browser UI at all.
              </P>
            </Section>

            {/* ---------------------------------------------------- 12 */}
            <Section
              id="limits"
              number="12"
              title="Limits, and what comes next"
              lead="An honest list, because knowing where a system stops is part of understanding it."
            >
              <Callout kind="limit" title="Videos do not survive a reload">
                Finished files are held as in-memory object URLs for the session. Close the tab and
                they are gone, so anything worth keeping has to be downloaded. Persisting them per
                account is the obvious next step.
              </Callout>

              <Callout kind="limit" title="Generation is sequential">
                Narration and images are produced one step at a time to stay inside provider rate
                limits, which makes the AI stages the slowest part of the pipeline by a wide margin.
                A concurrency limit with retry-and-back-off would recover most of that time.
              </Callout>

              <Callout kind="limit" title="The fallback path is genuinely slower">
                Without WebCodecs the render drops to 6fps through ffmpeg.wasm. Watchable, and
                clearly worse — the fast path is the one that matters.
              </Callout>

              <P>
                Beyond those: narration is one voice with no per-slide pacing control, there is no
                editing pass between generation and export, and the layout engine currently targets
                a single 16:9 frame size. All three are tractable; none of them change the shape of
                the pipeline described above.
              </P>
            </Section>

            {/* Footer CTA */}
            <div className="mt-16 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-ink-900 p-6 sm:p-7">
              <div>
                <p className="text-[16px] font-bold text-mist-100">That is the whole system.</p>
                <p className="mt-1.5 text-[13.5px] text-mist-400">
                  The fastest way to check any of it is to generate something.
                </p>
              </div>
              <Link
                to="/app"
                className="group ml-auto flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-strong"
              >
                Open the studio
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </article>

          {/* Sticky chapter list */}
          <aside className="hidden lg:block">
            <div className="sticky top-[92px] max-h-[calc(100vh-120px)] overflow-y-auto pb-8">
              <DocsNav sections={SECTIONS} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
