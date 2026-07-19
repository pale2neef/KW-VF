import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUploadZone } from "@/components/ui/file-upload-zone";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { useGetTryOn, getGetTryOnQueryKey } from "@workspace/api-client-react";
import { AlertCircle, CheckCircle2, Sparkles, RefreshCcw } from "lucide-react";
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
      
      // Simulate slight delay for progress bar
      setUploadProgress(15);
      
      const res = await fetch(`${BASE}/api/try-on`, { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) {
        throw new Error("Failed to start try-on process");
      }
      
      const newJob = await res.json();
      setJobId(newJob.id);
      setUploadProgress(40);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Submission Failed",
        description: "We couldn't start your fitting room session. Please try again.",
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
    <div className="min-h-[100dvh] w-full bg-background flex flex-col font-sans">
      {/* Header / Nav area */}
      <header className="w-full border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded-sm">
              <span className="font-serif italic font-bold text-lg">A</span>
            </div>
            <span className="font-serif text-lg font-medium tracking-wide">Atelier</span>
          </div>
          <div className="text-sm font-medium text-muted-foreground hidden sm:block">
            Corporate Wardrobe Fitting Room
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 md:py-16 flex flex-col gap-16">
        
        {/* Hero Section */}
        <section className="max-w-2xl text-center mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-foreground">
            Visualize your corporate look.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Upload a photo of yourself and the garments you wish to try. 
            Our digital tailoring service will prepare a preview of your selected attire.
          </p>
        </section>

        {/* Upload Section */}
        <section className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          <Card className="border-none shadow-xl bg-card overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-secondary via-primary to-secondary opacity-20" />
            <CardContent className="p-8 md:p-10">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Left: Clothing */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-medium">1. Select Attire</h2>
                  </div>
                  <FileUploadZone
                    title="Upload Garments"
                    description="Drop images of shirts, blazers, trousers or skirts (JPG, PNG)."
                    accept="image/jpeg, image/png, image/webp"
                    multiple={true}
                    files={clothingFiles}
                    onChange={setClothingFiles}
                    className="min-h-[280px]"
                  />
                </div>

                {/* Right: Person */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-medium">2. Your Portrait</h2>
                  </div>
                  <FileUploadZone
                    title="Upload Your Photo"
                    description="A clear, well-lit portrait or full-body photo facing forward."
                    accept="image/jpeg, image/png, image/webp"
                    multiple={false}
                    files={personPhotoFile}
                    onChange={setPersonPhotoFile}
                    className="min-h-[280px]"
                  />
                </div>
              </div>

              {/* Action Area */}
              <div className="mt-12 flex flex-col items-center justify-center space-y-6 pt-8 border-t border-border/50">
                <Button 
                  size="lg" 
                  onClick={handleTryOn} 
                  disabled={!isReadyToSubmit || isProcessing}
                  className="w-full sm:w-auto min-w-[240px] font-serif tracking-wide text-lg shadow-md transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" className="text-primary-foreground/70" />
                      Preparing Fitting Room...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Enter Fitting Room
                    </span>
                  )}
                </Button>
                
                {(!isReadyToSubmit && !isProcessing && !jobId) && (
                  <p className="text-sm text-muted-foreground text-center">
                    Please provide both garment and portrait photos to proceed.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Results Section */}
        {jobId && (
          <section className="w-full pb-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both">
            <div className="flex items-center justify-center mb-8">
              <div className="h-px bg-border flex-1 max-w-[100px]"></div>
              <span className="mx-4 font-serif italic text-muted-foreground">The Result</span>
              <div className="h-px bg-border flex-1 max-w-[100px]"></div>
            </div>

            <Card className="border-none shadow-2xl bg-card overflow-hidden relative">
              {isProcessing && (
                <div className="absolute top-0 left-0 w-full h-1 z-20">
                  <Progress value={uploadProgress} className="h-full rounded-none" />
                </div>
              )}
              
              <CardContent className="p-0 min-h-[400px] flex flex-col items-center justify-center text-center">
                
                {isProcessing && (
                  <div className="p-12 flex flex-col items-center space-y-6 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                      <Spinner size="lg" className="text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-serif text-2xl font-medium">Digital Tailoring in Progress</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Please hold while we perfectly fit your selected garments to your portrait. This usually takes a moment.
                      </p>
                    </div>
                  </div>
                )}

                {jobStatus === "completed" && job?.resultImageUrl && (
                  <div className="w-full animate-in fade-in duration-1000">
                    <div className="bg-secondary/20 p-8 flex items-center justify-center">
                      <div className="relative max-w-2xl w-full mx-auto rounded-xl overflow-hidden shadow-xl ring-1 ring-border">
                        <img 
                          src={job.resultImageUrl} 
                          alt="Your virtual fitting result" 
                          className="w-full h-auto object-contain bg-background"
                        />
                      </div>
                    </div>
                    <div className="p-8 bg-card flex flex-col sm:flex-row items-center justify-between gap-4 border-t">
                      <div className="flex items-center gap-3 text-primary">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Fitting complete</span>
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="outline" onClick={handleReset} className="flex-1 sm:flex-none">
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Try Another Look
                        </Button>
                        <Button className="flex-1 sm:flex-none">
                          Save to Wardrobe
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {(jobStatus === "failed" || isError) && (
                  <div className="p-12 flex flex-col items-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-serif text-2xl font-medium text-destructive">Fitting Interrupted</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        {job?.error || "We encountered an issue while processing your images. This sometimes happens with unclear photos."}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setJobId(null)} className="mt-4">
                      Return to Uploads
                    </Button>
                  </div>
                )}

              </CardContent>
            </Card>
          </section>
        )}

      </main>
      
      <footer className="w-full border-t py-8 mt-auto bg-card text-center">
        <p className="text-sm text-muted-foreground font-medium">
          Confidential & Proprietary. For internal employee use only.
        </p>
      </footer>
    </div>
  );
}
