# Pixel Pals Studio direction

Studio editing: selecting a visible studio friend binds the existing character and accessory editor to that actor. Keep its transform, motion, speed and phase, every other actor, and the main character independent. Show the active friend's name above the tabs. Keep colors and accessory transforms live; coalesce geometry rebuilds by actor identity so changing selection cannot redirect an unfinished edit. Undo/redo belongs to each editing target. Background, filtering and shared playback remain scene settings. Export the selected model from a detached temporary avatar so the visible pose and studio transforms are not baked or reset. Returning to the main editor shows the main character and retains the studio arrangement.

The editor is a quiet working surface for a substantial, editable 3D character. Use a warm off-white framed workspace, charcoal typography, and a single terracotta action accent. The character is the focal asset, not a decorative background.

Desktop sequence: compact masthead, clear Korean title and short purpose, large 3D preview beside a fixed-width control panel, playback strip and compact atmosphere selector, understated footer. Mobile keeps the preview first, then a full-width control panel. Preserve every editor and export action.

Typography: locally hosted Pretendard Variable, 38px title, 18px panel title, 13–14px controls, 11px technical labels. Avoid tiny lavender text, decorative stars, pill-heavy cards, and oversized soft shadows. Use 1px warm-gray dividers, 8–12px corners, and consistent 8px spacing.

Motion: one restrained GSAP entrance with final content visible by default. Lenis is the only smooth-scroll engine; it excludes the WebGL viewport, editor scroll region, inputs, and reduced-motion users. Three.js provides the actual editable character and motion preview. No decorative WebGL background.

Model: preserve the supplied rounded PMX skull and small rigged body. Seat closed elliptical cone ears into sampled crown surfaces, preserving the rounded forehead and a subtle visual boundary at the roots. The ears and skull share one skin mesh and head bone; their closed surfaces overlap at the roots. Subdivide the rounded surface and use a controlled blend of smooth and face normals for visible low-poly facets. Use original pen-filled eye artwork with transparent gaps and no reflective highlights. Author editable eye, mouth, color, and mark textures. Sculpt a rounded bare torso, short touching feet and straight constant-width arms with rounded ends using the supplied bind pose and 22-bone hierarchy. Do not ship the provided characters as presets or their borrowed textures.

Asset provenance: provided local PMX geometry for the editing base; original accessory geometry and face textures; locally bundled Three.js, GSAP, Lenis and Pretendard. No reference site source or reference screenshots are site assets.

Raised hood: a loose continuous shell surrounding the face, with a gently arched top, long side contours and rounded lower corners. Keep clearance around the face; do not project its vertices onto skull triangles or divide it into tiers or three panels. Sweep the front opening around the head to a rear closure so the forehead has no separate cap. Retain the original ears outside. Skin the small shirt junction to the chest and the rest to the head.

Glasses variants: preserve the original round/square model's bridge, straight temples and placement. Sunglasses and tear frames replace only the planar front rims and lenses through that same model builder. No head-conforming ribbon geometry. Generate thumbnails with the same renderer/model/lighting in a worker when supported; retain a scheduled main-thread fallback and editable per-character geometry clones.

Trousers: sew both legs into one waist/crotch surface, with torso weights at the waist and leg weights towards each cuff. Overalls continue that same surface into front and back bib panels. Keep the inner shirt above the waist and trim only skin hidden by trousers, retaining the original visible feet and restoring all skin after removal. Attach pockets to actual cloth triangles. Flush pending model changes before capture/export/recording so files match the selected outfit.


Sleeping: separate head and body support heights only in the sleeping poses. Ground both on a single circular grassy patch with short blades and small daisies. Cache fitting outside the playback loop. Temporarily close eyes while preserving saved expression settings. Share one circle in group scenes.

Desserts: five families with four physically distinct fillings/toppings each. Model sponge/cream layers, curled rolls, baked crusts, fluted tart walls, piped cream, fruit seeds and stems in real geometry; batch by material. Increase the default body height to 1.50 and provide independent width/height controls. Keep the ceramic plate thin and topping heights stable. Derive character support from the actual central surface.

Ice cream: the original head forms the scoop, with two original rigged paws over a raised waffle-grid cone. Temporarily render only the body arms and hide clothing inside this costume. Restore every original geometry/visibility on exit, recolor and model export. The cone is a transient filming prop.

Sleep-cap cache: save full position, scale and quaternion; never replace a cached 0.07 pom-pom with a unit sphere.

Sleeping neck: fit torso overlap against the actual posed head surface once per sleeping configuration, compensating the head translation independently. A fixed tuck cannot cover all head/body proportions. Preserve exact standing geometry and restore before model export.

Strawberry sections: a closed half-volume, thick red outer skin, pink flesh, a broad rounded white teardrop center, tiny round seeds and a leafy crown. Increase width by 25% and reduce height by 18%. Reuse in every strawberry pastry and head cream. Filling pieces have no crown or seeds and face outward at both roll ends.

Social motion support: character-relative hand targets use the rig's topmost bone coordinate frame, which follows pastry elevation. Body-mounted and mouth-mounted prop targets use that same elevation. The kimbap plate follows the rig; the blanket stays on the ground. Adding a pastry must translate the standing/seated motion without changing its arm lengths or relative hand paths.

Studio sleep fitting: refresh ancestor transforms before recursively updating bones and attached skinned-mesh bind inverses. Fitting in local coordinates must be independent of initial parent placement, scale and yaw. Use a gentle prone cheek turn for floppy dogs so their long ears do not prop the skull above the neck.

Studio clothing: offer the same 18 clothes and none directly in the selected friend's controls, plus three fabric colors. Rebuild only that actor when changing style; immediately sample the current motion before rendering. Preserve actor placement, direction, scale, speed, current time and other friends. Update materials for colors, dispose replaced geometry/textures and serialize actor state through the existing project snapshot.
