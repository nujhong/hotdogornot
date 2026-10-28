# Object recognition research

Checked 28 October 2026. This is factual input to the EGM brainstorm for a personal, public-source “hotdog or not” hobby app with a changeable target. It does not settle the product design. No model inference, installation, deployment, or repository changes were performed.

## Findings that affect the product

| Option                                   | Changeable target                                                         | What the native result means                                                                       | Main unresolved tradeoff                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Jev 1.14 through Cloudflare AI Gateway   | A presence question can refer to a target supplied in the request.        | Noul returns the model’s yes probability; the application decides how to display uncertain values. | Images leave the browser; image support is experimental.                                                      |
| Transformers.js with CLIP in the browser | Candidate labels are supplied at runtime, including user-entered strings. | Scores rank the supplied descriptions against the image. They are relative to that candidate set.  | Local inference avoids a cloud image request, but a reliable arbitrary-target yes/no rule is not established. |

The supporting evidence and limits follow.

## Jev: a native presence question already fits

Cloudflare’s current canonical identifier is `typesafe/jev-1.14.0`, **without `@cf/`**. Its model page labels it **Third-party** and shows an image-presence Noul question with a typed answer containing `type: "noul"` and `noul`. The documented request contains `state`, `assets`, and `questions`; the native Cloudflare `/ai/run` endpoint wraps that input with the model identifier. This is directly relevant evidence for detecting a named object, although it is not an accuracy test on real user photos. [Cloudflare Jev 1.14](https://developers.cloudflare.com/ai/models/typesafe/jev-1.14.0/)

TypeSafe defines Noul as the probability of a yes answer: near zero means no, near one means yes, and near the middle means uncertainty. It has no separate confidence field. Questions may have optional true/false criteria, and instructions can include structured data. **Inference:** supplying a target alongside the photo and asking whether that target is visible is supported by these interfaces; no fixed label vocabulary is required. Thresholds remain an application choice. This research establishes neither calibrated accuracy for arbitrary objects nor a defensible user-facing “percent correct.” [Noul semantics](https://docs.typesafe.ai/primitives/noul)

Images work with all question types. They are experimental, described as suitable for prototypes, with request format and accuracy subject to change. TypeSafe requires `TypeSafe-Danger-Zone-Images: true`. Native assets can contain base64 image bytes and be referenced in state; the first-party JavaScript SDK also exposes `image()`, `noul()`, and `TypeSafeClient.systemOne()`, accepting bytes or a `Blob`/`File`. The SDK documentation demonstrates its own TypeSafe API, not the Cloudflare envelope. [TypeSafe images](https://docs.typesafe.ai/images), [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)

Documented image constraints are concrete: still PNG/JPEG, each side 280–1568 pixels, up to 16 MiB per image, and a 32 MiB request body. The service rejects out-of-range images rather than resizing them. It removes metadata without applying EXIF orientation, so uploaded pixels must already be upright. HEIC/WebP need conversion. These limits describe TypeSafe’s documented API; this research did not run a Cloudflare request to confirm transport-specific behavior. [Image limits and preparation](https://docs.typesafe.ai/images#limits)

Local evidence: the coordinating agent’s inspection of HashtagConnect at commit `dd49c1b039146e4f8f0427866e12db05828a9e4b`, plus this research’s read-only inspection, found the native Cloudflare endpoint, this model identifier, and the experimental image header already in use. Its image-first state ordering is a recorded localization experiment, **not a documented general API requirement**. Existing mocked tests verify request shapes, not live recognition accuracy.

## Browser classification: flexible labels are not a yes/no guarantee

Transformers.js runs ONNX models in the browser and exposes a native `zero-shot-image-classification` pipeline. Its documentation demonstrates CLIP with candidate labels supplied for each call. Consequently, a preset selector and a text field are both mechanically possible. Conventional `image-classification` instead returns the model’s configured labels. [Transformers.js overview](https://huggingface.co/docs/transformers.js/index), [pipeline API](https://huggingface.co/docs/transformers.js/api/pipelines)

The inspected Transformers.js 3.8.1 source applies softmax over CLIP’s candidate logits. **Mathematical consequence:** a single candidate receives a score of one regardless of whether it describes the image; changing the alternatives changes the score. A pair such as “hotdog” and “not hotdog” can be ranked, but that alone does not establish a trustworthy binary detector. The same source uses sigmoid for SigLIP rather than softmax; that difference alone still does not establish arbitrary-target calibration. [Versioned pipeline implementation](https://github.com/huggingface/transformers.js/blob/3.8.1/src/pipelines.js#L2241-L2281)

OpenAI’s CLIP model card explicitly notes dependence on class taxonomy, limitations in fine-grained classification and counting, and the need for task-specific evaluation. **Recommendation for discussion:** if browser-only processing is a priority, a small preset vocabulary is easier to evaluate than unconstrained targets. That is a scope recommendation, not a claim that presets guarantee accuracy. [CLIP model card](https://github.com/openai/CLIP/blob/main/model-card.md)

Browser execution defaults to CPU/WASM; WebGPU is an opt-in backend. Models and WASM files are fetched from hosted locations by default, with native configuration for hosting them yourself. Local inference can keep the selected photo on the device if the application never uploads it; model download traffic still exists. Mobile loading time, memory use, and inference speed were not measured. [Runtime behavior](https://huggingface.co/docs/transformers.js/index), [model and WASM hosting](https://huggingface.co/docs/transformers.js/v3.8.1/custom_usage)

## Camera and upload facts

- A file input can request an outward-facing camera with `accept="image/*"` and `capture="environment"`. Capture behavior is browser dependent and is not universally supported. A normal upload path remains useful. [MDN capture](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture)
- A live preview uses `getUserMedia()`, requires a secure context and user permission, and may fail when permission is denied or no camera is available. Live video and a one-photo capture are distinct product scopes. [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- `accept` is a file-picker hint, not validation or conversion. It does not ensure an uploaded phone image satisfies the selected model’s format and dimensions. [MDN accept](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept)

## Image handling and retention

- **AI Gateway:** logging is enabled by default and can include request/response content. `cf-aig-collect-log-payload: false` suppresses payload storage while retaining metadata; `cf-aig-collect-log: false` suppresses the entire log. The sibling app currently explicitly enables logs, so copying it unchanged would copy that behavior. [Gateway logging](https://developers.cloudflare.com/ai-gateway/observability/logging/)
- **Cloudflare-hosted Workers AI:** the documented standard-inference policy does not retain content beyond request processing and response delivery, subject to stated exceptions, and does not use it for training. Stateful features, Gateway logs, and caching have their own lifecycle. The page expressly distinguishes traffic forwarded to another provider. This policy must not be presented as proof of Jev’s retention. [Workers AI data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/)
- **TypeSafe:** its help page says Jev is not trained on customer requests/responses, while retention depends on applicable agreements, legal requirements, and any agreed zero-retention arrangement. No fixed image-retention duration was established here. [TypeSafe data handling explanation](https://help.typesafe.ai/articles/5974925716-how-is-submitted-data-used-or-retained)
- **Gateway zero-retention routes:** Cloudflare documents these for eligible Unified Billing requests using Cloudflare-managed credentials; they do not control Gateway logging. Jev 1.14 eligibility was not established from the inspected model page, so “images are never stored by the provider” would be unsupported. [Unified Billing retention](https://developers.cloudflare.com/ai-gateway/features/unified-billing/#zero-data-retention-zdr)

## Setup facts from the sibling app

The following versions and conventions are attributed to the coordinating agent’s inspection of HashtagConnect commit `dd49c1b039146e4f8f0427866e12db05828a9e4b` and installed packages: Void 1.2.1, React 19.2.4 range, Vite+ 1.3.0 range, Motion 14.6.0, Zod 4.6.7 range, pnpm 11.25.0, and Node ≥24.21.0. Scripts are `check: void prepare && vp check`, `test: vp test`, and `build: vp build`.

Void supports `sourceDir: 'src'`: source conventions such as pages, routes, and environment schema move there, while project configuration, public assets, and local `.env` remain at the root. All convention directories are optional. These are framework conventions, not an argument for adding unused databases, authentication, or queues. [Void configuration](https://void.cloud/reference/config#sourcedir), [Void structure](https://void.cloud/reference/structure)

Reusable project preferences are native library interfaces, `~/` cross-directory imports, colocated unit tests, root integration tests, preserved doc comments, and required check/test commands. X-specific and authentication-specific rules need adaptation to this app. Oxlint’s native `unicorn/filename-case` can enforce `kebabCase` without custom tooling. [Oxlint filename rule](https://oxc.rs/docs/guide/usage/linter/rules/unicorn/filename-case)

## Questions raised for EGM

These questions were open when research finished. Subsequent user decisions are recorded in the [design draft](../designs/recognition.md).

1. Does changing the target mean a few playful presets, any typed object, or both?
2. Does “yes” mean present anywhere in the picture, or the main photographed subject?
3. Should uncertain evidence produce “can’t tell,” or must every result be binary?
4. Is the experience a single camera/uploaded photo, or does live scanning matter?
5. Is on-device image processing a priority, or is provider processing acceptable for this hobby app?

**Recommendation, not a settled design:** start the discussion with Jev’s native presence question because it matches the sibling integration and the requested decision directly. Keep its experimental image status visible in the decision. A small, representative set of positive, negative, and ambiguous photos would be needed later to judge behavior. This research provides no measured accuracy, latency, or per-photo cost.
