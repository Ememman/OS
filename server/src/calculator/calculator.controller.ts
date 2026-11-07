import { Controller, Get, Query, BadRequestException } from "@nestjs/common";

const MATH_CONSTANTS = [
  { symbol: "π", name: "Pi", value: 3.141592653589793, category: "Math", desc: "Ratio of circle circumference to diameter" },
  { symbol: "e", name: "Euler's Number", value: 2.718281828459045, category: "Math", desc: "Base of natural logarithm" },
  { symbol: "φ", name: "Golden Ratio", value: 1.618033988749895, category: "Math", desc: "Divine proportion in geometry & art" },
  { symbol: "c", name: "Speed of Light", value: 299792458, unit: "m/s", category: "Physics", desc: "Universal speed of light in vacuum" },
  { symbol: "h", name: "Planck Constant", value: "6.62607015e-34", unit: "J·s", category: "Physics", desc: "Scale of quantum mechanical actions" },
  { symbol: "G", name: "Gravitational Constant", value: "6.67430e-11", unit: "N·m²/kg²", category: "Physics", desc: "Newtonian gravitational constant" },
  { symbol: "kB", name: "Boltzmann Constant", value: "1.380649e-23", unit: "J/K", category: "Physics", desc: "Relates thermal energy to temperature" },
  { symbol: "NA", name: "Avogadro Number", value: "6.02214076e23", unit: "mol⁻¹", category: "Chemistry", desc: "Number of particles per mole" }
];

@Controller("api/calc")
export class CalculatorController {
  @Get("constants")
  getConstants() {
    return MATH_CONSTANTS;
  }

  @Get("convert")
  convert(
    @Query("type") type?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("value") value?: string
  ) {
    const num = parseFloat(value || "");
    if (isNaN(num)) throw new BadRequestException("Invalid numeric value");

    let result: number | null = null;
    const lengthToMeters: Record<string, number> = { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254 };
    const weightToKg: Record<string, number> = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 };
    const dataToBytes: Record<string, number> = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024, tb: 1024 * 1024 * 1024 * 1024 };

    const f = String(from || "").toLowerCase();
    const t = String(to || "").toLowerCase();

    if (type === "length" && lengthToMeters[f] && lengthToMeters[t]) {
      const meters = num * lengthToMeters[f];
      result = meters / lengthToMeters[t];
    } else if (type === "weight" && weightToKg[f] && weightToKg[t]) {
      const kg = num * weightToKg[f];
      result = kg / weightToKg[t];
    } else if (type === "data" && dataToBytes[f] && dataToBytes[t]) {
      const bytes = num * dataToBytes[f];
      result = bytes / dataToBytes[t];
    } else if (type === "temp") {
      if (f === "c" && t === "f") result = (num * 9) / 5 + 32;
      else if (f === "f" && t === "c") result = ((num - 32) * 5) / 9;
      else if (f === "c" && t === "k") result = num + 273.15;
      else if (f === "k" && t === "c") result = num - 273.15;
      else if (f === t) result = num;
    }

    if (result === null) throw new BadRequestException("Unsupported conversion");
    return { ok: true, type, from: f, to: t, value: num, result: Math.round(result * 1000000) / 1000000 };
  }
}
