import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ClipboardCopy, Disc3 } from '../lib/icons';
import { queryClient } from '../lib/query-client';
import { useOAuthFlow } from '../lib/use-oauth-flow';
import { useAuthStore } from '../stores/auth';

export function Login() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [copied, setCopied] = useState(false);

  const { startLogin, authUrl, isPolling } = useOAuthFlow(async (sessionId) => {
    setSession(sessionId);
    await fetchUser();
    queryClient.invalidateQueries();
  });

  const handleLogin = async () => {
    try {
      await startLogin();
    } catch (e) {
      console.error('Login failed:', e);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden bg-[var(--swlz-bg)]">
      <div className="relative flex flex-col items-center gap-8 max-w-sm w-full mx-4 rounded-[24px] border border-white/[0.09] bg-white/[0.035] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="relative">
          <div className="relative w-20 h-20 rounded-[22px] bg-white text-black border border-white flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.36)]">
            <Disc3 size={36} className="text-black" strokeWidth={1.5} />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black tracking-normal uppercase">SoundCloud Desktop</h1>
          <p className="text-[13px] text-white/45 mt-2 font-bold">
            {isPolling ? t('auth.signingIn') : 'Your music, your way'}
          </p>
        </div>

        {isPolling ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-white/[0.06] border-t-accent animate-spin" />
            <p className="text-[12px] text-white/25">{t('auth.signingIn')}</p>
            {authUrl && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(authUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-white/30 hover:text-white/50 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={12} />
                    {t('auth.copied')}
                  </>
                ) : (
                  <>
                    <ClipboardCopy size={12} />
                    {t('auth.copyLink')}
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            className="w-full py-3.5 rounded-[18px] bg-accent text-accent-contrast font-black text-sm hover:bg-accent-hover active:scale-[0.97] transition-all duration-200 ease-[var(--ease-apple)] cursor-pointer shadow-[0_18px_44px_rgba(0,0,0,0.34)]"
          >
            {t('auth.signIn')}
          </button>
        )}
      </div>
    </div>
  );
}
