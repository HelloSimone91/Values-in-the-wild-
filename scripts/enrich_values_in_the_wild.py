from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path


META_PREFIXES = (
    "here are",
    "###",
    "examples of",
    "5 examples of",
    "examples of everyday occurrences",
    "this document",
    "discover ",
    "unlock ",
    "step into ",
    "thank you for taking time",
    "by observing",
    "two prompts",
    "these everyday occurrences",
    "these are just a few examples",
    "all key aspects",
    "luxury can be seen in many everyday occurrences",
    "selflessness can be seen in everyday life",
)

INTRO_PREFIXES = (
    "examples of everyday occurrences that exhibit the value of",
    "everyday actions",
    "examples of everyday occurrences",
    "here are five examples of everyday occurrences that exhibit the value of",
    "here are 2 examples of everyday occurrences that exhibit the value of",
)

SPLIT_PATTERNS = (
    re.compile(r"\s+(?=\d+\.\s+)"),
    re.compile(r"\s+(?=-\s+)"),
)


def collapse_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def extract_list_items(text: str) -> list[str]:
    normalized = (text or "").replace("\r", "\n").strip()
    if not normalized:
        return []

    for pattern in SPLIT_PATTERNS:
        normalized = pattern.sub("\n", normalized)

    parts = []
    for raw_part in re.split(r"\n+", normalized):
        part = collapse_space(re.sub(r"^(?:[-*]|\d+\.)\s*", "", raw_part))
        if part:
            parts.append(part)

    return parts


def clean_candidate(text: str) -> str | None:
    candidate = collapse_space(text)
    if not candidate:
        return None

    lowered = candidate.lower()
    for prefix in INTRO_PREFIXES:
        if lowered.startswith(prefix):
            if ":" in candidate:
                candidate = collapse_space(candidate.split(":", 1)[1])
                lowered = candidate.lower()
            else:
                return None

    if any(lowered.startswith(prefix) for prefix in META_PREFIXES):
        return None

    if len(candidate) < 30:
        return None

    if "http://" in lowered or "https://" in lowered:
        return None

    if lowered.startswith("value: ") or lowered.startswith("niche hobby: "):
        return None

    if "examples of selflessness in everyday life" in lowered:
        return None

    if lowered.endswith("own lives.") or lowered.endswith("own life."):
        return None

    candidate = candidate.strip(" -")
    if not candidate:
        return None

    candidate = candidate[0].upper() + candidate[1:]
    if candidate[-1] not in ".!?":
        candidate += "."

    return candidate


def dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for item in items:
        normalized = re.sub(r"[^a-z0-9]+", "", item.lower())
        if normalized in seen:
            continue
        seen.add(normalized)
        output.append(item)
    return output


def collect_rows(csv_path: Path, key: str) -> dict[str, list[dict[str, str]]]:
    if not csv_path.exists():
        return {}

    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        rows: dict[str, list[dict[str, str]]] = {}
        for row in reader:
            value_name = collapse_space(row.get(key, ""))
            if not value_name:
                continue
            rows.setdefault(value_name, []).append(row)
        return rows


def source_candidates(big_ole_rows: list[dict[str, str]], stack_rows: list[dict[str, str]]) -> list[str]:
    candidates: list[str] = []

    for row in big_ole_rows:
        candidates.extend(extract_list_items(row.get(" 2 - 5 examples ", "")))

    return dedupe([cleaned for item in candidates if (cleaned := clean_candidate(item))])


CATEGORY_FALLBACKS = {
    "Aspirations": [
        "{name} often becomes visible before there is any applause, in the choice to keep moving toward something that matters.",
        "A quieter version of {name_lower} shows up when someone keeps practicing, refining, or recommitting after the first burst of motivation wears off.",
    ],
    "Core Values": [
        "{name} usually reveals itself under pressure, when someone has to choose between convenience and what they believe is the right move.",
        "{name} tends to show up in follow-through: what people do after they have made a promise, crossed a line, or been asked to be clear.",
    ],
    "Growth": [
        "{name} shows up in the next deliberate step, especially when progress depends on repetition more than inspiration.",
        "You can often spot {name_lower} in how someone experiments, adjusts, and stays engaged long enough to learn from the result.",
    ],
    "Interpersonal": [
        "{name} often appears in conversation, tone, boundaries, and repair rather than in grand gestures.",
        "A grounded version of {name_lower} shows up in how people listen, respond, and make room for another person's reality.",
    ],
    "Mindset": [
        "{name} is often easiest to spot in the inner stance someone takes before they speak or act.",
        "A lived version of {name_lower} can look like pausing long enough to notice a pattern, question an assumption, or stay open to complexity.",
    ],
    "Personal": [
        "{name} often lives in ordinary routines: how someone treats their body, their time, their space, and their own attention.",
        "A more realistic version of {name_lower} shows up in small repeated choices that shape the texture of daily life.",
    ],
    "Social": [
        "{name} becomes visible in shared spaces, especially in who gets included, protected, represented, or invited to participate.",
        "You can spot {name_lower} in the way a group organizes itself, distributes effort, and responds when something is unfair or off balance.",
    ],
}


VALUE_OVERRIDES = {
    "Capitalism": [
        "You notice capitalism when someone takes on risk to build a business, price a service, or compete for customers.",
        "It shows up in how people talk about markets, ownership, incentives, growth, and whether profit is treated as a signal of value.",
        "A quieter version appears when someone compares options, negotiates cost, or assumes competition and exchange are normal ways to solve a problem.",
    ],
    "Comedy": [
        "You see comedy when someone uses timing, exaggeration, or surprise to make a tense moment easier to hold.",
        "It shows up in the instinct to find the precise absurdity in a situation and offer it in a way other people can actually laugh with.",
        "A quieter version appears when humor makes a hard conversation more human without dodging what is true.",
    ],
    "Fine Art": [
        "You notice fine art when someone makes or lingers with work whose main purpose is expression, interpretation, or aesthetic experience rather than utility.",
        "It shows up in galleries, studios, public installations, and in the way a person learns to see composition, symbolism, and form.",
        "A quieter version appears when someone treats beauty-making as serious work instead of as decoration alone.",
    ],
    "Luxury": [
        "Luxury also shows up in the decision to pay extra for comfort, craftsmanship, beauty, or time-saving service.",
        "It becomes visible when details are intentionally elevated beyond basic function into pleasure, ease, or status.",
        "A quieter version appears when someone chooses spaciousness, softness, or exceptional quality because the experience itself matters.",
    ],
    "Money": [
        "You notice money when someone budgets, prices their work clearly, or makes a tradeoff between spending now and building future margin.",
        "It shows up in how people talk about cost, savings, debt, compensation, and what they are willing to pay for peace, speed, or status.",
        "A quieter version appears when a person uses money as a tool for security, generosity, leverage, or independence rather than as a score alone.",
    ],
    "Piety": [
        "You notice piety when someone orders their day around prayer, ritual, devotion, or reverence rather than fitting those practices in only when convenient.",
        "It shows up in the way a person speaks about the sacred, keeps religious commitments, or lets belief shape ordinary conduct.",
        "A quieter version appears in disciplined acts of humility, gratitude, confession, and worship.",
    ],
    "Technology": [
        "You see technology when a team automates a repetitive task, uses a tool to extend what they can do, or chooses a better system over more manual work.",
        "It shows up when someone reaches for a product, platform, or workflow to reduce friction, increase access, or connect people at a distance.",
        "A quieter version appears in the habit of learning new tools instead of defaulting to older processes out of inertia.",
    ],
}


def fallback_lines(value: dict[str, object]) -> list[str]:
    name = str(value["name"])
    name_lower = name.lower()
    category = str(value.get("category", "Personal"))
    example = collapse_space(str(value.get("example", "")))

    lines = []
    if example:
        if example[-1] not in ".!?":
            example += "."
        lines.append(example)

    if name in VALUE_OVERRIDES:
        lines.extend(VALUE_OVERRIDES[name])
        return dedupe(lines)

    for template in CATEGORY_FALLBACKS.get(category, []):
        lines.append(template.format(name=name, name_lower=name_lower))

    lines.append(
        f"{name} usually becomes visible in the tradeoffs people make when convenience, image, or habit pull against what they care about."
    )
    lines.append(
        f"You can often tell {name_lower} matters when someone organizes their time, attention, or behavior around it without needing a lot of credit or drama."
    )

    return dedupe(lines)


def build_in_the_wild(value: dict[str, object], big_ole_index: dict[str, list[dict[str, str]]], stack_index: dict[str, list[dict[str, str]]]) -> list[str]:
    name = str(value["name"])
    candidates = source_candidates(big_ole_index.get(name, []), stack_index.get(name, []))
    detailed_candidates = [candidate for candidate in candidates if len(candidate) >= 60]
    preferred_candidates = detailed_candidates[:3] if len(detailed_candidates) >= 2 else candidates[:1]
    combined = dedupe(preferred_candidates + fallback_lines(value))
    return combined[:3]


def main() -> None:
    parser = argparse.ArgumentParser(description="Add richer in-the-wild content to the values JSON.")
    parser.add_argument("--input", default="data/Values-en.json")
    parser.add_argument("--big-ole")
    parser.add_argument("--stacks")
    args = parser.parse_args()

    input_path = Path(args.input)
    with input_path.open(encoding="utf-8") as handle:
        payload = json.load(handle)

    values = payload.get("values", [])

    big_ole_index = collect_rows(Path(args.big_ole), "Value") if args.big_ole else {}
    stack_index = collect_rows(Path(args.stacks), "Value") if args.stacks else {}

    for value in values:
        value["inTheWild"] = build_in_the_wild(value, big_ole_index, stack_index)

    with input_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=4, ensure_ascii=False)
        handle.write("\n")


if __name__ == "__main__":
    main()
