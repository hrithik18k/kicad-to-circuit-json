import { expect, test } from "bun:test"
import "bun-match-svg"
import { readFileSync } from "node:fs"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { KicadToCircuitJsonConverter } from "../../../lib"

test("Easyduino schematic reproduces KiCad overline markup rendering", async () => {
  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(
    "Easyduino_ESP32.kicad_sch",
    readFileSync(
      new URL("../../assets/Easyduino_ESP32.kicad_sch", import.meta.url),
      "utf-8",
    ),
  )
  converter.runUntilFinished()

  const circuitJson = converter.getOutput()
  expect(circuitJson.length).toBeGreaterThan(0)

  // Render the complete generated output without overriding labels or styling.
  // This baseline records the bug: ~{SUSPEND} and ~{RI}/CLK appear literally.
  const svg = convertCircuitJsonToSchematicSvg(circuitJson, {
    width: 1200,
    height: 1600,
  })
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
