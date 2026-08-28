/**
 * Veinte páginas en inglés para el mercado de Estados Unidos.
 *
 * ── De dónde salen estos veinte temas ────────────────────────────────────
 *
 * No de una lluvia de ideas: de Search Console, 12 meses. Estados Unidos
 * generaba 205 impresiones y CERO clics en posición media 40 — es decir, la
 * gente ya nos ve, pero en la cuarta página y para consultas que no teníamos
 * cubiertas con una página propia. Los grupos, por volumen real medido:
 *
 *   · Letter of Intent — 53 impresiones repartidas en siete consultas
 *     («loi letter of intent», «carta de intenciones», «letter of intent
 *     compraventa»…). Es el grupo más grande del sitio y no existía ni una
 *     página dedicada: sólo un artículo de blog en posición 52.
 *   · ESIGN Act / UETA — 16 impresiones en consultas legales, más 78
 *     impresiones del artículo de blog en posición 52 sin un solo clic.
 *   · Bancos y servicios financieros — 14 impresiones.
 *   · Agentes inmobiliarios — 7 impresiones, más las consultas de «docusign
 *     lease agreement» y «docusign rental agreement template».
 *   · Alternativa a DocuSign — consultas de marca de la competencia, que son
 *     las de mayor intención de compra que existen.
 *
 * ── Por qué el texto es largo y concreto ─────────────────────────────────
 *
 * Ver el estándar de CLAUDE.md: una página de aterrizaje que sólo cambia un
 * nombre dentro de una plantilla se lee como lo que es. Cada una lleva su
 * dolor concreto, una cita legal real y verificable, un caso reconocible y
 * sus propias preguntas frecuentes. Es lo que separa un grupo de páginas
 * deliberado de un montón de páginas hiladas.
 */

export interface PaginaUS {
  slug: string;
  /** ≤ 60 caracteres: Google corta ahí. */
  titleTag: string;
  /** ≤ 155 caracteres. */
  metaDescription: string;
  h1: string;
  /** El grupo temático, para enlazar entre hermanas. */
  grupo: 'loi' | 'legal' | 'finance' | 'realestate' | 'compare' | 'family' | 'money' | 'lease'
    | 'poa' | 'will' | 'resignation' | 'travel' | 'b2b' | 'free';
  intro: string;
  problema: { titulo: string; texto: string };
  puntos: Array<{ titulo: string; texto: string }>;
  ley: { titulo: string; texto: string };
  caso: { titulo: string; texto: string };
  faq: Array<{ q: string; a: string }>;
  fotos: [string, string, string];
  cta: string;
}

const F = {
  firma: '/images/seo/tablet-sign-business.jpg',
  revisar: '/images/seo/tablet-review-woman.jpg',
  escritorio: '/images/seo/dashboard-desk.jpg',
  oficina: '/images/seo/office-tablet-woman.jpg',
  hombre: '/images/seo/app-man-blue.jpg',
  mujer: '/images/seo/app-woman-blue.jpg',
  tech: '/images/seo/app-woman-tech-blue.jpg',
  movil: '/images/contadores/profesional-movil.jpg',
} as const;

export const PAGINAS_US: PaginaUS[] = [
  // ═══════════════ LETTER OF INTENT — el grupo de más demanda ═══════════
  {
    slug: 'letter-of-intent',
    titleTag: 'Free Letter of Intent Template',
    metaDescription: 'Write a letter of intent that states what is binding and what is not. Free template, instant preview, signed online under the ESIGN Act.',
    h1: 'Letter of Intent',
    grupo: 'loi',
    intro: 'A letter of intent puts a handshake on paper before anyone spends money on lawyers. It says what the two sides have agreed in principle, what still has to be worked out, and how long the other party has to decide. Written well, it moves a deal forward. Written carelessly, it accidentally becomes the deal.',
    problema: {
      titulo: 'The clause that turns a maybe into a contract',
      texto: 'Most people write a letter of intent believing it commits them to nothing. That belief is wrong often enough to matter. Courts across the United States have repeatedly enforced letters of intent that read like final agreements — because the document named a price, named a closing date, described exactly what was being sold, and never once said it was non-binding. Intent is judged by what the paper says, not by what the writer assumed. The fix is one paragraph, and it is the paragraph most templates leave out.',
    },
    puntos: [
      { titulo: 'It separates what binds from what does not', texto: 'Almost every letter of intent is a hybrid. The commercial terms — price, structure, timeline — are meant as a starting point. But confidentiality, exclusivity, who pays their own costs, and which state law governs are usually meant to bind from the day it is signed. Our template keeps those two groups visibly apart, so nobody has to argue later about which was which.' },
      { titulo: 'It sets a deadline that actually expires', texto: 'A letter of intent with no expiry is an option the other side holds for free. Ours carries an expiry date and states plainly what happens when it passes: the terms lapse and neither side owes the other anything. That single line is what stops a buyer from sitting on your business for four months while they shop around.' },
      { titulo: 'It records exclusivity in writing', texto: 'If you have agreed to stop talking to other buyers, that promise is worth writing down with its own end date. If you have not agreed to that, the document should say so — otherwise the other side may believe you did, and behave accordingly.' },
      { titulo: 'It survives the deal falling apart', texto: 'Roughly half of all letters of intent never become contracts. What matters then is that the confidentiality clause outlives the negotiation, so the numbers you disclosed do not travel to a competitor. Ours states its own survival period rather than going quiet on the point.' },
    ],
    ley: {
      titulo: 'What makes it enforceable',
      texto: 'There is no federal statute governing letters of intent; enforceability is decided under the contract law of the state you name. What is settled is the signature: the Electronic Signatures in Global and National Commerce Act, 15 U.S.C. § 7001, provides that a signature, contract or record may not be denied legal effect solely because it is in electronic form. Every state except New York has also adopted the Uniform Electronic Transactions Act; New York reaches the same result through its Electronic Signatures and Records Act, State Technology Law § 304. So the question is never whether your electronic signature counts — it is whether the words above it say what you meant.',
    },
    caso: {
      titulo: 'A seller who nearly gave away four months',
      texto: 'A founder agreed to sell a small logistics company and signed a two-page letter of intent the buyer sent over. It named a price, a structure, and a diligence period — and said nothing about exclusivity or expiry. The buyer took eleven weeks, renegotiated down twice, and walked. The founder had turned away two other approaches during that period because she believed the letter obliged her to. It did not. It also did not oblige the buyer to anything. The document she should have signed was the same length, with two more paragraphs.',
    },
    faq: [
      { q: 'Is a letter of intent legally binding?', a: 'Usually only in part. The commercial terms are normally non-binding until a definitive agreement is signed, while confidentiality, exclusivity, cost allocation and governing law are normally intended to bind immediately. What decides it is the wording, not the label — a document titled "non-binding" that reads like a contract has been enforced as one.' },
      { q: 'What is the difference between an LOI and a term sheet?', a: 'In practice, very little. A term sheet is usually a bulleted list of commercial terms, common in investment deals; a letter of intent is written as a letter and is more common in acquisitions and real estate. Both carry the same legal risk if they omit the binding/non-binding split.' },
      { q: 'Do both parties have to sign it?', a: 'A letter of intent signed by only one side is an offer, not an understanding. Countersignature is what turns it into a shared record — and is what makes the confidentiality and exclusivity clauses enforceable against the other party.' },
      { q: 'How long should a letter of intent stay open?', a: 'Long enough for real diligence, short enough that it costs the other side something to stall. Thirty to sixty days is common for a small business sale; two weeks is common in residential real estate. The number matters less than having one.' },
    ],
    fotos: [F.firma, F.revisar, F.oficina],
    cta: 'Write your letter of intent free',
  },
  {
    slug: 'letter-of-intent-real-estate',
    titleTag: 'Real Estate Letter of Intent Template',
    metaDescription: 'Free real estate letter of intent for a purchase or lease. Sets price, term and diligence, and says clearly what binds. Sign it online.',
    h1: 'Real Estate Letter of Intent',
    grupo: 'loi',
    intro: 'Before a purchase and sale agreement exists, a real estate deal lives in a letter of intent. It fixes the price, the deposit, how long the buyer has to inspect, and who pays for what at closing — with enough precision that the lawyers can draft from it, and enough restraint that nobody is locked in yet.',
    problema: {
      titulo: 'Where property deals fall apart',
      texto: 'Almost never over price. They fall apart over what "as is" was supposed to mean, who was paying for the survey, whether the tenant estoppels were the seller\'s job, and how many days the buyer really had. Those items are cheap to settle in a letter of intent and expensive to argue about once earnest money is at stake and a closing date is on a calendar.',
    },
    puntos: [
      { titulo: 'Price, deposit and how the deposit behaves', texto: 'The number matters less than the conditions around it. Our template records the purchase price, the earnest money amount, when it goes hard, and what happens to it if the buyer walks during diligence. Deals sour when a deposit turns non-refundable on a date nobody wrote down.' },
      { titulo: 'A diligence window with a stated start', texto: 'Thirty days from when? Signature, or delivery of the seller\'s documents? That ambiguity has cost buyers entire inspection periods. The template makes the trigger explicit.' },
      { titulo: 'What conveys and what does not', texto: 'Appliances, fixtures, equipment, existing leases, service contracts. Listing them in the letter of intent is ten minutes of work that removes the most common closing-table argument in commercial property.' },
      { titulo: 'Exclusivity with an end date', texto: 'A seller who takes the property off the market is giving up real optionality. That is worth granting in exchange for a deposit or a shorter diligence window — and worth writing with an expiry so it does not run indefinitely.' },
    ],
    ley: {
      titulo: 'Why the writing requirement matters here',
      texto: 'Every U.S. state enforces some version of the Statute of Frauds, which requires contracts for the sale of an interest in land to be in writing and signed by the party to be charged. That is precisely why a real estate letter of intent needs its non-binding language stated rather than assumed: a signed writing that identifies the parties, the property and the price is exactly the shape a court looks for. The signature itself is settled — the ESIGN Act, 15 U.S.C. § 7001, gives electronic signatures the same effect as ink, and UETA does the same at state level in 49 states.',
    },
    caso: {
      titulo: 'A retail building and a survey nobody ordered',
      texto: 'A buyer and seller agreed on a strip retail property in about a week. The letter of intent covered price and closing date and stopped there. Six weeks in, the lender required an ALTA survey. Neither party had agreed to pay for it, both assumed it was the other, and the argument cost eleven days — which mattered, because the buyer\'s rate lock expired on day fourteen. The survey cost less than the rate change did.',
    },
    faq: [
      { q: 'Does a real estate LOI have to be notarized?', a: 'No. Notarization is generally required for recording a deed, not for a letter of intent or a purchase agreement. What the Statute of Frauds requires is a signed writing, and an electronic signature satisfies that under the ESIGN Act.' },
      { q: 'Can I use a letter of intent for a commercial lease?', a: 'Yes, and it is standard practice. A lease LOI typically fixes rent, term, renewal options, tenant improvement allowance and who pays operating expenses — the items that take longest to draft — before the lawyers begin.' },
      { q: 'Should the LOI include the closing date?', a: 'Include a target, not a promise. Naming a target date sets pace without creating an obligation the buyer cannot yet meet, since financing and title are still unknown.' },
      { q: 'What if the seller receives a better offer after signing?', a: 'That depends entirely on whether the letter grants exclusivity. Without an exclusivity clause the seller is generally free to keep marketing the property, which is why buyers who care about certainty should ask for one and expect to pay for it.' },
    ],
    fotos: [F.oficina, F.escritorio, F.mujer],
    cta: 'Create your real estate LOI free',
  },
  {
    slug: 'letter-of-intent-business-purchase',
    titleTag: 'Letter of Intent to Buy a Business',
    metaDescription: 'Free letter of intent for buying or selling a business. Covers price, structure, diligence, exclusivity and confidentiality. Sign online.',
    h1: 'Letter of Intent to Purchase a Business',
    grupo: 'loi',
    intro: 'Buying a business starts long before the purchase agreement. The letter of intent is where the price gets anchored, the structure gets chosen, and the seller decides how much of the company to open up. Get it right and diligence runs on rails. Get it wrong and you renegotiate the same points three times.',
    problema: {
      titulo: 'Asset sale or stock sale is not a detail',
      texto: 'It is the single most consequential line in the document, and most letters of intent skip it. An asset purchase lets the buyer choose what liabilities to take and usually gives them a stepped-up basis; a stock purchase transfers the company whole, including the litigation nobody has mentioned yet. The tax outcome for the seller can differ by a large margin between the two. Agreeing on price without agreeing on structure means you have not agreed on price.',
    },
    puntos: [
      { titulo: 'Purchase price and how it is actually paid', texto: 'Cash at closing, seller note, earnout, escrow holdback. A headline number with no payment structure behind it is the most common cause of a deal repricing at week six.' },
      { titulo: 'What the seller must hand over during diligence', texto: 'Financial statements and for how many years, tax returns, customer contracts, employee list, outstanding litigation. Naming these upfront turns diligence from a negotiation into a checklist.' },
      { titulo: 'Confidentiality that outlives the deal', texto: 'The seller is about to show a stranger their margins, their customer concentration and their payroll. If the deal dies, that information must not. The clause needs its own survival period, stated in years.' },
      { titulo: 'What happens to the owner after closing', texto: 'Whether the seller stays for a transition, for how long, paid how, and whether they are restricted from competing. Leaving this to the definitive agreement means discovering at week eight that the buyer assumed a two-year employment commitment the seller never intended.' },
    ],
    ley: {
      titulo: 'Binding, non-binding, and who decides',
      texto: 'No federal statute governs the enforceability of a letter of intent; that is a matter of state contract law, and the analysis turns on the parties\' objective intent as shown by the document. This is why the express non-binding clause matters more here than anywhere else: business-sale letters of intent are detailed by nature, and detail is what courts read as intent to be bound. The electronic signature itself is not in doubt — 15 U.S.C. § 7001 under the ESIGN Act, and UETA in 49 states, put an electronic signature on the same footing as ink.',
    },
    caso: {
      titulo: 'An earnout that meant two different things',
      texto: 'A buyer offered a base price plus an earnout tied to "revenue" over two years. Neither the letter of intent nor, later, the purchase agreement defined whether that meant gross revenue or revenue net of returns and discounts. The business ran about eleven percent of gross in returns. The gap between the two readings was most of the earnout. It was settled eventually, but at a cost neither side had budgeted, over a word that could have been defined in the letter of intent in one clause.',
    },
    faq: [
      { q: 'Should the LOI name a specific purchase price?', a: 'A range is common early; a specific number is common once the seller has shared financials. Either works, provided the document says the price is subject to diligence and to a definitive agreement — otherwise you have written an offer, not an intent.' },
      { q: 'How long should exclusivity last in a business sale?', a: 'Long enough to complete diligence, typically thirty to ninety days. Sellers should resist open-ended exclusivity; buyers should expect to justify the length by what diligence actually requires.' },
      { q: 'Do I still need an NDA if the LOI has a confidentiality clause?', a: 'Often the NDA comes first, before the LOI exists, because the seller must disclose something just to get to a price. If a robust NDA is already signed, the LOI can reference it instead of repeating it.' },
      { q: 'Can a letter of intent be withdrawn?', a: 'The non-binding commercial terms generally can be, subject to any good-faith negotiation obligation the document creates. The binding clauses — confidentiality, exclusivity, expenses — remain in force according to their own terms.' },
    ],
    fotos: [F.escritorio, F.hombre, F.firma],
    cta: 'Draft your business purchase LOI',
  },

  // ═══════════════ VALIDEZ LEGAL — 78 impresiones sin un clic ═══════════
  {
    slug: 'is-an-electronic-signature-legally-binding',
    titleTag: 'Are Electronic Signatures Legally Binding?',
    metaDescription: 'Yes — under the ESIGN Act and UETA, in all 50 states. What the law actually requires, what it excludes, and how to prove a signature later.',
    h1: 'Are Electronic Signatures Legally Binding in the United States?',
    grupo: 'legal',
    intro: 'The short answer is yes, and it has been settled since 2000. The longer answer is the useful one: the law does not make every electronic signature valid. It makes them impossible to reject *solely because they are electronic*. That distinction is where disputes are actually won and lost.',
    problema: {
      titulo: 'The signature is rarely the weak point',
      texto: 'When an agreement is challenged, the argument is almost never "electronic signatures are not legal." It is that the person who signed was not who they claimed, or never saw the document they supposedly agreed to, or that the file was altered afterwards. A signature image pasted into a PDF answers none of those. What answers them is a record: who opened the document, from what address, when, what exactly they saw, and cryptographic proof the file has not changed since.',
    },
    puntos: [
      { titulo: 'Intent to sign, captured', texto: 'The law requires that the signature be executed with intent to sign. A record showing the signer opened the document, reviewed it and then acted deliberately is what demonstrates that intent when someone later says they never agreed.' },
      { titulo: 'Association with the record', texto: 'The signature must be logically associated with the document it signs. A hash of the exact file, recorded at signing, is how that association is proved: change one character afterwards and the hash no longer matches.' },
      { titulo: 'Attribution to a person', texto: 'Email verification, IP address, device fingerprint, and where the risk warrants it, identity document capture or biometric confirmation. Each layer narrows the space for a plausible denial.' },
      { titulo: 'A record both parties can keep', texto: 'The statute requires that electronic records be capable of retention and accurate reproduction by the parties entitled to them. A signed PDF plus its audit trail, downloadable by everyone involved, satisfies that.' },
    ],
    ley: {
      titulo: 'ESIGN, UETA, and the exclusions people forget',
      texto: 'The federal Electronic Signatures in Global and National Commerce Act, 15 U.S.C. § 7001(a), provides that a signature, contract, or other record relating to a transaction may not be denied legal effect, validity, or enforceability solely because it is in electronic form. The Uniform Electronic Transactions Act reaches the same result at state level and has been adopted in 49 states; New York uses its own Electronic Signatures and Records Act, State Technology Law § 304. The exclusions matter: 15 U.S.C. § 7003 carves out wills, codicils and testamentary trusts, adoption and divorce and other family law matters, most of the Uniform Commercial Code, court orders and notices, and certain utility, insurance and foreclosure notices. For those, check state law before relying on an electronic signature.',
    },
    caso: {
      titulo: 'The dispute that turned on a timestamp',
      texto: 'A contractor claimed he had never approved a change order that added scope without adding money. The signature on it was his name in a script font — the kind any word processor produces. There was no record of when it was signed, from where, or of what the document contained at that moment. The change order was worth about nine thousand dollars and the argument cost more than that. A signature with an audit trail would have ended it in one email, in either direction.',
    },
    faq: [
      { q: 'Do I need a special certificate for an electronic signature to be valid?', a: 'Not in the United States. ESIGN and UETA are technology-neutral: they do not require certificates, hardware tokens or a specific standard. Certificate-based digital signatures are common in the EU and in some regulated U.S. contexts, but they are not a condition of validity here.' },
      { q: 'Which documents cannot be signed electronically?', a: '15 U.S.C. § 7003 excludes wills and testamentary trusts, most family law matters including adoption and divorce, most of the UCC, court documents, and certain notices such as utility cancellation, health insurance termination and foreclosure. Several states have since permitted electronic wills by statute, so check the specific state.' },
      { q: 'Is a typed name a valid signature?', a: 'It can be, if it was executed with intent to sign and is logically associated with the record. Whether it survives a challenge is a different question, and depends on what evidence exists around it.' },
      { q: 'How long should I keep the audit trail?', a: 'At least as long as the statute of limitations for a claim under that contract, which in most states runs four to six years for written contracts. Keeping the signed file and its trail together is what makes the record usable later.' },
    ],
    fotos: [F.firma, F.tech, F.revisar],
    cta: 'Sign a document with a full audit trail',
  },
  {
    slug: 'esign-act-compliance',
    titleTag: 'ESIGN Act Compliance Explained',
    metaDescription: 'What the ESIGN Act requires: consent, intent, association and retention. The four conditions, the exclusions, and how to meet them.',
    h1: 'ESIGN Act Compliance',
    grupo: 'legal',
    intro: 'The ESIGN Act is short and often misread. It does not certify vendors or bless particular technology. It sets conditions, and a signature that meets them is as good as ink. Most compliance failures are not technical — they are a missing consent step or a record nobody can retrieve two years later.',
    problema: {
      titulo: 'Consumer consent is the clause most often skipped',
      texto: 'When a business provides a consumer with information that some other law requires to be in writing, the ESIGN Act does not simply allow an electronic version. It requires the consumer to affirmatively consent, and requires that consent to be given in a way that reasonably demonstrates the consumer can actually access the format. The business must also disclose the right to withdraw consent, the scope, how to get a paper copy and what it costs, and the hardware and software needed. Skipping this does not usually surface at signing. It surfaces in a regulatory examination.',
    },
    puntos: [
      { titulo: 'Intent to sign', texto: 'The signer must act deliberately. A record of the signing session — what was shown, when it was opened, what was clicked — is what evidences intent if it is questioned.' },
      { titulo: 'Consent to do business electronically', texto: 'Both parties must agree to transact electronically. For consumer transactions covered by a writing requirement, that consent has the specific form described above.' },
      { titulo: 'Association with the record', texto: 'The signature must be tied to the document signed. A cryptographic hash captured at signature time proves the file has not been altered since.' },
      { titulo: 'Retention and accurate reproduction', texto: 'The record must remain accessible to everyone entitled to it and reproducible accurately. A PDF that only the sender can retrieve does not satisfy this.' },
    ],
    ley: {
      titulo: 'Where each requirement lives in the statute',
      texto: 'The general rule is at 15 U.S.C. § 7001(a): no denial of legal effect solely because the record or signature is electronic. Consumer consent and its disclosures are at § 7001(c). Record retention is at § 7001(d), which requires that the record accurately reflect the information and remain accessible to those entitled to it in a form capable of accurate reproduction. Exclusions are at § 7003. Section 7002 governs how state law interacts with the federal act — which is why a state that has adopted UETA can supersede the federal rules, and why New York, which has not, relies on State Technology Law § 304.',
    },
    caso: {
      titulo: 'A lender who had signatures but no consent record',
      texto: 'A small consumer lender moved its disclosures online and collected signatures cleanly. Two years later an examination asked for the consent records showing borrowers had agreed to receive the required disclosures electronically. The platform had captured the signature but had never presented or stored the § 7001(c) consent. The signatures themselves were sound. The disclosures made through them were the problem, and the remediation reached every file from the switchover onward.',
    },
    faq: [
      { q: 'Does ESIGN apply to business-to-business contracts?', a: 'Yes, the general rule at § 7001(a) applies to any transaction in or affecting interstate commerce. The consumer consent requirements at § 7001(c) apply only where another law requires that information be provided to a consumer in writing.' },
      { q: 'Does ESIGN or my state UETA control?', a: 'Section 7002 allows a state that has adopted UETA in its official form to modify or supersede the federal provisions. In practice the two are consistent for most transactions. Where they differ, the specific state statute is the one to read.' },
      { q: 'Is ESIGN compliance something a vendor can certify?', a: 'No. There is no certifying authority under the act. A platform can make compliance easier by capturing consent, intent, association and a retrievable record — but compliance belongs to the business using it.' },
      { q: 'What if a consumer withdraws consent?', a: 'The withdrawal is prospective: it does not affect the legal validity of records already provided and signed electronically. Going forward, that consumer must receive the affected information in the form the underlying law requires.' },
    ],
    fotos: [F.revisar, F.escritorio, F.oficina],
    cta: 'Start signing with compliant records',
  },
  {
    slug: 'ueta-vs-esign-act',
    titleTag: 'UETA vs ESIGN Act: The Difference',
    metaDescription: 'One is federal, one is state. Where they overlap, where a state can override the federal rule, and why New York is the exception.',
    h1: 'UETA vs the ESIGN Act',
    grupo: 'legal',
    intro: 'Two laws, the same destination. The ESIGN Act is federal and applies to transactions in or affecting interstate commerce. UETA is a model act adopted state by state. Most of the time they agree, which is why the difference rarely matters — until it does.',
    problema: {
      titulo: 'The question people are really asking',
      texto: 'Nobody wants a comparative law lecture. They want to know which rules apply to the contract in front of them, whether a signature will hold, and whether the state they operate in changes anything. The answer is usually: apply UETA as adopted in your state, and treat the ESIGN Act as the floor beneath it. Two situations break that rule, and both are worth knowing.',
    },
    puntos: [
      { titulo: 'ESIGN is the federal floor', texto: 'It guarantees that an electronic signature cannot be rejected solely for being electronic, across every state, for transactions affecting interstate commerce. Nothing a state does can remove that floor for those transactions.' },
      { titulo: 'UETA is how 49 states say the same thing', texto: 'Adopted in every state except New York, UETA gives electronic records and signatures the same effect as paper within that state\'s law, and adds detail ESIGN leaves out — attribution, errors in transmission, and the effect of an automated agent.' },
      { titulo: 'A state can supersede parts of ESIGN', texto: 'Section 7002 permits a state that has enacted UETA in its official form to modify or supersede the federal provisions. This is why the operative text for most domestic transactions is the state statute, not the federal one.' },
      { titulo: 'New York took its own route', texto: 'New York never adopted UETA. It reaches an equivalent result through the Electronic Signatures and Records Act, codified at State Technology Law § 304, which gives electronic signatures the same validity and effect as handwritten ones.' },
    ],
    ley: {
      titulo: 'The provisions that matter',
      texto: 'ESIGN: 15 U.S.C. § 7001(a) for the general rule, § 7001(c) for consumer consent, § 7002 for the interaction with state law, § 7003 for exclusions. UETA: section 7 gives records and signatures legal effect, section 9 covers attribution, section 10 covers changes and errors, and section 12 covers retention. New York: State Technology Law § 304. UETA\'s exclusions are narrower than ESIGN\'s in some states and identical in others, which is one more reason to read the version your state enacted rather than the model text.',
    },
    caso: {
      titulo: 'A multi-state lease portfolio and one outlier',
      texto: 'A property manager standardised electronic signing across leases in eight states and assumed one process would serve all of them. Seven were straightforward. The New York properties raised a question from counsel that took two weeks to close out — not because electronic signatures are invalid there, but because the authority is a different statute and nobody on the team could point to it. The process did not change. The documentation of why it was sound did.',
    },
    faq: [
      { q: 'If my state has UETA, does ESIGN still apply?', a: 'Yes, as a floor for transactions in or affecting interstate commerce. Where the state has adopted UETA in its official form, § 7002 lets the state provisions govern. In practice the outcome is the same for the overwhelming majority of contracts.' },
      { q: 'Are UETA exclusions the same as ESIGN exclusions?', a: 'Not always. UETA excludes wills, codicils and testamentary trusts and most of the UCC, and some states added their own carve-outs when they enacted it. Always check the enacted state version rather than the model act.' },
      { q: 'Does Illinois or Washington differ?', a: 'Both have adopted UETA, Illinois replacing an earlier electronic commerce statute. Where a state modernised an older act, transitional provisions occasionally matter for older records — rarely for new ones.' },
      { q: 'Which should a contract name as governing?', a: 'Contracts generally name a governing state law rather than a signature statute. Naming the state is what determines which version of UETA, or which alternative, applies to the signature question.' },
    ],
    fotos: [F.tech, F.mujer, F.escritorio],
    cta: 'Sign under ESIGN and UETA',
  },

  // ═══════════════ SERVICIOS FINANCIEROS — 14 impresiones ═══════════════
  {
    slug: 'electronic-signature-for-banks',
    titleTag: 'Electronic Signatures for Banks',
    metaDescription: 'E-signature built for lending and account opening: identity verification, tamper-evident records and audit trails an examiner can follow.',
    h1: 'Electronic Signatures for Banks and Credit Unions',
    grupo: 'finance',
    intro: 'A bank does not need a signature tool. It needs an evidence trail that survives an examination, a dispute and a discovery request — three audiences with very different questions and one shared demand: show me exactly what happened, and prove it has not changed.',
    problema: {
      titulo: 'The examiner asks a different question than the customer',
      texto: 'The customer asks whether the loan is signed. The examiner asks whether the borrower consented to receive the disclosures electronically, whether the disclosures were the ones in effect that day, whether the record can be reproduced accurately, and how you know the person who signed was the borrower. Most institutions can answer the first question instantly and the rest slowly, by assembling evidence from four systems. That assembly is where remediation cost lives.',
    },
    puntos: [
      { titulo: 'Identity verification proportionate to risk', texto: 'Email confirmation for a routine form, government ID capture and biometric confirmation for a loan agreement. The record shows which was used, so the file itself explains why that level was appropriate.' },
      { titulo: 'Tamper-evident records', texto: 'A SHA-256 hash of the executed document, captured at signature. If the file is altered by a single character afterwards, the hash no longer matches — which is what turns "we believe this is the signed version" into a demonstrable fact.' },
      { titulo: 'Consent captured, not assumed', texto: 'The § 7001(c) consumer consent to electronic disclosures is presented, recorded and stored with the file, rather than living in a separate onboarding system nobody thinks to pull.' },
      { titulo: 'A complete chronological trail', texto: 'Sent, opened, viewed, signed, with timestamps, IP addresses and device information. Reconstructing that from logs after the fact is possible; having it attached to the document is what makes it usable.' },
    ],
    ley: {
      titulo: 'The rules that apply to a lender',
      texto: 'The ESIGN Act, 15 U.S.C. § 7001, governs the electronic signature and, at § 7001(c), the consumer consent required before delivering electronically any disclosure that another law requires in writing — which in lending means Truth in Lending, Regulation Z and Regulation E disclosures, among others. Section 7001(d) requires the record to remain accessible and accurately reproducible by those entitled to it. Section 7003 excludes certain notices, including some default, foreclosure and insurance cancellation notices, so those still require the form the underlying law prescribes.',
    },
    caso: {
      titulo: 'Ninety days of file reconstruction',
      texto: 'A community lender used one system for identity, another for disclosures, a third for signatures and a fourth for storage. Every individual record was defensible. Assembling them into a coherent story, file by file, for an examination sample, took a two-person team most of a quarter. Nothing was wrong with the loans. The cost was entirely in proving that.',
    },
    faq: [
      { q: 'Is an electronic signature enough for a loan agreement?', a: 'Yes, for the signature itself, under ESIGN and state UETA. What varies is the disclosure regime around the loan — consumer credit disclosures carry their own timing and consent requirements that the signature does not satisfy on its own.' },
      { q: 'How do we verify the signer is really the borrower?', a: 'Layered: email confirmation, then government ID capture with a selfie match, and where supported, device biometrics such as Touch ID or Windows Hello. The record states which layers were used for that signature.' },
      { q: 'Can we require paper for some products?', a: 'Yes. ESIGN permits but does not compel electronic records, and a consumer may decline or withdraw consent. Many institutions keep paper available for products where the disclosure regime is unsettled.' },
      { q: 'What should we retain, and for how long?', a: 'The executed document, the audit trail and the consent record, together, for at least the applicable record retention period and the statute of limitations — whichever is longer. Keeping them in one place is what makes retrieval survivable.' },
    ],
    fotos: [F.escritorio, F.firma, F.hombre],
    cta: 'See how the audit trail works',
  },
  {
    slug: 'e-signature-for-financial-services',
    titleTag: 'E-Signature for Financial Services',
    metaDescription: 'Advisory agreements, account forms and disclosures signed with verified identity and an audit trail built for compliance review.',
    h1: 'E-Signature for Financial Services Firms',
    grupo: 'finance',
    intro: 'Advisory agreements, account applications, suitability acknowledgements, fee schedules. The volume is not the problem — the problem is that each one has to be retrievable, unaltered, and attributable years after the person who handled it has left the firm.',
    problema: {
      titulo: 'Documents that outlive the relationship',
      texto: 'A client agreement signed today may be examined in six years, in the context of a complaint about advice given in year three. What matters then is not that the document exists, but that you can show which version the client saw, when they saw it, that they signed it themselves, and that nothing changed afterwards. Firms that store a flat PDF have the document. Firms that store the document with its trail have the answer.',
    },
    puntos: [
      { titulo: 'Version certainty', texto: 'The exact document presented at signature, hashed at that moment. When the fee schedule changes in year two, there is no ambiguity about which schedule the year-one client agreed to.' },
      { titulo: 'Attribution beyond a name', texto: 'Identity verification recorded alongside the signature, so attribution does not rest on the assumption that whoever had the email link was the client.' },
      { titulo: 'Delivery evidence', texto: 'Sent, delivered, opened, signed — with timestamps. For disclosures with a timing requirement, evidence of delivery matters as much as evidence of signature.' },
      { titulo: 'Retrieval that does not require the original sender', texto: 'Records accessible to the firm as a firm, not scattered across individual advisers\' accounts. Turnover is the most common reason a record becomes unreachable.' },
    ],
    ley: {
      titulo: 'What governs the record',
      texto: 'The signature is governed by the ESIGN Act, 15 U.S.C. § 7001, and by state UETA. Section 7001(d) is the provision that matters most in this sector: the record must accurately reflect the information and remain accessible to all persons entitled to it, in a form capable of accurate reproduction. Firms also operate under their own books-and-records obligations, which set retention periods and, in some cases, requirements about the format and accessibility of stored records. The electronic signature statutes set the floor; the sector rules set the retention period.',
    },
    caso: {
      titulo: 'The adviser who left, and the file that left with them',
      texto: 'A client questioned a fee arrangement from four years earlier. The signed agreement had been sent from the departing adviser\'s individual account on a consumer e-signature plan. The document existed somewhere; the audit trail was tied to a seat the firm no longer paid for. The firm reconstructed enough to resolve the matter, but the exercise took weeks and produced a policy change that should have been the policy from the start. The lesson was not about the departing adviser, who had done nothing improper. It was that records belonging to the firm had been created inside an account belonging to a person, and nobody noticed until the person was gone. Any firm where advisers send client documents from their own tools has the same exposure, and it stays invisible for exactly as long as everyone stays.',
    },
    faq: [
      { q: 'Can advisory agreements be signed electronically?', a: 'Yes. There is no general prohibition, and the ESIGN Act and state UETA give the signature the same effect as ink. Retention and delivery obligations come from the firm\'s own regulatory regime and are unaffected by how the signature was captured.' },
      { q: 'Do we need the client\'s consent to send documents electronically?', a: 'Where another rule requires information to be furnished to a client in writing, § 7001(c) requires affirmative consent with specific disclosures. Many firms obtain this once at onboarding and record it with the account file.' },
      { q: 'How do we handle joint accounts?', a: 'Each signer receives their own link and signs separately, producing an individual trail per person. That is materially stronger evidence than one document returned with two signatures on it.' },
      { q: 'Is the audit trail admissible?', a: 'It is evidence, and its weight depends on its completeness and integrity. A trail with timestamps, addresses, an identity check and a document hash is considerably harder to dispute than an unsupported signature image.' },
    ],
    fotos: [F.oficina, F.revisar, F.tech],
    cta: 'Try it with your next client agreement',
  },
  {
    slug: 'loan-agreement-electronic-signature',
    titleTag: 'Loan Agreement Template & E-Signature',
    metaDescription: 'Free loan agreement with interest, schedule and default terms. Signed electronically with identity verification and a full audit trail.',
    h1: 'Loan Agreement with Electronic Signature',
    grupo: 'finance',
    intro: 'Money lent without a written agreement is a gift with optimism attached. A loan agreement records the amount, the interest, the repayment schedule and what happens when a payment is missed — which is the part everyone skips and the only part that matters when it goes wrong.',
    problema: {
      titulo: 'Default is where informal loans collapse',
      texto: 'The amount is remembered. The date is remembered. What almost nobody agrees in advance is how late a payment has to be before it is late, whether interest accrues on the missed amount, whether the whole balance becomes due, and who pays the cost of collection. Without those terms the lender has a debt and no leverage, and every conversation restarts the negotiation.',
    },
    puntos: [
      { titulo: 'Principal, interest and how interest is computed', texto: 'A rate with no compounding basis is ambiguous. The template states the rate, whether it is simple or compounding, and on what period.' },
      { titulo: 'A repayment schedule with real dates', texto: 'Instalment amount, frequency, first payment date and final date. "Monthly" without a start date has produced more disputes than any other loan term.' },
      { titulo: 'Late payment and acceleration', texto: 'What counts as late, any grace period, the late charge, and whether the lender may declare the entire balance due. This is the clause that converts a promise into an enforceable obligation.' },
      { titulo: 'Prepayment and security', texto: 'Whether the borrower may repay early without penalty, and whether anything secures the loan. Both change the economics and both are cheap to state.' },
    ],
    ley: {
      titulo: 'Interest rates and the limits that apply',
      texto: 'Interest on private loans is governed by state usury law, and the ceiling varies substantially between states — some cap non-commercial loans in the single digits absent a written agreement, others permit far more when the rate is agreed in writing. Exceeding the applicable ceiling can void the interest and, in some states, expose the lender to penalties. The signature is settled: the ESIGN Act, 15 U.S.C. § 7001, and state UETA give an electronically signed loan agreement the same effect as ink. Note that Article 3 of the Uniform Commercial Code, covering negotiable instruments, is among the ESIGN exclusions at § 7003 — which is why a formal negotiable promissory note deserves separate consideration from a simple loan agreement.',
    },
    caso: {
      titulo: 'Eighteen thousand dollars and no due date',
      texto: 'Two former colleagues agreed a loan for a business launch over dinner and confirmed it by text: the amount, and "pay me back when it works." Three years later one considered the loan overdue and the other considered it not yet due, and both were reading the same message. There was no schedule to point to. The friendship did not survive the disagreement, and the money was repaid at a pace neither had intended.',
    },
    faq: [
      { q: 'Does a loan agreement need a witness or notary?', a: 'Generally no for enforceability between the parties. Notarization is sometimes used for evidentiary comfort or where a security interest in real property is involved, in which case the security document has its own formalities.' },
      { q: 'What interest rate can I charge?', a: 'That depends on your state\'s usury statute and on whether the loan is commercial. Rates above the applicable ceiling risk voiding the interest entirely, so check the state that governs the agreement before naming a number.' },
      { q: 'Is a loan agreement the same as a promissory note?', a: 'They overlap. A promissory note is a promise to pay and can be a negotiable instrument under UCC Article 3; a loan agreement is broader, covering conditions, covenants and remedies. Many private loans use both.' },
      { q: 'Can I lend to a family member with this?', a: 'Yes, and it is exactly the situation where written terms matter most — because the social cost of asking for clarity later is higher than the cost of stating it now.' },
    ],
    fotos: [F.firma, F.escritorio, F.mujer],
    cta: 'Create your loan agreement free',
  },

  // ═══════════════ INMOBILIARIO ═══════════════
  {
    slug: 'electronic-signature-for-realtors',
    titleTag: 'E-Signature for Realtors and Agents',
    metaDescription: 'Listing agreements, disclosures and offers signed from a phone in minutes. Free to start, with an audit trail for every document.',
    h1: 'Electronic Signatures for Real Estate Agents',
    grupo: 'realestate',
    intro: 'Real estate runs on deadlines that do not move. An offer expires at five, the inspection period ends Friday, the seller is three time zones away. The signature is never the hard part of the job — but waiting for it is where deals are lost to someone who was faster.',
    problema: {
      titulo: 'The cost of a signature that takes a day',
      texto: 'A competing offer does not need to be better to win. It needs to be complete first. Every hour between "they said yes" and "it is signed" is an hour in which something changes: a second offer arrives, a buyer reconsiders, a lender calls. Agents who close that gap are not working harder, they are removing a step that never had to exist — the step where someone finds a printer.',
    },
    puntos: [
      { titulo: 'Signing from a phone, without an account', texto: 'The client receives a link, opens it, signs. No download, no registration, no software. The single largest cause of delay is asking a client to create an account before they can help you.' },
      { titulo: 'Multiple signers in sequence or at once', texto: 'Two buyers, two sellers, an agent acknowledgement. Each gets their own link and their own trail, and the document completes when the last one signs.' },
      { titulo: 'The document, unchanged and provable', texto: 'A hash captured at signature. When a counter-offer is disputed weeks later, the file itself proves which version was signed.' },
      { titulo: 'Everything retrievable in one place', texto: 'Listing agreement, disclosures, offer, addenda — filed together rather than spread across an inbox, so the transaction file is complete when the broker asks for it.' },
    ],
    ley: {
      titulo: 'Signature validity in a property transaction',
      texto: 'Contracts for the sale of an interest in land fall under the Statute of Frauds in every state and must be in a signed writing. The ESIGN Act, 15 U.S.C. § 7001, and state UETA satisfy that requirement electronically: a signature may not be denied effect solely because it is electronic. Note the boundary — the purchase contract may be signed electronically, but the deed that transfers title is usually recorded and generally requires notarization under the recording statutes of the state, and remote online notarization is available only where the state has authorised it.',
    },
    caso: {
      titulo: 'Lost by four hours',
      texto: 'An agent had a verbal yes on a listing at eleven in the morning. The sellers were driving to a family event and would not be near a printer until evening. She sent the listing agreement as a PDF attachment and asked them to print, sign and scan it. A second agent reached them at three with a link they signed on a phone in the passenger seat. The first agent had the better commission structure and the better marketing plan. She lost on logistics.',
    },
    faq: [
      { q: 'Can a purchase agreement be signed electronically?', a: 'Yes. The Statute of Frauds requires a signed writing, and ESIGN and state UETA make an electronic signature satisfy that requirement. The deed itself is a separate document with its own recording and notarization rules.' },
      { q: 'Do my clients need to install anything?', a: 'No. They open a link and sign in the browser, on a phone or a computer. Requiring an app or an account is the most common reason a signature request goes cold.' },
      { q: 'Is this accepted by brokerages and title companies?', a: 'Electronically signed contracts are standard practice in U.S. real estate. Individual brokerages may have their own document retention policies, which is a matter of internal procedure rather than legal validity.' },
      { q: 'What about disclosures with specific delivery timing?', a: 'Delivery evidence matters as much as signature there. The audit trail records when the document was sent, delivered and opened, which is precisely what a timing requirement needs to be demonstrated.' },
    ],
    fotos: [F.movil, F.oficina, F.firma],
    cta: 'Send your next offer for signature',
  },
  {
    slug: 'real-estate-purchase-agreement',
    titleTag: 'Real Estate Purchase Agreement Template',
    metaDescription: 'Free purchase agreement covering price, deposit, contingencies and closing. Written to be filled in, previewed and signed online.',
    h1: 'Real Estate Purchase Agreement',
    grupo: 'realestate',
    intro: 'The purchase agreement is where a property deal becomes real. It names the price, the deposit and the closing date — and, more importantly, the conditions under which either side may walk away without losing money.',
    problema: {
      titulo: 'Contingencies are the whole document',
      texto: 'Buyers focus on price. Experienced buyers focus on contingencies, because a contingency is the only thing standing between a deposit and a loss. Financing, inspection, appraisal, title, sale of an existing home — each needs a deadline and a stated consequence. A contingency without a date is not protection; it is a conversation you will have under time pressure.',
    },
    puntos: [
      { titulo: 'Price, deposit, and when the deposit goes hard', texto: 'The date the earnest money stops being refundable is the single most important date in the contract, and the one most often left implicit.' },
      { titulo: 'Financing and appraisal contingencies', texto: 'Whether the buyer may terminate if the loan is denied or the appraisal comes in low, by what date, and what happens to the deposit in each case.' },
      { titulo: 'Inspection rights and remedies', texto: 'How long the buyer has, what access they get, and whether they may demand repairs, a credit, or simply terminate. Ambiguity here creates the most common mid-contract dispute.' },
      { titulo: 'What conveys with the property', texto: 'Appliances, fixtures, window treatments, mounted equipment. Cheap to list; expensive to argue about the day before closing.' },
    ],
    ley: {
      titulo: 'Writing requirement and signature',
      texto: 'The Statute of Frauds, in force in every U.S. state, requires that a contract for the sale of an interest in land be in writing and signed by the party against whom enforcement is sought. Electronic signature satisfies this: 15 U.S.C. § 7001 under the ESIGN Act provides that a contract may not be denied legal effect solely because an electronic signature was used, and UETA does the same at state level in 49 states, with New York relying on State Technology Law § 304. Disclosure obligations vary substantially by state — several require specific written disclosures about property condition, lead paint in older housing under federal law, or natural hazards — and those are separate from the contract itself.',
    },
    caso: {
      titulo: 'A financing contingency with no deadline',
      texto: 'A buyer wrote an offer contingent on obtaining financing, without a date by which the contingency had to be removed. The lender took nine weeks. The seller, who had a move scheduled, wanted to terminate and relist; the buyer maintained the contingency was still live. Both were arguably right, which is another way of saying the contract had not decided the question. They settled by extending, and the seller paid for a month of storage that a single date in the offer would have avoided.',
    },
    faq: [
      { q: 'Do I need a lawyer for a purchase agreement?', a: 'Several states require attorney involvement in residential closings, and in others it is customary. A template gets the terms organised and the deal moving; it does not replace advice on a specific property or an unusual structure.' },
      { q: 'How much earnest money is normal?', a: 'Commonly one to three percent of the purchase price in residential transactions, higher in competitive markets and in commercial deals. What matters more than the amount is when it becomes non-refundable.' },
      { q: 'Can the seller accept another offer after signing?', a: 'Not without breaching, once the contract is executed. Sellers sometimes accept back-up offers explicitly contingent on the first contract terminating, which is a different arrangement and should be documented as one.' },
      { q: 'Is a purchase agreement the same as a letter of intent?', a: 'No. A letter of intent records an understanding and is usually mostly non-binding; a purchase agreement is the binding contract. In commercial transactions the LOI typically comes first and the purchase agreement is drafted from it.' },
    ],
    fotos: [F.escritorio, F.mujer, F.revisar],
    cta: 'Build your purchase agreement free',
  },

  // ═══════════════ COMPARATIVA — intención de compra alta ═══════════════
  {
    slug: 'docusign-alternative',
    titleTag: 'A Free DocuSign Alternative',
    metaDescription: 'Same legal validity under the ESIGN Act, without a per-envelope plan. Identity verification and audit trail included, free to start.',
    h1: 'A Free Alternative to DocuSign',
    grupo: 'compare',
    intro: 'Most people looking for an alternative are not unhappy with the signing experience. They are unhappy with paying a monthly subscription to send four documents, or with hitting an envelope limit in the middle of a busy month.',
    problema: {
      titulo: 'Per-envelope pricing does not fit uneven work',
      texto: 'Freelancers, small agencies, independent agents and one-person firms do not send documents at a steady rate. They send eleven in March and none in April. A plan priced for steady volume charges for the quiet months and constrains the busy ones — and the moment a limit is hit, the workaround is emailing a PDF, which loses exactly the evidence the tool existed to create.',
    },
    puntos: [
      { titulo: 'The same legal footing', texto: 'Validity comes from the ESIGN Act and state UETA, not from a brand. A signature captured with intent, associated with the document and backed by a retrievable record is valid regardless of which platform produced it.' },
      { titulo: 'Identity verification included, not tiered', texto: 'Email verification, government ID capture, selfie matching and device biometrics such as Touch ID or Windows Hello — available on the free tier rather than reserved for an enterprise plan.' },
      { titulo: 'Documents included, not just signatures', texto: 'Most alternatives sign a file you already have. Here the templates — NDAs, leases, service agreements, letters of intent — are part of the product, so the document and its signature come from the same place.' },
      { titulo: 'No account required for the person signing', texto: 'The recipient opens a link and signs. Asking a client to register before they can help you is the most reliable way to slow down a signature.' },
    ],
    ley: {
      titulo: 'Validity does not depend on the vendor',
      texto: 'The ESIGN Act, 15 U.S.C. § 7001(a), provides that a signature or contract may not be denied legal effect solely because it is in electronic form, and § 7001(d) requires that the record remain accessible and accurately reproducible by those entitled to it. UETA does the same at state level in 49 states; New York applies State Technology Law § 304. None of these statutes certifies or prefers a provider — they set conditions. What distinguishes platforms in practice is the quality of the evidence they capture around the signature, not the legal status of the signature itself.',
    },
    caso: {
      titulo: 'The month the limit ran out',
      texto: 'A two-person design studio sent contracts steadily until a project brought four new clients in the same fortnight. They hit their plan limit on a Thursday and, rather than upgrade mid-month for a spike that would not repeat, emailed the last two agreements as PDFs to be printed and returned. One came back scanned and signed. The other came back with a changed payment schedule that nobody noticed until invoicing.',
    },
    faq: [
      { q: 'Is a free electronic signature as valid as a paid one?', a: 'Legally, yes — ESIGN and UETA do not distinguish by price or provider. What varies is the evidence captured: identity verification, timestamps, addresses and a document hash are what make a signature defensible if challenged.' },
      { q: 'Can I import a PDF I already have?', a: 'Yes. You can upload an existing document to be signed, or start from a template and generate the document here, in which case the wording and the signature come from the same source.' },
      { q: 'Does the other person need to pay or register?', a: 'No. They open the link, review the document and sign. Nothing to install, no account to create.' },
      { q: 'What happens when I need more than the free tier?', a: 'There are paid plans for higher volume, but the free tier is a working product rather than a trial — including identity verification and the audit trail, which are the parts that matter in a dispute.' },
    ],
    fotos: [F.tech, F.firma, F.hombre],
    cta: 'Send a document free right now',
  },
  {
    slug: 'free-lease-agreement-template',
    titleTag: 'Free Lease Agreement Template',
    metaDescription: 'Residential lease covering rent, deposit, term and entry rules, written to your state. Fill it in, preview it and sign online free.',
    h1: 'Free Lease Agreement Template',
    grupo: 'lease',
    intro: 'A lease is the most commonly signed contract in the country and the one most often downloaded from wherever came up first. The risk is not that a generic lease looks wrong — it is that it quietly contains terms your state does not allow, which are unenforceable exactly when you need them.',
    problema: {
      titulo: 'A generic lease is a state-law problem',
      texto: 'Security deposit limits, the deadline to return the deposit and itemise deductions, how much notice is required before entering, whether late fees are capped, whether a landlord may recover attorney fees — all of these are set by state law and differ substantially. A lease that names a deposit above the state maximum does not simply fail on that clause; it can expose the landlord to statutory penalties in several states. Tenants signing such a lease often do not discover this until move-out.',
    },
    puntos: [
      { titulo: 'Rent, due date and late terms that hold up', texto: 'Amount, when it is due, any grace period and a late fee within what the state permits. A late fee a court will not enforce is worse than none, because it invites a dispute you lose.' },
      { titulo: 'Security deposit within state limits', texto: 'The amount, where it is held, what may be deducted and the deadline to return it with an itemised statement. This clause causes more landlord-tenant litigation than any other.' },
      { titulo: 'Entry notice', texto: 'How much warning a landlord must give before entering, and the exceptions for genuine emergencies. Stating it prevents the most common source of friction in an otherwise good tenancy.' },
      { titulo: 'Maintenance, utilities and the end of the term', texto: 'Who fixes what, who pays which utility, what condition the property must be returned in, and what happens if neither party gives notice at the end of the term.' },
    ],
    ley: {
      titulo: 'Where the rules come from',
      texto: 'Residential tenancies are governed almost entirely by state statute, and roughly half the states have adopted some version of the Uniform Residential Landlord and Tenant Act, with local modifications. Deposit caps, return deadlines, notice periods and permissible fees are set there, and a lease clause conflicting with the statute is generally unenforceable to that extent. Federal law adds a narrow but strict overlay: the Residential Lead-Based Paint Hazard Reduction Act requires specific disclosure and an EPA-approved pamphlet for most housing built before 1978. The signature itself is covered by the ESIGN Act, 15 U.S.C. § 7001, and state UETA.',
    },
    caso: {
      titulo: 'A deposit clause copied from another state',
      texto: 'A first-time landlord used a lease template found online, which set the security deposit at two months\' rent. The state where the property sat capped residential deposits below that figure and provided a statutory penalty for exceeding it. The tenancy went well for fourteen months. It ended with a deposit dispute in which the landlord\'s own lease was the strongest evidence against him.',
    },
    faq: [
      { q: 'Is an electronically signed lease valid?', a: 'Yes, in every state, under the ESIGN Act and state UETA. Some jurisdictions have specific rules about delivering certain notices or disclosures, which is a separate question from whether the lease signature is valid.' },
      { q: 'How much can I charge as a security deposit?', a: 'It depends on the state — some cap it at one month, others at two, and some set no statutory limit. Exceeding the cap can trigger penalties, so the state rule should decide the number.' },
      { q: 'Do I need the lead paint disclosure?', a: 'For most residential housing built before 1978, yes. Federal law requires the disclosure and an EPA-approved pamphlet, and the obligation falls on the landlord regardless of the lease wording.' },
      { q: 'Can I change the lease after it is signed?', a: 'Only by written agreement of both parties, normally as an addendum signed by everyone. A unilateral change to a signed lease is not effective.' },
    ],
    fotos: [F.mujer, F.escritorio, F.oficina],
    cta: 'Create your lease free',
  },
  {
    slug: 'nda-template',
    titleTag: 'Free NDA Template (Mutual or One-Way)',
    metaDescription: 'Non-disclosure agreement that defines what is confidential, for how long, and what happens if it leaks. Free, and signed online.',
    h1: 'Free NDA Template',
    grupo: 'legal',
    intro: 'An NDA is short, which makes people careless with it. Three clauses do the real work: what counts as confidential, how long the obligation lasts, and what the disclosing party can actually do if it is breached. Most templates handle the first badly and the third not at all.',
    problema: {
      titulo: 'An NDA that protects everything protects nothing',
      texto: 'The instinct is to define confidential information as broadly as possible. Courts read broad definitions narrowly, because an obligation covering "all information disclosed" is unreasonable to comply with — the recipient cannot tell what they are restricted from using. A definition that names categories, and carves out what is genuinely public or independently developed, is both fairer and considerably more likely to be enforced.',
    },
    puntos: [
      { titulo: 'What is confidential, stated in categories', texto: 'Financials, customer lists, source code, pricing, product plans. Naming categories is what makes the obligation usable — and enforceable — rather than aspirational.' },
      { titulo: 'What is excluded', texto: 'Information already public, already known to the recipient, independently developed, or received lawfully from a third party. Without these carve-outs the agreement asks for something the recipient cannot deliver.' },
      { titulo: 'A term with an end', texto: 'Two years, five years, indefinitely for trade secrets. A perpetual obligation over ordinary business information is one of the most common reasons an NDA is narrowed by a court.' },
      { titulo: 'Remedies', texto: 'Whether the disclosing party may seek injunctive relief, and who bears legal costs. Damages for a leak are notoriously difficult to quantify, which is why the right to stop the disclosure matters more than the right to be paid for it.' },
    ],
    ley: {
      titulo: 'Trade secrets and the notice most NDAs omit',
      texto: 'Confidentiality obligations are creatures of contract, interpreted under state law, and most states have adopted a version of the Uniform Trade Secrets Act. Federally, the Defend Trade Secrets Act of 2016 created a civil cause of action for trade secret misappropriation, codified at 18 U.S.C. § 1836. It also added a requirement that is widely overlooked: 18 U.S.C. § 1833(b) provides immunity for disclosing a trade secret in confidence to a government official or attorney solely to report a suspected legal violation, and an employer who fails to include notice of that immunity in an agreement governing trade secrets may not recover exemplary damages or attorney fees under the act against that employee. The signature is covered by the ESIGN Act, 15 U.S.C. § 7001, and state UETA.',
    },
    caso: {
      titulo: 'Everything was confidential, so nothing was',
      texto: 'A startup used an NDA defining confidential information as "any and all information disclosed, in any form, whether or not marked confidential." A former contractor later used a general technique he had known before the engagement. The startup argued breach. The definition was broad enough to cover the contractor\'s own prior knowledge, which is precisely why it did not hold up as written. A definition naming categories, with a prior-knowledge carve-out, would have been narrower on paper and stronger in practice.',
    },
    faq: [
      { q: 'Should the NDA be mutual or one-way?', a: 'Mutual when both sides will disclose something, which is most commercial conversations. One-way when only one side is opening up, such as a company sharing financials with a prospective buyer who is disclosing nothing.' },
      { q: 'How long should an NDA last?', a: 'Two to five years is common for ordinary business information. Trade secrets are often carved out to be protected for as long as they remain secret, which is a different and legitimate treatment.' },
      { q: 'Is an NDA enforceable against an employee?', a: 'Generally yes as to genuine confidential information, though it is distinct from a non-compete, which many states restrict heavily or prohibit. Employers should also include the § 1833(b) immunity notice.' },
      { q: 'What if the other side refuses to sign one?', a: 'That is information. A refusal is sometimes reasonable — investors and some acquirers decline as a matter of policy — and sometimes a signal about how your information will be treated.' },
    ],
    fotos: [F.revisar, F.firma, F.tech],
    cta: 'Create your NDA free',
  },

  // ═══════════════ FAMILIA — la de matrimonio, mejorada ═══════════════
  {
    slug: 'prenuptial-agreement',
    titleTag: 'Prenuptial Agreement Template',
    metaDescription: 'Free prenup covering property, debt and support. Written to be reviewed, disclosed and signed well before the wedding date.',
    h1: 'Prenuptial Agreement',
    grupo: 'family',
    intro: 'A prenuptial agreement decides in advance what happens to property, debt and income if a marriage ends. It is uncomfortable to raise and considerably less uncomfortable than deciding the same questions during a divorce, when neither side is inclined to be generous.',
    problema: {
      titulo: 'Prenups fail on process, not on content',
      texto: 'When a prenuptial agreement is set aside, the reason is rarely that its terms were unfair on their face. It is that one party did not disclose what they owned, or the agreement was signed days before the wedding under evident pressure, or one side had counsel and the other did not. The terms may be perfectly reasonable and still unenforceable because of how they came to be signed. Which means the timeline and the disclosure matter as much as the drafting.',
    },
    puntos: [
      { titulo: 'Full financial disclosure, attached', texto: 'Assets, debts, income and business interests, listed by both parties and attached as schedules. Incomplete disclosure is the most common ground for setting a prenup aside.' },
      { titulo: 'Separate versus marital property', texto: 'What each person brings in, what stays separate, and how property acquired during the marriage is treated — including the appreciation of a business one spouse owned before.' },
      { titulo: 'Debt', texto: 'Student loans, business obligations, credit cards. Deciding who carries pre-marital debt, and whether marital income services it, prevents the most common surprise.' },
      { titulo: 'Spousal support', texto: 'Whether it is waived, limited or calculated. Many states permit agreement on support, but some will not enforce a waiver that would leave a spouse dependent on public assistance.' },
    ],
    ley: {
      titulo: 'The framework and its limits',
      texto: 'Most states have adopted the Uniform Premarital Agreement Act, which sets out when a premarital agreement is enforceable and when it may be set aside — generally where it was not executed voluntarily, or was unconscionable when signed and the challenging party lacked adequate disclosure and did not waive it. California codifies related rules at Family Code § 1600 and following, including a seven-day period between when a party is first presented with the agreement and when it is signed. One boundary is firm across states: child support and child custody cannot be bindingly determined in advance, because those are decided on the child\'s best interests at the time. Note also that the ESIGN Act excludes family law matters at 15 U.S.C. § 7003, so an electronic signature on a prenuptial agreement should be confirmed against state requirements — several states require a signed writing and some require acknowledgment.',
    },
    caso: {
      titulo: 'Signed the night before',
      texto: 'A couple agreed in principle months ahead but the document was produced by one side\'s attorney and presented the evening before the ceremony, with guests already arrived. The terms were not extreme. The circumstances were, and the timing alone gave the other spouse a credible argument that it was not signed voluntarily. The agreement was contested years later and much of what it decided was reopened. The same document signed two months earlier would very likely have held.',
    },
    faq: [
      { q: 'When should a prenup be signed?', a: 'Weeks or months before the wedding, never in the final days. California requires at least seven days between presentation and signing, and courts elsewhere treat last-minute execution as evidence of pressure regardless of any statutory period.' },
      { q: 'Do both parties need their own lawyer?', a: 'It is not universally required, but independent counsel for each party is the single strongest protection against a later claim of unfairness or duress — and some states scrutinise waivers of counsel closely.' },
      { q: 'Can a prenup decide child custody or support?', a: 'No. Those are determined by the court in the child\'s best interests at the relevant time, and a prenuptial provision purporting to fix them is not binding.' },
      { q: 'Is a prenup only for wealthy couples?', a: 'No. It is at least as useful for allocating debt, protecting a small business or a family property, and clarifying what happens to income earned during the marriage.' },
    ],
    fotos: [F.oficina, F.revisar, F.mujer],
    cta: 'Start your prenuptial agreement',
  },
  {
    slug: 'postnuptial-agreement',
    titleTag: 'Postnuptial Agreement Template',
    metaDescription: 'A postnup settles property, debt and support after the wedding. Free template, full disclosure schedules, reviewed and signed properly.',
    h1: 'Postnuptial Agreement',
    grupo: 'family',
    intro: 'A postnuptial agreement does what a prenup does, signed after the marriage has begun. Couples reach for one when circumstances change — a business is started, an inheritance arrives, one spouse leaves work to raise children, or the marriage is being repaired and both want clarity.',
    problema: {
      titulo: 'Signed between spouses, and scrutinised more closely',
      texto: 'A prenuptial agreement is negotiated between two people who are not yet legally bound to each other. A postnuptial agreement is negotiated between spouses, who in most states owe each other a fiduciary duty. That changes the standard: courts examine postnups more carefully, and disclosure that would have been adequate before the wedding may not be adequate after it. The care that goes into the process matters even more here.',
    },
    puntos: [
      { titulo: 'Why the agreement is being made', texto: 'Stating the circumstances — a new business, an inheritance, a career change — helps establish that both parties acted deliberately rather than under pressure.' },
      { titulo: 'Complete and current disclosure', texto: 'Not the position at the wedding, but the position now, including anything acquired since. Both sets of schedules attached to the agreement itself.' },
      { titulo: 'Property acquired during the marriage', texto: 'The central question of most postnups: how what has already been built together, and what will be built from here, is treated.' },
      { titulo: 'Independent legal advice for each spouse', texto: 'More important here than in a prenup, precisely because of the fiduciary relationship between the parties.' },
    ],
    ley: {
      titulo: 'Recognition varies by state',
      texto: 'The Uniform Premarital Agreement Act addresses agreements made before marriage; postnuptial agreements are largely governed by state case law and, in some states, by specific statute. Most states enforce them, applying heightened scrutiny because of the fiduciary duty spouses owe one another — a duty that in community property states such as California is expressly codified. A minority of states are markedly more restrictive, particularly where the agreement was negotiated while a separation was already contemplated. As with prenuptial agreements, child support and custody cannot be bindingly fixed in advance, and the ESIGN Act excludes family law matters at 15 U.S.C. § 7003, so state execution requirements govern the signature.',
    },
    caso: {
      titulo: 'A business that grew after the wedding',
      texto: 'One spouse launched a company three years into the marriage, funded partly from savings that predated it. By year seven it was the family\'s main asset and the couple had no agreement about how it would be treated. Neither wanted to litigate the question later, and neither could answer it confidently. A postnuptial agreement with proper disclosure settled it in a few weeks, at a cost that was a rounding error against what a contested valuation would have run. What made it work was that the marriage was not in trouble. Both had counsel, both disclosed fully, and neither was deciding under pressure — which is precisely the combination that makes an agreement hold. Couples who wait until the relationship is strained find that the same document is harder to negotiate and easier to challenge later, for reasons that have nothing to do with its terms.',
    },
    faq: [
      { q: 'Are postnuptial agreements enforceable?', a: 'In most states, yes, subject to closer scrutiny than a prenup because of the fiduciary duty between spouses. A minority of states are considerably more restrictive, so the governing state matters.' },
      { q: 'How is a postnup different from a separation agreement?', a: 'A postnuptial agreement is made by spouses who intend to stay married. A separation agreement is made when they are separating and typically resolves immediate matters such as living arrangements and interim support.' },
      { q: 'Do we both need lawyers?', a: 'Strongly advisable. Independent counsel for each spouse is the most effective protection against a later challenge, and its absence is one of the first things a court examines.' },
      { q: 'Can a postnup be changed later?', a: 'Yes, by a further written agreement signed by both spouses with the same care as the original — including current disclosure.' },
    ],
    fotos: [F.mujer, F.oficina, F.escritorio],
    cta: 'Create your postnuptial agreement',
  },

  // ═══════════════ DINERO — promesa de compraventa, mejorada ═══════════
  {
    slug: 'promissory-note-template',
    titleTag: 'Free Promissory Note Template',
    metaDescription: 'A written promise to pay, with amount, interest, schedule and default terms. Free template, previewed and signed online.',
    h1: 'Promissory Note',
    grupo: 'money',
    intro: 'A promissory note is the simplest debt instrument there is: one party promises to pay another a definite sum, on stated terms. Its brevity is the point — and also the reason so many are written badly, missing the terms that decide what happens when payment does not arrive.',
    problema: {
      titulo: 'Simple is not the same as vague',
      texto: 'A note that says "I promise to pay $10,000" is simple. It is also silent on when, on whether interest accrues, on what happens if a payment is late, and on whether the holder may demand the whole balance. Each of those silences is resolved later by negotiation or by a court, neither of which the lender controls. Adding four clauses keeps the document short and makes it work.',
    },
    puntos: [
      { titulo: 'A definite sum and a definite time', texto: 'The amount and either a maturity date or a payment schedule. Definiteness is not only good practice — it is part of what makes a note negotiable under the UCC.' },
      { titulo: 'Interest, stated properly', texto: 'The rate, the basis, and whether it accrues before or after default. State usury limits apply, and they vary widely.' },
      { titulo: 'Default and acceleration', texto: 'What counts as default, any cure period, and whether the entire unpaid balance becomes due. Without acceleration a lender must chase each missed instalment separately.' },
      { titulo: 'Secured or unsecured, said plainly', texto: 'If collateral backs the note, it needs identifying and usually a separate security agreement. If nothing does, the note should say so rather than leave it open.' },
    ],
    ley: {
      titulo: 'Negotiability, usury and the signature question',
      texto: 'Article 3 of the Uniform Commercial Code governs negotiable instruments, and a promissory note qualifies where it is an unconditional promise to pay a fixed amount of money, payable on demand or at a definite time, and meets the other requirements of UCC § 3-104. Negotiability matters because a holder in due course takes the instrument free of most defences. Interest is limited by state usury statutes, which differ substantially and in some states carry severe consequences for exceeding them. On signature: the ESIGN Act excludes most of the UCC at 15 U.S.C. § 7003(a)(3), so a note intended to be a negotiable instrument should be executed according to state law rather than assumed to be covered — many states have addressed electronic notes through UETA\'s transferable records provisions, but the requirements are specific.',
    },
    caso: {
      titulo: 'No acceleration clause, twenty-four instalments',
      texto: 'A seller financed part of a small equipment sale with a note payable monthly over two years. The buyer paid four instalments and stopped. The note had no acceleration clause, so the balance did not become due — only each instalment as it came. Legally the seller had to wait for each one to fall due before pursuing it, or negotiate. He negotiated, from a much weaker position than a single sentence in the note would have given him.',
    },
    faq: [
      { q: 'What is the difference between a promissory note and an IOU?', a: 'An IOU acknowledges a debt. A promissory note contains a promise to pay on specified terms, and where it meets UCC § 3-104 it may also be negotiable, which an IOU is not.' },
      { q: 'Does a promissory note need a witness or notary?', a: 'Generally not for validity between the parties. Notarization is sometimes used for evidentiary strength, and is commonly required where the note is secured by real property and the security instrument is recorded.' },
      { q: 'Can a promissory note be signed electronically?', a: 'With care. The ESIGN Act excludes most UCC transactions, so where the note is intended to be a negotiable instrument, the applicable state provisions on transferable records govern. For a straightforward non-negotiable loan, an electronic signature is ordinarily fine.' },
      { q: 'What interest rate is allowed?', a: 'Set by state usury law, and different for commercial and consumer loans. Exceeding the ceiling can void the interest and in some states expose the lender to penalties.' },
    ],
    fotos: [F.escritorio, F.firma, F.hombre],
    cta: 'Create your promissory note free',
  },
  {
    slug: 'purchase-agreement-template',
    titleTag: 'Free Purchase Agreement Template',
    metaDescription: 'Sale of goods, equipment or a business asset: price, delivery, title transfer, warranties and risk of loss. Free and signed online.',
    h1: 'Purchase Agreement',
    grupo: 'money',
    intro: 'A purchase agreement records a sale that is not instantaneous — where payment, delivery and transfer of title happen on different days, and something could go wrong in between. It answers who bears that risk.',
    problema: {
      titulo: 'Risk of loss is the clause nobody reads',
      texto: 'Equipment is sold on Monday, paid for on Wednesday, collected on Friday. It is damaged on Thursday night. Who carries that loss? Most informal sales have never considered the question, and the answer under default rules may not be what either party assumed. One sentence naming the moment risk passes — on payment, on delivery, on collection — removes an argument that would otherwise be settled by whoever is more stubborn.',
    },
    puntos: [
      { titulo: 'What exactly is being sold', texto: 'Identification by make, model, serial number or specification. "The machine" is not a description that survives a dispute.' },
      { titulo: 'Price, payment terms and deposit', texto: 'How much, when, in what instalments, and whether any deposit is refundable and under what conditions.' },
      { titulo: 'Delivery, title and risk', texto: 'Where and when delivery occurs, when title passes, and when risk of loss passes. These three are separate events and need not coincide.' },
      { titulo: 'Warranties, or their exclusion', texto: 'Whether the seller warrants condition or the goods are sold as is. An "as is" sale needs saying explicitly, because implied warranties otherwise apply by default.' },
    ],
    ley: {
      titulo: 'The UCC and implied warranties',
      texto: 'Sales of goods between parties in the United States are governed by Article 2 of the Uniform Commercial Code, adopted in every state, with Louisiana as the notable exception. Article 2 supplies terms the parties leave out — including risk of loss under UCC § 2-509 and the implied warranty of merchantability under UCC § 2-314, which applies automatically where the seller is a merchant in goods of that kind. That warranty can be disclaimed, but § 2-316 sets out how: the disclaimer must mention merchantability and, if written, must be conspicuous. A quietly buried "as is" may not do the work the seller expects. The Statute of Frauds provision at UCC § 2-201 requires a signed writing for sales of goods of $500 or more.',
    },
    caso: {
      titulo: 'Damaged in the four days in between',
      texto: 'A restaurant bought a used commercial oven, paid in full, and arranged collection the following week. Over the weekend a pipe burst in the seller\'s storage unit. Neither the invoice nor the messages said anything about when risk passed or when title transferred. Both parties had insurance, and both insurers took the position that the other side\'s policy responded. It was resolved, slowly, and the resolution cost more than the oven. The uncomfortable part is that neither party was careless by ordinary standards. They had agreed a price, exchanged money and set a date, which is what most equipment sales look like. What they had not done was answer a question that only becomes interesting once something has already gone wrong — and by then it is a negotiation between two people who each have a good reason to believe the loss belongs to the other.',
    },
    faq: [
      { q: 'Does a purchase agreement have to be in writing?', a: 'Under UCC § 2-201 a contract for the sale of goods for $500 or more is generally not enforceable unless there is a signed writing sufficient to indicate a contract was made. Below that threshold an oral agreement can bind, but proving its terms is another matter.' },
      { q: 'What does "as is" actually do?', a: 'It disclaims implied warranties, but only if done properly. UCC § 2-316 requires that a disclaimer of merchantability mention merchantability and, in writing, be conspicuous. A disclaimer in small print among boilerplate may fail.' },
      { q: 'When does title pass?', a: 'Absent agreement, the UCC supplies default rules that turn on delivery. Because those defaults surprise people, naming the moment expressly is the simplest protection available.' },
      { q: 'Is this the right document for buying a business?', a: 'No. A business sale involves liabilities, employees, contracts and often stock rather than assets, and needs a purchase agreement drafted for that. A letter of intent is usually the right starting point.' },
    ],
    fotos: [F.hombre, F.escritorio, F.revisar],
    cta: 'Create your purchase agreement',
  },
  {
    slug: 'independent-contractor-agreement-template',
    titleTag: 'Independent Contractor Agreement',
    metaDescription: 'Scope, payment, IP ownership and classification — the four terms that decide whether a contractor relationship holds. Free template.',
    h1: 'Independent Contractor Agreement',
    grupo: 'money',
    intro: 'Hiring a contractor is simple until the work is delivered late, the invoice is disputed, or someone asks who owns what was built. A contractor agreement settles those three questions before they arise, and a fourth that matters more than any of them: whether this person is genuinely a contractor at all.',
    problema: {
      titulo: 'Calling someone a contractor does not make them one',
      texto: 'Worker classification is determined by the substance of the relationship, not by the label in the agreement. Agencies and courts look at how much control the hiring party exercises, whether the worker has a genuine independent business, and how integral the work is to the operation. Misclassification exposes the hiring party to back taxes, unpaid overtime and penalties. A written agreement helps by documenting the intended relationship — but only if the day-to-day arrangement actually matches what it describes.',
    },
    puntos: [
      { titulo: 'Scope, deliverables and acceptance', texto: 'What is being produced, by when, and what counts as done. Most payment disputes are acceptance disputes wearing a different hat.' },
      { titulo: 'Payment terms with a due date', texto: 'Rate or fixed fee, invoicing schedule, payment window, and any late charge. "Net 30" means little without a stated start point.' },
      { titulo: 'Intellectual property ownership', texto: 'Absent a written assignment, a contractor generally retains copyright in what they create — a fact that surprises most clients. If the work is meant to be owned by the hiring party, the agreement must say so expressly.' },
      { titulo: 'Classification and taxes', texto: 'That the contractor is responsible for their own taxes, provides their own tools, controls their own methods, and is free to work for others. Stating it is not sufficient on its own, but its absence is conspicuous.' },
    ],
    ley: {
      titulo: 'Copyright and the works made for hire trap',
      texto: 'Under the Copyright Act, 17 U.S.C. § 201(b), a work made for hire vests ownership in the employer or commissioning party. But § 101 defines that term narrowly: for an independent contractor, it applies only to nine enumerated categories of commissioned work — such as a contribution to a collective work, a translation, or a supplementary work — and only where the parties expressly agree in a signed written instrument. Most commissioned software, design and content falls outside those categories, which means the correct mechanism is a written assignment of copyright, not a "work made for hire" label. Classification itself is assessed under tests that differ between the IRS, the Fair Labor Standards Act and individual state law, with several states applying a stricter ABC test.',
    },
    caso: {
      titulo: 'Who owns the design files',
      texto: 'A company commissioned a brand identity, paid the invoice in full, and used the logo for two years. When they went to register the trademark, the designer pointed out that the agreement had never assigned copyright in the underlying artwork. He was right. The relationship was good and it was resolved amicably with a short assignment and a modest payment — but the company had spent two years building on an asset it did not own.',
    },
    faq: [
      { q: 'Who owns the work a contractor produces?', a: 'The contractor, by default, absent a signed written assignment. The "work made for hire" doctrine applies to commissioned work only in nine narrow categories under 17 U.S.C. § 101, so most agreements need an express assignment instead.' },
      { q: 'Does an agreement protect me from misclassification claims?', a: 'It helps as evidence of intent, but it does not decide the question. Classification turns on the actual working relationship — control, independence and integration — under tests that vary by agency and state.' },
      { q: 'Should a contractor agreement include a non-compete?', a: 'Restrictions on a genuinely independent contractor are often unenforceable and can undercut the classification argument, since freedom to work for others is a hallmark of independence. Confidentiality and non-solicitation are usually the better tools.' },
      { q: 'What payment terms are reasonable?', a: 'Net 15 to net 30 from a correct invoice is common. What matters most is stating when the clock starts and what happens if it is missed.' },
    ],
    fotos: [F.tech, F.mujer, F.firma],
    cta: 'Create your contractor agreement',
  },
  {
    slug: 'service-agreement-template',
    titleTag: 'Free Service Agreement Template',
    metaDescription: 'Define scope, price, timeline and what happens when things change. Free service contract template, previewed and signed online.',
    h1: 'Service Agreement',
    grupo: 'money',
    intro: 'A service agreement is the contract most small businesses sign most often, and the one most often replaced by an email saying "sounds good." It defines what will be done, for how much, by when — and, critically, what happens when the client asks for something that was not in the original scope.',
    problema: {
      titulo: 'Scope creep is a contract problem, not a personality problem',
      texto: 'Every service provider has a story about the project that grew. It is rarely because the client was unreasonable. It is because the agreement described the work loosely enough that both parties could read it differently, and there was no stated process for handling a change. Without a change mechanism, every new request becomes an awkward negotiation about whether it was "already included" — a conversation that damages the relationship whichever way it goes.',
    },
    puntos: [
      { titulo: 'Scope stated as what is included and what is not', texto: 'The exclusions do more work than the inclusions. Naming what falls outside the engagement is what makes a change request obvious rather than contentious.' },
      { titulo: 'A change order process', texto: 'How additional work is requested, priced and approved before it starts. A single paragraph converts scope creep from a conflict into an administrative step.' },
      { titulo: 'Payment schedule and late terms', texto: 'Deposit, milestones or monthly, with a payment window and a stated consequence for late payment — including the right to suspend work.' },
      { titulo: 'Termination on both sides', texto: 'How either party ends the engagement, with what notice, and what is owed for work completed to that point. Agreements that only allow the client to terminate are common and unbalanced.' },
    ],
    ley: {
      titulo: 'How service contracts are treated',
      texto: 'Contracts for services are governed by state common law rather than by Article 2 of the Uniform Commercial Code, which applies to sales of goods — a distinction that matters for mixed contracts, where courts generally apply the "predominant purpose" test to decide which body of law governs the whole agreement. Most states enforce a written service contract without formalities beyond signature, though some require writing for agreements that cannot be performed within one year under the Statute of Frauds. The signature is covered by the ESIGN Act, 15 U.S.C. § 7001, and by state UETA in 49 states, with New York applying State Technology Law § 304.',
    },
    caso: {
      titulo: 'The project that grew by forty percent',
      texto: 'A consultancy agreed a three-month engagement with a fixed fee and a one-paragraph scope. Over eleven weeks the client added a second workstream, two extra stakeholder groups and a reporting requirement, each time reasonably and each time assuming it was within scope. The consultancy delivered all of it rather than have the conversation. They finished on time, over budget by about forty percent of the fee, and did not take the renewal. Neither side had behaved badly. The agreement simply had no mechanism for what actually happened.',
    },
    faq: [
      { q: 'What is the difference between a service agreement and a statement of work?', a: 'The service agreement sets the legal terms — payment, liability, IP, termination — and often covers an ongoing relationship. A statement of work describes a specific engagement\'s scope and deliverables under it. Small engagements frequently combine both.' },
      { q: 'Should I include a limitation of liability?', a: 'It is standard and usually reasonable, commonly capping liability at fees paid. Enforceability varies by state and certain liabilities cannot be limited, but a cap is a normal commercial term rather than an aggressive one.' },
      { q: 'Can I suspend work for non-payment?', a: 'Only if the agreement says so. Without an express right to suspend, stopping work risks being characterised as your breach rather than a response to theirs.' },
      { q: 'How do I handle expenses?', a: 'State whether expenses are included in the fee or billed separately, whether pre-approval is needed above a threshold, and how they are evidenced. Unstated expenses are a frequent source of invoice disputes.' },
    ],
    fotos: [F.oficina, F.hombre, F.escritorio],
    cta: 'Create your service agreement',
  },

  // ═══════════════ POWER OF ATTORNEY ═══════════════
  // Bloque nuevo (2026-08-28): power of attorney es uno de los documentos
  // que la plataforma ya genera (ver src/app/data/templates.ts, id
  // 'power-of-attorney') y no tenia ninguna pagina de aterrizaje propia —
  // ni generica ni por estado. Cinco paginas, cada una con un dolor y un
  // publico real distinto, no la misma pagina con el titulo cambiado.
  {
    slug: 'power-of-attorney-template',
    titleTag: 'Free Power of Attorney Template',
    metaDescription: 'Name someone to act on your behalf for finances, property or healthcare. Free power of attorney template, previewed and signed online.',
    h1: 'Power of Attorney',
    grupo: 'poa',
    intro: 'A power of attorney names someone you trust — an agent — to act on your behalf. It can be broad, covering nearly everything you could do yourself, or narrow, limited to one bank account or one closing. What decides how it works when you actually need it is not the title on the page, but three details most people skip: when it takes effect, when it ends, and exactly what the agent is allowed to touch.',
    problema: {
      titulo: 'The form that never activates when you need it',
      texto: 'The most common power of attorney mistake is signing a "springing" POA — one that only takes effect if a doctor certifies you are incapacitated — and never checking what that certification actually requires. Some versions need two physicians. Some require a specific form. If your agent cannot produce exactly what the document demands, the power of attorney is legally real but practically useless at the one moment it was written for. A document that activates immediately, held by someone you trust, avoids that entire failure mode.',
    },
    puntos: [
      { titulo: 'Immediate or springing, stated in one clear line', texto: 'Whether the agent\'s authority starts the moment you sign, or only on a triggering event you define — with no ambiguity about who decides the trigger has occurred.' },
      { titulo: 'Powers listed, not assumed', texto: 'Banking, real estate, taxes, government benefits, business operations — each named power is either granted or it is not. General language like "all my affairs" is exactly what banks and title companies hesitate to honor.' },
      { titulo: 'A durability clause', texto: 'Under the Uniform Power of Attorney Act, adopted in some form by most states, a POA is durable — it survives your incapacity — unless it says otherwise. Ours states durability explicitly so no one has to research your state\'s default rule under pressure.' },
      { titulo: 'A clear end date or revocation trigger', texto: 'An open-ended power of attorney with no expiration is a standing risk. Ours can be dated to end automatically, and always spells out exactly how you can revoke it while you are still competent to do so.' },
    ],
    ley: {
      titulo: 'What makes it valid',
      texto: 'Most states have adopted some version of the Uniform Power of Attorney Act (UPOAA), which sets the default rule that a POA is durable unless the document says otherwise, and requires third parties like banks to accept a properly executed one. Execution requirements vary: most states require notarization, and several also require one or two witnesses. The signature itself — yours, and the notary\'s where required — is valid in electronic form under the ESIGN Act, 15 U.S.C. § 7001, though many banks and county recorders still prefer or require a wet-ink notarized original for real estate transactions specifically. Check your state\'s exact execution rule before relying on this for a real estate closing.',
    },
    caso: {
      titulo: 'A daughter who could not access her father\'s account',
      texto: 'A man in his seventies signed a power of attorney naming his daughter as agent, using a free template he found online. It said she could act "for all financial matters" but never mentioned durability, and was silent on what happened if he became incapacitated. When a stroke left him unable to manage his affairs, his bank froze the account pending a court-ordered guardianship — the branch manager\'s legal team read the silence on durability as a real risk, not an oversight they were willing to guess about. Two more paragraphs, agreed on the same afternoon he originally signed, would have avoided the six-week court process that followed.',
    },
    faq: [
      { q: 'What is the difference between a power of attorney and a guardianship?', a: 'A power of attorney is something you set up yourself, while you have capacity, naming who acts for you. A guardianship is a court process that happens after you can no longer make that choice, and a judge — not you — decides who is appointed. A valid POA is usually what prevents a guardianship from becoming necessary.' },
      { q: 'Does a power of attorney need to be notarized?', a: 'In most states, yes, for it to be accepted by banks and third parties, even though a small number of states allow witnesses instead of or in addition to notarization. Requirements vary enough by state that you should confirm your state\'s exact rule before signing.' },
      { q: 'Can I have more than one agent?', a: 'Yes — you can name co-agents who must act together, co-agents who can each act independently, or a primary agent with a successor named in case the first is unavailable. The document should state which structure applies, since "co-agents" alone is ambiguous.' },
      { q: 'When does a power of attorney end?', a: 'On the date you specify, if any; when you revoke it in writing while competent; or automatically on your death, at which point the executor named in your will takes over instead. It does not survive death under any circumstances.' },
    ],
    fotos: [F.firma, F.mujer, F.escritorio],
    cta: 'Create your power of attorney',
  },
  {
    slug: 'durable-power-of-attorney',
    titleTag: 'Durable Power of Attorney Template',
    metaDescription: 'A durable power of attorney stays valid if you become incapacitated. Free template with a clear durability clause, signed online.',
    h1: 'Durable Power of Attorney',
    grupo: 'poa',
    intro: '"Durable" is the one word in a power of attorney that decides whether it still works on the day it matters most. A standard power of attorney can become void the moment you lose capacity — exactly when your agent needs authority the most. A durable power of attorney is built to survive that moment instead of ending at it.',
    problema: {
      titulo: 'Why the word "durable" has to be in the document itself',
      texto: 'Under the Uniform Power of Attorney Act, most states now default to durability unless the document says otherwise — but not every state has adopted the uniform act, and older templates drafted under prior law sometimes still require explicit durability language to survive incapacity. Relying on a state default you have not personally verified is a real gap. A document that states its own durability in plain language removes the guesswork regardless of which rule your state happens to apply.',
    },
    puntos: [
      { titulo: 'An explicit durability statement', texto: 'A single sentence — "this power of attorney shall not be affected by my subsequent disability or incapacity" — that removes any dependence on a state default rule.' },
      { titulo: 'Defined incapacity, if the POA is springing', texto: 'If you choose to make authority conditional on incapacity rather than immediate, the document states exactly how that is determined — typically written certification from one or two physicians — instead of leaving it undefined.' },
      { titulo: 'Powers scoped to what you actually intend', texto: 'Financial accounts, real property, government benefits and business interests are each listed separately, so the agent\'s authority matches what you meant rather than a single sweeping clause open to interpretation.' },
      { titulo: 'A successor agent named in advance', texto: 'If your first choice cannot serve when the time comes, a named successor prevents the document from becoming useless for the one reason no one plans for — the primary agent being unavailable.' },
    ],
    ley: {
      titulo: 'The legal standard for durability',
      texto: 'The Uniform Power of Attorney Act (UPOAA), adopted in some form by most states, sets durability as the default for any POA that does not state otherwise. States that have not adopted the UPOAA generally follow older Uniform Probate Code provisions with similar effect, but the safest approach in any state is to state durability explicitly rather than rely on a default. Execution typically requires notarization; some states add a witness requirement. The signature and notarization can be completed and evidenced electronically under the ESIGN Act, 15 U.S.C. § 7001, though banks and title companies handling real property may still require a wet-ink original.',
    },
    caso: {
      titulo: 'The version that was signed but never checked',
      texto: 'A small business owner signed a power of attorney years before a car accident left her briefly unable to communicate. The document, drafted by a paralegal service years earlier, was silent on durability — a gap that had gone unnoticed because it was never needed until it suddenly was. Her business partner, named as agent, spent nine days establishing with the bank that the POA was still valid, losing a supplier payment deadline in the process. The fix, once discovered, was one sentence.',
    },
    faq: [
      { q: 'Is every power of attorney durable by default?', a: 'In states that have adopted the Uniform Power of Attorney Act, yes, unless the document says otherwise. In states that have not, the default can go the other way. Stating durability explicitly in the document avoids depending on which rule applies where you live.' },
      { q: 'Can a durable power of attorney be revoked?', a: 'Yes, at any time while you have capacity, by signing a written revocation and notifying your agent and any institutions relying on the original document. Durability affects what happens on incapacity — it does not remove your right to revoke while competent.' },
      { q: 'Does durable power of attorney cover healthcare decisions?', a: 'Only if it explicitly grants that authority, or if you separately execute a medical power of attorney or healthcare proxy. Financial durable POAs and medical POAs are commonly kept as two separate documents, even when signed on the same day.' },
      { q: 'What happens to a durable power of attorney at death?', a: 'It ends automatically. A power of attorney only ever operates during your lifetime — after death, authority passes to the executor named in your will, or to whoever a probate court appoints if there is no will.' },
    ],
    fotos: [F.tech, F.hombre, F.oficina],
    cta: 'Create your durable power of attorney',
  },
  {
    slug: 'medical-power-of-attorney',
    titleTag: 'Medical Power of Attorney Template',
    metaDescription: 'Name someone to make healthcare decisions if you cannot. Free medical power of attorney / healthcare proxy template, signed online.',
    h1: 'Medical Power of Attorney',
    grupo: 'poa',
    intro: 'A medical power of attorney — called a healthcare proxy in some states — names someone to make medical decisions for you if you cannot make them yourself. It is a different document from a living will: a living will states your own wishes about specific treatments, while a medical power of attorney names a person to interpret and apply those wishes to situations no form could fully anticipate.',
    problema: {
      titulo: 'A living will cannot answer a question it never asked',
      texto: 'Living wills are written in advance, describing preferences for a handful of scenarios — usually terminal illness or permanent unconsciousness. Real medical situations rarely match a checkbox exactly. Without a named healthcare agent empowered to make the judgment call the form did not anticipate, doctors are often left following the closest legal next-of-kin hierarchy, which may not be the person you would have chosen and may not know your actual wishes.',
    },
    puntos: [
      { titulo: 'One clearly named primary agent', texto: 'Not a committee — a single person with clear authority, which avoids the deadlock that can happen when multiple family members disagree at the bedside and no one has final say.' },
      { titulo: 'A successor agent, named up front', texto: 'If your primary agent is unreachable or unable to serve, a named successor prevents a gap in decision-making at exactly the wrong moment.' },
      { titulo: 'Explicit authority, not implied authority', texto: 'The document states plainly that the agent can consent to, refuse, or withdraw treatment, access medical records under HIPAA, and speak directly with treating physicians — spelled out so no hospital can treat the scope as ambiguous.' },
      { titulo: 'Your own general wishes, stated for guidance', texto: 'A short statement of your values and priorities — not a full living will, but enough that your agent is applying your judgment, not guessing at it.' },
    ],
    ley: {
      titulo: 'How healthcare proxies are recognized',
      texto: 'Every state has a statute authorizing a healthcare power of attorney or proxy, though the exact form requirements differ — some states require witnesses, some require notarization, some accept either, and a small number provide their own statutory form that is preferred by hospitals in that state. HIPAA authorization is commonly included in the same document so the named agent can access medical information immediately, since HIPAA privacy rules otherwise restrict disclosure. This document is signed like any other under the ESIGN Act, 15 U.S.C. § 7001, but hospitals and physicians in your state may expect the state\'s specific statutory language — check your state\'s health department guidance for the preferred form before relying on this for a hospital admission.',
    },
    caso: {
      titulo: 'Two siblings, two opinions, no named decision-maker',
      texto: 'A woman was hospitalized after a serious accident with no healthcare proxy on file. Her two adult children disagreed about a proposed procedure, and because neither held clear legal authority, the hospital\'s ethics committee had to intervene while the family remained divided for four additional days. She recovered, and afterward signed a medical power of attorney naming one of her children as primary agent — the conversation about who should decide, she said, was harder after the fact than it would have been in advance.',
    },
    faq: [
      { q: 'Is a medical power of attorney the same as a living will?', a: 'No. A living will states your own wishes about specific treatments in advance. A medical power of attorney names a person to make decisions and apply judgment in situations a living will does not cover. Many people execute both together.' },
      { q: 'Who should I choose as my healthcare agent?', a: 'Someone who knows your values, is willing to advocate for them even under pressure from other family members, and is realistically available in a medical emergency — not necessarily your closest relative if that person would struggle to make hard decisions.' },
      { q: 'Can my healthcare agent be overruled by family members?', a: 'No, as long as the document is properly executed under your state\'s law — a validly named healthcare agent\'s decisions take priority over next-of-kin, even a spouse, unless a court intervenes.' },
      { q: 'Does this let my agent access my medical records?', a: 'Only if the document includes HIPAA authorization language, which is why it is included by default here — without it, privacy rules can block even a close family member from getting information quickly.' },
    ],
    fotos: [F.mujer, F.revisar, F.tech],
    cta: 'Create your medical power of attorney',
  },
  {
    slug: 'financial-power-of-attorney',
    titleTag: 'Financial Power of Attorney Template',
    metaDescription: 'Authorize someone to manage your bank accounts, bills and property. Free financial power of attorney template, signed online.',
    h1: 'Financial Power of Attorney',
    grupo: 'poa',
    intro: 'A financial power of attorney authorizes someone to manage money matters on your behalf — paying bills, managing bank accounts, handling investments, filing taxes, or running a property. It is the document most often needed on short notice: a deployment, a hospitalization, an extended trip, or simply the practical reality of aging.',
    problema: {
      titulo: 'A bank that will not honor a vague grant of authority',
      texto: 'Banks and brokerages see enough fraud attempts that many now scrutinize powers of attorney closely, and a document with broad, generic language — "authority over all financial matters" — is exactly the kind that triggers extra review, or an outright refusal pending their own legal team\'s sign-off. Institutions respond faster and more reliably to a document that lists specific powers by name, because there is nothing to interpret.',
    },
    puntos: [
      { titulo: 'Powers itemized by category', texto: 'Banking, real estate, tax filing, insurance, retirement accounts, and business interests each get their own line — granted or withheld individually rather than bundled into one catch-all clause.' },
      { titulo: 'A stated dollar or transaction limit, if you want one', texto: 'Some people want unlimited authority for their agent; others want a ceiling on any single transaction without a second signature. Either is valid — the document should simply say which.' },
      { titulo: 'Gifting authority addressed directly', texto: 'The power to give away your money or property to others is not implied by general financial authority in most states — it has to be granted explicitly, which is exactly what this document does or does not do, by your choice.' },
      { titulo: 'A record-keeping obligation for the agent', texto: 'A clause requiring your agent to keep records of transactions made on your behalf protects the agent as much as it protects you, especially if other family members later ask questions.' },
    ],
    ley: {
      titulo: 'What financial institutions look for',
      texto: 'Under the Uniform Power of Attorney Act, adopted in some form by most states, financial institutions are generally required to accept a properly executed power of attorney and can face liability for unreasonably refusing one — but the UPOAA also protects institutions that request an attorney\'s opinion for certain "hot powers" like gifting, changing beneficiaries, or creating trusts, which must be granted explicitly rather than assumed. Execution typically requires notarization. The signature is valid in electronic form under the ESIGN Act, 15 U.S.C. § 7001, though a growing but still incomplete number of banks accept electronically notarized documents — call ahead if a specific institution\'s policy matters for your situation.',
    },
    caso: {
      titulo: 'A deployment with three weeks to prepare',
      texto: 'A service member with a sudden overseas deployment order had three weeks to arrange for someone to manage a mortgage payment, a small rental property, and a joint account. A financial power of attorney naming a sibling as agent, itemizing exactly those three areas with a stated transaction limit, was signed, notarized and on file with the bank before departure. The itemized approach meant the bank\'s compliance review took under a day — a broader, vaguer version from a prior version of the same document had previously been flagged for additional review at a different branch.',
    },
    faq: [
      { q: 'Can my agent access my bank account directly with this?', a: 'Once the bank has the executed and notarized document on file, yes — most banks will let the named agent transact on the account within the powers granted. Some banks additionally require their own internal form signed alongside the POA; call ahead to confirm.' },
      { q: 'Does a financial power of attorney let my agent sell my house?', a: 'Only if real property authority is explicitly granted and the document is recorded with the county where the property sits, which most title companies require before closing. This is a power to name deliberately, not assume.' },
      { q: 'Can I limit what my agent can do?', a: 'Yes — that is the entire purpose of listing powers individually rather than granting blanket authority. You can authorize bill payment and banking while withholding authority over real estate or gifting, for example.' },
      { q: 'What stops my agent from misusing this authority?', a: 'Legally, an agent owes you a fiduciary duty and can be held liable for breaching it. Practically, choosing someone trustworthy, keeping the scope specific, and requiring records are the real safeguards — the document alone cannot prevent bad faith, only make it easier to prove.' },
    ],
    fotos: [F.escritorio, F.hombre, F.revisar],
    cta: 'Create your financial power of attorney',
  },
  {
    slug: 'revoke-power-of-attorney',
    titleTag: 'How to Revoke a Power of Attorney',
    metaDescription: 'Free revocation of power of attorney template — cancel a POA in writing and notify your former agent and any institutions relying on it.',
    h1: 'Revoke a Power of Attorney',
    grupo: 'poa',
    intro: 'A power of attorney does not expire just because you changed your mind or the relationship with your agent changed. Until you revoke it in writing and notify the people relying on it, the original document can, in practice, remain active — accepted by a bank or title company that never learned it was cancelled.',
    problema: {
      titulo: 'Telling your agent is not the same as revoking the document',
      texto: 'A common and risky assumption is that a verbal conversation — "I don\'t want you handling this anymore" — ends an agent\'s authority. It does not, in any state. The original signed and often notarized power of attorney remains a valid legal instrument until a written, signed revocation exists and, critically, is actually delivered to the agent and to any institution that has a copy on file. A bank that was never notified can, and often will, continue to honor the old document.',
    },
    puntos: [
      { titulo: 'A signed, dated revocation document', texto: 'Stating clearly that the specific power of attorney, identified by its original date and the agent named, is revoked effective immediately.' },
      { titulo: 'Notice sent to the former agent', texto: 'In writing, ideally by a method that creates a record of delivery, so there is no ambiguity later about whether or when the agent was informed.' },
      { titulo: 'Notice sent to every institution that has a copy', texto: 'Banks, brokerages, the county recorder if the original was recorded, and any healthcare provider if it covered medical decisions — each needs its own copy of the revocation to actually stop honoring the old document.' },
      { titulo: 'A new power of attorney, if you still need one', texto: 'Revoking an old POA and executing a new one — naming a different agent, or the same agent with different terms — are commonly done together, and this template supports either.' },
    ],
    ley: {
      titulo: 'The legal requirement to notify',
      texto: 'Under the Uniform Power of Attorney Act, adopted in some form by most states, a revocation is effective as to the agent once the agent has actual knowledge of it, and effective as to a third party like a bank once that party has actual knowledge or is given notice. A third party who honors a POA without knowledge of its revocation is typically protected from liability — which is precisely why written notice, actually delivered, matters more than the revocation document\'s existence alone. If the original POA was recorded with a county recorder (common when it grants real estate authority), the revocation generally needs to be recorded there as well. The revocation itself can be signed electronically under the ESIGN Act, 15 U.S.C. § 7001, but confirm your state and county\'s recording requirements if real property was involved.',
    },
    caso: {
      titulo: 'The account still open a year after the relationship ended',
      texto: 'A man signed a financial power of attorney naming a former business partner as agent during a period when they still worked together. Two years later, after the partnership had dissolved acrimoniously, he assumed the document was no longer relevant and never formally revoked it. When a dispute arose over a shared account, he discovered the bank still had the original POA on file and had never been told otherwise — the former partner\'s authority, on paper, had never actually ended. A one-page revocation, sent by certified mail to the bank and the former partner, closed the gap immediately.',
    },
    faq: [
      { q: 'Do I need a lawyer to revoke a power of attorney?', a: 'No — a signed, dated written revocation, delivered to the agent and to any institution relying on the original, is generally sufficient in every state. A lawyer is useful mainly if the situation is contested or the original POA granted significant real estate authority.' },
      { q: 'Does a power of attorney end automatically if I become incapacitated?', a: 'No — a durable power of attorney is specifically designed to survive incapacity, which is usually the point of having one. A non-durable POA can end at incapacity, but that depends on the original document\'s terms.' },
      { q: 'Can I revoke a power of attorney if I gave it to a family member?', a: 'Yes, exactly the same way as with any agent. A family relationship does not change the legal mechanics of revocation — you still need a written, delivered revocation to actually end the authority.' },
      { q: 'What if I can no longer sign because I have lost capacity?', a: 'You generally cannot revoke a POA once you lack the capacity to understand what you are signing — this is one reason to review who holds power of attorney over you periodically, while you still can make that decision yourself.' },
    ],
    fotos: [F.oficina, F.revisar, F.escritorio],
    cta: 'Create your revocation document',
  },

  // ═══════════════ LAST WILL & TESTAMENT ═══════════════
  // Otro documento que la plataforma ya genera (templates.ts, id
  // 'last-will-testament') sin ninguna pagina de aterrizaje propia.
  {
    slug: 'last-will-and-testament-template',
    titleTag: 'Free Last Will and Testament Template',
    metaDescription: 'Name your beneficiaries, guardians and executor. Free last will and testament template, previewed instantly and signed online.',
    h1: 'Last Will and Testament',
    grupo: 'will',
    intro: 'A last will and testament says who gets what, who takes care of your children if you cannot, and who is in charge of making sure it actually happens. Most adults in the United States do not have one — not because it is complicated, but because it feels like a project with no deadline, until suddenly it does.',
    problema: {
      titulo: 'Dying without a will does not mean your wishes get followed by default',
      texto: 'Without a will, state intestate succession law decides who inherits — a formula based on family relationships that has nothing to do with what you would have chosen. It can hand a share of your estate to an estranged relative, split a family home among heirs who then have to agree on what to do with it, or leave a surviving partner with no legal claim at all if you were never married. A will replaces that formula with your actual decision.',
    },
    puntos: [
      { titulo: 'Beneficiaries named specifically', texto: 'Who receives what — whether that is an equal split, specific items to specific people, or a percentage-based distribution — stated clearly enough that there is nothing left for anyone to interpret.' },
      { titulo: 'An executor with clear authority', texto: 'The person responsible for carrying out the will: paying final debts, filing what probate requires, and distributing the estate as written. Naming this person avoids a court appointing one for you.' },
      { titulo: 'Guardians named for minor children', texto: 'If you have children under 18, this is often the single most important clause in the entire document — without it, a court decides who raises them, guided by its own judgment rather than yours.' },
      { titulo: 'A residuary clause', texto: 'What happens to anything not specifically listed — an account you forgot, a possession you never thought to mention. Without this clause, unlisted assets can fall back into intestate succession even with a will in place.' },
    ],
    ley: {
      titulo: 'What makes a will valid',
      texto: 'Most states require a will to be signed by the testator and witnessed by two competent adults who are not beneficiaries, following principles from the Uniform Probate Code that many states have adopted in some form. Roughly half the states also recognize holographic (entirely handwritten, unwitnessed) wills, though a typed and properly witnessed will is accepted everywhere and carries less risk of challenge. Notarization is not required for a will to be valid, but a "self-proving affidavit," signed and notarized alongside the witnesses, speeds up probate by letting the court accept the will without tracking down the witnesses later. This is general information, not state-specific legal advice — confirm your state\'s exact witness and execution requirements, since a will that fails them can be thrown out entirely regardless of intent.',
    },
    caso: {
      titulo: 'A blended family with no will at all',
      texto: 'A man in his second marriage, with one child from his first marriage and two from his second, died without a will. Under his state\'s intestate succession formula, his surviving spouse received half the estate and all three children split the other half equally — an outcome none of them had discussed or expected, and one that left the family home in a three-way ownership dispute between people who did not all get along. He had intended, informally, to leave the house to his spouse and split other assets among the children. None of that was legally relevant, because none of it was written down.',
    },
    faq: [
      { q: 'What happens if I die without a will?', a: 'Your estate is distributed according to your state\'s intestate succession law — a fixed formula based on family relationships, not your actual wishes. It can produce outcomes very different from what you would have chosen, including nothing at all for an unmarried partner.' },
      { q: 'Do I need a lawyer to write a will?', a: 'Not for most straightforward estates. A properly witnessed will covering your major assets, an executor and guardians for minor children is legally valid without an attorney. Complex situations — significant assets, business ownership, disputes you anticipate — are where legal advice earns its cost.' },
      { q: 'Can I write my own will and have it hold up in court?', a: 'Yes, as long as it meets your state\'s execution requirements — typically your signature plus two witnesses who are not beneficiaries. The content does not need special legal language; clarity matters more than formality.' },
      { q: 'How often should I update my will?', a: 'After any major life change — marriage, divorce, a new child, a significant change in assets, or the death of a named executor or guardian. A will written once and never revisited is a common way for outdated intentions to control an estate.' },
    ],
    fotos: [F.escritorio, F.mujer, F.oficina],
    cta: 'Create your will',
  },
  {
    slug: 'will-vs-trust',
    titleTag: 'Will vs. Trust: What\'s the Difference?',
    metaDescription: 'A will and a living trust do different jobs. Compare probate, privacy and cost, then create a free will template online.',
    h1: 'Will vs. Trust',
    grupo: 'will',
    intro: 'A will and a living trust both decide who gets your assets, but they get there in almost opposite ways. A will works after you die, through a court process called probate. A living trust works during your life and after it, generally without probate at all. Neither is universally "better" — they solve different problems, and many estate plans eventually use both.',
    problema: {
      titulo: 'The word "avoid probate" gets sold harder than it needs to be',
      texto: 'Trust marketing often leads with "avoid probate" as if probate were always a disaster. For a modest estate in most states, probate is a bounded, procedural process — not the drawn-out nightmare it is sometimes made out to be. A trust genuinely helps in specific situations: significant real estate in multiple states, a strong preference for privacy, or a family history of estate disputes. For a simpler estate, the added cost and ongoing maintenance of a trust can outweigh what it actually saves.',
    },
    puntos: [
      { titulo: 'A will goes through probate; a properly funded trust generally does not', texto: 'Probate is public record and takes time — often months, sometimes longer if contested. Assets titled in a trust\'s name typically bypass that process, transferring according to the trust\'s terms instead.' },
      { titulo: 'A trust only works if assets are actually retitled into it', texto: 'This is the step people miss most often. Signing a trust document does nothing for a bank account or a house still titled in your own name — the asset has to be formally transferred into the trust to get any of the benefit.' },
      { titulo: 'A will is simpler to create and update', texto: 'A will is one document, signed and witnessed once. A trust requires ongoing maintenance every time you acquire a new asset, and is generally more involved and costly to set up properly in the first place.' },
      { titulo: 'A will can still name guardians; a trust cannot', texto: 'Guardianship for minor children is only ever established through a will, regardless of whatever trust structure exists alongside it — this is why estate plans built around a trust still include a will.' },
    ],
    ley: {
      titulo: 'How each is treated legally',
      texto: 'A will must satisfy your state\'s execution requirements — typically signature plus two witnesses — and only takes legal effect through probate court after death. A revocable living trust is a contract that takes effect the moment it is signed and funded, and generally does not require probate for assets properly titled in its name, though it does not need witnesses in most states, only your signature and often notarization. Both are signed validly in electronic form under the ESIGN Act, 15 U.S.C. § 7001, but the specific formality requirements — witnesses for a will, notarization for a trust in many states — still apply on top of the signature method.',
    },
    caso: {
      titulo: 'A trust that never got funded',
      texto: 'A couple paid to have a living trust prepared specifically to avoid probate on their family home. They signed the trust documents and filed them away — but never completed the deed transferring the house into the trust\'s name. When the husband died years later, the house was still titled in his individual name, meaning it went through probate anyway, exactly what the trust had been built to prevent. The trust itself was valid; the step that made it useful was simply never finished.',
    },
    faq: [
      { q: 'Do I need both a will and a trust?', a: 'Many estate plans use both — a trust for major assets like real estate, and a "pour-over" will covering anything left outside the trust plus naming guardians for minor children, which a trust cannot do.' },
      { q: 'Is a trust always better than a will for avoiding taxes?', a: 'A basic revocable living trust does not reduce estate or income taxes on its own — that requires more advanced structures. Its main benefit is avoiding probate and controlling how assets are distributed, not tax reduction.' },
      { q: 'Can I change a trust after I create it?', a: 'A revocable living trust — the most common kind for this purpose — can be amended or revoked at any time while you are alive and competent, similarly to how a will can be updated.' },
      { q: 'Is a will enough if I own a modest amount of assets?', a: 'For many people, yes. If your estate is straightforward and probate in your state is not unusually slow or expensive, a well-drafted will can be entirely sufficient without the added cost and maintenance of a trust.' },
    ],
    fotos: [F.revisar, F.tech, F.oficina],
    cta: 'Create your will',
  },
  {
    slug: 'how-to-write-a-will',
    titleTag: 'How to Write a Will (Step by Step)',
    metaDescription: 'What a valid will actually needs: beneficiaries, an executor, witnesses and your signature. Free template, written and signed online.',
    h1: 'How to Write a Will',
    grupo: 'will',
    intro: 'Writing a will is less about legal language and more about a handful of decisions, written down clearly and signed correctly. The document does not need to sound like a lawyer wrote it — it needs to say, without ambiguity, who gets what, who is in charge, and who witnessed you sign it.',
    problema: {
      titulo: 'The decisions matter more than the wording',
      texto: 'People delay writing a will because they imagine it requires resolving every possible scenario in advance. In practice, a will needs to answer four questions clearly: who gets your assets, who is your executor, who guards your minor children if applicable, and what happens to anything you did not specifically list. Answering those four questions in plain language, signed correctly, produces a valid will — the perfectionism that delays people is rarely what a court actually requires.',
    },
    puntos: [
      { titulo: 'Start with your executor', texto: 'Choose someone willing and able to handle paperwork, notify creditors, and follow through over months — not necessarily your closest relative, but someone organized and willing to take it on.' },
      { titulo: 'List assets by category, not by exhaustive inventory', texto: 'Real estate, financial accounts, vehicles and personal property, with specific items called out only where you have a strong preference — the residuary clause covers everything else automatically.' },
      { titulo: 'Name guardians if you have minor children', texto: 'Include a primary choice and a backup, and have that conversation with both people beforehand — a guardian who finds out from a will after the fact is a genuinely difficult position to put someone in.' },
      { titulo: 'Sign in front of two witnesses', texto: 'Most states require two witnesses who are not beneficiaries under the will, physically present when you sign. A self-proving affidavit, signed and notarized at the same time, saves your executor time later during probate.' },
    ],
    ley: {
      titulo: 'The formal requirements that actually matter',
      texto: 'Nearly every state requires the same core elements: you must be of sound mind and legal age (18 in nearly every state), the will must be signed by you, and it must be witnessed by two people who are not beneficiaries under it, present at the same time. Some states permit a will to be entirely handwritten (holographic) without witnesses, but a typed, witnessed will is valid everywhere and far less likely to be challenged in probate. This is general information about common state requirements, not a substitute for checking your specific state\'s rule — a will that fails its state\'s execution requirements can be invalidated entirely, regardless of how clearly it states your wishes.',
    },
    caso: {
      titulo: 'A will finished the same afternoon it was started',
      texto: 'A single parent with one child and a modest estate had put off writing a will for three years, assuming it would require a lawyer\'s office and multiple appointments. Once she actually sat down to answer the four core questions — executor, beneficiary, guardian, residuary clause — the decisions took about twenty minutes. Printing, reviewing, and signing in front of two coworkers as witnesses took the rest of the afternoon. The document she had been avoiding for years turned out to be a much smaller project than the version she had been picturing.',
    },
    faq: [
      { q: 'Can I write a will without a lawyer?', a: 'Yes, for most straightforward situations. A will is legally valid based on meeting your state\'s execution requirements, not on who drafted it. Complex estates, business ownership, or anticipated disputes are the cases where legal advice adds real value.' },
      { q: 'Who can be a witness to my will?', a: 'Generally any competent adult who is not a beneficiary under the will. Using a beneficiary as a witness does not always invalidate the will, but it can affect that person\'s inheritance in some states — better to use two people who are not receiving anything under it.' },
      { q: 'Does my will need to be notarized?', a: 'Not to be valid — witnessing is what makes a will legally effective. Notarization is used to create a "self-proving affidavit," which speeds up probate but is not required for the will itself to hold up.' },
      { q: 'Where should I keep my will after signing it?', a: 'Somewhere your executor can actually find it — a fireproof safe at home, with a copy or the storage location told to your executor directly. A perfectly valid will that no one can locate after your death causes the same problem as not having one.' },
    ],
    fotos: [F.tech, F.hombre, F.mujer],
    cta: 'Create your will',
  },
  {
    slug: 'what-happens-without-a-will',
    titleTag: 'What Happens If You Die Without a Will',
    metaDescription: 'Dying without a will means state intestate succession law decides who inherits — not you. See how it works, then create a free will.',
    h1: 'Dying Without a Will',
    grupo: 'will',
    intro: 'Dying without a will is called dying "intestate," and it does not mean your assets go to the state — that is a common misconception. It means a fixed formula written into your state\'s law decides who inherits, based purely on family relationships, with no room for your actual preferences.',
    problema: {
      titulo: 'The formula does not know your family the way you do',
      texto: 'Intestate succession is a one-size-fits-all sequence: typically spouse and children first, then parents, then siblings, working outward through family relationships. It cannot account for a long-term partner you never married, a stepchild you raised as your own but never legally adopted, a close friend you considered family, or a specific wish to leave more to one child than another. All of that requires a will. Without one, the formula runs regardless of what you actually wanted.',
    },
    puntos: [
      { titulo: 'An unmarried partner typically gets nothing', texto: 'Intestate succession is built around legal relationships — marriage and blood or adoptive relation. A partner you lived with for twenty years but never married generally has no automatic inheritance right at all under most states\' formulas.' },
      { titulo: 'A surviving spouse often shares with children, not takes everything', texto: 'A common misconception is that a spouse automatically inherits the full estate. In many states, if there are children, the estate is split between the spouse and the children by a fixed formula — which can be a surprise to a surviving spouse expecting to inherit outright.' },
      { titulo: 'The court appoints your children\'s guardian, not you', texto: 'Without a will naming a guardian, a probate court decides who raises your minor children, based on its own judgment of their best interest — a decision you could have made yourself.' },
      { titulo: 'The court appoints your estate administrator, not you', texto: 'Without a named executor, the court appoints an administrator, often a family member who petitions for the role, who may not be the person you would have trusted most with the job.' },
    ],
    ley: {
      titulo: 'How intestate succession actually works',
      texto: 'Every state has its own intestate succession statute, but most follow a similar structure influenced by the Uniform Probate Code: surviving spouse and children first (in shares that vary significantly by state), then parents if there is no spouse or children, then siblings, and outward through more distant relatives if none of those exist. If no legally recognized relative can be found at all, the estate does eventually pass to the state — but this is genuinely rare, since the formula reaches surprisingly distant relatives before that happens. The specific share a spouse or child receives differs meaningfully state by state, which is exactly the kind of detail a will removes entirely by stating your own terms instead.',
    },
    caso: {
      titulo: 'A stepson who received nothing',
      texto: 'A woman raised her husband\'s son from his prior relationship as her own for fifteen years, but never legally adopted him. When she died unexpectedly without a will, her state\'s intestate succession law recognized only legally adoptive or biological relationships — her stepson, despite the relationship, had no automatic inheritance right at all. Her assets passed instead to her biological siblings, who she had not been close to in years. A one-page will naming him as a beneficiary would have changed the outcome entirely.',
    },
    faq: [
      { q: 'Does everything really go to the state if I have no will?', a: 'Almost never. Intestate succession reaches quite far into extended family — cousins, and sometimes further — before an estate is considered to have no heirs at all. The state inheriting is the rare exception, not the default outcome people often assume.' },
      { q: 'What happens to my children if I die without a will?', a: 'A probate court decides who becomes their guardian, based on its own assessment of the child\'s best interest, guided by state law rather than your personal preference — which is why naming a guardian is often described as the single most important reason to have a will if you have minor children.' },
      { q: 'Does my unmarried partner inherit anything if I die without a will?', a: 'Generally, no — intestate succession is built around legal marriage and blood or adoptive relationships. An unmarried partner, regardless of how long the relationship lasted, typically has no automatic right to inherit under most states\' intestate formulas.' },
      { q: 'How much does probate cost without a will versus with one?', a: 'A will does not eliminate probate, but it usually simplifies and speeds it up considerably by removing disputes over who inherits and who administers the estate — the process without a will is not necessarily more expensive by statute, but disputes and court involvement over unclear succession commonly add real cost and delay.' },
    ],
    fotos: [F.oficina, F.escritorio, F.revisar],
    cta: 'Create your will',
  },
  {
    slug: 'free-will-template',
    titleTag: 'Free Will Template — Online, No Cost to Start',
    metaDescription: 'A free last will and testament template you fill out, preview and sign online. No credit card required to start.',
    h1: 'Free Will Template',
    grupo: 'will',
    intro: 'A free will template removes the two reasons people put off estate planning the longest: cost and complexity. This one is filled out through a guided form, previewed exactly as it will print before anything is paid for, and signed online with a verifiable audit trail — no law office appointment required.',
    problema: {
      titulo: 'Free does not have to mean generic',
      texto: 'Many free will templates online are static documents with blanks to fill in by hand — no guidance on what happens if a beneficiary predeceases you, no prompt to name a backup executor, no explanation of witness requirements. A free template that is also a guided, structured process catches the gaps a blank form leaves open, without charging for the difference.',
    },
    puntos: [
      { titulo: 'A guided form, not a blank page', texto: 'Each section — beneficiaries, executor, guardians, residuary clause — is prompted individually, so nothing gets skipped because it was easy to overlook on an unstructured document.' },
      { titulo: 'Instant preview before anything is paid for', texto: 'See the complete, formatted document exactly as it will look, with your actual information filled in, before deciding whether to download or sign it.' },
      { titulo: 'Clear guidance on witness requirements', texto: 'The document explains what your state generally requires for execution — typically two witnesses who are not beneficiaries — so signing it correctly does not depend on separate research.' },
      { titulo: 'No subscription required to create one will', texto: 'The free tier covers document generation and e-signature without a recurring commitment — useful when a single, properly executed will is genuinely all you need.' },
    ],
    ley: {
      titulo: 'A free template still has to meet the same legal bar',
      texto: 'Cost has no bearing on a will\'s validity — a free, self-prepared will that meets your state\'s execution requirements (signature plus two disinterested witnesses, in most states) is exactly as legally binding as one drafted by an expensive law firm. What matters is meeting the formal requirements, not what the document cost to produce. This is general information; confirm your own state\'s specific execution rule, since a will that fails it can be invalidated in probate regardless of its content.',
    },
    caso: {
      titulo: 'Three years of delay, twenty minutes of actual work',
      texto: 'A freelance designer had been meaning to write a will since her daughter was born three years earlier, put off each time by the assumption it would cost several hundred dollars and require scheduling an appointment. She started a free template one evening after her daughter was asleep, filled in beneficiaries, an executor and a guardian, previewed the finished document, and had it printed and witnessed by two neighbors within the week. The version she had been picturing — expensive, drawn-out — had never actually matched what the process required.',
    },
    faq: [
      { q: 'Is a free will template as legally valid as a paid one?', a: 'Yes, as long as it meets your state\'s execution requirements. Price does not determine legal validity — proper signing and witnessing does.' },
      { q: 'What is included in the free tier?', a: 'Document generation with a full preview, and free e-signature capacity that resets periodically — enough for most people to complete and properly execute one will at no cost.' },
      { q: 'Do I still need witnesses if I use a free online template?', a: 'Yes — witness requirements come from state law, not from how the document was created. You will still need two disinterested witnesses physically present when you sign, regardless of the template\'s source.' },
      { q: 'Can I update a free will template later if my situation changes?', a: 'Yes — you can generate a new version whenever your circumstances change, which is generally the recommended approach rather than hand-editing an already-signed will.' },
    ],
    fotos: [F.mujer, F.tech, F.hombre],
    cta: 'Create your free will',
  },

  // ═══════════════ RESIGNATION LETTER ═══════════════
  // Ya generado por la plataforma (resignation-letter-template.ts), y de
  // altisimo volumen de busqueda individual — sin ninguna pagina propia.
  {
    slug: 'resignation-letter-template',
    titleTag: 'Free Resignation Letter Template',
    metaDescription: 'A professional resignation letter template — state your last day, keep it brief, and leave the relationship intact. Free, signed online.',
    h1: 'Resignation Letter',
    grupo: 'resignation',
    intro: 'A resignation letter has one real job: to create a clear, dated record that you resigned, when your last day is, and that you did it professionally. It is not the place to explain everything you have been holding back — that conversation, if it happens at all, happens somewhere else.',
    problema: {
      titulo: 'The letter people wish they could take back',
      texto: 'A resignation letter becomes a permanent part of your employment file, and it is often the last document a former employer keeps on hand when a reference check comes in years later. Letters written in frustration — listing grievances, criticizing management, or venting about specific coworkers — tend to be remembered long after the frustration that prompted them has faded. A short, professional letter costs nothing in the moment and protects the reference later.',
    },
    puntos: [
      { titulo: 'A clear statement of resignation and last day', texto: 'The core of the letter: that you are resigning, from what position, and your final date of employment — stated plainly in the first line, not buried in the middle of a longer explanation.' },
      { titulo: 'Standard notice period, stated explicitly', texto: 'Two weeks is the common default in the United States, though your contract or company policy may specify something different — the letter should match whatever applies to you.' },
      { titulo: 'A brief, genuine note of thanks', texto: 'One or two sentences acknowledging the opportunity or specific experience — not required, but the kind of detail that keeps the door open for a future reference or reconnection.' },
      { titulo: 'An offer to help with the transition', texto: 'A short line offering to help train a replacement or document your responsibilities during the notice period — low-cost to include, and it is exactly what a good reference later remembers.' },
    ],
    ley: {
      titulo: 'What a resignation letter legally does and does not do',
      texto: 'In the United States, most employment is "at will," meaning either you or your employer can end it at any time, for almost any reason, without a required notice period — a resignation letter is a professional courtesy and a paper record, not a legal requirement in most states or industries. Exceptions exist for employment contracts that specify a notice period or a collective bargaining agreement that sets separate rules. Signed electronically, a resignation letter is treated the same as any other signed document under the ESIGN Act, 15 U.S.C. § 7001 — the signature is valid, though most employers accept an emailed or delivered PDF without requiring any particular signing method.',
    },
    caso: {
      titulo: 'The letter that outlasted the job',
      texto: 'An employee leaving after a genuinely difficult final few months wrote a long resignation letter detailing specific complaints about a manager, intending it as a form of closure. A colleague who had left the same company a year earlier, and had written a short two-paragraph letter instead, was contacted for a reference by a new employer eighteen months later — the hiring manager specifically mentioned having seen both letters during an internal file review, and described the shorter one as "the professional version." The complaints in the longer letter were accurate. They were also the last thing the company remembered about the person who wrote them.',
    },
    faq: [
      { q: 'How much notice should I give when resigning?', a: 'Two weeks is the standard professional norm in the United States, though it is a courtesy rather than a universal legal requirement — check your employment contract or company handbook for anything different that applies specifically to you.' },
      { q: 'Should I explain why I am resigning in the letter?', a: 'Generally, no — a resignation letter is a record of the fact and the date, not an explanation. If you want to explain your reasons, that conversation is better had verbally, separately, and selectively.' },
      { q: 'Can I resign by email instead of a formal letter?', a: 'Yes — an emailed resignation is legally just as effective as a printed one. Attaching a properly formatted letter to the email is common practice and creates a cleaner record than the email body alone.' },
      { q: 'What if my employer asks me to leave immediately after I resign?', a: 'Employers can generally do this under at-will employment, even if your letter states a future last day. It does not change your resignation date for record purposes, but it does mean your actual final day may be shorter than intended — worth knowing before you submit the letter.' },
    ],
    fotos: [F.tech, F.hombre, F.oficina],
    cta: 'Create your resignation letter',
  },
  {
    slug: 'two-weeks-notice-letter',
    titleTag: 'Two Weeks Notice Letter Template',
    metaDescription: 'Give proper two weeks notice with a clear, professional letter. Free template, previewed instantly and signed online.',
    h1: 'Two Weeks Notice Letter',
    grupo: 'resignation',
    intro: 'Two weeks notice is the unwritten standard for leaving a job professionally in the United States — not a legal requirement, but close enough to one in practice that skipping it can affect how you are remembered and referenced. A two weeks notice letter formalizes that courtesy with a clear date and a professional tone.',
    problema: {
      titulo: 'Two weeks is a norm, not a law — and that distinction matters both ways',
      texto: 'Because two weeks notice is customary rather than legally required, some employees skip it entirely, assuming there is no real consequence. There often is one — just not a legal one. Future references, rehire eligibility, and how a departure is remembered internally are all affected by whether notice was given properly. On the other side, some employers respond to a two weeks notice by ending employment immediately, which is also generally legal under at-will employment — the letter protects your record either way.',
    },
    puntos: [
      { titulo: 'The exact last working day, calculated and stated', texto: 'Not "in two weeks" as a vague phrase, but a specific calendar date, calculated from the day you submit the letter — removing any ambiguity about when your employment actually ends.' },
      { titulo: 'Delivered in writing, even if you also tell your manager in person', texto: 'A verbal resignation followed by a written letter on the same day creates a clean, dated record — relying on a verbal conversation alone leaves your resignation date open to dispute later.' },
      { titulo: 'A professional, forward-looking tone', texto: 'The letter states the fact and the timeline without editorializing — reserving any additional feedback for an exit interview or a separate, private conversation.' },
      { titulo: 'An offer to support the transition', texto: 'A short line about training a replacement or documenting open work — costs little to include and is the detail most likely to be remembered well later.' },
    ],
    ley: {
      titulo: 'Is two weeks notice legally required?',
      texto: 'No — in the United States\' at-will employment framework, which applies in nearly every state, neither the employee nor the employer is required to give any advance notice at all, absent a specific contract or collective bargaining agreement stating otherwise. Two weeks is a professional custom, not a statute. Signing and submitting the letter electronically is valid under the ESIGN Act, 15 U.S.C. § 7001, the same as any other signed document — most employers accept an emailed or portal-submitted letter without requiring any specific format.',
    },
    caso: {
      titulo: 'Walking out versus giving notice, six months later',
      texto: 'Two employees at the same company left within a few months of each other under similar circumstances — one gave two weeks notice in writing, the other left the same week they decided to go, with no formal letter. Six months later, both applied to positions at companies that called the same former employer for a reference. The one who had given notice received a straightforward, positive reference. The other received a technically accurate but noticeably shorter and more hesitant one — the company\'s HR policy, it turned out, flagged departures without proper notice for a more cautious reference response.',
    },
    faq: [
      { q: 'What happens if I don\'t give two weeks notice?', a: 'There is generally no legal penalty in most at-will employment situations, but it can affect your eligibility for rehire and the tone of future references — some companies have explicit policies treating notice length as a factor in reference responses.' },
      { q: 'Can my employer make me work the full two weeks?', a: 'No — you can leave earlier if you choose, though it may affect the relationship. Conversely, an employer can also choose to end your employment immediately upon receiving notice, rather than have you work out the two weeks.' },
      { q: 'Should I give more than two weeks for a senior role?', a: 'It is common practice for more senior or specialized positions, where transition takes longer — three to four weeks is not unusual, though it remains a courtesy rather than a requirement.' },
      { q: 'Do I still get paid for the two weeks if my employer lets me go early?', a: 'This depends on your state and your employer\'s policy — some employers pay through the original notice period as a courtesy, others do not. Check your employee handbook or state labor department guidance for what applies to you.' },
    ],
    fotos: [F.hombre, F.tech, F.escritorio],
    cta: 'Create your two weeks notice letter',
  },
  {
    slug: 'professional-resignation-letter',
    titleTag: 'Professional Resignation Letter Template',
    metaDescription: 'Leave on good terms with a polished, professional resignation letter. Free template, previewed instantly and signed online.',
    h1: 'Professional Resignation Letter',
    grupo: 'resignation',
    intro: 'A professional resignation letter is not defined by fancy language — it is defined by tone, structure, and restraint. It states the facts, keeps emotion out of the record, and leaves the relationship in a state you would be comfortable revisiting years later.',
    problema: {
      titulo: 'The letter is a record before it is a message',
      texto: 'It is easy to think of a resignation letter as something written for your manager, read once, and forgotten. In practice it usually becomes a permanent part of your personnel file — pulled up during a reference check, an internal audit, or a rehire application years later. Writing it with that longer timeline in mind, rather than the emotional state of the moment you are leaving, is what separates a professional letter from one you might later wish had been shorter.',
    },
    puntos: [
      { titulo: 'Structured in a clear, predictable order', texto: 'Statement of resignation, last working day, brief thanks, transition offer, professional closing — in that order, so anyone skimming it gets the essential facts immediately.' },
      { titulo: 'No criticism, even if warranted', texto: 'Grievances, however valid, belong in an exit interview or a private conversation — not in the document that outlives the job and follows you into future reference checks.' },
      { titulo: 'Addressed correctly and formatted cleanly', texto: 'Your manager\'s correct name and title, the company name, and a clean, professional layout — small details that reflect the same care as the content itself.' },
      { titulo: 'A copy for your own records', texto: 'Keep a signed copy for yourself, separate from what you submit to HR or your manager — useful if there is ever a dispute about your resignation date or notice period.' },
    ],
    ley: {
      titulo: 'Does a resignation letter need to follow a legal format?',
      texto: 'No — there is no statutory format required for a resignation letter in any U.S. state. What matters legally is that it clearly documents your intent to resign and the effective date, since this can matter for unemployment eligibility determinations, final paycheck timing under state labor law, and benefits continuation deadlines. Beyond those practical dates, the format and tone are a professional choice, not a legal one. Signed electronically, it carries the same validity as a printed and signed copy under the ESIGN Act, 15 U.S.C. § 7001.',
    },
    caso: {
      titulo: 'A reference call, four years later',
      texto: 'A marketing manager resigned from a company after a difficult reorganization, but kept the letter itself entirely professional — brief, appreciative of the opportunity, with a clear last day. Four years later, applying for a director-level role, a background check firm contacted that same company. The HR representative who pulled the file specifically noted the resignation letter\'s tone in the reference summary, describing the departure as "handled well" — a small detail from a two-paragraph letter, still shaping an outcome years after the job itself had ended.',
    },
    faq: [
      { q: 'How long should a professional resignation letter be?', a: 'Short — typically three to five sentences is enough to cover the essential facts. Length does not signal professionalism; clarity and restraint do.' },
      { q: 'Should I mention my next job in the resignation letter?', a: 'It is optional and not required. Some people mention it briefly as context; others prefer to keep the letter focused solely on the departure itself. Either approach is professionally acceptable.' },
      { q: 'Can I email a professional resignation letter, or does it need to be printed?', a: 'Email is standard and widely accepted. Attaching a formatted letter to the email, rather than writing the resignation only in the email body, tends to read as more deliberate and professional.' },
      { q: 'Who should I address the letter to?', a: 'Your direct manager, with HR typically copied — check your company\'s specific policy if one exists, since some organizations have a defined resignation process that specifies exactly who needs to receive it.' },
    ],
    fotos: [F.oficina, F.mujer, F.tech],
    cta: 'Create your resignation letter',
  },
  {
    slug: 'resignation-letter-email-format',
    titleTag: 'Resignation Letter Email Format',
    metaDescription: 'How to format a resignation email correctly, with a free downloadable resignation letter to attach. Signed online.',
    h1: 'Resignation Letter by Email',
    grupo: 'resignation',
    intro: 'Resigning by email is standard practice today, especially for remote or hybrid roles where an in-person handoff is not realistic. Getting the format right — a clear subject line, a formatted letter attached rather than buried in the email body — makes the difference between a professional record and a message that reads as an afterthought.',
    problema: {
      titulo: 'An email body is not the same as a letter',
      texto: 'Writing your resignation directly into the body of an email, without a formal attached document, can come across as less deliberate than it is — and it is harder for HR to file cleanly as part of your permanent record. A short, clear email with a properly formatted resignation letter attached covers both: an immediate, easy-to-read message, and a document that holds up as an official record.',
    },
    puntos: [
      { titulo: 'A clear, specific subject line', texto: '"Resignation — [Your Name] — Last Day [Date]" tells the recipient exactly what they are opening before they even read the message, which matters for a document that needs prompt attention from HR.' },
      { titulo: 'A short email body', texto: 'One or two sentences noting that your resignation letter is attached and your last day, with the full detail — thanks, transition offer, formal notice — living in the attached letter instead.' },
      { titulo: 'The letter attached as a PDF, not just pasted into the email', texto: 'A properly formatted, signed PDF is what typically gets filed in your personnel record — an email body alone is easy to lose track of once the thread gets buried.' },
      { titulo: 'Sent to the right people, and copied appropriately', texto: 'Your direct manager as the primary recipient, with HR copied if your company\'s process calls for it — confirm this against your employee handbook if you are unsure.' },
    ],
    ley: {
      titulo: 'Is an email resignation legally valid?',
      texto: 'Yes — a resignation submitted by email, with or without an attached formal letter, is legally effective in every U.S. state. There is no requirement that a resignation be delivered in any particular format or medium. The ESIGN Act, 15 U.S.C. § 7001, specifically protects the validity of a document because it was created, signed or delivered electronically — an emailed, digitally signed resignation letter carries the same legal weight as a printed one delivered in person.',
    },
    caso: {
      titulo: 'A remote employee with no office to walk into',
      texto: 'An employee working fully remote for a company headquartered in a different state had never met her manager in person. When she decided to resign, there was no office to walk into and no natural moment for an in-person conversation. She scheduled a short video call to say so directly, then followed up the same day with an email containing a clearly formatted, signed resignation letter attached. HR confirmed receipt within the hour and processed her final pay according to the date stated in the letter — the entire process, start to finish, happened without either party being in the same room.',
    },
    faq: [
      { q: 'Do I need to also submit a paper copy if I resign by email?', a: 'Usually not — most companies now accept and file electronic resignations without requiring a separate paper copy, though it is worth checking your specific employee handbook if your company has an unusually formal process.' },
      { q: 'Should I still tell my manager in person or by call before sending the email?', a: 'It is generally considered more professional, when feasible, to have a brief conversation first so your manager does not learn of your resignation cold from an email — the email and attached letter then serve as the formal, dated record of that conversation.' },
      { q: 'What time of day should I send a resignation email?', a: 'Business hours, ideally not right before a major deadline or event your team depends on you for — the timing itself can affect how the departure is remembered, separate from the letter\'s content.' },
      { q: 'Can I resign by email if my contract requires written notice?', a: 'Yes — email satisfies "written notice" in essentially every context, since it produces a dated, retrievable written record, which is what that kind of contract language is designed to ensure exists.' },
    ],
    fotos: [F.tech, F.mujer, F.escritorio],
    cta: 'Create your resignation letter',
  },

  // ═══════════════ CHILD TRAVEL CONSENT ═══════════════
  // Documento existente (child-travel-consent-template) sin ninguna
  // pagina propia — estacional, alto volumen antes de vacaciones/verano.
  {
    slug: 'child-travel-consent-form',
    titleTag: 'Free Child Travel Consent Form',
    metaDescription: 'A child travel consent form for when a minor travels without both parents. Free template, previewed instantly and signed online.',
    h1: 'Child Travel Consent Form',
    grupo: 'travel',
    intro: 'A child travel consent form documents that a parent or guardian has authorized a minor to travel without them — with the other parent, a grandparent, a school group, or another adult. Airlines rarely require it for domestic travel, but many international borders, and a growing number of airlines on international routes, do ask for one.',
    problema: {
      titulo: 'The form exists because child trafficking checks got stricter, not looser',
      texto: 'Border agents in many countries have become more attentive to a child travelling with only one adult, or with an adult who is not a legal parent — a reasonable response to a real problem, but one that can catch an innocent family trip off guard at the worst possible moment: the departure gate or the immigration line. A properly prepared consent form is inexpensive insurance against a delay or, in some cases, being denied entry or exit entirely.',
    },
    puntos: [
      { titulo: 'Both parents\' or guardians\' full legal information', texto: 'Names, addresses and contact information for the parent or guardian who is not travelling, so any questioning official can verify the relationship and reach them directly if needed.' },
      { titulo: 'The accompanying adult identified specifically', texto: 'Who the child is travelling with, their relationship to the child, and their contact information — clear enough that there is no ambiguity about who is responsible during the trip.' },
      { titulo: 'Travel dates and destination stated', texto: 'A specific date range and destination, rather than an open-ended authorization — some countries and airlines specifically look for this level of detail.' },
      { titulo: 'Signed by the non-travelling parent or guardian', texto: 'The document only works if it is actually signed by the parent who is not present — an unsigned or improperly authorized form provides no protection at all.' },
    ],
    ley: {
      titulo: 'Is a child travel consent form legally required?',
      texto: 'There is no single federal requirement in the United States for domestic travel, but several countries require documented parental consent for a minor entering or leaving with only one parent or a non-parent adult, and U.S. Customs and Border Protection recommends carrying one for international travel even though it does not universally mandate it. Airlines on certain international routes independently require it as a condition of boarding. Requirements vary by destination country and change periodically — verify your specific destination\'s current requirement before travelling. The form itself can be signed electronically under the ESIGN Act, 15 U.S.C. § 7001, though notarization, while not universally required, is recommended by the U.S. State Department for international travel since it adds a layer of verification some border officials specifically look for.',
    },
    caso: {
      titulo: 'A grandmother stopped at the gate',
      texto: 'A grandmother travelling internationally with her two grandchildren, without either parent present, was stopped at the departure gate and asked for documentation proving she had permission to travel with them. She had none — the trip had been arranged informally with the parents\' verbal agreement, which meant nothing to the airline\'s ground staff. The flight nearly departed without them while a phone call to the children\'s mother was arranged to confirm the arrangement verbally. A one-page signed consent form, prepared in the twenty minutes it would have taken before leaving the house, would have avoided the entire situation.',
    },
    faq: [
      { q: 'Do I need a travel consent form for domestic flights within the U.S.?', a: 'Generally no — U.S. domestic travel does not require documented parental consent for a minor travelling with one parent or another adult, though some airlines have their own internal policies worth checking in advance.' },
      { q: 'Does the consent form need to be notarized?', a: 'Not universally required, but recommended for international travel by the U.S. State Department and specifically requested by some countries\' border officials — notarizing is a low-cost step that removes ambiguity if questioned.' },
      { q: 'What if only one parent has custody?', a: 'The custodial parent\'s consent is generally what matters, but a copy of the custody order alongside the consent form is a good idea if the child is travelling with the non-custodial parent or another adult, to avoid questions about parental authority.' },
      { q: 'Does the form need to be in the destination country\'s language?', a: 'Some countries specifically require this. Check your destination\'s current entry requirements before travelling — requirements around language and notarization change and vary significantly by country.' },
    ],
    fotos: [F.mujer, F.tech, F.oficina],
    cta: 'Create your travel consent form',
  },
  {
    slug: 'single-parent-travel-consent-form',
    titleTag: 'Single Parent Travel Consent Form',
    metaDescription: 'Travelling internationally alone with your child? Free single-parent travel consent form, previewed instantly and signed online.',
    h1: 'Single Parent Travel Consent Form',
    grupo: 'travel',
    intro: 'A single parent travelling internationally with a child, without the other parent present, is one of the situations border officials scrutinize most closely — not because it is unusual, but because it is the exact profile a genuine custody dispute or abduction case often matches. A consent form from the absent parent is the standard way to remove that question before it is even asked.',
    problema: {
      titulo: 'A birth certificate proves parentage, not permission',
      texto: 'Many single parents assume that carrying the child\'s birth certificate, proving they are in fact the parent, is sufficient documentation for international travel. It proves the relationship, but not that the other parent consented to this specific trip — which is the actual question border officials in many countries are trying to answer. A signed consent form from the other parent, or documentation of sole legal custody if that applies, addresses the real concern directly.',
    },
    puntos: [
      { titulo: 'Consent from the non-travelling parent, if both are living', texto: 'A signed statement authorizing the specific trip, with dates and destination, from the parent who is not travelling — this is what most border officials are specifically looking to see.' },
      { titulo: 'Sole custody documentation, if that applies instead', texto: 'If you have sole legal custody, a copy of the court order stating so serves the same purpose as a consent form, since it establishes you do not need the other parent\'s permission.' },
      { titulo: 'A death certificate, if the other parent is deceased', texto: 'Where relevant, this removes any ambiguity immediately rather than requiring an explanation at the border.' },
      { titulo: 'Your own contact information and the child\'s details', texto: 'Full legal names, dates of birth, and your relationship to the child, alongside the specific travel dates and destination — matched exactly to the child\'s passport.' },
    ],
    ley: {
      titulo: 'What officials are actually checking for',
      texto: 'Many countries, and U.S. Customs and Border Protection\'s own guidance, specifically flag a single adult travelling internationally with a child of a different last name, or without documentation of parental relationship and consent, for closer questioning. There is no single global standard — some countries require a notarized letter from the absent parent, others accept less formal documentation, and requirements change periodically. The document itself is validly signed in electronic form under the ESIGN Act, 15 U.S.C. § 7001, but notarization is specifically recommended by the U.S. State Department for this exact situation, since it is one border officials are trained to look for.',
    },
    caso: {
      titulo: 'A mother travelling alone with her son',
      texto: 'A divorced mother travelling internationally with her ten-year-old son, whose last name matched his father\'s rather than hers, was pulled aside for secondary questioning at customs in the destination country. She had the boy\'s birth certificate but no documentation of the father\'s consent or her custody status. After a delay of over an hour and a phone call to the father to confirm the arrangement, she was allowed to proceed. On the return trip, carrying a notarized consent letter prepared in the meantime, the same question was resolved by the border officer in under a minute.',
    },
    faq: [
      { q: 'What if the other parent refuses to sign a consent form?', a: 'This can be a sign of a genuine custody concern and is worth taking seriously rather than travelling anyway — if you have sole legal custody, court documentation of that status can substitute for the other parent\'s consent.' },
      { q: 'Do I need this form if the other parent is deceased?', a: 'A death certificate generally addresses the question in place of a consent form, since it establishes there is no other parent to have consented.' },
      { q: 'Is a single parent consent form the same as a general child travel consent form?', a: 'They cover the same underlying need — documented permission for a minor to travel — but this version is written specifically for a single parent travelling alone, which is the scenario that draws the most scrutiny at international borders.' },
      { q: 'How far in advance should I prepare this document?', a: 'There is no formal deadline, but preparing and, if relevant, notarizing it well before your trip avoids a last-minute scramble — some notary services also require an appointment, which is worth booking in advance during busy travel seasons.' },
    ],
    fotos: [F.mujer, F.oficina, F.revisar],
    cta: 'Create your travel consent form',
  },
  {
    slug: 'international-travel-consent-form-for-minors',
    titleTag: 'International Travel Consent Form for Minors',
    metaDescription: 'A parental consent form for a minor travelling internationally without both parents. Free template, previewed and signed online.',
    h1: 'International Travel Consent for Minors',
    grupo: 'travel',
    intro: 'International travel with a minor, when both legal parents are not present, is the specific scenario where a written consent form matters most. Different destinations have different expectations, but the underlying document — who authorized this trip, and for how long — is broadly the same wherever the family is headed.',
    problema: {
      titulo: 'Requirements differ by destination, and change without much notice',
      texto: 'Some countries formally require a notarized parental consent letter as a condition of entry for a minor travelling without both parents; others simply recommend it, but their border officials frequently ask for it anyway in practice. These policies are set by individual countries and airlines, and they do change — a rule that did not apply on a previous trip is not a reliable guide for the next one. Preparing the document as a standard step, regardless of the specific destination\'s formal requirement, avoids being caught by a policy update.',
    },
    puntos: [
      { titulo: 'Full legal names matched exactly to passports', texto: 'The child\'s name, the accompanying adult\'s name, and the absent parent\'s or parents\' names, spelled exactly as they appear on official identification — a mismatch can itself trigger additional questioning.' },
      { titulo: 'Specific travel dates and itinerary', texto: 'Departure and return dates, and destination country — an open-ended consent form is generally treated with more suspicion than one scoped to a specific, dated trip.' },
      { titulo: 'The relationship between the child and the accompanying adult', texto: 'Stated clearly — grandparent, aunt, family friend, camp counselor — since this is often the first question asked if the child\'s last name does not match the accompanying adult\'s.' },
      { titulo: 'Emergency contact and medical authorization', texto: 'Many versions of this form include authorization for the accompanying adult to consent to emergency medical treatment, which some destinations and camps or programs specifically request alongside travel consent.' },
    ],
    ley: {
      titulo: 'A patchwork of requirements, not one federal rule',
      texto: 'The United States does not have a single federal law requiring a consent form for a minor\'s international travel, but the U.S. State Department strongly recommends notarized written consent from any parent not travelling, and many other countries impose their own entry requirements independent of U.S. law. Airlines on certain international routes have also adopted their own consent-documentation policies as a condition of boarding a minor. Because requirements vary by destination and change over time, verify the current rule for your specific destination before travelling rather than relying on a prior trip\'s experience. The consent form itself is validly executed in electronic form under the ESIGN Act, 15 U.S.C. § 7001, with notarization added as an extra, commonly recommended layer of verification.',
    },
    caso: {
      titulo: 'A school trip with twelve students and one form each',
      texto: 'A private school organizing an international educational trip for twelve students required every family to submit a signed, notarized parental consent form before the trip, even for students travelling with both parents present as chaperones on the same trip, as a standard risk-management policy covering the group as a whole. One family, unaware of the requirement until the week before departure, had to arrange a same-week notary appointment to avoid their child being excluded from the trip. The school\'s policy, while stricter than any single country legally required, reflected the reality that requirements can vary by destination and by carrier, and a uniform consent form for every student removed that variability entirely.',
    },
    faq: [
      { q: 'Does every country require a child travel consent form?', a: 'No — requirements vary significantly by destination and are not uniform. Some countries formally require it, others do not but their border officials commonly ask anyway. Check your specific destination\'s current requirement before travelling.' },
      { q: 'Should I get the form notarized even if my destination doesn\'t formally require it?', a: 'It is a reasonable precaution, since notarization adds credibility that can resolve an official\'s question quickly, and some destinations that do not formally require it still respond well to seeing it.' },
      { q: 'Is one consent form enough for multiple children travelling together?', a: 'Many families use a single form listing all children if they share the same parents and are travelling together, though a form with each child\'s information individually clear is generally the safer approach if there is any doubt.' },
      { q: 'Does the form expire?', a: 'It is typically scoped to a specific trip and set of dates rather than an ongoing authorization, so a new form is generally prepared for each separate trip rather than reused indefinitely.' },
    ],
    fotos: [F.oficina, F.mujer, F.tech],
    cta: 'Create your travel consent form',
  },

  // ═══════════════ B2B / EMPRESAS ═══════════════
  // Ocho paginas centradas en el uso empresarial real de la plataforma:
  // API, equipos, marca propia (ver company-service.ts / branding-service.ts,
  // modulo empresarial ya construido) y nuevos marcos de uso para los seis
  // tipos de documento existentes (nda, service-agreement, independent-
  // contractor) sin inventar tipos de documento que no existen.
  {
    slug: 'electronic-signature-api-for-developers',
    titleTag: 'Electronic Signature API for Developers',
    metaDescription: 'Trigger document generation and e-signature workflows from your own product with the Codec Document API. Company account, API keys, webhooks.',
    h1: 'Electronic Signature API',
    grupo: 'b2b',
    intro: 'Some teams do not want a human clicking through a signing flow — they want a document generated and sent for signature automatically, the moment an order is placed, an account is created, or a milestone is hit in their own product. The Codec Document API is built for exactly that: a company account, API keys, and webhooks that fire when a document status changes.',
    problema: {
      titulo: 'Manual signing does not scale past a certain volume',
      texto: 'A five-person team can manage sending contracts by hand. A product generating fifty signup agreements a day, or an operations team issuing hundreds of vendor confirmations a month, cannot — not without either hiring for the manual work or building the automation themselves against a signing tool that was never designed to be called programmatically. An API-first path removes the ceiling entirely.',
    },
    puntos: [
      { titulo: 'Company workspace with role-based API keys', texto: 'A company account (owner, admin, manager, user roles) issues its own API keys, scoped to that workspace — keys are managed centrally, not tied to one individual\'s personal login.' },
      { titulo: 'Webhooks on document and signature status changes', texto: 'Subscribe to events — document created, sent, viewed, signed, expired — so your own system reacts the moment something changes, instead of polling for updates.' },
      { titulo: 'Programmatic document generation from your data', texto: 'Send structured data to generate a document from a template, without a human opening the editor — useful for high-volume, repeatable document types like service agreements or NDAs.' },
      { titulo: 'The same audit trail as manual signatures', texto: 'API-triggered signatures carry the identical SHA-256 hash, IP logging and timestamp evidence as a document signed through the standard interface — automation does not reduce the evidentiary standard.' },
    ],
    ley: {
      titulo: 'Does an API-triggered signature count the same, legally?',
      texto: 'Yes — the ESIGN Act, 15 U.S.C. § 7001, does not distinguish between a signature captured through a manual web flow and one captured through an API-triggered process. What matters legally is that the signature is attributable to the signer and that the record is retained with integrity, both of which the platform\'s audit trail (identity data, IP address, timestamp, cryptographic hash) preserves regardless of how the signing session was initiated.',
    },
    caso: {
      titulo: 'A marketplace automating vendor onboarding',
      texto: 'An online marketplace onboarding new sellers needed each one to sign a standard vendor agreement before their storefront went live — a manual process that had been creating a two-to-three-day bottleneck between application approval and go-live. By calling the API to generate and send the agreement automatically the moment an application was approved in their own system, and listening for the signed webhook to flip the seller\'s account to active, the delay dropped to the time it took the vendor to actually read and sign the document — typically under an hour.',
    },
    faq: [
      { q: 'Do I need a company account to use the API?', a: 'Yes — API access is tied to a company workspace, which also gives you role-based team management and shared branding for anything generated through the API.' },
      { q: 'What happens if a webhook delivery fails?', a: 'The platform retries failed webhook deliveries automatically; you can also poll document status directly through the API as a fallback for any event your endpoint might have missed.' },
      { q: 'Can I generate documents from data I already have in my own system?', a: 'Yes — that is the core use case. You send the structured fields your template needs, and the API returns a generated document ready to send for signature, without anyone opening the manual editor.' },
      { q: 'Is there a free tier for API usage?', a: 'API access is part of the company/business plan rather than the individual free tier — reach out through the pricing page for current usage limits and plan options for your expected volume.' },
    ],
    fotos: [F.tech, F.escritorio, F.hombre],
    cta: 'Set up your company API access',
  },
  {
    slug: 'bulk-document-signing-for-teams',
    titleTag: 'Bulk Document Signing for Teams',
    metaDescription: 'Generate, send and track NDAs, contracts and agreements across your whole team from one company workspace. Role-based access included.',
    h1: 'Bulk Document Signing for Teams',
    grupo: 'b2b',
    intro: 'A team sending dozens of contracts a week has a different problem than one person sending one contract a month: visibility. Who sent what, to whom, and is it still waiting on a signature? A company workspace puts every team member\'s documents in one shared view, instead of scattered across individual inboxes.',
    problema: {
      titulo: 'Individual accounts do not scale into a team process',
      texto: 'When each team member has their own separate login, tracking a document\'s status means asking the person who sent it — and if that person is out sick or has left the company, the document\'s status can become genuinely hard to find. A shared company workspace, with role-based access, solves this by making every document generated under the company account visible to the people who need to see it, not locked to one individual\'s personal account.',
    },
    puntos: [
      { titulo: 'One company workspace, multiple team members', texto: 'Everyone on the team works under the same company account, with documents and signature requests visible according to their role — owner, admin, manager or user — rather than siloed per person.' },
      { titulo: 'Domain-based team detection', texto: 'Signing up with a company email address can automatically surface the existing company workspace for that domain, so new hires join the right team instead of starting a separate, disconnected account.' },
      { titulo: 'Shared branding across every document', texto: 'Your company logo, colors and identity block apply to documents generated by anyone on the team — consistent branding without each person configuring it separately.' },
      { titulo: 'Centralized visibility into pending signatures', texto: 'See what is sent, what is signed, and what is still waiting — across the whole team\'s activity, not just your own — so nothing sits unnoticed because the one person tracking it is unavailable.' },
    ],
    ley: {
      titulo: 'Does a shared team workspace change how signatures are evidenced?',
      texto: 'No — each individual signature still carries its own independent audit trail (identity, IP address, timestamp, SHA-256 hash), attributable to the specific signer, regardless of which team member within the company account generated or sent the document. The ESIGN Act, 15 U.S.C. § 7001, and UETA in the states that have adopted it evaluate the validity of each signature on its own evidentiary record, not on the account structure that generated the document.',
    },
    caso: {
      titulo: 'A staffing agency\'s contractor paperwork, no longer scattered',
      texto: 'A staffing agency placing contractors across multiple client accounts had each recruiter sending independent-contractor agreements from their own personal accounts, with no shared view of who had signed and who had not. When a recruiter left the company mid-quarter, three pending agreements had to be tracked down manually by checking her personal email. After moving to a shared company workspace, every agreement generated by any recruiter became visible under one team view — the same situation, if it happened again, would take a search instead of a manual reconstruction.',
    },
    faq: [
      { q: 'What is the difference between company roles?', a: 'Owner has full control including billing; admin can manage team members and settings; manager can generate and send documents with some restrictions; user has standard document-generation access — the exact permissions per role are configurable from the company settings.' },
      { q: 'Can a team member see documents another team member sent?', a: 'Depending on the role structure your company sets, yes — that shared visibility is the core benefit over separate individual accounts, though granular permission controls exist for sensitive documents.' },
      { q: 'How does a new employee join the company workspace instead of creating a separate account?', a: 'Signing up with a company email address matching an existing workspace\'s domain triggers a prompt to join that workspace, rather than automatically creating a disconnected personal account.' },
      { q: 'Is there a limit to how many team members a company workspace can have?', a: 'Limits depend on the company plan tier — check the pricing page for current team-size allowances, or reach out directly if you are scaling past a standard tier.' },
    ],
    fotos: [F.oficina, F.escritorio, F.mujer],
    cta: 'Set up your company workspace',
  },
  {
    slug: 'white-label-electronic-signature',
    titleTag: 'Custom-Branded Electronic Signature for Your Business',
    metaDescription: 'Put your own logo, colors and company identity on every document and signature request. Free to start, no separate branding fee.',
    h1: 'Custom-Branded Electronic Signature',
    grupo: 'b2b',
    intro: 'A contract that arrives with a stranger\'s logo on it — the signing platform\'s branding, not yours — reads as less official to the person receiving it. Custom branding puts your own logo, colors and company details on the documents your business sends, so what your client or vendor sees is your business, not a third-party tool.',
    problema: {
      titulo: 'Branding affects how seriously a document is taken',
      texto: 'A client signing a contract wants to feel like they are dealing with your company directly, not routed through an unfamiliar third-party service they have never heard of. A document that shows your logo, your company address and your identity block reads as a natural extension of your business. One that shows only a generic signing tool\'s branding can create a moment of hesitation — is this really from the company I am working with?',
    },
    puntos: [
      { titulo: 'Your logo, sized and positioned as you choose', texto: 'Upload your logo once in your branding profile, choose its size and position, and it applies automatically to every document you generate from that point forward.' },
      { titulo: 'Your company\'s full legal and contact identity', texto: 'Legal name, address, EIN, phone, email and website appear on generated documents as your company\'s identity block, not a generic placeholder.' },
      { titulo: 'Your brand colors and font', texto: 'Primary and secondary brand colors, plus a chosen font, carry through to generated PDFs and quote documents for visual consistency with the rest of your business materials.' },
      { titulo: 'Applied automatically, not configured per document', texto: 'Set your branding profile once in settings — every document you generate afterward uses it by default, without repeating the setup for each new contract.' },
    ],
    ley: {
      titulo: 'Does custom branding affect a signature\'s legal validity?',
      texto: 'No — branding is a presentation layer, entirely separate from the underlying signature evidence. Regardless of what logo or company identity appears on the document, the signature itself remains valid under the ESIGN Act, 15 U.S.C. § 7001, backed by the same identity verification, IP logging, timestamp and SHA-256 audit trail used across the platform.',
    },
    caso: {
      titulo: 'A consultancy that looked bigger than it was',
      texto: 'A two-person consultancy sending service agreements to enterprise clients found that prospects occasionally hesitated when a generic-looking signing request landed in their inbox from an unfamiliar tool. After setting up a branding profile — logo, company colors, full legal identity block — the same agreements arrived looking like they came from a polished, established firm rather than a signing tool neither party had used before. The founder later described it as "the cheapest thing we did that actually mattered" for how prospects perceived the business before a single call had happened.',
    },
    faq: [
      { q: 'Does custom branding cost extra?', a: 'No — branding customization, including logo, colors and company identity, is available without a separate branding fee, though generation and signature volume are still subject to your plan\'s normal limits.' },
      { q: 'Can I use different branding for different clients or teams?', a: 'The branding profile applies at the account or company level by default; for a company workspace with multiple teams needing distinct branding, reach out to check current configuration options for that use case.' },
      { q: 'Will the recipient know the document was generated through Codec Document?', a: 'The document itself displays your branding as the primary identity; some platform-level elements, like the signing interface a recipient interacts with, remain part of the underlying signing experience rather than being fully removed.' },
      { q: 'Where do I set up my branding profile?', a: 'From your account settings, under the branding section — it takes a few minutes to upload a logo, set colors, and fill in your company identity block once.' },
    ],
    fotos: [F.escritorio, F.tech, F.oficina],
    cta: 'Set up your branding',
  },
  {
    slug: 'vendor-agreement-template',
    titleTag: 'Free Vendor Agreement Template',
    metaDescription: 'Define terms, pricing and responsibilities with a supplier or vendor. Free vendor agreement template, previewed and signed online.',
    h1: 'Vendor Agreement',
    grupo: 'b2b',
    intro: 'A vendor agreement sets the terms for an ongoing supplier relationship — pricing, delivery, quality standards, and what happens when something goes wrong. Many small and mid-sized businesses run vendor relationships on not much more than a purchase order and a handshake, until a dispute exposes exactly how little was actually agreed in writing.',
    problema: {
      titulo: 'A purchase order is not a vendor agreement',
      texto: 'A purchase order confirms a specific transaction — what is being bought, at what price, delivered when. It generally does not address what happens if delivery is consistently late, if quality falls short of what was expected, or if either side wants to end the relationship. A vendor agreement covers the relationship itself, with the purchase orders that follow operating under its terms — the difference matters the first time something goes wrong mid-relationship rather than on a single order.',
    },
    puntos: [
      { titulo: 'Pricing and payment terms', texto: 'Unit pricing, payment schedule, and what triggers a price change — stated clearly enough that a future price increase is not itself a point of dispute.' },
      { titulo: 'Delivery and quality standards', texto: 'What counts as on-time delivery, what quality standard applies, and the process for rejecting or returning goods or work that does not meet it.' },
      { titulo: 'Term and termination', texto: 'How long the relationship runs, how either party ends it, and what notice is required — an open-ended relationship with no exit clause can be harder to unwind than expected.' },
      { titulo: 'Liability and indemnification', texto: 'Who is responsible if the vendor\'s product or service causes a loss to your business, and to what extent — a standard clause that is easy to skip and expensive to need later.' },
    ],
    ley: {
      titulo: 'How vendor agreements are treated legally',
      texto: 'A vendor agreement for goods is generally governed by Article 2 of the Uniform Commercial Code, adopted in some form by every state, which sets default rules for delivery, acceptance and remedies that apply unless the contract states otherwise — meaning an agreement that is silent on a point does not leave a true gap, but rather defaults to the UCC\'s standard terms, which may not match what either side actually intended. Agreements for services rather than goods fall instead under general state contract law. The signature itself is valid electronically under the ESIGN Act, 15 U.S.C. § 7001, in every state.',
    },
    caso: {
      titulo: 'A supplier relationship with no written terms at all',
      texto: 'A small manufacturer had worked with the same packaging supplier for three years on nothing more formal than email confirmations of individual orders. When the supplier began missing delivery windows consistently, the manufacturer discovered there was no written standard for what counted as acceptable delay, no remedy clause, and no clear off-ramp from the relationship without risking a supply gap. A vendor agreement drafted after the fact took weeks of negotiation specifically because both sides were now negotiating from a position of frustration rather than a fresh, cooperative relationship.',
    },
    faq: [
      { q: 'Do I need a vendor agreement for a one-time purchase?', a: 'Usually a purchase order is sufficient for a single, one-off transaction. A vendor agreement earns its value for an ongoing relationship with repeat orders, where consistent terms matter more than a single transaction.' },
      { q: 'What happens if my vendor agreement is silent on a specific issue?', a: 'Default rules under the Uniform Commercial Code (for goods) or state contract law (for services) fill the gap — but those defaults may not reflect what either party actually intended, which is exactly why addressing key issues explicitly is worth the effort.' },
      { q: 'Can I use the same vendor agreement for multiple suppliers?', a: 'Yes, as a template — adjusted for each supplier\'s specific pricing, delivery terms and product or service — rather than negotiating a fully new structure with every new vendor relationship.' },
      { q: 'Should a vendor agreement include an exclusivity clause?', a: 'Only if that reflects the actual relationship — an exclusivity clause obligates you to buy only from that vendor (or them to sell only to you) and should be included deliberately, not by default in every agreement.' },
    ],
    fotos: [F.oficina, F.hombre, F.escritorio],
    cta: 'Create your vendor agreement',
  },
  {
    slug: 'subcontractor-agreement-template',
    titleTag: 'Free Subcontractor Agreement Template',
    metaDescription: 'Define scope, payment and liability with a subcontractor on a job. Free subcontractor agreement template, signed online from the field.',
    h1: 'Subcontractor Agreement',
    grupo: 'b2b',
    intro: 'A subcontractor agreement sets the terms between a general contractor and a subcontractor brought on for a specific part of a job — scope, payment, insurance requirements, and who is liable if something goes wrong on site. On a fast-moving project, this is often the document most likely to get skipped in favor of a verbal understanding.',
    problema: {
      titulo: 'Verbal agreements do not hold up when a job goes over budget',
      texto: 'A subcontractor relationship built on a phone call and a handshake works fine until a change order comes up, a payment is delayed, or an injury on site raises a liability question no one discussed in advance. Construction disputes are common precisely because scope and payment terms are frequently left informal, and by the time a disagreement surfaces, both sides may remember the original conversation differently.',
    },
    puntos: [
      { titulo: 'Scope of work tied to the specific job', texto: 'What the subcontractor is responsible for, referencing the specific project and plans — vague scope language is the single most common source of dispute on a construction job.' },
      { titulo: 'Payment schedule tied to milestones', texto: 'When payment is due — on completion, at defined milestones, or on a schedule — with a clear process for handling delayed payment from either direction.' },
      { titulo: 'Insurance and liability requirements', texto: 'What insurance coverage the subcontractor must carry and provide proof of, and how liability for damage or injury is allocated between the parties.' },
      { titulo: 'Change order process for added work', texto: 'How additional work beyond the original scope is requested, priced and approved — signed in the field before the work starts, not negotiated after it is already done.' },
    ],
    ley: {
      titulo: 'How subcontractor agreements are treated legally',
      texto: 'Subcontractor agreements are governed by general state contract law, with construction-specific statutes in most states covering mechanic\'s liens, prompt payment requirements, and licensing rules for contractors and subcontractors — these vary meaningfully by state and by the size of the job. The agreement itself is validly signed electronically under the ESIGN Act, 15 U.S.C. § 7001, which matters in practice on a job site where signing in the field, from a phone, is often more realistic than returning to an office. This is general information — confirm your state\'s specific licensing and lien-notice requirements before relying on a template alone.',
    },
    caso: {
      titulo: 'A change order that was never signed',
      texto: 'A general contractor verbally asked a subcontractor to add electrical work beyond the original scope midway through a residential project, with an informal understanding that it would be billed "at the usual rate." When the invoice arrived well above what the general contractor expected, there was no signed change order to confirm what rate had actually been agreed, or that the additional work had been authorized at all. The dispute delayed the project\'s final payment by several weeks — a one-paragraph change order, signed on a phone before the work began, would have settled the rate before either side had a reason to disagree about it.',
    },
    faq: [
      { q: 'What is the difference between a subcontractor agreement and an independent contractor agreement?', a: 'A subcontractor agreement is typically a specific application of independent contractor terms, structured for a construction or trade context — scope tied to a job site, insurance requirements, and lien-related provisions specific to construction.' },
      { q: 'Can this be signed on-site from a phone?', a: 'Yes — the signing flow works from any mobile browser, which matters specifically for construction work where returning to an office to sign is often impractical.' },
      { q: 'Does the agreement need to address mechanic\'s liens?', a: 'In most states, yes — subcontractors generally retain lien rights against the property if unpaid, and many states require specific notice language. Confirm your state\'s exact requirement, since failing to include required notice can affect lien rights.' },
      { q: 'Who is liable if the subcontractor\'s work causes damage?', a: 'This should be addressed explicitly in the agreement\'s liability and insurance clauses — without it, the allocation of responsibility depends on general state law principles that may not match what either party expected.' },
    ],
    fotos: [F.tech, F.hombre, F.oficina],
    cta: 'Create your subcontractor agreement',
  },
  {
    slug: 'consulting-agreement-template',
    titleTag: 'Free Consulting Agreement Template',
    metaDescription: 'Define scope, fees, IP ownership and confidentiality with a consultant. Free consulting agreement template, signed online.',
    h1: 'Consulting Agreement',
    grupo: 'b2b',
    intro: 'A consulting agreement covers a specific kind of working relationship — advisory or project-based work, often shorter-term than a standard service engagement, where who owns the resulting work product and what stays confidential matter as much as the fee itself.',
    problema: {
      titulo: 'Consulting work creates intellectual property questions a standard contract skips',
      texto: 'When a consultant produces a strategy document, a piece of code, a design, or an analysis, the default legal assumption in many situations is that the consultant — not the client who paid for it — owns the resulting work product, unless the contract assigns it otherwise. Clients are frequently surprised by this after the engagement, having assumed payment automatically transferred ownership. A consulting agreement that addresses IP assignment explicitly removes that surprise before it happens.',
    },
    puntos: [
      { titulo: 'Scope defined as deliverables, not just hours', texto: 'What the consultant will actually produce or accomplish, not only a time commitment — clearer for both sides to evaluate whether the engagement delivered what was expected.' },
      { titulo: 'Intellectual property ownership stated explicitly', texto: 'Whether work product transfers to the client on payment, remains with the consultant under license, or splits by category — addressed directly rather than left to default rules neither party may expect.' },
      { titulo: 'Confidentiality covering both directions', texto: 'The consultant typically sees sensitive client information; the client may also see the consultant\'s own methodology or tools. A mutual confidentiality clause protects both.' },
      { titulo: 'Independent contractor status confirmed', texto: 'A clause affirming the consultant is not an employee — relevant for tax treatment and for avoiding a misclassification issue if the relationship is examined later.' },
    ],
    ley: {
      titulo: 'IP ownership and worker classification',
      texto: 'Absent a written assignment, U.S. copyright law generally vests ownership of a created work in its author — the consultant — rather than the paying client, with a narrow "work made for hire" exception that mostly applies to employees, not independent consultants, unless a specific written agreement designates certain categories of work as work for hire. Separately, most states apply some version of an "ABC test" or a multi-factor test to determine whether a consultant is properly classified as an independent contractor rather than a misclassified employee — control over the work, integration into the business, and whether the consultant serves other clients are common factors. The agreement itself is validly signed electronically under the ESIGN Act, 15 U.S.C. § 7001.',
    },
    caso: {
      titulo: 'A rebrand the client thought they owned outright',
      texto: 'A company hired an independent branding consultant to develop a new visual identity, paid the agreed fee, and began using the resulting logo and brand guidelines across their business. Eighteen months later, expanding into a new market, they discovered the original consulting agreement had never addressed IP ownership — meaning the consultant, under default copyright rules, arguably still held rights to the work. A renegotiation, from a position of the client having already built significant business around the brand, cost considerably more than addressing ownership in the original one-page agreement would have.',
    },
    faq: [
      { q: 'Who owns the work product from a consulting engagement by default?', a: 'Absent an explicit written assignment, the consultant generally retains copyright ownership under U.S. law, even though the client paid for the work — this is a common and costly misunderstanding that a clear IP clause resolves upfront.' },
      { q: 'Is a consultant the same as an independent contractor for tax purposes?', a: 'Generally yes — a consultant is typically engaged as an independent contractor rather than an employee, which affects tax withholding, benefits eligibility, and how the relationship is classified under state labor law.' },
      { q: 'Should a consulting agreement include a non-compete clause?', a: 'It depends on the engagement — some include a limited non-solicitation clause instead, since broad non-compete clauses face increasing restrictions in several states and are not always enforceable even where permitted.' },
      { q: 'How is a consulting agreement different from a service agreement?', a: 'They overlap significantly; "consulting" typically implies advisory, strategic or project-based work, often with more emphasis on IP ownership and confidentiality, while "service agreement" is a broader term covering many kinds of engagements.' },
    ],
    fotos: [F.hombre, F.tech, F.revisar],
    cta: 'Create your consulting agreement',
  },
  {
    slug: 'employee-confidentiality-agreement',
    titleTag: 'Free Employee Confidentiality Agreement Template',
    metaDescription: 'Protect trade secrets and client information with a signed employee confidentiality agreement (NDA). Free template, signed online.',
    h1: 'Employee Confidentiality Agreement',
    grupo: 'b2b',
    intro: 'An employee confidentiality agreement — a form of NDA specific to the employment relationship — protects trade secrets, client lists, pricing and internal processes an employee will necessarily be exposed to on the job. It is one of the most commonly signed documents in a new-hire packet, and one of the least often actually enforced when it matters, usually because it was never signed at all.',
    problema: {
      titulo: 'The agreement people mean to send on day one, and forget',
      texto: 'A verbal understanding that "of course you won\'t share client information" is not a confidentiality agreement, and it provides essentially no legal footing if a former employee does exactly that at a competitor. Companies that intend to have every employee sign a confidentiality agreement, but do not build it into a consistent onboarding step, routinely discover the gap only when they need the document and realize it was never actually executed.',
    },
    puntos: [
      { titulo: 'Confidential information defined specifically to the business', texto: 'Client lists, pricing structures, product roadmaps, internal processes — named specifically enough that an employee cannot later argue they did not know something counted as confidential.' },
      { titulo: 'Survives the employment relationship', texto: 'The obligation not to disclose confidential information continues after the employee leaves — stated with an explicit duration, since silence on this point can be read as the obligation ending with employment.' },
      { titulo: 'Carve-outs for legally protected disclosures', texto: 'Whistleblower protections and legally required disclosures are excluded from the confidentiality restriction, which keeps the agreement enforceable and avoids overreaching into legally protected conduct.' },
      { titulo: 'Return of materials on departure', texto: 'A clause requiring return or destruction of confidential materials when employment ends — closing the most common practical gap, where information simply stays on a departing employee\'s personal devices.' },
    ],
    ley: {
      titulo: 'How employee confidentiality agreements are enforced',
      texto: 'Confidentiality agreements are generally enforceable as ordinary contracts under state law, and trade secret protection specifically is reinforced federally by the Defend Trade Secrets Act (18 U.S.C. § 1836) and, in the states that have adopted it, the Uniform Trade Secrets Act — both of which independently protect genuine trade secrets even without a signed agreement, though a signed confidentiality agreement makes a claim considerably easier to prove. Unlike non-compete clauses, which face growing restrictions or outright bans in several states, confidentiality agreements protecting genuinely confidential information are broadly enforceable nationwide. The signature is valid electronically under the ESIGN Act, 15 U.S.C. § 7001 — signed as part of an onboarding flow the same as any other new-hire document.',
    },
    caso: {
      titulo: 'A departing employee and a client list that mattered',
      texto: 'A sales-driven company discovered, after a senior salesperson left to join a direct competitor, that the salesperson had taken a full export of the client contact list and pricing history on their way out. When the company sought to enforce a confidentiality obligation, they discovered the employee — hired quickly during a growth period — had never actually signed the confidentiality agreement that was supposed to be part of standard onboarding; it had been included in the offer packet but the signature step had been skipped. The company\'s legal options were considerably weaker without a signed document to point to, despite having every intention of requiring one.',
    },
    faq: [
      { q: 'Is an employee confidentiality agreement the same as a non-compete?', a: 'No — a confidentiality agreement restricts sharing specific protected information; a non-compete restricts working for a competitor entirely. They are often signed together but serve different purposes and are treated very differently under state law.' },
      { q: 'Can I require existing employees to sign this, not just new hires?', a: 'Yes, though in some states additional consideration — something of value beyond continued employment — may be required to make it enforceable against an existing employee, which varies by state.' },
      { q: 'Does this protect trade secrets even without a signed agreement?', a: 'Federal and state trade secret law provides some independent protection, but a signed agreement makes the scope of what was considered confidential explicit and considerably easier to enforce in practice.' },
      { q: 'How long should the confidentiality obligation last after employment ends?', a: 'This varies by what is being protected — some agreements state an indefinite duration for genuine trade secrets, others specify a set number of years for broader business information. The right answer depends on the specific information involved.' },
    ],
    fotos: [F.mujer, F.oficina, F.escritorio],
    cta: 'Create your confidentiality agreement',
  },
  {
    slug: 'pandadoc-alternative',
    titleTag: 'PandaDoc Alternative — Free to Start',
    metaDescription: 'A PandaDoc alternative with a free intelligent template editor and ESIGN Act compliant e-signature. No credit card required.',
    h1: 'PandaDoc Alternative',
    grupo: 'b2b',
    intro: 'PandaDoc and similar contract-management platforms are built primarily around proposals and sales documents, priced for teams that need that specific workflow. If what you actually need is a straightforward way to generate and sign standard legal documents — NDAs, contracts, agreements — without a proposal-focused price tag, a more direct tool is often a better fit.',
    problema: {
      titulo: 'Paying for proposal features you will never use',
      texto: 'Contract management platforms built around sales proposals bundle in features — quote builders, CPQ integrations, sales-pipeline tracking — that a business generating standard legal documents has no use for, while still paying a price built around that full feature set. If your actual need is document generation plus e-signature, the proposal-and-sales layer is overhead, not value.',
    },
    puntos: [
      { titulo: 'A free tier that actually generates documents', texto: 'Free legal documents and free e-signatures on a recurring cycle, with no credit card required to start — not just a trial that expires, but a genuine ongoing free tier.' },
      { titulo: 'An intelligent template editor, not a blank canvas', texto: 'Structured templates for NDAs, service agreements, contractor agreements and more, built with the right clauses already in place — rather than a generic document builder you have to fill in from scratch.' },
      { titulo: 'ESIGN Act and UETA compliant signatures', texto: 'Every signature carries identity verification, IP logging, timestamp and a SHA-256 audit trail — the same legal-compliance standard a proposal platform offers, without the proposal-focused pricing.' },
      { titulo: 'Custom branding included, not an add-on tier', texto: 'Your logo, company identity and brand colors on generated documents, available without a separate premium branding fee.' },
    ],
    ley: {
      titulo: 'Legal validity does not depend on which platform you use',
      texto: 'The ESIGN Act, 15 U.S.C. § 7001, and state UETA adoption govern the legal validity of an electronic signature regardless of the specific software used to capture it — what matters is that the signature is attributable to the signer and the record is retained with integrity. A signature captured through a lighter-weight, document-focused tool is exactly as legally binding as one captured through a larger contract-management platform, provided the underlying evidence — identity, consent, audit trail — is comparably solid.',
    },
    caso: {
      titulo: 'A freelance consultant paying for a sales team she didn\'t have',
      texto: 'An independent consultant had signed up for a contract-management platform primarily to get NDAs and service agreements signed with new clients, but found herself paying for a tier that included proposal templates, a sales pipeline view, and CPQ features she never opened. Switching to a tool built specifically around document generation and signing cut her monthly cost meaningfully while covering exactly what she actually used — the NDA and service-agreement templates, with her own branding, signed the same way as before.',
    },
    faq: [
      { q: 'Is a free e-signature tool as legally valid as a paid one?', a: 'Yes — legal validity under the ESIGN Act depends on the signature\'s evidentiary record, not the price of the software that captured it.' },
      { q: 'Can I switch from PandaDoc without losing my existing signed documents?', a: 'Documents already signed on another platform remain valid and stored wherever they currently live; switching tools affects new documents going forward, not the legal status of ones already completed.' },
      { q: 'Does this include proposal or quote-building features?', a: 'The platform includes a Smart Quotes module for cotizaciones and business proposals as a separate feature, alongside the core legal document generator — worth checking if that specific need applies to you.' },
      { q: 'What document types are available in the free tier?', a: 'NDA, service agreement, independent contractor agreement, residential lease, promissory note, vehicle bill of sale and several more, all with the free intelligent template editor and free signature allowance.' },
    ],
    fotos: [F.tech, F.mujer, F.oficina],
    cta: 'Start free — no credit card required',
  },

  // ═══════════════ GRATIS / HUB ═══════════════
  // Cierre del bloque: intencion "free" de alto valor comercial para los
  // tipos de documento ya existentes (sin state-page equivalente generico),
  // mas una pagina hub real que enlaza las paginas de vehicle-bill-of-sale
  // por estado ya construidas, y la explicacion generica de "sign a PDF".
  {
    slug: 'free-nda-generator',
    titleTag: 'Free NDA Generator — No Credit Card Required',
    metaDescription: 'Generate a free NDA online: mutual or one-way, previewed instantly and signed with a legally binding electronic signature.',
    h1: 'Free NDA Generator',
    grupo: 'free',
    intro: 'A free NDA generator lets you create a proper non-disclosure agreement — mutual or one-way — without paying for a document you might only need once. Fill in the parties and terms, preview exactly how it will look, and sign it online, all before deciding whether to pay for anything.',
    problema: {
      titulo: 'Most "free" NDA templates are a static download, not a real tool',
      texto: 'A search for a free NDA template commonly turns up a Word document with bracketed placeholders and no guidance on what to actually put in them — mutual or one-way, what counts as confidential, how long the obligation lasts. A generator that walks through those decisions, then shows the finished result before anything is paid for, closes the gap between "free template" and "a document you can actually trust and send."',
    },
    puntos: [
      { titulo: 'Mutual or one-way, chosen up front', texto: 'A one-way NDA protects only the party disclosing information; a mutual NDA protects both — the generator asks which applies to your situation rather than assuming.' },
      { titulo: 'Confidential information defined, not left generic', texto: 'What counts as confidential for your specific situation, rather than a boilerplate definition that may not cover what you actually need protected.' },
      { titulo: 'A stated duration for the obligation', texto: 'How long the confidentiality obligation lasts after signing or after the relationship ends — an NDA silent on duration can be read as perpetual, which is not always what either party intends.' },
      { titulo: 'Free e-signature included', texto: 'Once the NDA is generated, it can be signed online immediately as part of the same free tier, with identity verification and an audit trail — not a separate paid step.' },
    ],
    ley: {
      titulo: 'What makes a free NDA legally enforceable',
      texto: 'An NDA\'s enforceability comes from its terms and proper execution, not its price — a free, self-generated NDA that clearly defines confidential information, states a reasonable scope and duration, and is properly signed is enforceable the same as an expensive attorney-drafted one. Most states have adopted a version of the Uniform Trade Secrets Act, which independently protects genuine trade secrets, but a signed NDA covers a broader category of information than trade secret law alone and makes a breach considerably easier to prove. Signed electronically, it is valid under the ESIGN Act, 15 U.S.C. § 7001.',
    },
    caso: {
      titulo: 'A founder who nearly skipped it entirely',
      texto: 'A first-time founder meeting with a potential contractor to discuss a product idea almost skipped an NDA entirely, assuming a "quick free template" search would take longer than the meeting was worth. Using a free NDA generator instead, the mutual NDA was filled in, previewed and both parties signed it from their phones in about six minutes before the call started. The contractor later mentioned, unprompted, that having a properly signed document made her take the conversation more seriously — a side benefit the founder had not anticipated.',
    },
    faq: [
      { q: 'Is a free NDA as legally binding as a paid one?', a: 'Yes — enforceability depends on the terms and proper signing, not the price paid for the document. A well-drafted free NDA, properly signed, is fully enforceable.' },
      { q: 'What is the difference between a mutual and one-way NDA?', a: 'A one-way NDA protects information disclosed by only one party — common when a company shares information with a vendor or candidate. A mutual NDA protects both parties\' disclosures, common in partnership or investment discussions where both sides share sensitive information.' },
      { q: 'How many free NDAs can I generate?', a: 'The free tier covers a recurring allowance of free documents and signatures, resetting periodically — enough for most individuals and small teams generating occasional NDAs, without a credit card required to start.' },
      { q: 'Can I edit the NDA after generating it?', a: 'Yes — you can adjust the terms before sending it for signature, and generate a new version any time your needs change rather than being locked into the first draft.' },
    ],
    fotos: [F.tech, F.hombre, F.mujer],
    cta: 'Generate your free NDA',
  },
  {
    slug: 'free-independent-contractor-agreement',
    titleTag: 'Free Independent Contractor Agreement Generator',
    metaDescription: 'Generate a free independent contractor agreement: scope, payment and IP terms, previewed instantly and signed online.',
    h1: 'Free Independent Contractor Agreement',
    grupo: 'free',
    intro: 'A free independent contractor agreement generator covers what most freelance and contractor relationships actually need — scope, payment terms, IP ownership and classification language — without a fee for a document that, for many independent workers, is signed only a handful of times a year.',
    problema: {
      titulo: 'The document that protects both sides of a small engagement',
      texto: 'Independent contractor relationships are often the least formally documented — a short email exchange, a verbal rate agreement, work that starts before terms are settled. That works fine until scope disagreements, late payment, or a dispute over who owns the finished work product turns an informal understanding into a real problem neither side has documentation to resolve cleanly.',
    },
    puntos: [
      { titulo: 'Scope and deliverables stated clearly', texto: 'What the contractor will deliver, by when, generated from a guided form rather than a blank text box — reducing the chance an important term gets left out simply because no one thought to add it.' },
      { titulo: 'Payment terms and schedule', texto: 'Rate, payment schedule, and what happens if payment is late — set once in the generator, applied consistently across the agreement.' },
      { titulo: 'Independent contractor status confirmed', texto: 'Language affirming the relationship is not employment — relevant to tax treatment and to the classification tests states apply when the distinction is examined.' },
      { titulo: 'IP ownership addressed', texto: 'Whether work product transfers to the hiring party or remains with the contractor — a term easy to overlook and expensive to dispute after the fact.' },
    ],
    ley: {
      titulo: 'Contractor status and IP defaults',
      texto: 'Most states apply some version of an "ABC test" or a multi-factor common-law test to determine whether a worker is properly classified as an independent contractor rather than an employee — factors generally include the degree of control over the work, whether the work is integral to the hiring party\'s business, and whether the worker serves multiple clients. Misclassification carries real tax and labor-law exposure for the hiring business. Separately, absent a written assignment, U.S. copyright law generally leaves ownership of created work with the contractor, not the paying client, unless the agreement states otherwise. The agreement is validly signed electronically under the ESIGN Act, 15 U.S.C. § 7001.',
    },
    caso: {
      titulo: 'A logo the client thought they had bought outright',
      texto: 'A small business hired a freelance designer for a new logo, paid the agreed flat fee over email with no written agreement, and began using the finished logo on their website and packaging. A year later, wanting to trademark the logo, they discovered — through their trademark attorney — that without a written IP assignment, the designer arguably still held copyright to the artwork despite having been paid for it. A short, free contractor agreement with an explicit IP assignment clause, signed before the first design draft, would have avoided the entire question.',
    },
    faq: [
      { q: 'Is a free contractor agreement enough, or do I need a lawyer?', a: 'For most standard engagements — clear scope, standard payment terms, no unusual liability exposure — a well-drafted free agreement is sufficient. Complex, high-value, or unusually risky engagements are where legal review adds real value.' },
      { q: 'Does this agreement protect against misclassification risk?', a: 'It includes language affirming contractor status, but classification is ultimately determined by the actual working relationship — control, integration, exclusivity — not by the document\'s wording alone. The agreement helps, but is not a guarantee against a misclassification finding if the actual working relationship looks like employment.' },
      { q: 'Can I use this for a long-term ongoing engagement, not just a single project?', a: 'Yes — the agreement can be structured for an ongoing relationship with a defined term and renewal terms, rather than only a single, one-off project.' },
      { q: 'Is there a limit to how many free agreements I can generate?', a: 'The free tier includes a recurring document and signature allowance that resets periodically, without requiring a credit card to start.' },
    ],
    fotos: [F.hombre, F.escritorio, F.tech],
    cta: 'Generate your free contractor agreement',
  },
  {
    slug: 'free-promissory-note-template',
    titleTag: 'Free Promissory Note Template',
    metaDescription: 'Generate a free promissory note for a personal or business loan: principal, interest and repayment terms, signed online.',
    h1: 'Free Promissory Note',
    grupo: 'free',
    intro: 'A free promissory note generator turns an informal loan between family, friends or a small business into a proper written record — principal, interest rate, repayment schedule and what happens on default — without a fee for a document many people only ever need once.',
    problema: {
      titulo: 'Loans between people who trust each other are exactly where documentation gets skipped',
      texto: 'A loan between family members or close friends is often the least documented kind of debt, precisely because both sides trust each other and a written note can feel awkward to bring up. That same trust is also what makes it hardest to enforce, or even to remember accurately, if the relationship changes or memories of the original terms start to diverge months or years later.',
    },
    puntos: [
      { titulo: 'Principal amount and interest rate stated clearly', texto: 'The exact amount loaned and, if applicable, the interest rate — with a check against your state\'s usury cap, since some states limit the maximum interest rate that can be charged, especially between individuals.' },
      { titulo: 'A repayment schedule that is actually specific', texto: 'Lump sum on a set date, or installments on a defined schedule — vague language like "when you can" is the single most common source of dispute in an informal loan.' },
      { titulo: 'What happens on default', texto: 'Late fees, acceleration of the full balance, or other consequences if a payment is missed — addressed before it happens rather than negotiated in the moment it does.' },
      { titulo: 'Free e-signature included', texto: 'Both lender and borrower can sign online once the note is generated, creating a dated, verifiable record without a separate paid step.' },
    ],
    ley: {
      titulo: 'What makes a promissory note enforceable',
      texto: 'A promissory note is a negotiable instrument generally governed by Article 3 of the Uniform Commercial Code, adopted by every state, which sets rules for enforceability, transfer and default. Most states cap the maximum interest rate that can legally be charged — usury laws — and a rate above that cap can render the interest provision unenforceable or, in some states, void the entire note; the specific cap varies significantly by state. The note is validly signed electronically under the ESIGN Act, 15 U.S.C. § 7001, the same as any other contract.',
    },
    caso: {
      titulo: 'A family loan, remembered two different ways',
      texto: 'A brother loaned his sister a sum of money to cover a short-term gap, on a verbal agreement to pay it back "within a year or so." Fourteen months later, when he asked about repayment, she remembered the original terms as more flexible than he did, and neither had a written record to settle the disagreement. It strained the relationship for months before an informal repayment plan was worked out. A one-page promissory note, signed at the time the money changed hands, would have made the terms a matter of record rather than memory.',
    },
    faq: [
      { q: 'Do I need a promissory note for a loan between family members?', a: 'It is not legally required, but strongly recommended — informal loans between people who trust each other are exactly where disputes over terms are most common, precisely because nothing was written down at the time.' },
      { q: 'Is there a maximum interest rate I can charge?', a: 'Yes — every state has a usury cap limiting the maximum enforceable interest rate, and it varies significantly by state and by the type of lender. Check your state\'s specific limit before setting a rate above what feels like a standard bank rate.' },
      { q: 'What happens if the borrower stops paying?', a: 'The note\'s default clause determines the immediate consequence — typically late fees or acceleration of the full remaining balance — and the lender may pursue collection through small claims court for smaller amounts, or a standard civil suit for larger ones.' },
      { q: 'Can a promissory note be used for a business loan, not just personal?', a: 'Yes — the same structure applies, adjusted for a business borrower and, if relevant, a personal guarantee from a business owner backing the loan.' },
    ],
    fotos: [F.escritorio, F.mujer, F.revisar],
    cta: 'Generate your free promissory note',
  },
  {
    slug: 'vehicle-bill-of-sale-requirements-by-state',
    titleTag: 'Vehicle Bill of Sale Requirements by State',
    metaDescription: 'What every state actually requires on a vehicle bill of sale, plus a free template for your state, signed online.',
    h1: 'Vehicle Bill of Sale Requirements by State',
    grupo: 'free',
    intro: 'A vehicle bill of sale is required or strongly recommended in nearly every U.S. state to complete a title transfer, but the exact requirements — notarization, odometer disclosure, specific state-issued forms — vary enough that a generic template downloaded from the wrong source can get rejected at the DMV.',
    problema: {
      titulo: 'The document that looks the same everywhere but isn\'t',
      texto: 'A vehicle bill of sale looks like a simple document — buyer, seller, vehicle, price, signatures — and in most respects it is. The variation that trips people up is procedural: some states require notarization for it to be accepted, some require a state-specific form rather than a generic one, and federal law requires odometer disclosure as part of the same transaction for most vehicles under a certain age, regardless of state.',
    },
    puntos: [
      { titulo: 'Vehicle and party identification, complete', texto: 'VIN, year, make, model, and full legal names and addresses for both buyer and seller — a DMV will reject a bill of sale with an incomplete or mismatched VIN.' },
      { titulo: 'Sale price and date, stated clearly', texto: 'Needed both for the transfer itself and, in most states, for calculating sales tax due at registration.' },
      { titulo: 'Odometer disclosure, where federally required', texto: 'Federal law requires odometer disclosure for most vehicles under 20 model years old at the time of sale, either on the title itself or a separate form — check whether your state handles this on the title or requires it within the bill of sale.' },
      { titulo: '"As-is" or warranty language, stated explicitly', texto: 'Whether the vehicle is sold as-is with no warranty, or with specific representations about its condition — silence on this point can leave the seller more exposed than intended.' },
    ],
    ley: {
      titulo: 'Where requirements actually diverge by state',
      texto: 'Most states accept a generic bill of sale for a private vehicle sale, but a meaningful number — including states like Louisiana and a handful of others — require notarization specifically for a vehicle bill of sale to be valid for title transfer purposes. Separately, the federal Truth in Mileage Act requires odometer disclosure for most vehicle sales, enforced through each state\'s own DMV process. Some states provide their own official bill-of-sale form that the DMV expects, rather than accepting any generic version. This is general information — confirm your specific state\'s current DMV requirement before relying on any template, since an incorrectly executed bill of sale can delay or block a title transfer.',
    },
    caso: {
      titulo: 'A private sale rejected at the counter',
      texto: 'A buyer completed a private vehicle purchase using a generic bill of sale template found through a general search, then went to the DMV to register the vehicle. The clerk rejected the document because the state required notarization for vehicle bills of sale specifically, a requirement the generic template had not addressed at all. The buyer had to track down the seller again, days later, to get the document properly notarized before the registration could proceed — a delay that a state-aware template would have avoided from the start.',
    },
    faq: [
      { q: 'Does every state require a notarized bill of sale?', a: 'No — most states accept an unnotarized bill of sale for a private vehicle sale, but a specific set of states require notarization. Confirm your state\'s current requirement before relying on a generic template.' },
      { q: 'Is a bill of sale the same as a title transfer?', a: 'No — the bill of sale documents the sale transaction itself; the title transfer is the separate DMV process of officially changing registered ownership, which typically requires the bill of sale as supporting documentation.' },
      { q: 'Do I need odometer disclosure for an older vehicle?', a: 'Federal odometer disclosure requirements generally apply to vehicles under 20 model years old — older vehicles are typically exempt, though your state\'s specific DMV process may still ask for a mileage statement.' },
      { q: 'Where can I find the state-specific version of this document?', a: 'The platform maintains dedicated vehicle bill of sale pages for individual states with their specific requirements built in — search for your state directly, or start with the general template and confirm your state\'s notarization rule before finalizing.' },
    ],
    fotos: [F.tech, F.oficina, F.hombre],
    cta: 'Create your vehicle bill of sale',
  },
  {
    slug: 'how-to-sign-a-pdf-online-free',
    titleTag: 'How to Sign a PDF Online for Free',
    metaDescription: 'Upload any PDF, add your signature, and download it signed — free, with a verifiable audit trail. No account required to try it.',
    h1: 'How to Sign a PDF Online for Free',
    grupo: 'free',
    intro: 'Signing a PDF online does not require printing, signing by hand, and scanning it back in — a habit that persists mostly out of familiarity rather than necessity. Uploading the file, adding a typed or drawn signature, and downloading the signed version takes a few minutes from any device, with no software to install.',
    problema: {
      titulo: 'The print-sign-scan cycle survives on habit, not requirement',
      texto: 'For most documents that need a signature — a form, a simple agreement, an acknowledgment — printing, signing by hand and scanning back in adds friction with no legal benefit over signing electronically. The ESIGN Act settled this legal question in 2000; the habit of printing anyway has simply outlasted the reason for it in a lot of everyday cases.',
    },
    puntos: [
      { titulo: 'Upload any PDF you already have', texto: 'A form, a contract someone else sent you, a document you scanned — the tool works with whatever PDF you already have, not only documents generated on the platform itself.' },
      { titulo: 'Type, draw, or upload a signature image', texto: 'Choose whichever signing method feels right — a typed name in a signature font, a hand-drawn signature with a mouse or touchscreen, or an uploaded image of your actual signature.' },
      { titulo: 'Place the signature exactly where it needs to go', texto: 'Drag the signature field to the exact spot on the page, so the signed document looks correctly placed rather than stamped in a generic default location.' },
      { titulo: 'Download the signed PDF immediately', texto: 'Once signed, the document is available to download right away, with the signing evidence — timestamp, IP address — embedded as part of the record.' },
    ],
    ley: {
      titulo: 'Is a free online signature legally valid?',
      texto: 'Yes — the Electronic Signatures in Global and National Commerce Act, 15 U.S.C. § 7001, states that a signature, contract or record may not be denied legal effect solely because it is in electronic form, and every state except New York has adopted the Uniform Electronic Transactions Act to the same effect (New York uses its own Electronic Signatures and Records Act, State Technology Law § 304). This applies regardless of whether the signature was free or paid for — validity depends on the signer\'s intent and the record\'s integrity, not the price of the tool used.',
    },
    caso: {
      titulo: 'A rental application signed from a coffee shop',
      texto: 'A prospective tenant received a rental application PDF by email while away from home with no printer access, and the property manager needed it back the same day to keep the applicant\'s spot in the leasing queue. Instead of waiting until she got home to print, sign and scan it, she uploaded the PDF from her phone at a coffee shop, signed it in under two minutes, and emailed it back before finishing her coffee. The property manager, who received signed applications this way regularly, had no issue accepting it.',
    },
    faq: [
      { q: 'Do I need to create an account to sign a PDF?', a: 'A basic signing flow can often be completed with minimal setup; creating a free account lets you save documents, track signature status, and access your signing history later.' },
      { q: 'Is a typed signature as valid as a hand-drawn one?', a: 'Yes — under the ESIGN Act, what matters is the signer\'s intent to sign and the retained evidence of that intent, not the specific visual style of the signature mark itself.' },
      { q: 'Can I sign a document someone else sent me, not just ones I created here?', a: 'Yes — upload any PDF you have received, whether it originated from this platform or somewhere else entirely, and sign it the same way.' },
      { q: 'Is there a limit on free signatures?', a: 'The free tier includes a recurring signature allowance that resets periodically, without requiring a credit card to start.' },
    ],
    fotos: [F.tech, F.mujer, F.hombre],
    cta: 'Sign a PDF free',
  },
];

/** Índice por slug, para resolver la página desde la ruta. */
export const PAGINA_US_POR_SLUG = new Map(PAGINAS_US.map((p) => [p.slug, p]));

/** Hermanas del mismo grupo, para el enlazado interno.
 *
 *  El grupo importa: enlazar una página de prenupciales con una de bancos no
 *  ayuda a nadie y le dice a Google que el sitio no tiene estructura. */
export function hermanasDe(slug: string, maximo = 3): PaginaUS[] {
  const actual = PAGINA_US_POR_SLUG.get(slug);
  if (!actual) return [];
  const mismas = PAGINAS_US.filter((p) => p.grupo === actual.grupo && p.slug !== slug);
  const otras = PAGINAS_US.filter((p) => p.grupo !== actual.grupo && p.slug !== slug);
  return [...mismas, ...otras].slice(0, maximo);
}
