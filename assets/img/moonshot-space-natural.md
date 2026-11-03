# Natural moonshot background

- **Asset:** `moonshot-space-natural.webp`
- **Created:** October 29, 2026 (UTC+8)
- **Method:** Built-in OpenAI image generation tool, multi-image edit mode; two editing passes.
- **Purpose:** AI-generated decorative artwork informed by NASA reference imagery. It is not a map, a scientific visualization, or a claim of cartographic accuracy. Chart axes, scores, labels and rocket are rendered separately.
- **Format:** WebP quality 83, 1652 × 952 pixels; the generated aspect ratio is preserved without stretching (target 1024:590).
- **Final generated source filename:** `exec-731990db-876d-456c-8a34-fb008ebf22c7.png`.

## Inputs and credits

1. **Composition/style edit target:** `moonshot-space-refined.webp`, the previous AI-generated backdrop in this repository.
2. **Earth geography and natural texture reference:** `nasa-blue-marble-west.jpg`, NASA's *Blue Marble* (2002), western hemisphere. Credit: NASA Goddard Space Flight Center, Reto Stöckli and Robert Simmon. [NASA source page](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/) · [Original reference image](https://assets.science.nasa.gov/content/dam/science/esd/eo/content-feature/bluemarble/images/globe_west_2048.jpg).
3. **Lunar surface reference:** `nasa-svs-full-moon-nearside.jpg`, NASA Scientific Visualization Studio / Lunar Reconnaissance Orbiter near-side lunar surface rendering. [NASA SVS source](https://svs.gsfc.nasa.gov/5587/).

The references guided surface appearance and geography. The output remains an AI-generated artistic interpretation, rather than an unmodified NASA image.

## First edit: full actual prompt

Use case: compositing and precise-object-edit.
Asset type: a refined decorative scientific website backdrop, not a scientific map.

INPUT ROLES:
Image 1 (moonshot-space-refined.webp) is the composition and style EDIT TARGET.
Image 2 (nasa-blue-marble-west.jpg) is the factual EARTH GEOGRAPHY AND NATURAL TEXTURE REFERENCE: NASA Blue Marble western hemisphere. Its coastlines and continent shapes are the strongest fidelity constraint.
Image 3 (nasa-svs-full-moon-nearside.jpg) is the factual LUNAR SURFACE REFERENCE: NASA LRO near-side Moon. Use the true lunar maria patterns and natural photographic surface, not its black surrounding background.

Create a new refined version of image 1, keeping the same landscape aspect ratio 1024:590 (about 1.7356:1), ideally 2048 by 1180 pixels. Preserve the general lower-left cropped Earth, small upper-right Moon, pale pearl-grey and cool mist-blue cosmic background, delicate diagonal Milky Way from lower-left to upper-right, subtle stars, and spacious low-contrast central area for overlaying a chart. All planets must stay spherical; no stretching.

1. EARTH — REAL GEOGRAPHY IS ESSENTIAL:
Rebuild the lower-left Earth using image 2's real land and ocean geometry, natural colors, cloud structure and proportions. It must be recognisably the real western hemisphere, with North America, Mexico, the narrow Central American land bridge, and South America connected correctly. Faithfully preserve the actual shapes and relative locations of the Gulf of Mexico, Florida, Baja California, Cuba, the Caribbean, northern South America and Brazil. Do not invent continents, islands, coastlines or mountain chains. Avoid the current image's inaccurate silvery branching vein patterns and fake exaggerated mountains. Use natural blue oceans, muted green/brown land, modest realistic relief, and thin soft white clouds like the NASA reference. Preserve the reference globe's geographic projection and basic orientation; adapt it naturally to the existing lower-left spherical perspective, with the Earth partially outside the left and bottom edges. It should feel grand but not occupy more of the chart than before: its visible right edge remains around 40–45% of canvas width. Give it only a fine, soft blue atmospheric rim.

2. MOON — MOVE UP AND INTEGRATE PHOTOGRAPHICALLY:
Move the Moon upward from its current position. Its center should be at approximately x=93% of canvas width and y=8.5% of canvas height. Its full circular diameter should be about 5.5–6% of canvas width. This places a small, distant Moon near the top-right with a natural margin above and beside it, never touching the edges.
Recreate its surface faithfully from image 3: actual irregular dark lunar maria and fine highland texture, a matte neutral silver-grey lunar surface, no generic giant crater-ball pattern. Do not paste the black background from the reference. The Moon must belong in the scene rather than look like a cut-out sticker: match the cool color temperature, overall exposure, low contrast, image texture scale and optical sharpness of the surrounding galaxy. Use the same gentle illumination from upper-left as Earth. Let the right side shade subtly, without a thick dark outline. The edge should be naturally optically resolved, not artificially crisp, fuzzy, or glowing. No lunar atmosphere, blue/white rim, halo, plastic gloss or metallic sheen. Keep enough surface detail to be recognisable but avoid high contrast that makes it look pasted on. Blend the shared scene lighting, not the literal moon silhouette.

3. REMOVE GLARE:
Completely remove the large bright sun/light bloom on the left above Earth, including the white hotspot, golden flare, lens flare, starburst and long light rays. Replace this region with a calm, evenly illuminated pearl-grey/mist-blue gradient and faint stars. No visible sun and no bright white blob anywhere. Keep the galaxy soft and gently luminous, never glaring. Illumination across the whole image should be gentle and coherent, with soft directional light from upper-left.

Maintain the premium restrained appearance and light-toned palette of image 1. The goal is realistic celestial textures in a harmonious decorative cosmic scene, not a black space photograph. Do not increase saturation or contrast. No extra celestial bodies, text, letters, numbers, logos, flags, chart axes, grid, data markers, rockets, ships, trails, orbital lines, trajectories, borders or watermarks.

## Second edit: full actual prompt

The first pass output, `exec-6e77bd54-cf99-4516-a072-a137d8fd8e49.png`, became image 1. The same Earth and Moon references were reused as images 2 and 3.

Use case: precise-object-edit.
Image 1 is the current edited light-blue space artwork. Image 2 is the true NASA Blue Marble geography and land-texture reference. Image 3 is the NASA LRO Moon-surface reference.
Keep image 1's exact 1024:590 aspect ratio, composition, planet locations, Milky Way, stars, left-side removal of glare, and all background colors. Make only TWO local finishing corrections:

A. The visible South American land and some North American land in image 1 still show artificial silver-white branching veins and exaggerated shiny ridges. Remove ALL these fake silver veins and invented crystalline-looking mountain ridges from land. Replace the land surface with the actual quiet, matte, realistic vegetation and terrain appearance seen in NASA image 2. The Amazon and Brazilian interior should be predominantly smooth dark forest green with subtly varied natural terrain, not a cracked or veined silver surface. Andes must follow the actual west coast, not form invented bright networks over the continent. Keep thin realistic white atmospheric clouds distinct from land, based on image 2. Preserve all actual coastlines, shapes, relative proportions and geographical connections: North America, Mexico, narrow Central America, South America, Gulf of Mexico, Florida, Cuba and Caribbean. No invented continents or islands. The result should clearly read as a real NASA-like globe, not fantasy terrain. Keep the overall existing globe position, size, spherical geometry and softly blue rim exactly.

B. The little Moon at upper-right should have the same position and size (center around x93%, y8.5%, about 5.5% of canvas width) and the actual lunar maria from image 3. Integrate it better into the pale blue scene: reduce its surface contrast and peak whiteness, gently tint its neutral grey toward the cool silver-blue of the ambient scene, reduce artificial edge crispness by matching the fine optical softness of other distant details, and remove any white lit outline. It must have no bright halo, dark stroke, hard sticker edge, or plastic rendering. Keep it clearly recognisable, with a naturally round silhouette, fine matte lunar texture, and coherent soft illumination from upper-left. Its surface should be quieter and less prominent than now, harmonised with the pale galaxy while still readable. Do NOT show the black background of the lunar reference.

No other modifications. Do not add any bright light, sun, bloom, flare, rays, text, chart, rocket, trajectory, extra celestial body, border, logo or watermark.
