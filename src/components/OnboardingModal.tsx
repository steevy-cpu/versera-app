import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "versera_onboarding_done";

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            i === current ? "bg-[#10b981]" : "bg-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onClose();
  };

  const next = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      dismiss();
      navigate("/dashboard");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-[560px] mx-4 rounded-xl border border-white/[0.08] bg-[#111] p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <StepDots current={step} total={3} />

        {step === 0 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#10b981]">
              <span className="text-2xl font-bold text-white">V</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Welcome to Versera</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8 max-w-sm mx-auto">
              You have 1,000 free credits to start. Let's get you set up in 3 quick steps.
            </p>
            <Button onClick={next} className="bg-[#10b981] hover:bg-[#059669] text-white">
              Let's go →
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-3">Create your first prompt</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-sm mx-auto">
              A prompt is an instruction template for your AI. Give it a name and write your template — use {"{{variables}}"} for dynamic parts.
            </p>
            <div className="rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-4 mb-8 font-mono text-sm text-zinc-300 text-left">
              <span className="text-zinc-500">template: </span>
              <span className="text-[#6ee7b7]">"Summarize {"{{document}}"} in {"{{tone}}"} style."</span>
            </div>
            <Button onClick={next} className="bg-[#10b981] hover:bg-[#059669] text-white">
              Got it →
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-3">Get your API key</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-sm mx-auto">
              Your API key lets your app call Versera at runtime. Go to API Keys in the sidebar to generate one. It starts with <span className="font-mono text-zinc-300">vrs_live_</span>
            </p>
            <div className="rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-4 mb-8 font-mono text-sm text-zinc-400 text-center tracking-wider">
              vrs_live_••••••••••••••••••••
            </div>
            <Button onClick={next} className="bg-[#10b981] hover:bg-[#059669] text-white">
              Go to dashboard →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export { ONBOARDING_KEY };
