const parseOrderNotes = (notes) => {
  if (!notes) {
    return {};
  }

  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const mergeOrderNotes = (existingNotes, nextData) => {
  const current = parseOrderNotes(existingNotes);
  return JSON.stringify({ ...current, ...nextData });
};

module.exports = {
  mergeOrderNotes,
  parseOrderNotes,
};
