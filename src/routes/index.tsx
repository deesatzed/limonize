import { createFileRoute } from "@tanstack/react-router";
import { LimenApp } from "@/components/limen/app";

export const Route = createFileRoute("/")({
  component: LimenApp,
});
