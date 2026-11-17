// Au-delà, le message cite « l'union attendue » plutôt qu'une liste illisible.
const MAX_TYPE_NAME_LENGTH = 60;

/**
 * `docs/conventions/typescript.md` §3 : jamais de littéral en dur dans une
 * condition ou un appel. On écrit `status === PDF_STATUS.GENERATING`, pas
 * `status === "generating"`.
 *
 * La règle s'appuie sur les types : elle ne signale une chaîne que là où le code
 * attend une valeur finie, c'est-à-dire une union d'au moins deux chaînes
 * littérales (`PdfStatus`, `keyof ManualAdresseFields`). `event.key === "Enter"`
 * ou `getElementById("x")` attendent un `string` quelconque et passent.
 *
 * Ce qu'elle ne signale pas, volontairement :
 * - le discriminant d'une union (`kcContext.pageId === "login.ftl"`,
 *   `{ type: "RESET" }`), exception écrite de la convention ;
 * - `typeof x === "string"` ;
 * - une union déclarée hors du dépôt (`document.visibilityState`, la
 *   `position` de Radix) : elle n'a pas de constante chez nous ;
 * - un argument passé à une fonction déclarée hors du dépôt (`node_modules`,
 *   bibliothèque standard) : les clés i18n de Keycloakify, `addEventListener`,
 *   les assertions de Vitest ;
 * - la chaîne vide.
 *
 * Elle demande les informations de type (`parserOptions.projectService`) ; sans
 * elles, elle ne fait rien.
 *
 * @type {import("eslint").Rule.RuleModule}
 */
export const noHardcodedLiteral = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Interdit une chaîne en dur là où le type attend une valeur finie (docs/conventions/typescript.md §3).",
    },
    messages: {
      hardcoded:
        "Littéral en dur « {{value}} » : passer par la constante `as const` de `{{type}}` (docs/conventions/typescript.md §3).",
    },
    schema: [],
  },
  create(context) {
    const services = context.sourceCode.parserServices;
    if (!services?.program || !services.esTreeNodeToTSNodeMap) return {};

    const program = services.program;
    const checker = program.getTypeChecker();
    const toTs = (node) => services.esTreeNodeToTSNodeMap.get(node);
    const typeOf = (node) => checker.getTypeAtLocation(toTs(node));

    const literalValue = (node) => {
      if (node.type === "Literal" && typeof node.value === "string") return node.value;
      if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
        return node.quasis[0].value.cooked;
      }
      return undefined;
    };

    const isNullish = (type) => {
      const name = checker.typeToString(type);
      return name === "undefined" || name === "null";
    };

    // Une valeur finie : au moins deux chaînes littérales, éventuellement
    // optionnelle. Une seule chaîne littérale n'a pas de constante à proposer.
    const isFiniteStringUnion = (type) => {
      if (!type.isUnion()) return false;
      const literals = type.types.filter((member) => member.isStringLiteral());
      const others = type.types.filter((member) => !member.isStringLiteral());
      return literals.length >= 2 && others.every(isNullish);
    };

    // `objet.prop` est un discriminant quand `objet` est une union dont chaque
    // membre porte `prop` avec un type littéral. `objet?.prop` aussi : on ignore
    // le `undefined` de l'union.
    const isDiscriminant = (node) => {
      if (node.type !== "MemberExpression" || node.computed) return false;
      const objectType = typeOf(node.object);
      if (!objectType.isUnion()) return false;
      const members = objectType.types.filter((member) => !isNullish(member));
      if (members.length < 2) return false;
      return members.every((member) => {
        const property = member.getProperty(node.property.name);
        if (property === undefined) return false;
        return checker.getTypeOfSymbolAtLocation(property, toTs(node)).isLiteral();
      });
    };

    const isOutsideRepository = (declaration) => {
      const sourceFile = declaration.getSourceFile();
      return (
        program.isSourceFileDefaultLibrary(sourceFile) ||
        program.isSourceFileFromExternalLibrary(sourceFile) ||
        sourceFile.fileName.includes("/node_modules/")
      );
    };

    // Le nom de l'alias quand il existe (`PdfStatus`), sinon l'union écrite en
    // entier tant qu'elle reste lisible.
    const typeName = (type) => {
      if (type.aliasSymbol !== undefined) return type.aliasSymbol.getName();
      const written = checker.typeToString(type);
      return written.length <= MAX_TYPE_NAME_LENGTH ? written : "l'union attendue";
    };

    const report = (node, value, type) => {
      context.report({ node, messageId: "hardcoded", data: { value, type: typeName(type) } });
    };

    // Propriété d'où vient la valeur comparée : `objet.prop`, ou `prop`
    // déstructurée d'un objet (`function C({ position })`).
    const sourceProperty = (expression) => {
      if (expression.type === "MemberExpression" && !expression.computed) {
        return typeOf(expression.object).getProperty(expression.property.name);
      }
      if (expression.type !== "Identifier") return undefined;

      const variable = context.sourceCode
        .getScope(expression)
        .references.find((reference) => reference.identifier === expression)?.resolved;
      let binding = variable?.defs[0]?.name.parent;
      if (binding?.type === "AssignmentPattern") binding = binding.parent;
      if (binding?.type !== "Property" || binding.parent.type !== "ObjectPattern") return undefined;
      if (binding.key.type !== "Identifier") return undefined;
      return typeOf(binding.parent).getProperty(binding.key.name);
    };

    // Une union déclarée par une bibliothèque (`DocumentVisibilityState`, la
    // `position` de Radix) n'a pas de constante dans le dépôt : on ne la signale pas.
    const isDeclaredOutsideRepository = (expression, type) => {
      const symbol = type.aliasSymbol ?? sourceProperty(expression);
      const declarations = symbol?.getDeclarations() ?? [];
      return declarations.length !== 0 && declarations.every(isOutsideRepository);
    };

    const checkComparedTo = (compared, literalNode) => {
      const expression = compared.type === "ChainExpression" ? compared.expression : compared;
      const value = literalValue(literalNode);
      if (value === undefined || value === "") return;
      if (expression.type === "UnaryExpression" && expression.operator === "typeof") return;
      if (isDiscriminant(expression)) return;
      const type = typeOf(expression);
      if (!isFiniteStringUnion(type)) return;
      if (isDeclaredOutsideRepository(expression, type)) return;
      report(literalNode, value, type);
    };

    const checkArguments = (node) => {
      const tsNode = toTs(node);
      const signature = checker.getResolvedSignature(tsNode);
      const declaration = signature?.getDeclaration();
      if (declaration === undefined || isOutsideRepository(declaration)) return;

      for (const argument of node.arguments) {
        const value = literalValue(argument);
        if (value === undefined || value === "") continue;
        const type = checker.getContextualType(toTs(argument));
        if (type !== undefined && isFiniteStringUnion(type)) report(argument, value, type);
      }
    };

    return {
      BinaryExpression(node) {
        if (!["===", "!==", "==", "!="].includes(node.operator)) return;
        checkComparedTo(node.left, node.right);
        checkComparedTo(node.right, node.left);
      },
      SwitchStatement(node) {
        for (const switchCase of node.cases) {
          if (switchCase.test !== null) checkComparedTo(node.discriminant, switchCase.test);
        }
      },
      CallExpression: checkArguments,
      NewExpression: checkArguments,
    };
  },
};

/**
 * Bloc de configuration partagé par les presets `base` et `next`. Seule règle du
 * dépôt qui lit les types, d'où le `projectService` limité à `src/` : les
 * `*.config.ts` à la racine d'un workspace ne sont pas tous dans un tsconfig.
 *
 * @type {import("eslint").Linter.Config}
 */
export const noHardcodedLiteralConfig = {
  files: ["**/src/**/*.{ts,tsx}"],
  languageOptions: {
    parserOptions: { projectService: true },
  },
  plugins: { etape: { rules: { "no-hardcoded-literal": noHardcodedLiteral } } },
  rules: {
    "etape/no-hardcoded-literal": "error",
  },
};
