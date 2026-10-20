export async function prepareImage(file: File, max = 1280, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo procesar la imagen"))), "image/jpeg", quality)
  );
  const base64 = await new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]);
    r.readAsDataURL(blob);
  });
  return { blob, base64, mediaType: "image/jpeg" as const };
}
