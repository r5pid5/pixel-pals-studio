# Pixel Pals Studio direction

The editor is a quiet working surface for a substantial, editable 3D character. Use a warm off-white framed workspace, charcoal typography, and a single terracotta action accent. The character is the focal asset, not a decorative background.

Desktop sequence: compact masthead, clear Korean title and short purpose, large 3D preview beside a fixed-width control panel, playback strip and compact atmosphere selector, understated footer. Mobile keeps the preview first, then a full-width control panel. Preserve every editor and export action.

Typography: locally hosted Pretendard Variable, 38px title, 18px panel title, 13–14px controls, 11px technical labels. Avoid tiny lavender text, decorative stars, pill-heavy cards, and oversized soft shadows. Use 1px warm-gray dividers, 8–12px corners, and consistent 8px spacing.

Motion: one restrained GSAP entrance with final content visible by default. Lenis is the only smooth-scroll engine; it excludes the WebGL viewport, editor scroll region, inputs, and reduced-motion users. Three.js provides the actual editable character and motion preview. No decorative WebGL background.

Model: preserve the supplied rounded PMX skull and small rigged body. Seat closed elliptical cone ears into sampled crown surfaces, preserving the rounded forehead and a subtle visual boundary at the roots. The ears and skull share one skin mesh and head bone; their closed surfaces overlap at the roots. Subdivide the rounded surface and use a controlled blend of smooth and face normals for visible low-poly facets. Use original pen-filled eye artwork with transparent gaps and no reflective highlights. Author editable eye, mouth, color, and mark textures. Sculpt a rounded bare torso, short touching feet and straight constant-width arms with rounded ends using the supplied bind pose and 22-bone hierarchy. Do not ship the provided characters as presets or their borrowed textures.

Asset provenance: provided local PMX geometry for the editing base; original accessory geometry and face textures; locally bundled Three.js, GSAP, Lenis and Pretendard. No reference site source or reference screenshots are site assets.

Raised hood: a loose continuous shell surrounding the face, with a gently arched top, long side contours and rounded lower corners. Keep clearance around the face; do not project its vertices onto skull triangles or divide it into tiers or three panels. Sweep the front opening around the head to a rear closure so the forehead has no separate cap. Retain the original ears outside. Skin the small shirt junction to the chest and the rest to the head.

Glasses variants: preserve the original round/square model's bridge, straight temples and placement. Sunglasses and tear frames replace only the planar front rims and lenses through that same model builder. No head-conforming ribbon geometry. Generate thumbnails with the same renderer/model/lighting in a worker when supported; retain a scheduled main-thread fallback and editable per-character geometry clones.

Trousers: sew both legs into one waist/crotch surface, with torso weights at the waist and leg weights towards each cuff. Overalls continue that same surface into front and back bib panels. Keep the inner shirt above the waist and trim only skin hidden by trousers, retaining the original visible feet and restoring all skin after removal. Attach pockets to actual cloth triangles. Flush pending model changes before capture/export/recording so files match the selected outfit.

