import { MatchStudio } from "@/components/MatchStudio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engine — HelixMatch",
};

export default function MatchPage() {
  return <MatchStudio />;
}
