const SCRIPT_ID = "comuniapp-google-maps";
const CALLBACK_NAME = "__comuniAppGoogleMapsReady";

let loaderPromise;

export function loadGoogleMaps(apiKey) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("O Google Maps só pode ser carregado no navegador."));
  }

  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (!apiKey) return Promise.reject(new Error("A chave pública do Google Maps não foi configurada."));
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const finish = () => {
      window.clearTimeout(timeoutId);
      delete window[CALLBACK_NAME];
      if (window.google?.maps?.importLibrary) resolve(window.google.maps);
      else fail(new Error("O Google Maps não disponibilizou as bibliotecas esperadas."));
    };

    const fail = (cause) => {
      window.clearTimeout(timeoutId);
      delete window[CALLBACK_NAME];
      document.getElementById(SCRIPT_ID)?.remove();
      loaderPromise = undefined;
      reject(cause instanceof Error ? cause : new Error("Não foi possível carregar o Google Maps."));
    };

    const timeoutId = window.setTimeout(fail, 15000);
    window[CALLBACK_NAME] = finish;

    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("error", fail, { once: true });
      return;
    }

    const parameters = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      loading: "async",
      language: "pt-BR",
      region: "BR",
      auth_referrer_policy: "origin",
      callback: CALLBACK_NAME,
    });
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.src = `https://maps.googleapis.com/maps/api/js?${parameters.toString()}`;
    script.addEventListener("error", fail, { once: true });
    document.head.appendChild(script);
  });

  return loaderPromise;
}
