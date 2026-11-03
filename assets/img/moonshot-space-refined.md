# Refined moonshot background

- **Asset:** `moonshot-space-refined.webp`
- **Created:** October 29, 2026 (UTC+8)
- **Source:** Built-in OpenAI image generation tool, edit mode, two passes.
- **Source filename:** `moonshot-space-light.webp` (original AI-generated background).
- **Purpose:** Decorative backdrop only; chart axes, labels, scores and rocket are rendered separately.
- **Target ratio:** 1024:590. The generated image's original pixel ratio is preserved without stretching.
- **Encoding:** WebP, quality 83.
- **Final generated source filename:** `exec-43218637-aeb3-4ae3-ad00-f7d1390189a7.png`.

## Initial edit prompt

Use case: precise-object-edit.
Asset type: refined decorative background for an interactive academic benchmark scatter plot.
Input image 1 is the edit target: moonshot-space-light.webp.
Make a minimal, careful revision of this image. Preserve its attractive lower-left Earth, pale pearl-grey and mist-blue space palette, soft diagonal Milky Way glow, sunlight from the left, fine stars, and understated cinematic atmosphere. Do not redesign the composition or change the Earth's geography, natural texture, colour, sense of scale, or lower-left placement.

Required change 1 — aspect ratio:
Recompose the canvas to landscape aspect ratio exactly 1024:590 (approximately 1.7356:1), ideally 2048 by 1180 pixels. The current image is wider. Naturally extend and rebalance the quiet space vertically to achieve the new ratio without stretching, squashing, or distorting either planet. Keep Earth cropped naturally by the left and bottom edges, and preserve its visual scale as a grand lower-left presence. Preserve ample pale, low-contrast negative space throughout the central chart area and upper-left.

Required change 2 — realistic Moon only:
Replace the current somewhat artificial Moon with a credible astronomical photographic Moon, still small and distant in the upper-right and fully round, with comfortable empty space between it and both image edges. Its diameter should stay modest, about 7% of canvas width, much smaller than Earth's implied full sphere. The visible lunar surface must have recognisable naturally shaped broad darker-grey lunar maria, brighter ancient highlands, and fine-scale realistic impact crater texture; make it look like a high-quality telescope photograph of the actual Moon, not a generic crater-covered ball. Avoid repeated huge circular crater pits, bubble-like holes, toy-like grooves, or exaggerated relief. Use a single physically coherent light direction from the left, matching the existing sunlight; a subtly shaded right side and natural tonal transition convey a real sphere. No atmospheric halo: the Moon has no blue or white glowing rim, no clouds, no plastic gloss, no metallic shine, no exaggerated bloom, and no cartoon shading. Surface brightness should harmonise with the pale background while remaining clearly visible.

Everything else should remain visually faithful to the input: soft elegant pearl and fog-blue tones, subtle tiny stars, delicate diagonal luminous galaxy, realistic partly cropped Earth, premium restrained academic website background.
Do not add any text, letters, numbers, axes, chart grid, data labels, rockets, spacecraft, flight trails, orbit lines, trajectory paths, markers, flags, robotic hands, logos, borders or watermark. Do not introduce a black background, saturated purple, new celestial bodies or busy detail in the center. This is only a background image.

## Moon surface refinement prompt

The first edit output, `exec-3411bcc0-29fa-428a-a281-24446654db4c.png`, was used as the edit target for this pass.

Use case: precise-object-edit.
Input image is the edit target, a light-toned space background already composed at the desired 1024:590 aspect ratio.
Change ONLY the small Moon in the upper-right. Preserve absolutely everything else, including the Earth's exact position and texture, framing and image ratio, all stars, Milky Way, lighting, pale grey-blue colours and quiet background.
The present Moon looks like a fantasy crater ball. Replace its surface with a realistic photographed NEAR SIDE of Earth's actual Moon. Think of a familiar high-resolution telescopic photograph of the nearly full Moon: large irregular dark basaltic maria forming broad flat grey patches (Oceanus Procellarum at left, Mare Imbrium in the upper-left quadrant, Mare Serenitatis and Tranquillitatis toward the upper-right), surrounded by softly mottled lighter highlands. The dominant features must be these broad natural irregular dark plains, NOT giant circular holes or raised crater rims. Actual small impact craters should be fine speckled texture at this scale, mostly too small to resolve. A faint Tycho ray pattern low on the disc is acceptable. Matte chalky silver-grey surface, gently varied albedo, credible photographic softness, low contrast. The disc is fully round, with subtle shading darker on its right edge due to sunlight from the left. Keep the existing Moon's small size and exact placement. No lunar atmosphere, no white or blue glow around the rim, no glossy sheen, no plastic sphere, no oversized repeated circles, no cartoon. The realistic lunar texture must be completely different from the current exaggerated craters.
Keep the full output image at approximately 1024:590 aspect ratio, no distortion or stretching.
No text, chart elements, spaceship, rocket, trajectory, data markers, logos, or new objects. Do not edit anything outside the small Moon.
