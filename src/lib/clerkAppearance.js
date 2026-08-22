/**
 * Clerk styling.
 *
 * Clerk renders its own DOM, so it cannot read our Tailwind tokens the way our
 * components do — its palette is handed over as literal values through the
 * `appearance` API. The two objects below are the same colours as the
 * `@theme` block in `index.css`; if a token changes there, change it here too.
 *
 * Only `variables` carries colour. Element overrides are kept to layout and
 * type so a future Clerk release restyling its internals cannot break us.
 */

const SHARED_VARIABLES = {
  fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  fontSize: '14px',
  borderRadius: '0.625rem',
  colorTextOnPrimaryBackground: '#08080a',
};

const DARK = {
  colorPrimary: '#b4f24a',
  colorBackground: '#0e0e11',
  colorText: '#f4f4f5',
  colorTextSecondary: '#8b8b96',
  colorInputBackground: '#141418',
  colorInputText: '#f4f4f5',
  colorNeutral: '#f4f4f5',
  colorDanger: '#fca5a5',
  colorSuccess: '#b4f24a',
  colorShimmer: 'rgb(180 242 74 / 0.16)',
};

const LIGHT = {
  colorPrimary: '#599b00',
  colorBackground: '#ffffff',
  colorText: '#17171a',
  colorTextSecondary: '#6b6b76',
  colorInputBackground: '#f7f7f8',
  colorInputText: '#17171a',
  colorNeutral: '#17171a',
  colorDanger: '#b91c1c',
  colorSuccess: '#437800',
  colorShimmer: 'rgb(89 155 0 / 0.14)',
};

/** Shared element overrides — Tailwind classes, so they follow the live theme. */
const ELEMENTS = {
  rootBox: 'w-full',
  cardBox: 'w-full shadow-none border border-line rounded-2xl',
  card: 'bg-ink-900 shadow-none border-0',
  headerTitle: 'text-[20px] font-bold tracking-[-0.02em] text-mist-100',
  headerSubtitle: 'text-[13.5px] text-mist-400',
  socialButtonsBlockButton:
    'border border-line bg-ink-850 text-mist-100 hover:bg-ink-800 transition-colors',
  socialButtonsBlockButtonText: 'text-[13.5px] font-medium',
  dividerLine: 'bg-line',
  dividerText: 'text-[11.5px] uppercase tracking-[0.14em] text-mist-500',
  formFieldLabel: 'text-[12.5px] font-medium text-mist-300',
  formFieldInput: 'border border-line bg-ink-850 text-[14px] text-mist-100',
  formButtonPrimary:
    'bg-accent text-on-accent text-[13.5px] font-semibold normal-case tracking-normal shadow-none hover:bg-accent-strong',
  footerActionText: 'text-[13px] text-mist-400',
  footerActionLink: 'text-[13px] font-semibold text-accent-fg hover:text-accent-strong',
  identityPreview: 'border border-line bg-ink-850',
  formResendCodeLink: 'text-accent-fg',
  otpCodeFieldInput: 'border border-line bg-ink-850 text-mist-100',
  userButtonPopoverCard: 'border border-line bg-ink-900 shadow-none',
  userButtonPopoverActionButton: 'text-mist-300 hover:bg-ink-800 hover:text-mist-100',
  userButtonPopoverFooter: 'hidden',
  badge: 'bg-accent-soft text-accent-fg',
};

export const clerkAppearance = (theme) => ({
  layout: {
    socialButtonsVariant: 'blockButton',
    logoPlacement: 'none',
    shimmer: true,
  },
  variables: { ...SHARED_VARIABLES, ...(theme === 'light' ? LIGHT : DARK) },
  elements: ELEMENTS,
});
