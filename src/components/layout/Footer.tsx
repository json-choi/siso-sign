export default function Footer() {
  return (
    <footer className="bg-black py-12 border-t border-white/10">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-3xl md:text-4xl font-bold tracking-tighter leading-none" style={{ fontFamily: 'var(--font-cal-sans)' }}>
          siso-sign
        </div>
        <div className="text-sm text-gray-400">
          © {new Date().getFullYear()} siso-sign. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}
