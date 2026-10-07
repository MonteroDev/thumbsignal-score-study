# ThumbSignal score study: pre-registration

This repository holds one document and the fingerprints of that document and of the frozen channel sample. It exists
so that anyone can check, from outside ThumbSignal, that the methodology of the
score-discrimination study is the text that was written before the data was
scored, and that it has not been edited since. It also holds the score of every
pair, so that the headline figures can be recomputed.

The results, the design, the controls and the limits are on the study page:
<https://thumbsignal.com/en/study>. The numbers there are aggregates. No
channel, creator or video is named, and the harvested YouTube data is not
republished. `pairs.csv` carries scores only: no channel, no video, no title,
no link, no date and no view count.

## What is here

| File | What it is |
|---|---|
| `PREREGISTRATION.md` | The methodology, frozen before the first scoring call. Byte for byte the file first committed in ThumbSignal's private repository on 2026-09-04. |
| `HASHES.txt` | The SHA-256 fingerprints of `PREREGISTRATION.md` and `pairs.csv`, in the format `sha256sum -c` reads. The fingerprint of the frozen channel sample is in the table below. |
| `pairs.csv` | The 321 pairs: the category and four integer scores per pair (winner and loser, with the original titles and with the titles swapped). |
| `verify.mjs` | Recomputes the accuracy, its 95% interval, the exact test and the title-swap result from `pairs.csv`. Node 18 or later, no dependencies. |

## How to check it

```sh
sha256sum -c HASHES.txt                 # the document is the one fingerprinted below
git hash-object PREREGISTRATION.md      # must print 3a1c8b5ff1e186d277e16466074c46143f3ae6a1
node verify.mjs                         # must print 191 of 321 (59.5%) and 137 of 321 (42.7%)
```

The document and its fingerprints:

| Item | SHA-256 | Git blob id |
|---|---|---|
| `PREREGISTRATION.md` | `b3910ab92111a29ece46d2fcda61f9b41205b2a6db3b14c3cea9c2dae5ac1171` | `3a1c8b5ff1e186d277e16466074c46143f3ae6a1` |
| `channels.resolved.json`, the frozen sample of 60 channels (not published) | `69c5b9317105587b0feb6ef41499d506be15cf319d868afd7533d54c4df40168` | `feaf876aab8cb320cfd769f79145589c20ea7daa` |

The channel list is not published because it names channels, and the study
reports aggregates only. Its fingerprint is published so that, if the list is
ever shown, anyone can confirm it is the one that was frozen.

## The table of pairs

`pairs.csv` has one line per pair of videos from the same channel, the one that
did better against the one that did worse (by views relative to the channel's
usual views, as the pre-registration defines). Columns:

| Column | Meaning |
|---|---|
| `pair` | A number from 1 to 321. The order is arbitrary (a hash of the private pair identifier), so it says nothing about channels or dates. |
| `category` | One of six: cooking, education, fitness, gaming, lifestyle, tech. |
| `winner_score`, `loser_score` | The ThumbSignal score (0 to 100, whole numbers) of the better and of the worse video, with each video's own title. |
| `winner_score_swapped`, `loser_score_swapped` | The same two thumbnails scored again, each with the title of the other video (control C4). |

A pair counts as a success when the better video scored strictly higher. A tie
counts as a failure. The table gives 191 successes and 17 ties out of 321, and,
with the titles swapped, 137 successes and 16 ties.

## The sequence, as recorded in the private repository

These dates are read from the commit history of ThumbSignal's private
repository. They are the maintainer's own record, not an independent one.

| When (CEST) | What | Private commit |
|---|---|---|
| 2026-09-04 22:13 | Pre-registration written | `296d93e` |
| 2026-09-04 22:35 | Sample of 60 channels frozen | `8a47431` |
| 2026-09-04 22:53 | First scoring commit | `aa49605` |
| 2026-09-04 23:29 | First analysis of the result | `89ba5be` |

`PREREGISTRATION.md` has not changed since its first commit: the private
history shows only a rename (100% identical) when the documentation was
reorganised on 2026-10-02. There is no amendment file.

## What this repository proves, and what it does not

- **It proves** that this exact text existed on the date of this repository's
  first commit, as GitHub recorded it, and that it has not changed since.
- **It does not prove** that the text existed on 2026-09-04. That date comes
  from the private history, which the maintainer could in principle have
  rewritten. Publishing the fingerprints late cannot repair that, and this
  repository does not claim to.
- **It lets you check the arithmetic** of the headline result: given these 321
  lines, the figures on the study page follow. It does not let you check that
  the scores are the ones the product produced, that the pairs were chosen as the
  document says, or that the views behind "better" and "worse" are real, because
  the identifiers that would allow that are not published.
- **It does not show** that the analysis followed the document. The analysis
  code and the harvested data are not published here. The study page lists what each
  control showed, including the ones that cut against the product.
