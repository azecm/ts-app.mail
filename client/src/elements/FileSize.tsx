export function FileSize({ size }: { size: number }) {
  let ext = "б";
  if (size > 1024) {
    size = Math.round((size / 1024) * 10) / 10;
    ext = "кб";
  }
  if (size > 1024) {
    size = Math.round((size / 1024) * 10) / 10;
    ext = "мб";
  }
  if (size > 1024) {
    size = Math.round((size / 1024) * 10) / 10;
    ext = "Гб";
  }
  return (
    <>
      /{size}
      {ext}/
    </>
  );
}
