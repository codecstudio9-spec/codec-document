export interface Signer {
  id: string;
  title: string;
  name: string;
  email: string;
  color: string;
  chipLabel: string;
  signatureMode?: 'typed' | 'upload' | 'draw';
  signatureText?: string;
  fontFamily?: string;
  logoDataUrl?: string;
  signatureImageDataUrl?: string;
  signatureUrl?: string;
  dbSignerId?: string;
}

export interface SignaturePlacement {
  id: string;
  signerId: string;
  signerName: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  signatureUrl?: string;
}

export interface DocumentSession {
  documentId: string;
  originalPdfUrl: string;
  originalFileHash: string;
  creatorSignatureUrl: string;
}

/** A signature element placed (and potentially moved/resized) by the creator */
export interface PlacedSignature {
  id: string;
  signerId: string;       // 'creator' | 'guest' (matches EditorSigner.id)
  signerName: string;
  signerRole: string;
  color: string;
  imageDataUrl: string;   // local data URL — used for both display and pdf-lib embed
  storageUrl: string;     // Supabase Storage URL for reference
  page: number;           // 1-indexed PDF page
  xFraction: number;      // centre X as fraction of page width  (0–1)
  yFraction: number;      // centre Y as fraction of page height (0–1)
  widthFraction: number;  // signature width  as fraction of page width
  heightFraction: number; // signature height as fraction of page height
  labelText: string;      // optional overlay text (name, date, role…)
  showLabel: boolean;
}
