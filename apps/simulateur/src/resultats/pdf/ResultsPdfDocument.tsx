import { Document, Link, Page, Text, View } from "@react-pdf/renderer";

import type { RecapEntry } from "../domain/recap";
import { CATEGORIE_LABELS, type ResultatAffiche } from "../domain/types";
import { registerPdfFonts } from "./fonts";
import { CATEGORIE_COLORS, ON_PRIMARY_COLOR, pdfStyles } from "./pdf-styles";

registerPdfFonts();

/**
 * Pagination : un titre de section ne doit pas rester seul en bas de page.
 * `minPresenceAhead` exige qu'au moins cette hauteur (en points) de contenu le
 * suive sur la même page — trois lignes du récapitulatif. Le titre des
 * résultats, lui, suit le bandeau en haut de la première page.
 *
 * react-pdf n'applique cette règle qu'entre frères d'un même parent, et
 * seulement si le titre a des frères avant lui : tous les blocs sont donc des
 * enfants directs de `Page` (pas de `View` de section).
 */
const MIN_PRESENCE_AHEAD = 80;

interface ResultsPdfDocumentProps {
  resultats: ResultatAffiche[];
  recapEntries: RecapEntry[];
}

interface ResultatBlockProps {
  resultat: ResultatAffiche;
}

/** Un résultat ; le prioritaire reprend le fond `primary` de sa carte à l'écran. */
function ResultatBlock({ resultat }: ResultatBlockProps) {
  const { nom, description, url, categorie, isPrioritaire } = resultat;
  const accent = { color: isPrioritaire ? ON_PRIMARY_COLOR : CATEGORIE_COLORS[categorie] };

  return (
    // Un résultat est un bloc insécable.
    <View
      style={[
        pdfStyles.resultat,
        isPrioritaire ? pdfStyles.resultatPrioritaire : { borderLeftColor: accent.color },
      ]}
      wrap={false}
    >
      <View style={pdfStyles.categorieRow}>
        <View style={[pdfStyles.categorieDot, { backgroundColor: accent.color }]} />
        <Text style={[pdfStyles.categorieLabel, accent]}>{CATEGORIE_LABELS[categorie]}</Text>
      </View>
      <Text style={pdfStyles.resultatNom}>{nom}</Text>
      <Text
        style={
          isPrioritaire ? [pdfStyles.resultatDescription, accent] : pdfStyles.resultatDescription
        }
      >
        {description}
      </Text>
      <Link src={url} style={[pdfStyles.resultatUrl, accent]}>
        {url}
      </Link>
    </View>
  );
}

/**
 * Document imprimable : une transcription en une colonne de ce qui est
 * affiché à l'écran (résultats dans le même ordre, puis récapitulatif),
 * pas une reproduction visuelle de la grille de cartes — voir
 * `pdf-styles.ts`. Ne recalcule rien à partir des réponses : reçoit les
 * données déjà calculées par `ResultsScreen`, pour ne jamais diverger de ce
 * que la personne a vu à l'écran.
 *
 * Les URL sont des `Link` (annotations cliquables) et la langue du document
 * est déclarée. react-pdf ne produit pas de PDF balisé (PDF/UA) : la page
 * HTML reste la version accessible des résultats, le PDF en est une copie
 * imprimable.
 */
export function ResultsPdfDocument({ resultats, recapEntries }: ResultsPdfDocumentProps) {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document title="Résultats — Simulateur ETAPE" language="fr">
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.banner}>
          <Text style={pdfStyles.bannerTitle}>ETAPE — Vos résultats</Text>
          <Text style={pdfStyles.bannerSubtitle}>Simulation du {date}</Text>
        </View>

        <Text style={pdfStyles.sectionTitle} minPresenceAhead={MIN_PRESENCE_AHEAD}>
          {resultats.length <= 1
            ? `${resultats.length} résultat correspond à votre situation`
            : `${resultats.length} résultats correspondent à votre situation`}
        </Text>

        {resultats.map((resultat) => (
          <ResultatBlock key={resultat.id} resultat={resultat} />
        ))}

        {recapEntries.length > 0 && (
          <>
            <Text
              style={[pdfStyles.sectionTitle, pdfStyles.sectionTitleSpaced]}
              minPresenceAhead={MIN_PRESENCE_AHEAD}
            >
              Récapitulatif de vos réponses
            </Text>
            {recapEntries.map((entry) => (
              <View
                key={`${entry.questionId}-${entry.fieldName}`}
                style={pdfStyles.recapRow}
                wrap={false}
              >
                <Text style={pdfStyles.recapQuestion}>{entry.question}</Text>
                <Text style={pdfStyles.recapAnswer}>{entry.answer}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
