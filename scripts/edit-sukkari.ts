import ZAI from "z-ai-web-dev-sdk";
import { readFileSync, writeFileSync } from "fs";

const REF = "/home/z/my-project/upload/pasted_image_1795428133694.png";

async function edit(prompt: string, outputPath: string, size = "1344x768") {
  const zai = await ZAI.create();
  const buf = readFileSync(REF);
  const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;

  const res = await zai.images.generations.edit({
    prompt,
    images: [{ url: dataUrl }],
    size,
  });

  if (!res.data?.[0]?.base64) throw new Error("no image returned");
  const out = Buffer.from(res.data[0].base64, "base64");
  writeFileSync(outputPath, out);
  console.log("saved:", outputPath, out.length, "bytes");
}

const mode = process.argv[2] ?? "bowl";

if (mode === "bowl") {
  await edit(
    "Take these exact golden Sukkari dates and build a professional food photography scene: the same dates with the identical pale golden honey-yellow color and wrinkled creased texture, dozens of them piled high in an elegant cream ceramic bowl, on a light linen tablecloth with soft warm natural window light, shallow depth of field, appetizing premium product photo. Every single date must stay uniformly pale golden honey-yellow like in the original image — matte finish, no glossy shine, absolutely no orange dates, no red dates, no dark brown dates anywhere",
    "/home/z/my-project/public/images/sukkari-hero-1.png",
  );
} else if (mode === "crate") {
  await edit(
    "Take these exact golden Sukkari dates and build a professional food photography scene: the same dates with the identical pale golden honey color and wrinkled creased texture, a large pile of them filling a rustic wooden crate at a date market, a few dates scattered on the wooden table around it, bright soft daylight, appetizing premium product photo. Keep the dates' color and texture exactly as in the original image — do not make them darker, red or orange",
    "/home/z/my-project/public/images/sukkari-hero-2.png",
  );
}
