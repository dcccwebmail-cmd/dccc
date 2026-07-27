import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Server, Globe, Key, ShieldCheck, Terminal } from 'lucide-react';

export interface DiagnosticResult {
  clientUrlEndpoint: { status: 'ok' | 'missing' | 'warning'; value: string };
  clientPublicKey: { status: 'ok' | 'missing' | 'warning'; value: string };
  serverConfig: { status: 'ok' | 'error' | 'pending'; message: string; data?: any };
  serverAuth: { status: 'ok' | 'error' | 'pending'; message: string; data?: any };
  serverApiReachability: { status: 'ok' | 'error' | 'pending'; message: string; count?: number };
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export const ImageKitDiagnostic: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<DiagnosticResult | null>(null);

  const addLog = (type: LogEntry['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, type, message }]);
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setLogs([]);
    
    addLog('info', 'Starting ImageKit Environment & Connectivity Diagnostics...');

    // 1. Client-side Env check
    const rawUrl = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';
    const rawPublic = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '';

    const mask = (str: string) => {
      if (!str) return 'Not Set';
      if (str.length <= 8) return '****';
      return str.substring(0, 8) + '...' + str.substring(str.length - 4);
    };

    const clientUrlStatus = rawUrl ? 'ok' : 'missing';
    const clientPublicStatus = rawPublic ? 'ok' : 'missing';

    addLog(
      clientUrlStatus === 'ok' ? 'success' : 'error',
      `Client VITE_IMAGEKIT_URL_ENDPOINT: ${clientUrlStatus === 'ok' ? rawUrl : 'MISSING'}`
    );
    addLog(
      clientPublicStatus === 'ok' ? 'success' : 'error',
      `Client VITE_IMAGEKIT_PUBLIC_KEY: ${clientPublicStatus === 'ok' ? mask(rawPublic) : 'MISSING'}`
    );

    const newResults: DiagnosticResult = {
      clientUrlEndpoint: { status: clientUrlStatus, value: rawUrl || 'Not configured in frontend env' },
      clientPublicKey: { status: clientPublicStatus, value: mask(rawPublic) },
      serverConfig: { status: 'pending', message: 'Testing /api/imagekit/config...' },
      serverAuth: { status: 'pending', message: 'Testing /api/imagekit/auth...' },
      serverApiReachability: { status: 'pending', message: 'Testing /api/imagekit/files...' },
    };

    setResults({ ...newResults });

    // 2. Server Config Check
    try {
      addLog('info', 'Querying /api/imagekit/config endpoint...');
      const cfgRes = await fetch('/api/imagekit/config');
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData.urlEndpoint && cfgData.publicKey) {
          newResults.serverConfig = {
            status: 'ok',
            message: 'Server has URL Endpoint and Public Key loaded',
            data: cfgData,
          };
          addLog('success', `Server Config OK - Endpoint: ${cfgData.urlEndpoint}`);
        } else {
          newResults.serverConfig = {
            status: 'error',
            message: 'Server missing endpoint or public key in process.env',
            data: cfgData,
          };
          addLog('error', 'Server Config Missing process.env variables!');
        }
      } else {
        newResults.serverConfig = {
          status: 'error',
          message: `HTTP ${cfgRes.status}: ${cfgRes.statusText}`,
        };
        addLog('error', `Server Config endpoint returned HTTP ${cfgRes.status}`);
      }
    } catch (err: any) {
      newResults.serverConfig = { status: 'error', message: err.message || 'Failed to fetch server config' };
      addLog('error', `Server Config Fetch Failed: ${err.message}`);
    }

    setResults({ ...newResults });

    // 3. Server Auth Check (Verifies IMAGEKIT_PRIVATE_KEY)
    try {
      addLog('info', 'Testing /api/imagekit/auth (validating IMAGEKIT_PRIVATE_KEY)...');
      const authRes = await fetch('/api/imagekit/auth');
      const authText = await authRes.text();
      let authData: any = {};
      try {
        authData = JSON.parse(authText);
      } catch {}

      if (authRes.ok && authData.signature && authData.token) {
        newResults.serverAuth = {
          status: 'ok',
          message: 'Server successfully signed auth parameters using IMAGEKIT_PRIVATE_KEY',
          data: { token: authData.token?.substring(0, 10) + '...', expire: authData.expire },
        };
        addLog('success', 'Server Auth OK - Private Key valid and active.');
      } else {
        const errDetail = authData.error || authData.message || authText || `HTTP ${authRes.status}`;
        newResults.serverAuth = {
          status: 'error',
          message: `Auth failed: ${errDetail}`,
        };
        addLog('error', `Server Auth Failed: ${errDetail}`);
      }
    } catch (err: any) {
      newResults.serverAuth = { status: 'error', message: err.message || 'Auth test request failed' };
      addLog('error', `Server Auth Fetch Exception: ${err.message}`);
    }

    setResults({ ...newResults });

    // 4. Server API Reachability Check (Lists Files from ImageKit servers)
    try {
      addLog('info', 'Testing /api/imagekit/files (connecting to ImageKit API servers)...');
      const filesRes = await fetch('/api/imagekit/files');
      const filesText = await filesRes.text();
      let filesData: any = [];
      try {
        filesData = JSON.parse(filesText);
      } catch {}

      if (filesRes.ok && Array.isArray(filesData)) {
        newResults.serverApiReachability = {
          status: 'ok',
          message: `Connected successfully. Retrieved ${filesData.length} media files from ImageKit server.`,
          count: filesData.length,
        };
        addLog('success', `ImageKit API Connected! Found ${filesData.length} files.`);
      } else {
        const fileErr = filesData.error || filesData.message || filesText || `HTTP ${filesRes.status}`;
        newResults.serverApiReachability = {
          status: 'error',
          message: `Failed to fetch files: ${fileErr}`,
        };
        addLog('error', `ImageKit API Reachability Failed: ${fileErr}`);
      }
    } catch (err: any) {
      newResults.serverApiReachability = {
        status: 'error',
        message: err.message || 'Network exception connecting to /api/imagekit/files',
      };
      addLog('error', `Files Fetch Exception: ${err.message}`);
    }

    setResults({ ...newResults });
    setTesting(false);
    addLog('info', 'Diagnostics complete.');
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6 text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ImageKit Status & Diagnostics
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Check frontend variables, backend authentication, and live ImageKit API connectivity.
          </p>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Running Tests...' : 'Re-run Diagnostics'}
        </button>
      </div>

      {/* Grid of 4 Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* 1. Frontend URL Endpoint */}
        <div className="p-3.5 rounded-lg border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex items-start gap-3">
          {results?.clientUrlEndpoint.status === 'ok' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              Client URL Endpoint (VITE_IMAGEKIT_URL_ENDPOINT)
            </div>
            <div className="text-xs text-gray-900 dark:text-gray-100 font-mono mt-1 truncate">
              {results?.clientUrlEndpoint.value || 'Checking...'}
            </div>
          </div>
        </div>

        {/* 2. Frontend Public Key */}
        <div className="p-3.5 rounded-lg border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex items-start gap-3">
          {results?.clientPublicKey.status === 'ok' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-gray-400" />
              Client Public Key (VITE_IMAGEKIT_PUBLIC_KEY)
            </div>
            <div className="text-xs text-gray-900 dark:text-gray-100 font-mono mt-1 truncate">
              {results?.clientPublicKey.value || 'Checking...'}
            </div>
          </div>
        </div>

        {/* 3. Server Private Key & Auth */}
        <div className="p-3.5 rounded-lg border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex items-start gap-3">
          {results?.serverAuth.status === 'ok' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : results?.serverAuth.status === 'pending' ? (
            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              Server Private Key (IMAGEKIT_PRIVATE_KEY)
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {results?.serverAuth.message || 'Checking server auth generation...'}
            </div>
          </div>
        </div>

        {/* 4. Live API Reachability */}
        <div className="p-3.5 rounded-lg border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex items-start gap-3">
          {results?.serverApiReachability.status === 'ok' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : results?.serverApiReachability.status === 'pending' ? (
            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-gray-400" />
              Live ImageKit Cloud Connection
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {results?.serverApiReachability.message || 'Connecting to ImageKit servers...'}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="bg-gray-900 text-gray-200 rounded-lg p-3 font-mono text-xs overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-gray-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> Diagnostic Console Log
          </span>
          <span>{logs.length} events</span>
        </div>
        <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2 leading-relaxed">
              <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
              <span
                className={
                  log.type === 'success'
                    ? 'text-emerald-400'
                    : log.type === 'error'
                    ? 'text-rose-400'
                    : log.type === 'warning'
                    ? 'text-amber-400'
                    : 'text-indigo-300'
                }
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Vercel Environment Variables Guide */}
      <div className="mt-5 p-4 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
        <h4 className="font-semibold text-indigo-950 dark:text-indigo-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Vercel Environment Variables Reference List
        </h4>
        <p className="text-xs text-indigo-900 dark:text-indigo-300 mb-3">
          To fix empty folders and image loading on your live server / Vercel deployment, verify these 3 keys are defined in your <strong>Vercel Project Settings &rarr; Environment Variables</strong>:
        </p>

        <div className="bg-white dark:bg-gray-900 rounded border border-indigo-200 dark:border-indigo-800/60 p-3 space-y-2.5 text-xs font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 dark:border-gray-800 pb-2">
            <div>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">VITE_IMAGEKIT_URL_ENDPOINT</span>
              <span className="block text-[11px] text-gray-500 font-sans">URL Endpoint from ImageKit Developer Options</span>
            </div>
            <code className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded text-[11px]">
              https://ik.imagekit.io/your_id
            </code>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 dark:border-gray-800 pb-2">
            <div>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">VITE_IMAGEKIT_PUBLIC_KEY</span>
              <span className="block text-[11px] text-gray-500 font-sans">Public key from ImageKit API keys</span>
            </div>
            <code className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded text-[11px]">
              public_xxxxxxxx...
            </code>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">IMAGEKIT_PRIVATE_KEY</span>
              <span className="block text-[11px] text-gray-500 font-sans">Private key from ImageKit API keys (Server secret)</span>
            </div>
            <code className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded text-[11px]">
              private_xxxxxxx...
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageKitDiagnostic;
