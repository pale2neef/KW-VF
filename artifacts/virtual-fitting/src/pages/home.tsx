import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "@/components/ui/file-upload-zone";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { useGetTryOn, getGetTryOnQueryKey } from "@workspace/api-client-react";
import { AlertCircle, CheckCircle2, Sparkles, RefreshCcw, Truck, BookImage, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [clothingFiles, setClothingFiles] = useState<File[]>([]);
  const [personPhotoFile, setPersonPhotoFile] = useState<File[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Poll for job status — stop polling once terminal state is reached
  const { data: job, isError } = useGetTryOn(jobId ?? "", {
    query: {
      enabled: !!jobId,
      queryKey: getGetTryOnQueryKey(jobId ?? ""),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "completed" || status === "failed" ? false : 3000;
      },
    }
  });

  const jobStatus = job?.status;
  const isProcessing = jobStatus === "pending" || jobStatus === "processing" || isSubmitting;

  // Progress animation while processing
  useEffect(() => {
    if (isProcessing && uploadProgress < 90) {
      const timer = setTimeout(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 5, 90));
      }, 500);
      return () => clearTimeout(timer);
    }
    if (jobStatus === "completed") {
      setUploadProgress(100);
    }
  }, [isProcessing, uploadProgress, jobStatus]);

  const handleTryOn = async () => {
    if (clothingFiles.length === 0 || personPhotoFile.length === 0) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    setJobId(null);

    try {
      const formData = new FormData();
      formData.append("personPhoto", personPhotoFile[0]);
      clothingFiles.forEach(f => formData.append("clothingImages", f));

      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      setUploadProgress(15);

      const res = await fetch(`${BASE}/api/try-on`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Kon paskamer niet starten");

      const newJob = await res.json();
      setJobId(newJob.id);
      setUploadProgress(40);
    } catch (error) {
      console.error("Upload fout:", error);
      toast({
        title: "Verzending mislukt",
        description: "Uw paskamersessie kon niet worden gestart. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setClothingFiles([]);
    setPersonPhotoFile([]);
    setJobId(null);
    setUploadProgress(0);
  };

  const isReadyToSubmit = clothingFiles.length > 0 && personPhotoFile.length > 0 && !isProcessing;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col" style={{ background: "#fff", fontFamily: "'Open Sans', sans-serif", color: "#333" }}>

      {/* Top bar */}
      <div style={{ background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <div className="max-w-6xl mx-auto px-6 py-1 flex gap-4 text-xs" style={{ color: "#666" }}>
          <span>Levering</span>
          <span style={{ color: "#ccc" }}>|</span>
          <span>Privacybeleid</span>
        </div>
      </div>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "2px solid #e8e8e8" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-0 shrink-0">
            <div style={{
              border: "2px solid #3d7dc8",
              borderRadius: "4px",
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{ fontWeight: 700, fontSize: "15px", color: "#3d7dc8", letterSpacing: "0.5px" }}>Atelier</span>
              <span style={{ color: "#ccc", fontSize: "18px", fontWeight: 300 }}>/</span>
              <span style={{ fontWeight: 700, fontSize: "15px", color: "#3d7dc8", letterSpacing: "0.5px" }}>Paskamer</span>
            </div>
          </div>

          {/* Feature columns */}
          <div className="hidden md:flex gap-10 flex-1 justify-center">
            {[
              { icon: <BookImage size={32} />, title: "Logo's", desc: "Heeft u een logo dat u wilt laten bedrukken? Neem contact met ons op om de mogelijkheden te bespreken." },
              { icon: <Truck size={32} />, title: "Retourneren", desc: "Wilt u iets retour sturen? Download hier het retourformulier en stuur het volledig ingevuld mee." },
              { icon: <List size={32} />, title: "Mega Collectie", desc: "Wij voeren tienduizenden artikelen van circa 40 preferred suppliers. Staat iets er niet bij? Neem contact op!" },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center text-center max-w-[180px] gap-2">
                <div style={{ color: "#3d7dc8" }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#3d7dc8" }}>{item.title}</div>
                <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* Page heading */}
        <section className="text-center">
          <h1 style={{ fontWeight: 700, fontSize: "clamp(22px, 4vw, 32px)", color: "#3d7dc8", marginBottom: "8px" }}>
            Kleding voor Professionals door Professionals
          </h1>
          <div style={{ width: "60px", height: "3px", background: "#3d7dc8", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "14px", color: "#555", maxWidth: "720px", margin: "0 auto", lineHeight: 1.7 }}>
            Atelier/Paskamer is uw digitale kledinghulp. Upload een foto van uzelf en de kledingstukken die u wilt passen. 
            Onze digitale kleermaker past de kleding op uw foto — geheel op maat, zonder paskamer.
          </p>
          <p style={{ fontSize: "14px", color: "#555", maxWidth: "720px", margin: "8px auto 0", lineHeight: 1.7 }}>
            Een uitstekende keuze is te maken uit onze collectie bedrijfskleding. Staat iets er niet direct bij? 
            Mail of bel ons dan gerust.
          </p>
        </section>

        {/* In de spotlight */}
        <section>
          <h2 style={{ fontWeight: 700, fontSize: "22px", color: "#3d7dc8", textAlign: "center", marginBottom: "24px" }}>
            In de paskamer
          </h2>

          {/* Upload card */}
          <div style={{
            background: "#fff",
            border: "1px solid #dce4ee",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}>
            {/* Blue top stripe */}
            <div style={{ height: "4px", background: "#3d7dc8" }} />

            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Clothing */}
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#3d7dc8", marginBottom: "12px" }}>
                    1. Selecteer kleding
                  </h3>
                  <FileUploadZone
                    title="Upload kleding"
                    description="Sleep afbeeldingen van shirts, blazers, broeken of rokken hierheen (JPG, PNG)."
                    accept="image/jpeg, image/png, image/webp"
                    multiple={true}
                    files={clothingFiles}
                    onChange={setClothingFiles}
                    className="min-h-[260px]"
                  />
                </div>

                {/* Portrait */}
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#3d7dc8", marginBottom: "12px" }}>
                    2. Uw portretfoto
                  </h3>
                  <FileUploadZone
                    title="Upload uw foto"
                    description="Een duidelijke, goed belichte portret- of staandefoto, recht naar voren."
                    accept="image/jpeg, image/png, image/webp"
                    multiple={false}
                    files={personPhotoFile}
                    onChange={setPersonPhotoFile}
                    className="min-h-[260px]"
                  />
                </div>
              </div>

              {/* Action */}
              <div className="mt-8 flex flex-col items-center gap-4" style={{ borderTop: "1px solid #e8e8e8", paddingTop: "24px" }}>
                <button
                  onClick={handleTryOn}
                  disabled={!isReadyToSubmit || isProcessing}
                  style={{
                    background: isReadyToSubmit && !isProcessing ? "#3d7dc8" : "#a0b8d8",
                    color: "#fff",
                    border: "none",
                    borderRadius: "3px",
                    padding: "12px 36px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: isReadyToSubmit && !isProcessing ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background 0.2s",
                    minWidth: "220px",
                    justifyContent: "center",
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Spinner size="sm" />
                      Paskamer wordt voorbereid...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Ga naar de paskamer
                    </>
                  )}
                </button>

                {!isReadyToSubmit && !isProcessing && !jobId && (
                  <p style={{ fontSize: "13px", color: "#888" }}>
                    Upload zowel kledingfoto('s) als een portretfoto om verder te gaan.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        {jobId && (
          <section>
            <h2 style={{ fontWeight: 700, fontSize: "22px", color: "#3d7dc8", textAlign: "center", marginBottom: "24px" }}>
              Het Resultaat
            </h2>

            <div style={{
              background: "#fff",
              border: "1px solid #dce4ee",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              overflow: "hidden",
              minHeight: "320px",
            }}>
              {isProcessing && (
                <div style={{ height: "4px" }}>
                  <Progress value={uploadProgress} className="h-full rounded-none" />
                </div>
              )}

              <div className="flex flex-col items-center justify-center p-10 text-center" style={{ minHeight: "300px" }}>

                {isProcessing && (
                  <div className="flex flex-col items-center gap-5">
                    <div style={{
                      width: "64px", height: "64px", borderRadius: "50%",
                      background: "#e8f0fb", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Spinner size="lg" />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: "18px", color: "#3d7dc8", marginBottom: "8px" }}>
                        Digitaal passen bezig…
                      </h3>
                      <p style={{ fontSize: "14px", color: "#666", maxWidth: "400px", lineHeight: 1.6 }}>
                        Even geduld terwijl wij de geselecteerde kleding op uw foto passen. Dit duurt gewoonlijk even.
                      </p>
                    </div>
                  </div>
                )}

                {jobStatus === "completed" && job?.resultImageUrl && (
                  <div className="w-full">
                    <div style={{ background: "#f5f8fc", padding: "24px", display: "flex", justifyContent: "center" }}>
                      <img
                        src={job.resultImageUrl}
                        alt="Uw virtueel paskamerresultaat"
                        style={{
                          maxWidth: "480px",
                          width: "100%",
                          borderRadius: "4px",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                          border: "1px solid #dce4ee",
                        }}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5"
                      style={{ borderTop: "1px solid #e8e8e8" }}>
                      <div className="flex items-center gap-2" style={{ color: "#3d7dc8", fontWeight: 600, fontSize: "14px" }}>
                        <CheckCircle2 size={18} />
                        Passen voltooid
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleReset}
                          style={{
                            background: "#fff",
                            border: "1px solid #3d7dc8",
                            color: "#3d7dc8",
                            borderRadius: "3px",
                            padding: "8px 20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <RefreshCcw size={14} />
                          Probeer een andere outfit
                        </button>
                        <button
                          style={{
                            background: "#3d7dc8",
                            border: "none",
                            color: "#fff",
                            borderRadius: "3px",
                            padding: "8px 20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Opslaan in garderobe
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(jobStatus === "failed" || isError) && (
                  <div className="flex flex-col items-center gap-5">
                    <div style={{
                      width: "64px", height: "64px", borderRadius: "50%",
                      background: "#fde8e8", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <AlertCircle size={28} style={{ color: "#c53030" }} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: "18px", color: "#c53030", marginBottom: "8px" }}>
                        Passen onderbroken
                      </h3>
                      <p style={{ fontSize: "14px", color: "#666", maxWidth: "400px", lineHeight: 1.6 }}>
                        {job?.error || "Er is een probleem opgetreden bij het verwerken van uw afbeeldingen. Dit kan soms gebeuren bij onduidelijke foto's."}
                      </p>
                    </div>
                    <button
                      onClick={() => setJobId(null)}
                      style={{
                        background: "#fff",
                        border: "1px solid #3d7dc8",
                        color: "#3d7dc8",
                        borderRadius: "3px",
                        padding: "8px 20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        marginTop: "8px",
                      }}
                    >
                      Terug naar uploads
                    </button>
                  </div>
                )}

              </div>
            </div>
          </section>
        )}

      </main>

      <footer style={{ background: "#3d7dc8", color: "#fff", textAlign: "center", padding: "16px", fontSize: "13px" }}>
        Vertrouwelijk &amp; eigendomsrecht voorbehouden. Uitsluitend voor intern gebruik door medewerkers.
      </footer>
    </div>
  );
}
