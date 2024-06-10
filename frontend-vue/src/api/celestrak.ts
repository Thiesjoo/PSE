

export async function fetchTLEs() {
  const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle', {
    cache: "force-cache"
  });
  const text = await response.text();
  return text;
}