# TUNER

A browser tuner in the visual language of silver Japanese hi-fi components, as requested by the owner. The instrument is the page's primary object. Keep existing routes and navigation labels.

## Materials and hierarchy

A single continuous brushed aluminium faceplate sits in a shallow charcoal cabinet. Smoked green glass contains every luminous element. Black printed legends and ordinary sans-serif text belong on metal; segmented DSEG numerals belong in the display. The standard sans-serif reflects equipment lettering, not a terminal interface. No floating settings cards, neon panel borders, marketing hero, or decorative animations.

The first view contains the brand, function selector, note and octave, frequency, cents scale, input meter, microphone switch, input selector, and reference pitch. On narrow screens, readouts stack and input selection moves below the power and reference controls. Native buttons, selects, a keyboard-accessible range, and a number field preserve familiar browser operation.

## Tokens

- Backdrop: `#292c2b`
- Metal: `#c3c4bd`, highlights `#d8d9d0`, shadows `#b4b7ae`
- Printed ink: `#30332f`; secondary ink: `#53564f`
- Glass: `#101c18`; display labels: `#8fa99e`
- Phosphor: `#9bdfc9`; inactive segments: `#1b302b`
- Warning: `#e4ad71`, reserved for input peaks
- Corners: 1–4 px on manufactured parts, circular only on lamps and the dial
- Interface type: Helvetica Neue / Helvetica / Arial; measurements use tabular monospace; segmented readouts use locally hosted DSEG14 and DSEG7

## Interaction

The microphone switch starts off. Its lamp only illuminates when capture is active. Connecting, permission failures, silence, live pitch, and in-tune states are distinct. The dial and numeric field share persisted A4 calibration (432–446 Hz); reset returns it to 440 Hz. No generated signal is shown as a measurement. Audio remains local.

Keep the display steady; updates should come from the musician. Honor reduced motion, forced colors, visible keyboard focus, and touch targets. The waveform route is an honest unavailable state until its processing exists.
