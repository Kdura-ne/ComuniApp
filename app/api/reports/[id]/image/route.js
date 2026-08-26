import { getReportImage } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_request, context) {
  const { id } = await context.params;
  const image = await getReportImage(id);
  if (!image) return new Response(null, { status: 404 });

  return new Response(Buffer.from(image.base64, "base64"), {
    headers: {
      "Content-Type": image.mime_type,
      "Content-Length": String(image.byte_size),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
