// Styles du PDF de résultats.
//
// react-pdf a son propre moteur de mise en page (sous-ensemble flexbox) et ne
// lit pas les variables CSS de `packages/ui/src/styles/globals.css` : les
// couleurs utiles y sont reprises en dur. Document en une colonne — pas une
// réplique de la grille de cartes de l'écran — mais habillé des couleurs de
// marque (bandeau, tags de catégorie, encart), reprises des mêmes tokens que
// `CategorieTag.tsx` pour rester cohérent avec l'écran.

import { StyleSheet } from "@react-pdf/renderer";

import type { Categorie } from "../domain/types";
import { PDF_FONT_FAMILY } from "./fonts";

// Sous-ensemble de `packages/ui/src/styles/globals.css` (thème clair —
// un PDF ne suit pas le thème sombre de l'app).
const COLORS = {
  foreground: "#1b1b1b", // --foreground
  secondary: "#434343", // --content-secondary
  muted: "#575757", // --muted-foreground
  primary: "#00796b", // --primary / --content-accent
  border: "#d6d6d6", // --border
  white: "#ffffff",
  calloutBg: "#e0f2f1", // --secondary
  calloutText: "#00695c", // --secondary-foreground
};

/** Couleur d'accent par catégorie — les mêmes tokens que `CategorieTag.tsx`. */
export const CATEGORIE_COLORS: Record<Categorie, string> = {
  interlocuteur: "#00695c", // --secondary-foreground
  outil: "#1d4ed8", // --info-text
  dispositif: "#047857", // --success-text
};

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 10,
    lineHeight: 1.4,
    color: COLORS.foreground,
    paddingVertical: 40,
    paddingHorizontal: 48,
  },
  banner: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.white,
  },
  bannerSubtitle: {
    marginTop: 10,
    fontSize: 10,
    color: COLORS.calloutBg,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  recapRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recapQuestion: {
    flex: 1,
    color: COLORS.secondary,
  },
  recapAnswer: {
    flex: 1,
    fontWeight: 600,
  },
  categorieGroup: {
    marginTop: 14,
    paddingLeft: 10,
    borderLeftWidth: 3,
  },
  categorieBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  categorieDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categorieLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  resultat: {
    marginBottom: 10,
  },
  resultatNom: {
    fontSize: 11,
    fontWeight: 700,
  },
  resultatDescription: {
    marginTop: 2,
    color: COLORS.secondary,
  },
  resultatUrl: {
    marginTop: 3,
    color: COLORS.primary,
  },
  footerBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 4,
    backgroundColor: COLORS.calloutBg,
  },
  footerText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.calloutText,
  },
});
