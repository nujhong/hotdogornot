# hotdogornot design

How the app should look, move and read. The [architecture](docs/architecture.md) covers the request flow and module boundaries.

## Intent

One photo, one object name, one binary answer. The whole experience revolves around the camera. The editable name and shutter should be obvious before the user reads any instructions.

## Brand

- The repository name is **hotdogornot**. The app wordmark reads **hotdog or not.**, with a lime full stop.
- The mark combines a hotdog with camera framing. Keep it simple enough to read at icon size.
- The tone is playful and direct. The joke comes from the question and answer; the controls stay familiar.

## Colour and type

| Role           | Colour               | Use                                                 |
| :------------- | :------------------- | :-------------------------------------------------- |
| Background     | Near-black `#111310` | The viewfinder's empty space and letterboxing       |
| Foreground     | White                | Labels, controls and the shutter                    |
| Accent / match | Lime `#c4ee85`       | Focus rings, active feedback and a positive verdict |
| No match       | Red `#d64a3a`        | A completed negative verdict                        |

Use the existing sans-serif stack. The object name and verdict carry the strongest type; hints and disclosures stay quiet. Colour always accompanies words and a symbol, so it never carries the answer alone.

## Camera and controls

- The viewfinder fills the viewport. Preserve the full camera frame and captured photo, with letterboxing when needed.
- Float the small wordmark and photo disclosure at the top. Centre the editable **Looking for** field below them.
- Put the circular shutter near the bottom, within easy thumb reach and clear of the device's safe area.
- Ask for camera access when the user chooses **Open camera**. Show a short recovery message if access fails.
- Keep the image visible while checking. Disable the shutter and name field until the check finishes.
- Show the verdict directly over that captured photo: **hotdog** or **Not hotdog**, using the captured object name. Editing the name afterward must never relabel an old result.
- **Take another photo** returns to the camera. A failed check offers a retry for the same photo and name.

## Copy, motion and access

Hints describe the next action: **Fill the frame. Take a photo.** A service failure says **No answer yet.** It is a separate state from a negative verdict.

Keep motion brief: a pressed shutter, a checking indicator and a small verdict entrance. Respect reduced-motion preferences. Use native controls, visible keyboard focus, touch-sized actions and announced results. Keep privacy details in the photo disclosure.

The [original design record](docs/designs/recognition.md) preserves the earlier research and implementation decisions; this guide describes the shipped camera experience.
