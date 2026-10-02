"use client";
import { useEffect } from "react";
import { track } from "@/lib/client";

export default function TrackView({ name }: { name: string }) {
  useEffect(() => track(name), [name]);
  return null;
}
