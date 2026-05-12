import { describe, it, expect } from "vitest";
import { studentProfileSchema } from "@/lib/schemas/student-profile";

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const VALID_UUID_2 = "b1ffcd00-0d1c-5ff9-ac7e-7cc0ce491b22";

const validInput = {
  first_name: "Juan",
  last_name: "Dela Cruz",
  program_id: VALID_UUID,
  major_id: "",
  year_level: "FIRST_YEAR" as const,
  student_id_number: "21-12345",
  section: "MORNING" as const,
};

describe("studentProfileSchema", () => {
  describe("valid inputs", () => {
    it("accepts a complete valid profile without major", () => {
      const result = studentProfileSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("accepts a profile with a valid major_id UUID", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        major_id: VALID_UUID,
      });
      expect(result.success).toBe(true);
    });

    it("accepts major_id as null", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        major_id: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts major_id as undefined", () => {
      const { major_id, ...withoutMajor } = validInput;
      const result = studentProfileSchema.safeParse(withoutMajor);
      expect(result.success).toBe(true);
    });
  });

  describe("first_name validation", () => {
    it("rejects empty first_name", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        first_name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects single-character first_name", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        first_name: "J",
      });
      expect(result.success).toBe(false);
    });

    it("accepts two-character first_name", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        first_name: "Jo",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("last_name validation", () => {
    it("rejects empty last_name", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        last_name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects single-character last_name", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        last_name: "D",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("program_id validation", () => {
    it("rejects non-UUID program_id", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        program_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty program_id", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        program_id: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("year_level validation", () => {
    it("rejects invalid year_level value", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        year_level: "FIFTH_YEAR",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing year_level", () => {
      const { year_level, ...withoutYearLevel } = validInput;
      const result = studentProfileSchema.safeParse(withoutYearLevel);
      expect(result.success).toBe(false);
    });
  });

  describe("student_id_number validation", () => {
    it("rejects student_id_number shorter than 5 characters", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        student_id_number: "1234",
      });
      expect(result.success).toBe(false);
    });

    it("accepts student_id_number of exactly 5 characters", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        student_id_number: "12345",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty student_id_number", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        student_id_number: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("major_id edge cases", () => {
    it("rejects a non-UUID, non-empty major_id string", () => {
      const result = studentProfileSchema.safeParse({
        ...validInput,
        major_id: "invalid-major",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("section validation", () => {
    it("accepts MORNING section", () => {
      const result = studentProfileSchema.safeParse({ ...validInput, section: "MORNING" });
      expect(result.success).toBe(true);
    });

    it("accepts AFTERNOON section", () => {
      const result = studentProfileSchema.safeParse({ ...validInput, section: "AFTERNOON" });
      expect(result.success).toBe(true);
    });

    it("accepts EVENING section", () => {
      const result = studentProfileSchema.safeParse({ ...validInput, section: "EVENING" });
      expect(result.success).toBe(true);
    });

    it("rejects empty string section", () => {
      const result = studentProfileSchema.safeParse({ ...validInput, section: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing section", () => {
      const { section, ...withoutSection } = validInput;
      const result = studentProfileSchema.safeParse(withoutSection);
      expect(result.success).toBe(false);
    });

    it("rejects invalid section value", () => {
      const result = studentProfileSchema.safeParse({ ...validInput, section: "NIGHT" });
      expect(result.success).toBe(false);
    });
  });
});
