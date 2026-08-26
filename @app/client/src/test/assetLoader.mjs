export const load = async (url, context, nextLoad) => {
  if (/\.svg(?:\?url)?$/.test(url)) {
    return {
      format: "module",
      shortCircuit: true,
      source: `export default ${JSON.stringify(url)};`,
    };
  }

  const loaded = await nextLoad(url, context);

  if (url.endsWith("/components/CountryFlag.tsx") && loaded.source) {
    return {
      ...loaded,
      source: loaded.source
        .toString()
        .replace(/import\.meta\.glob\([\s\S]*?\)/, "{}"),
    };
  }

  return loaded;
};
