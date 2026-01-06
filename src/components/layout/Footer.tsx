export default function Footer() {
  return (
    <footer className="bg-black py-12 border-t border-white/10">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-3xl md:text-4xl font-bold tracking-tighter leading-none text-primary" style={{ fontFamily: 'var(--font-cal-sans)', letterSpacing: '0.03em' }}>
          siso-sign
        </div>
        <div className="text-sm text-gray-400">
          © {new Date().getFullYear()} <span className="text-primary">siso-sign</span>. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="https://www.instagram.com/siso.sign/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
          <a href="http://pf.kakao.com/_NkzFG" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Kakao</a>
        </div>
      </div>
    </footer>
  );
}
