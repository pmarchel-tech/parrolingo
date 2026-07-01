---
name: Hikari Kaigo Learn
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#9d2940'
  on-tertiary: '#ffffff'
  tertiary-container: '#bd4257'
  on-tertiary-container: '#ffeded'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadc'
  tertiary-fixed-dim: '#ffb2b9'
  on-tertiary-fixed: '#400010'
  on-tertiary-fixed-variant: '#891933'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  japanese-display:
    fontFamily: Noto Sans JP
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 52px
  label-md:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 20px
  gutter: 16px
  card-padding: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 40px
---

## Brand & Style

The design system is engineered for Indonesian migrant workers entering the Japanese elderly care (Kaigo) sector. The brand personality is **Encouraging, Professional, and Empathetic**. It balances the rigor of professional certification with an accessible, gamified atmosphere to reduce learning anxiety.

The visual style is **Soft-Modern & Illustrative**. It draws from the friendly geometry of the "Lingo" reference, using high-saturation accents against a serene, high-key backdrop. The interface prioritizes clarity and a sense of progress through large, tactile touch targets and pop-art inspired iconography that resonates with a mobile-first demographic.

## Colors

The palette is designed to be vibrant and motivating while ensuring maximum legibility for study sessions.

- **Primary (Vibrant Blue):** Used for navigation, core action buttons, and progress tracking. It represents professionalism and trust.
- **Secondary (Lush Green):** Dedicated to "Correct" states, achievement milestones, and the health/care aspect of the Kaigo sector.
- **Tertiary (Coral Pink):** An energetic accent for alerts, streaks, and "New" indicators, providing a friendly contrast to the cooler tones.
- **Background (Soft Off-White):** A light gray/off-white (`#F8FAFC`) is used for the base surface to reduce eye strain compared to pure white while maintaining a bright, modern aesthetic.

## Typography

This design system utilizes a dual-font strategy to optimize for both personality and utility.

- **Quicksand** is the primary display face. Its rounded terminals provide a friendly, approachable character for headers and UI labels.
- **Noto Sans** serves as the functional workhorse for body text. It is chosen for its exceptional clarity in both Indonesian and Japanese (Kanji/Kana) scripts, ensuring that complex characters remain legible even on smaller mobile screens.

For learning modules, **Japanese-display** tokens should be used to make Kanji prominent and easy to inspect. Mobile-specific scaling reduces `headline-xl` to 28px to prevent awkward wrapping in Indonesian, which often features long word lengths.

## Layout & Spacing

The layout follows a **Fluid Mobile-First Grid** optimized for PWA usage. 

- **Grid:** Use a 4-column grid for mobile and an 8-column grid for tablet/desktop. 
- **Safe Zones:** A 20px horizontal margin ensures content does not hit the edge of the screen.
- **Vertical Rhythm:** A strict 8px baseline grid is used. Cards and components should use `stack-md` (24px) for vertical separation to maintain an airy, "bright" feel.
- **Interactive Density:** Tap targets are a minimum of 48px in height, reflecting the tactile nature of the "Lingo" inspiration and ensuring accessibility for users who may be using the app during quick breaks at work.

## Elevation & Depth

This design system uses a combination of **Tonal Layering** and **Ambient Shadows** to create a friendly, physical presence.

- **The Primary Layer:** Elevated cards use a "Soft-Pop" shadow. This is an extra-diffused shadow with a slight blue tint (`rgba(37, 99, 235, 0.08)`) to keep the "bright" aesthetic without the "dirty" look of pure black shadows.
- **The Secondary Layer:** Background elements or inactive cards use subtle low-contrast outlines (1px solid `#E2E8F0`) with no shadow to appear "recessed."
- **Interactive State:** When pressed, buttons and cards should lose their shadow and translate 2px downward to mimic a physical button press, enhancing the tactile feedback.

## Shapes

The shape language is defined by **Extreme Roundedness (Pill-shaped)**. 

- **Primary Containers:** Cards and large modal surfaces use a `32px` (2xl) or `48px` (3xl) radius to evoke a soft, non-intimidating feel.
- **Small Elements:** Buttons and input fields use a fully pill-shaped profile (`rounded-full`).
- **Icons:** Icons should be contained within rounded-square frames with a 12px radius to maintain consistency with the overall soft geometry.

## Components

- **Buttons:** Large, pill-shaped buttons with high-contrast text. The "Primary Action" button uses a subtle 3D effect (a darker bottom border of 4px) to encourage tapping.
- **Learning Cards:** These are the centerpiece. Use a white background, `rounded-xl` corners, and the "Soft-Pop" shadow. They should contain ample white space around Japanese characters.
- **Chips / Selection Tags:** Used for multiple-choice answers. Use a light primary-tint background (`#EFF6FF`) with a bold primary border when selected.
- **Input Fields:** Soft gray backgrounds (`#F1F5F9`) with no borders unless focused. On focus, use a 2px primary blue border.
- **Progress Bars:** Thick (12px), rounded tracks using the secondary green color to represent growth and completion.
- **Pop-Art Icons:** Use thick 2pt strokes with "offset" color fills (where the color doesn't perfectly align with the stroke) to create a playful, hand-drawn professional look.
- **Flashcards:** Specialized components with a distinct flip animation, using "Tertiary Coral" for the "back" side to signal a change in state.