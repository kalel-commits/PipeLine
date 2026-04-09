import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-surface-container-high text-on-surface font-body selection:bg-primary-fixed-dim selection:text-on-primary-fixed">
      {/* TopNavBar Shell */}
      <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md bg-gradient-to-b from-white/10 to-transparent shadow-xl shadow-slate-200/50 dark:shadow-none h-16">
        <nav className="flex justify-between items-center h-full px-6 max-w-[1200px] mx-auto">
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 font-headline tracking-tight">
            PipelineAI
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <a className="text-sky-700 dark:text-sky-300 border-b-2 border-sky-600 pb-1 font-headline tracking-tight font-bold" href="#">Developer</a>
            <a className="text-slate-500 dark:text-slate-400 hover:text-slate-900 font-headline tracking-tight font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 px-2" href="#">Analyst</a>
            <a className="text-slate-500 dark:text-slate-400 hover:text-slate-900 font-headline tracking-tight font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 px-2" href="#">Admin</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-blue-700 transition-colors">
              Sign In
            </Link>
            <Link to="/login">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md active:scale-95 transition-all hover:bg-blue-700">
                Get Started
              </button>
            </Link>
          </div>
        </nav>
      </header>
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[870px] flex items-center px-6 overflow-hidden">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center px-3 py-1 bg-primary/10 rounded-full">
                <span className="text-primary text-xs font-bold uppercase tracking-widest font-headline">Predictive CI/CD</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black font-headline editorial-spacing leading-tight text-on-surface">
                Predict CI/CD Failures <br />Locally—<span className="text-primary">Before You Push.</span>
              </h1>
              <p className="text-lg lg:text-xl text-on-surface-variant max-w-xl leading-relaxed">
                Ship with surgical precision. Our local-first AI engine analyzes code changes in real-time to intercept breaking builds before they ever reach your staging server.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/login">
                  <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold shadow-lg active:scale-95 transition-all hover:bg-blue-700">
                    Start Local Analysis
                  </button>
                </Link>
                <Link to="/login">
                  <button className="bg-transparent text-on-surface hover:bg-surface-container-low px-8 py-4 rounded-lg font-bold transition-all">
                    View Documentation
                  </button>
                </Link>
              </div>
            </div>
            {/* Asymmetric Hero Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative z-10 bg-surface-container-lowest p-6 rounded-xl shadow-2xl shadow-inverse-surface/10 border-l-4 border-primary">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono font-bold text-outline uppercase tracking-tighter">Local Intelligence Scan</span>
                  <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded uppercase font-bold">High Risk: 84%</span>
                </div>
                <div className="space-y-4">
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[84%]"></div>
                  </div>
                  <div className="bg-surface-variant p-4 rounded-lg font-mono text-sm text-on-surface-variant overflow-hidden">
                    <code className="block opacity-60 line-through">git push origin main</code>
                    <code className="block text-primary font-bold"># PipelineAI: Intervention Required</code>
                    <code className="block">Failure Predicted in: <span className="text-error">deployment-worker.yaml</span></code>
                  </div>
                </div>
              </div>
              {/* Background Accent */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary-fixed opacity-30 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </section>
        {/* Features Bento Grid */}
        <section className="py-24 px-6 bg-surface-container-low">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-black font-headline editorial-spacing mb-4">Precision Instrumentation</h2>
              <p className="text-on-surface-variant max-w-2xl">The Architectural Forecaster layer provides deep visibility into your pipeline's future.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Real-time Risk Prediction */}
              <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <span className="material-symbols-outlined text-primary text-4xl mb-6">security</span>
                <h3 className="text-2xl font-bold font-headline mb-4">Real-time Risk Prediction</h3>
                <p className="text-on-surface-variant leading-relaxed">Continuous analysis of your local working directory identifies high-probability failure points across infrastructure, code quality, and security domains as you type.</p>
                <div className="mt-8 flex gap-2">
                  <span className="text-[10px] px-2 py-1 bg-on-surface-variant/10 text-on-surface-variant font-bold rounded uppercase">Terraform</span>
                  <span className="text-[10px] px-2 py-1 bg-on-surface-variant/10 text-on-surface-variant font-bold rounded uppercase">Go</span>
                  <span className="text-[10px] px-2 py-1 bg-on-surface-variant/10 text-on-surface-variant font-bold rounded uppercase">Python</span>
                </div>
              </div>
              {/* SHAP-based insights */}
              <div className="md:col-span-4 bg-surface-container-lowest p-8 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <span className="material-symbols-outlined text-secondary text-4xl mb-6">psychology</span>
                <h3 className="text-2xl font-bold font-headline mb-4">SHAP Insights</h3>
                <p className="text-on-surface-variant leading-relaxed">Don't just see a failure score. Understand why. SHAP values explain exactly which lines of code are driving the risk profile.</p>
              </div>
              {/* Active Learning */}
              <div className="md:col-span-4 bg-surface-container-lowest p-8 rounded-xl shadow-sm transition-transform hover:-translate-y-1">
                <span className="material-symbols-outlined text-tertiary text-4xl mb-6">timeline</span>
                <h3 className="text-2xl font-bold font-headline mb-4">Active Learning</h3>
                <p className="text-on-surface-variant leading-relaxed">PipelineAI grows with your repo. It learns from your actual historical CI results to refine its local predictions every day.</p>
              </div>
              {/* AI Mentor */}
              <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm transition-transform hover:-translate-y-1 border-t-4 border-primary-container">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="material-symbols-outlined text-primary-container text-4xl mb-6">school</span>
                    <h3 className="text-2xl font-bold font-headline mb-4">AI Mentor</h3>
                    <p className="text-on-surface-variant leading-relaxed">Receive automated architectural suggestions to remediate predicted failures. It's like having a Senior DevOps Engineer looking over your shoulder.</p>
                  </div>
                  <div className="hidden lg:block w-32 h-32 opacity-20">
                    <img alt="Abstract neural network representation" className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaFQ_6QW5oLDHESr2ZKN8fc90tL_c6N1_SWNDDuDzCj3x_i6EQZzDHMMnxU61RxSDBe9dY8uEVK5Av58owrsJH6zhKRXZAT9JH5QByVsizxpZzDMSEA254yCFoHTw1qp-wsF3pvFkjO4ZGSay_liXeYslUvY9RjVK5w6tPQf6sHpzm0PS-_XMBGi_Wkje9FCZJzN0ME4p_sChAlcVcg6CjjBMv06hzIgn6yUog6pNV31VZNvsKkqAdnT048aov68DzRnu0w3LveMOi" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Staggered Timeline Preview */}
        <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="flex flex-col gap-6">
                {/* Timeline Item 1 */}
                <div className="flex gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-primary-container"></div>
                    <div className="w-0.5 h-24 bg-secondary-fixed-dim"></div>
                  </div>
                  <div className="bg-surface-container-lowest p-6 rounded-lg w-full shadow-sm">
                    <p className="text-xs font-bold text-primary mb-2">09:12 AM — Code Edited</p>
                    <p className="text-sm font-semibold">Updated Kubernetes ingress manifest for staging.</p>
                  </div>
                </div>
                {/* Timeline Item 2 */}
                <div className="flex gap-6 items-start translate-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-error"></div>
                    <div className="w-0.5 h-24 bg-secondary-fixed-dim"></div>
                  </div>
                  <div className="bg-surface-container-lowest p-6 rounded-lg w-full shadow-sm">
                    <p className="text-xs font-bold text-error mb-2">09:13 AM — Risk Detected</p>
                    <p className="text-sm font-semibold">92% Failure Probability: Invalid secret reference detected locally.</p>
                  </div>
                </div>
                {/* Timeline Item 3 */}
                <div className="flex gap-6 items-start translate-x-8">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-primary"></div>
                  </div>
                  <div className="bg-surface-container-lowest p-6 rounded-lg w-full shadow-sm">
                    <p className="text-xs font-bold text-primary mb-2">09:14 AM — Remediated</p>
                    <p className="text-sm font-semibold">Mentor suggestion applied. Local build passed. Ready for push.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl lg:text-5xl font-black font-headline editorial-spacing mb-8 leading-tight">The Lifecycle of a <br /><span className="text-primary">Prevented Failure.</span></h2>
              <p className="text-lg text-on-surface-variant leading-relaxed">
                By integrating directly into your IDE, PipelineAI creates a closed-loop system of continuous verification. We don't just alert; we educate, helping your team build institutional knowledge of failure patterns.
              </p>
              <div className="mt-12 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-bold">Eliminate 90% of CI-related downtime</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-bold">Reduce "Cloud-Wait" developer fatigue</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="py-24 px-6">
          <div className="max-w-[1000px] mx-auto bg-inverse-surface text-surface rounded-2xl p-12 lg:p-20 relative overflow-hidden text-center">
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-black font-headline editorial-spacing mb-6">Ready to Ship with Confidence?</h2>
              <p className="text-lg text-surface-variant/80 max-w-2xl mx-auto mb-10">
                Join 2,000+ engineering teams using PipelineAI to secure their deployment cycles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/dashboard">
                  <button className="bg-primary hover:bg-primary-container text-white px-10 py-4 rounded-lg font-bold transition-all text-lg">
                    Get Started Free
                  </button>
                </Link>
                <Link to="/dashboard">
                  <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-10 py-4 rounded-lg font-bold transition-all text-lg">
                    Schedule Demo
                  </button>
                </Link>
              </div>
            </div>
            {/* Abstract Texture Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
          </div>
        </section>
      </main>
      <footer className="bg-surface-container-high py-16 px-6 border-t border-outline-variant/20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="text-2xl font-black text-slate-900 font-headline mb-6">PipelineAI</div>
            <p className="text-on-surface-variant max-w-sm">The architectural forecasting layer for modern CI/CD. Built for engineers, powered by intelligence.</p>
          </div>
          <div>
            <h4 className="font-bold font-headline mb-4 uppercase text-xs tracking-widest text-primary">Product</h4>
            <ul className="space-y-2 text-on-surface-variant text-sm">
              <li><a className="hover:text-primary" href="#">Risk Analytics</a></li>
              <li><a className="hover:text-primary" href="#">SHAP Insights</a></li>
              <li><a className="hover:text-primary" href="#">IDE Plugins</a></li>
              <li><a className="hover:text-primary" href="#">Enterprise</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold font-headline mb-4 uppercase text-xs tracking-widest text-primary">Resources</h4>
            <ul className="space-y-2 text-on-surface-variant text-sm">
              <li><a className="hover:text-primary" href="#">Documentation</a></li>
              <li><a className="hover:text-primary" href="#">API Reference</a></li>
              <li><a className="hover:text-primary" href="#">Community</a></li>
              <li><a className="hover:text-primary" href="#">Blog</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto mt-16 pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between gap-4 text-xs text-on-surface-variant">
          <p>© 2026 PipelineAI. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="hover:text-primary" href="#">Privacy Policy</a>
            <a className="hover:text-primary" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
