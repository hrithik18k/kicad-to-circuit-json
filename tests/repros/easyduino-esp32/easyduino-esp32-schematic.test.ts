import { expect, test } from "bun:test"
import { readFile, writeFile } from "node:fs/promises"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { KicadToCircuitJsonConverter } from "../../../lib"
import { takeCircuitJsonSnapshot } from "../../fixtures/take-circuit-json-snapshot"
import "../../fixtures/png-matcher"

const fixturePath = "tests/repros/easyduino-esp32/Easyduino_ESP32.kicad_sch"
const snapshotDir = "tests/repros/easyduino-esp32/__snapshots__"

test("repro: Easyduino ESP32 active-low labels render as KiCad markup", async () => {
  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(fixturePath, await readFile(fixturePath, "utf8"))
  converter.runUntilFinished()

  const circuitJson = converter.getOutput()
  const schematicTexts = circuitJson.flatMap((element) =>
    element.type === "schematic_text" ? [element.text] : [],
  )
  const pinLabels = circuitJson.flatMap((element) =>
    element.type === "schematic_port" && element.display_pin_label
      ? [element.display_pin_label]
      : [],
  )

  // These assertions intentionally capture the broken output. KiCad's
  // active-low markup is passed through as visible text instead of an overline.
  expect(schematicTexts).toContain("~{RTS}")
  expect(schematicTexts).toContain("~{RXT}/GPIO.1")
  expect(pinLabels).toContain("~{SUSPEND}")

  await writeFile(
    `${snapshotDir}/Easyduino_ESP32-circuit-json.json`,
    JSON.stringify(circuitJson, null, 2),
  )

  const schematicSvg = await convertCircuitJsonToSchematicSvg(circuitJson, {
    width: 1200,
    height: 900,
  })
  await writeFile(
    `${snapshotDir}/Easyduino_ESP32-circuit-json.svg`,
    schematicSvg,
  )

  const schematicPng = await takeCircuitJsonSnapshot({
    circuitJson,
    outputType: "schematic",
    width: 1200,
    height: 900,
  })
  await expect(schematicPng).toMatchPngSnapshot(
    import.meta.path,
    "Easyduino_ESP32-circuit-json",
  )
})
