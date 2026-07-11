import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Axiom — AI Kanban Board",
    short_name: "Axiom",
    description: "The intelligence layer for elite teams.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f131d",
    theme_color: "#0f131d",
    categories: ["productivity", "business"],
    lang: "en",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "New Board",
        short_name: "Board",
        description: "Create a new Kanban board",
        url: "/workspaces/new",
      },
    ],
  };
}
