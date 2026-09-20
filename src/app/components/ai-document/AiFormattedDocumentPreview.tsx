import { forwardRef } from 'react';
import type { DocumentBranding } from '../../types/document';
import type { FormattedDocument } from '../../utils/parse-pasted-document';
import { splitKeyInfo } from '../../utils/highlight-key-info';

export interface DocumentSigner {
  name: string;
  idNumber: string;
}

interface Props {
  document: FormattedDocument;
  branding: DocumentBranding;
  language: 'en' | 'es';
  signers: DocumentSigner[];
}

/** Renders the pasted text as a printable, letter-width page — same
 * visual language as document-preview.tsx (Times New Roman, justified,
 * generous margins) so a document created here doesn't look out of place
 * next to the platform's other documents. Branding (logo/company info) is
 * baked directly into this HTML rather than drawn per-PDF-page like
 * preview-page.tsx's jsPDF header/footer — the letterhead appears once at
 * the top and the footer text once at the bottom, which is the simpler,
 * correct look for a single business document (as opposed to a repeated
 * running header on every page).
 *
 * Signature block: with named signers, each gets their own line with
 * enough blank space above it to actually sign, plus their name and ID
 * printed underneath (the same convention the source contracts already
 * use by hand — see the sample this was built against). With no signers
 * named, it falls back to one generic Firma line. No date field here —
 * the actual signing date is captured electronically once the document
 * goes through the signing flow, so printing a blank "Fecha" line on the
 * document itself is redundant. */
export const AiFormattedDocumentPreview = forwardRef<HTMLDivElement, Props>(function AiFormattedDocumentPreview(
  { document, branding, language, signers },
  ref,
) {
  const companyInfoLines = [
    branding.companyAddressLine1,
    branding.companyAddressLine2,
    [branding.companyCity, branding.companyState, branding.companyZip].filter(Boolean).join(', '),
    branding.companyPhone,
    branding.companyEmail,
    branding.companyWebsite,
  ].filter(Boolean);

  return (
    <div
      ref={ref}
      className="relative mx-auto bg-white"
      style={{ width: 816, fontFamily: '"Times New Roman", Times, Georgia, serif', color: '#000' }}
    >
      <div className="relative px-[44px] pb-[40px] pt-[34px]">
        {(branding.enableLogo && branding.logoDataUrl) || branding.companyLegalName ? (
          <div
            className={`mb-6 flex items-start gap-4 border-b border-slate-200 pb-4 ${branding.logoPosition === 'right' ? 'flex-row-reverse text-right' : ''}`}
          >
            {branding.enableLogo && branding.logoDataUrl && (
              <img src={branding.logoDataUrl} alt="Logo" style={{ height: 56, objectFit: 'contain' }} />
            )}
            {(branding.companyLegalName || companyInfoLines.length > 0) && (
              <div className="min-w-0 flex-1">
                {branding.companyLegalName && (
                  <p className="text-[12px] font-bold uppercase tracking-wide text-black">{branding.companyLegalName}</p>
                )}
                {companyInfoLines.map((line, i) => (
                  <p key={i} className="text-[9px] leading-[1.3] text-slate-600">{line}</p>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {branding.headerText && (
          <p className="mb-4 text-center text-[9px] italic text-slate-500">{branding.headerText}</p>
        )}

        <h1 className="mb-5 text-center text-[15px] font-bold uppercase tracking-wide text-black">
          {document.title}
        </h1>

        {document.sections.map((section, i) => (
          <div key={i} className="mb-4">
            {section.heading && (
              <h2 className="mb-1 text-[12px] font-bold uppercase tracking-wide text-black">{section.heading}</h2>
            )}
            {section.body.split(/\n{2,}/).filter((para) => para.trim()).map((para, j) => (
              <p key={j} className="mb-1.5 text-justify text-[11px] leading-[1.4]">
                {splitKeyInfo(para).map((segment, k) => (
                  segment.bold
                    ? <strong key={k} className="font-bold">{segment.text}</strong>
                    : <span key={k}>{segment.text}</span>
                ))}
              </p>
            ))}
          </div>
        ))}

        {signers.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10">
            {signers.map((signer, i) => (
              <div key={i}>
                <div className="h-20" />
                <div className="border-t border-black pt-1 text-[11px]">
                  {language === 'en' ? 'Signature' : 'Firma'}
                </div>
                {signer.name && <p className="mt-1 text-[11px] font-bold">{signer.name}</p>}
                {signer.idNumber && (
                  <p className="text-[10px] text-slate-600">
                    {language === 'en' ? 'ID' : 'C.C.'} {signer.idNumber}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 w-1/2">
            <div className="h-20" />
            <div className="border-t border-black pt-1 text-[11px]">
              {language === 'en' ? 'Signature' : 'Firma'}
            </div>
          </div>
        )}

        {branding.footerText && (
          <p className="mt-10 border-t border-slate-200 pt-3 text-center text-[9px] italic text-slate-400">
            {branding.footerText}
          </p>
        )}
      </div>
    </div>
  );
});
