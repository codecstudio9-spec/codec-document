import { Upload, FileText } from 'lucide-react';

interface PdfUploaderProps {
  fileName: string;
  loading: boolean;
  error: string;
  onFileSelect: (file?: File | null) => void;
}

export function PdfUploader({ fileName, loading, error, onFileSelect }: PdfUploaderProps) {
  return (
    <section className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paso 1</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Sube tu documento para firmar</h2>
      </div>

      <label className="group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/40 px-6 py-10 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50">
        <input
          type="file"
          accept="application/pdf"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => onFileSelect(e.target.files?.[0])}
        />
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm transition-transform duration-300 group-hover:scale-105">
          {fileName ? <FileText className="size-10 text-blue-600" /> : <Upload className="size-10 text-slate-500" />}
        </div>
        <p className="text-lg font-semibold text-slate-900">Arrastra tu documento PDF aquí</p>
        <p className="mt-2 text-sm text-slate-600">o usa el selector para continuar</p>
        <span className="mt-6 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
          Seleccionar archivo
        </span>
      </label>

      {loading && <p className="mt-4 text-sm font-medium text-blue-700">Cargando y preparando vista previa…</p>}
      {!!fileName && !loading && <p className="mt-4 text-sm text-slate-700">Documento cargado: <b>{fileName}</b></p>}
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
    </section>
  );
}

