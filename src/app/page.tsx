import { redirect } from "next/navigation";

/**
 * Search is the product. Until the marketing home page exists, send people
 * straight to it rather than showing a placeholder.
 */
export default function Home() {
  redirect("/search");
}
