# Provider Provenance and Usage Boundary

- Status: Phase 0 decision record
- Last reviewed: 2026-08-09

This document records the source and license of the two projects evaluated for the
ChatGPT provider, and defines when a consumer-subscription-backed provider may be
developed, enabled, or distributed.

It is an engineering release gate, not legal advice. Service terms vary by account,
country, organization, and product and may change without a code change. Operators and
distributors remain responsible for reviewing the terms that apply to them.

## Upstream provenance

The following snapshot was inspected from clean local checkouts on 2026-08-09.

| Component | Upstream | Inspected commit | License | Intended relationship |
| --- | --- | --- | --- | --- |
| `chatgpt-imagegen` | [`leeguooooo/chatgpt-imagegen`](https://github.com/leeguooooo/chatgpt-imagegen) | `5b1ccb6ded09997317d35717b4b0183c268c0e9b` | MIT, copyright 2026 leeguooooo | Candidate source import into `packages/provider-chatgpt`, pinned to this commit before any modification |
| `chrome-use` | [`leeguooooo/chrome-use`](https://github.com/leeguooooo/chrome-use) | `a107f7e74ee014db68bdce8d0dd8c570f858afd0` | Apache-2.0; the inspected license carries a 2025 Vercel Inc. notice | Version-pinned external executable/runtime; do not vendor it into Flow2API |

### `chatgpt-imagegen` facts

- The inspected revision identifies itself as version `0.21.2`.
- It is a single Python 3 script with a standard-library implementation and a separate
  Python test module; it has no `pyproject.toml` or installable Python package boundary.
- Its default `web` backend invokes `chrome-use`, drives a logged-in ChatGPT browser,
  creates or selects a ChatGPT Project, submits prompts through the page, retrieves the
  resulting asset, and normally removes the generated conversation.
- Its `codex` backend reads and refreshes the local Codex OAuth file and calls an
  undocumented `chatgpt.com/backend-api/codex/responses` surface.
- Its `auto` routing may move from the browser path to the Codex path when the browser is
  unavailable. Flow2API must remove that implicit cross-billing-pool fallback.
- It contains online update and community-style-gallery behavior. Both are outside the
  initial provider import and must remain disabled unless separately reviewed and
  explicitly enabled by the operator.
- The upstream README itself labels the internal endpoint unsupported and warns against
  using a ChatGPT subscription for a public-facing generation service.

When source is imported, preserve the upstream MIT license text, copyright notice,
commit identifier, and a list of modified files in the distributed source and binary
notices. Keep enough compatibility tests to distinguish upstream behavior from local
changes.

### `chrome-use` facts

- The inspected npm metadata identifies version `1.5.87`, while the primary native CLI
  is implemented in Rust.
- It controls a real Chrome session through a Chrome extension, `chrome.debugger`, a
  native-messaging host, and local per-session daemons/sockets.
- The inspected extension notice attributes portions of its debugger/target handling to
  `openclaw-browser-relay` under MIT and says the transport was rewritten from a
  localhost WebSocket to Chrome native messaging.
- Its repository includes a native binary release process, browser extension, host
  installer, and platform-specific behavior. Absorbing those into this repository would
  create a second release and browser-security boundary.

Flow2API therefore treats `chrome-use` as an optional external executable with a
configured minimum and tested version. The process adapter may invoke a small,
allowlisted subset of commands; it must not expose the executable as a generic remote
browser or shell facility. If a future installer bundles `chrome-use`, that change
requires a new dependency review and compliance with Apache-2.0 redistribution,
attribution, notice, and modified-file obligations.

Open-source permission for either codebase does **not** grant permission to automate or
resell the services those tools access.

## Product terminology

Provider names, execution surfaces, and model names must not be used interchangeably.

- **Google Flow** is the consumer creative service at `labs.google/fx/flow`. It is a
  service surface and project/artifact system, not a model and not this repository's
  worker protocol.
- **Gemini Apps** means Google's consumer Gemini web, mobile, and related app
  experiences. Google lists the Google Terms of Service and Generative AI Prohibited
  Use Policy as applying to Gemini Apps.
- **Gemini models** may power Gemini Apps, Google Flow, Google APIs, or other products.
  A model family name does not transfer the terms or credentials of one surface to
  another.
- **Gemini API / Vertex AI** are developer products with their own contracts,
  credentials, billing, and supported interfaces. They are not consumer-subscription
  fallbacks.
- **Nano Banana** is a product/model nickname used by Google for image-generation
  capabilities. It must be represented as a model or alias under the provider surface
  that actually executes it, not as an authentication or provider type.
- **GeminiGen** is an existing Flow2API compatibility label. Until migrated, it must be
  documented as a legacy integration name; it must not imply that it is Google's
  supported Gemini API.
- **ChatGPT Web**, **ChatGPT Codex subscription**, and the **OpenAI API** are separate
  execution and billing surfaces. Routing between them is never implicit.

Public model IDs must preserve that distinction, for example
`chatgpt/gpt-image-web` versus a future official-API model, and
`google-flow/<model-family>` versus a future `google-gemini-api/<model-family>`.

## Terms and policy snapshot

These links were reviewed on 2026-08-09. The applicable country/account version always
takes precedence.

### OpenAI consumer services

- [OpenAI Terms of Use](https://openai.com/policies/row-terms-of-use/) (published and
  effective 2026-01-01) govern consumer ChatGPT services outside the regions directed
  to separate European terms. They prohibit sharing account access, automatically or
  programmatically extracting data or output, bypassing protective measures, and
  circumventing limits or restrictions.
- [European Terms of Use](https://openai.com/policies/terms-of-use/) apply where stated
  on that page and must be reviewed separately.
- [OpenAI Usage Policies](https://openai.com/policies/usage-policies/) also apply and
  can be updated independently.
- [OpenAI Services Agreement](https://openai.com/policies/services-agreement/) governs
  APIs and named business/developer services. It expressly supports integrating the
  official API into customer applications subject to that agreement; it does not turn
  consumer ChatGPT or undocumented internal endpoints into an API entitlement.

The current consumer Terms' programmatic-extraction restriction is directly relevant
to `chatgpt-imagegen`'s browser backend. Running it on one person's laptop does not
remove that restriction. The undocumented Codex endpoint and a locally available OAuth
token likewise do not establish permission to build or redistribute an integration.

### Google consumer services

- [Google Terms of Service](https://policies.google.com/terms?hl=en) are effective
  2026-07-30 in the reviewed locale. They prohibit bypassing protective measures and
  automated access that violates machine-readable site instructions, among other
  restrictions.
- Google's [service-specific terms index](https://policies.google.com/terms/service-specific?hl=en)
  lists the general Terms and the Generative AI Prohibited Use Policy for Gemini Apps
  and Labs.google. Account or organization-specific terms may add requirements.
- The [Generative AI Prohibited Use Policy](https://policies.google.com/terms/generative-ai/use-policy?hl=en)
  applies to services that reference it.
- [Google Flow Help](https://support.google.com/flow/answer/16353333?hl=en) describes
  Flow as Google's AI filmmaking/creative service, its subscription/age/region
  requirements, credits, rate limits, and content-policy boundary.
- The [Google Flow data notice](https://support.google.com/labs/answer/17025472?hl=en)
  explains that prompts, uploads, outputs, and usage data may be processed and, based
  on user settings, reviewed or used to improve services. Operators must not assume
  that local execution makes submitted data private.
- The [Gemini Apps Privacy Hub](https://support.google.com/gemini/answer/13594961?hl=en)
  defines what Google currently calls Gemini Apps and points to the applicable terms.

Google's current terms do not constitute affirmative approval for an undocumented
consumer UI integration. Machine-readable instructions and in-product warnings are
part of the review and can change at any time. Flow2API must not bypass CAPTCHA,
rate-limit, safety, credit, region, age, or account protections.

## Local/private-use boundary

"Local" describes deployment topology, not permission. For a consumer-backed adapter,
the narrow technical boundary is all of the following:

- One human operator explicitly configures an account they are authorized to use.
- The control plane and worker are owned by that operator and are not exposed as a
  service to unrelated users.
- Provider cookies, browser profiles, OAuth tokens, and refresh tokens remain on the
  operator's execution machine.
- The adapter uses only the requested provider/account/billing pool and never evades
  provider limits or safety controls.
- The operator reviews the then-current terms, plan, region, organization policy, data
  handling, and rights to every submitted reference asset.
- Live consumer-provider tests are manual and opt-in; CI uses sanitized fixtures only.

Meeting this boundary reduces credential and resale risk. It does **not** override a
provider restriction on automation, extraction, or undocumented interfaces.

## Go/no-go release gate

The following gate applies independently to each provider and execution surface.

| Activity | Gate at this review | Requirement to change the gate |
| --- | --- | --- |
| Preserve or refactor the MIT `chatgpt-imagegen` source with attribution, without invoking a provider | **GO** | Keep license/provenance and ordinary security review |
| Keep `chrome-use` as a user-installed external executable | **GO** | Pin/test a version and constrain the process adapter; bundling requires a new license/supply-chain review |
| Run a developer-only ChatGPT Web spike | **NO-GO by default** | Explicit repository-owner authorization after reviewing applicable terms, or written/provider-specific permission; never run in CI or against another person's account |
| Ship or enable ChatGPT Web automation for end users | **NO-GO** | Written OpenAI authorization or authoritative terms for that exact supported surface permitting the integration |
| Ship the undocumented ChatGPT Codex subscription endpoint | **NO-GO** | A documented supported integration surface and terms that permit this use; no OAuth-file inference is sufficient |
| Offer a public, hosted, shared, paid, or multi-tenant endpoint backed by any consumer subscription | **NO-GO** | Written provider agreement explicitly permitting service provision/resale and an approved multi-tenant security/privacy review |
| Develop a private Google Flow compatibility adapter | **CONDITIONAL** | Operator opt-in, current terms/site-instruction review, own eligible account, no control bypass, and local-only execution; this is still unsupported and may break |
| Distribute Google Flow/Gemini Apps UI automation enabled by default | **NO-GO** | Written provider authorization or authoritative terms for the exact supported integration surface |
| Add a provider using an official OpenAI, Gemini, or Vertex API | **GO after review** | Use that API's own credentials, billing, terms, data policy, model IDs, and supported client surface; do not borrow a consumer session |

Implementation must fail closed when a gate is not satisfied. A disabled feature flag,
an "experimental" label, or an operator checkbox is not a substitute for provider
permission.

Before every release that adds or materially changes a consumer-backed provider, the
release owner must record:

1. the provider surface and country/account class reviewed;
2. the terms/policy URLs and effective dates;
3. whether the adapter is supported or undocumented;
4. the data, credential, quota, and artifact path;
5. the named approver and go/no-go decision; and
6. any required notice, attribution, feature flag, or removal plan.
