import { expect, test } from "bun:test"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { KicadToCircuitJsonConverter } from "../../../lib"
import { stackCircuitJsonKicadPngs } from "../../fixtures/stackCircuitJsonKicadPngs"
import { takeCircuitJsonSnapshot } from "../../fixtures/take-circuit-json-snapshot"
import { takeKicadSnapshot } from "../../fixtures/take-kicad-snapshot"
import "../../fixtures/png-matcher"

test("Easyduino schematic reproduces KiCad overline markup rendering", async () => {
  const schematicPath = new URL(
    "../../assets/Easyduino_ESP32.kicad_sch",
    import.meta.url,
  )
  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(
    "Easyduino_ESP32.kicad_sch",
    readFileSync(schematicPath, "utf-8"),
  )
  converter.runUntilFinished()

  const circuitJson = converter.getOutput()
  expect(circuitJson.length).toBeGreaterThan(0)

  mkdirSync(new URL("./__snapshots__", import.meta.url), { recursive: true })
  writeFileSync(
    new URL(
      "./__snapshots__/easyduino-overline-circuit-json.json",
      import.meta.url,
    ),
    JSON.stringify(circuitJson, null, 2),
  )

  const kicadSnapshot = await takeKicadSnapshot({
    kicadFilePath: fileURLToPath(schematicPath),
    kicadFileType: "sch",
  })
  const kicadPng = Object.values(kicadSnapshot.generatedFileContent)[0]
  if (!kicadPng) throw new Error("Expected KiCad schematic snapshot")

  // Render the complete generated output without overriding labels or styling.
  const circuitJsonPng = await takeCircuitJsonSnapshot({
    circuitJson: circuitJson as any,
    outputType: "schematic",
    width: 1200,
    height: 1600,
  })

  const stackedPng = await stackCircuitJsonKicadPngs(
    circuitJsonPng,
    kicadPng,
    "horizontal",
  )
  await expect(stackedPng).toMatchPngSnapshot(
    import.meta.path,
    "easyduino-overline",
  )
}, 30_000)
