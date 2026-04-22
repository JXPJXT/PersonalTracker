import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#7c3aed] rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#2563eb] rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#2563eb] mb-6 shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">StudyTrack</h1>
          <p className="text-gray-400">Your Ultimate Second Brain</p>
        </div>

        <div className="flex justify-center">
          <SignIn appearance={{
            elements: {
              formButtonPrimary: 'bg-[#7c3aed] hover:bg-[#6d28d9] text-sm normal-case',
              card: 'bg-[#1a1a1a] border border-[#2a2a2a] shadow-2xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'border-[#333] hover:bg-[#222] text-white',
              socialButtonsBlockButtonText: 'text-white',
              dividerLine: 'bg-[#333]',
              dividerText: 'text-gray-500',
              formFieldLabel: 'text-gray-300',
              formFieldInput: 'bg-[#222] border-[#333] text-white focus:border-[#7c3aed]',
              footerActionText: 'text-gray-400',
              footerActionLink: 'text-[#7c3aed] hover:text-[#6d28d9]'
            }
          }} />
        </div>
      </div>
    </div>
  );
}
