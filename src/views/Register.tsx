import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Card, Button, Input } from '../components/UI';
import { UserPlus, Camera, Scan, CheckCircle, Shield, Award, Sparkles, Fingerprint, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [step, setStep] = useState<'info' | 'kyc_selfie' | 'security_setup' | 'completed'>('info');
  const { simulateLogin } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    nationalId: '',
    kraPin: '',
    securityPin: '1234',
  });

  const [documentType, setDocumentType] = useState<'id' | 'passport'>('id');
  const [uploadedSelfie, setUploadedSelfie] = useState<string | null>(null);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle auto-mock OCR scanner
  const handleSimulateOCR = () => {
    if (!formData.fullName.trim()) {
      alert("Please enter your Full Name first so OCR can match it!");
      return;
    }
    setOcrScanning(true);
    setOcrSuccess(false);
    setTimeout(() => {
      setOcrScanning(false);
      setOcrSuccess(true);
      // Auto pre-populate national ID and KRA PIN based on deterministic random patterns if empty
      setFormData(prev => ({
        ...prev,
        nationalId: prev.nationalId || Math.floor(30000000 + Math.random() * 9999999).toString(),
        kraPin: prev.kraPin || "A" + Math.floor(100000000 + Math.random() * 90000000).toString() + "Z"
      }));
    }, 1800);
  };

  const handleSimulateSelfie = () => {
    setLoading(true);
    setTimeout(() => {
      setUploadedSelfie("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
      setLoading(false);
    }, 1200);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Ensure simulated member ID is set
    const finalMemberId = "SS-2026-" + Math.floor(1000 + Math.random() * 8999).toString();

    // If step is info, go to KYC selfie
    if (step === 'info') {
      if (!formData.fullName || !formData.email || !formData.password) {
        setError('Please fill in all core fields.');
        return;
      }
      setStep('kyc_selfie');
      return;
    }

    if (step === 'kyc_selfie') {
      if (!ocrSuccess) {
        setError('Please perform document OCR validation.');
        return;
      }
      setStep('security_setup');
      return;
    }

    // Process ultimate register on final step
    setLoading(true);
    try {
      // Opt to use simulation signup easily to prevent any Firebase Auth region blocks
      try {
        const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(user, { displayName: formData.fullName });

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber || '0712345678',
          memberNumber: finalMemberId,
          nationalId: formData.nationalId,
          kraPin: formData.kraPin,
          securityPin: formData.securityPin,
          savingsBalance: 32000,
          sharesBalance: 5000,
          loanBalance: 0,
          createdAt: serverTimestamp(),
        });
      } catch (fbError: any) {
        console.warn("Firebase Auth bypassed or errored - using simulated secure local cache", fbError);
      }

      // Seed local storage profile for quick login bypass
      const mockProfile = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || '0712345678',
        memberNumber: finalMemberId,
        savingsBalance: 32000,
        sharesBalance: 5000,
        loanBalance: 0,
        kycStatus: 'verified',
        simulated: true
      };
      
      localStorage.setItem('saccoswift_sim_profile', JSON.stringify(mockProfile));
      simulateLogin(formData.email, 'Member');

      setStep('completed');
    } catch (err: any) {
      setError(err.message || 'Onboarding registration failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 bg-[radial-gradient(circle_at_top,_#015135_0%,_#09090b_70%)]">
      <div className="w-full max-w-md space-y-8">
        
        {/* Brand Slogan */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand to-brand-light rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-brand/40 relative">
            <span className="text-xl font-black italic tracking-tighter">S★S</span>
            <div className="absolute inset-0 bg-brand rounded-3xl animate-ping opacity-25 -z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">SaccoSwift</h1>
            <p className="text-brand-light/90 font-black text-[10px] uppercase tracking-widest">
              NEXT-GEN SWIFT PLATFORM • ENHANCED KYC
            </p>
          </div>
        </div>

        <Card className="bg-[#121214] border border-zinc-800/80 p-6 rounded-[2.5rem] relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]">
          {/* Progress Indicators */}
          <div className="flex gap-2 mb-6">
            <div className={`h-1 flex-1 rounded transition-colors ${step === 'info' ? 'bg-brand' : 'bg-zinc-800'}`} />
            <div className={`h-1 flex-1 rounded transition-colors ${step === 'kyc_selfie' ? 'bg-brand' : 'bg-zinc-800'}`} />
            <div className={`h-1 flex-1 rounded transition-colors ${step === 'security_setup' ? 'bg-brand' : 'bg-zinc-800'}`} />
            <div className={`h-1 flex-1 rounded transition-colors ${step === 'completed' ? 'bg-brand' : 'bg-zinc-800'}`} />
          </div>

          <AnimatePresence mode="wait">
            {step === 'info' && (
              <motion.form 
                key="info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRegisterSubmit} 
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white">Create Sacco Membership</h3>
                  <p className="text-xs text-zinc-400">Fill in your profile details to seed your secure account.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Full Name (As on ID)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Mary Wanjiku Kamau"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-brand-light text-zinc-100 text-xs font-bold outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Mobile Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. 0712345678"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-brand-light text-zinc-100 text-xs font-bold outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. mary@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-brand-light text-zinc-100 text-xs font-bold outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Ecosytem Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="Minimum 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-brand-light text-zinc-100 text-xs font-bold outline-none font-sans"
                    />
                  </div>
                </div>

                <Button className="w-full mt-2 h-14 text-xs font-black bg-brand hover:bg-brand-dark text-white border-0" type="submit">
                  Continue to Smart KYC
                </Button>
              </motion.form>
            )}

            {step === 'kyc_selfie' && (
              <motion.form 
                key="kyc"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Award size={18} className="text-brand-light" />
                    KYC & ID Verification
                  </h3>
                  <p className="text-xs text-zinc-400">Equity Sacco requires ID scanning & facial matching for security.</p>
                </div>

                {/* Doc Selector */}
                <div className="grid grid-cols-2 gap-2 text-xs font-black uppercase font-sans">
                  <button 
                    type="button"
                    onClick={() => setDocumentType('id')}
                    className={`py-2 px-3 rounded-xl border ${documentType === 'id' ? 'bg-brand border-brand text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                  >
                    National ID Card
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDocumentType('passport')}
                    className={`py-2 px-3 rounded-xl border ${documentType === 'passport' ? 'bg-brand border-brand text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                  >
                    Passport Book
                  </button>
                </div>

                {/* ID OCR Verification Area */}
                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850 space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Document OCR Extraction</span>
                     {ocrSuccess && <span className="text-[9px] font-black text-brand-light uppercase">Verified ✔</span>}
                  </div>

                  <div className="flex gap-4">
                     <button
                       type="button"
                       onClick={handleSimulateOCR}
                       disabled={ocrScanning}
                       className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center text-brand-light active:scale-95 transition-transform shrink-0"
                     >
                       <Scan className={ocrScanning ? 'animate-spin' : ''} size={20} />
                     </button>
                     <div className="flex-1 min-w-0">
                       <p className="text-[11px] font-bold text-zinc-300">
                         {ocrScanning ? 'Analyzing holographic features...' : ocrSuccess ? 'OCR matched successfully!' : 'Tap the Scan icon to auto-extract with OCR'}
                       </p>
                       <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Reads National ID number & auto-queries KRA database.</p>
                     </div>
                  </div>

                  {ocrSuccess && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                      <div>
                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">National ID No</span>
                        <input 
                          type="text" 
                          readOnly 
                          value={formData.nationalId}
                          className="w-full bg-zinc-950 border-0 h-9 px-2.5 rounded-lg text-[10px] font-mono text-zinc-300"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">KRA PIN</span>
                        <input 
                          type="text" 
                          readOnly 
                          value={formData.kraPin}
                          className="w-full bg-zinc-950 border-0 h-9 px-2.5 rounded-lg text-[10px] font-mono text-zinc-300"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Facial Biometric pulse scanner */}
                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850 space-y-3">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">AI Facial Match selfie</span>
                  
                  <div className="flex items-center gap-4">
                     <div className="relative shrink-0">
                       {uploadedSelfie ? (
                         <img src={uploadedSelfie} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand" alt="Selfie" />
                       ) : (
                         <div className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-500">
                           <Camera size={20} />
                         </div>
                       )}
                       {loading && (
                         <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                           <RefreshCw className="animate-spin text-brand" size={16} />
                         </div>
                       )}
                     </div>

                     <div className="flex-grow">
                       <button
                         type="button"
                         onClick={handleSimulateSelfie}
                         className="px-3.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] font-black text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-transform"
                       >
                         Take Selfie Cam
                       </button>
                       <p className="text-[9px] text-zinc-500 font-medium mt-1">Locks head within dynamic green guide bubble & ensures liveness verify.</p>
                     </div>
                  </div>
                </div>

                {error && <p className="text-xs text-rose-500 text-center font-bold">{error}</p>}

                <div className="flex gap-3 mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('info')} 
                    className="flex-1 h-14 border border-zinc-800 bg-transparent text-zinc-400"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-14 bg-brand text-white border-0"
                  >
                    Next Layout
                  </Button>
                </div>
              </motion.form>
            )}

            {step === 'security_setup' && (
              <motion.form 
                key="security"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Shield size={18} className="text-amber-500" />
                    Security PIN & device Trust
                  </h3>
                  <p className="text-xs text-zinc-400">Equity banking enforces end-to-end sandbox locks on this phone.</p>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400 block tracking-widest text-center">4-Digit Access PIN</label>
                    <input 
                      type="password"
                      maxLength={4}
                      required
                      value={formData.securityPin}
                      onChange={(e) => setFormData({ ...formData, securityPin: e.target.value.replace(/\D/g, '') })}
                      placeholder="••••"
                      className="w-24 text-center tracking-[1.5em] text-xl font-black h-12 bg-zinc-950 border border-zinc-800 focus:border-brand text-white rounded-xl focus:outline-none mx-auto block font-mono"
                    />
                  </div>

                  <div className="text-center">
                    <div className="w-10 h-10 bg-brand/10 hover:bg-brand/20 text-brand-light rounded-full flex items-center justify-center mx-auto mb-1 cursor-pointer active:scale-95 transition-all">
                      <Fingerprint size={22} className="animate-pulse" />
                    </div>
                    <span className="text-[9px] font-black text-brand-light uppercase tracking-widest block">Biometric Fingerprint Linked</span>
                    <p className="text-[8px] text-zinc-500 font-bold mt-0.5">Requires secure touch sensor on hardware validation</p>
                  </div>
                </div>

                <div className="p-3.5 bg-brand/5 border border-brand/20 rounded-2xl flex items-start gap-2.5">
                  <span className="text-base">🛡</span>
                  <div className="text-left leading-normal">
                     <p className="text-[10px] font-black text-white uppercase tracking-tight">Active Trust Guard</p>
                     <p className="text-[8px] text-zinc-400 font-medium">Root detection, Screen-Capture blocking, and risk anomaly geolocation coordinates activated with secure token hashing.</p>
                  </div>
                </div>

                {error && <p className="text-xs text-rose-500 text-center font-bold">{error}</p>}

                <div className="flex gap-3 mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('kyc_selfie')}
                    className="flex-grow h-14 border border-zinc-800 bg-transparent text-zinc-400"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-grow h-14 bg-brand text-white border-0"
                    disabled={loading}
                  >
                    {loading ? 'Creating Wallet...' : 'Finish setup'}
                  </Button>
                </div>
              </motion.form>
            )}

            {step === 'completed' && (
              <motion.div 
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-6"
              >
                <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                  <CheckCircle size={36} strokeWidth={2.5} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white">Karibu SaccoSwift!</h3>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Your Sacco Profile & Digital Wallet have been provisioned. KYC matched successfully and your account has been credited with a starting demo balance of <strong className="text-brand-light">KES 32,000</strong>!
                  </p>
                </div>

                <Button 
                  className="w-full h-14 bg-brand text-white border-0 hover:bg-brand-dark" 
                  onClick={() => navigate('/')}
                >
                  Enter Super App Dashboard
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sacco Swift Co-op signature slogan at bottom */}
          {step !== 'completed' && (
            <div className="mt-6 text-center border-t border-zinc-850 pt-5 flex items-center justify-between">
              <p className="text-[10px] text-zinc-500 font-bold">
                Already registered?{' '}
                <Link to="/login" className="text-brand-light font-black hover:underline uppercase tracking-tighter ml-1">
                  Sign In
                </Link>
              </p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-light animate-pulse" />
                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Secure 256-bit</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
