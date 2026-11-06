import { loadCatalog } from "@/lib/load-catalog.mjs";
import { GalleryView } from "@/components/gallery-view";

export default function Page() {
  return <GalleryView catalog={loadCatalog()} />;
}
