import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodeDisplay() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const { protocol, hostname, port } = window.location;
    const p = port ? `:${port}` : "";
    setUrl(`${protocol}//${hostname}${p}/`);
  }, []);

  if (!url) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white p-3 rounded-xl">
        <QRCodeSVG value={url} size={120} />
      </div>
      <p className="text-slate-500 text-xs font-mono">{url}</p>
    </div>
  );
}
