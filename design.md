# RailPulse design system

## Product personality

RailPulse should feel like a calm, premium control room for a moving journey: precise like Linear, approachable like Apple Maps, and rich enough to make live data feel tangible.

## Visual language

- Dark navy canvas: `#07111F`
- Frosted cards: translucent blue-black gradients with `backdrop-filter: blur(22px)`
- Primary accent: mint `#72E7CC`
- Secondary accent: electric blue `#71A9FF`
- Warm status accent: amber `#D3A16D`
- Display type: Manrope
- Metadata: DM Mono
- Rounded corners: 18px for cards, 9–11px for controls

## Interaction principles

- Every live state shows when it was last updated.
- Motion should communicate position, loading, or state change—not decorate every element.
- Respect `prefers-reduced-motion` when the app is expanded.
- Use skeletons for map, status, and timeline loading.
- Use teal for “live/healthy”, amber for “delayed/attention”, and muted blue for inactive data.

## API key placement

Frontend-safe keys belong in `.env.local` using `VITE_` names. Secret provider keys belong only in `server/.env`; never expose them through frontend code. The current placeholders are documented in `.env.example` and `server/.env.example`.
