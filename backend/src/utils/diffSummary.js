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
  const previousDetected = previousPriceData?.priceDetected;
  const currentDetected = currentPriceData?.priceDetected;

  if (!previousDetected && !currentDetected) {
    return null;
  }

  if (!previousPrimary && currentPrimary) {
    return {
      changed: true,
      type: "appeared",
      previousPrice: "",
      currentPrice: currentPrimary,
      label: `Price detected: ${currentPrimary}`,
      reliable: currentPriceData?.primaryPriceConfidence >= 75
    };
  }

  if (previousPrimary && !currentPrimary) {
    return {
      changed: true,
      type: "removed",
      previousPrice: previousPrimary,
      currentPrice: "",
      label: `Price removed: ${previousPrimary}`,
      reliable: previousPriceData?.primaryPriceConfidence >= 75
    };
  }

  if (previousPrimary !== currentPrimary) {
    return {
      changed: true,
      type: "updated",
      previousPrice: previousPrimary,
      currentPrice: currentPrimary,
      label: `Price changed from ${previousPrimary} to ${currentPrimary}`,
      reliable:
        (previousPriceData?.primaryPriceConfidence || 0) >= 75 &&
        (currentPriceData?.primaryPriceConfidence || 0) >= 75
    };
  }

  return {
    changed: false,
    type: "unchanged",
    previousPrice: previousPrimary,
    currentPrice: currentPrimary,
    label: `Price still ${currentPrimary}`,
    reliable:
      (previousPriceData?.primaryPriceConfidence || 0) >= 75 &&
      (currentPriceData?.primaryPriceConfidence || 0) >= 75
  };
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
