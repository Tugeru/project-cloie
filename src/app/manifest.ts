import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CLOIE — Assumption College of Davao",
    short_name: "CLOIE",
    description: "Comprehensive Learning Outcomes and Instructional Evaluation",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F9FC",
    theme_color: "#0051C3",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
