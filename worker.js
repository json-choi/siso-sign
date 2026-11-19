import handler from "vinext/server/fetch-handler";
import { trackPageView } from "./src/lib/analytics-worker";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === "siso-sign.com") {
      url.protocol = "https:";
      url.hostname = "www.siso-sign.com";
      url.port = "";
      return Response.redirect(url.href, 308);
    }
    // run_worker_first requires forwarding bundled assets to the asset binding.
    if (url.pathname.startsWith("/_next/static/")) {
      return env.ASSETS.fetch(request);
    }
    const response = await handler.fetch(request, env, ctx);
    // Visit analytics run after the response is sent and never fail it.
    ctx.waitUntil(trackPageView(request, response, env).catch((error) => console.error("analytics", error)));
    return response;
  },
};
