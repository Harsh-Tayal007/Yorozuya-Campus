import { useEffect, useState } from "react";

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Detect standalone mode
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches;

    if (isStandalone) {
      setIsInstallable(false);
    }
  }, []);

  // Listen for install events
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
      console.log("PWA install event captured");
    };

    const handleAppInstalled = () => {
      console.log("PWA was installed");
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;
    console.log("User choice:", outcome);

    if (outcome === "accepted") {
      setIsInstallable(false);
      setInstallPrompt(null);
    }
  };

  return { isInstallable, install };
}
