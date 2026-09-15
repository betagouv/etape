import { Fragment } from "react";
import { Document, Link, Page, Text, View } from "@react-pdf/renderer";

import { CEP_URL } from "../domain/catalogue";
import type { RecapEntry } from "../domain/recap";
import {
  CATEGORIE_LABELS,
  CATEGORIES,
  type Categorie,
  type ResultatAffiche,
} from "../domain/types";
import { registerPdfFonts } from "./fonts";
import { CATEGORIE_COLORS, pdfStyles } from "./pdf-styles";

registerPdfFonts();

/**
 * Pagination : un titre (de section ou de catégorie) ne doit pas rester seul en
 * bas de page. `minPresenceAhead` exige qu'au moins cette hauteur (en points)
 * de contenu le suive sur la même page — celle d'un résultat à trois lignes de
 * description, le plus courant, pour que le premier résultat suive toujours.
 *
 * react-pdf n'applique cette règle qu'entre frères d'un même parent, et
 * seulement si le titre a des frères avant lui : tous les blocs sont donc des
 * enfants directs de `Page` (pas de `View` de section ni de groupe), et la
 * bordure de catégorie est portée par chaque bloc.
 */
const MIN_PRESENCE_AHEAD = 80;

interface ResultsPdfDocumentProps {
  resultats: ResultatAffiche[];
  recapEntries: RecapEntry[];
}

/** « Interlocuteur » / « Interlocuteurs » selon le nombre de cartes du groupe. */
function categorieTitle(categorie: Categorie, count: number): string {
  const label = CATEGORIE_LABELS[categorie];
  return count > 1 ? `${label}s` : label;
}

/**
 * Document imprimable : une transcription en une colonne de ce qui est
 * affiché à l'écran (résultats groupés par catégorie, puis récapitulatif),
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

        {CATEGORIES.map((categorie) => {
          const items = resultats.filter((resultat) => resultat.categorie === categorie);
          if (items.length === 0) return null;

          const bordure = { borderLeftColor: CATEGORIE_COLORS[categorie] };
          const accent = { color: CATEGORIE_COLORS[categorie] };

          return (
            <Fragment key={categorie}>
              <View
                style={[pdfStyles.categorieBadgeRow, bordure]}
                minPresenceAhead={MIN_PRESENCE_AHEAD}
              >
                <View style={[pdfStyles.categorieDot, { backgroundColor: accent.color }]} />
                <Text style={[pdfStyles.categorieLabel, accent]}>
                  {categorieTitle(categorie, items.length)}
                </Text>
              </View>
              {items.map((resultat) => (
                // Un résultat est un bloc insécable.
                <View key={resultat.id} style={[pdfStyles.resultat, bordure]} wrap={false}>
                  <Text style={pdfStyles.resultatNom}>{resultat.nom}</Text>
                  <Text style={pdfStyles.resultatDescription}>{resultat.description}</Text>
                  <Link src={resultat.url} style={[pdfStyles.resultatUrl, accent]}>
                    {resultat.url}
                  </Link>
                </View>
              ))}
            </Fragment>
          );
        })}

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

        <View style={pdfStyles.footerBox} wrap={false}>
          <Text style={pdfStyles.footerText}>
            Cet outil donne une orientation indicative, susceptible d’évoluer, et ne remplace pas
            l’accompagnement personnalisé et gratuit d’un{" "}
            <Link src={CEP_URL} style={pdfStyles.footerLink}>
              conseiller CEP
            </Link>
            .
          </Text>
        </View>
      </Page>
    </Document>
  );
}
