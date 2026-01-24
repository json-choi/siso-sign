import { Metadata } from 'next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Contact | siso-sign',
  description: '시소사인과 함께 프로젝트를 시작하세요. 연락처 및 문의 안내',
};

export const revalidate = 0;

async function getContactSettings() {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['business_name', 'business_address', 'business_phone', 'business_email']);

  const settings: Record<string, string> = {};
  data?.forEach((item) => {
    if (item.value) settings[item.key] = item.value;
  });
  return settings;
}

export default async function ContactPage() {
  const settings = await getContactSettings();
  const email = settings.business_email || 'siso-sign@naver.com';
  const phone = settings.business_phone;
  const address = settings.business_address;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black text-white selection:bg-primary selection:text-black">
        <div className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
          
          <div className="mb-20">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">Contact Us</h1>
            <p className="text-xl md:text-2xl text-gray-400 font-light">
              프로젝트에 대해 이야기해 주세요
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            
            <div className="space-y-6">
              <div className="p-6 border border-white/10 rounded-xl flex items-start gap-6 hover:border-primary/50 transition-colors duration-300">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Email</h3>
                  <p className="text-lg text-white">{email}</p>
                </div>
              </div>

              {phone && (
                <div className="p-6 border border-white/10 rounded-xl flex items-start gap-6 hover:border-primary/50 transition-colors duration-300">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Phone</h3>
                    <p className="text-lg text-white">{phone}</p>
                  </div>
                </div>
              )}

              {address && (
                <div className="p-6 border border-white/10 rounded-xl flex items-start gap-6 hover:border-primary/50 transition-colors duration-300">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Address</h3>
                    <p className="text-lg text-white whitespace-pre-wrap">{address}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                Let&apos;s work<br />together
              </h2>
              
              <div>
                <a 
                  href={`mailto:${email}`}
                  className="inline-block bg-primary text-black px-8 py-4 rounded-lg font-semibold hover:bg-white transition-colors duration-300"
                >
                  이메일 보내기
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
