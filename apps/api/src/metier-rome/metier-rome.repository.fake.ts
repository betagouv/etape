import { normalizeForSearch } from "@etape/utils/text";

import type { MetierRomeRepository } from "./metier-rome.repository.js";
import type {
  AppellationRome,
  AppellationRomeSearchResult,
  MetierRome,
  VersionRome,
} from "./metier-rome.types.js";

interface StoredMetierRome {
  libelle: string;
  isObsolete: boolean;
}

interface StoredAppellationRome extends Omit<AppellationRome, "code"> {
  codeMetier: string;
  isObsolete: boolean;
}

/**
 * Double de test : le référentiel en mémoire, écrit comme la base l'écrit.
 * Exclu du build (`tsconfig.build.json`).
 */
export class FakeMetierRomeRepository implements MetierRomeRepository {
  readonly metiers = new Map<string, StoredMetierRome>();
  readonly appellations = new Map<string, StoredAppellationRome>();
  /** La dernière importée en dernier. */
  readonly versions: VersionRome[] = [];

  async searchAppellationsRome(
    words: string[],
    limit: number,
  ): Promise<AppellationRomeSearchResult> {
    const searchedWords = words.map(normalizeForSearch);
    const [firstWord = ""] = searchedWords;

    const found = [...this.appellations]
      .flatMap(([code, { libelle, codeMetier, isObsolete }]) => {
        const metier = this.metiers.get(codeMetier);
        if (isObsolete || !metier) return [];

        return [
          {
            sortKey: normalizeForSearch(libelle),
            appellation: {
              code,
              libelle,
              metierRome: { code: codeMetier, libelle: metier.libelle },
            },
          },
        ];
      })
      .filter(({ sortKey }) => searchedWords.every((word) => sortKey.includes(word)))
      .sort(
        (a, b) =>
          Number(b.sortKey.startsWith(firstWord)) - Number(a.sortKey.startsWith(firstWord)) ||
          a.sortKey.localeCompare(b.sortKey) ||
          a.appellation.code.localeCompare(b.appellation.code),
      );

    return {
      appellationRomeCount: found.length,
      appellationsRome: found.slice(0, limit).map(({ appellation }) => appellation),
    };
  }

  async findCurrentVersionRome(): Promise<VersionRome | null> {
    return this.versions.at(-1) ?? null;
  }

  async saveMetiersRome(metiers: MetierRome[]): Promise<void> {
    for (const { code: codeMetier, libelle, appellations } of metiers) {
      this.metiers.set(codeMetier, { libelle, isObsolete: false });

      for (const { code, ...appellation } of appellations) {
        this.appellations.set(code, { ...appellation, codeMetier, isObsolete: false });
      }
    }
  }

  async markMetiersRomeObsoleteExcept(codes: string[]): Promise<void> {
    for (const [code, metier] of this.metiers) {
      if (!codes.includes(code)) this.metiers.set(code, { ...metier, isObsolete: true });
    }
  }

  async markAppellationsRomeObsoleteExcept(codes: string[]): Promise<void> {
    for (const [code, appellation] of this.appellations) {
      if (!codes.includes(code)) {
        this.appellations.set(code, { ...appellation, isObsolete: true });
      }
    }
  }

  async saveVersionRome(version: VersionRome): Promise<void> {
    const index = this.versions.findIndex((stored) => stored.version === version.version);
    if (index >= 0) this.versions.splice(index, 1);
    this.versions.push(version);
  }

  transaction<T>(run: (repository: MetierRomeRepository) => Promise<T>): Promise<T> {
    return run(this);
  }
}
