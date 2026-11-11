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

const UPPER_PATTERN = /\p{Uppercase}/u;
const LOWER_PATTERN = /\p{Lowercase}/u;
const DIGIT_PATTERN = /\p{Nd}/u;
const SPECIAL_PATTERN = /[^\p{L}\p{Nd}]/u;

const hasCodeUnit = (value: string, pattern: RegExp): boolean =>
  value.split("").some((unit) => pattern.test(unit));

export function getPasswordRules(value: string, minLength = PASSWORD_MIN_LENGTH): PasswordRule[] {
  return [
    { messageKey: PASSWORD_RULE_MESSAGE_KEY.LENGTH, isSatisfied: value.length >= minLength },
    { messageKey: PASSWORD_RULE_MESSAGE_KEY.UPPER, isSatisfied: hasCodeUnit(value, UPPER_PATTERN) },
    { messageKey: PASSWORD_RULE_MESSAGE_KEY.LOWER, isSatisfied: hasCodeUnit(value, LOWER_PATTERN) },
    { messageKey: PASSWORD_RULE_MESSAGE_KEY.DIGIT, isSatisfied: hasCodeUnit(value, DIGIT_PATTERN) },
    {
      messageKey: PASSWORD_RULE_MESSAGE_KEY.SPECIAL,
      isSatisfied: hasCodeUnit(value, SPECIAL_PATTERN),
    },
  ];
}
