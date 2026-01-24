import { supabase } from "@/lib/supabase";

async function getSettings() {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "footer_copyright",
      "business_name",
      "business_representative",
      "business_registration_number",
      "business_address",
      "business_phone",
      "business_email",
      "business_hosting_provider",
    ]);

  const settings: Record<string, string> = {};
  data?.forEach((item) => {
    if (item.value) settings[item.key] = item.value;
  });
  return settings;
}

async function getSocialLinks() {
  const { data } = await supabase
    .from("social_links")
    .select("platform, url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return data || [];
}

export default async function Footer() {
  const [settings, socialLinks] = await Promise.all([
    getSettings(),
    getSocialLinks(),
  ]);

  const hasBusinessInfo =
    settings.business_name || settings.business_registration_number;

  return (
    <footer className="bg-black text-white pt-12 pb-6 border-t border-white/5">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-10">
          <div className="space-y-4 max-w-md">
            <div
              className="text-2xl md:text-4xl font-bold tracking-tighter leading-none text-primary"
              style={{ fontFamily: "var(--font-cal-sans)" }}
            >
              siso-sign
            </div>
            <p className="text-white/40 text-sm md:text-base leading-relaxed max-w-xs">
              Designing spaces that speak. Creating visual identities that last.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-4 items-center">
            {socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-sm font-medium text-white/60 hover:text-primary transition-colors"
              >
                <span className="capitalize">{link.platform}</span>
                <span className="block w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>

        {hasBusinessInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 border-t border-white/10 pt-8 mb-8">
            {(settings.business_address) && (
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-white/30 uppercase tracking-[0.2em]">Location</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {settings.business_address}
                </p>
              </div>
            )}

            {(settings.business_phone || settings.business_email) && (
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-white/30 uppercase tracking-[0.2em]">Contact</h3>
                <div className="space-y-2 text-sm text-white/70">
                  {settings.business_phone && (
                    <p className="hover:text-white transition-colors cursor-default">{settings.business_phone}</p>
                  )}
                  {settings.business_email && (
                    <p className="hover:text-white transition-colors cursor-default">{settings.business_email}</p>
                  )}
                </div>
              </div>
            )}

            {(settings.business_name || settings.business_representative) && (
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-white/30 uppercase tracking-[0.2em]">Company</h3>
                <div className="space-y-2 text-sm text-white/70">
                  {settings.business_name && <p>{settings.business_name}</p>}
                  {settings.business_representative && (
                    <p>
                      <span className="text-white/30 mr-2">CEO</span>
                      {settings.business_representative}
                    </p>
                  )}
                </div>
              </div>
            )}

            {settings.business_registration_number && (
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-white/30 uppercase tracking-[0.2em]">Legal</h3>
                <div className="space-y-2 text-sm text-white/70">
                  <p>
                    <span className="text-white/30 mr-2">REG</span>
                    {settings.business_registration_number}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
          <div className="text-xs text-white/30">
            {settings.footer_copyright || "© 2026 siso-sign. All rights reserved."}
          </div>
          <div className="text-xs text-white/20 font-mono tracking-wider">
            SISO-SIGN DESIGN AGENCY
          </div>
        </div>
      </div>
    </footer>
  );
}
