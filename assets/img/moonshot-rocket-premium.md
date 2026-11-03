# Premium moonshot rocket

- **Asset:** `moonshot-rocket-premium.webp`
- **Created:** October 29, 2026 (UTC+8)
- **Method:** Built-in OpenAI image generation, followed by a cutout refinement edit; transparent background.
- **Source:** Initial generation `exec-2886f01f-b6be-4721-a582-1ae3b12138c1.png`, followed by cutout refinement `exec-2dbac335-e27e-4424-83a9-4a0b3544a65d.png`.
- **Encoding:** Transparent-margin crop, proportional resize to 640 × 180 and WebP quality 92; alpha preserved (about 20 KiB).
- **Placement:** The nose points right. The chart rotates the sprite and aligns its nose with the leading policy's actual SR/LSCR coordinate.

## Cutout refinement prompt

Use case: precise-object-edit and background-extraction.
The supplied image is the edit target, a premium silver-white rocket pointing RIGHT on an alpha background. Preserve the rocket's exact overall design, shape, proportions, horizontal orientation, silver fuselage, graphite underside, small rear fins, tiny blue engine, and nose direction.
Improve ONLY the cutout quality: remove all stray white rectangles, white fragments, hard matte artifacts, floating specks and bright ragged cutout fringes outside the true physical silhouette, especially along the top edge. The exterior contour must be clean, smoothly antialiased and professional for compositing on a pale blue background. The surrounding canvas must have genuinely transparent alpha, not a black or white matte. Preserve complete nose and fins. Keep the rightmost nose tip at the horizontal centerline. No text, logo, extra object or scene.

## Generation prompt

Use case: product-mockup.
Asset type: a transparent spacecraft sprite for a premium academic robotics leaderboard over a pale blue cosmic backdrop.
Create ONE beautifully engineered contemporary reusable lunar rocket, rendered as a refined photorealistic aerospace product. This must look markedly more sophisticated than a segmented missile or a toy icon. An elegant elongated continuous satin pearl-white and brushed titanium fuselage, a sculpted smooth ogive nose, a restrained dark graphite ceramic underside, a few precise panel seams, two small integrated swept rear stabilizers, carefully controlled silver highlights, realistic material depth, and a compact precision engine. Sophisticated clean industrial design, graceful proportions, visually readable when displayed at about 100 pixels long. Main body length to thickness approximately 4:1, not an excessively thin needle. Very subtle cool blue engine glow immediately at the tail; no long exhaust trail. No oversized windows or visible random mechanical bands.
Composition: strict horizontal longitudinal axis, nose tip facing exactly RIGHT, engine exactly LEFT, slight three-quarter side view for depth while the silhouette remains horizontal. Show the entire single vehicle, without cropping any fin, nose or engine. The rightmost point of the solid vehicle is the clean nose tip at the centerline; the website will use that tip as the data-point anchor. Place the spacecraft alone in a wide composition with modest transparent margin.
Lighting: soft upper-left studio key light and restrained cool rim light, suitable for a luminous mist-blue starfield. Avoid harsh specular bloom or dark muddy metal.
Output: genuinely transparent alpha background. No ground, backdrop, space, stars, Moon, Earth, trajectory, frame, text, logo, symbols, watermark or diagram. No cockpit bubble, no cartoon, no toy, no generic silver bullet, no oversized aircraft wings.
