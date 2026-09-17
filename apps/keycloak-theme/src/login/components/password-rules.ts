export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_RULE_MESSAGE_KEY = {
  LENGTH: "etapePasswordRuleLength",
  UPPER: "etapePasswordRuleUpper",
  LOWER: "etapePasswordRuleLower",
  DIGIT: "etapePasswordRuleDigit",
  SPECIAL: "etapePasswordRuleSpecial",
} as const;

export type PasswordRuleMessageKey =
  (typeof PASSWORD_RULE_MESSAGE_KEY)[keyof typeof PASSWORD_RULE_MESSAGE_KEY];

export interface PasswordRule {
  messageKey: PasswordRuleMessageKey;
  isSatisfied: boolean;
}

/** Même lecture que la politique du realm : `length`, `upperCase`, `lowerCase`, `digits`, `specialChars`. */
export function getPasswordRules(value: string, minLength = PASSWORD_MIN_LENGTH): PasswordRule[] {
  return [
    { messageKey: PASSWORD_RULE_MESSAGE_KEY.LENGTH, isSatisfied: value.length >= minLength },
    { messageKey: PASSWORD_RULE_MESSAGE_KEY.UPPER, isSatisfied: /\p{Lu}/u.test(value) },
    { messageKey: PASSWORD_RULE_MESSAGE_KEY.LOWER, isSatisfied: /\p{Ll}/u.test(value) },
    { messageKey: PASSWORD_RULE_MESSAGE_KEY.DIGIT, isSatisfied: /\p{Nd}/u.test(value) },
    { messageKey: PASSWORD_RULE_MESSAGE_KEY.SPECIAL, isSatisfied: /[^\p{L}\p{N}]/u.test(value) },
  ];
}
