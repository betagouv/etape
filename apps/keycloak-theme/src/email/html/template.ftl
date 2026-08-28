<#--
  Enveloppe commune à tous les emails HTML.

  Écrite en tables et en styles en ligne : les clients de messagerie ignorent les
  feuilles de style externes, et beaucoup ignorent aussi les balises `<style>`.
  Aucune police distante non plus — on retombe sur la pile système, Open Sans
  n'étant pas disponible dans une boîte mail.

  Tout email hérité de `base` passe par ici, y compris ceux que nous n'avons pas
  repris : la marque reste cohérente sans avoir à tous les réécrire.
-->
<#macro emailLayout>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${realmName}</title>
</head>
<body style="margin:0; padding:0; background-color:#fafafa; -webkit-font-smoothing:antialiased;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafafa;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">
                    <tr>
                        <td style="padding-bottom:24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:20px; font-weight:700; letter-spacing:0.04em; color:#00796b;">
                            ETAPE
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#ffffff; border:1px solid #d6d6d6; border-radius:16px; padding:40px 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:16px; line-height:24px; color:#434343;">
                            <#nested>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top:24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:12px; line-height:16px; color:#575757;">
                            ${msg("etapeEmailFooter")}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
</#macro>

<#--
  Bouton principal.

  Une table plutôt qu'un `<a>` stylé : sans elle, Outlook sur Windows ignore le
  fond et le rembourrage, et le bouton se réduit à un lien bleu souligné.
-->
<#macro button href label>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
        <td align="center" bgcolor="#00796b" style="border-radius:12px;">
            <a href="${href}" style="display:inline-block; padding:12px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:16px; font-weight:600; line-height:20px; color:#ffffff; text-decoration:none; border-radius:12px;">
                ${label}
            </a>
        </td>
    </tr>
</table>
</#macro>

<#--
  Rappel du lien en clair.

  Le bouton peut être neutralisé — client en mode texte, images et liens
  réécrits par un antivirus de messagerie. Sans cette reprise, l'email devient
  une impasse.
-->
<#macro fallbackLink href>
<p style="margin:24px 0 0; font-size:12px; line-height:16px; color:#575757;">
    ${msg("etapeEmailFallback")}<br />
    <#-- Gris et non teal : ces URL font dix lignes, les teinter en couleur
         d'action ferait passer le repli avant le bouton. -->
    <a href="${href}" style="color:#575757; word-break:break-all;">${href}</a>
</p>
</#macro>
