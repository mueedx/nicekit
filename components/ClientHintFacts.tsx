"use client";

import { useEffect, useState } from "react";
import { readHighEntropyHints } from "@/lib/client-hints";
import { dash, FactBox } from "./FactRow";

export function ClientHintFacts({
  arch,
  bitness,
  model,
}: {
  arch: string | null;
  bitness: string | null;
  model: string | null;
}) {
  const [hints, setHints] = useState({ arch, bitness, model });

  useEffect(() => {
    void readHighEntropyHints().then((next) => {
      setHints({
        arch: arch ?? next.arch,
        bitness: bitness ?? next.bitness,
        model: model ?? next.model,
      });
    });
  }, [arch, bitness, model]);

  return (
    <>
      <FactBox label="Arch">{hints.arch ?? dash}</FactBox>
      <FactBox label="Bitness">{hints.bitness ?? dash}</FactBox>
      <FactBox label="Model">{hints.model ?? dash}</FactBox>
    </>
  );
}
