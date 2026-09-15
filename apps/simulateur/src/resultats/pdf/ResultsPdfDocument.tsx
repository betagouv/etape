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

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>
            {resultats.length <= 1
              ? `${resultats.length} résultat correspond à votre situation`
              : `${resultats.length} résultats correspondent à votre situation`}
          </Text>

          {CATEGORIES.map((categorie) => {
            const items = resultats.filter((resultat) => resultat.categorie === categorie);
            if (items.length === 0) return null;

            const accent = CATEGORIE_COLORS[categorie];

            return (
              <View key={categorie} style={[pdfStyles.categorieGroup, { borderLeftColor: accent }]}>
                <View style={pdfStyles.categorieBadgeRow}>
                  <View style={[pdfStyles.categorieDot, { backgroundColor: accent }]} />
                  <Text style={[pdfStyles.categorieLabel, { color: accent }]}>
                    {categorieTitle(categorie, items.length)}
                  </Text>
                </View>
                {items.map((resultat) => (
                  <View key={resultat.id} style={pdfStyles.resultat}>
                    <Text style={pdfStyles.resultatNom}>{resultat.nom}</Text>
                    <Text style={pdfStyles.resultatDescription}>{resultat.description}</Text>
                    <Link src={resultat.url} style={[pdfStyles.resultatUrl, { color: accent }]}>
                      {resultat.url}
                    </Link>
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {recapEntries.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Récapitulatif de vos réponses</Text>
            {recapEntries.map((entry) => (
              <View key={`${entry.questionId}-${entry.fieldName}`} style={pdfStyles.recapRow}>
                <Text style={pdfStyles.recapQuestion}>{entry.question}</Text>
                <Text style={pdfStyles.recapAnswer}>{entry.answer}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={pdfStyles.footerBox}>
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
