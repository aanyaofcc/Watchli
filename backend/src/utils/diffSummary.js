function splitWords(text) {
  return text ? text.split(/\s+/).filter(Boolean) : [];
}

function joinWords(words) {
  return words.join(" ").trim();
}

function buildSegments(words, changeStart, changeEnd) {
  const segments = [];
  const before = words.slice(0, changeStart);
  const changed = words.slice(changeStart, changeEnd);
  const after = words.slice(changeEnd);

  if (before.length) {
    segments.push({ text: joinWords(before), changed: false });
  }

  if (changed.length) {
    segments.push({ text: joinWords(changed), changed: true });
  }

  if (after.length) {
    segments.push({ text: joinWords(after), changed: false });
  }

  return segments;
}

function summarizePriceChange(previousPriceData, currentPriceData) {
  const previousPrimary = previousPriceData?.primaryPrice || "";
  const currentPrimary = currentPriceData?.primaryPrice || "";
  const previousValue = previousPriceData?.primaryPriceValue;
  const currentValue = currentPriceData?.primaryPriceValue;
  const previousDetected = previousPriceData?.priceDetected;
  const currentDetected = currentPriceData?.priceDetected;
  const previousAvailability = previousPriceData?.availabilityStatus || "unknown";
  const currentAvailability = currentPriceData?.availabilityStatus || "unknown";

  if (previousAvailability !== currentAvailability) {
    if (currentAvailability === "sold_out") {
      return {
        changed: true,
        type: "sold_out",
        direction: "sold_out",
        previousPrice: previousPrimary,
        currentPrice: currentPrimary,
        label: "Item is now sold out",
        previousValue: previousValue ?? null,
        currentValue: currentValue ?? null,
        amount: null,
        reliable: true
      };
    }

    if (currentAvailability === "unavailable") {
      return {
        changed: true,
        type: "unavailable",
        direction: "unavailable",
        previousPrice: previousPrimary,
        currentPrice: currentPrimary,
        label: "Item is no longer available",
        previousValue: previousValue ?? null,
        currentValue: currentValue ?? null,
        amount: null,
        reliable: true
      };
    }
  }

  if (!previousDetected && !currentDetected) {
    return null;
  }

  if (!previousPrimary && currentPrimary) {
    return {
      changed: true,
      type: "appeared",
      direction: "appeared",
      previousPrice: "",
      currentPrice: currentPrimary,
      label: `Price detected: ${currentPrimary}`,
      previousValue: null,
      currentValue: currentValue ?? null,
      amount: null,
      reliable: currentPriceData?.primaryPriceConfidence >= 75
    };
  }

  if (previousPrimary && !currentPrimary) {
    return {
      changed: true,
      type: "removed",
      direction: "removed",
      previousPrice: previousPrimary,
      currentPrice: "",
      label: `Price removed: ${previousPrimary}`,
      previousValue: previousValue ?? null,
      currentValue: null,
      amount: null,
      reliable: previousPriceData?.primaryPriceConfidence >= 75
    };
  }

  if (previousPrimary !== currentPrimary) {
    const hasNumericValues =
      typeof previousValue === "number" &&
      Number.isFinite(previousValue) &&
      typeof currentValue === "number" &&
      Number.isFinite(currentValue);
    const rawAmount = hasNumericValues ? currentValue - previousValue : null;
    const direction = hasNumericValues
      ? rawAmount > 0
        ? "up"
        : rawAmount < 0
          ? "down"
          : "changed"
      : "changed";
    const movementLabel =
      direction === "up"
        ? `Price increased by ${formatPriceDelta(rawAmount)} from ${previousPrimary} to ${currentPrimary}`
        : direction === "down"
          ? `Price decreased by ${formatPriceDelta(Math.abs(rawAmount))} from ${previousPrimary} to ${currentPrimary}`
          : `Price changed from ${previousPrimary} to ${currentPrimary}`;

    return {
      changed: true,
      type: "updated",
      direction,
      previousPrice: previousPrimary,
      currentPrice: currentPrimary,
      label: movementLabel,
      previousValue: previousValue ?? null,
      currentValue: currentValue ?? null,
      amount: rawAmount,
      reliable:
        (previousPriceData?.primaryPriceConfidence || 0) >= 75 &&
        (currentPriceData?.primaryPriceConfidence || 0) >= 75
    };
  }

  return {
    changed: false,
    type: "unchanged",
    direction: "unchanged",
    previousPrice: previousPrimary,
    currentPrice: currentPrimary,
    label: `Price still ${currentPrimary}`,
    previousValue: previousValue ?? null,
    currentValue: currentValue ?? null,
    amount: 0,
    reliable:
      (previousPriceData?.primaryPriceConfidence || 0) >= 75 &&
      (currentPriceData?.primaryPriceConfidence || 0) >= 75
  };
}

function formatPriceDelta(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export function createDiffSummary(
  previousText,
  currentText,
  previousPriceData = {},
  currentPriceData = {}
) {
  const previousWords = splitWords(previousText);
  const currentWords = splitWords(currentText);
  const previousLength = previousWords.length;
  const currentLength = currentWords.length;

  let prefixLength = 0;

  while (
    prefixLength < previousLength &&
    prefixLength < currentLength &&
    previousWords[prefixLength] === currentWords[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;

  while (
    suffixLength < previousLength - prefixLength &&
    suffixLength < currentLength - prefixLength &&
    previousWords[previousLength - 1 - suffixLength] ===
      currentWords[currentLength - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  const previousChangeStart = Math.max(0, prefixLength - 8);
  const currentChangeStart = Math.max(0, prefixLength - 8);
  const previousChangeEnd = Math.min(previousLength, previousLength - suffixLength + 8);
  const currentChangeEnd = Math.min(currentLength, currentLength - suffixLength + 8);

  return {
    changed: previousText !== currentText,
    contentChanged: previousText !== currentText,
    priceChange: summarizePriceChange(previousPriceData, currentPriceData),
    previousPrices: previousPriceData?.detectedPrices || [],
    currentPrices: currentPriceData?.detectedPrices || [],
    previousPrimaryPrice: previousPriceData?.primaryPrice || "",
    currentPrimaryPrice: currentPriceData?.primaryPrice || "",
    previousAvailabilityStatus: previousPriceData?.availabilityStatus || "unknown",
    currentAvailabilityStatus: currentPriceData?.availabilityStatus || "unknown",
    previousAvailabilityLabel: previousPriceData?.availabilityLabel || "",
    currentAvailabilityLabel: currentPriceData?.availabilityLabel || "",
    changedWordCount: Math.max(
      0,
      previousLength - prefixLength - suffixLength,
      currentLength - prefixLength - suffixLength
    ),
    previousPreview: joinWords(previousWords.slice(previousChangeStart, previousChangeEnd)),
    currentPreview: joinWords(currentWords.slice(currentChangeStart, currentChangeEnd)),
    previousSegments: buildSegments(
      previousWords.slice(previousChangeStart, previousChangeEnd),
      prefixLength - previousChangeStart,
      previousLength - suffixLength - previousChangeStart
    ),
    currentSegments: buildSegments(
      currentWords.slice(currentChangeStart, currentChangeEnd),
      prefixLength - currentChangeStart,
      currentLength - suffixLength - currentChangeStart
    )
  };
}
