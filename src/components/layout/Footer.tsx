export default function Footer() {
  return (
    <footer className="bg-black py-12 border-t border-white/10">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-2xl font-bold tracking-tighter" style={{ fontFamily: 'var(--font-cal-sans)' }}>
          <span className="whitespace-nowrap">siso-sign&nbsp;은 공간의 가치를 높이는 시각적 정체성을 만드는 비주얼 솔루션 파트너입니다.</span>
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
