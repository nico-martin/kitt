const fetchScreenplay = async (
  season: number,
  episode: number
): Promise<string> => {
  const resp = await fetch(`/screenplays/${season}-${episode}.txt`);
  const text = await resp.text();
  if (text.startsWith("<")) {
    return null;
  }
  return text;
};

export default fetchScreenplay;
