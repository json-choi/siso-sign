import handler from "vinext/server/fetch-handler";

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === "siso-sign.com") {
      url.protocol = "https:";
      url.hostname = "www.siso-sign.com";
      url.port = "";
      return Response.redirect(url.href, 307);
    }
    return handler.fetch(request, env, ctx);
  },
};
