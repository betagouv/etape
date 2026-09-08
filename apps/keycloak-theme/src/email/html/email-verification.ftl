<#import "template.ftl" as layout>
<@layout.emailLayout>
<h1 style="margin:0 0 16px; font-size:24px; line-height:32px; font-weight:700; color:#1b1b1b;">
    ${msg("etapeEmailVerificationTitle")}
</h1>
<p style="margin:0;">${msg("etapeEmailVerificationIntro")}</p>
<@layout.button href=link label=msg("etapeEmailVerificationCta") />
<p style="margin:0; font-size:14px; line-height:20px; color:#575757;">
    ${msg("etapeEmailLinkExpires", linkExpirationFormatter(linkExpiration))}
</p>
<p style="margin:8px 0 0; font-size:14px; line-height:20px; color:#575757;">
    ${msg("etapeEmailIgnoreRegistration")}
</p>
<@layout.fallbackLink href=link />
</@layout.emailLayout>
