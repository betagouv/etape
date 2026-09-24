import { describe, expect, it } from "vitest";

import {
  getPasswordRules,
  PASSWORD_RULE_MESSAGE_KEY,
  type PasswordRuleMessageKey,
} from "./password-rules";

function unmetRules(value: string): PasswordRuleMessageKey[] {
  return getPasswordRules(value)
    .filter((rule) => !rule.isSatisfied)
    .map((rule) => rule.messageKey);
}

describe("getPasswordRules", () => {
  it("valide un mot de passe conforme à la politique du realm", () => {
    expect(unmetRules("MotDePasse2026!")).toEqual([]);
  });

  it("exige 12 caractères", () => {
    expect(unmetRules("MotDePass1!")).toEqual([PASSWORD_RULE_MESSAGE_KEY.LENGTH]);
    expect(unmetRules("MotDePasse1!")).toEqual([]);
  });

  it("exige une majuscule et une minuscule, accents compris", () => {
    expect(unmetRules("motdepasse2026!")).toEqual([PASSWORD_RULE_MESSAGE_KEY.UPPER]);
    expect(unmetRules("MOTDEPASSE2026!")).toEqual([PASSWORD_RULE_MESSAGE_KEY.LOWER]);
    expect(unmetRules("ÉTAPEÉTAPEé2026!")).toEqual([]);
  });

  it("exige un chiffre", () => {
    expect(unmetRules("MotDePasseEtape!")).toEqual([PASSWORD_RULE_MESSAGE_KEY.DIGIT]);
  });

  it("exige un caractère spécial, espace compris", () => {
    expect(unmetRules("MotDePasse2026")).toEqual([PASSWORD_RULE_MESSAGE_KEY.SPECIAL]);
    expect(unmetRules("Mot De Passe 2026")).toEqual([]);
  });

  it("respecte une longueur minimale fournie", () => {
    expect(getPasswordRules("Ab1!", 4).every((rule) => rule.isSatisfied)).toBe(true);
  });
});
