import type { VoletDefinition, VoletNoticeContent } from "./types";
import { VOLET_ID } from "./volet-id";

const SUPPORT_EMAIL = "support@etapes.com";

const RELECTURE_CEP_NOTICE: VoletNoticeContent = {
  title: "Relecture par votre conseiller CEP",
  description: "Votre conseiller CEP relira cette section avant de signer votre dossier.",
};

/** Volets du dossier de démission-reconversion pour un projet de formation, dans l'ordre. */
export const VOLETS_DOSSIER: VoletDefinition[] = [
  {
    id: VOLET_ID.INFORMATIONS,
    label: "Mes informations",
    title: "Mes informations",
    description:
      "Indiquez vos informations personnelles. Elles nous permettront de vous contacter au sujet de votre dossier.",
    notice: {
      title: "Informations reprises de votre inscription",
      description:
        "Vos nom, prénom et adresse e-mail ne peuvent pas être modifiés ici. Pour les corriger, écrivez au support\u00a0:",
      contactEmail: SUPPORT_EMAIL,
    },
  },
  {
    id: VOLET_ID.SITUATION_PROFESSIONNELLE,
    label: "Ma situation professionnelle",
    title: "Ma situation professionnelle",
    description:
      "Indiquez l’emploi que vous occupez actuellement, ou celui dont vous avez démissionné.",
  },
  {
    id: VOLET_ID.FUTUR_METIER,
    label: "Mon futur métier",
    title: "Mon futur métier",
    description:
      "Indiquez le métier que vous visez, ce que vous en savez et vos perspectives d’emploi.",
    notice: RELECTURE_CEP_NOTICE,
  },
  {
    id: VOLET_ID.PROJET,
    label: "Mon projet",
    title: "Mon projet",
    description: "Expliquez ce qui vous amène à ce métier et ce qui vous y a préparé.",
    notice: RELECTURE_CEP_NOTICE,
  },
  {
    id: VOLET_ID.FORMATION,
    label: "Ma formation",
    title: "Ma formation",
    description:
      "Présentez la formation que vous voulez suivre et la façon dont elle sera financée.",
    notice: RELECTURE_CEP_NOTICE,
  },
  {
    id: VOLET_ID.CEP,
    label: "Mon CEP",
    title: "Mon Conseiller en Évolution Professionnelle",
    description: "Les informations saisies figureront sur le volet CEP de votre dossier.",
    notice: {
      title: "Partager votre projet avec votre conseiller CEP",
      // Écart à la maquette : « essentiel » accordé, « démission-reconversion » avec son trait d'union.
      description:
        "Cette étape est essentielle dans la complétude de votre dossier de démission-reconversion. Attention, la demande de validation de votre projet sera envoyée à l’adresse mail saisie ci-dessous, veillez à ne pas faire d’erreur.",
    },
  },
  // Sans maquette : ni description ni contenu.
  { id: VOLET_ID.DOCUMENTS, label: "Mes documents", title: "Mes documents" },
];
