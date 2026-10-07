# Pre-registration — does the ThumbSignal score discriminate over- from under-performing videos?

**Registered:** 2026-09-04
**Status:** FROZEN. Nothing below may change once the first Bedrock call of the
main run is made. Amendments go in `AMENDMENTS.md` with a date and a reason,
and any amendment made after data collection begins is reported in the article.

---

## 0. Why this document exists

The result of this study is going to be published as marketing. That is exactly
the situation in which a researcher — with no bad intent at all — tries six
slicings of the data and reports the one that worked. Writing the analysis down
before seeing any of it is the only mechanism that reliably prevents it.

The commit that adds this file is the timestamp. Its hash is quoted in the
article, and the reader can check that it precedes the commit adding the
results.

**The honest expectation is a small effect.** The thumbnail and title are a
minority of what determines a video's performance. A result near 60% is a real
finding. A result near 85% would mean the design has a leak in it, and would be
investigated as a bug before it was believed.

---

## 1. The claim under test

ThumbSignal tells a creator their packaging is strong or weak. The testable form
of that claim is not "the score predicts views" — nobody can predict views — but:

> **H1.** Given two videos from the *same* channel, published close together,
> one of which substantially outperformed that channel's own baseline and one of
> which substantially underperformed it, the score ranks the outperformer higher
> more often than chance.

**H0:** the score ranks the outperformer higher exactly 50% of the time.

### Why this and not a correlation against view counts

A correlation between score and raw views across channels measures **channel
size**, not thumbnail quality. Views are driven by subscriber count, topic,
upload timing, external traffic and video age, and the subscriber term is orders
of magnitude larger than the packaging term. Worse, the confound points the
flattering way: large channels can afford professional designers *and* have
large audiences, so the correlation would come out positive and mean nothing.

Comparing two videos from the same channel cancels channel size, audience,
production budget and design competence, because they are constant within the
pair. Requiring the two to be published close together additionally cancels the
channel's growth trajectory and the algorithm regime of that period.

A ranking test also sidesteps calibration entirely. The model was never built to
output a number of views; it only needs to order two inputs. Testing it on a
task it was not designed for would be a straw man.

---

## 2. Population and sampling

### 2.1 Channels

Channels are listed in `channels.json` **before harvesting**, stratified across
six content categories (tech, education, cooking, gaming, fitness, lifestyle) so
that no single visual convention dominates the sample. Category is recorded per
channel and is a declared secondary axis (§6.2).

The list is resolved once, handle → channel ID, into `channels.resolved.json`,
which is **committed**. That file is the frozen sample. Channels that fail to
resolve are reported and excluded; they are not silently dropped, and they are
not replaced after resolution.

No channel is added, removed, or swapped after the first scoring call. A channel
whose thumbnails "look interesting" is precisely the selection effect this rule
exists to prevent.

### 2.2 Videos

From each channel's uploads playlist, the most recent **300** items are
considered. A video is **excluded** if any of the following holds:

| # | Exclusion | Reason |
|---|---|---|
| E1 | Duration ≤ 180s | Excludes Shorts, a different surface where the thumbnail is barely shown. The floor is set at the *Shorts ceiling* (3 minutes since 2024), not at 60s, because the API exposes no reliable flag separating a Short from a genuinely short upload. This over-excludes a few legitimate videos; that is the safe direction. |
| E2 | Published < 45 days ago | Views have not matured |
| E3 | Published > 730 days ago | Different algorithm regime, different channel |
| E4 | Live broadcast, premiere, or upcoming | Performance driven by scheduling, not packaging |
| E5 | View count hidden by the uploader | No outcome variable |
| E6 | No thumbnail ≥ 320px wide retrievable | YouTube serves a 120×90 grey placeholder with HTTP 200 for some unavailable videos; scoring it would be scoring a blank rectangle. Checked **after** pairing, for bandwidth — and when either side fails, the **whole pair is dropped**, so the check can never remove winners and losers at different rates |
| E7 | Fewer than 8 usable neighbours in its window | The baseline in §3 would be computed from too little data |

Exclusions are applied **before** any score is computed, are counted, and the
counts are published.

---

## 3. The outcome variable

Raw views are never used. For each video *i*, ordered by publication date:

```
window(i)      = the 10 uploads before i and the 10 after, excluding i itself
baseline(i)    = median(views of window(i))
viewMultiple(i)= views(i) / baseline(i)
performance(i) = ln(viewMultiple(i))
```

**Rolling, not channel-wide**, because a channel that grew 5× over two years
would otherwise have every early video labelled an underperformer and every
recent one a hit — measuring the calendar, not the packaging.

**Excluding the video itself** from its own baseline, because including it pulls
every multiple toward 1 and compresses exactly the extremes this study selects on.

**Median, not mean**, because one viral outlier in the window would otherwise
redefine the baseline for its twenty neighbours.

---

## 4. Pair construction

Within a channel — and only for channels left with **at least 20 usable
videos** after §2.2, since a quintile of fewer than that is a quintile of four
videos and not a stable tail:

1. **Winners** = videos in the top quintile of `performance`.
   **Losers** = videos in the bottom quintile.
2. A winner and a loser may form a pair only if:
   - **P1.** published within **120 days** of each other;
   - **P2.** `viewMultiple(winner) ≥ 2 × viewMultiple(loser)`.
3. Matching is greedy on smallest publication gap first. **Each video appears in
   at most one pair.**
4. At most **8 pairs per channel**.

**P2** exists because asking the model to separate a 1.05× video from a 0.98×
one is asking it to rank noise; a coin does that at 50% and so, correctly, would
a perfect model. The threshold makes "over-" and "under-performing" mean
something.

**Rule 3's reuse ban is load-bearing.** The primary test is a binomial test,
which assumes independent trials. Reusing one popular video across five pairs
makes five trials that are not independent and silently inflates significance.

**Rule 4** stops one prolific channel supplying a quarter of the sample.

---

## 5. Primary analysis

**Unit:** one pair. **Trial:** the model scores both members — thumbnail plus the
real title, exactly as the product does — and the trial is a **success** when
`globalScore(winner) > globalScore(loser)`.

**Ties** (`globalScore` equal, an integer 0–100, so ties are expected) are
**counted as failures.** This is deliberately the conservative choice: splitting
them or dropping them both flatter the result, and a score that cannot separate
two inputs has not discriminated between them.

**Test:** two-sided exact binomial against p = 0.5, α = 0.05.
**Reported:** accuracy, the 95% Clopper–Pearson interval, n, and the exact p.

**n is whatever the frozen channel list yields** under §2.2 and §4 — expected
400–480 at 60 channels and a cap of 8 pairs each. **Every pair produced is
scored, and every pair scored enters the primary analysis.**

This is deliberately not "collect until n = 400". A stopping rule that anyone
can apply while watching the result is the classic way a null becomes a finding,
and the cheapest defence is to have no stopping decision at all: the sample is
whatever the rules produce, decided before any of it is seen. The cost argument
that would normally justify a cap does not apply here — at roughly \$0.006 per
analysis, 480 pairs is about \$5.80.

n = 400 is the **power benchmark**, not a target: at 400 pairs the test has 80%
power to detect a true accuracy of 57% (α = 0.05, two-sided). If the frozen list
yields materially fewer than 400, the study is reported as underpowered rather
than topped up from new channels.

There is no post-hoc exclusion of "unfair" pairs. Data are analysed once.

---

## 6. Secondary analyses — declared in advance, reported as secondary

These are exploratory. They are labelled as such in the article, and no p-value
from this section is presented as a confirmation of anything.

### 6.1 Which dimension separates the two groups

For each of the twelve sub-scores, the standardized mean difference (Cohen's d)
between winners and losers, with the sign. Reported as a ranked table.

This is the finding most likely to be *useful* rather than merely defensible,
and it is the one most likely to be over-read. It is descriptive of this sample.

### 6.2 Accuracy by category

Per-category accuracy with intervals. Expected to be noisy — roughly 65 pairs
per category is not enough to compare categories against each other, and no such
comparison will be made.

### 6.3 Score separation

The distribution of `globalScore(winner) − globalScore(loser)`, and whether
accuracy rises with the size of the gap. A model with real signal should be
right more often when it is more confident.

---

## 7. Controls and falsification

A study that cannot fail is not evidence. These run alongside the primary
analysis and are published **whatever they show**.

| Control | Expectation | What a violation means |
|---|---|---|
| **C1. Label shuffle.** Re-run the primary test with winner/loser labels randomly permuted, 1,000 times. | Centred on 50% | The pipeline leaks the answer. The main result is void. |
| **C2. Template channels.** Channels whose thumbnails follow a fixed template (measured as the lowest within-channel variance in `globalScore`, bottom decile). | Accuracy **near 50%** | If the model is confident where the thumbnails barely differ, it is reading something other than the packaging. |
| **C3. Trivial baselines.** Title length; title word count; thumbnail file size; mean pixel contrast. | Materially below the model | If a one-line heuristic matches the model, the model adds nothing and this must be said. |
| **C4. Title swap.** Re-score each thumbnail with its pair-partner's title. | Score should move | If it barely moves, the title is not contributing and the product's claim to score both is weaker than stated. |

**C2 is the one to watch.** It is the internal check that the test is measuring
packaging rather than some artefact of channel or era, and it is the only control
here that can quietly invalidate the headline while the headline still looks good.

---

## 8. What would make us report a null

The article is written and published if the result is 50%. The pre-committed
wording for that outcome:

> On this test, the score did not rank the better-performing video above the
> worse one more often than chance.

There is no version of this study that goes unpublished because the number was
disappointing. That commitment is the reason the number is worth anything.

---

## 9. Limits, stated in advance

1. **This tests the score, not the recommendations.** Whether applying a
   suggested title improves a real video is a different study and is not
   evidenced here.
2. **Observational, not causal.** Nothing here shows that changing a thumbnail
   changes views. It shows that the score is associated with an outcome
   difference that already exists.
3. **Selection on the outcome.** Pairs are chosen *because* they differ in
   performance. The accuracy figure applies to that population — clear over- vs
   clear under-performers — not to any two videos.
4. **Views were snapshotted once**, on the harvest date recorded in
   `dataset.json`. They keep accruing.
5. **Established channels only.** Nothing here generalises to a new channel with
   no baseline to be measured against.
6. **The model saw public videos.** Whether these specific videos influenced the
   underlying vision model's training is unknowable from outside.

---

## 10. Publication constraints

The article reports **aggregates only**. No creator, channel or video is named,
and no third party's thumbnail is reproduced as an example of weak work — the
editorial gate already bans targeting identifiable channels, and this study does
not get an exception. Illustrations use the synthetic thumbnails in
`src/shared/evaluation/syntheticThumbnails.ts`.

No stored dataset of YouTube data is republished. Aggregate statistics are.

---

## 11. Reproducibility

Published with the article: this file's commit hash, the frozen
`channels.resolved.json`, the analysis code, the exclusion counts, `n`, and the
model ID and `ANALYSIS_VERSION` the run executed against.

Not published: the harvested dataset itself (§10).
