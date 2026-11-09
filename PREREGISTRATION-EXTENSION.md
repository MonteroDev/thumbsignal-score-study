# Pre-registration — extension: a larger sample, factor confirmation and a tuned score

**Registered:** 2026-11-08
**Status:** FROZEN once committed. Nothing below may change after the first
Bedrock call of the extension run. Amendments go in `DECISIONS.md` with a date
and a reason, and are reported with the results.

Extends [PREREGISTRATION.md](PREREGISTRATION.md). Everything not restated here
(outcome variable §3, pair construction §4, exclusions §2.2, ties counted as
failures, aggregates-only publication §10) applies unchanged, so the extension's
pairs are built exactly like the published 321.

---

## 0. Why an extension

The published study (321 pairs, 60 channels) shows the score ranks the
better-performing video of a pair higher 59.5% of the time (pipeline
`1d2ab116494c`); today's pipeline measures 57.9% rounded and 62.0% unrounded on
the same pairs (DECISIONS.md, 2026-11-08). Three questions it cannot answer:

1. **Does the result hold on channels nobody chose by hand?**
2. **Which factors of a thumbnail really go with the winner?** On 321 pairs no
   aspect survives correction for 37 comparisons; detecting a 55% effect after
   correction needs roughly 800 to 1,600 pairs that differ on that aspect.
3. **Can the score itself rank better?** It weighs its twelve sub-scores by
   hand. Weights fitted on data might rank better, or might only fit noise;
   only data never used to fit them can tell.

The third question is the reason for the design below: **every change to the
score is chosen on one half of the new channels and judged once on the other.**

---

## 1. Hypotheses

**H1 (replication).** On the extension's pairs, today's score ranks the winner
higher more often than chance. Same test as the published study: integer
`globalScore`, ties are failures, two-sided exact binomial against 0.5,
α = 0.05, on **all** extension pairs (none of them was used to build today's
pipeline). The unrounded score is reported beside it, as secondary.

**H2 (a tuned score ranks better).** A score formula chosen on the development
set (§4) ranks the **holdout** pairs correctly more often than today's
unrounded score. Exact one-sided McNemar test on the holdout pairs where the two
formulas disagree, α = 0.05. If the chosen formula is today's formula, H2 is
not tested and that is reported.

**H3 (three aspects nominated by the published study).** On all extension
pairs, among pairs whose two thumbnails differ on the aspect, two-sided exact
sign tests, Bonferroni α = 0.05 / 3:

- H3a. A strong exaggerated expression (`faces.exaggeratedExpression = "strong"`)
  goes with the **loser** (published study: 39%).
- H3b. Overlay text that complements the title
  (`text.relationToTitle = "complements"`) goes with the **winner** (60%).
- H3c. A higher mean lightness (pixel measure, CIE L*) goes with the
  **winner** (57%).

**H4 (factors confirmed for the product).** Any other factor (a sub-score or a
measured aspect, §3) is called **confirmed** only if the development set
nominates it (§4) and its sign test on the holdout passes α = 0.05 / k, where k
is the number of nominated factors. Only confirmed factors may be described on
the site, in the product or in a sales argument as going with better-performing
videos. A factor that is not confirmed is described as "not shown to separate
videos", whatever its development result.

---

## 2. Sample: a frame built by a rule

Channels are not chosen by hand. `scripts/study/build-frame.mjs` reads YouTube's
"most popular" chart and applies this rule (rules 1-5, then the one top-up of
rule 6); its output
`studies/score-discrimination-ext/channels.resolved.json` is committed and is
the frozen sample.

1. Regions US, GB, CA, AU, IE, NZ, IN; categories Science & Technology,
   Education, Howto & Style, Gaming, Sports, People & Blogs, Entertainment,
   Comedy, Autos & Vehicles, Pets & Animals, Travel & Events; up to 200 charted
   videos per region and category. Music, News & Politics, Film, Nonprofits,
   Shows and Trailers are excluded (views follow releases and news cycles).
2. A channel enters if one of its charted videos declares an English audio (or
   default) language, it has at least 100,000 subscribers and 50 public videos,
   and it is not one of the published study's 60 channels.
3. Its category is the one it charted in most (ties alphabetical).
4. At most 520 channels, a seeded random subset (seed 20261108) if more.
5. Each channel is assigned, seeded, to **dev** or **holdout**, half each. A
   channel is never in both, so no channel's style can leak from one to the
   other.
6. **Top-up, once.** The charts are read again by rules 1-3, and every
   established channel not yet in the frame is appended after the first 520,
   in a seeded order (seed 20261109), alternately dev and holdout.
7. **Category cap: at most 400 pairs per category.** The harvest takes the
   channels in frame order; a category closes when it reaches 400 pairs or when
   the next channel would take it over, and that channel and every later one
   of the category are left out whole. This keeps exactly what dropping whole
   channels, last in frame order first, would keep.

**Why rules 6 and 7, and when they were added.** They were written on
2026-11-08, after a first harvest of the 520 channels and before this document
was committed and before any score. That harvest showed only how many pairs
each category yields (no score, no factor): 1,527 pairs, 546 of them (36%) in
gaming, because most charted channels in the other categories post mostly
shorts, which the harvest excludes. Left as it was, the study would mostly
describe gaming thumbnails. The rules change which channels are harvested,
never which pairs win.

**Budget cap, fixed now.** Scoring costs about $0.0069 per thumbnail and the
observation call about $0.0018. The extension spends at most **$60**, so it
scores at most **3,000 pairs**. If the harvest yields more, whole channels are
dropped in frame order (last first) until 3,000 or fewer remain, **before any
scoring**. Beyond the top-up of rule 6, nothing is added: a short sample is
reported as short.

**Known bias of the frame.** A chart over-represents channels popular in the
week it is read, and large ones. The population is therefore "established
English-language channels that chart", not every channel. Stated with the
results.

---

## 3. What is measured, per thumbnail

1. **Today's score**, through the product's own pipeline (`study:score`), with
   the thumbnail's own title: the twelve sub-scores, the contrast ceiling, the
   global score. The pipeline fingerprint is recorded.
2. **Observed facts**, by a separate call that asks the model for an inventory
   and never for a rating (prompt fixed in `scripts/study/observe.mjs`): faces
   (count, size, position, eyes, gaze, mouth, exaggerated expression), overlay
   text (word count, height, position, relation to the title), composition,
   graphic devices.
3. **Pixel measures** (sharp, free): lightness, saturation, colourfulness,
   palette size, edge density, empty space, edge share in the top half and the
   centre, duration-corner clutter, frame-border lightness.

Fields that answered "yes" for 100% of the published study's thumbnails
(`subjectStandsOutFromBackground`, `imageAloneRaisesAQuestion`,
`visibleWithBottomHalfCovered` as a non-empty answer) are recorded but not
tested.

---

## 4. Development and holdout

**Development data:** the published 321 pairs plus the extension's dev pairs.
Anything may be tried on it: removing the rounding, fitted weights on the twelve
sub-scores, adding measured aspects, different tie rules. Models are compared
by accuracy cross-validated **by channel** (a channel is never in both training
and test folds).

**Nomination.** A factor is nominated for H4 if its development sign test
reaches p < 0.01 (uncorrected). The nominated list is written to
`studies/score-discrimination-ext/frozen-model.json` with the chosen formula.

**Freeze, then open once.** The chosen formula and the nominated list are
written to `frozen-model.json`, its SHA-256 is recorded in `DECISIONS.md`, and
only then is any statistic computed on holdout pairs. The holdout is analysed
once. Development scripts filter holdout pairs out by `split`; H1 and H3, which
need no tuning, use all pairs and may be computed at any time.

**Simplicity rule.** Between two formulas within one percentage point in
development, the simpler is chosen (fewer fitted weights). A formula is not
better because it is more complex.

---

## 5. What would be reported as a failure

- H1 at 50%: "On a larger sample of channels chosen by a rule, the score did not
  rank the better-performing video above the worse one more often than chance."
  The site's figures are then corrected.
- H2 not met: the tuned formula is not shipped, and the result says the score's
  hand weights were not beaten on fresh channels.
- H3 or H4 not met for a factor: that factor is described as not shown, and no
  advice in the product claims it moves performance.

All of these are published whatever they show.

---

## 6. Limits

Those of the published study (§9 there) apply: observational, pairs selected on
the outcome, views snapshotted once, established channels only, English only.
A confirmed factor goes **with** better-performing videos; it is not shown to
**cause** them. Changing a thumbnail and measuring the click-through rate before
and after (FLOW-05, a creator's own channel) is the test that could.
