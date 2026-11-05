import { notFound } from "next/navigation";

// Unknown URLs inside a locale show the translated 404 page.
export default function CatchAll() {
  notFound();
}
