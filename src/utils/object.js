export function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj && obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

export function cleanObject(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj ?? {})) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}
