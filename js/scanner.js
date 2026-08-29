// Camera barcode scanning.
//
// Uses the native BarcodeDetector API where available (Chrome/Android).
// On browsers without it (notably iOS Safari), falls back to the ZXing
// library loaded on demand from a CDN; if that also fails (offline),
// the dialog still offers manual number entry.

let zxingPromise = null;

function loadZXing() {
  if (!zxingPromise) {
    zxingPromise = import('https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/+esm');
  }
  return zxingPromise;
}

export function scanBarcode() {
  return new Promise((resolve, reject) => {
    const dlg = document.getElementById('dlg-scanner');
    const video = document.getElementById('scanner-video');
    const status = document.getElementById('scanner-status');
    const manual = document.getElementById('scanner-manual');
    let stream = null;
    let stopped = false;
    let zxingReader = null;

    const cleanup = () => {
      stopped = true;
      if (zxingReader) { try { zxingReader.reset(); } catch { /* already stopped */ } }
      if (stream) stream.getTracks().forEach(t => t.stop());
      video.srcObject = null;
      dlg.close();
    };
    const finish = (code) => { cleanup(); resolve(code); };

    document.getElementById('btn-scanner-cancel').onclick = () => finish(null);
    document.getElementById('btn-scanner-manual-ok').onclick = () => {
      const code = manual.value.replace(/\D/g, '');
      finish(code || null);
    };
    dlg.oncancel = () => { cleanup(); resolve(null); };

    manual.value = '';
    status.textContent = 'Starting camera…';
    dlg.showModal();

    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent = 'No camera available here — type the number below instead.';
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (s) => {
        if (stopped) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        video.srcObject = s;
        await video.play();
        status.textContent = 'Point the camera at the barcode…';

        if ('BarcodeDetector' in window) {
          const detector = new BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
          });
          const tick = async () => {
            if (stopped) return;
            try {
              const codes = await detector.detect(video);
              if (codes.length) { finish(codes[0].rawValue); return; }
            } catch { /* frame not ready yet */ }
            requestAnimationFrame(tick);
          };
          tick();
        } else {
          try {
            const ZXing = await loadZXing();
            if (stopped) return;
            zxingReader = new ZXing.BrowserMultiFormatReader();
            zxingReader.decodeFromStream(stream, video, (result) => {
              if (result && !stopped) finish(result.getText());
            });
          } catch {
            status.textContent = 'Barcode reading isn’t supported on this browser — type the number below instead.';
          }
        }
      })
      .catch(() => {
        status.textContent = 'Camera permission was refused — type the number below instead.';
      });
  });
}
